import { z } from "zod";

export const registerSchema = z
  .object({
    email: z.email({ error: "Please enter a valid email address." }),
    password: z
      .string({ error: "Password is required." })
      .min(6, "Password must be at least 6 characters long."),
    confirmPassword: z
      .string({ error: "Please confirm your password." })
      .min(6, "Confirm password must be at least 6 characters long."),
    firstName: z.string({ error: "First name is required." }),
    lastName: z.string({ error: "Last name is required." }),
    dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), {
      error: "Invalid date format.",
    }),
    address: z.string({ error: "Address is required." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const updatePasswordSchema = z
  .object({
    currentPassword: z
      .string({ error: "Password is required." })
      .min(6, "Password must be at least 6 characters long."),
    newPassword: z
      .string({ error: "Please confirm your password." })
      .min(6, "Confirm password must be at least 6 characters long."),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password.",
    path: ["newPassword"],
  });

export const loginSchema = z.object({
  email: z.email({ error: "Please enter a valid email address." }),
  password: z
    .string({ error: "Password is required." })
    .min(6, "Password must be at least 6 characters long."),
});

export const updateSchema = z.object({
  email: z.email({ error: "Please enter a valid email address." }),
  firstName: z
    .string({ error: "First name is required." })
    .min(1, "First Name must be atleast 1 char long."),
  lastName: z
    .string({ error: "Last name is required." })
    .min(1, "Last Name must be atleast 1 char long."),
  dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), {
    error: "Invalid date format.",
  }),
  address: z
    .string({ error: "Address is required." })
    .min(1, "Address must be atleast 10 char long."),
});
