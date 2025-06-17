
import { z } from 'zod';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];

const fileSchema = z.instanceof(FileList)
  .optional()
  .transform(fileList => fileList?.[0] ?? undefined)
  .refine(file => !file || file.size <= MAX_FILE_SIZE, {
    message: `Max file size is 5MB.`,
  })
  .refine(file => !file || ACCEPTED_IMAGE_TYPES.includes(file.type) || file.type === 'application/pdf', {
    message: "Only .jpg, .jpeg, .png, .webp and .pdf formats are supported.",
  });

const aadhaarRegex = /^\d{12}$/; // Matches exactly 12 digits
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/; // Matches ABCDE1234F format

export const laborProfileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  contact: z.string().min(10, { message: "Contact number must be at least 10 digits" }).regex(/^\+?[0-9\s-()]{10,}$/, { message: "Invalid contact number format" }),
  aadhaarNumber: z.string()
    .optional()
    .transform(val => val === "" ? undefined : val) // Treat empty string as undefined
    .refine(val => !val || aadhaarRegex.test(val), {
      message: "Invalid Aadhaar number format (must be 12 digits).",
    }),
  panNumber: z.string()
    .optional()
    .transform(val => val === "" ? undefined : val) // Treat empty string as undefined
    .refine(val => !val || panRegex.test(val.toUpperCase()), {
      message: "Invalid PAN number format (e.g., ABCDE1234F).",
    }),
  photo: fileSchema,
  aadhaar: fileSchema, // This is for Aadhaar document upload
  pan: fileSchema,     // This is for PAN document upload
  drivingLicense: fileSchema,
});

export type LaborProfileFormData = z.infer<typeof laborProfileSchema>;
