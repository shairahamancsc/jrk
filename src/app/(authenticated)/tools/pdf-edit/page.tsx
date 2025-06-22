
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { FilePenLine, UploadCloud, Wand2, FileText, Loader2 } from 'lucide-react';

export default function PdfEditPage() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] || null);
  };
  
  const handleEdit = () => {
    // This is where the AI processing will be triggered in the future.
    setIsProcessing(true);
    toast({
      title: "Feature In Development",
      description: "The AI PDF editing functionality is not yet connected.",
    });
    // For now, we'll just simulate a delay and stop the loader
    setTimeout(() => {
        setIsProcessing(false);
    }, 1500);
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
          <FilePenLine size={32} /> AI PDF Editor
        </h1>
        <p className="text-muted-foreground">
          Use natural language to edit your PDF. This feature is currently in development.
        </p>
      </header>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5"/>1. Upload PDF</CardTitle>
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
          <CardTitle className="flex items-center gap-2"><Wand2 className="h-5 w-5"/>2. Describe Your Edits</CardTitle>
          <CardDescription>
            Tell the AI what you want to change. For example: "Change the title on page 1 to 'Annual Report 2024'" 
            or "Replace the logo on page 2 with the attached image." (Image replacement coming soon).
            </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="e.g., Change all instances of '2023' to '2024'..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            disabled={!file}
          />
        </CardContent>
      </Card>

      <div className="flex justify-start">
        <Button onClick={handleEdit} disabled={!file || !prompt || isProcessing} size="lg">
          {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isProcessing ? "Processing..." : "Apply AI Edits"}
        </Button>
      </div>
      <Card className="bg-accent/20 border-accent/50">
        <CardHeader>
            <CardTitle className="text-accent text-lg">Note</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-accent-foreground/80">
                The AI PDF Editor is a powerful tool currently in development. The backend processing is not yet connected. 
                This interface is a preview of how it will function.
            </p>
        </CardContent>
      </Card>

    </div>
  );
}
