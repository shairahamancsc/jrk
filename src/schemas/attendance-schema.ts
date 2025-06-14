
import { z } from 'zod';

export const attendanceItemSchema = z.object({
  laborId: z.string(),
  laborName: z.string(),
  status: z.enum(['present', 'absent', 'advance']).optional(),
  advanceDetails: z.string().optional(), // Details for advance status
}).refine(data => {
  if (data.status === 'advance') {
    // Ensure advanceDetails is present and not just whitespace if status is 'advance'
    return data.advanceDetails && data.advanceDetails.trim() !== '';
  }
  return true; // Not 'advance' status, so no validation needed for advanceDetails here
}, {
  message: "Details required for advance", // This message will appear under the specific advanceDetails input
  path: ['advanceDetails'], // Apply this error to the advanceDetails field of the item
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
