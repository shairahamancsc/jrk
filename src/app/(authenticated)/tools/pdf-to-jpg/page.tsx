
"use client";

import type { Metadata } from 'next';
import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { FileImage, UploadCloud, Loader2, FileDown, Download, X } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';

export const metadata: Metadata = {
  title: 'PDF to JPG Converter',
};

export default function PdfToJpgPage() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  useEffect(() => {
    // Set workerSrc for pdfjs. This is crucial for it to work.
    // We point to a CDN version. In a production app, you'd host this worker file yourself.
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  }, []);

  const resetState = () => {
    setFile(null);
    setPageCount(null);
    setIsConverting(false);
    setProgress(0);
    imageUrls.forEach(URL.revokeObjectURL); // Clean up previous blob URLs
    setImageUrls([]);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    resetState();
    const selectedFile = event.target.files?.[0] || null;
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf') {
      toast({ variant: 'destructive', title: 'Invalid File', description: 'Please select a PDF file.' });
      return;
    }
    
    setFile(selectedFile);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      setPageCount(pdf.numPages);
      toast({ title: 'PDF Loaded', description: `Your PDF has ${pdf.numPages} pages and is ready to be converted.` });
    } catch (error) {
      console.error('Error loading PDF:', error);
      toast({ variant: 'destructive', title: 'Invalid PDF', description: 'Could not read the selected PDF file.' });
      resetState();
    }
  };

  const handleConvert = useCallback(async () => {
    if (!file) {
      toast({ variant: 'destructive', title: 'No File', description: 'Please upload a PDF file first.' });
      return;
    }
    setIsConverting(true);
    setProgress(0);
    
    const newImageUrls: string[] = [];
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({ canvasContext: context, viewport: viewport }).promise;
          const dataUrl = canvas.toDataURL('image/jpeg', 0.95); // High quality JPG
          newImageUrls.push(dataUrl);
        }
        
        setProgress(((i / pdf.numPages) * 100));
      }
      
      setImageUrls(newImageUrls);
      toast({ title: 'Conversion Complete', description: `Successfully converted ${pdf.numPages} pages.` });

    } catch (error) {
      console.error('PDF Conversion Error:', error);
      toast({ variant: 'destructive', title: 'Conversion Failed', description: 'An error occurred while converting the PDF.' });
    } finally {
      setIsConverting(false);
    }
  }, [file, toast]);
  
  const handleDownloadAll = async () => {
    if (imageUrls.length === 0) return;
    const zip = new JSZip();
    const baseName = file?.name.replace(/\.pdf$/i, '') || 'page';

    imageUrls.forEach((url, index) => {
        const imageData = url.split(',')[1];
        zip.file(`${baseName}_${index + 1}.jpg`, imageData, { base64: true });
    });

    try {
      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `${baseName}_images.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Error creating ZIP:", error);
      toast({ variant: 'destructive', title: 'Download Failed', description: 'Could not create the ZIP file.' });
    }
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
          <FileImage size={32} /> PDF to JPG Converter
        </h1>
        <p className="text-muted-foreground">
          Convert each page of your PDF into high-quality JPG images.
        </p>
      </header>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>1. Upload PDF</CardTitle>
          <CardDescription>Select the PDF file you wish to convert.</CardDescription>
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
              disabled={isConverting}
              className="sr-only"
            />
             <Button asChild variant="outline" className="mt-4" disabled={isConverting}>
                <label htmlFor="file-upload">Browse File</label>
            </Button>
          </div>
          {pageCount && (
            <div className="mt-4 text-center font-medium text-primary">
              PDF Loaded: {pageCount} pages total.
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>2. Convert and Download</CardTitle>
          <CardDescription>Each page of the PDF will be converted to a high-quality JPG image.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleConvert} disabled={!file || isConverting}>
            {isConverting ? (
                <>
                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                 Converting...
                </>
            ) : "Convert to JPG" }
          </Button>
          {isConverting && (
            <div className="flex items-center gap-4">
                <Progress value={progress} className="w-full" />
                <span className="text-sm font-medium text-muted-foreground">{Math.round(progress)}%</span>
            </div>
          )}
        </CardContent>
      </Card>

      {imageUrls.length > 0 && (
         <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>3. Download Your Images</CardTitle>
              <CardDescription>Download images individually or get them all in a single ZIP file.</CardDescription>
              <Button onClick={handleDownloadAll} className="mt-2 w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" />
                Download All as ZIP
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {imageUrls.map((url, index) => (
                   <div key={index} className="relative group border rounded-lg p-2 flex flex-col items-center gap-2">
                     <Image
                       src={url}
                       alt={`Page ${index + 1}`}
                       width={200}
                       height={282}
                       className="w-full h-auto object-contain rounded-md"
                     />
                     <a href={url} download={`page_${index + 1}.jpg`} className="w-full">
                       <Button variant="outline" size="sm" className="w-full">
                          <FileDown className="mr-2 h-3 w-3" />
                          Page {index + 1}
                       </Button>
                     </a>
                   </div>
                ))}
              </div>
            </CardContent>
          </Card>
      )}

    </div>
  );
}
