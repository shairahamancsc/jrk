
"use client";

import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { FilePenLine, UploadCloud, Loader2, FileDown, Eraser, Trash2, Type, Palette, SlidersHorizontal } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { cn } from '@/lib/utils';

// State types
type EditMode = 'whiteout' | 'text';

type Redaction = {
  id: string;
  type: 'redaction';
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: { r: number; g: number; b: number };
  opacity: number;
};

type TextAddition = {
  id: string;
  type: 'text';
  pageIndex: number;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color: { r: number; g: number; b: number };
};

type EditableItem = Redaction | TextAddition;

type PageInfo = {
  previewUrl: string;
  width: number;
  height: number;
};

// Helper functions for color conversion
const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    let r = 0, g = 0, b = 0;
    // 3 digits
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) { // 6 digits
        r = parseInt(hex.slice(1, 3), 16);
        g = parseInt(hex.slice(3, 5), 16);
        b = parseInt(hex.slice(5, 7), 16);
    }
    return { r: r / 255, g: g / 255, b: b / 255 };
};

const rgbToHex = (color: { r: number; g: number; b: number }): string => {
    const toHex = (c: number) => `0${Math.round(c * 255).toString(16)}`.slice(-2);
    return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
};


export default function PdfEditPage() {
  const { toast } = useToast();
  
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [pageInfos, setPageInfos] = useState<PageInfo[]>([]);
  const [items, setItems] = useState<EditableItem[]>([]);
  const [editedPdfUrl, setEditedPdfUrl] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<EditMode>('whiteout');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  useEffect(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  }, []);

  const resetState = () => {
    setFile(null);
    setIsProcessing(false);
    pageInfos.forEach(p => URL.revokeObjectURL(p.previewUrl));
    setPageInfos([]);
    setItems([]);
    if (editedPdfUrl) {
      URL.revokeObjectURL(editedPdfUrl);
    }
    setEditedPdfUrl(null);
    setEditMode('whiteout');
    setSelectedItem(null);
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
            type: 'redaction',
            pageIndex,
            x: pdfX,
            y: pdfY,
            width: redactionWidth,
            height: redactionHeight,
            color: { r: 1, g: 1, b: 1 },
            opacity: 1,
        };
        setItems(prev => [...prev, newRedaction]);
        setSelectedItem(newRedaction.id);
    } else if (editMode === 'text') {
        const text = window.prompt("Enter the text to add:");
        if (text) {
            const fontSize = 18; // Default font size in PDF units
            const pdfX = clickX * scaleX;
            const pdfY = pageInfo.height - (clickY * scaleY) - (fontSize / 2);
            
            const newTextAddition: TextAddition = {
                id: `text-${Date.now()}`,
                type: 'text',
                pageIndex,
                text,
                x: pdfX,
                y: pdfY,
                fontSize: fontSize,
                color: { r: 0, g: 0, b: 0 }, // Black
            };
            setItems(prev => [...prev, newTextAddition]);
            setSelectedItem(newTextAddition.id);
        }
    }
  };
  
  const handleDeleteItem = () => {
    if (!selectedItemId) return;
    setItems(prev => prev.filter(item => item.id !== selectedItemId));
    setSelectedItem(null);
  };

  const updateItem = (itemId: string, newProps: Partial<EditableItem>) => {
    setItems(prev => prev.map(item => item.id === itemId ? { ...item, ...item, ...newProps } : item));
  };

  const handleApplyChanges = async () => {
    if (!file || items.length === 0) {
        toast({ variant: 'destructive', title: 'No Changes to Apply', description: 'Please add at least one item to the PDF.' });
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

        const redactions = items.filter(i => i.type === 'redaction') as Redaction[];
        const textAdditions = items.filter(i => i.type === 'text') as TextAddition[];

        redactions.forEach(r => {
          if (pages[r.pageIndex]) {
            pages[r.pageIndex].drawRectangle({
              x: r.x,
              y: r.y,
              width: r.width,
              height: r.height,
              color: rgb(r.color.r, r.color.g, r.color.b),
              opacity: r.opacity,
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
        toast({ title: 'Changes Applied', description: 'Your PDF has been updated and is ready for download.' });

    } catch (error) {
        console.error('Error applying edits:', error);
        toast({ variant: 'destructive', title: 'Editing Failed', description: 'An error occurred while applying the edits.' });
    } finally {
        setIsProcessing(false);
    }
  }

  const selectedItem = items.find(item => item.id === selectedItemId) || null;
  
  const EditorToolbar = () => (
    <div className="bg-muted p-2 rounded-md flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <Button variant={editMode === 'text' ? 'default' : 'outline'} size="sm" onClick={() => setEditMode('text')}>
          <Type className="mr-2 h-4 w-4" /> Text
        </Button>
        <Button variant={editMode === 'whiteout' ? 'default' : 'outline'} size="sm" onClick={() => setEditMode('whiteout')}>
          <Eraser className="mr-2 h-4 w-4" /> Whiteout
        </Button>
      </div>
       {selectedItemId && (
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={handleDeleteItem}>
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete Selected Item</span>
        </Button>
       )}
    </div>
  );

  const PropertiesPanel = () => {
    if (!selectedItem || !selectedItemId) return null;

    if (selectedItem.type === 'redaction') {
        const r = selectedItem;
        return (
            <div className="space-y-4 rounded-md border p-4 bg-background">
                <h4 className="font-semibold text-center text-sm">Whiteout Properties</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label htmlFor="width" className="text-xs">Width</Label>
                        <Input id="width" type="number" value={Math.round(r.width)} onChange={(e) => updateItem(selectedItemId, { width: parseInt(e.target.value, 10) || 0 })} className="h-8" />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="height" className="text-xs">Height</Label>
                        <Input id="height" type="number" value={Math.round(r.height)} onChange={(e) => updateItem(selectedItemId, { height: parseInt(e.target.value, 10) || 0 })} className="h-8"/>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="color" className="text-xs flex items-center gap-1"><Palette size={14}/> Color</Label>
                    <Input id="color" type="color" value={rgbToHex(r.color)} onChange={(e) => updateItem(selectedItemId, { color: hexToRgb(e.target.value) })} className="h-8 p-1"/>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="opacity" className="text-xs flex items-center gap-1"><SlidersHorizontal size={14}/> Opacity: {Math.round(r.opacity * 100)}%</Label>
                    <Slider id="opacity" value={[r.opacity]} onValueChange={([val]) => updateItem(selectedItemId, { opacity: val })} max={1} step={0.01} />
                </div>
            </div>
        )
    }

    if (selectedItem.type === 'text') {
        const t = selectedItem;
        return (
             <div className="space-y-4 rounded-md border p-4 bg-background">
                <h4 className="font-semibold text-center text-sm">Text Properties</h4>
                 <div className="space-y-1">
                    <Label htmlFor="fontSize" className="text-xs">Font Size</Label>
                    <Input id="fontSize" type="number" value={Math.round(t.fontSize)} onChange={(e) => updateItem(selectedItemId, { fontSize: parseInt(e.target.value, 10) || 0 })} className="h-8" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="color" className="text-xs flex items-center gap-1"><Palette size={14}/> Color</Label>
                    <Input id="color" type="color" value={rgbToHex(t.color)} onChange={(e) => updateItem(selectedItemId, { color: hexToRgb(e.target.value) })} className="h-8 p-1"/>
                </div>
             </div>
        )
    }

    return null;
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
          <FilePenLine size={32} /> PDF Editor
        </h1>
        <p className="text-muted-foreground">
          Upload a PDF to add text or whiteout boxes. Click an item to edit its properties.
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
                    <CardDescription>Use the toolbar to select a tool, then click on a page to apply it. Click an item to select it and modify its properties.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_250px] gap-4">
                    <div className="space-y-4 bg-muted/30 p-4 rounded-lg">
                        <EditorToolbar />
                        <div className="space-y-4">
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
                                        {items.map(item => {
                                            if (item.pageIndex !== index) return null;
                                            
                                            const scaleX = (1 / pageInfos[item.pageIndex].width) * 100;
                                            const scaleY = (1 / pageInfos[item.pageIndex].height) * 100;
                                            
                                            if (item.type === 'redaction') {
                                                const r = item;
                                                const left = r.x * scaleX;
                                                const bottom = r.y * scaleY;
                                                const top = 100 - (bottom + r.height * scaleY);
                                                
                                                return (
                                                    <div
                                                        key={r.id}
                                                        className={cn(
                                                          "absolute border-2 cursor-pointer",
                                                          selectedItemId === r.id ? "border-primary z-10" : "border-transparent"
                                                        )}
                                                        style={{
                                                            left: `${left}%`,
                                                            top: `${top}%`,
                                                            width: `${r.width * scaleX}%`,
                                                            height: `${r.height * scaleY}%`,
                                                            backgroundColor: `rgba(${r.color.r * 255}, ${r.color.g * 255}, ${r.color.b * 255}, ${r.opacity})`,
                                                        }}
                                                        onClick={(e) => { e.stopPropagation(); setSelectedItemId(r.id); }}
                                                    />
                                                );
                                            }

                                            if (item.type === 'text') {
                                                const t = item;
                                                const left = t.x * scaleX;
                                                const bottom = t.y * scaleY;
                                                const top = 100 - (bottom + (t.fontSize - 4) * scaleY);

                                                return (
                                                    <div
                                                        key={t.id}
                                                        className={cn(
                                                          "absolute p-1 cursor-pointer",
                                                          selectedItemId === t.id ? "ring-2 ring-primary ring-offset-2 z-10" : ""
                                                        )}
                                                        style={{
                                                            left: `${left}%`,
                                                            top: `${top}%`,
                                                            fontSize: `${(t.fontSize / pageInfo.height) * 100 * (1 / (pageInfo.height / 842))}em`, // Approximate scaling
                                                            color: `rgb(${t.color.r * 255}, ${t.color.g * 255}, ${t.color.b * 255})`,
                                                            lineHeight: 1,
                                                            whiteSpace: 'pre',
                                                        }}
                                                         onClick={(e) => { e.stopPropagation(); setSelectedItemId(t.id); }}
                                                    >
                                                        {t.text}
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">Page {index + 1}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <PropertiesPanel />
                    </div>
                  </div>
                </CardContent>
            </Card>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>3. Apply & Download</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row items-center gap-4">
                    <Button onClick={handleApplyChanges} disabled={isProcessing || items.length === 0}>
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
