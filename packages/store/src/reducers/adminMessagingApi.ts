import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQueryWithReauth } from "../api"

export interface CreditRate {
  id: string
  organization_id?: string | null
  channel: "sms" | "email" | "whatsapp"
  version?: number
  currency: string
  rate_per_unit_minor?: number
  unit_price_minor?: number
  provider_cost_minor?: number
  country_code?: string
  effective_from?: string
  effective_until?: string
  effective_at?: string
  retired_at?: string
  status: "active" | "retired" | "draft"
  created_at: string
  updated_at: string
}

export interface AdminCampaign {
  id: string
  organization_id: string
  name: string
  channel: "sms" | "email" | "whatsapp"
  status: "draft" | "scheduled" | "running" | "paused" | "completed" | "cancelled" | "aborted"
  recipient_count: number
  cost_estimate_credits?: number
  actual_credits_used?: number
  created_at: string
  updated_at: string
}

export interface AdminCampaignTemplate {
  id: string
  organization_id?: string | null
  name: string
  channel: "sms" | "email" | "whatsapp"
  status?: string
  content?: string
  subject?: string
  variables?: string[]
  metadata?: Record<string, unknown>
  active?: boolean
  created_at: string
  updated_at: string
}

export interface CampaignVolumePolicy {
  id: string
  channel: "sms" | "email" | "whatsapp"
  max_hourly_rate: number
  max_daily_rate: number
  quiet_hours_start?: string
  quiet_hours_end?: string
  active: boolean
  created_at: string
  updated_at: string
}

