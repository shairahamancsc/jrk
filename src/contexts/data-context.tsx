
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { LaborProfile, AttendanceEntry, LaborProfileFormDataWithFiles, Database, PaymentHistoryEntry } from '@/types';
import { useAuth } from './auth-context'; 
import { useToast } from "@/hooks/use-toast";
import { formatISO } from 'date-fns';

interface DataContextType {
  laborProfiles: LaborProfile[];
  attendanceEntries: AttendanceEntry[];
  paymentHistory: PaymentHistoryEntry[];
  addLaborProfile: (profileData: LaborProfileFormDataWithFiles) => Promise<void>;
  updateLaborProfile: (profileId: string, profileData: LaborProfileFormDataWithFiles) => Promise<void>; 
  deleteLaborProfile: (profileId: string) => Promise<void>;
  addAttendanceEntry: (entryData: Omit<AttendanceEntry, 'id' | 'created_at' | 'user_id'>) => Promise<void>;
  addPaymentHistoryEntry: (paymentData: Omit<PaymentHistoryEntry, 'id' | 'created_at' | 'user_id'>) => Promise<void>;
  fetchPaymentHistory: () => Promise<void>;
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE_BUCKET_NAME = 'profile-documents'; 

const getPathFromUrl = (url: string): string | null => {
  try {
    const urlObject = new URL(url);
    const pathSegments = urlObject.pathname.split('/');
    const bucketNameIndex = pathSegments.indexOf(STORAGE_BUCKET_NAME);
    if (bucketNameIndex > -1 && bucketNameIndex + 1 < pathSegments.length) {
      return pathSegments.slice(bucketNameIndex + 1).join('/');
    }
    console.warn(`[DataProvider] Could not find bucket '${STORAGE_BUCKET_NAME}' in URL path:`, urlObject.pathname);
    return null;
  } catch (e) {
    console.error("[DataProvider] Error parsing URL for file path:", e, "URL:", url);
    return null;
  }
};


export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [laborProfiles, setLaborProfiles] = useState<LaborProfile[]>([]);
  const [attendanceEntries, setAttendanceEntries] = useState<AttendanceEntry[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchLaborProfiles = async () => {
    if (!user?.id) {
      setLaborProfiles([]);
      return;
    }
    const { data, error } = await supabase
      .from('labor_profiles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[DataProvider] Error fetching labor profiles:', error);
      toast({ variant: "destructive", title: "Fetch Error", description: "Could not fetch labor profiles." });
      setLaborProfiles([]);
    } else {
      setLaborProfiles(data || []);
    }
  };

