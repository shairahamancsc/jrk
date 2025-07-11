
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Shrink, UploadCloud, Loader2, FileDown, AlertCircle } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type QualityLevel = 'low' | 'medium' | 'high';

const qualityOptions: { level: QualityLevel; label: string; value: number }[] = [
  { level: 'low', label: 'Low Quality (Smallest Size)', value: 0.5 },
  { level: 'medium', label: 'Medium Quality (Recommended)', value: 0.75 },
  { level: 'high', label: 'High Quality (Larger Size)', value: 0.92 },
];

export default function PdfCompressPage() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [compressedPdfUrl, setCompressedPdfUrl] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [quality, setQuality] = useState<QualityLevel>('medium');

  useEffect(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  }, []);

  const resetState = () => {
    setFile(null);
    setIsProcessing(false);
    setProgress(0);
    if (compressedPdfUrl) URL.revokeObjectURL(compressedPdfUrl);
    setCompressedPdfUrl(null);
    setOriginalSize(null);
    setCompressedSize(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    resetState();
    const selectedFile = event.target.files?.[0] || null;
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf') {
      toast({ variant: 'destructive', title: 'Invalid File', description: 'Please select a PDF file.' });
      return;
    }
    setFile(selectedFile);
    setOriginalSize(selectedFile.size);
  };

  const handleCompress = useCallback(async () => {
    if (!file) {
      toast({ variant: 'destructive', title: 'No File', description: 'Please upload a PDF file first.' });
      return;
    }
    setIsProcessing(true);
    setProgress(0);
    setCompressedSize(null);
    if (compressedPdfUrl) URL.revokeObjectURL(compressedPdfUrl);
    setCompressedPdfUrl(null);
    
    const jpegQuality = qualityOptions.find(q => q.level === quality)?.value || 0.75;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ 
          data: arrayBuffer, 
          cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`, 
          cMapPacked: true 
      });
      const pdf = await loadingTask.promise;
      
      const newPdfDoc = await PDFDocument.create();

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        // Use a fixed scale for rendering. A higher scale captures more detail before re-compression.
        const viewport = page.getViewport({ scale: 1.5 });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({ canvasContext: context, viewport: viewport }).promise;
          const jpegDataUrl = canvas.toDataURL('image/jpeg', jpegQuality);
          const jpegImageBytes = await fetch(jpegDataUrl).then(res => res.arrayBuffer());
          const jpegImage = await newPdfDoc.embedJpg(jpegImageBytes);
          
          const newPage = newPdfDoc.addPage([page.view[2], page.view[3]]); // Use original page dimensions
          newPage.drawImage(jpegImage, {
            x: 0,
            y: 0,
            width: newPage.getWidth(),
            height: newPage.getHeight(),
          });
        }
        
        setProgress(((i / pdf.numPages) * 100));
      }
      
      const pdfBytes = await newPdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setCompressedSize(blob.size);
      const url = URL.createObjectURL(blob);
      setCompressedPdfUrl(url);

      toast({ title: 'Compression Complete', description: `Successfully compressed your PDF.` });

    } catch (error: any) {
      console.error('PDF Compression Error:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Compression Failed', 
        description: error.message || 'An error occurred. The PDF might be encrypted or corrupted.'
      });
    } finally {
      setIsProcessing(false);
    }
  }, [file, quality, compressedPdfUrl, toast]);

  const formatFileSize = (bytes: number | null) => {
    if (bytes === null) return 'N/A';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
          <Shrink size={32} /> PDF Compressor
        </h1>
        <p className="text-muted-foreground">
          Reduce the file size of your PDFs by re-compressing the images inside them.
        </p>
      </header>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>1. Upload PDF</CardTitle>
          <CardDescription>Select the PDF file you wish to compress.</CardDescription>
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
                <label htmlFor="file-upload">Browse File</label>
            </Button>
          </div>
          {originalSize !== null && (
            <div className="mt-4 text-center text-sm font-medium text-muted-foreground">
              Original file size: {formatFileSize(originalSize)}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>2. Set Compression &amp; Run</CardTitle>
          <CardDescription>Choose an image quality level. Lower quality results in a smaller file size.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="max-w-xs space-y-2">
                <Label htmlFor="quality-select">Image Quality</Label>
                <Select value={quality} onValueChange={(v) => setQuality(v as QualityLevel)} disabled={isProcessing || !file}>
                    <SelectTrigger id="quality-select">
                        <SelectValue placeholder="Select quality..." />
                    </SelectTrigger>
                    <SelectContent>
                        {qualityOptions.map(opt => (
                             <SelectItem key={opt.level} value={opt.level}>{opt.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            
            <Alert variant="default" className="bg-primary/5 border-primary/20">
              <AlertCircle className="h-4 w-4 text-primary" />
              <AlertTitle className="text-primary">How it works</AlertTitle>
              <AlertDescription>
                This tool rebuilds the PDF by converting each page into an image and then re-compressing it. This is effective for image-heavy documents but may result in a loss of selectable text.
              </AlertDescription>
            </Alert>
            
          <Button onClick={handleCompress} disabled={!file || isProcessing}>
            {isProcessing ? (
                <>
                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                 Compressing...
                </>
            ) : "Compress PDF" }
          </Button>

          {isProcessing && (
            <div className="flex items-center gap-4">
                <Progress value={progress} className="w-full" />
                <span className="text-sm font-medium text-muted-foreground">{Math.round(progress)}%</span>
            </div>
          )}
        </CardContent>
      </Card>

      {compressedPdfUrl && (
         <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>3. Download Your Compressed PDF</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-lg font-semibold">
                    Compression Results:
                </div>
                <div className="flex flex-col sm:flex-row sm:gap-8 gap-2 text-sm">
                    <span>Original Size: <strong className="text-muted-foreground">{formatFileSize(originalSize)}</strong></span>
                    <span>New Size: <strong className="text-primary">{formatFileSize(compressedSize)}</strong></span>
                    {originalSize && compressedSize && (
                        <span>Reduction: <strong className="text-green-600">{(((originalSize - compressedSize) / originalSize) * 100).toFixed(2)}%</strong></span>
                    )}
                </div>
              <Button asChild variant="secondary" className="w-full sm:w-auto">
                 <a href={compressedPdfUrl} download={`${file?.name.replace(/\.pdf$/i, '') || 'document'}-compressed.pdf`}>
                    <FileDown className="mr-2 h-4 w-4" />
                    Download Compressed PDF
                </a>
              </Button>
            </CardContent>
          </Card>
      )}
    </div>
  );
}
