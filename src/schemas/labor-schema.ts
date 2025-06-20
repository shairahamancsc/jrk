
import { z } from 'zod';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];

// Schema to validate a single File object
const singleFileValidationSchema = z.instanceof(File)
  .refine(file => file.size <= MAX_FILE_SIZE, {
    message: `Max file size is 5MB.`,
  })
  .refine(file => ACCEPTED_IMAGE_TYPES.includes(file.type) || file.type === 'application/pdf', {
    message: "Only .jpg, .jpeg, .png, .webp and .pdf formats are supported.",
  });

// Flexible file schema that handles FileList (from register) or File/undefined/null (from setValue or initial state)
const fileSchema = z.preprocess(
  (arg) => {
    if (arg instanceof FileList) {
      // If it's a FileList, take the first file, or undefined if empty
      return arg.length > 0 ? arg[0] : undefined;
    }
    // If it's already a File, undefined, or null, pass it through
    return arg;
  },
  // After preprocessing, the value should be a single File, undefined, or null.
  // We make this effectively optional and nullable, and if it's a File, it must pass singleFileValidationSchema.
  z.union([
    singleFileValidationSchema,
    z.undefined(),
    z.null(), // Explicitly allow null if it might be passed by react-hook-form or initial values
  ])
  // .optional() is implicitly handled by z.undefined() in the union.
  // If the field itself is optional in the main schema, that's handled at the object level.
);

const aadhaarRegex = /^\d{12}$/; // Matches exactly 12 digits
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/; // Matches ABCDE1234F format

export const laborProfileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  contact: z.string().min(10, { message: "Contact number must be at least 10 digits" }).regex(/^\+?[0-9\s-()]{10,}$/, { message: "Invalid contact number format" }),
  aadhaarNumber: z.string()
    .optional()
    .transform(val => val === "" ? undefined : val)
    .refine(val => !val || aadhaarRegex.test(val), {
      message: "Invalid Aadhaar number format (must be 12 digits).",
    }),
  panNumber: z.string()
    .optional()
    .transform(val => val === "" ? undefined : val)
    .refine(val => !val || panRegex.test(val.toUpperCase()), {
      message: "Invalid PAN number format (e.g., ABCDE1234F).",
    }),
  dailySalary: z.preprocess(
    (val) => (val === "" || val === undefined || val === null || (typeof val === 'string' && val.trim() === '') ? undefined : Number(val)),
    z.number().positive({ message: "Daily salary must be a positive number" }).optional()
  ),
  photo: fileSchema.optional().nullable(), // Making the field itself optional and nullable in the object
  aadhaar: fileSchema.optional().nullable(),
  pan: fileSchema.optional().nullable(),
  drivingLicense: fileSchema.optional().nullable(),
});

export type LaborProfileFormData = z.infer<typeof laborProfileSchema>;
