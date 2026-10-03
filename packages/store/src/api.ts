import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query"
import Cookies from "js-cookie"

const ACCESS_TOKEN_KEY = "accessToken"
const REFRESH_TOKEN_KEY = "refreshToken"

const BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "https://digis-backend-preview.onrender.com"
)
  .trim()
  .replace(/\/+$/, "")


export function getAccessToken() {
  return Cookies.get(ACCESS_TOKEN_KEY) ?? null
}

export function getRefreshToken() {
  return Cookies.get(REFRESH_TOKEN_KEY) ?? null
}

export function setTokens(access: string, refresh: string) {
  Cookies.set(ACCESS_TOKEN_KEY, access, { secure: true, sameSite: "strict" })
  Cookies.set(REFRESH_TOKEN_KEY, refresh, { secure: true, sameSite: "strict" })
}

export function clearTokens() {
  Cookies.remove(ACCESS_TOKEN_KEY)
  Cookies.remove(REFRESH_TOKEN_KEY)
}

/**
 * Generates a random UUID v4 for the Idempotency-Key header.
 * Uses globalThis.crypto.randomUUID() when available with standard fallback.
 */
export function generateIdempotencyKey(): string {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID()
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  prepareHeaders: (headers) => {
    const token = getAccessToken()
    if (token) {
      headers.set("Authorization", `Bearer ${token}`)
    }
    return headers
  },
})

let refreshPromise: Promise<{ access: string; refresh: string }> | null = null

function performRefresh(refreshToken: string) {
  if (refreshPromise) return refreshPromise

  refreshPromise = fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": generateIdempotencyKey(),
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
    .then(async (res) => {
      if (!res.ok) throw new Error("refresh failed")
      const json = await res.json()
      const access = json?.data?.access_token
      const refresh = json?.data?.refresh_token
      if (!access || !refresh) throw new Error("missing tokens in refresh response")
      return { access, refresh }
    })
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  // Normalize args to ensure non-GET mutating requests carry an Idempotency-Key header
  let fetchArgs: FetchArgs
  if (typeof args === "string") {
    fetchArgs = { url: args }
  } else {
    fetchArgs = { ...args }
  }

  const method = (fetchArgs.method ?? "GET").toUpperCase()
  if (method !== "GET" && method !== "HEAD") {
    const existingHeaders: Record<string, string> = {}
    if (fetchArgs.headers) {
      if (fetchArgs.headers instanceof Headers) {
        fetchArgs.headers.forEach((value, key) => {
          existingHeaders[key] = value
        })
      } else if (Array.isArray(fetchArgs.headers)) {
        fetchArgs.headers.forEach(([key, value]) => {
          if (key && value) existingHeaders[key] = value
        })
      } else {
        Object.entries(fetchArgs.headers).forEach(([key, value]) => {
          if (value !== undefined) existingHeaders[key] = String(value)
        })
      }
    }

    if (!existingHeaders["Idempotency-Key"] && !existingHeaders["idempotency-key"]) {
      existingHeaders["Idempotency-Key"] = generateIdempotencyKey()
    }

    fetchArgs.headers = existingHeaders
  }

  let result = await baseQuery(fetchArgs, api, extraOptions)

  if (result.error && result.error.status === 401) {
    const refreshToken = getRefreshToken()

    if (refreshToken) {
      try {
        const newTokens = await performRefresh(refreshToken)
        setTokens(newTokens.access, newTokens.refresh)
        result = await baseQuery(fetchArgs, api, extraOptions)
      } catch {
        clearTokens()
      }
    } else {
      clearTokens()
    }
  }

  return result
}