  const fetchAttendanceEntries = async () => {
    if (!user?.id) {
      setAttendanceEntries([]);
      return;
    }
    const { data, error } = await supabase
      .from('attendance_entries')
      .select('*') 
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[DataProvider] Error fetching attendance entries:', error);
      toast({ variant: "destructive", title: "Fetch Error", description: "Could not fetch attendance records." });
      setAttendanceEntries([]);
    } else {
      setAttendanceEntries(data || []);
    }
  };
  
  const fetchPaymentHistory = async () => {
    if (!user?.id) {
      setPaymentHistory([]);
      return;
    }
    const { data, error } = await supabase
      .from('payment_history')
      .select('*')
      .eq('user_id', user.id)
      .order('payment_date', { ascending: false });

    if (error) {
      console.error('[DataProvider] Error fetching payment history:', error);
      toast({ variant: "destructive", title: "Fetch Error", description: "Could not fetch payment history." });
      setPaymentHistory([]);
    } else {
      setPaymentHistory(data || []);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      if (user?.id) {
        await Promise.all([
          fetchLaborProfiles(),
          fetchAttendanceEntries(),
          fetchPaymentHistory(),
        ]);
      } else {
        setLaborProfiles([]);
        setAttendanceEntries([]);
        setPaymentHistory([]);
      }
      setIsLoading(false);
    };
    loadData();
  }, [user?.id]);

  const uploadFile = async (file: File, profileName: string): Promise<string | undefined> => {
    if (!user?.id) {
      toast({ variant: "destructive", title: "Auth Error", description: "User not authenticated for file upload." });
      return undefined;
    }
    const sanitizedProfileName = profileName.replace(/[^a-zA-Z0-9-_]/g, '_');
    const filePathInBucket = `public/${user.id}/${sanitizedProfileName}_${Date.now()}_${file.name}`;
    
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET_NAME)
      .upload(filePathInBucket, file);

    if (error) {
      console.error('[DataProvider] Error uploading file:', error);
      toast({ 
        variant: "destructive", 
        title: "Upload Error", 
        description: `Could not upload ${file.name}. ${error.message}` 
      });
      return undefined;
    }

    const { data: { publicUrl } } = supabase.storage.from(STORAGE_BUCKET_NAME).getPublicUrl(filePathInBucket);
    return publicUrl;
  };

  const deleteFile = async (fileUrl: string | undefined | null): Promise<boolean> => {
    if (!fileUrl) return false;
    const filePath = getPathFromUrl(fileUrl);
    if (!filePath) {
      console.warn("[DataProvider] Could not determine path for deletion from URL:", fileUrl);
      return false; 
    }

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('[DataProvider] Error deleting file from storage:', filePath, error);
      return false;
    }
    return true;
  };

  const addLaborProfile = async (profileFormData: LaborProfileFormDataWithFiles) => {
    if (!user?.id) {
      toast({ variant: "destructive", title: "Auth Error", description: "User not authenticated to add profile." });
      return;
    }
    setIsLoading(true);

    try {
      const profileToInsert: Database['public']['Tables']['labor_profiles']['Insert'] = {
        user_id: user.id,
        name: profileFormData.name,
        contact: profileFormData.contact,
        aadhaar_number: profileFormData.aadhaarNumber,
        pan_number: profileFormData.panNumber ? profileFormData.panNumber.toUpperCase() : undefined,
        daily_salary: profileFormData.dailySalary,
        photo_url: profileFormData.photo instanceof File ? await uploadFile(profileFormData.photo, profileFormData.name) : undefined,
        aadhaar_url: profileFormData.aadhaar instanceof File ? await uploadFile(profileFormData.aadhaar, profileFormData.name) : undefined,
        pan_url: profileFormData.pan instanceof File ? await uploadFile(profileFormData.pan, profileFormData.name) : undefined,
        driving_license_url: profileFormData.drivingLicense instanceof File ? await uploadFile(profileFormData.drivingLicense, profileFormData.name) : undefined,
      };
      
      const { error } = await supabase
        .from('labor_profiles')
        .insert(profileToInsert);

      if (error) throw new Error(error.message);
      
      await fetchLaborProfiles(); 
      toast({ title: "Success", description: "Labor profile added." });
    } catch (error: any) {
      console.error('[DataProvider] Error adding labor profile:', error);
      toast({ variant: "destructive", title: "Database Error", description: `Could not add labor profile: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };
  
  const updateLaborProfile = async (profileId: string, profileData: LaborProfileFormDataWithFiles) => {
    if (!user?.id) {
      toast({ variant: "destructive", title: "Auth Error", description: "User not authenticated." });
      throw new Error("User not authenticated.");
    }
    setIsLoading(true);

    try {
      const existingProfile = laborProfiles.find(p => p.id === profileId);
      if (!existingProfile) throw new Error("Original profile not found for update.");

      const updatePayload: Database['public']['Tables']['labor_profiles']['Update'] = {
        name: profileData.name,
        contact: profileData.contact,
        aadhaar_number: profileData.aadhaarNumber || null,
        pan_number: profileData.panNumber ? profileData.panNumber.toUpperCase() : null,
        daily_salary: profileData.dailySalary || null,
        photo_url: existingProfile.photo_url,
        aadhaar_url: existingProfile.aadhaar_url,
        pan_url: existingProfile.pan_url,
        driving_license_url: existingProfile.driving_license_url,
      };

      const handleFileUpdate = async (newFile: File | undefined, oldUrl: string | null | undefined): Promise<string | null | undefined> => {
        if (newFile instanceof File) {
          if (oldUrl) {
            await deleteFile(oldUrl);
          }
          return await uploadFile(newFile, profileData.name);
        }
        return oldUrl; 
      };

      updatePayload.photo_url = await handleFileUpdate(profileData.photo, existingProfile.photo_url);
      updatePayload.aadhaar_url = await handleFileUpdate(profileData.aadhaar, existingProfile.aadhaar_url);
      updatePayload.pan_url = await handleFileUpdate(profileData.pan, existingProfile.pan_url);
      updatePayload.driving_license_url = await handleFileUpdate(profileData.drivingLicense, existingProfile.driving_license_url);

      const { error: updateError } = await supabase
        .from('labor_profiles')
        .update(updatePayload)
        .eq('id', profileId)
        .eq('user_id', user.id);

      if (updateError) {
        throw new Error(`Database update failed: ${updateError.message}`);
      }
      
      await fetchLaborProfiles();
      toast({ title: "Success", description: `Profile for ${updatePayload.name} updated.` });
        
    } catch (error: any) {
        console.error("An error occurred during the update process:", error);
        toast({ variant: "destructive", title: "Update Error", description: error.message || "An unexpected error occurred." });
        throw error;
    } finally {
        setIsLoading(false);
    }
  };

  const deleteLaborProfile = async (profileId: string) => {
    if (!user?.id) {
      toast({ variant: "destructive", title: "Auth Error", description: "User not authenticated." });
      throw new Error("User not authenticated");
    }

    const profileToDelete = laborProfiles.find(p => p.id === profileId);
    if (!profileToDelete) {
      toast({ variant: "destructive", title: "Error", description: "Profile not found." });
      throw new Error("Profile not found");
    }

    setIsLoading(true);
    try {
      const filesToDelete: (string | null | undefined)[] = [
        profileToDelete.photo_url,
        profileToDelete.aadhaar_url,
        profileToDelete.pan_url,
        profileToDelete.driving_license_url,
      ];

      for (const fileUrl of filesToDelete) {
        if (fileUrl) {
          await deleteFile(fileUrl);
        }
      }

      const { error: dbError } = await supabase
        .from('labor_profiles')
        .delete()
        .eq('id', profileId)
        .eq('user_id', user.id); 

      if (dbError) throw dbError;

      setLaborProfiles(prevProfiles => prevProfiles.filter(p => p.id !== profileId));
      toast({ title: "Success", description: `Profile for ${profileToDelete.name} deleted.` });

    } catch (error: any) {
      console.error('[DataProvider] Overall error in deleteLaborProfile:', error);
      toast({ variant: "destructive", title: "Delete Error", description: `Could not delete profile: ${error.message}` });
      await fetchLaborProfiles();
    } finally {
      setIsLoading(false);
    }
  };
  
  const addAttendanceEntry = async (entryData: Omit<AttendanceEntry, 'id' | 'created_at' | 'user_id'>) => {
     if (!user?.id) {
      toast({ variant: "destructive", title: "Auth Error", description: "User not authenticated to add attendance." });
      return;
    }
    setIsLoading(true);

    const labor = laborProfiles.find(lp => lp.id === entryData.labor_id);

    const entryToInsert: Omit<Database['public']['Tables']['attendance_entries']['Insert'], 'id' | 'created_at'> = {
      user_id: user.id,
      labor_id: entryData.labor_id,
      labor_name: labor?.name || entryData.labor_name || 'Unknown Labor',
      date: new Date(entryData.date).toISOString().split('T')[0], 
      status: entryData.status,
      work_details: entryData.work_details,
      advance_amount: entryData.advance_amount,
    };

    const { error } = await supabase
      .from('attendance_entries')
      .insert(entryToInsert);

    if (error) {
      console.error('[DataProvider] Error adding attendance entry:', error);
      toast({ variant: "destructive", title: "Database Error", description: `Could not add attendance entry: ${error.message}` });
    } else {
      await fetchAttendanceEntries(); 
      toast({ title: "Success", description: "Attendance entry recorded." });
    }
    setIsLoading(false);
  };

  const addPaymentHistoryEntry = async (paymentData: Omit<PaymentHistoryEntry, 'id' | 'created_at' | 'user_id'>) => {
    if (!user?.id) {
      toast({ variant: "destructive", title: "Auth Error", description: "User not authenticated to record payment." });
      return;
    }
    setIsLoading(true);

    const entryToInsert: Database['public']['Tables']['payment_history']['Insert'] = {
      user_id: user.id,
      labor_id: paymentData.labor_id,
      labor_name: paymentData.labor_name,
      payment_date: formatISO(new Date(paymentData.payment_date), { representation: 'date' }),
      period_start_date: formatISO(new Date(paymentData.period_start_date), { representation: 'date' }),
      period_end_date: formatISO(new Date(paymentData.period_end_date), { representation: 'date' }),
      amount_paid: paymentData.amount_paid,
      notes: paymentData.notes,
    };

    const { error } = await supabase
      .from('payment_history')
      .insert(entryToInsert);

    if (error) {
      console.error('[DataProvider] Error adding payment history entry:', error);
      toast({ variant: "destructive", title: "Database Error", description: `Could not record payment: ${error.message}` });
    } else {
      await fetchPaymentHistory();
      toast({ title: "Success", description: "Payment recorded successfully." });
    }
    setIsLoading(false);
  };

  return (
    <DataContext.Provider value={{ 
        laborProfiles, 
        attendanceEntries, 
        paymentHistory,
        addLaborProfile, 
        updateLaborProfile,
        deleteLaborProfile,
        addAttendanceEntry, 
        addPaymentHistoryEntry,
        fetchPaymentHistory,
        isLoading 
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

    