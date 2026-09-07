/**
 * Zod validation schemas for DEGES Organizer Platform
 */

import { z } from "zod"

// Step 1: Profile Information
export const profileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z.string().regex(/^(\+251|0)[79]\d{8}$/, "Invalid Ethiopian phone number"),
  nationalId: z.string().min(5, "National ID is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export type ProfileFormData = z.infer<typeof profileSchema>

// Step 2: Business Information
export const ORGANIZER_TYPES = [
  "individual",
  "company",
  "ngo",
  "government",
  "collective",
] as const

export const businessSchema = z.object({
  businessName: z.string().min(2, "Organization name must be at least 2 characters"),
  organizer_type: z.enum(ORGANIZER_TYPES).default("individual"),
  tin: z.string().min(10, "TIN must be at least 10 characters"),
  bankName: z.string().min(2, "Bank name is required"),
  accountNumber: z.string().min(5, "Account number is required"),
  address: z.string().min(10, "Address must be at least 10 characters"),
  city: z.string().min(2, "City is required"),
})

export type BusinessFormData = z.infer<typeof businessSchema>

// Step 3: Experience
export const experienceSchema = z.object({
  eventTypes: z.array(z.string()).min(1, "Select at least one event type"),
  audienceSize: z.string().min(1, "Select audience size"),
  eventFrequency: z.string().min(1, "Select event frequency"),
})

export type ExperienceFormData = z.infer<typeof experienceSchema>

// Step 4: Preferences
export const preferencesSchema = z.object({
  payoutMethod: z.string().min(1, "Select payout method"),
})

export type PreferencesFormData = z.infer<typeof preferencesSchema>

// Step 5: Agreement
export const agreementSchema = z.object({
  agreedToTerms: z.boolean(),
  agreedToFees: z.boolean(),
  agreedToDataAccuracy: z.boolean(),
})

export type AgreementFormData = z.infer<typeof agreementSchema>

// Step 6: Verification documents — all four are REQUIRED by the backend
// (PATCH /organizations/owner/:id/documents) before the organization can be
// submitted for verification. Keys must match the contract exactly.
const verificationFile = (label: string) =>
  z
    .instanceof(File, { message: `${label} is required` })
    .refine((f) => f.size <= 10 * 1024 * 1024, {
      message: `${label} must be smaller than 10MB`,
    })
    .refine(
      (f) =>
        ["application/pdf", "image/jpeg", "image/jpg", "image/png"].includes(
          f.type
        ),
      { message: `${label} must be a PDF, JPG, or PNG file` }
    )

export const verificationSchema = z.object({
  profileFile: verificationFile("Profile logo"),
  bannerFile: verificationFile("Banner image"),
  businessLicenseFile: verificationFile("Business license"),
  tinCertificateFile: verificationFile("TIN certificate"),
})

export type VerificationFormData = z.infer<typeof verificationSchema>

// Event creation schema
export const eventSchema = z.object({
  name: z.string().min(3, "Event name must be at least 3 characters"),
  category: z.string().min(1, "Select a category"),
  venue: z.string().min(2, "Venue name is required"),
  city: z.string().min(1, "Select a city"),
  startAt: z.string().min(1, "Start date is required"),
  endAt: z.string().optional(),
  bannerFile: z.instanceof(File).optional().or(z.string().optional()),
  description: z.string().min(20, "Description must be at least 20 characters"),
})

export type EventFormData = z.infer<typeof eventSchema>

// Ticket tier schema
export const ticketTierSchema = z.object({
  name: z.string().min(2, "Tier name is required"),
  total: z.number().min(1, "Total tickets must be at least 1"),
  price: z.number().min(0, "Price must be 0 or greater"),
})

export type TicketTierFormData = z.infer<typeof ticketTierSchema>

// Login schema (for reusing shared LoginForm)
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export type LoginFormData = z.infer<typeof loginSchema>
