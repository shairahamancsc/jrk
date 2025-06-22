
"use client";

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Scissors, UploadCloud, Loader2, FileDown } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

export default function PdfSplitPage() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [ranges, setRanges] = useState('');
  const [isSplitting, setIsSplitting] = useState(false);
  const [splitPdfUrls, setSplitPdfUrls] = useState<{ name: string; url: string }[]>([]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
    setPageCount(null);
    setRanges('');
    if (splitPdfUrls.length > 0) {
      splitPdfUrls.forEach(item => URL.revokeObjectURL(item.url));
      setSplitPdfUrls([]);
    }

    if (selectedFile) {
      try {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        setPageCount(pdfDoc.getPageCount());
        toast({ title: 'PDF Loaded', description: `Your PDF has ${pdfDoc.getPageCount()} pages.` });
      } catch (error) {
        console.error('Error loading PDF:', error);
        toast({ variant: 'destructive', title: 'Invalid PDF', description: 'Could not read the selected PDF file.' });
        setFile(null);
      }
    }
  };

  const parseAndValidateRanges = (rangesStr: string, maxPages: number): number[][] | null => {
    const validatedRanges: number[][] = [];
    if (!rangesStr.trim()) {
      toast({ variant: 'destructive', title: 'Invalid Input', description: 'Please enter page ranges to split.' });
      return null;
    }
  
    const parts = rangesStr.split(',').map(s => s.trim());
    
    for (const part of parts) {
      if (part.includes('-')) {
        const [startStr, endStr] = part.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (isNaN(start) || isNaN(end) || start <= 0 || end > maxPages || start > end) {
          toast({ variant: 'destructive', title: 'Invalid Range', description: `The range "${part}" is not valid.` });
          return null;
        }
        const pageIndices = [];
        for (let i = start; i <= end; i++) {
          pageIndices.push(i - 1); // 0-based index
        }
        validatedRanges.push(pageIndices);
      } else {
        const page = parseInt(part, 10);
        if (isNaN(page) || page <= 0 || page > maxPages) {
          toast({ variant: 'destructive', title: 'Invalid Page', description: `Page number "${part}" is out of bounds.` });
          return null;
        }
        validatedRanges.push([page - 1]); // 0-based index
      }
    }
    return validatedRanges;
  };
  

  const handleSplit = useCallback(async () => {
    if (!file || !pageCount) {
      toast({ variant: 'destructive', title: 'No File', description: 'Please upload a PDF file first.' });
      return;
    }

    const pageGroupsToCreate = parseAndValidateRanges(ranges, pageCount);
    if (!pageGroupsToCreate) {
      return; // Error toast is shown inside the parser
    }

    setIsSplitting(true);
    if (splitPdfUrls.length > 0) {
      splitPdfUrls.forEach(item => URL.revokeObjectURL(item.url));
    }
    setSplitPdfUrls([]);
    
    try {
      const sourceBytes = await file.arrayBuffer();
      const sourcePdf = await PDFDocument.load(sourceBytes, { ignoreEncryption: true });
      const newUrls = [];

      for (const pageIndices of pageGroupsToCreate) {
        const newPdf = await PDFDocument.create();
        const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);
        copiedPages.forEach(page => newPdf.addPage(page));

        const newPdfBytes = await newPdf.save();
        const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        const pageNumbers = pageIndices.map(p => p + 1);
        const rangeName = pageNumbers.length > 1 
          ? `${Math.min(...pageNumbers)}-${Math.max(...pageNumbers)}` 
          : `${pageNumbers[0]}`;
        const baseName = file.name.replace(/\.pdf$/i, '');
        newUrls.push({
          name: `${baseName}_pages_${rangeName}.pdf`,
          url: url,
        });
      }
      
      setSplitPdfUrls(newUrls);
      toast({ title: 'Split Successful', description: `${newUrls.length} PDF(s) have been created.` });

    } catch (error) {
      console.error('PDF Splitting Error:', error);
      toast({ variant: 'destructive', title: 'Split Failed', description: 'An error occurred while splitting the PDF.' });
    } finally {
      setIsSplitting(false);
    }
  }, [file, pageCount, ranges, toast, splitPdfUrls]);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
          <Scissors size={32} /> PDF Splitter
        </h1>
        <p className="text-muted-foreground">
          Split a single PDF into multiple files based on page ranges.
        </p>
      </header>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>1. Upload PDF</CardTitle>
          <CardDescription>Select the PDF file you wish to split.</CardDescription>
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
          {pageCount && (
            <div className="mt-4 text-center font-medium text-primary">
              PDF Loaded: {pageCount} pages total.
            </div>
          )}
        </CardContent>
      </Card>
      
      {file && pageCount && (
        <>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>2. Define Split Ranges & Split</CardTitle>
            <CardDescription>Enter page numbers or ranges, separated by commas (e.g., 1-3, 5, 9-11).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input 
              placeholder="e.g., 1-3, 5, 9-11"
              value={ranges}
              onChange={(e) => setRanges(e.target.value)}
              disabled={isSplitting}
            />
            <Button onClick={handleSplit} disabled={isSplitting || !ranges}>
              {isSplitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Splitting...
                </>
              ) : "Split PDF"}
            </Button>
          </CardContent>
        </Card>
        
        {splitPdfUrls.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>3. Download Your Files</CardTitle>
              <CardDescription>Your split PDFs are ready for download.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {splitPdfUrls.map((pdf, index) => (
                  <li key={index}>
                    <Button asChild variant="secondary" className="w-full justify-start">
                      <a href={pdf.url} download={pdf.name}>
                        <FileDown className="mr-2 h-4 w-4" />
                        {pdf.name}
                      </a>
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
        </>
      )}
    </div>
  );
}
