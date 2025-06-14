
import { z } from 'zod';

export const attendanceItemSchema = z.object({
  laborId: z.string(),
  laborName: z.string(), 
  status: z.enum(['present', 'absent', 'advance']).optional(),
  advanceDetails: z.string().optional(), // Details for advance status
});

export const batchAttendanceSchema = z.object({
  date: z.date({ required_error: "Date is required" }),
  attendances: z.array(attendanceItemSchema)
    .refine(
        (items) => items.some(item => !!item.status), 
        { message: "Please mark attendance status for at least one labor." }
    )
    .refine(
        (items) => items.every(item => item.status !== 'advance' || (item.advanceDetails && item.advanceDetails.trim() !== '')),
        { message: "Advance details are required if status is 'advance'.", path: ['attendances'] } // This message might not point to specific item, general form error
    ),
  workDetails: z.string().optional(), // Shared work details for the batch
});

export type BatchAttendanceFormData = z.infer<typeof batchAttendanceSchema>;
export type AttendanceItemData = z.infer<typeof attendanceItemSchema>;
