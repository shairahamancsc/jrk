
"use client";

import type { Metadata } from 'next';
import React, { useState, useEffect } from 'react';
import { useData } from '@/contexts/data-context';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FileText, UserCircle2, Users, Loader2, WalletCards } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'All Labor Profiles',
  description: 'Browse the public directory of all registered labor profiles in the JRKE Attendance system.',
};

export default function AllLaborPage() {
  const { laborProfiles, isLoading: dataLoading } = useData();
  const [clientLoading, setClientLoading] = useState(true);

  useEffect(() => {
    if (!dataLoading) {
      setClientLoading(false);
    }
  }, [dataLoading]);

  const getFileDisplay = (fileUrl?: string) => {
    if (!fileUrl) return <span className="text-muted-foreground text-xs">Not Provided</span>;
    
    if (fileUrl.startsWith('https://placehold.co') || fileUrl.startsWith('http')) {
       const fileName = fileUrl.substring(fileUrl.lastIndexOf('/') + 1).split('?')[0];
      return (
        <a 
          href={fileUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-accent hover:underline flex items-center gap-1 text-xs"
          data-ai-hint="document icon"
        >
          <FileText size={14} /> {decodeURIComponent(fileName.substring(fileName.indexOf('_', fileName.indexOf('_') + 1) + 1))}
        </a>
      );
    }
    return <span className="text-xs flex items-center gap-1"><FileText size={14} /> {fileUrl}</span>;
  };

  const getAvatarSrc = (photoUrl?: string): string => {
    if (!photoUrl) return '';
    if (photoUrl.startsWith('http') || photoUrl.startsWith('data:image')) {
      return photoUrl;
    }
    return '';
  }

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return <span className="text-muted-foreground text-xs">N/A</span>;
    return `₹${amount.toFixed(2)}`;
  };
  
  if (clientLoading || dataLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-8 p-4 md:p-8">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary mb-2">Labor Profiles</h1>
        <p className="text-lg text-muted-foreground">
          Browse all registered labor profiles.
        </p>
      </div>
      
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-primary font-headline">
            <Users /> All Labor Profiles
          </CardTitle>
          <CardDescription>
            Total {laborProfiles.length} labor profile(s) recorded.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {laborProfiles.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-2 py-3 md:px-4">Photo</TableHead>
                    <TableHead className="px-2 py-3 md:px-4">Name</TableHead>
                    <TableHead className="px-2 py-3 md:px-4">Contact</TableHead>
                    <TableHead className="whitespace-nowrap px-2 py-3 md:px-4">Daily Salary</TableHead>
                    <TableHead className="whitespace-nowrap px-2 py-3 md:px-4">Aadhaar No.</TableHead>
                    <TableHead className="whitespace-nowrap px-2 py-3 md:px-4">PAN No.</TableHead>
                    <TableHead className="px-2 py-3 md:px-4">Aadhaar Doc</TableHead>
                    <TableHead className="px-2 py-3 md:px-4">PAN Doc</TableHead>
                    <TableHead className="px-2 py-3 md:px-4">License Doc</TableHead>
                    <TableHead className="px-2 py-3 md:px-4">Added On</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {laborProfiles.map((profile) => (
                    <TableRow key={profile.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="px-2 py-3 md:px-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage 
                            src={getAvatarSrc(profile.photo_url)}
                            alt={profile.name}
                            data-ai-hint="profile person"
                          />
                          <AvatarFallback>
                            <UserCircle2 className="text-muted-foreground h-6 w-6" />
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium text-xs sm:text-sm px-2 py-3 md:px-4">{profile.name}</TableCell>
                      <TableCell className="text-xs sm:text-sm px-2 py-3 md:px-4">{profile.contact}</TableCell>
                      <TableCell className="text-xs sm:text-sm px-2 py-3 md:px-4">{formatCurrency(profile.daily_salary)}</TableCell>
                      <TableCell className="text-xs sm:text-sm px-2 py-3 md:px-4">{profile.aadhaar_number || <span className="text-muted-foreground text-xs">N/A</span>}</TableCell>
                      <TableCell className="text-xs sm:text-sm px-2 py-3 md:px-4">{profile.pan_number || <span className="text-muted-foreground text-xs">N/A</span>}</TableCell>
                      <TableCell className="px-2 py-3 md:px-4 text-xs sm:text-sm">{getFileDisplay(profile.aadhaar_url)}</TableCell>
                      <TableCell className="px-2 py-3 md:px-4 text-xs sm:text-sm">{getFileDisplay(profile.pan_url)}</TableCell>
                      <TableCell className="px-2 py-3 md:px-4 text-xs sm:text-sm">{getFileDisplay(profile.driving_license_url)}</TableCell>
                      <TableCell className="text-xs sm:text-sm px-2 py-3 md:px-4">{profile.created_at ? format(parseISO(profile.created_at), "PP") : 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-12 text-lg">No labor profiles available at the moment.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
