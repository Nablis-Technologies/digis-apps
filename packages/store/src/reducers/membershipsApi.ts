import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQueryWithReauth, generateIdempotencyKey } from "../api"

export type MembershipRole = "owner" | "admin" | "staff" | "member"
export type MembershipStatus = "active" | "suspended"

export interface MembershipUser {
  id: string
  email?: string
  phone?: string | null
  name?: string | null
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

export interface MembershipInvitation {
  id: string
  organization_id: string
  role: "admin" | "staff"
  contact_type: "phone" | "email"
  masked_contact: string
  status: "pending" | "accepted" | "revoked" | "expired"
  delivery_status: string
  delivery_revision: number
  expires_at: string
  accepted_at?: string | null
  revoked_at?: string | null
  expired_at?: string | null
  created_at: string
}

export interface TeamRosterData {
  memberships: {
    data: Membership[]
    pagination: {
      current_page: number
      total_pages: number
      total_count: number
      per_page?: number
    }
  }
  invitations: {
    data: MembershipInvitation[]
    pagination: {
      current_page: number
      total_pages: number
      total_count: number
      per_page?: number
    }
  }
}

export interface TeamRosterParams {
  memberships_page?: number
  memberships_per_page?: number
  invitations_page?: number
  invitations_per_page?: number
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
    total_page?: number
    per_page: number
    total_count: number
    total_pages: number
  }
}

interface SingleResponse<T> {
  success?: boolean
  status?: string
  data: T
}

export interface CreateMembershipPayload {
  membership: {
    user_id?: string
    email?: string
    phone?: string
    identifier?: string
    role?: Exclude<MembershipRole, "owner">
  }
}

export interface CreateMembershipInvitationPayload {
  membership_invitation: {
    phone: string
    role: "admin" | "staff"
    email?: string
  }
}

export interface CreateMembershipInvitationResponse {
  invitation: MembershipInvitation
  claim_url?: string
}

export interface MembershipInvitationPreview {
  organization: {
    id: string
    name: string
  }
  role: "admin" | "staff"
  inviter?: {
    email?: string
  }
  masked_contact: string
  expires_at: string
}

export interface ClaimMembershipInvitationResponse {
  membership: Membership
  already_member: boolean
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
        { type: "OwnerMemberships", id: `ROSTER-${organizationId}` },
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
        { type: "OwnerMemberships", id: `ROSTER-${organizationId}` },
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
        { type: "OwnerMemberships", id: `ROSTER-${organizationId}` },
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
        { type: "OwnerMemberships", id: `ROSTER-${organizationId}` },
      ],
    }),

    // ─── Team Roster & Invitations (Unified Phone-First Model) ───────────────
    getOwnerTeamRoster: builder.query<
      SingleResponse<TeamRosterData>,
      { organizationId: string; params?: TeamRosterParams }
    >({
      query: ({ organizationId, params }) => ({
        url: `/organizations/owner/${organizationId}/team_roster`,
        params,
      }),
      providesTags: (_result, _error, { organizationId }) => [
        { type: "OwnerMemberships", id: `ROSTER-${organizationId}` },
        { type: "OwnerMemberships", id: `LIST-${organizationId}` },
      ],
    }),
    createOwnerMembershipInvitation: builder.mutation<
      SingleResponse<CreateMembershipInvitationResponse>,
      { organizationId: string; body: CreateMembershipInvitationPayload; idempotencyKey?: string }
    >({
      query: ({ organizationId, body, idempotencyKey }) => ({
        url: `/organizations/owner/${organizationId}/membership_invitations`,
        method: "POST",
        body,
        headers: {
          "Idempotency-Key": idempotencyKey || generateIdempotencyKey(),
        },
      }),
      invalidatesTags: (_result, _error, { organizationId }) => [
        { type: "OwnerMemberships", id: `ROSTER-${organizationId}` },
        { type: "OwnerMemberships", id: `LIST-${organizationId}` },
      ],
    }),
    resendOwnerMembershipInvitation: builder.mutation<
      SingleResponse<CreateMembershipInvitationResponse>,
      { organizationId: string; id: string; idempotencyKey?: string }
    >({
      query: ({ organizationId, id, idempotencyKey }) => ({
        url: `/organizations/owner/${organizationId}/membership_invitations/${id}/resend`,
        method: "POST",
        headers: {
          "Idempotency-Key": idempotencyKey || generateIdempotencyKey(),
        },
      }),
      invalidatesTags: (_result, _error, { organizationId }) => [
        { type: "OwnerMemberships", id: `ROSTER-${organizationId}` },
      ],
    }),
    revokeOwnerMembershipInvitation: builder.mutation<
      SingleResponse<{ invitation: MembershipInvitation }>,
      { organizationId: string; id: string; idempotencyKey?: string }
    >({
      query: ({ organizationId, id, idempotencyKey }) => ({
        url: `/organizations/owner/${organizationId}/membership_invitations/${id}/revoke`,
        method: "POST",
        headers: {
          "Idempotency-Key": idempotencyKey || generateIdempotencyKey(),
        },
      }),
      invalidatesTags: (_result, _error, { organizationId }) => [
        { type: "OwnerMemberships", id: `ROSTER-${organizationId}` },
      ],
    }),
    previewMembershipInvitation: builder.mutation<
      SingleResponse<MembershipInvitationPreview>,
      { token: string }
    >({
      query: ({ token }) => ({
        url: `/organizations/membership_invitations/preview`,
        method: "POST",
        body: { token },
      }),
    }),
    claimMembershipInvitation: builder.mutation<
      SingleResponse<ClaimMembershipInvitationResponse>,
      { token: string; idempotencyKey?: string }
    >({
      query: ({ token, idempotencyKey }) => ({
        url: `/organizations/membership_invitations/claim`,
        method: "POST",
        body: { token },
        headers: {
          "Idempotency-Key": idempotencyKey || generateIdempotencyKey(),
        },
      }),
      invalidatesTags: () => [{ type: "OwnerMemberships" }],
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
  useGetOwnerTeamRosterQuery,
  useCreateOwnerMembershipInvitationMutation,
  useResendOwnerMembershipInvitationMutation,
  useRevokeOwnerMembershipInvitationMutation,
  usePreviewMembershipInvitationMutation,
  useClaimMembershipInvitationMutation,
} = membershipsApi
