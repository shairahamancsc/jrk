import { z } from 'zod';

export const loginSchema = z.object({
  userId: z.string().min(1, { message: "User ID is required" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
});

export type LoginFormData = z.infer<typeof loginSchema>;
