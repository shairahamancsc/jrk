
"use client";

import React, { useState, useEffect } from 'react';
import { LaborProfileForm } from '@/components/labor/labor-profile-form';
import { useData } from '@/contexts/data-context';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FileText, UserCircle2, Users, Loader2, Fingerprint, ScanLine } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import Image from 'next/image';

export default function LaborPage() {
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
  
  if (clientLoading || dataLoading) { 
    return (
      <div className="flex h-[calc(100vh-theme(spacing.14)-2*theme(spacing.4))] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-headline font-bold text-primary">Manage Labor Profiles</h1>
      
      <LaborProfileForm />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-primary font-headline">
            <Users /> Existing Labor Profiles
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
                    <TableHead>Photo</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="whitespace-nowrap">Aadhaar No.</TableHead>
                    <TableHead className="whitespace-nowrap">PAN No.</TableHead>
                    <TableHead>Aadhaar Doc</TableHead>
                    <TableHead>PAN Doc</TableHead>
                    <TableHead>License Doc</TableHead>
                    <TableHead>Added On</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {laborProfiles.map((profile) => (
                    <TableRow key={profile.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <Avatar className="h-10 w-10">
                          <AvatarImage 
                            src={getAvatarSrc(profile.photo_url)}
                            alt={profile.name} 
                            data-ai-hint="profile person"
                          />
                          <AvatarFallback>
                            <UserCircle2 className="text-muted-foreground" />
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{profile.name}</TableCell>
                      <TableCell>{profile.contact}</TableCell>
                      <TableCell>{profile.aadhaar_number || <span className="text-muted-foreground text-xs">N/A</span>}</TableCell>
                      <TableCell>{profile.pan_number || <span className="text-muted-foreground text-xs">N/A</span>}</TableCell>
                      <TableCell>{getFileDisplay(profile.aadhaar_url)}</TableCell>
                      <TableCell>{getFileDisplay(profile.pan_url)}</TableCell>
                      <TableCell>{getFileDisplay(profile.driving_license_url)}</TableCell>
                      <TableCell>{profile.created_at ? format(parseISO(profile.created_at), "PP") : 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No labor profiles added yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
