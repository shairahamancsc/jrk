
import { z } from 'zod';

export const attendanceItemSchema = z.object({
  laborId: z.string(),
  laborName: z.string(), // Included for easier display in the form, not strictly needed for submission logic if laborId is key
  status: z.enum(['present', 'absent', 'advance']).optional(),
  workDetails: z.string().optional(),
}).refine(data => {
  // If a status is selected, workDetails must be provided and non-empty
  if (data.status && data.status.length > 0) {
    return data.workDetails && data.workDetails.trim().length > 0;
  }
  // If no status is selected, workDetails are not required
  return true;
}, {
  message: "Work details are required if an attendance status is selected.",
  path: ["workDetails"], // Error message will point to the workDetails field
});

export const batchAttendanceSchema = z.object({
  date: z.date({ required_error: "Date is required" }),
  attendances: z.array(attendanceItemSchema)
    .refine(
        (items) => items.some(item => !!item.status), 
        { message: "Please mark attendance status for at least one labor." }
    ),
});

export type BatchAttendanceFormData = z.infer<typeof batchAttendanceSchema>;
export type AttendanceItemData = z.infer<typeof attendanceItemSchema>;
