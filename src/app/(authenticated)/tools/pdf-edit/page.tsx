
"use client";

import type { Metadata } from 'next';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { FilePenLine, UploadCloud, Wand2, FileText, Loader2, FileDown, Sparkles } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { generatePdfPage } from '@/ai/flows/pdf-edit-flow';

export const metadata: Metadata = {
  title: 'AI PDF Editor',
};

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
        description: 'Please upload a PDF and describe the page you want to add.',
      });
      return;
    }

    setIsProcessing(true);
    setEditedPdfUrl(null);

    try {
      // 1. Extract text from PDF for context
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdf = await loadingTask.promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
        fullText += pageText + '\n\n';
      }
      
      toast({ title: 'Processing...', description: 'AI is generating the new page content.' });

      // 2. Call Genkit flow to get new page content
      const response = await generatePdfPage({
        pdfTextContent: fullText,
        userPrompt: prompt,
      });
      const { generatedText } = response;
      
      // 3. Use pdf-lib to add the new page
      const pdfDoc = await PDFDocument.load(await file.arrayBuffer());
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const newPage = pdfDoc.addPage();
      const { width, height } = newPage.getSize();
      
      newPage.drawText(generatedText, {
        x: 50,
        y: height - 50,
        font: helveticaFont,
        size: 12,
        color: rgb(0, 0, 0),
        maxWidth: width - 100,
        lineHeight: 18,
      });

      // 4. Save the modified PDF and create a download URL
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setEditedPdfUrl(url);

      toast({
        title: 'Success!',
        description: 'Your edited PDF is ready for download.',
      });

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
          Use natural language to add new pages to your PDF. The AI will generate the content.
        </p>
      </header>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5"/>1. Upload PDF</CardTitle>
          <CardDescription>Select the PDF file you wish to edit.</CardDescription>
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
          <CardTitle className="flex items-center gap-2"><Wand2 className="h-5 w-5"/>2. Describe The Page to Add</CardTitle>
          <CardDescription>
            Tell the AI what content to generate for the new page. For example: "Add a new final page summarizing this document."
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="e.g., Add a new page with a three-paragraph conclusion..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            disabled={!file || isProcessing}
          />
           <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1"><Sparkles className="h-4 w-4 text-accent" />Or try one of these suggestions:</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setPrompt('Add a new final page that summarizes this document in three paragraphs.')} disabled={!file || isProcessing}>
                Summarize on new page
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPrompt('Create a title page for this document. Include a suitable title and a brief, one-sentence subtitle.')} disabled={!file || isProcessing}>
                Create title page
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPrompt('Add a new page that lists the top 5 key takeaways from this document as a bulleted list.')} disabled={!file || isProcessing}>
                List key takeaways
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
