import { toast } from "sonner"

/**
 * Extract a human-readable message from an RTK Query / fetch error.
 * Backend errors arrive as `{ data: { message?: string, errors?: ... } }`;
 * network/HTTP failures fall back to the provided default.
 */
export function errorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  if (err && typeof err === "object") {
    const data = (err as { data?: unknown }).data
    if (data && typeof data === "object") {
      const d = data as { message?: unknown; error?: unknown }
      if (typeof d.message === "string" && d.message.trim()) return d.message
      if (typeof d.error === "string" && d.error.trim()) return d.error
    }
    const status = (err as { status?: unknown }).status
    if (typeof status === "number") {
      if (status === 401) return "You are not authorized. Please log in again."
      if (status === 403) return "You don't have permission to do that."
      if (status === 404) return "The requested resource was not found."
      if (status >= 500) return "Server error. Please try again later."
    }
  }
  return fallback
}

export function toastError(err: unknown, fallback?: string) {
  toast.error(errorMessage(err, fallback))
}

export function toastSuccess(message: string) {
  toast.success(message)
}
