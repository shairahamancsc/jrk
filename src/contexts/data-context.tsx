
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { LaborProfile, AttendanceEntry, AttendanceStatus } from '@/types';

interface DataContextType {
  laborProfiles: LaborProfile[];
  attendanceEntries: AttendanceEntry[];
  addLaborProfile: (profile: Omit<LaborProfile, 'id' | 'createdAt'>) => void;
  addAttendanceEntry: (entry: Omit<AttendanceEntry, 'id' | 'createdAt' | 'laborName'>) => void;
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const LABOR_PROFILES_STORAGE_KEY = 'jrke_labor_profiles';
const ATTENDANCE_ENTRIES_STORAGE_KEY = 'jrke_attendance_entries';

// Helper to process file fields when loading from localStorage
const processLoadedFileField = (fieldValue: any): string | undefined => {
  if (typeof fieldValue === 'string' && fieldValue.trim() !== '') {
    return fieldValue;
  }
  return undefined;
};

// Helper to process file fields when saving to localStorage
const processFileFieldForSaving = (fieldValue: File | string | undefined): string | undefined => {
  if (fieldValue instanceof File) {
    return fieldValue.name;
  }
  if (typeof fieldValue === 'string' && fieldValue.trim() !== '') {
    return fieldValue;
  }
  return undefined;
};


export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [laborProfiles, setLaborProfiles] = useState<LaborProfile[]>([]);
  const [attendanceEntries, setAttendanceEntries] = useState<AttendanceEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let profilesToSet: LaborProfile[] = [];
    let entriesToSet: AttendanceEntry[] = [];

    // Load Labor Profiles
    try {
      const storedLaborProfiles = localStorage.getItem(LABOR_PROFILES_STORAGE_KEY);
      if (storedLaborProfiles) {
        const parsedProfiles = JSON.parse(storedLaborProfiles);
        if (Array.isArray(parsedProfiles)) {
          profilesToSet = parsedProfiles.map((p: any) => ({
            ...p,
            photo: processLoadedFileField(p.photo),
            aadhaar: processLoadedFileField(p.aadhaar),
            pan: processLoadedFileField(p.pan),
            drivingLicense: processLoadedFileField(p.drivingLicense),
            createdAt: p.createdAt ? new Date(p.createdAt) : new Date(), // Handles ISO string or creates new
          }));
        } else {
          console.warn("Stored labor profiles were not an array, clearing.");
          localStorage.removeItem(LABOR_PROFILES_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error("Error loading or parsing labor profiles from localStorage:", error);
      localStorage.removeItem(LABOR_PROFILES_STORAGE_KEY);
    }
    setLaborProfiles(profilesToSet);

    // Load Attendance Entries
    try {
      const storedAttendanceEntries = localStorage.getItem(ATTENDANCE_ENTRIES_STORAGE_KEY);
      if (storedAttendanceEntries) {
        const parsedEntries = JSON.parse(storedAttendanceEntries);
        if (Array.isArray(parsedEntries)) {
          entriesToSet = parsedEntries.map((e: any) => ({
            ...e,
            date: e.date ? new Date(e.date) : new Date(), // Handles ISO string or creates new
            createdAt: e.createdAt ? new Date(e.createdAt) : new Date(), // Handles ISO string or creates new
          }));
        } else {
          console.warn("Stored attendance entries were not an array, clearing.");
          localStorage.removeItem(ATTENDANCE_ENTRIES_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error("Error loading or parsing attendance entries from localStorage:", error);
      localStorage.removeItem(ATTENDANCE_ENTRIES_STORAGE_KEY);
    }
    setAttendanceEntries(entriesToSet);

    setIsLoading(false);
  }, []); // Empty dependency array ensures this runs only once on mount

  // Save Labor Profiles
  useEffect(() => {
    if (isLoading) return; 

    const profilesToSave = laborProfiles.map(profile => ({
      ...profile,
      photo: processFileFieldForSaving(profile.photo),
      aadhaar: processFileFieldForSaving(profile.aadhaar),
      pan: processFileFieldForSaving(profile.pan),
      drivingLicense: processFileFieldForSaving(profile.drivingLicense),
      createdAt: profile.createdAt instanceof Date ? profile.createdAt.toISOString() : new Date().toISOString(),
    }));
    try {
      localStorage.setItem(LABOR_PROFILES_STORAGE_KEY, JSON.stringify(profilesToSave));
    } catch (error) {
      console.error("Failed to save labor profiles to localStorage", error);
    }
  }, [laborProfiles, isLoading]);

  // Save Attendance Entries
  useEffect(() => {
     if (isLoading) return; 

      const entriesToSave = attendanceEntries.map(entry => ({
        ...entry,
        date: entry.date instanceof Date ? entry.date.toISOString() : new Date().toISOString(),
        createdAt: entry.createdAt instanceof Date ? entry.createdAt.toISOString() : new Date().toISOString(),
      }));
      try {
        localStorage.setItem(ATTENDANCE_ENTRIES_STORAGE_KEY, JSON.stringify(entriesToSave));
      } catch (error) {
        console.error("Failed to save attendance entries to localStorage", error);
      }
  }, [attendanceEntries, isLoading]);


  const addLaborProfile = (profileData: Omit<LaborProfile, 'id' | 'createdAt'>) => {
    const newProfile: LaborProfile = {
      ...profileData,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9), 
      createdAt: new Date(),
    };
    setLaborProfiles((prev) => [...prev, newProfile]);
  };

  const addAttendanceEntry = (entryData: { laborId: string; date: Date; status: AttendanceStatus; workDetails?: string; advanceAmount?: number; }) => {
    const labor = laborProfiles.find(lp => lp.id === entryData.laborId);
    const newEntry: AttendanceEntry = {
      laborId: entryData.laborId,
      date: entryData.date,
      status: entryData.status,
      workDetails: entryData.workDetails || "",
      advanceAmount: entryData.advanceAmount,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9), 
      laborName: labor?.name || 'Unknown Labor',
      createdAt: new Date(),
    };
    setAttendanceEntries((prev) => [...prev, newEntry]);
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
