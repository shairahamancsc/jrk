
"use client";

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Wrench, FilePenLine, GitMerge, FileImage, Scissors, Images } from 'lucide-react';

const tools = [
  {
    title: 'AI PDF Editor',
    description: 'Edit text, images, and links in your PDF files with AI assistance.',
    href: '/tools/pdf-edit',
    icon: FilePenLine,
    status: 'In Development',
  },
  {
    title: 'PDF Merger',
    description: 'Combine multiple PDF files into one, merged in the order they are listed.',
    href: '/tools/pdf-merge',
    icon: GitMerge,
    status: 'Ready',
  },
  {
    title: 'PDF to JPG Converter',
    description: 'Convert each page of your PDF into high-quality JPG images.',
    href: '/tools/pdf-to-jpg',
    icon: FileImage,
    status: 'Ready',
  },
  {
    title: 'PDF Splitter',
    description: 'Split a single PDF into multiple files based on page ranges or sections.',
    href: '/tools/pdf-split',
    icon: Scissors,
    status: 'Ready',
  },
  {
    title: 'JPG/PNG to PDF Converter',
    description: 'Convert multiple JPG images into a single, organized PDF document.',
    href: '/tools/jpg-to-pdf',
    icon: Images,
    status: 'Ready',
  },
];

export default function ToolsPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
          <Wrench size={32} /> Productivity Tools
        </h1>
        <p className="text-muted-foreground">
          A suite of AI-integrated tools to help you manage your documents.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <Link href={tool.href} key={tool.title} passHref>
            <Card className="h-full flex flex-col hover:border-primary transition-all duration-300 cursor-pointer">
              <CardHeader className="flex-row items-center gap-4 space-y-0">
                  <div className="p-3 bg-primary/10 rounded-full">
                     <tool.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex flex-col">
                    <CardTitle>{tool.title}</CardTitle>
                    {tool.status !== 'Ready' ? (
                       <span className="text-xs font-semibold bg-accent/80 text-accent-foreground px-2 py-0.5 rounded-full w-fit">
                        {tool.status}
                       </span>
                    ) : (
                       <span className="text-xs font-semibold bg-primary/80 text-primary-foreground px-2 py-0.5 rounded-full w-fit">
                        {tool.status}
                       </span>
                    )}
                  </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">{tool.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
