/**
 * Constants for DEGES Organizer Platform
 */

export const ORGANIZER_STORAGE_KEY = "organizerAccount"

export const ONBOARDING_STEPS = [
  {
    id: 1,
    title: "Profile Information",
    description: "Tell us about yourself",
    fields: ["fullName", "phone", "nationalId", "email", "password"],
  },
  {
    id: 2,
    title: "Business Details",
    description: "Your business information",
    fields: ["licenseFile", "tin", "bankName", "accountNumber", "address"],
  },
  {
    id: 3,
    title: "Experience",
    description: "Your event organizing experience",
    fields: ["eventTypes", "audienceSize", "eventFrequency"],
  },
  {
    id: 4,
    title: "Preferences",
    description: "Set your preferences",
    fields: ["payoutMethod", "supportOptions", "useQRScanner"],
  },
  {
    id: 5,
    title: "Agreement",
    description: "Review and agree to terms",
    fields: ["agreedToTerms", "agreedToFees", "agreedToDataAccuracy"],
  },
]

export const EVENT_TYPES = [
  { value: "concert", label: "Concert" },
  { value: "conference", label: "Conference" },
  { value: "festival", label: "Festival" },
  { value: "workshop", label: "Workshop" },
  { value: "seminar", label: "Seminar" },
  { value: "exhibition", label: "Exhibition" },
  { value: "sports", label: "Sports" },
  { value: "theater", label: "Theater" },
  { value: "comedy", label: "Comedy Show" },
  { value: "networking", label: "Networking" },
  { value: "charity", label: "Charity Event" },
  { value: "fashion", label: "Fashion Show" },
  { value: "art", label: "Art Event" },
  { value: "food", label: "Food & Drink" },
]

export const AUDIENCE_SIZES = [
  { value: "0-100", label: "Small (0-100)" },
  { value: "100-500", label: "Medium (100-500)" },
  { value: "500-1000", label: "Large (500-1,000)" },
  { value: "1000-5000", label: "Very Large (1,000-5,000)" },
  { value: "5000+", label: "Massive (5,000+)" },
]

export const EVENT_FREQUENCIES = [
  { value: "first-time", label: "First Time" },
  { value: "occasionally", label: "Occasionally (1-3 per year)" },
  { value: "regularly", label: "Regularly (4-12 per year)" },
  { value: "frequently", label: "Frequently (12+ per year)" },
]

export const PAYOUT_METHODS = [
  { value: "bank-transfer", label: "Bank Transfer" },
  { value: "mobile-money", label: "Mobile Money" },
  { value: "check", label: "Check" },
]

export const SUPPORT_OPTIONS = [
  { value: "email", label: "Email Support" },
  { value: "phone", label: "Phone Support" },
  { value: "chat", label: "Live Chat" },
  { value: "whatsapp", label: "WhatsApp" },
]

export const ETHIOPIAN_BANKS = [
  { value: "cbe", label: "Commercial Bank of Ethiopia" },
  { value: "awash", label: "Awash Bank" },
  { value: "dashen", label: "Dashen Bank" },
  { value: "boa", label: "Bank of Abyssinia" },
  { value: "wegagen", label: "Wegagen Bank" },
  { value: "united", label: "United Bank" },
  { value: "nib", label: "NIB International Bank" },
  { value: "coop", label: "Cooperative Bank of Oromia" },
  { value: "lion", label: "Lion International Bank" },
  { value: "oib", label: "Oromia International Bank" },
  { value: "zemen", label: "Zemen Bank" },
  { value: "bunna", label: "Bunna Bank" },
]

// Service fee percentages
export const SERVICE_FEE_PERCENTAGE = 5
export const PLATFORM_FEE_PERCENTAGE = 2.5

// QR code configuration
export const QR_CODE_SIZE = 512
export const QR_CODE_ERROR_CORRECTION = "H"

// Share card dimensions
export const SHARE_CARD_DIMENSIONS = {
  landscape: {
    width: 1200,
    height: 630,
  },
  portrait: {
    width: 1080,
    height: 1920,
  },
}

// Animation durations (ms)
export const ANIMATION = {
  fast: 150,
  normal: 300,
  slow: 500,
  verySlow: 700,
}

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 12
export const PAGE_SIZE_OPTIONS = [12, 24, 48, 96]

// Date formats
export const DATE_FORMAT = "MMM dd, yyyy"
export const DATE_TIME_FORMAT = "MMM dd, yyyy h:mm a"
export const TIME_FORMAT = "h:mm a"

// Image upload constraints
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

// Document upload constraints
export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024 // 10MB
export const ACCEPTED_DOCUMENT_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"]
