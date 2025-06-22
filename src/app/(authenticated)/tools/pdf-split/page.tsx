"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Construction, Scissors } from 'lucide-react';

export default function PdfSplitPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
          <Scissors size={32} /> AI PDF Splitter
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
          <p>You will soon be able to split a single PDF into multiple documents, either by page ranges or by letting AI detect chapters and sections automatically.</p>
        </CardContent>
      </Card>
    </div>
  );
}
