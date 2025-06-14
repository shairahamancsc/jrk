
import { z } from 'zod';

export const attendanceItemSchema = z.object({
  laborId: z.string(),
  laborName: z.string(), 
  status: z.enum(['present', 'absent', 'advance']).optional(),
});

export const batchAttendanceSchema = z.object({
  date: z.date({ required_error: "Date is required" }),
  attendances: z.array(attendanceItemSchema)
    .refine(
        (items) => items.some(item => !!item.status), 
        { message: "Please mark attendance status for at least one labor." }
    ),
  workDetails: z.string().optional(), // Shared work details for the batch
});

export type BatchAttendanceFormData = z.infer<typeof batchAttendanceSchema>;
export type AttendanceItemData = z.infer<typeof attendanceItemSchema>;
