import { z } from 'zod';

export const attendanceSchema = z.object({
  laborId: z.string().min(1, { message: "Please select a labor" }),
  date: z.date({ required_error: "Date is required" }),
  status: z.enum(['present', 'absent', 'advance'], { required_error: "Attendance status is required" }),
  workDetails: z.string().min(1, { message: "Work details are required" }),
});

export type AttendanceFormData = z.infer<typeof attendanceSchema>;
