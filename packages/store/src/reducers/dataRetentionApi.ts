import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQueryWithReauth } from "../api"

export interface DataRetentionPolicy {
  id: string
  category: string
  jurisdiction_code: string | null
  version: number
  retention_days: number | null
  action: "erase_payload" | "retain"
  status: "draft" | "active" | "retired"
  effective_at: string | null
  created_by_id: string
  created_at: string
  updated_at: string
}

export interface DataRetentionHold {
  id: string
  event_id: string | null
  registration_id: string | null
  user_id: string | null
  category: string | null
  reason_code: string
  placed_by_id: string
  starts_at: string
  expires_at: string | null
  released_by_id: string | null
  released_at: string | null
  created_at: string
  updated_at: string
}

interface ListParams {
  page?: number
  per_page?: number
  order_by?: string
  order_direction?: "asc" | "desc"
  q?: Record<string, string>
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

interface CreatePolicyPayload {
  data_retention_policy: {
    category: string
    version: number
    retention_days?: number
    action: "erase_payload" | "retain"
    status: "draft" | "active" | "retired"
    effective_at?: string
  }
}

interface UpdatePolicyPayload {
  data_retention_policy: {
    category?: string
    version?: number
    retention_days?: number
    action?: "erase_payload" | "retain"
    status?: "draft" | "active" | "retired"
    effective_at?: string
  }
}

interface CreateHoldPayload {
  data_retention_hold: {
    event_id?: string
    registration_id?: string
    user_id?: string
    category?: string
    reason_code: string
    starts_at: string
    expires_at?: string
  }
}

export const dataRetentionApi = createApi({
  reducerPath: "dataRetentionApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["RetentionPolicies", "RetentionHolds"],
  endpoints: (builder) => ({
    listRetentionPolicies: builder.query<PaginatedResponse<DataRetentionPolicy>, ListParams | void>({
      query: (params) => ({
        url: "/admin/data_retention_policies",
        params: params ?? undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "RetentionPolicies" as const, id })),
              { type: "RetentionPolicies", id: "LIST" },
            ]
          : [{ type: "RetentionPolicies", id: "LIST" }],
    }),
    getRetentionPolicy: builder.query<SingleResponse<DataRetentionPolicy>, string>({
      query: (id) => `/admin/data_retention_policies/${id}`,
      providesTags: (_result, _error, id) => [{ type: "RetentionPolicies", id }],
    }),
    createRetentionPolicy: builder.mutation<SingleResponse<DataRetentionPolicy>, CreatePolicyPayload>({
      query: (body) => ({
        url: "/admin/data_retention_policies",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "RetentionPolicies", id: "LIST" }],
    }),
    updateRetentionPolicy: builder.mutation<
      SingleResponse<DataRetentionPolicy>,
      { id: string; body: UpdatePolicyPayload }
    >({
      query: ({ id, body }) => ({
        url: `/admin/data_retention_policies/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "RetentionPolicies", id }],
    }),
    listRetentionHolds: builder.query<PaginatedResponse<DataRetentionHold>, ListParams | void>({
      query: (params) => ({
        url: "/admin/data_retention_holds",
        params: params ?? undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "RetentionHolds" as const, id })),
              { type: "RetentionHolds", id: "LIST" },
            ]
          : [{ type: "RetentionHolds", id: "LIST" }],
    }),
    getRetentionHold: builder.query<SingleResponse<DataRetentionHold>, string>({
      query: (id) => `/admin/data_retention_holds/${id}`,
      providesTags: (_result, _error, id) => [{ type: "RetentionHolds", id }],
    }),
    createRetentionHold: builder.mutation<SingleResponse<DataRetentionHold>, CreateHoldPayload>({
      query: (body) => ({
        url: "/admin/data_retention_holds",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "RetentionHolds", id: "LIST" }],
    }),
    releaseRetentionHold: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/data_retention_holds/${id}/release`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "RetentionHolds", id },
        { type: "RetentionHolds", id: "LIST" },
      ],
    }),
  }),
})

export const {
  useListRetentionPoliciesQuery,
  useGetRetentionPolicyQuery,
  useCreateRetentionPolicyMutation,
  useUpdateRetentionPolicyMutation,
  useListRetentionHoldsQuery,
  useGetRetentionHoldQuery,
  useCreateRetentionHoldMutation,
  useReleaseRetentionHoldMutation,
} = dataRetentionApi
