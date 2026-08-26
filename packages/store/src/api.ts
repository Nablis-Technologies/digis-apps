import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query"
import Cookies from "js-cookie"

const ACCESS_TOKEN_KEY = "accessToken"
const REFRESH_TOKEN_KEY = "refreshToken"

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"

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
    headers: { "Content-Type": "application/json" },
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
  let result = await baseQuery(args, api, extraOptions)

  if (result.error && result.error.status === 401) {
    const refreshToken = getRefreshToken()

    if (refreshToken) {
      try {
        const newTokens = await performRefresh(refreshToken)
        setTokens(newTokens.access, newTokens.refresh)
        result = await baseQuery(args, api, extraOptions)
      } catch {
        clearTokens()
      }
    } else {
      clearTokens()
    }
  }

  return result
}
