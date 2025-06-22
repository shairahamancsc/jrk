"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Construction, FilePenLine } from 'lucide-react';

export default function PdfEditPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
          <FilePenLine size={32} /> AI PDF Editor
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
            <CardDescription>We are working hard to bring you an AI-powered PDF editing experience.</CardDescription>
           </div>
        </CardHeader>
        <CardContent>
          <p>You will soon be able to edit text, replace images, and modify your PDF documents directly in the browser with the help of AI.</p>
        </CardContent>
      </Card>
    </div>
  );
}
