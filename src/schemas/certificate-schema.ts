
import { z } from 'zod';

const equipmentSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  capacity: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
    z.number({ required_error: "Capacity is required" }).positive({ message: "Capacity must be a positive number" })
  ),
  quantity: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
    z.number({ required_error: "Quantity is required" }).int().positive({ message: "Quantity must be a positive integer" })
  ),
});

export const certificateSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  address: z.string().min(5, { message: "Address is required" }),
  state: z.string().min(2, { message: "State is required" }),
  district: z.string().min(2, { message: "District is required" }),
  areaPin: z.string().regex(/^\d{6}$/, { message: "PIN code must be 6 digits" }),
  mainSwitchAmps: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
    z.number({ required_error: "Main switch capacity is required" }).positive("Capacity must be a positive number")
  ),
  equipments: z.array(equipmentSchema).min(1, { message: "At least one equipment item is required" }),
});

export type CertificateFormData = z.infer<typeof certificateSchema>;
