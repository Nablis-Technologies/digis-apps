/**
 * Utility functions for DEGES Organizer Platform
 */

export { cn } from "@workspace/ui/lib/utils"

/**
 * Currency formatter for Ethiopian Birr
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "ETB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Short currency format (45K, 1.2M)
 */
export const formatCurrencyShort = (value: number): string => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M ETB`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K ETB`
  return `${value} ETB`
}

/**
 * Number with commas
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat("en-US").format(value)
}

/**
 * Date formatter
 */
export const formatDate = (date?: Date | string | null): string => {
  if (!date) return "—"
  const dateObj = typeof date === "string" ? new Date(date) : date
  if (isNaN(dateObj.getTime())) return "—"
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(dateObj)
}

/**
 * Full date and time formatter
 */
export const formatDateTime = (date?: Date | string | null): string => {
  if (!date) return "—"
  const dateObj = typeof date === "string" ? new Date(date) : date
  if (isNaN(dateObj.getTime())) return "—"
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(dateObj)
}

/**
 * Relative time formatter (e.g., "in 5 days", "2 hours ago")
 */
export const formatRelativeTime = (date?: Date | string | null): string => {
  if (!date) return "—"
  const dateObj = typeof date === "string" ? new Date(date) : date
  if (isNaN(dateObj.getTime())) return "—"
  const now = new Date()
  const diffMs = dateObj.getTime() - now.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.floor(diffMs / (1000 * 60))

  if (Math.abs(diffDays) >= 1) {
    return diffDays > 0 ? `in ${diffDays} days` : `${Math.abs(diffDays)} days ago`
  }
  if (Math.abs(diffHours) >= 1) {
    return diffHours > 0 ? `in ${diffHours} hours` : `${Math.abs(diffHours)} hours ago`
  }
  if (Math.abs(diffMinutes) >= 1) {
    return diffMinutes > 0 ? `in ${diffMinutes} minutes` : `${Math.abs(diffMinutes)} minutes ago`
  }
  return "just now"
}

/**
 * Calculate percentage
 */
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

/**
 * Get progress color based on percentage
 */
export const getProgressColor = (percentage: number): string => {
  if (percentage >= 90) return "text-emerald-600"
  if (percentage >= 70) return "text-blue-600"
  if (percentage >= 50) return "text-amber-600"
  return "text-red-600"
}

/**
 * Get status badge variant
 */
export const getStatusVariant = (
  status: "Draft" | "Published" | "Live"
): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "Live":
      return "default"
    case "Published":
      return "secondary"
    case "Draft":
      return "outline"
  }
}

/**
 * Truncate text
 */
export const truncate = (text: string, length: number): string => {
  if (text.length <= length) return text
  return `${text.slice(0, length)}...`
}

/**
 * Generate initials from name
 */
export const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Check if organizer account exists in localStorage
 */
export const getOrganizerAccount = (): any | null => {
  if (typeof window === "undefined") return null
  const stored = localStorage.getItem("organizerAccount")
  return stored ? JSON.parse(stored) : null
}

/**
 * Save organizer account to localStorage
 */
export const saveOrganizerAccount = (data: any): void => {
  if (typeof window === "undefined") return
  localStorage.setItem("organizerAccount", JSON.stringify(data))
}

/**
 * Clear organizer account from localStorage
 */
export const clearOrganizerAccount = (): void => {
  if (typeof window === "undefined") return
  localStorage.removeItem("organizerAccount")
}

/**
 * Check if onboarding is complete
 */
export const isOnboardingComplete = (): boolean => {
  const account = getOrganizerAccount()
  return account && account.completedAt
}

/**
 * Generate random ID
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
