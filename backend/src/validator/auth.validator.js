import { z } from "zod";

/*
 * NOTE: `role` is intentionally absent.
 *
 * Zod strips unknown keys, so a client sending
 * {"role": "admin"} has it silently discarded here and the
 * account is created on DEFAULT_ROLE. This is the guard that
 * stops anyone hitting public signup from self-assigning
 * admin. Roles are granted only via PATCH /api/v1/users/:id/role,
 * which is admin-only. Do not add `role` to this schema.
 */
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

export {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
}