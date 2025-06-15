
"use client";

import React, { useState, useEffect } from 'react';
import { useData } from '@/contexts/data-context';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FileText, UserCircle2, Users, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';

export default function AllLaborPage() {
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
      // Display filename if it's just a string (persisted from File object)
      return <span className="text-xs flex items-center gap-1"><FileText size={14} /> {file}</span>;
    }
    // If it's a File object (only available before saving to localStorage or if not reloaded yet)
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
  };

  const getAvatarSrc = (photo: File | string | undefined): string => {
    if (!photo) return '';
    if (typeof photo === 'string') {
      // Only return string if it's a valid URL for an image
      if (photo.startsWith('http') || photo.startsWith('data:image') || photo.startsWith('https://placehold.co')) return photo;
      return ''; // Otherwise, fallback (e.g. if it's a filename string)
    }
    // If it's a File object
    return URL.createObjectURL(photo);
  }
  
  if (clientLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-8 p-4 md:p-8">
      <div className="text-center">
        <h1 className="text-4xl font-headline font-bold text-primary mb-2">Labor Profiles</h1>
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
                        <Avatar className="h-12 w-12">
                          <AvatarImage 
                            src={getAvatarSrc(profile.photo)}
                            alt={profile.name}
                            data-ai-hint="profile person"
                          />
                          <AvatarFallback>
                            <UserCircle2 className="text-muted-foreground h-6 w-6" />
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium text-base">{profile.name}</TableCell>
                      <TableCell className="text-sm">{profile.contact}</TableCell>
                      <TableCell>{getFileDisplay(profile.aadhaar)}</TableCell>
                      <TableCell>{getFileDisplay(profile.pan)}</TableCell>
                      <TableCell>{getFileDisplay(profile.drivingLicense)}</TableCell>
                      <TableCell className="text-sm">{format(new Date(profile.createdAt), "PP")}</TableCell>
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
