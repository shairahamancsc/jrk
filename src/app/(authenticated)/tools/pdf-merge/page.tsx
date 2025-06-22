"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Construction, GitMerge } from 'lucide-react';

export default function PdfMergePage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
          <GitMerge size={32} /> AI PDF Merger
        </h1>
        <p className="text-muted-foreground">
          This feature is currently under development.
        </p>
      </header>

      <Card className="shadow-lg">
        <CardHeader className="flex-row items-center gap-4">
           <Construction className="h-12 w-12 text-yellow-500" />
           <div>
            <CardTitle>Feature Coming Soon</CardTitle>
            <CardDescription>We are working hard to bring you this feature.</CardDescription>
           </div>
        </CardHeader>
        <CardContent>
          <p>You will soon be able to combine multiple PDF files into one, with AI helping to intelligently order and format the final document.</p>
        </CardContent>
      </Card>
    </div>
  );
}
