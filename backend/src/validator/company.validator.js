import { z } from "zod";

const addressSchema = z.object({
  street: z.string().trim().min(1, "Street is required"),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().min(1, "State is required"),
  country: z.string().trim().min(1, "Country is required"),
  postalCode: z.string().trim().min(3, "Postal code is required"),
});

const socialLinksSchema = z.object({
  linkedin: z.string().url("Invalid LinkedIn URL").or(z.literal("")).optional(),
  twitter: z.string().url("Invalid Twitter URL").or(z.literal("")).optional(),
  facebook: z.string().url("Invalid Facebook URL").or(z.literal("")).optional(),
  instagram: z.string().url("Invalid Instagram URL").or(z.literal("")).optional(),
});

const companyOnboardingSchema = z.object({
  businessName: z
    .string()
    .trim()
    .min(2, "Business name must contain at least 2 characters")
    .max(150),

  legalName: z
    .string()
    .trim()
    .min(2, "Legal name must contain at least 2 characters")
    .max(200),

  industry: z
    .string()
    .trim()
    .min(2, "Industry is required")
    .max(100),

  description: z
    .string()
    .trim()
    .min(10, "Description must contain at least 10 characters")
    .max(2000),

  website: z
    .string()
    .url("Invalid website URL")
    .or(z.literal(""))
    .optional(),

  email: z
    .string()
    .trim()
    .email("Invalid company email"),

  phone: z
    .string()
    .trim()
    .min(7, "Invalid phone number"),

  logo: z
    .string()
    .trim()
    .optional()
    .or(z.literal("")),

  address: addressSchema,

  socialLinks: socialLinksSchema.optional(),

  foundedYear: z
    .number()
    .int()
    .min(1800)
    .max(new Date().getFullYear())
    .optional(),

  employeeCount: z
    .number()
    .int()
    .min(1, "Employee count must be at least 1")
    .optional(),
});

const companyUpdateSchema = companyOnboardingSchema.partial();

export {
  companyOnboardingSchema,
  companyUpdateSchema,
};