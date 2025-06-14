import { z } from 'zod';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];

const fileSchema = z.instanceof(File)
  .refine((file) => file.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
  .refine(
    (file) => ACCEPTED_IMAGE_TYPES.includes(file.type) || file.type === 'application/pdf',
    "Only .jpg, .jpeg, .png, .webp and .pdf formats are supported."
  ).optional();


export const laborProfileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  contact: z.string().min(10, { message: "Contact number must be at least 10 digits" }).regex(/^\+?[0-9\s-()]{10,}$/, { message: "Invalid contact number format" }),
  photo: fileSchema,
  aadhaar: fileSchema,
  pan: fileSchema,
  drivingLicense: fileSchema,
});

export type LaborProfileFormData = z.infer<typeof laborProfileSchema>;
