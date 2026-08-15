import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQueryWithReauth } from "../api"

export type MembershipRole = "owner" | "admin" | "staff" | "member"

export interface Membership {
  id: string
  user_id: string
  role: MembershipRole
  suspended: boolean
  created_at?: string
  updated_at?: string
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

interface CreateMembershipPayload {
  membership: {
    user_id: string
    role: Exclude<MembershipRole, "owner">
  }
}

interface UpdateMembershipPayload {
  membership: {
    role: Exclude<MembershipRole, "owner">
  }
}

export const membershipsApi = createApi({
  reducerPath: "membershipsApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Memberships"],
  endpoints: (builder) => ({
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
  }),
})

export const {
  useListMembershipsQuery,
  useGetMembershipQuery,
  useCreateMembershipMutation,
  useUpdateMembershipMutation,
  useDeleteMembershipMutation,
} = membershipsApi
