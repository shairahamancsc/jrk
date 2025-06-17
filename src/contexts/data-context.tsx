
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { LaborProfile, AttendanceEntry, LaborProfileFormDataWithFiles, Database } from '@/types';
import { useAuth } from './auth-context'; 
import { useToast } from "@/hooks/use-toast";

interface DataContextType {
  laborProfiles: LaborProfile[];
  attendanceEntries: AttendanceEntry[];
  addLaborProfile: (profileData: LaborProfileFormDataWithFiles) => Promise<void>;
  addAttendanceEntry: (entryData: Omit<AttendanceEntry, 'id' | 'created_at' | 'user_id'>) => Promise<void>;
  deleteLaborProfile: (profileId: string) => Promise<void>;
  updateLaborProfile: (profileId: string, profileData: Partial<LaborProfileFormDataWithFiles>) => Promise<void>; // Partial for updates
  fetchLaborProfileById: (profileId: string) => Promise<LaborProfile | null>;
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE_BUCKET_NAME = 'profile-documents'; 

// Helper function to extract file path from Supabase Storage URL
const getPathFromUrl = (url: string): string | null => {
  try {
    const urlObject = new URL(url);
    // Example URL: https://<project_ref>.supabase.co/storage/v1/object/public/<bucket_name>/<path_to_file>
    // We want to extract <path_to_file>
    // The path starts after `/storage/v1/object/public/BUCKET_NAME/`
    const prefix = `/storage/v1/object/public/${STORAGE_BUCKET_NAME}/`;
    if (urlObject.pathname.startsWith(prefix)) {
      return urlObject.pathname.substring(prefix.length);
    }
    return null;
  } catch (e) {
    console.error("Error parsing URL for file path:", e);
    return null;
  }
};


export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [laborProfiles, setLaborProfiles] = useState<LaborProfile[]>([]);
  const [attendanceEntries, setAttendanceEntries] = useState<AttendanceEntry[]>([]);
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

  const fetchLaborProfileById = async (profileId: string): Promise<LaborProfile | null> => {
    if (!user?.id) {
        toast({ variant: "destructive", title: "Auth Error", description: "User not authenticated." });
        return null;
    }
    setIsLoading(true);
    const { data, error } = await supabase
        .from('labor_profiles')
        .select('*')
        .eq('id', profileId)
        .eq('user_id', user.id)
        .single();
    setIsLoading(false);
    if (error) {
        console.error(`[DataProvider] Error fetching labor profile by ID ${profileId}:`, error);
        toast({ variant: "destructive", title: "Fetch Error", description: `Could not fetch profile: ${error.message}` });
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

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      if (user?.id) {
        await fetchLaborProfiles();
        await fetchAttendanceEntries();
      } else {
        setLaborProfiles([]);
        setAttendanceEntries([]);
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
    // This fileName is the path within the bucket
    const filePathInBucket = `public/${user.id}/${sanitizedProfileName}_${Date.now()}_${file.name}`;
    
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET_NAME)
      .upload(filePathInBucket, file, {
        cacheControl: '3600',
        upsert: false, // Consider true for updates if file names can be the same
      });

    if (error) {
      console.error('[DataProvider] Error uploading file:', error);
      toast({ variant: "destructive", title: "Upload Error", description: `Could not upload ${file.name}: ${error.message}` });
      return undefined;
    }

    const { data: { publicUrl } } = supabase.storage.from(STORAGE_BUCKET_NAME).getPublicUrl(filePathInBucket);
    return publicUrl;
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
      pan_number: profileFormData.panNumber,
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
                // Decide if you want to proceed with DB deletion if storage fails. Usually not.
                throw storageError; 
            }
        }

        const { error: dbError } = await supabase
            .from('labor_profiles')
            .delete()
            .eq('id', profileId)
            .eq('user_id', user.id); // Ensure user owns the profile

        if (dbError) {
            console.error('[DataProvider] Error deleting labor profile from database:', dbError);
            toast({ variant: "destructive", title: "Database Error", description: `Could not delete profile: ${dbError.message}` });
            throw dbError;
        }

        setLaborProfiles(prevProfiles => prevProfiles.filter(p => p.id !== profileId));
        toast({ title: "Success", description: `Profile for ${profileToDelete.name} deleted.` });

    } catch (error) {
        console.error('[DataProvider] Overall error in deleteLaborProfile:', error);
        // Specific toasts are shown above, this is a fallback or re-throw.
        // No generic toast here as specific ones are more informative.
        throw error; // Re-throw to be caught by the calling component if needed
    } finally {
        setIsLoading(false);
    }
  };
  
  // Placeholder for updateLaborProfile - to be implemented fully later
  const updateLaborProfile = async (profileId: string, profileData: Partial<LaborProfileFormDataWithFiles>) => {
    if (!user?.id) {
        toast({ variant: "destructive", title: "Auth Error", description: "User not authenticated." });
        return;
    }
    setIsLoading(true);
    console.log('[DataProvider] Placeholder: updateLaborProfile called for ID:', profileId, 'with data:', profileData);
    // Full implementation will involve:
    // 1. Fetching the current profile to compare file URLs.
    // 2. If new files are provided in profileData (as File objects):
    //    a. Upload new files (get new URLs).
    //    b. Delete old files from storage if they are being replaced.
    // 3. If file fields are explicitly set to null/undefined, delete existing files.
    // 4. Update the database record with new text data and new file URLs.
    // 5. Refetch labor profiles.
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate async operation
    toast({ title: "In Progress", description: "Update functionality is under development." });
    await fetchLaborProfiles(); // Refetch for now
    setIsLoading(false);
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

  return (
    <DataContext.Provider value={{ 
        laborProfiles, 
        attendanceEntries, 
        addLaborProfile, 
        addAttendanceEntry, 
        deleteLaborProfile,
        updateLaborProfile, 
        fetchLaborProfileById,
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
