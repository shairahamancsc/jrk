
"use client";

import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { FilePenLine, UploadCloud, Loader2, FileDown, Eraser, Trash2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb } from 'pdf-lib';

type Redaction = {
  id: string;
  pageIndex: number;
  x: number; // Stored as PDF coordinates (from bottom-left)
  y: number; // Stored as PDF coordinates (from bottom-left)
  width: number; // Stored as PDF units
  height: number; // Stored as PDF units
};

type PageInfo = {
  previewUrl: string;
  width: number; // original PDF page width
  height: number; // original PDF page height
};

export default function PdfEditPage() {
  const { toast } = useToast();
  
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [pageInfos, setPageInfos] = useState<PageInfo[]>([]);
  const [redactions, setRedactions] = useState<Redaction[]>([]);
  const [editedPdfUrl, setEditedPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  }, []);

  const resetState = () => {
    setFile(null);
    setIsProcessing(false);
    pageInfos.forEach(p => URL.revokeObjectURL(p.previewUrl));
    setPageInfos([]);
    setRedactions([]);
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
      
      const newPageInfos: PageInfo[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        if (context) {
          await page.render({ canvasContext: context, viewport: viewport }).promise;
          newPageInfos.push({
            previewUrl: canvas.toDataURL('image/jpeg'),
            width: page.view[2], // Original width
            height: page.view[3], // Original height
          });
        }
      }
      setPageInfos(newPageInfos);
      toast({ title: "PDF Loaded", description: `Found ${pdf.numPages} page(s). Click on a page to add a whiteout box.`});

    } catch (error) {
      console.error('Error processing PDF:', error);
      toast({ variant: 'destructive', title: 'PDF Processing Error', description: 'Could not read the selected PDF file.' });
      resetState();
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleAddRedaction = (pageIndex: number, event: React.MouseEvent<HTMLDivElement>) => {
    const pageInfo = pageInfos[pageIndex];
    if (!pageInfo) return;

    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    const renderedWidth = target.clientWidth;
    const renderedHeight = target.clientHeight;
    
    // Position of click relative to the image
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    // Scale factors
    const scaleX = pageInfo.width / renderedWidth;
    const scaleY = pageInfo.height / renderedHeight;
    
    const redactionWidth = 150; // Width in PDF units
    const redactionHeight = 30; // Height in PDF units

    // Convert click coordinates to PDF coordinates (origin at bottom-left)
    const pdfX = clickX * scaleX - (redactionWidth / 2);
    const pdfY = pageInfo.height - (clickY * scaleY) - (redactionHeight / 2);
    
    const newRedaction: Redaction = {
      id: `redact-${Date.now()}`,
      pageIndex,
      x: pdfX,
      y: pdfY,
      width: redactionWidth,
      height: redactionHeight,
    };
    
    setRedactions(prev => [...prev, newRedaction]);
  };
  
  const handleRemoveRedaction = (idToRemove: string) => {
    setRedactions(prev => prev.filter(r => r.id !== idToRemove));
  };


  const handleApplyChanges = async () => {
    if (!file || redactions.length === 0) {
        toast({ variant: 'destructive', title: 'No Changes to Apply', description: 'Please add at least one whiteout box to the PDF.' });
        return;
    }
    setIsProcessing(true);
    if (editedPdfUrl) URL.revokeObjectURL(editedPdfUrl);
    setEditedPdfUrl(null);

    try {
        const pdfBytes = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pages = pdfDoc.getPages();

        redactions.forEach(r => {
          if (pages[r.pageIndex]) {
            pages[r.pageIndex].drawRectangle({
              x: r.x,
              y: r.y,
              width: r.width,
              height: r.height,
              color: rgb(1, 1, 1), // Whiteout
              borderColor: rgb(0.8, 0.8, 0.8), // Light grey border for visibility
              borderWidth: 1,
            });
          }
        });
        
        const newPdfBytes = await pdfDoc.save();
        const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
        setEditedPdfUrl(URL.createObjectURL(blob));
        toast({ title: 'Changes Applied', description: `Successfully added ${redactions.length} whiteout box(es).` });

    } catch (error) {
        console.error('Error applying edits:', error);
        toast({ variant: 'destructive', title: 'Editing Failed', description: 'An error occurred while applying the edits.' });
    } finally {
        setIsProcessing(false);
    }
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
          <FilePenLine size={32} /> PDF Editor
        </h1>
        <p className="text-muted-foreground">
          Upload a PDF to begin editing. Currently supports adding whiteout boxes.
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
      
      {file && pageInfos.length > 0 && (
        <>
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Eraser /> 2. Add Whiteout Boxes</CardTitle>
                    <CardDescription>Click anywhere on a page to add a whiteout box. Click "Apply Changes" when you are done.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 bg-muted/30 p-4 rounded-lg">
                    {pageInfos.map((pageInfo, index) => (
                        <div key={index} className="flex flex-col items-center">
                            <div 
                                className="relative w-full max-w-4xl mx-auto cursor-crosshair"
                                onClick={(e) => handleAddRedaction(index, e)}
                            >
                                <Image 
                                    src={pageInfo.previewUrl}
                                    alt={`PDF Page ${index + 1} Preview`}
                                    width={800}
                                    height={1120}
                                    className="w-full h-auto border shadow-md rounded-md pointer-events-none"
                                />
                                {redactions.filter(r => r.pageIndex === index).map(r => {
                                    const scaleX = (1 / pageInfos[r.pageIndex].width) * 100;
                                    const scaleY = (1 / pageInfos[r.pageIndex].height) * 100;
                                    
                                    // Convert PDF coordinates back to CSS `top`/`left` percentages
                                    const left = r.x * scaleX;
                                    const bottom = r.y * scaleY;
                                    const top = 100 - (bottom + r.height * scaleY);
                                    
                                    return (
                                        <div
                                            key={r.id}
                                            className="absolute bg-white/80 border-2 border-dashed border-red-500 flex items-center justify-center group"
                                            style={{
                                                left: `${left}%`,
                                                top: `${top}%`,
                                                width: `${r.width * scaleX}%`,
                                                height: `${r.height * scaleY}%`,
                                            }}
                                        >
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleRemoveRedaction(r.id); }}
                                                className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                aria-label="Remove redaction"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Page {index + 1}</p>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>3. Apply & Download</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row items-center gap-4">
                    <Button onClick={handleApplyChanges} disabled={isProcessing || redactions.length === 0}>
                    {isProcessing ? (
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
                </CardContent>
            </Card>
        </>
      )}

    </div>
  );
}
