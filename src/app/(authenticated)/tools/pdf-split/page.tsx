
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Scissors, UploadCloud } from 'lucide-react';

export default function PdfSplitPage() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] || null);
  };
  
  const handleSplit = () => {
    toast({
      title: "Feature Coming Soon",
      description: "The AI PDF Splitter is currently under development.",
    });
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
          <Scissors size={32} /> AI PDF Splitter
        </h1>
        <p className="text-muted-foreground">
          This feature is currently under development. Upload a PDF to get started.
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
            <p className="mt-4 text-muted-foreground">{file ? file.name : "Drag & drop file here or click to browse"}</p>
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
        </CardContent>
      </Card>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>2. Split Document</CardTitle>
          <CardDescription>AI will analyze the document and suggest optimal split points (feature coming soon).</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleSplit} disabled={!file}>
            Split with AI
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