interface ListParams {
  page?: number
  per_page?: number
  order_by?: string
  order_direction?: "asc" | "desc"
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

export const adminMessagingApi = createApi({
  reducerPath: "adminMessagingApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "CreditRates",
    "AdminCampaigns",
    "AdminCampaignTemplates",
    "CampaignVolumePolicies",
  ],
  endpoints: (builder) => ({
    listCreditRates: builder.query<
      PaginatedResponse<CreditRate>,
      ListParams | void
    >({
      query: (params) => ({
        url: "/admin/messaging/credit_rates",
        params: params ?? undefined,
      }),
      transformResponse: (response: PaginatedResponse<CreditRate>) => ({
        ...response,
        data: (response.data || []).map((rate) => ({
          ...rate,
          unit_price_minor: rate.unit_price_minor ?? rate.rate_per_unit_minor ?? 0,
          rate_per_unit_minor: rate.rate_per_unit_minor ?? rate.unit_price_minor ?? 0,
        })),
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: "CreditRates" as const,
                id,
              })),
              { type: "CreditRates", id: "LIST" },
            ]
          : [{ type: "CreditRates", id: "LIST" }],
    }),
    getCreditRate: builder.query<SingleResponse<CreditRate>, string>({
      query: (id) => `/admin/messaging/credit_rates/${id}`,
      transformResponse: (response: SingleResponse<CreditRate>) => ({
        ...response,
        data: {
          ...response.data,
          unit_price_minor:
            response.data.unit_price_minor ?? response.data.rate_per_unit_minor ?? 0,
          rate_per_unit_minor:
            response.data.rate_per_unit_minor ?? response.data.unit_price_minor ?? 0,
        },
      }),
      providesTags: (_result, _error, id) => [{ type: "CreditRates", id }],
    }),
    createCreditRate: builder.mutation<
      SingleResponse<CreditRate>,
      | { credit_rate_version: Partial<CreditRate> }
      | { credit_rate: Partial<CreditRate> }
    >({
      query: (body) => {
        const payload =
          "credit_rate_version" in body
            ? body
            : {
                credit_rate_version: {
                  ...body.credit_rate,
                  unit_price_minor:
                    body.credit_rate.unit_price_minor ??
                    body.credit_rate.rate_per_unit_minor,
                },
              }
        return {
          url: "/admin/messaging/credit_rates",
          method: "POST",
          body: payload,
        }
      },
      invalidatesTags: [{ type: "CreditRates", id: "LIST" }],
    }),
    activateCreditRate: builder.mutation<SingleResponse<CreditRate>, string>({
      query: (id) => ({
        url: `/admin/messaging/credit_rates/${id}/activate`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "CreditRates", id },
        { type: "CreditRates", id: "LIST" },
      ],
    }),
    retireCreditRate: builder.mutation<SingleResponse<CreditRate>, string>({
      query: (id) => ({
        url: `/admin/messaging/credit_rates/${id}/retire`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "CreditRates", id },
        { type: "CreditRates", id: "LIST" },
      ],
    }),

    listAdminCampaigns: builder.query<
      PaginatedResponse<AdminCampaign>,
      ListParams | void
    >({
      query: (params) => ({
        url: "/admin/messaging/campaigns",
        params: params ?? undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: "AdminCampaigns" as const,
                id,
              })),
              { type: "AdminCampaigns", id: "LIST" },
            ]
          : [{ type: "AdminCampaigns", id: "LIST" }],
    }),
    getAdminCampaign: builder.query<SingleResponse<AdminCampaign>, string>({
      query: (id) => `/admin/messaging/campaigns/${id}`,
      providesTags: (_result, _error, id) => [{ type: "AdminCampaigns", id }],
    }),

    listAdminCampaignTemplates: builder.query<
      PaginatedResponse<AdminCampaignTemplate>,
      ListParams | void
    >({
      query: (params) => ({
        url: "/admin/messaging/campaign_templates",
        params: params ?? undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: "AdminCampaignTemplates" as const,
                id,
              })),
              { type: "AdminCampaignTemplates", id: "LIST" },
            ]
          : [{ type: "AdminCampaignTemplates", id: "LIST" }],
    }),
    getAdminCampaignTemplate: builder.query<
      SingleResponse<AdminCampaignTemplate>,
      string
    >({
      query: (id) => `/admin/messaging/campaign_templates/${id}`,
      providesTags: (_result, _error, id) => [
        { type: "AdminCampaignTemplates", id },
      ],
    }),
    createAdminCampaignTemplate: builder.mutation<
      SingleResponse<AdminCampaignTemplate>,
      { campaign_template: Partial<AdminCampaignTemplate> }
    >({
      query: (body) => ({
        url: "/admin/messaging/campaign_templates",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "AdminCampaignTemplates", id: "LIST" }],
    }),
    updateAdminCampaignTemplate: builder.mutation<
      SingleResponse<AdminCampaignTemplate>,
      { id: string; campaign_template: Partial<AdminCampaignTemplate> }
    >({
      query: ({ id, campaign_template }) => ({
        url: `/admin/messaging/campaign_templates/${id}`,
        method: "PATCH",
        body: { campaign_template },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "AdminCampaignTemplates", id },
        { type: "AdminCampaignTemplates", id: "LIST" },
      ],
    }),

    listCampaignVolumePolicies: builder.query<
      PaginatedResponse<CampaignVolumePolicy>,
      ListParams | void
    >({
      query: (params) => ({
        url: "/admin/messaging/campaign_volume_policies",
        params: params ?? undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: "CampaignVolumePolicies" as const,
                id,
              })),
              { type: "CampaignVolumePolicies", id: "LIST" },
            ]
          : [{ type: "CampaignVolumePolicies", id: "LIST" }],
    }),
    getCampaignVolumePolicy: builder.query<
      SingleResponse<CampaignVolumePolicy>,
      string
    >({
      query: (id) => `/admin/messaging/campaign_volume_policies/${id}`,
      providesTags: (_result, _error, id) => [
        { type: "CampaignVolumePolicies", id },
      ],
    }),
    updateCampaignVolumePolicy: builder.mutation<
      SingleResponse<CampaignVolumePolicy>,
      { id: string; campaign_volume_policy: Partial<CampaignVolumePolicy> }
    >({
      query: ({ id, campaign_volume_policy }) => ({
        url: `/admin/messaging/campaign_volume_policies/${id}`,
        method: "PATCH",
        body: { campaign_volume_policy },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "CampaignVolumePolicies", id },
        { type: "CampaignVolumePolicies", id: "LIST" },
      ],
    }),

    createCreditAdjustment: builder.mutation<
      SingleResponse<unknown>,
      {
        organizationId: string
        credit_adjustment: {
          amount: number
          reason: string
          notes?: string
        }
      }
    >({
      query: ({ organizationId, credit_adjustment }) => ({
        url: `/admin/organizations/${organizationId}/messaging/credit_adjustments`,
        method: "POST",
        body: { credit_adjustment },
      }),
    }),
  }),
})

export const {
  useListCreditRatesQuery,
  useGetCreditRateQuery,
  useCreateCreditRateMutation,
  useActivateCreditRateMutation,
  useRetireCreditRateMutation,
  useListAdminCampaignsQuery,
  useGetAdminCampaignQuery,
  useListAdminCampaignTemplatesQuery,
  useGetAdminCampaignTemplateQuery,
  useCreateAdminCampaignTemplateMutation,
  useUpdateAdminCampaignTemplateMutation,
  useListCampaignVolumePoliciesQuery,
  useGetCampaignVolumePolicyQuery,
  useUpdateCampaignVolumePolicyMutation,
  useCreateCreditAdjustmentMutation,
} = adminMessagingApi
