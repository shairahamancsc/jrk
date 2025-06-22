"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Construction, Images } from 'lucide-react';

export default function JpgToPdfPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
          <Images size={32} /> JPG to PDF Converter
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
          <p>You will soon be able to convert multiple JPG images into a single, organized PDF document.</p>
        </CardContent>
      </Card>
    </div>
  );
}
