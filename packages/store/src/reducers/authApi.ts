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

export interface UserProfile {
  first_name?: string
  last_name?: string
  full_name?: string
  avatar_url?: string | null
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
  profile?: UserProfile | null
  [key: string]: unknown
}

export interface UserResponse {
  success: boolean
  data: AuthUser
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

export interface SignupRequest {
  user: {
    email?: string
    phone?: string
    first_name?: string
    last_name?: string
    password: string
    password_confirmation?: string
  }
  verification_token?: string
}

interface SignupResponse {
  success: boolean
  message?: string
  data: {
    user: AuthUser
    access_token?: string
    refresh_token?: string
  }
}

export interface RequestSignupOtpRequest {
  phone: string
}

export interface RequestSignupOtpResponse {
  success: boolean
  data: {
    challenge_id: string
    status: string
    expires_at: string
  }
}

export interface VerifyPhoneRequest {
  challengeId: string
  code: string
}

export interface VerifyPhoneResponse {
  success: boolean
  data: {
    verification_token: string
    expires_at?: string
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

export interface MeResponse {
  success: boolean
  data: {
    user: AuthUser
    [key: string]: unknown
  }
}

export interface UpdateProfilePayload {
  profile: {
    first_name?: string
    last_name?: string
  }
  idempotencyKey?: string
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
  tagTypes: ["CurrentUser"],
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
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          if (data.data.access_token && data.data.refresh_token) {
            setTokens(data.data.access_token, data.data.refresh_token)
            resetAllApiState(dispatch)
          }
        } catch {
          // credentials invalid — tokens not set
        }
      },
    }),
    reauthenticate: builder.mutation<ReauthenticateResponse, ReauthenticateRequest>({
      query: (body) => ({
        url: "/auth/reauthenticate",
        method: "POST",
        body,
      }),
    }),
    createPhoneVerification: builder.mutation<
      { success: boolean; data: { challenge_id: string } },
      { phone: string }
    >({
      query: (body) => ({
        url: "/auth/phone_verifications",
        method: "POST",
        body,
      }),
    }),
    requestSignupOtp: builder.mutation<
      RequestSignupOtpResponse,
      RequestSignupOtpRequest
    >({
      query: (body) => ({
        url: "/auth/signup/request_otp",
        method: "POST",
        body,
      }),
    }),
    verifyPhone: builder.mutation<
      VerifyPhoneResponse,
      VerifyPhoneRequest
    >({
      query: ({ challengeId, code }) => ({
        url: `/phone_verifications/${challengeId}/verify`,
        method: "POST",
        body: { code },
      }),
    }),
    getUser: builder.query<UserResponse, void>({
      query: () => "/user",
      providesTags: ["CurrentUser"],
    }),
    getMe: builder.query<MeResponse, void>({
      query: () => "/user",
      transformResponse: (response: UserResponse): MeResponse => ({
        success: response.success,
        data: {
          ...response.data,
          user: response.data,
        },
      }),
      providesTags: ["CurrentUser"],
    }),
    updateProfile: builder.mutation<UserResponse, UpdateProfilePayload>({
      query: ({ profile, idempotencyKey }) => ({
        url: "/user",
        method: "PATCH",
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
        body: { profile },
      }),
      invalidatesTags: ["CurrentUser"],
    }),
    uploadAvatar: builder.mutation<
      UserResponse,
      { file: File; idempotencyKey?: string }
    >({
      query: ({ file, idempotencyKey }) => {
        const formData = new FormData()
        formData.append("avatar", file)
        return {
          url: "/user/avatar",
          method: "PUT",
          headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
          body: formData,
        }
      },
      invalidatesTags: ["CurrentUser"],
    }),
    removeAvatar: builder.mutation<UserResponse, { idempotencyKey?: string } | void>({
      query: (arg) => ({
        url: "/user/avatar",
        method: "DELETE",
        headers: arg?.idempotencyKey ? { "Idempotency-Key": arg.idempotencyKey } : undefined,
      }),
      invalidatesTags: ["CurrentUser"],
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
  useCreatePhoneVerificationMutation,
  useRequestSignupOtpMutation,
  useVerifyPhoneMutation,
  useGetUserQuery,
  useLazyGetUserQuery,
  useGetMeQuery,
  useLazyGetMeQuery,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
  useRemoveAvatarMutation,
  useLogoutMutation,
} = authApi


