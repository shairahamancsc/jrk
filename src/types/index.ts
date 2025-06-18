
export type UserRole = 'admin' | 'supervisor';

export interface LaborProfile {
  id: string; 
  name: string;
  contact: string;
  aadhaar_number?: string;
  pan_number?: string;
  daily_salary?: number; 
  photo_url?: string; 
  aadhaar_url?: string; 
  pan_url?: string; 
  driving_license_url?: string; 
  created_at: string; 
  user_id?: string; 
}

export type AttendanceStatus = 'present' | 'absent';

export interface AttendanceEntry {
  id: string; 
  labor_id: string; 
  labor_name?: string; 
  date: string; 
  status: AttendanceStatus;
  work_details?: string;
  advance_amount?: number;
  created_at: string; 
  user_id?: string; 
}

export interface PaymentReportEntry {
  laborId: string;
  laborName: string;
  dailySalary: number; // Will default to 0 if not set on profile
  presentDays: number;
  totalEarnings: number;
  totalAdvance: number;
  netPayment: number;
}

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
          aadhaar_number: string | null
          pan_number: string | null
          daily_salary: number | null 
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
          aadhaar_number?: string | null
          pan_number?: string | null
          daily_salary?: number | null 
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
          aadhaar_number?: string | null
          pan_number?: string | null
          daily_salary?: number | null 
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
          date: string 
          status: string 
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

export interface LaborProfileFormDataWithFiles extends Omit<LaborProfile, 'id' | 'created_at' | 'photo_url' | 'aadhaar_url' | 'pan_url' | 'driving_license_url' | 'daily_salary'> {
  aadhaarNumber?: string;
  panNumber?: string;
  dailySalary?: number; 
  photo?: File;
  aadhaar?: File;
  pan?: File;
  drivingLicense?: File;
}
