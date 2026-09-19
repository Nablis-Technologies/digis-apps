import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQueryWithReauth } from "../api"

export interface Organization {
  id: string
  name: string
  description: string | null
  owner_id: string
  organizer_type: "individual" | "company"
  category: string | null
  contact_phone: string | null
  contact_email: string | null
  city: string | null
  region: string | null
  country: string | null
  website_url: string | null
  verified: boolean
  active: boolean
  tin_number?: string | null
  estimated_audience?: string | null
  event_frequency?: string | null
  created_at?: string
  updated_at?: string
}

export interface ListOrgsParams {
  page?: number
  per_page?: number
  order_by?: string
  order_direction?: "asc" | "desc"
  search?: string
  q?: Record<string, string | number | boolean>
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

interface CreateOrgPayload {
  organization: {
    name: string
    description?: string
    organizer_type?: "individual" | "company" | "ngo" | "government" | "collective"
    category?: string
    contact_phone?: string
    contact_email?: string
    website_url?: string
    tin_number?: string
    address_line1?: string
    address_line2?: string
    city?: string
    region?: string
    estimated_audience?: string
    event_frequency?: string
    social_links?: Record<string, string>
    // NOTE: the backend (admin + owner create) does not permit owner_id —
    // ownership is derived from the auth token. Kept as optional so existing
    // callers still compile; it is ignored server-side.
    owner_id?: string
  }
}

interface UpdateOrgPayload {
  organization: {
    name?: string
    description?: string
  }
}

function formatOrgQueryParams(params?: ListOrgsParams | void) {
  if (!params) return undefined
  const queryParams: Record<string, string | number | boolean> = {}
  if (params.page !== undefined) queryParams.page = params.page
  if (params.per_page !== undefined) queryParams.per_page = params.per_page
  if (params.order_by !== undefined) queryParams.order_by = params.order_by
  if (params.order_direction !== undefined) queryParams.order_direction = params.order_direction
  if (params.search) {
    queryParams["q[name_cont]"] = params.search
  }
  if (params.q) {
    Object.entries(params.q).forEach(([k, v]) => {
      if (v !== undefined && v !== "") {
        queryParams[`q[${k}]`] = v
      }
    })
  }
  return Object.keys(queryParams).length > 0 ? queryParams : undefined
}

export const organizationsApi = createApi({
  reducerPath: "organizationsApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Organizations", "OwnerOrganizations"],
  endpoints: (builder) => ({
    // ─── Admin Endpoints (for admin app) ─────────────────────────────────────
    listOrganizations: builder.query<
      PaginatedResponse<Organization>,
      ListOrgsParams | void
    >({
      query: (params) => ({
        url: "/admin/organizations",
        params: formatOrgQueryParams(params),
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: "Organizations" as const,
                id,
              })),
              { type: "Organizations", id: "LIST" },
            ]
          : [{ type: "Organizations", id: "LIST" }],
    }),
    getOrganization: builder.query<SingleResponse<Organization>, string>({
      query: (id) => `/admin/organizations/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Organizations", id }],
    }),
    createOrganization: builder.mutation<
      SingleResponse<Organization>,
      CreateOrgPayload
    >({
      query: (body) => ({
        url: "/admin/organizations",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Organizations", id: "LIST" }],
    }),
    updateOrganization: builder.mutation<
      SingleResponse<Organization>,
      { id: string; body: UpdateOrgPayload }
    >({
      query: ({ id, body }) => ({
        url: `/admin/organizations/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Organizations", id },
      ],
    }),
    deleteOrganization: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/organizations/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Organizations", id: "LIST" }],
    }),
    transferOrganization: builder.mutation<
      void,
      { id: string; new_owner_id: string }
    >({
      query: ({ id, new_owner_id }) => ({
        url: `/admin/organizations/${id}/transfer_ownership`,
        method: "POST",
        body: { organization: { new_owner_id } },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Organizations", id },
      ],
    }),
    approveVerification: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/organizations/${id}/verification/approve`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [{ type: "Organizations", id }],
    }),
    rejectVerification: builder.mutation<void, { id: string; feedback: string }>({
      query: ({ id, feedback }) => ({
        url: `/admin/organizations/${id}/verification/reject`,
        method: "POST",
        body: { feedback: { message: feedback } },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Organizations", id }],
    }),
    requestVerificationModification: builder.mutation<void, { id: string; feedback: string }>({
      query: ({ id, feedback }) => ({
        url: `/admin/organizations/${id}/verification/request_modification`,
        method: "POST",
        body: { feedback: { message: feedback } },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Organizations", id }],
    }),

    // ─── Owner Endpoints (for organizer app) ─────────────────────────────────
    listOwnerOrganizations: builder.query<PaginatedResponse<Organization>, ListOrgsParams | void>({
      query: (params) => ({
        url: "/organizations/owner",
        params: formatOrgQueryParams(params),
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "OwnerOrganizations" as const, id })),
              { type: "OwnerOrganizations", id: "LIST" },
            ]
          : [{ type: "OwnerOrganizations", id: "LIST" }],
    }),
    getOwnerOrganization: builder.query<SingleResponse<Organization>, string>({
      query: (id) => `/organizations/owner/${id}`,
      providesTags: (_result, _error, id) => [{ type: "OwnerOrganizations", id }],
    }),
    createOwnerOrganization: builder.mutation<SingleResponse<Organization>, CreateOrgPayload>({
      query: (body) => ({
        url: "/organizations/owner",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "OwnerOrganizations", id: "LIST" }],
    }),
    updateOwnerOrganization: builder.mutation<SingleResponse<Organization>, { id: string; body: UpdateOrgPayload }>({
      query: ({ id, body }) => ({
        url: `/organizations/owner/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "OwnerOrganizations", id },
        { type: "OwnerOrganizations", id: "LIST" },
      ],
    }),
    deleteOwnerOrganization: builder.mutation<void, string>({
      query: (id) => ({
        url: `/organizations/owner/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "OwnerOrganizations", id: "LIST" }],
    }),
    // Owner document upload (multipart/form-data). Keys per contract:
    // profile, banner, business_license, tin_certificate. All four must be
    // attached before POST .../verification/submit accepts the organization.
    uploadOwnerOrganizationDocuments: builder.mutation<
      SingleResponse<Organization>,
      { id: string; formData: FormData }
    >({
      query: ({ id, formData }) => ({
        url: `/organizations/owner/${id}/documents`,
        method: "PATCH",
        body: formData,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "OwnerOrganizations", id },
        { type: "OwnerOrganizations", id: "LIST" },
      ],
    }),

    // Verification
    submitVerification: builder.mutation<SingleResponse<Organization>, string>({
      query: (organizationId) => ({
        url: `/organizations/owner/${organizationId}/verification/submit`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "OwnerOrganizations", id },
        { type: "OwnerOrganizations", id: "LIST" },
      ],
    }),
    resubmitVerification: builder.mutation<SingleResponse<Organization>, string>({
      query: (organizationId) => ({
        url: `/organizations/owner/${organizationId}/verification/resubmit`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "OwnerOrganizations", id },
        { type: "OwnerOrganizations", id: "LIST" },
      ],
    }),
  }),
})

export const {
  useListOrganizationsQuery,
  useGetOrganizationQuery,
  useCreateOrganizationMutation,
  useUpdateOrganizationMutation,
  useDeleteOrganizationMutation,
  useTransferOrganizationMutation,
  useApproveVerificationMutation,
  useRejectVerificationMutation,
  useRequestVerificationModificationMutation,
  useListOwnerOrganizationsQuery,
  useGetOwnerOrganizationQuery,
  useCreateOwnerOrganizationMutation,
  useUpdateOwnerOrganizationMutation,
  useDeleteOwnerOrganizationMutation,
  useUploadOwnerOrganizationDocumentsMutation,
  useSubmitVerificationMutation,
  useResubmitVerificationMutation,
} = organizationsApi

