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

/**
 * Normalizes a user-entered YouTube URL by ensuring https:// protocol
 * and transforming embed URLs to watch URLs so backend validation passes.
 */
export const normalizeYoutubeUrl = (raw: string): string => {
  let trimmed = (raw || "").trim()
  if (!trimmed) return ""
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = "https://" + trimmed
  } else if (/^http:\/\//i.test(trimmed)) {
    trimmed = trimmed.replace(/^http:\/\//i, "https://")
  }
  try {
    const urlObj = new URL(trimmed)
    const embedMatch = urlObj.pathname.match(/^\/embed\/([\w-]{6,})/)
    if (embedMatch && embedMatch[1]) {
      return `https://www.youtube.com/watch?v=${embedMatch[1]}`
    }
  } catch {
    // Return trimmed if URL constructor fails
  }
  return trimmed
}

/**
 * Validates whether a given URL is an allowed YouTube link matching the backend's criteria:
 * - Host must be one of: youtube.com, www.youtube.com, m.youtube.com, youtube-nocookie.com, youtu.be
 * - youtu.be must have path with video ID (e.g. /VIDEO_ID)
 * - youtube.com must be /watch?v=..., /shorts/..., /embed/..., or have v= query parameter
 */
export const validateYoutubeUrl = (
  raw: string
): { valid: boolean; error?: string; normalizedUrl?: string } => {
  const trimmed = (raw || "").trim()
  if (!trimmed) {
    return { valid: false, error: "Please enter a YouTube video URL" }
  }
  const normalized = normalizeYoutubeUrl(trimmed)
  let urlObj: URL
  try {
    urlObj = new URL(normalized)
  } catch {
    return { valid: false, error: "Invalid URL format" }
  }

  const allowedHosts = [
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
    "youtube-nocookie.com",
    "youtu.be",
  ]
  const host = urlObj.hostname.toLowerCase()
  if (!allowedHosts.includes(host)) {
    return {
      valid: false,
      error: "URL must be a YouTube link (e.g. youtube.com or youtu.be)",
    }
  }

  if (host === "youtu.be") {
    if (!/^\/[\w-]{6,}\/?$/.test(urlObj.pathname)) {
      return {
        valid: false,
        error: "Invalid youtu.be link format (e.g. https://youtu.be/VIDEO_ID)",
      }
    }
  } else {
    const isWatch = urlObj.pathname.startsWith("/watch")
    const isShorts = /^\/shorts\/[\w-]{6,}\/?/.test(urlObj.pathname)
    const isEmbed = /^\/embed\/[\w-]{6,}\/?/.test(urlObj.pathname)
    const vParam = urlObj.searchParams.get("v")
    const hasVParam = Boolean(vParam && /^[\w-]{6,}$/.test(vParam))

    if (isWatch && !hasVParam) {
      return {
        valid: false,
        error: "YouTube watch link must include the video ID (e.g. ?v=...)",
      }
    }
    if (!isWatch && !isShorts && !isEmbed && !hasVParam) {
      return {
        valid: false,
        error: "Must be a YouTube watch, shorts, or share link",
      }
    }
  }

  return { valid: true, normalizedUrl: normalized }
}

/**
 * Maps frontend date selection options ("all_dates", "fixed", "attendee_choice")
 * to backend API valid date_selection values ("fixed", "choose_one")
 */
export const mapDateSelection = (ds?: string): "fixed" | "choose_one" => {
  if (ds === "attendee_choice" || ds === "choose_one") {
    return "choose_one"
  }
  return "fixed"
}

/**
 * Unpacks backend API error responses, including Rails validation hash { errors: { field: [msgs] } }
 */
export const formatApiErrorMessage = (err: any, fallback = "An unexpected error occurred"): string => {
  if (!err) return fallback
  if (err?.data?.errors && typeof err.data.errors === "object") {
    const errorMessages = Object.entries(err.data.errors).map(([, messages]) => {
      const msgStr = Array.isArray(messages) ? messages.join(", ") : String(messages)
      return msgStr
    })
    if (errorMessages.length > 0) return errorMessages.join(". ")
  }
  return err?.data?.message || err?.data?.error || err?.message || fallback
}

/**
 * Normalizes a claim URL returned from the backend so that its origin
 * always matches the current frontend host/port (e.g. localhost:3001),
 * preventing routing errors when backend returns localhost:3000.
 */
export function normalizeClaimUrl(url?: string | null): string | undefined {
  if (!url) return undefined
  if (typeof window !== "undefined") {
    try {
      const parsed = new URL(url)
      return `${window.location.origin}${parsed.pathname}${parsed.search}${parsed.hash}`
    } catch {
      if (url.startsWith("/")) {
        return `${window.location.origin}${url}`
      }
    }
  }
  return url || undefined
}
