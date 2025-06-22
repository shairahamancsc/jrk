
"use client";

import type { Metadata } from 'next';
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { GitMerge, UploadCloud, X, Loader2, FileDown } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

const MAX_FILES = 20;

export const metadata: Metadata = {
  title: 'PDF Merger',
};

export default function PdfMergePage() {
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(event.target.files || []);
    if (files.length + newFiles.length > MAX_FILES) {
        toast({
            variant: 'destructive',
            title: 'Too many files',
            description: `You can only select up to ${MAX_FILES} PDFs at a time.`,
        });
        return;
    }

    const validFiles = newFiles.filter(file => {
        if (file.type !== 'application/pdf') {
            toast({
                variant: 'destructive',
                title: 'Invalid file type',
                description: `${file.name} is not a PDF.`,
            });
            return false;
        }
        return true;
    });

    setFiles(prev => [...prev, ...validFiles]);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  };
  
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  };

  const handleMerge = useCallback(async () => {
    if (files.length < 2) {
      toast({
        variant: "destructive",
        title: "Not enough files",
        description: "Please select at least two PDF files to merge.",
      });
      return;
    }

    setIsMerging(true);
    setPdfUrl(null);

    try {
      const mergedPdf = await PDFDocument.create();
      for (const file of files) {
        const pdfBytes = await file.arrayBuffer();
        const pdf = await PDFDocument.load(pdfBytes, {
          // Ignore errors for potentially corrupted PDFs, helps with broader compatibility
          ignoreEncryption: true,
        });
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => {
          mergedPdf.addPage(page);
        });
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);

      toast({
        title: "Merge Successful",
        description: "Your merged PDF is ready for download.",
      });

    } catch (error) {
      console.error("PDF Merge Error:", error);
      toast({
        variant: "destructive",
        title: "Merge Failed",
        description: "An error occurred while merging the PDFs. Ensure they are not password-protected.",
      });
    } finally {
      setIsMerging(false);
    }
  }, [files, toast]);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
          <GitMerge size={32} /> PDF Merger
        </h1>
        <p className="text-muted-foreground">
          Combine multiple PDF files into one. The files will be merged in the order they are listed.
        </p>
      </header>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>1. Upload PDFs</CardTitle>
          <CardDescription>Select two or more PDF files to merge. You can add up to {MAX_FILES} files.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center bg-background/50">
            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Drag & drop files here or click to browse</p>
            <Input
              id="file-upload"
              type="file"
              multiple
              accept="application/pdf"
              onChange={handleFileChange}
              className="sr-only"
            />
             <Button asChild variant="outline" className="mt-4">
                <label htmlFor="file-upload">Browse Files</label>
            </Button>
          </div>

           {files.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Selected Files ({files.length}):</h3>
              <ul className="space-y-2">
                {files.map((file, index) => (
                  <li key={index} className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
                    <span className="text-sm truncate font-medium">{file.name}</span>
                     <button
                      onClick={() => removeFile(index)}
                      className="text-destructive hover:text-destructive/80 p-1 rounded-full"
                    >
                      <X size={16} />
                    </button>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground mt-2">Files will be merged in the order shown above.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>2. Merge and Download</CardTitle>
          <CardDescription>Once you've selected your files, click the merge button.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-center gap-4">
          <Button 
            onClick={handleMerge} 
            disabled={isMerging || files.length < 2}
            className="w-full sm:w-auto"
          >
            {isMerging ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Merging...
              </>
            ) : "Merge PDFs"}
          </Button>

          {pdfUrl && (
             <Button asChild variant="secondary" className="w-full sm:w-auto">
              <a href={pdfUrl} download={`merged-${Date.now()}.pdf`}>
                <FileDown className="mr-2 h-4 w-4" />
                Download Merged PDF
              </a>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
