
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [laborProfiles, setLaborProfiles] = useState<LaborProfile[]>([]);
  const [attendanceEntries, setAttendanceEntries] = useState<AttendanceEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isInitialLoadComplete = useRef(false);

  // Effect for initial loading from localStorage
  useEffect(() => {
    setIsLoading(true); 

    let profilesToSet: LaborProfile[] = [];
    try {
      const storedLaborProfiles = localStorage.getItem(LABOR_PROFILES_STORAGE_KEY);
      if (storedLaborProfiles) { // Ensure item exists before parsing
        const parsedProfiles = JSON.parse(storedLaborProfiles);
        if (Array.isArray(parsedProfiles)) {
          profilesToSet = parsedProfiles.map((p: any) => ({
            id: p.id || '', 
            name: p.name || '',
            contact: p.contact || '',
            photo: typeof p.photo === 'string' ? p.photo : undefined,
            aadhaar: typeof p.aadhaar === 'string' ? p.aadhaar : undefined,
            pan: typeof p.pan === 'string' ? p.pan : undefined,
            drivingLicense: typeof p.drivingLicense === 'string' ? p.drivingLicense : undefined,
            createdAt: p.createdAt ? new Date(p.createdAt) : new Date(), 
          }));
        } else {
          console.warn(`Stored labor profiles (key: ${LABOR_PROFILES_STORAGE_KEY}) was not an array, clearing.`);
          localStorage.removeItem(LABOR_PROFILES_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error(`Error loading or parsing labor profiles from localStorage (key: ${LABOR_PROFILES_STORAGE_KEY}):`, error);
      localStorage.removeItem(LABOR_PROFILES_STORAGE_KEY);
    }
    

    let entriesToSet: AttendanceEntry[] = [];
    try {
      const storedAttendanceEntries = localStorage.getItem(ATTENDANCE_ENTRIES_STORAGE_KEY);
      if (storedAttendanceEntries) { // Ensure item exists before parsing
        const parsedEntries = JSON.parse(storedAttendanceEntries);
        if (Array.isArray(parsedEntries)) {
          entriesToSet = parsedEntries.map((e: any) => ({
            id: e.id || '', 
            laborId: e.laborId || '',
            laborName: e.laborName || 'Unknown Labor',
            status: e.status as AttendanceStatus || 'absent', 
            workDetails: typeof e.workDetails === 'string' ? e.workDetails : '',
            advanceAmount: typeof e.advanceAmount === 'number' ? e.advanceAmount : undefined,
            date: e.date ? new Date(e.date) : new Date(), 
            createdAt: e.createdAt ? new Date(e.createdAt) : new Date(), 
          }));
        } else {
          console.warn(`Stored attendance entries (key: ${ATTENDANCE_ENTRIES_STORAGE_KEY}) was not an array, clearing.`);
          localStorage.removeItem(ATTENDANCE_ENTRIES_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error(`Error loading or parsing attendance entries from localStorage (key: ${ATTENDANCE_ENTRIES_STORAGE_KEY}):`, error);
      localStorage.removeItem(ATTENDANCE_ENTRIES_STORAGE_KEY);
    }
    
    setLaborProfiles(profilesToSet);
    setAttendanceEntries(entriesToSet);
    setIsLoading(false);
    isInitialLoadComplete.current = true; 
  }, []); 

  // Effect for saving laborProfiles to localStorage
  useEffect(() => {
    if (!isInitialLoadComplete.current) {
      return;
    }
    const profilesToSave = laborProfiles.map(profile => ({
      ...profile,
      photo: profile.photo instanceof File ? profile.photo.name : (typeof profile.photo === 'string' ? profile.photo : undefined),
      aadhaar: profile.aadhaar instanceof File ? profile.aadhaar.name : (typeof profile.aadhaar === 'string' ? profile.aadhaar : undefined),
      pan: profile.pan instanceof File ? profile.pan.name : (typeof profile.pan === 'string' ? profile.pan : undefined),
      drivingLicense: profile.drivingLicense instanceof File ? profile.drivingLicense.name : (typeof profile.drivingLicense === 'string' ? profile.drivingLicense : undefined),
      createdAt: profile.createdAt.toISOString(), 
    }));
    try {
      localStorage.setItem(LABOR_PROFILES_STORAGE_KEY, JSON.stringify(profilesToSave));
    } catch (error) {
      console.error("Failed to save labor profiles to localStorage:", error);
    }
  }, [laborProfiles]); 

  // Effect for saving attendanceEntries to localStorage
  useEffect(() => {
    if (!isInitialLoadComplete.current) {
      return;
    }
    const entriesToSave = attendanceEntries.map(entry => ({
      ...entry,
      date: entry.date.toISOString(), 
      createdAt: entry.createdAt.toISOString(), 
    }));
    try {
      localStorage.setItem(ATTENDANCE_ENTRIES_STORAGE_KEY, JSON.stringify(entriesToSave));
    } catch (error) {
      console.error("Failed to save attendance entries to localStorage:", error);
    }
  }, [attendanceEntries]); 


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

