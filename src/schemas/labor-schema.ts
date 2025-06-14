import { z } from 'zod';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];

// Updated fileSchema to handle FileList input, transform to File | undefined, and then validate.
// This makes the file fields truly optional.
const fileSchema = z.instanceof(FileList)
  .optional() // The FileList itself can be optional (e.g., if the input is untouched)
  .transform(fileList => fileList?.[0] ?? undefined) // Get the first File from FileList, or undefined
  .refine(file => !file || file.size <= MAX_FILE_SIZE, { // Validate size if file exists
    message: `Max file size is 5MB.`,
  })
  .refine(file => !file || ACCEPTED_IMAGE_TYPES.includes(file.type) || file.type === 'application/pdf', { // Validate type if file exists
    message: "Only .jpg, .jpeg, .png, .webp and .pdf formats are supported.",
  });


export const laborProfileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  contact: z.string().min(10, { message: "Contact number must be at least 10 digits" }).regex(/^\+?[0-9\s-()]{10,}$/, { message: "Invalid contact number format" }),
  photo: fileSchema,
  aadhaar: fileSchema,
  pan: fileSchema,
  drivingLicense: fileSchema,
});

export type LaborProfileFormData = z.infer<typeof laborProfileSchema>;
