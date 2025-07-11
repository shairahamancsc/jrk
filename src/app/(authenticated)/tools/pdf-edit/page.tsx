
"use client";

import React, { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { FilePenLine, UploadCloud, Loader2, FileDown, Trash2, Type, Undo, Redo, Copy } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { cn } from '@/lib/utils';
import { useHistoryState } from '@/hooks/useHistory';

// State types
type TextAddition = {
  id: string;
  type: 'text';
  pageIndex: number;
  x: number;
  y: number;
  width: number; // For bounding box
  height: number; // For bounding box
  text: string;
  fontSize: number;
  color: { r: number; g: number; b: number };
};

type EditableItem = TextAddition;

type PageInfo = {
  previewUrl: string;
  width: number;
  height: number;
};

// Helper functions for color conversion
const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
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

// Floating Toolbar Component
const FloatingToolbar = ({
  item,
  updateItem,
  deleteItem,
}: {
  item: EditableItem;
  updateItem: (itemId: string, newProps: Partial<EditableItem>) => void;
  deleteItem: (itemId: string) => void;
}) => {
  return (
    <div className="flex items-center gap-1 p-1 bg-white rounded-md shadow-lg border border-gray-300">
      {item.type === 'text' && (
        <>
          <div className="flex items-center gap-1 px-1">
            <Label htmlFor="font-size" className="text-xs">Size:</Label>
            <Input
              id="font-size"
              type="number"
              value={Math.round(item.fontSize)}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => updateItem(item.id, { fontSize: parseInt(e.target.value, 10) || 1 })}
              className="w-16 h-8 text-xs"
            />
          </div>
          <div className="p-1">
            <Input
              type="color"
              aria-label="Color"
              value={rgbToHex(item.color)}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => updateItem(item.id, { color: hexToRgb(e.target.value) })}
              className="h-7 w-7 p-0.5 border-none cursor-pointer"
            />
          </div>
        </>
      )}
      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }} className="text-destructive h-8 w-8" aria-label="Delete">
        <Trash2 size={16} />
      </Button>
    </div>
  );
};

