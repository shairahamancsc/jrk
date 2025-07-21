
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, UserCircle2, Users, Loader2, MoreHorizontal, Edit3, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { LaborProfile } from '@/types';

export default function LaborPage() {
  const { laborProfiles, isLoading: dataLoading, deleteLaborProfile } = useData();
  const [clientLoading, setClientLoading] = useState(true);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [selectedProfile, setSelectedProfile] = useState<LaborProfile | null>(null);

  useEffect(() => {
    if (!dataLoading) {
      setClientLoading(false);
    }
  }, [dataLoading]);
  
  const handleOpenEditModal = (profile: LaborProfile) => {
    setSelectedProfile(profile);
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteAlert = (profile: LaborProfile) => {
    setSelectedProfile(profile);
    setIsDeleteAlertOpen(true);
  };

  const handleCloseDialogs = () => {
    setSelectedProfile(null);
    setIsEditModalOpen(false);
    setIsDeleteAlertOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!selectedProfile) return;
    setIsDeleting(true);
    try {
      await deleteLaborProfile(selectedProfile.id);
      handleCloseDialogs();
    } catch (error) {
      console.error("Deletion failed in page:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getFileDisplay = (fileUrl?: string) => {
    if (!fileUrl) return <span className="text-muted-foreground text-xs">Not Provided</span>;
    try {
      const url = new URL(fileUrl);
      const fileName = decodeURIComponent(url.pathname.split('/').pop() || '');
      // Attempt to extract a more user-friendly name, e.g., after the timestamp
      const friendlyName = fileName.substring(fileName.indexOf('_', fileName.indexOf('_') + 1) + 1);
      return (
        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline flex items-center gap-1 text-xs break-all">
          <FileText size={14} /> {friendlyName || 'View File'}
        </a>
      );
    } catch (e) {
      return <span>Invalid URL</span>;
    }
  };

  const getAvatarSrc = (photoUrl?: string): string => {
    return photoUrl || '';
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return <span className="text-muted-foreground text-xs">N/A</span>;
    return `₹${amount.toFixed(2)}`;
  };
  
  if (clientLoading || dataLoading) { 
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl sm:text-3xl font-headline font-bold text-primary">Manage Labor Profiles</h1>
      
      <LaborProfileForm mode="add" />

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
                    <TableHead>Photo</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Daily Salary</TableHead>
                    <TableHead>Aadhaar No.</TableHead>
                    <TableHead>PAN No.</TableHead>
                    <TableHead>Aadhaar Doc</TableHead>
                    <TableHead>PAN Doc</TableHead>
                    <TableHead>License Doc</TableHead>
                    <TableHead>Added On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {laborProfiles.map((profile) => (
                    <TableRow key={profile.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={getAvatarSrc(profile.photo_url)} alt={profile.name} data-ai-hint="profile person" />
                          <AvatarFallback><UserCircle2 className="text-muted-foreground" /></AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium text-xs sm:text-sm">{profile.name}</TableCell>
                      <TableCell className="text-xs sm:text-sm">{profile.contact}</TableCell>
                      <TableCell className="text-xs sm:text-sm">{formatCurrency(profile.daily_salary)}</TableCell>
                      <TableCell className="text-xs sm:text-sm">{profile.aadhaar_number || <span className="text-muted-foreground text-xs">N/A</span>}</TableCell>
                      <TableCell className="text-xs sm:text-sm">{profile.pan_number || <span className="text-muted-foreground text-xs">N/A</span>}</TableCell>
                      <TableCell className="text-xs sm:text-sm">{getFileDisplay(profile.aadhaar_url)}</TableCell>
                      <TableCell className="text-xs sm:text-sm">{getFileDisplay(profile.pan_url)}</TableCell>
                      <TableCell className="text-xs sm:text-sm">{getFileDisplay(profile.driving_license_url)}</TableCell>
                      <TableCell className="text-xs sm:text-sm">{profile.created_at ? format(parseISO(profile.created_at), "PP") : 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
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

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Profile: {selectedProfile?.name}</DialogTitle>
            <DialogDescription>
              Modify the details for {selectedProfile?.name}. Click Save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-[70vh] overflow-y-auto">
            {selectedProfile && (
              <LaborProfileForm 
                mode="edit"
                existingProfile={selectedProfile} 
                onSubmitSuccess={handleCloseDialogs}
                onCancel={handleCloseDialogs}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Alert */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the profile
              for <strong>{selectedProfile?.name}</strong> and all associated documents.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} onClick={handleCloseDialogs}>Cancel</AlertDialogCancel>
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
    </div>
  );
}

    