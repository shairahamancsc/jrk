
"use client";

import type { Metadata } from 'next';
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Images, Loader2, FileDown, UploadCloud, X } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import Image from 'next/image';

const MAX_FILES = 20;
const MAX_FILE_SIZE_MB = 5;

export const metadata: Metadata = {
  title: 'JPG/PNG to PDF Converter',
};

export default function JpgToPdfPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length + selectedFiles.length > MAX_FILES) {
      toast({
        variant: 'destructive',
        title: 'Too many files',
        description: `You can only select up to ${MAX_FILES} images at a time.`,
      });
      return;
    }

    const validFiles = files.filter(file => {
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        toast({
          variant: 'destructive',
          title: 'Invalid file type',
          description: `${file.name} is not a valid image type (JPG, PNG).`,
        });
        return false;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: `${file.name} is larger than ${MAX_FILE_SIZE_MB}MB.`,
        });
        return false;
      }
      return true;
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  };

  const convertToPdf = useCallback(async () => {
    if (selectedFiles.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No files selected',
        description: 'Please select one or more images to convert.',
      });
      return;
    }

    setIsConverting(true);
    setPdfUrl(null);

    try {
      const pdfDoc = await PDFDocument.create();
      
      for (const file of selectedFiles) {
        const arrayBuffer = await file.arrayBuffer();
        let image;
        if (file.type === 'image/png') {
          image = await pdfDoc.embedPng(arrayBuffer);
        } else {
          image = await pdfDoc.embedJpg(arrayBuffer);
        }
        
        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);

      toast({
        title: 'Conversion Successful',
        description: 'Your PDF is ready for download.',
      });

    } catch (error) {
      console.error('PDF Conversion Error:', error);
      toast({
        variant: 'destructive',
        title: 'Conversion Failed',
        description: 'An error occurred while creating the PDF.',
      });
    } finally {
      setIsConverting(false);
    }
  }, [selectedFiles, toast]);
  
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
          <Images size={32} /> JPG/PNG to PDF Converter
        </h1>
        <p className="text-muted-foreground">
          Upload multiple images and convert them into a single PDF document.
        </p>
      </header>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>1. Upload Images</CardTitle>
          <CardDescription>Select JPG or PNG files from your device. You can add up to {MAX_FILES} images.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center bg-background/50">
            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Drag & drop files here or click to browse</p>
            <Input
              id="file-upload"
              type="file"
              multiple
              accept="image/jpeg,image/png"
              onChange={handleFileChange}
              className="sr-only"
            />
             <Button asChild variant="outline" className="mt-4">
                <label htmlFor="file-upload">Browse Files</label>
            </Button>
          </div>

          {selectedFiles.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Selected Files ({selectedFiles.length}/{MAX_FILES}):</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <Image
                      src={URL.createObjectURL(file)}
                      alt={`preview ${index}`}
                      width={150}
                      height={150}
                      className="w-full h-auto aspect-square object-cover rounded-md border"
                      onLoad={e => URL.revokeObjectURL((e.target as HTMLImageElement).src)} // Clean up object URLs after image loads
                    />
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                    <p className="text-xs truncate mt-1">{file.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

       <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>2. Convert and Download</CardTitle>
          <CardDescription>After uploading your images, click convert. Then download your PDF.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-center gap-4">
          <Button
            onClick={convertToPdf}
            disabled={isConverting || selectedFiles.length === 0}
            className="w-full sm:w-auto"
          >
            {isConverting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Converting...
              </>
            ) : "Convert to PDF"}
          </Button>

          {pdfUrl && (
            <Button asChild variant="secondary" className="w-full sm:w-auto">
              <a href={pdfUrl} download={`converted-${Date.now()}.pdf`}>
                <FileDown className="mr-2 h-4 w-4" />
                Download PDF
              </a>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
