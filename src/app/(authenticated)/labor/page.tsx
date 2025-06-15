
"use client";

import React, { useState, useEffect } from 'react';
import { LaborProfileForm } from '@/components/labor/labor-profile-form';
import { useData } from '@/contexts/data-context';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FileText, UserCircle2, Users, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';

export default function LaborPage() {
  const { laborProfiles, isLoading: dataLoading } = useData();
  const [clientLoading, setClientLoading] = useState(true);

  useEffect(() => {
    if (!dataLoading) {
      setClientLoading(false);
    }
  }, [dataLoading]);

  const getFileDisplay = (file?: File | string) => {
    if (!file) return <span className="text-muted-foreground text-xs">Not Provided</span>;
    
    if (typeof file === 'string') {
      if (file.startsWith('https://placehold.co') || file.startsWith('http')) {
         return <Image src={file} alt="document" width={20} height={20} data-ai-hint="document icon" className="rounded" />;
      }
      // It's a filename string
      return <span className="text-xs flex items-center gap-1"><FileText size={14} /> {file}</span>;
    }
    
    // If it's a File object (only available before saving to localStorage or if not reloaded yet)
    if (file instanceof File) {
      return (
        <a
          href={URL.createObjectURL(file)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline flex items-center gap-1 text-xs"
        >
          <FileText size={14} /> View Document
        </a>
      );
    }
    return <span className="text-muted-foreground text-xs">Invalid File Data</span>;
  };

  const getAvatarSrc = (photo?: File | string): string => {
    if (!photo) return '';
    if (typeof photo === 'string') {
      if (photo.startsWith('http') || photo.startsWith('data:image') || photo.startsWith('https://placehold.co')) {
        return photo;
      }
      return ''; // Filename string, cannot be used as src, trigger fallback
    }
    if (photo instanceof File) {
      return URL.createObjectURL(photo);
    }
    return '';
  }
  
  if (clientLoading) {
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
                    <TableHead>Aadhaar</TableHead>
                    <TableHead>PAN</TableHead>
                    <TableHead>License</TableHead>
                    <TableHead>Added On</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {laborProfiles.map((profile) => (
                    <TableRow key={profile.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <Avatar className="h-10 w-10">
                          <AvatarImage 
                            src={getAvatarSrc(profile.photo)}
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
                      <TableCell>{getFileDisplay(profile.aadhaar)}</TableCell>
                      <TableCell>{getFileDisplay(profile.pan)}</TableCell>
                      <TableCell>{getFileDisplay(profile.drivingLicense)}</TableCell>
                      <TableCell>{profile.createdAt ? format(new Date(profile.createdAt), "PP") : 'N/A'}</TableCell>
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
