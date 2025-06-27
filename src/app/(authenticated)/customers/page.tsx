
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { CustomerProfileForm } from '@/components/customers/customer-profile-form';
import { useData } from '@/contexts/data-context';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { Briefcase, Loader2, MoreHorizontal, Eye, Edit3, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { CustomerProfile } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';

export default function CustomersPage() {
  const { customerProfiles, isLoading: dataLoading, deleteCustomerProfile } = useData();
  const { toast } = useToast();
  const [clientLoading, setClientLoading] = useState(true);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const [selectedProfile, setSelectedProfile] = useState<CustomerProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!dataLoading) {
      setClientLoading(false);
    }
  }, [dataLoading]);

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return <span className="text-muted-foreground text-xs">N/A</span>;
    return `₹${amount.toFixed(2)}`;
  };

  const handleOpenViewModal = (profile: CustomerProfile) => {
    setSelectedProfile(profile);
    setIsViewModalOpen(true);
  };

  const handleOpenEditModal = (profile: CustomerProfile) => {
    setSelectedProfile(profile);
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteAlert = (profile: CustomerProfile) => {
    setSelectedProfile(profile);
    setIsDeleteAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedProfile) return;
    setIsDeleting(true);
    try {
      await deleteCustomerProfile(selectedProfile.id);
      setIsDeleteAlertOpen(false);
      setSelectedProfile(null);
    } catch (error: any) {
      console.error("Error during profile deletion in page:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditModalCancel = useCallback(() => {
    setIsEditModalOpen(false);
  }, []);

  const handleEditModalSubmitSuccess = useCallback(() => {
    setIsEditModalOpen(false);
  }, []);
  
  if (clientLoading || dataLoading) { 
    return (
      <div className="flex h-[calc(100vh-theme(spacing.14)-2*theme(spacing.4))] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl sm:text-3xl font-headline font-bold text-primary">Manage Customers</h1>
      
      <CustomerProfileForm />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl text-primary font-headline">
            <Briefcase /> Existing Customer Profiles
          </CardTitle>
          <CardDescription>
            Total {customerProfiles.length} customer profile(s) recorded.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {customerProfiles.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Mobile No</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Ownership</TableHead>
                    <TableHead>Load (Tons)</TableHead>
                    <TableHead>Rate/Load</TableHead>
                    <TableHead>Added On</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerProfiles.map((profile) => (
                    <TableRow key={profile.id} className="hover:bg-muted/50 transition-colors text-xs sm:text-sm">
                      <TableCell className="font-medium">{profile.customer_id}</TableCell>
                      <TableCell>{profile.name}</TableCell>
                      <TableCell>{profile.mobile_no}</TableCell>
                      <TableCell className="max-w-xs truncate">{profile.address}</TableCell>
                      <TableCell>{profile.category}</TableCell>
                      <TableCell>{profile.ownership_type}</TableCell>
                      <TableCell>{profile.load_in_tons}</TableCell>
                      <TableCell>{formatCurrency(profile.payment_rate_per_load)}</TableCell>
                      <TableCell>{profile.created_at ? format(parseISO(profile.created_at), "PP") : 'N/A'}</TableCell>
                      <TableCell>
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
            <p className="text-center text-muted-foreground py-8">No customer profiles added yet.</p>
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
              <p><strong>Customer ID:</strong> {selectedProfile.customer_id}</p>
              <p><strong>Name:</strong> {selectedProfile.name}</p>
              <p><strong>Mobile No:</strong> {selectedProfile.mobile_no}</p>
              <p><strong>Address:</strong> {selectedProfile.address}</p>
              <p><strong>Category:</strong> {selectedProfile.category}</p>
              <p><strong>Ownership Type:</strong> {selectedProfile.ownership_type}</p>
              <p><strong>Load:</strong> {selectedProfile.load_in_tons} Tons</p>
              <p><strong>Payment Rate per Load:</strong> {formatCurrency(selectedProfile.payment_rate_per_load)}</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {selectedProfile && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent key={selectedProfile.id} className="w-[95vw] max-w-lg rounded-lg">
             <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left")}>
              <DialogTitle>Edit Profile: {selectedProfile.name}</DialogTitle>
               <DialogDescription>
                Modify the details for {selectedProfile.name}.
              </DialogDescription>
            </div>
            <div className="py-4">
              <CustomerProfileForm 
                existingProfile={selectedProfile} 
                mode="edit" 
                onCancel={handleEditModalCancel}
                onSubmitSuccess={handleEditModalSubmitSuccess}
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
                for <strong>{selectedProfile.name}</strong>.
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
