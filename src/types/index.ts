
export interface LaborProfile {
  id: string; // Typically UUID from Supabase
  name: string;
  contact: string;
  photo_url?: string; // URL from Supabase Storage
  aadhaar_url?: string; // URL from Supabase Storage
  pan_url?: string; // URL from Supabase Storage
  driving_license_url?: string; // URL from Supabase Storage
  created_at: string; // ISO string from Supabase, will be converted to Date in app
  user_id?: string; // To associate with a user for RLS
}

export type AttendanceStatus = 'present' | 'absent';

export interface AttendanceEntry {
  id: string; // Typically UUID from Supabase
  labor_id: string; // Links to LaborProfile id
  labor_name?: string; // For display purposes, might be joined or manually set
  date: string; // ISO string from Supabase, will be converted to Date in app
  status: AttendanceStatus;
  work_details?: string;
  advance_amount?: number;
  created_at: string; // ISO string from Supabase, will be converted to Date in app
  user_id?: string; // To associate with a user for RLS
}

// Placeholder for Supabase generated types.
// You would generate this with: npx supabase gen types typescript --project-id <your-project-id> --schema public > src/types/supabase.ts
// For now, we'll use a minimal version.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      labor_profiles: {
        Row: {
          id: string
          user_id: string | null
          name: string
          contact: string
          photo_url: string | null
          aadhaar_url: string | null
          pan_url: string | null
          driving_license_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          contact: string
          photo_url?: string | null
          aadhaar_url?: string | null
          pan_url?: string | null
          driving_license_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          contact?: string
          photo_url?: string | null
          aadhaar_url?: string | null
          pan_url?: string | null
          driving_license_url?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "labor_profiles_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      attendance_entries: {
        Row: {
          id: string
          user_id: string | null
          labor_id: string
          labor_name: string | null
          date: string // date string
          status: string // 'present' | 'absent'
          work_details: string | null
          advance_amount: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          labor_id: string
          labor_name?: string | null
          date: string
          status: string
          work_details?: string | null
          advance_amount?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          labor_id?: string
          labor_name?: string | null
          date?: string
          status?: string
          work_details?: string | null
          advance_amount?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_entries_labor_id_fkey"
            columns: ["labor_id"]
            referencedRelation: "labor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_entries_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

// Helper type for form data which might still use File objects before upload
export interface LaborProfileFormDataWithFiles extends Omit<LaborProfile, 'id' | 'created_at' | 'photo_url' | 'aadhaar_url' | 'pan_url' | 'driving_license_url'> {
  photo?: File;
  aadhaar?: File;
  pan?: File;
  drivingLicense?: File;
}
