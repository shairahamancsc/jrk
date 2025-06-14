
export interface LaborProfile {
  id: string;
  name: string;
  contact: string;
  photo?: File | string; // Store File object or a URL string for placeholder
  aadhaar?: File | string;
  pan?: File | string;
  drivingLicense?: File | string;
  createdAt: Date;
}

export type AttendanceStatus = 'present' | 'absent' | 'advance';

export interface AttendanceEntry {
  id: string;
  laborId: string; // Links to LaborProfile id
  laborName?: string; // For display purposes
  date: Date;
  status: AttendanceStatus;
  workDetails?: string; // Made optional
  createdAt: Date;
}
