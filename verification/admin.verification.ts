import { z } from "zod";

export const adminCreateUserSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  address: z.string().min(1),
  dateOfBirth: z
    .string()
    .optional()
    .refine(
      (val) => !val || !Number.isNaN(Date.parse(val)),
      "Invalid date format",
    ),
});

export const adminUpdateUserStatusSchema = z.object({
  isActive: z.boolean(),
});
