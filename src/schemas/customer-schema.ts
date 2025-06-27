
import { z } from 'zod';

export const customerProfileSchema = z.object({
  customer_id: z.string().min(1, { message: "Customer ID is required" }),
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  mobile_no: z.string().min(10, { message: "Mobile number must be at least 10 digits" }).regex(/^\+?[0-9\s-()]{10,}$/, { message: "Invalid mobile number format" }),
  address: z.string().min(5, { message: "Address must be at least 5 characters" }),
  category: z.string({ required_error: "Please select a category." }).min(1, { message: "Category is required" }),
  ownership_type: z.string({ required_error: "Please select an ownership type." }).min(1, { message: "Ownership type is required" }),
  load_in_tons: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
    z.number({ required_error: "Load is required"}).positive({ message: "Load must be a positive number" })
  ),
  payment_rate_per_load: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
    z.number({ required_error: "Payment rate is required"}).positive({ message: "Payment rate must be a positive number" })
  ),
});

export type CustomerProfileFormData = z.infer<typeof customerProfileSchema>;
