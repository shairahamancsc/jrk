
"use client";

import React, { useState, useEffect } from 'react';
import { LaborProfileForm } from '@/components/labor/labor-profile-form';
import { useData } from '@/contexts/data-context';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogTitle, 
  DialogDescription, 
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, UserCircle2, Users, Loader2, MoreHorizontal, Eye, Edit3, Trash2, WalletCards } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { LaborProfile } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';

export default function LaborPage() {
  const { laborProfiles, isLoading: dataLoading, deleteLaborProfile } = useData();
  const { toast } = useToast();
  const [clientLoading, setClientLoading] = useState(true);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const [selectedProfile, setSelectedProfile] = useState<LaborProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);


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

  const handleOpenViewModal = (profile: LaborProfile) => {
    setSelectedProfile(profile);
    setIsViewModalOpen(true);
  };

  const handleOpenEditModal = (profile: LaborProfile) => {
    setSelectedProfile(profile);
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteAlert = (profile: LaborProfile) => {
    setSelectedProfile(profile);
    setIsDeleteAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedProfile) return;
    setIsDeleting(true);
    try {
      await deleteLaborProfile(selectedProfile.id);
      setIsDeleteAlertOpen(false);
      setSelectedProfile(null);
    } catch (error: any) {
      console.error("Error during profile deletion in page:", error);
    } finally {
      setIsDeleting(false);
    }
  };
  
  if (clientLoading || dataLoading) { 
    return (
      <div className="flex h-[calc(100vh-theme(spacing.14)-2*theme(spacing.4))] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl sm:text-3xl font-headline font-bold text-primary">Manage Labor Profiles</h1>
      
      <LaborProfileForm />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl text-primary font-headline">
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
                    <TableHead className="px-2 py-3 md:px-4">Actions</TableHead>
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
                            <UserCircle2 className="text-muted-foreground" />
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium px-2 py-3 md:px-4 text-xs sm:text-sm">{profile.name}</TableCell>
                      <TableCell className="px-2 py-3 md:px-4 text-xs sm:text-sm">{profile.contact}</TableCell>
                      <TableCell className="px-2 py-3 md:px-4 text-xs sm:text-sm">{formatCurrency(profile.daily_salary)}</TableCell>
                      <TableCell className="px-2 py-3 md:px-4 text-xs sm:text-sm">{profile.aadhaar_number || <span className="text-muted-foreground text-xs">N/A</span>}</TableCell>
                      <TableCell className="px-2 py-3 md:px-4 text-xs sm:text-sm">{profile.pan_number || <span className="text-muted-foreground text-xs">N/A</span>}</TableCell>
                      <TableCell className="px-2 py-3 md:px-4 text-xs sm:text-sm">{getFileDisplay(profile.aadhaar_url)}</TableCell>
                      <TableCell className="px-2 py-3 md:px-4 text-xs sm:text-sm">{getFileDisplay(profile.pan_url)}</TableCell>
                      <TableCell className="px-2 py-3 md:px-4 text-xs sm:text-sm">{getFileDisplay(profile.driving_license_url)}</TableCell>
                      <TableCell className="px-2 py-3 md:px-4 text-xs sm:text-sm">{profile.created_at ? format(parseISO(profile.created_at), "PP") : 'N/A'}</TableCell>
                      <TableCell className="px-2 py-3 md:px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleOpenViewModal(profile)}>
                              <Eye className="mr-2 h-4 w-4" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenEditModal(profile)}>
                              <Edit3 className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleOpenDeleteAlert(profile)}
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
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

      {selectedProfile && (
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="w-[90vw] max-w-xs sm:max-w-md rounded-lg">
            <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left")}>
              <DialogTitle>View Profile: {selectedProfile.name}</DialogTitle>
              <DialogDescription>
                Detailed information for {selectedProfile.name}.
              </DialogDescription>
            </div>
            <div className="space-y-4 py-4 text-sm">
              <p><strong>Name:</strong> {selectedProfile.name}</p>
              <p><strong>Contact:</strong> {selectedProfile.contact}</p>
              <p><strong>Daily Salary:</strong> {formatCurrency(selectedProfile.daily_salary)}</p>
              <p><strong>Aadhaar Number:</strong> {selectedProfile.aadhaar_number || 'N/A'}</p>
              <p><strong>PAN Number:</strong> {selectedProfile.pan_number || 'N/A'}</p>
              <p><strong>Photo:</strong></p>
              {selectedProfile.photo_url && <img src={getAvatarSrc(selectedProfile.photo_url)} alt="Profile" className="rounded-md max-h-40 sm:max-h-48 mx-auto sm:mx-0" data-ai-hint="profile person"/>}
              <p><strong>Aadhaar Document:</strong> {getFileDisplay(selectedProfile.aadhaar_url)}</p>
              <p><strong>PAN Document:</strong> {getFileDisplay(selectedProfile.pan_url)}</p>
              <p><strong>License Document:</strong> {getFileDisplay(selectedProfile.driving_license_url)}</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {selectedProfile && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="w-[95vw] max-w-xs sm:max-w-lg rounded-lg">
            <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left")}>
              <DialogTitle>Edit Profile: {selectedProfile.name}</DialogTitle>
               <DialogDescription>
                Modify the details for {selectedProfile.name}.
              </DialogDescription>
            </div>
            <div className="py-4">
              <LaborProfileForm 
                existingProfile={selectedProfile} 
                mode="edit" 
                onCancel={() => setIsEditModalOpen(false)}
                onSubmitSuccess={() => setIsEditModalOpen(false)}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {selectedProfile && (
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
          <AlertDialogContent className="w-[90vw] max-w-xs sm:max-w-md rounded-lg">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the profile
                for <strong>{selectedProfile.name}</strong> and all associated documents.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting} onClick={() => setSelectedProfile(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isDeleting ? 'Deleting...' : 'Yes, delete profile'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
