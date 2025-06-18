
import { z } from 'zod';

export const recordPaymentSchema = z.object({
  laborId: z.string(), 
  laborName: z.string(), 
  paymentDate: z.date({
    required_error: "Payment date is required",
    invalid_type_error: "That's not a valid date!",
  }),
  periodStartDate: z.date(), 
  periodEndDate: z.date(),   
  amountPaid: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
    z.number().positive({ message: "Amount paid must be a positive number" })
  ),
  notes: z.string().optional(),
});

export type RecordPaymentFormData = z.infer<typeof recordPaymentSchema>;
