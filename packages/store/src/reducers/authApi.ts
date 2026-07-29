import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQueryWithReauth, setTokens, clearTokens } from "../api"

export interface AuthUser {
  id: string
  email?: string
  phone?: string
  name?: string
  role?: string
  [key: string]: unknown
}

interface LoginRequest {
  identifier: string
  password: string
}

interface LoginResponse {
  success: boolean
  data: {
    access_token: string
    refresh_token: string
    user: AuthUser
  }
}

interface MeResponse {
  success: boolean
  data: {
    user: AuthUser
  }
}

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          setTokens(data.data.access_token, data.data.refresh_token)
        } catch {
          // credentials invalid — tokens not set
        }
      },
    }),
    getMe: builder.query<MeResponse, void>({
      query: () => "/auth/me",
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled
        } catch {
          // logout may fail if session already expired — tokens cleared regardless
        } finally {
          clearTokens()
        }
      },
    }),
  }),
})

export const { useLoginMutation, useGetMeQuery, useLazyGetMeQuery, useLogoutMutation } = authApi
