
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { LaborProfile, AttendanceEntry, LaborProfileFormDataWithFiles, Database, PaymentHistoryEntry, CustomerProfile } from '@/types';
import { useAuth } from './auth-context'; 
import { useToast } from "@/hooks/use-toast";
import { formatISO } from 'date-fns';
import { CustomerProfileFormData } from '@/schemas/customer-schema';

interface DataContextType {
  laborProfiles: LaborProfile[];
  attendanceEntries: AttendanceEntry[];
  paymentHistory: PaymentHistoryEntry[];
  customerProfiles: CustomerProfile[];
  addLaborProfile: (profileData: LaborProfileFormDataWithFiles) => Promise<void>;
  updateLaborProfile: (profileId: string, profileData: Partial<LaborProfileFormDataWithFiles>) => Promise<void>; 
  deleteLaborProfile: (profileId: string) => Promise<void>;
  fetchLaborProfileById: (profileId: string) => Promise<LaborProfile | null>;
  addAttendanceEntry: (entryData: Omit<AttendanceEntry, 'id' | 'created_at' | 'user_id'>) => Promise<void>;
  addPaymentHistoryEntry: (paymentData: Omit<PaymentHistoryEntry, 'id' | 'created_at' | 'user_id'>) => Promise<void>;
  fetchPaymentHistory: () => Promise<void>;
  addCustomerProfile: (profileData: CustomerProfileFormData) => Promise<void>;
  updateCustomerProfile: (profileId: string, profileData: Partial<CustomerProfileFormData>) => Promise<void>;
  deleteCustomerProfile: (profileId: string) => Promise<void>;
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE_BUCKET_NAME = 'profile-documents'; 

const getPathFromUrl = (url: string): string | null => {
  try {
    const urlObject = new URL(url);
    const pathSegments = urlObject.pathname.split('/');
    const bucketNameIndex = pathSegments.indexOf(STORAGE_BUCKET_NAME);
    if (bucketNameIndex !== -1 && bucketNameIndex + 1 < pathSegments.length) {
      return pathSegments.slice(bucketNameIndex + 1).join('/');
    }
    console.warn("[DataProvider] Could not derive storage path from URL:", url);
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
  const [customerProfiles, setCustomerProfiles] = useState<CustomerProfile[]>([]);
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

  const fetchCustomerProfiles = async () => {
    if (!user?.id) {
      setCustomerProfiles([]);
      return;
    }
    const { data, error } = await supabase
      .from('customer_profiles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[DataProvider] Error fetching customer profiles:', error);
      toast({ variant: "destructive", title: "Fetch Error", description: "Could not fetch customer profiles." });
      setCustomerProfiles([]);
    } else {
      setCustomerProfiles(data || []);
    }
  };


  const fetchLaborProfileById = async (profileId: string): Promise<LaborProfile | null> => {
    if (!user?.id) {
        toast({ variant: "destructive", title: "Auth Error", description: "User not authenticated." });
        return null;
    }
    const { data, error } = await supabase
        .from('labor_profiles')
        .select('*')
        .eq('id', profileId)
        .eq('user_id', user.id)
        .single();
    
    if (error) {
        console.error(`[DataProvider] Error fetching labor profile by ID ${profileId}:`, error);
        if (error.code !== 'PGRST116') { 
             toast({ variant: "destructive", title: "Fetch Error", description: `Could not fetch profile: ${error.message}` });
        }
        return null;
    }
    return data;
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
          fetchCustomerProfiles()
        ]);
      } else {
        setLaborProfiles([]);
        setAttendanceEntries([]);
        setPaymentHistory([]);
        setCustomerProfiles([]);
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
    
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET_NAME)
      .upload(filePathInBucket, file, {
        cacheControl: '3600',
        upsert: false, 
      });

    if (error) {
      console.error('[DataProvider] Error uploading file. Raw error object:', error);
      try {
        console.error('[DataProvider] Error uploading file (JSON.stringify):', JSON.stringify(error, null, 2));
      } catch (e) {
        console.error('[DataProvider] Could not stringify error object for upload:', e);
      }
      toast({ 
        variant: "destructive", 
        title: "Upload Error", 
        description: `Could not upload ${file.name}. ${error.message || 'Please check storage permissions and browser console for details.'}` 
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
      toast({ variant: "destructive", title: "Storage Error", description: `Could not delete old file: ${error.message}` });
      return false;
    }
    console.log("[DataProvider] Successfully deleted old file:", filePath);
    return true;
  };

  const addLaborProfile = async (profileFormData: LaborProfileFormDataWithFiles) => {
    if (!user?.id) {
      toast({ variant: "destructive", title: "Auth Error", description: "User not authenticated to add profile." });
      return;
    }
    setIsLoading(true);

    let photo_url: string | undefined = undefined;
    if (profileFormData.photo instanceof File) {
      photo_url = await uploadFile(profileFormData.photo, profileFormData.name);
    }

    let aadhaar_url: string | undefined = undefined;
    if (profileFormData.aadhaar instanceof File) {
      aadhaar_url = await uploadFile(profileFormData.aadhaar, profileFormData.name);
    }

    let pan_url: string | undefined = undefined;
    if (profileFormData.pan instanceof File) {
      pan_url = await uploadFile(profileFormData.pan, profileFormData.name);
    }

    let driving_license_url: string | undefined = undefined;
    if (profileFormData.drivingLicense instanceof File) {
      driving_license_url = await uploadFile(profileFormData.drivingLicense, profileFormData.name);
    }

    const profileToInsert: Omit<Database['public']['Tables']['labor_profiles']['Insert'], 'id' | 'created_at'> = {
      user_id: user.id,
      name: profileFormData.name,
      contact: profileFormData.contact,
      aadhaar_number: profileFormData.aadhaarNumber,
      pan_number: profileFormData.panNumber ? profileFormData.panNumber.toUpperCase() : undefined,
      daily_salary: profileFormData.dailySalary, 
      photo_url,
      aadhaar_url,
      pan_url,
      driving_license_url,
    };
    
    const { data, error } = await supabase
      .from('labor_profiles')
      .insert(profileToInsert)
      .select()
      .single();

    if (error) {
      console.error('[DataProvider] Error adding labor profile:', error);
      toast({ variant: "destructive", title: "Database Error", description: `Could not add labor profile: ${error.message}` });
    } else if (data) {
      await fetchLaborProfiles(); 
      toast({ title: "Success", description: "Labor profile added." });
    }
    setIsLoading(false);
  };
  
  const updateLaborProfile = async (profileId: string, profileData: Partial<LaborProfileFormDataWithFiles>) => {
    if (!user?.id) {
        toast({ variant: "destructive", title: "Auth Error", description: "User not authenticated." });
        return;
    }
    setIsLoading(true);

    const existingProfile = await fetchLaborProfileById(profileId);
    if (!existingProfile) {
        toast({ variant: "destructive", title: "Update Error", description: "Original profile not found." });
        setIsLoading(false);
        return;
    }
    
    const finalUpdateObject: Partial<Database['public']['Tables']['labor_profiles']['Update']> = {
      name: profileData.name,
      contact: profileData.contact,
      aadhaar_number: profileData.aadhaarNumber || null,
      pan_number: profileData.panNumber?.toUpperCase() || null,
      daily_salary: profileData.dailySalary || null,
    };

    let filesWereUpdated = false;
    if (profileData.photo instanceof File) {
      await deleteFile(existingProfile.photo_url);
      finalUpdateObject.photo_url = await uploadFile(profileData.photo, profileData.name || existingProfile.name);
      filesWereUpdated = true;
    }
    if (profileData.aadhaar instanceof File) {
      await deleteFile(existingProfile.aadhaar_url);
      finalUpdateObject.aadhaar_url = await uploadFile(profileData.aadhaar, profileData.name || existingProfile.name);
      filesWereUpdated = true;
    }
    if (profileData.pan instanceof File) {
      await deleteFile(existingProfile.pan_url);
      finalUpdateObject.pan_url = await uploadFile(profileData.pan, profileData.name || existingProfile.name);
      filesWereUpdated = true;
    }
    if (profileData.drivingLicense instanceof File) {
      await deleteFile(existingProfile.driving_license_url);
      finalUpdateObject.driving_license_url = await uploadFile(profileData.drivingLicense, profileData.name || existingProfile.name);
      filesWereUpdated = true;
    }

    const hasTextChanged = 
      finalUpdateObject.name !== existingProfile.name ||
      finalUpdateObject.contact !== existingProfile.contact ||
      (finalUpdateObject.aadhaar_number ?? null) !== (existingProfile.aadhaar_number ?? null) ||
      (finalUpdateObject.pan_number ?? null) !== (existingProfile.pan_number ?? null) ||
      (finalUpdateObject.daily_salary ?? null) !== (existingProfile.daily_salary ?? null);

    if (!hasTextChanged && !filesWereUpdated) {
      toast({ title: "No Changes", description: "No new information or files were provided to update."});
      setIsLoading(false);
      return;
    }
    
    const { error: updateError } = await supabase
      .from('labor_profiles')
      .update(finalUpdateObject)
      .eq('id', profileId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('[DataProvider] Error updating labor profile:', updateError);
      toast({ variant: "destructive", title: "Update Failed", description: `Could not update profile: ${updateError.message}` });
    } else {
      await fetchLaborProfiles(); 
      toast({ title: "Success", description: `Profile for ${profileData.name || existingProfile.name} updated.` });
    }
    setIsLoading(false);
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
        const filesToDelete: string[] = [];
        if (profileToDelete.photo_url) {
            const path = getPathFromUrl(profileToDelete.photo_url);
            if (path) filesToDelete.push(path);
        }
        if (profileToDelete.aadhaar_url) {
            const path = getPathFromUrl(profileToDelete.aadhaar_url);
            if (path) filesToDelete.push(path);
        }
        if (profileToDelete.pan_url) {
            const path = getPathFromUrl(profileToDelete.pan_url);
            if (path) filesToDelete.push(path);
        }
        if (profileToDelete.driving_license_url) {
            const path = getPathFromUrl(profileToDelete.driving_license_url);
            if (path) filesToDelete.push(path);
        }

        if (filesToDelete.length > 0) {
            const { error: storageError } = await supabase.storage
                .from(STORAGE_BUCKET_NAME)
                .remove(filesToDelete);
            if (storageError) {
                console.error('[DataProvider] Error deleting files from storage:', storageError);
                toast({ variant: "destructive", title: "Storage Error", description: `Could not delete associated files: ${storageError.message}. Profile not deleted.` });
                throw storageError; 
            }
        }

        const { error: dbError } = await supabase
            .from('labor_profiles')
            .delete()
            .eq('id', profileId)
            .eq('user_id', user.id); 

        if (dbError) {
            console.error('[DataProvider] Error deleting labor profile from database:', dbError);
            toast({ variant: "destructive", title: "Database Error", description: `Could not delete profile: ${dbError.message}` });
            throw dbError;
        }

        setLaborProfiles(prevProfiles => prevProfiles.filter(p => p.id !== profileId));
        toast({ title: "Success", description: `Profile for ${profileToDelete.name} deleted.` });

    } catch (error) {
        console.error('[DataProvider] Overall error in deleteLaborProfile:', error);
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

    const { data, error } = await supabase
      .from('attendance_entries')
      .insert(entryToInsert)
      .select()
      .single();

    if (error) {
      console.error('[DataProvider] Error adding attendance entry:', error);
      toast({ variant: "destructive", title: "Database Error", description: `Could not add attendance entry: ${error.message}` });
    } else if (data) {
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

    const { data, error } = await supabase
      .from('payment_history')
      .insert(entryToInsert)
      .select()
      .single();

    if (error) {
      console.error('[DataProvider] Error adding payment history entry:', error);
      toast({ variant: "destructive", title: "Database Error", description: `Could not record payment: ${error.message}` });
    } else if (data) {
      await fetchPaymentHistory();
      toast({ title: "Success", description: "Payment recorded successfully." });
    }
    setIsLoading(false);
  };

  const addCustomerProfile = async (profileData: CustomerProfileFormData) => {
    if (!user?.id) {
      toast({ variant: "destructive", title: "Auth Error", description: "User not authenticated to add customer." });
      return;
    }
    setIsLoading(true);

    const profileToInsert: Omit<Database['public']['Tables']['customer_profiles']['Insert'], 'id' | 'created_at'> = {
      user_id: user.id,
      ...profileData
    };
    
    const { data, error } = await supabase
      .from('customer_profiles')
      .insert(profileToInsert)
      .select()
      .single();

    if (error) {
      console.error('[DataProvider] Error adding customer profile:', error);
      toast({ variant: "destructive", title: "Database Error", description: `Could not add customer profile: ${error.message}` });
    } else if (data) {
      await fetchCustomerProfiles(); 
      toast({ title: "Success", description: "Customer profile added." });
    }
    setIsLoading(false);
  };

  const updateCustomerProfile = async (profileId: string, profileData: Partial<CustomerProfileFormData>) => {
    if (!user?.id) {
      toast({ variant: "destructive", title: "Auth Error", description: "User not authenticated." });
      return;
    }
    setIsLoading(true);

    const { error } = await supabase
      .from('customer_profiles')
      .update(profileData)
      .eq('id', profileId)
      .eq('user_id', user.id);

    if (error) {
      console.error('[DataProvider] Error updating customer profile:', error);
      toast({ variant: "destructive", title: "Update Failed", description: `Could not update profile: ${error.message}` });
    } else {
      await fetchCustomerProfiles();
      toast({ title: "Success", description: `Profile for ${profileData.name} updated.` });
    }
    setIsLoading(false);
  };

  const deleteCustomerProfile = async (profileId: string) => {
    if (!user?.id) {
      toast({ variant: "destructive", title: "Auth Error", description: "User not authenticated." });
      throw new Error("User not authenticated");
    }

    const profileToDelete = customerProfiles.find(p => p.id === profileId);
    if (!profileToDelete) {
      toast({ variant: "destructive", title: "Error", description: "Customer profile not found." });
      throw new Error("Profile not found");
    }

    setIsLoading(true);
    try {
      const { error: dbError } = await supabase
        .from('customer_profiles')
        .delete()
        .eq('id', profileId)
        .eq('user_id', user.id);

      if (dbError) {
        console.error('[DataProvider] Error deleting customer profile:', dbError);
        toast({ variant: "destructive", title: "Database Error", description: `Could not delete profile: ${dbError.message}` });
        throw dbError;
      }

      setCustomerProfiles(prev => prev.filter(p => p.id !== profileId));
      toast({ title: "Success", description: `Profile for ${profileToDelete.name} deleted.` });

    } catch (error) {
      console.error('[DataProvider] Overall error in deleteCustomerProfile:', error);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <DataContext.Provider value={{ 
        laborProfiles, 
        attendanceEntries, 
        paymentHistory,
        customerProfiles,
        addLaborProfile, 
        updateLaborProfile,
        deleteLaborProfile,
        fetchLaborProfileById,
        addAttendanceEntry, 
        addPaymentHistoryEntry,
        fetchPaymentHistory,
        addCustomerProfile,
        updateCustomerProfile,
        deleteCustomerProfile,
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

    