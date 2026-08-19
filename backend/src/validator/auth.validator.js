import { z } from "zod";

import { ROLE_VALUES, normalizeRole } from "../constants/roles.js";

const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),

  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .transform((value) => value.toLowerCase()),

  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username cannot exceed 30 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    )
    .transform((value) => value.toLowerCase()),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password cannot exceed 128 characters"),

  /*
   * Optional. Accepted in any casing and normalized to the
   * canonical value. When omitted, the model default applies.
   */
  role: z
    .string()
    .trim()
    .transform((value, ctx) => {
      const role = normalizeRole(value);

      if (!role) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Role must be one of: ${ROLE_VALUES.join(", ")}`,
        });

        return z.NEVER;
      }

      return role;
    })
    .optional(),
});

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .transform((value) => value.toLowerCase()),

  password: z
    .string()
    .min(1, "Password is required")
    .max(128, "Password cannot exceed 128 characters"),
});

const refreshSchema = z.object({
  refreshToken: z
    .string()
    .min(1, "Refresh token is required"),
});

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .transform((value) => value.toLowerCase()),
});

const resetPasswordSchema = z.object({
  token: z
    .string()
    .min(1, "Reset token is required"),

  password: registerSchema.shape.password,
});

const resendVerificationSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .transform((value) => value.toLowerCase()),
});

const verifyEmailQuerySchema = z.object({
  token: z
    .string()
    .min(1, "Verification token is required"),
});

export {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  resendVerificationSchema,
  verifyEmailQuerySchema,
}