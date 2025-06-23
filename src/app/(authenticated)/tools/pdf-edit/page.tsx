
"use client";

import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { FilePenLine, UploadCloud, Loader2, FileDown, Sparkles } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { modifyPdf } from '@/ai/flows/pdf-edit-flow';

export default function PdfEditPage() {
  const { toast } = useToast();
  
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isApplyingChanges, setIsApplyingChanges] = useState(false);
  
  const [pagePreviews, setPagePreviews] = useState<string[]>([]);
  const [pdfTextContent, setPdfTextContent] = useState<string>('');
  const [userPrompt, setUserPrompt] = useState('');
  const [editedPdfUrl, setEditedPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  }, []);

  const resetState = () => {
    setFile(null);
    setIsProcessing(false);
    setIsApplyingChanges(false);
    setPagePreviews([]);
    setPdfTextContent('');
    setUserPrompt('');
    if (editedPdfUrl) {
      URL.revokeObjectURL(editedPdfUrl);
    }
    setEditedPdfUrl(null);
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    resetState();
    const selectedFile = event.target.files?.[0] || null;
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf') {
      toast({ variant: 'destructive', title: 'Invalid File', description: 'Please select a PDF file.' });
      return;
    }
    setFile(selectedFile);
    setIsProcessing(true);
    
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      const previews: string[] = [];
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        
        // Render preview
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        if (context) {
          await page.render({ canvasContext: context, viewport: viewport }).promise;
          previews.push(canvas.toDataURL('image/jpeg'));
        }

        // Extract text
        const textContent = await page.getTextContent();
        fullText += textContent.items.map(item => 'str' in item ? item.str : '').join(' ') + '\n\n';
      }
      setPagePreviews(previews);
      setPdfTextContent(fullText);

      toast({ title: "PDF Loaded", description: `Found ${pdf.numPages} page(s). You can now provide editing instructions.`});

    } catch (error) {
      console.error('Error processing PDF:', error);
      toast({ variant: 'destructive', title: 'PDF Processing Error', description: 'Could not read the selected PDF file.' });
      resetState();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyChanges = async () => {
    if (!file || !userPrompt || !pdfTextContent) {
        toast({ variant: 'destructive', title: 'Missing Information', description: 'Please upload a PDF and provide instructions.' });
        return;
    }
    setIsApplyingChanges(true);
    if (editedPdfUrl) URL.revokeObjectURL(editedPdfUrl);
    setEditedPdfUrl(null);

    try {
        const aiResult = await modifyPdf({
            pdfTextContent: pdfTextContent,
            userPrompt: userPrompt,
        });

        const pdfBytes = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(pdfBytes);

        if (aiResult.action === 'ADD_PAGE' && aiResult.generatedText) {
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const newPage = pdfDoc.addPage();
            const { width, height } = newPage.getSize();
            newPage.drawText(aiResult.generatedText, {
                x: 50,
                y: height - 50,
                font,
                size: 12,
                lineHeight: 14,
                maxWidth: width - 100,
            });
            toast({ title: 'Page Added', description: 'A new page has been added with the AI-generated content.' });
        } else if (aiResult.action === 'REDACT_CONTENT' && aiResult.redactions?.length) {
            const pages = pdfDoc.getPages();
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica); // Need a font to get text width
            let redactionCount = 0;

            for (const page of pages) {
                for (const textToRedact of aiResult.redactions) {
                    const textInstances = await page.findText(textToRedact, { font });
                    
                    textInstances.forEach(instance => {
                        page.drawRectangle({
                            ...instance,
                            color: rgb(1, 1, 1), // Whiteout
                            borderColor: rgb(0.8, 0.8, 0.8), // Light grey border
                            borderWidth: 1,
                        });
                        redactionCount++;
                    });
                }
            }
            toast({ title: 'Content Redacted', description: `Applied ${redactionCount} redaction(s) to the document.` });
        } else {
             toast({ variant: 'destructive', title: 'No Action Taken', description: "The AI could not determine a clear action from your prompt." });
             setIsApplyingChanges(false);
             return;
        }

        const newPdfBytes = await pdfDoc.save();
        const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
        setEditedPdfUrl(URL.createObjectURL(blob));

    } catch (error) {
        console.error('Error applying AI edits:', error);
        toast({ variant: 'destructive', title: 'Editing Failed', description: 'An error occurred while applying AI edits.' });
    } finally {
        setIsApplyingChanges(false);
    }
  }

  const suggestionPrompts = [
    { title: 'Summarize on new page', prompt: 'Add a new final page that summarizes this document.' },
    { title: 'Redact names', prompt: 'Redact all personal names in this document.' },
    { title: 'Create title page', prompt: 'Create a new first page with a title and a brief introduction based on the content.' },
  ];

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
          <FilePenLine size={32} /> AI PDF Editor
        </h1>
        <p className="text-muted-foreground">
          Use AI to redact content or add new pages. Upload a PDF to get started.
        </p>
      </header>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>1. Upload PDF</CardTitle>
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
              disabled={isProcessing}
              className="sr-only"
            />
             <Button asChild variant="outline" className="mt-4" disabled={isProcessing}>
                <label htmlFor="file-upload">{isProcessing ? 'Loading...' : 'Browse File'}</label>
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {file && (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>PDF Preview</CardTitle>
                    <CardDescription>This is a visual preview of your uploaded document.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 bg-muted/30 p-4 rounded-lg">
                    {pagePreviews.map((src, index) => (
                        <div key={index} className="flex flex-col items-center">
                            <Image 
                                src={src}
                                alt={`PDF Page ${index + 1} Preview`}
                                width={800}
                                height={1120}
                                className="w-full max-w-3xl border shadow-md rounded-md"
                            />
                            <p className="text-xs text-muted-foreground mt-1">Page {index + 1}</p>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>2. Provide AI Instructions</CardTitle>
                <CardDescription>Tell the AI what you want to do. Be specific for best results.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Textarea 
                placeholder="e.g., Redact the name 'Prava Ranjan Nayak' and the Enrolment No."
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                disabled={isApplyingChanges}
                rows={4}
                />
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Sparkles className="h-4 w-4 text-accent" />
                        <span>Suggestions</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {suggestionPrompts.map(p => (
                            <Button key={p.title} variant="outline" size="sm" onClick={() => setUserPrompt(p.prompt)} disabled={isApplyingChanges}>
                                {p.title}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                    <Button onClick={handleApplyChanges} disabled={isApplyingChanges || !userPrompt}>
                    {isApplyingChanges ? (
                        <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Applying Changes...
                        </>
                    ) : "Apply Changes"}
                    </Button>
                    {editedPdfUrl && (
                        <Button asChild variant="secondary">
                        <a href={editedPdfUrl} download={`edited-${file.name}`}>
                            <FileDown className="mr-2 h-4 w-4" />
                            Download Edited PDF
                        </a>
                        </Button>
                    )}
                </div>
            </CardContent>
            </Card>
        </>
      )}

    </div>
  );
}
