
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { LaborProfile, AttendanceEntry } from '@/types';

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

  useEffect(() => {
    try {
      const storedLaborProfiles = localStorage.getItem(LABOR_PROFILES_STORAGE_KEY);
      if (storedLaborProfiles) {
        setLaborProfiles(JSON.parse(storedLaborProfiles).map((p: LaborProfile) => ({...p, createdAt: new Date(p.createdAt)})));
      }
      const storedAttendanceEntries = localStorage.getItem(ATTENDANCE_ENTRIES_STORAGE_KEY);
      if (storedAttendanceEntries) {
        setAttendanceEntries(JSON.parse(storedAttendanceEntries).map((e: AttendanceEntry) => ({...e, date: new Date(e.date), createdAt: new Date(e.createdAt)})));
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
      localStorage.removeItem(LABOR_PROFILES_STORAGE_KEY);
      localStorage.removeItem(ATTENDANCE_ENTRIES_STORAGE_KEY);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) { 
      try {
        localStorage.setItem(LABOR_PROFILES_STORAGE_KEY, JSON.stringify(laborProfiles));
      } catch (error) {
        console.error("Failed to save labor profiles to localStorage", error);
      }
    }
  }, [laborProfiles, isLoading]);

  useEffect(() => {
     if (!isLoading) { 
      try {
        localStorage.setItem(ATTENDANCE_ENTRIES_STORAGE_KEY, JSON.stringify(attendanceEntries));
      } catch (error) {
        console.error("Failed to save attendance entries to localStorage", error);
      }
    }
  }, [attendanceEntries, isLoading]);


  const addLaborProfile = (profileData: Omit<LaborProfile, 'id' | 'createdAt'>) => {
    const newProfile: LaborProfile = {
      ...profileData,
      id: Date.now().toString(), 
      createdAt: new Date(),
    };
    setLaborProfiles((prev) => [...prev, newProfile]);
  };

  const addAttendanceEntry = (entryData: Omit<AttendanceEntry, 'id' | 'createdAt' | 'laborName'>) => {
    const labor = laborProfiles.find(lp => lp.id === entryData.laborId);
    const newEntry: AttendanceEntry = {
      laborId: entryData.laborId,
      date: entryData.date,
      status: entryData.status,
      workDetails: entryData.workDetails || "",
      advanceDetails: entryData.advanceDetails, 
      id: Date.now().toString(), 
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

