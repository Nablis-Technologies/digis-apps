/**
 * Core TypeScript types for DEGES Organizer Platform
 */

export interface TicketTier {
  id: string
  name: string
  total: number
  sold: number
  price: number
}

export interface Event {
  id: string
  name: string
  category: string
  bannerUrl: string
  venue: string
  city: string
  startAt: string // ISO date
  endAt?: string
  status: "Draft" | "Published" | "Live"
  tiers: TicketTier[]
}

export interface Organizer {
  fullName: string
  email: string
  phone: string
  nationalId: string
  password: string
  // Business info
  licenseUrl?: string
  tin: string
  bankName: string
  accountNumber: string
  address: string
  // Experience
  eventTypes: string[]
  audienceSize: string
  eventFrequency: string
  // Preferences
  payoutMethod: string
  supportOptions: string[]
  useQRScanner: boolean
  // Agreement
  agreedToTerms: boolean
  agreedToFees: boolean
  agreedToDataAccuracy: boolean
  completedAt: string
}

export interface KPI {
  label: string
  value: string | number
  change?: number
  trend?: "up" | "down"
  icon?: React.ComponentType<{ className?: string }>
}

export interface ChartDataPoint {
  date: string
  value: number
  label?: string
}

export interface TopEvent {
  id: string
  name: string
  revenue: number
  ticketsSold: number
  bannerUrl: string
}

// Onboarding step data
export interface OnboardingStep {
  id: number
  title: string
  description: string
  fields: string[]
}

// Share card generator
export interface ShareCardConfig {
  orientation: "landscape" | "portrait"
  bannerUrl: string
  eventName: string
  venue: string
  date: string
  qrCodeUrl: string
  colorPalette: string[]
}

// Status types
export type EventStatus = "Draft" | "Published" | "Live"
export type OnboardingStatus = "incomplete" | "complete"
