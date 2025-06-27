
"use client";

import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { FilePenLine, UploadCloud, Loader2, FileDown, Eraser, Trash2, Type } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { cn } from '@/lib/utils';

type EditMode = 'whiteout' | 'text';

type Redaction = {
  id: string;
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

type TextAddition = {
  id: string;
  pageIndex: number;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color: { r: number; g: number; b: number };
};

type PageInfo = {
  previewUrl: string;
  width: number;
  height: number;
};

export default function PdfEditPage() {
  const { toast } = useToast();
  
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [pageInfos, setPageInfos] = useState<PageInfo[]>([]);
  const [redactions, setRedactions] = useState<Redaction[]>([]);
  const [textAdditions, setTextAdditions] = useState<TextAddition[]>([]);
  const [editedPdfUrl, setEditedPdfUrl] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<EditMode>('whiteout');

  useEffect(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  }, []);

  const resetState = () => {
    setFile(null);
    setIsProcessing(false);
    pageInfos.forEach(p => URL.revokeObjectURL(p.previewUrl));
    setPageInfos([]);
    setRedactions([]);
    setTextAdditions([]);
    if (editedPdfUrl) {
      URL.revokeObjectURL(editedPdfUrl);
    }
    setEditedPdfUrl(null);
    setEditMode('whiteout');
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
            width: page.view[2],
            height: page.view[3],
          });
        }
      }
      setPageInfos(newPageInfos);
      toast({ title: "PDF Loaded", description: `Found ${pdf.numPages} page(s). Use the toolbar to start editing.`});

    } catch (error) {
      console.error('Error processing PDF:', error);
      toast({ variant: 'destructive', title: 'PDF Processing Error', description: 'Could not read the selected PDF file.' });
      resetState();
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handlePageClick = (pageIndex: number, event: React.MouseEvent<HTMLDivElement>) => {
    const pageInfo = pageInfos[pageIndex];
    if (!pageInfo) return;

    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    const renderedWidth = target.clientWidth;
    
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    const scaleX = pageInfo.width / renderedWidth;
    const scaleY = pageInfo.height / (target.clientHeight);

    if (editMode === 'whiteout') {
        const redactionWidth = 150;
        const redactionHeight = 30;
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
    } else if (editMode === 'text') {
        const text = window.prompt("Enter the text to add:");
        if (text) {
            const fontSize = 18; // Default font size in PDF units
            const pdfX = clickX * scaleX;
            const pdfY = pageInfo.height - (clickY * scaleY) - (fontSize / 2);
            
            const newTextAddition: TextAddition = {
                id: `text-${Date.now()}`,
                pageIndex,
                text,
                x: pdfX,
                y: pdfY,
                fontSize: fontSize,
                color: { r: 0, g: 0, b: 0 }, // Black
            };
            setTextAdditions(prev => [...prev, newTextAddition]);
        }
    }
  };
  
  const handleRemoveItem = (idToRemove: string, type: 'redaction' | 'text') => {
    if (type === 'redaction') {
        setRedactions(prev => prev.filter(r => r.id !== idToRemove));
    } else {
        setTextAdditions(prev => prev.filter(t => t.id !== idToRemove));
    }
  };


  const handleApplyChanges = async () => {
    if (!file || (redactions.length === 0 && textAdditions.length === 0)) {
        toast({ variant: 'destructive', title: 'No Changes to Apply', description: 'Please add at least one whiteout box or text item to the PDF.' });
        return;
    }
    setIsProcessing(true);
    if (editedPdfUrl) URL.revokeObjectURL(editedPdfUrl);
    setEditedPdfUrl(null);

    try {
        const pdfBytes = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pages = pdfDoc.getPages();
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

        redactions.forEach(r => {
          if (pages[r.pageIndex]) {
            pages[r.pageIndex].drawRectangle({
              x: r.x,
              y: r.y,
              width: r.width,
              height: r.height,
              color: rgb(1, 1, 1),
              borderColor: rgb(0.8, 0.8, 0.8),
              borderWidth: 1,
            });
          }
        });

        textAdditions.forEach(t => {
            if (pages[t.pageIndex]) {
                pages[t.pageIndex].drawText(t.text, {
                    x: t.x,
                    y: t.y,
                    font: helveticaFont,
                    size: t.fontSize,
                    color: rgb(t.color.r, t.color.g, t.color.b),
                });
            }
        });
        
        const newPdfBytes = await pdfDoc.save();
        const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
        setEditedPdfUrl(URL.createObjectURL(blob));
        toast({ title: 'Changes Applied', description: 'Your PDF has been updated.' });

    } catch (error) {
        console.error('Error applying edits:', error);
        toast({ variant: 'destructive', title: 'Editing Failed', description: 'An error occurred while applying the edits.' });
    } finally {
        setIsProcessing(false);
    }
  }
  
  const EditorToolbar = () => (
    <div className="bg-muted p-2 rounded-md mb-4 flex items-center gap-2">
      <Button variant={editMode === 'text' ? 'default' : 'outline'} onClick={() => setEditMode('text')}>
        <Type className="mr-2 h-4 w-4" /> Text
      </Button>
      <Button variant={editMode === 'whiteout' ? 'default' : 'outline'} onClick={() => setEditMode('whiteout')}>
        <Eraser className="mr-2 h-4 w-4" /> Whiteout
      </Button>
    </div>
  );

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
          <FilePenLine size={32} /> PDF Editor
        </h1>
        <p className="text-muted-foreground">
          Upload a PDF to add text or whiteout boxes.
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
                    <CardTitle className="flex items-center gap-2">2. Edit Your PDF</CardTitle>
                    <CardDescription>Use the toolbar to select a tool, then click on a page to apply it.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 bg-muted/30 p-4 rounded-lg">
                    <EditorToolbar />
                    {pageInfos.map((pageInfo, index) => (
                        <div key={index} className="flex flex-col items-center">
                            <div 
                                className="relative w-full max-w-4xl mx-auto cursor-crosshair"
                                onClick={(e) => handlePageClick(index, e)}
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
                                                onClick={(e) => { e.stopPropagation(); handleRemoveItem(r.id, 'redaction'); }}
                                                className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                aria-label="Remove redaction"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    );
                                })}
                                {textAdditions.filter(t => t.pageIndex === index).map(t => {
                                    const scaleX = (1 / pageInfos[t.pageIndex].width) * 100;
                                    const scaleY = (1 / pageInfos[t.pageIndex].height) * 100;
                                    const left = t.x * scaleX;
                                    const bottom = t.y * scaleY;
                                    const top = 100 - (bottom + (t.fontSize - 4) * scaleY);

                                    return (
                                        <div
                                            key={t.id}
                                            className="absolute p-1 group cursor-text"
                                            style={{
                                                left: `${left}%`,
                                                top: `${top}%`,
                                                fontSize: `${(t.fontSize / pageInfo.height) * 100 * (1 / (pageInfo.height / 842))}em`, // Approximate scaling
                                                color: `rgb(${t.color.r * 255}, ${t.color.g * 255}, ${t.color.b * 255})`,
                                                lineHeight: 1,
                                            }}
                                        >
                                            {t.text}
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleRemoveItem(t.id, 'text'); }}
                                                className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                aria-label="Remove text"
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
                    <Button onClick={handleApplyChanges} disabled={isProcessing || (redactions.length === 0 && textAdditions.length === 0)}>
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
