import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQueryWithReauth, setTokens, clearTokens, getRefreshToken } from "../api"
import type { AppDispatch } from "../index"
import { usersApi } from "./usersApi"
import { rolesApi } from "./rolesApi"
import { permissionsApi } from "./permissionsApi"
import { categoriesApi } from "./categoriesApi"
import { venuesApi } from "./venuesApi"
import { artistsApi } from "./artistsApi"
import { organizationsApi } from "./organizationsApi"
import { membershipsApi } from "./membershipsApi"
import { eventsApi } from "./eventsApi"
import { organizerEventsApi } from "./organizerEventsApi"
import { legalApi } from "./legalApi"
import { dataRetentionApi } from "./dataRetentionApi"
import { ticketingApi } from "./ticketingApi"
import { eventScheduleApi } from "./eventScheduleApi"
import { registrationApi } from "./registrationApi"

export interface AuthUserRole {
  id?: string
  name?: string
  code?: string
  active?: boolean
}

export interface AuthUser {
  id: string
  email?: string
  phone?: string
  name?: string
  role?: string
  verified_at?: string | null
  created_at?: string
  updated_at?: string
  permissions?: string[]
  roles?: AuthUserRole[]
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

interface SignupRequest {
  user: {
    email?: string
    phone?: string
    password: string
    password_confirmation?: string
  }
}

interface SignupResponse {
  success: boolean
  message?: string
  data: {
    user: AuthUser
  }
}

interface ReauthenticateRequest {
  purpose: string
  password: string
}

interface ReauthenticateResponse {
  success: boolean
  message?: string
  data: {
    proof: string
  }
}

interface MeResponse {
  success: boolean
  data: {
    user: AuthUser
  }
}

// RTK Query caches are keyed by endpoint + args only — identical for every
// user. Without a reset, a newly logged-in account instantly sees the previous
// account's cached events/orgs/profile until a hard reload. Clearing every
// slice on auth identity change (login success / logout) forces active queries
// to resubscribe and refetch under the current tokens.
function resetAllApiState(dispatch: AppDispatch) {
  for (const api of [
    authApi,
    usersApi,
    rolesApi,
    permissionsApi,
    categoriesApi,
    venuesApi,
    artistsApi,
    organizationsApi,
    membershipsApi,
    eventsApi,
    organizerEventsApi,
    legalApi,
    dataRetentionApi,
    ticketingApi,
    eventScheduleApi,
    registrationApi,
  ]) {
    dispatch(api.util.resetApiState())
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
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          setTokens(data.data.access_token, data.data.refresh_token)
          resetAllApiState(dispatch)
        } catch {
          // credentials invalid — tokens not set
        }
      },
    }),
    signup: builder.mutation<SignupResponse, SignupRequest>({
      query: (body) => ({
        url: "/auth/signup",
        method: "POST",
        body,
      }),
    }),
    reauthenticate: builder.mutation<ReauthenticateResponse, ReauthenticateRequest>({
      query: (body) => ({
        url: "/auth/reauthenticate",
        method: "POST",
        body,
      }),
    }),
    getMe: builder.query<MeResponse, void>({
      query: () => "/auth/me",
    }),
    logout: builder.mutation<void, void>({
      query: () => {
        const refreshToken = getRefreshToken()
        return {
          url: "/auth/logout",
          method: "POST",
          body: refreshToken ? { refresh_token: refreshToken } : undefined,
        }
      },
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
        } catch {
          // logout may fail if session already expired — tokens cleared regardless
        } finally {
          clearTokens()
          resetAllApiState(dispatch)
        }
      },
    }),
  }),
})

export const {
  useLoginMutation,
  useSignupMutation,
  useReauthenticateMutation,
  useGetMeQuery,
  useLazyGetMeQuery,
  useLogoutMutation,
} = authApi

