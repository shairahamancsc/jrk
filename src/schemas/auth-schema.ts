import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }).min(1, { message: "Email is required" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  captchaToken: z.string().optional(), // Added for CAPTCHA
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const supervisorCreationSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }).min(1, { message: "Email is required" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  // You can add more fields here if needed, like name, contact, etc.
  // For now, we'll keep it simple with email and password.
});

export type SupervisorCreationFormData = z.infer<typeof supervisorCreationSchema>;