export default function PdfEditPage() {
  const { toast } = useToast();
  
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [pageInfos, setPageInfos] = useState<PageInfo[]>([]);
  const { state: items, setState: setItems, undo, redo, canUndo, canRedo, resetHistory: resetItems } = useHistoryState<EditableItem[]>([]);
  
  const [editedPdfUrl, setEditedPdfUrl] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const editableItemRefs = useRef<{[key: string]: HTMLDivElement | null}>({});

  useEffect(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  }, []);

  const resetState = () => {
    setFile(null);
    setIsProcessing(false);
    pageInfos.forEach(p => URL.revokeObjectURL(p.previewUrl));
    setPageInfos([]);
    resetItems([]);
    if (editedPdfUrl) {
      URL.revokeObjectURL(editedPdfUrl);
    }
    setEditedPdfUrl(null);
    setSelectedItemId(null);
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
      const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
        cMapPacked: true,
      });
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
    if ((event.target as HTMLElement).closest('[data-editable-item="true"]')) {
      return;
    }

    const pageInfo = pageInfos[pageIndex];
    if (!pageInfo) return;

    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    const scaleX = pageInfo.width / rect.width;
    const scaleY = pageInfo.height / rect.height;
    
    const pdfX = clickX * scaleX;
    const pdfY = pageInfo.height - (clickY * scaleY);
    
    const newText: TextAddition = {
        id: `text-${Date.now()}`,
        type: 'text',
        pageIndex,
        x: pdfX,
        y: pdfY,
        width: 150,
        height: 20,
        text: 'Sample Text',
        fontSize: 18,
        color: { r: 0, g: 0, b: 0 },
    };
    setItems(prev => [...prev, newText]);
    setSelectedItemId(newText.id);
  };
  
  const updateItem = (itemId: string, newProps: Partial<EditableItem>) => {
    setItems(prevItems => prevItems.map(item => item.id === itemId ? { ...item, ...newProps } : item));
  };
  
  const handleDeleteItem = (itemId: string) => {
    if (selectedItemId === itemId) {
      setSelectedItemId(null);
    }
    setItems(prev => prev.filter(item => item.id !== itemId));
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

        for (const item of items) {
            const page = pages[item.pageIndex];
            if (!page || item.type !== 'text') continue;

            page.drawText(item.text, {
                x: item.x,
                y: item.y - item.fontSize, // Adjust for baseline
                font: helveticaFont,
                size: item.fontSize,
                color: rgb(item.color.r, item.color.g, item.color.b),
                lineHeight: item.fontSize * 1.2,
                maxWidth: item.width,
            });
        }
        
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
    <div className="bg-muted p-2 rounded-md flex items-center justify-between gap-2 flex-wrap">
      <div className="flex items-center gap-2">
        <Button variant={'default'} size="sm">
          <Type className="mr-2 h-4 w-4" /> Text
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={undo} disabled={!canUndo} aria-label="Undo">
            <Undo className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={redo} disabled={!canRedo} aria-label="Redo">
            <Redo className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
          <FilePenLine size={32} /> PDF Editor
        </h1>
        <p className="text-muted-foreground">
          Upload a PDF to add text. Click on the page to add text, then click the text to edit or style it.
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
                    <CardDescription>Click on a page to add text. Click an existing text box to edit it.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 bg-muted/30 p-4 rounded-lg">
                      <EditorToolbar />
                      <div className="space-y-4">
                          {pageInfos.map((pageInfo, index) => (
                              <div key={index} className="flex flex-col items-center">
                                  <div 
                                      className="relative w-full max-w-4xl mx-auto cursor-text"
                                      onClick={(e) => handlePageClick(index, e)}
                                      onMouseDown={(e) => {
                                        if (selectedItemId && (e.target as HTMLElement).closest('[data-editable-item="true"]') === null) {
                                           setSelectedItemId(null);
                                        }
                                      }}
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
                                          
                                          const scaleX = (100 / pageInfo.width);
                                          const scaleY = (100 / pageInfo.height);

                                          const itemStyle: React.CSSProperties = {
                                              left: `${item.x * scaleX}%`,
                                              top: `${(pageInfo.height - item.y) * scaleY}%`,
                                              fontSize: `${(item.fontSize / pageInfo.height) * 100 * (1 / (pageInfo.height / 842))}em`, // Adjust font size relative to container
                                              color: `rgb(${item.color.r * 255}, ${item.color.g * 255}, ${item.color.b * 255})`,
                                              minWidth: `${item.width * scaleX}%`,
                                              minHeight: `${item.height * scaleY}%`,
                                          };
                                          
                                          return (
                                              <div
                                                  key={item.id}
                                                  ref={(el) => editableItemRefs.current[item.id] = el}
                                                  data-editable-item="true"
                                                  className={cn(
                                                    "absolute p-1 cursor-move select-none whitespace-pre-wrap break-words",
                                                    selectedItemId === item.id ? "ring-2 ring-primary ring-offset-background z-10" : "hover:ring-1 hover:ring-primary/50"
                                                  )}
                                                  style={itemStyle}
                                                  contentEditable={selectedItemId === item.id}
                                                  suppressContentEditableWarning={true}
                                                  onClick={(e) => { e.stopPropagation(); setSelectedItemId(item.id); }}
                                                  onBlur={(e) => {
                                                    const currentText = e.currentTarget.innerText;
                                                    if(item.text !== currentText) {
                                                      updateItem(item.id, { text: currentText });
                                                    }
                                                  }}
                                              >
                                                  {item.text}
                                              </div>
                                          );
                                      })}

                                      {selectedItem && selectedItem.pageIndex === index && (
                                        <div
                                            className="absolute z-20"
                                            style={{
                                                top: `calc(${(pageInfo.height - selectedItem.y) * scaleY}% - 50px)`,
                                                left: `${selectedItem.x * scaleX}%`,
                                            }}
                                        >
                                            <FloatingToolbar
                                                item={selectedItem}
                                                updateItem={updateItem}
                                                deleteItem={handleDeleteItem}
                                            />
                                        </div>
                                      )}

                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">Page {index + 1}</p>
                              </div>
                          ))}
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
                        <a href={editedPdfUrl} download={`edited-${file?.name || 'document.pdf'}`}>
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
