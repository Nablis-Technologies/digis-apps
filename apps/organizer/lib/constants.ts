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
    fields: ["businessName", "organizer_type", "tin", "bankName", "accountNumber", "address", "city"],
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
    fields: ["payoutMethod"],
  },
  {
    id: 5,
    title: "Agreement",
    description: "Review and agree to terms",
    fields: ["agreedToTerms", "agreedToFees", "agreedToDataAccuracy"],
  },
  {
    id: 6,
    title: "Verification",
    description: "Upload documents & submit for review",
    fields: ["profileFile", "bannerFile", "businessLicenseFile", "tinCertificateFile"],
  },
]

export const EVENT_TYPES = [
  { value: "music", label: "Music" },
  { value: "sports", label: "Sports" },
  { value: "conference", label: "Conference" },
  { value: "comedy", label: "Comedy" },
  { value: "theater", label: "Theater" },
  { value: "festival", label: "Festival" },
  { value: "workshop", label: "Workshop" },
  { value: "exhibition", label: "Exhibition" },
  { value: "other", label: "Other" },
]

export const AUDIENCE_SIZES = [
  { value: "under_100", label: "Small (Under 100)" },
  { value: "100_500", label: "Medium (100-500)" },
  { value: "500_1000", label: "Large (500-1,000)" },
  { value: "1000_5000", label: "Very Large (1,000-5,000)" },
  { value: "5000_plus", label: "Massive (5,000+)" },
]

export const EVENT_FREQUENCIES = [
  { value: "one_time", label: "One Time" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "weekly", label: "Weekly" },
  { value: "seasonal", label: "Seasonal" },
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

export interface EthiopianBank {
  value: string
  label: string
  shortName?: string
}

export const ETHIOPIAN_BANKS: EthiopianBank[] = [
  { value: "cbe", label: "Commercial Bank of Ethiopia", shortName: "CBE" },
  { value: "awash", label: "Awash Bank", shortName: "Awash" },
  { value: "dashen", label: "Dashen Bank", shortName: "Dashen" },
  { value: "boa", label: "Bank of Abyssinia", shortName: "Abyssinia" },
  { value: "wegagen", label: "Wegagen Bank", shortName: "Wegagen" },
  { value: "nib", label: "NIB International Bank", shortName: "NIB Bank" },
  { value: "coop", label: "Cooperative Bank of Oromia", shortName: "Coop Bank" },
  { value: "lion", label: "Lion International Bank", shortName: "Lion Bank" },
  { value: "oib", label: "Oromia International Bank", shortName: "Oromia Bank" },
  { value: "zemen", label: "Zemen Bank", shortName: "Zemen" },
  { value: "bunna", label: "Bunna Bank", shortName: "Bunna" },
  { value: "hibret", label: "Hibret Bank", shortName: "Hibret" },
  { value: "berhan", label: "Berhan Bank", shortName: "Berhan" },
]

export const BANK_LOGOS: Record<string, string> = {
  cbe: "/assets/CBE.jpeg",
  awash: "/assets/AWASH.jpeg",
  dashen: "/assets/DASHEN.png",
  boa: "/assets/BOA.png",
  wegagen: "/assets/WEGAGEN.png",
  nib: "/assets/NIB.png",
  coop: "/assets/COOP.png",
  lion: "/assets/LION.jpeg",
  oib: "/assets/OROMIA.png",
  zemen: "/assets/ZEMEN.png",
  bunna: "/assets/BUNNA.jpeg",
  hibret: "/assets/HIBRET.jpeg",
  berhan: "/assets/BERHAN.jpeg",
}

export interface MobileWalletProvider {
  value: string
  label: string
  operator: string
  color: string
  shortCode: string
  logo?: string
}

export const ETHIOPIAN_MOBILE_WALLETS: MobileWalletProvider[] = [
  {
    value: "telebirr",
    label: "Telebirr",
    operator: "Ethio Telecom",
    color: "#0072BC",
    shortCode: "09...",
  },
  {
    value: "cbe_birr",
    label: "CBE Birr",
    operator: "Commercial Bank of Ethiopia",
    color: "#7B2253",
    shortCode: "09...",
    logo: "/assets/CBE BIRR.jpeg",
  },
  {
    value: "mpesa",
    label: "M-Pesa",
    operator: "Safaricom Ethiopia",
    color: "#008751",
    shortCode: "07...",
  },
  {
    value: "awash_birr",
    label: "Awash Birr",
    operator: "Awash Bank",
    color: "#003366",
    shortCode: "09...",
    logo: "/assets/AWASH BIRR.jpeg",
  },
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
