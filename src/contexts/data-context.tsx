
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { LaborProfile, AttendanceEntry, AttendanceStatus, LaborProfileFormDataWithFiles } from '@/types';
import { useAuth } from './auth-context'; // To get user_id for RLS
import { useToast } from "@/hooks/use-toast";

interface DataContextType {
  laborProfiles: LaborProfile[];
  attendanceEntries: AttendanceEntry[];
  addLaborProfile: (profileData: LaborProfileFormDataWithFiles) => Promise<void>;
  addAttendanceEntry: (entryData: Omit<AttendanceEntry, 'id' | 'created_at' | 'user_id'>) => Promise<void>;
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE_BUCKET_NAME = 'profile_documents'; // Ensure this bucket exists in your Supabase project

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [laborProfiles, setLaborProfiles] = useState<LaborProfile[]>([]);
  const [attendanceEntries, setAttendanceEntries] = useState<AttendanceEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchLaborProfiles = async () => {
    if (!user?.id) return; // Don't fetch if no user, RLS might block
    console.log('[DataProvider] Fetching labor profiles...');
    const { data, error } = await supabase
      .from('labor_profiles')
      .select('*')
      .eq('user_id', user.id) // Assuming RLS uses user_id
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[DataProvider] Error fetching labor profiles:', error);
      toast({ variant: "destructive", title: "Error", description: "Could not fetch labor profiles." });
      setLaborProfiles([]);
    } else {
      console.log('[DataProvider] Fetched labor profiles:', data);
      setLaborProfiles(data || []);
    }
  };

  const fetchAttendanceEntries = async () => {
    if (!user?.id) return;
    console.log('[DataProvider] Fetching attendance entries...');
    const { data, error } = await supabase
      .from('attendance_entries')
      .select(`
        id, 
        labor_id, 
        labor_name,
        date, 
        status, 
        work_details, 
        advance_amount, 
        created_at,
        user_id
      `)
      .eq('user_id', user.id) // Assuming RLS uses user_id
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[DataProvider] Error fetching attendance entries:', error);
      toast({ variant: "destructive", title: "Error", description: "Could not fetch attendance entries." });
      setAttendanceEntries([]);
    } else {
      console.log('[DataProvider] Fetched attendance entries:', data);
      setAttendanceEntries(data || []);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      if (user?.id) { // Only attempt to load data if user is available for RLS
        await fetchLaborProfiles();
        await fetchAttendanceEntries();
      } else {
        // If no user, clear data or handle as appropriate
        setLaborProfiles([]);
        setAttendanceEntries([]);
      }
      setIsLoading(false);
      console.log('[DataProvider] Initial data load complete.');
    };
    loadData();
  }, [user]); // Reload data when user changes

  const uploadFile = async (file: File, profileName: string): Promise<string | undefined> => {
    if (!user?.id) {
      toast({ variant: "destructive", title: "Auth Error", description: "User not authenticated for file upload." });
      return undefined;
    }
    // Sanitize profileName for use in path
    const sanitizedProfileName = profileName.replace(/[^a-zA-Z0-9-_]/g, '_');
    const fileName = `${user.id}/${sanitizedProfileName}_${Date.now()}_${file.name}`;
    
    console.log(`[DataProvider] Uploading file: ${fileName} to bucket: ${STORAGE_BUCKET_NAME}`);
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET_NAME)
      .upload(fileName, file);

    if (error) {
      console.error('[DataProvider] Error uploading file:', error);
      toast({ variant: "destructive", title: "Upload Error", description: `Could not upload ${file.name}: ${error.message}` });
      return undefined;
    }

    console.log('[DataProvider] File uploaded successfully:', data);
    const { data: { publicUrl } } = supabase.storage.from(STORAGE_BUCKET_NAME).getPublicUrl(fileName);
    console.log('[DataProvider] Public URL:', publicUrl);
    return publicUrl;
  };

  const addLaborProfile = async (profileFormData: LaborProfileFormDataWithFiles) => {
    if (!user?.id) {
      toast({ variant: "destructive", title: "Auth Error", description: "User not authenticated." });
      return;
    }
    console.log('[DataProvider] Adding new labor profile:', profileFormData);
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

    const profileToInsert = {
      user_id: user.id,
      name: profileFormData.name,
      contact: profileFormData.contact,
      photo_url,
      aadhaar_url,
      pan_url,
      driving_license_url,
      // created_at will be set by Supabase default
    };
    
    console.log('[DataProvider] Profile to insert into Supabase:', profileToInsert);

    const { data, error } = await supabase
      .from('labor_profiles')
      .insert(profileToInsert)
      .select()
      .single(); // Assuming insert returns the new row

    if (error) {
      console.error('[DataProvider] Error adding labor profile:', error);
      toast({ variant: "destructive", title: "Error", description: `Could not add labor profile: ${error.message}` });
    } else if (data) {
      console.log('[DataProvider] Labor profile added successfully to Supabase:', data);
      // setLaborProfiles((prev) => [data, ...prev]); // Optimistic update or re-fetch
      await fetchLaborProfiles(); // Re-fetch to ensure consistency
      toast({ title: "Success", description: "Labor profile added." });
    }
    setIsLoading(false);
  };

  const addAttendanceEntry = async (entryData: Omit<AttendanceEntry, 'id' | 'created_at' | 'user_id'>) => {
     if (!user?.id) {
      toast({ variant: "destructive", title: "Auth Error", description: "User not authenticated." });
      return;
    }
    console.log('[DataProvider] Adding new attendance entry:', entryData);
    setIsLoading(true);

    const entryToInsert = {
      ...entryData,
      user_id: user.id,
      date: new Date(entryData.date).toISOString().split('T')[0], // Ensure date is in 'YYYY-MM-DD' format for Supabase 'date' type
      // created_at will be set by Supabase default
    };

    console.log('[DataProvider] Attendance entry to insert into Supabase:', entryToInsert);

    const { data, error } = await supabase
      .from('attendance_entries')
      .insert(entryToInsert)
      .select()
      .single();

    if (error) {
      console.error('[DataProvider] Error adding attendance entry:', error);
      toast({ variant: "destructive", title: "Error", description: `Could not add attendance entry: ${error.message}` });
    } else if (data) {
      console.log('[DataProvider] Attendance entry added successfully to Supabase:', data);
      // setAttendanceEntries((prev) => [data, ...prev]); // Optimistic update or re-fetch
      await fetchAttendanceEntries(); // Re-fetch
      toast({ title: "Success", description: "Attendance entry recorded." });
    }
    setIsLoading(false);
  };

  return (
    <DataContext.Provider value={{ laborProfiles, attendanceEntries, addLaborProfile, addAttendanceEntry, isLoading }}>
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
