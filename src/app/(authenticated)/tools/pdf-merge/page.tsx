
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { GitMerge, UploadCloud, X } from 'lucide-react';

export default function PdfMergePage() {
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(prev => [...prev, ...Array.from(event.target.files || [])]);
  };
  
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleMerge = () => {
    toast({
      title: "Feature Coming Soon",
      description: "The AI PDF Merger is currently under development.",
    });
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
          <GitMerge size={32} /> AI PDF Merger
        </h1>
        <p className="text-muted-foreground">
          This feature is currently under development. Upload multiple PDFs to combine them.
        </p>
      </header>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>1. Upload PDFs</CardTitle>
          <CardDescription>Select two or more PDF files to merge.</CardDescription>
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
                  <li key={index} className="flex items-center justify-between p-2 border rounded-md">
                    <span className="text-sm truncate">{file.name}</span>
                     <button
                      onClick={() => removeFile(index)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <X size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>2. Merge Files</CardTitle>
          <CardDescription>AI will help intelligently order the merged document (feature coming soon).</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleMerge} disabled={files.length < 2}>
            Merge PDFs
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
