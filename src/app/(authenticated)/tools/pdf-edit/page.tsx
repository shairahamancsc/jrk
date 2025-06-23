
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { FilePenLine, UploadCloud, Wand2, FileText, Loader2, FileDown, Sparkles } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { modifyPdf } from '@/ai/flows/pdf-edit-flow';

// Structure to hold text content with its coordinates
interface PdfTextItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function PdfEditPage() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [editedPdfUrl, setEditedPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] || null);
    setEditedPdfUrl(null); // Reset on new file
  };

  const handleEdit = async () => {
    if (!file || !prompt) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please upload a PDF and describe the edits you want to make.',
      });
      return;
    }

    setIsProcessing(true);
    setEditedPdfUrl(null);

    try {
      // 1. Load PDF and extract text with coordinates
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdf = await loadingTask.promise;
      
      let fullText = '';
      const allTextItems: PdfTextItem[] = [];
      const pdfPage = await pdf.getPage(1); // For now, we only process the first page
      const viewport = pdfPage.getViewport({ scale: 1.0 });
      const textContent = await pdfPage.getTextContent();
      
      textContent.items.forEach(item => {
        if ('str' in item) {
          fullText += item.str + ' ';
          const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
          allTextItems.push({
            text: item.str,
            x: tx[4],
            y: tx[5],
            width: item.width,
            height: item.height,
          });
        }
      });
      
      toast({ title: 'Processing...', description: 'AI is analyzing your document and request.' });

      // 2. Call Genkit flow to get the modification plan
      const response = await modifyPdf({
        pdfTextContent: fullText,
        userPrompt: prompt,
      });

      // 3. Use pdf-lib to apply the modifications
      const pdfDoc = await PDFDocument.load(await file.arrayBuffer());
      const pageToModify = pdfDoc.getPage(0); // pdf-lib is 0-indexed
      const { height: pageHeight } = pageToModify.getSize();
      
      switch (response.action) {
        case 'ADD_PAGE':
          const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
          const newPage = pdfDoc.addPage();
          const { width, height } = newPage.getSize();
          
          newPage.drawText(response.generatedText || '', {
            x: 50,
            y: height - 50,
            font: helveticaFont,
            size: 12,
            color: rgb(0, 0, 0),
            maxWidth: width - 100,
            lineHeight: 18,
          });
          toast({ title: 'Success!', description: 'A new page has been added as requested.' });
          break;

        case 'REDACT_CONTENT':
          if (response.redactions && response.redactions.length > 0) {
            response.redactions.forEach(textToRedact => {
              const itemsToRedact = allTextItems.filter(item => textToRedact.includes(item.text));
              itemsToRedact.forEach(item => {
                pageToModify.drawRectangle({
                  x: item.x,
                  y: pageHeight - item.y - item.height, // pdf-lib y-coord is from bottom
                  width: item.width,
                  height: item.height,
                  color: rgb(1, 1, 1), // White
                });
              });
            });
             toast({ title: 'Success!', description: 'Content has been redacted as requested.' });
          } else {
             toast({ title: 'No action taken', description: 'The AI did not find any content to redact based on your prompt.' });
          }
          break;
        
        default:
          toast({ variant: 'destructive', title: 'Unknown Action', description: 'The AI returned an unknown action.' });
          break;
      }

      // 4. Save the modified PDF and create a download URL
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setEditedPdfUrl(url);

    } catch (error) {
      console.error('AI PDF Edit Error:', error);
      toast({
        variant: 'destructive',
        title: 'Editing Failed',
        description: 'An error occurred while editing the PDF. Please try again.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
          <FilePenLine size={32} /> AI PDF Editor
        </h1>
        <p className="text-muted-foreground">
          Use natural language to add new pages or redact content from your PDF.
        </p>
      </header>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5"/>1. Upload PDF</CardTitle>
          <CardDescription>Select the PDF file you wish to edit (AI currently processes the first page for redaction).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center bg-background/50">
            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground truncate">{file ? file.name : "Drag & drop file here or click to browse"}</p>
            <Input
              id="file-upload"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="sr-only"
            />
             <Button asChild variant="outline" className="mt-4">
                <label htmlFor="file-upload">Browse File</label>
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Wand2 className="h-5 w-5"/>2. Describe Your Desired Edits</CardTitle>
          <CardDescription>
            Tell the AI what to do. For example: "Redact my address" or "Add a summary page."
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="e.g., Redact the enrollment number and the download date..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            disabled={!file || isProcessing}
          />
           <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1"><Sparkles className="h-4 w-4 text-accent" />Or try one of these suggestions:</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setPrompt('Redact the name and address from this document.')} disabled={!file || isProcessing}>
                Redact personal info
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPrompt('Add a new final page that summarizes this document in three paragraphs.')} disabled={!file || isProcessing}>
                Summarize on new page
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPrompt('Create a title page for this document. Include a suitable title and a brief, one-sentence subtitle.')} disabled={!file || isProcessing}>
                Create title page
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Button onClick={handleEdit} disabled={!file || !prompt || isProcessing} size="lg">
          {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isProcessing ? "Processing..." : "Apply AI Edits"}
        </Button>
        {editedPdfUrl && (
          <Button asChild variant="secondary" size="lg">
            <a href={editedPdfUrl} download={`edited-${file?.name || 'document'}.pdf`}>
              <FileDown className="mr-2 h-4 w-4" />
              Download Edited PDF
            </a>
          </Button>
        )}
      </div>

    </div>
  );
}
