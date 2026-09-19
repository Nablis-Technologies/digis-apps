import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQueryWithReauth } from "../api"

export type MembershipRole = "owner" | "admin" | "staff" | "member"
export type MembershipStatus = "active" | "suspended"

export interface MembershipUser {
  id: string
  email?: string
  phone?: string | null
  [key: string]: unknown
}

export interface Membership {
  id: string
  user_id?: string
  role: MembershipRole
  status?: MembershipStatus
  suspended?: boolean
  created_at?: string
  updated_at?: string
  user?: MembershipUser
}

interface ListMembershipsParams {
  page?: number
  per_page?: number
}

interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    current_page: number
    per_page: number
    total_count: number
    total_pages: number
  }
}

interface SingleResponse<T> {
  success: boolean
  data: T
}

export interface CreateMembershipPayload {
  membership: {
    user_id: string
    role: Exclude<MembershipRole, "owner">
  }
}

export interface UpdateMembershipPayload {
  membership: {
    role: Exclude<MembershipRole, "owner">
  }
}

export const membershipsApi = createApi({
  reducerPath: "membershipsApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Memberships", "OwnerMemberships"],
  endpoints: (builder) => ({
    // ─── Admin Endpoints ─────────────────────────────────────────────────────
    listMemberships: builder.query<
      PaginatedResponse<Membership>,
      { organizationId: string; params?: ListMembershipsParams }
    >({
      query: ({ organizationId, params }) => ({
        url: `/admin/organizations/${organizationId}/memberships`,
        params,
      }),
      providesTags: (result, _error, { organizationId }) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "Memberships" as const, id })),
              { type: "Memberships", id: `LIST-${organizationId}` },
            ]
          : [{ type: "Memberships", id: `LIST-${organizationId}` }],
    }),
    getMembership: builder.query<
      SingleResponse<Membership>,
      { organizationId: string; id: string }
    >({
      query: ({ organizationId, id }) =>
        `/admin/organizations/${organizationId}/memberships/${id}`,
      providesTags: (_result, _error, { id }) => [{ type: "Memberships", id }],
    }),
    createMembership: builder.mutation<
      SingleResponse<Membership>,
      { organizationId: string; body: CreateMembershipPayload }
    >({
      query: ({ organizationId, body }) => ({
        url: `/admin/organizations/${organizationId}/memberships`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { organizationId }) => [
        { type: "Memberships", id: `LIST-${organizationId}` },
      ],
    }),
    updateMembership: builder.mutation<
      SingleResponse<Membership>,
      { organizationId: string; id: string; body: UpdateMembershipPayload }
    >({
      query: ({ organizationId, id, body }) => ({
        url: `/admin/organizations/${organizationId}/memberships/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { organizationId, id }) => [
        { type: "Memberships", id },
        { type: "Memberships", id: `LIST-${organizationId}` },
      ],
    }),
    deleteMembership: builder.mutation<
      void,
      { organizationId: string; id: string }
    >({
      query: ({ organizationId, id }) => ({
        url: `/admin/organizations/${organizationId}/memberships/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { organizationId }) => [
        { type: "Memberships", id: `LIST-${organizationId}` },
      ],
    }),

    // ─── Owner Endpoints (for organizer app) ─────────────────────────────────
    listOwnerMemberships: builder.query<
      PaginatedResponse<Membership>,
      { organizationId: string; params?: ListMembershipsParams }
    >({
      query: ({ organizationId, params }) => ({
        url: `/organizations/owner/${organizationId}/memberships`,
        params,
      }),
      providesTags: (result, _error, { organizationId }) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "OwnerMemberships" as const, id })),
              { type: "OwnerMemberships", id: `LIST-${organizationId}` },
            ]
          : [{ type: "OwnerMemberships", id: `LIST-${organizationId}` }],
    }),
    getOwnerMembership: builder.query<
      SingleResponse<Membership>,
      { organizationId: string; id: string }
    >({
      query: ({ organizationId, id }) =>
        `/organizations/owner/${organizationId}/memberships/${id}`,
      providesTags: (_result, _error, { id }) => [{ type: "OwnerMemberships", id }],
    }),
    createOwnerMembership: builder.mutation<
      SingleResponse<Membership>,
      { organizationId: string; body: CreateMembershipPayload }
    >({
      query: ({ organizationId, body }) => ({
        url: `/organizations/owner/${organizationId}/memberships`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { organizationId }) => [
        { type: "OwnerMemberships", id: `LIST-${organizationId}` },
      ],
    }),
    updateOwnerMembership: builder.mutation<
      SingleResponse<Membership>,
      { organizationId: string; id: string; body: UpdateMembershipPayload }
    >({
      query: ({ organizationId, id, body }) => ({
        url: `/organizations/owner/${organizationId}/memberships/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { organizationId, id }) => [
        { type: "OwnerMemberships", id },
        { type: "OwnerMemberships", id: `LIST-${organizationId}` },
      ],
    }),
    deleteOwnerMembership: builder.mutation<
      void,
      { organizationId: string; id: string }
    >({
      query: ({ organizationId, id }) => ({
        url: `/organizations/owner/${organizationId}/memberships/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { organizationId }) => [
        { type: "OwnerMemberships", id: `LIST-${organizationId}` },
      ],
    }),
    suspendOwnerMembership: builder.mutation<
      void,
      { organizationId: string; id: string }
    >({
      query: ({ organizationId, id }) => ({
        url: `/organizations/owner/${organizationId}/memberships/${id}/suspend`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, { organizationId, id }) => [
        { type: "OwnerMemberships", id },
        { type: "OwnerMemberships", id: `LIST-${organizationId}` },
      ],
    }),
    activateOwnerMembership: builder.mutation<
      void,
      { organizationId: string; id: string }
    >({
      query: ({ organizationId, id }) => ({
        url: `/organizations/owner/${organizationId}/memberships/${id}/activate`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, { organizationId, id }) => [
        { type: "OwnerMemberships", id },
        { type: "OwnerMemberships", id: `LIST-${organizationId}` },
      ],
    }),
  }),
})

export const {
  useListMembershipsQuery,
  useGetMembershipQuery,
  useCreateMembershipMutation,
  useUpdateMembershipMutation,
  useDeleteMembershipMutation,
  useListOwnerMembershipsQuery,
  useGetOwnerMembershipQuery,
  useCreateOwnerMembershipMutation,
  useUpdateOwnerMembershipMutation,
  useDeleteOwnerMembershipMutation,
  useSuspendOwnerMembershipMutation,
  useActivateOwnerMembershipMutation,
} = membershipsApi

