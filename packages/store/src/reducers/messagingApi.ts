import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQueryWithReauth } from "../api"

// ─────────────────────────────────────────────────────────────────────────────
// Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

export interface CreditAccount {
  channel: "sms" | "email"
  available: number
  reserved: number
  consumed: number
  released: number
  refunded: number
}

export interface CreditRateVersion {
  id: string
  channel: "sms" | "email"
  version: number
  currency: string
  unit_price_minor: number
  country_code?: string | null
  status: "draft" | "active" | "retired"
  effective_from: string
  effective_until?: string | null
}

export interface CreditTopUp {
  id: string
  channel: "sms" | "email"
  quantity: number
  currency: string
  amount_minor: number
  status: "pending_payment" | "completed" | "failed" | "canceled"
}

export interface CreditTopUpResponse {
  top_up: CreditTopUp
  payment?: {
    id: string
    status: string
    checkout_url?: string
  }
}

export interface Campaign {
  id: string
  organization_id: string
  created_by_id?: string | null
  event_id?: string | null
  name: string
  channel: "sms" | "email"
  status: "draft" | "scheduled" | "sending" | "completed" | "paused" | "canceled" | "failed"
  timezone: string
  launch_version: number
  send_at?: string | null
  launched_at?: string | null
  completed_at?: string | null
  canceled_at?: string | null
  variables?: Record<string, any>
  quoted_quantity?: number | null
  quoted_unit_price_minor?: number | null
  quoted_rate_version_id?: string | null
  quoted_at?: string | null
  quote_expires_at?: string | null
  message_subject?: string | null
  message_body?: string | null
  metadata?: Record<string, any>
}

export interface CampaignEstimate {
  status: "ready" | "preparing"
  quantity: number
  rate_version?: any
  unit_price_minor: number
  quote_digest: string
  quoted_at: string
  quote_expires_at: string
}

export interface CampaignAttestation {
  id: string
  campaign_id: string
  audience_snapshot_id: string
  channel: "sms" | "email"
  historical_basis?: string
  statement_version: string
  attested_at: string
}

export interface CampaignAnalytics {
  campaign_id: string
  channel: "sms" | "email"
  total_recipients: number
  sent_count: number
  delivered_count: number
  failed_count: number
  unsubscribed_count: number
  link_clicks_count?: number
  delivery_rate_percentage: number
  bounce_rate_percentage: number
  click_through_rate_percentage?: number
}

export interface CampaignContactList {
  id: string
  organization_id: string
  name: string
  status: "active" | "archived"
  entries_count?: number
  created_at: string
  updated_at: string
}

export interface CampaignContactListImportReport {
  id: string
  status: "pending" | "processing" | "completed" | "failed"
  total_rows?: number
  valid_count?: number
  duplicate_count?: number
  invalid_count?: number
  error_sample?: string[]
}

export interface CampaignTemplate {
  id: string
  organization_id?: string | null
  name: string
  channel: "sms" | "email"
  status: "draft" | "active" | "archived"
  metadata?: Record<string, any>
  created_at: string
}

interface PaginatedResponse<T> {
  success: boolean
  message?: string
  data: T[]
  pagination?: {
    current_page: number
    per_page: number
    total_pages: number
    total_count: number
  }
}

interface SingleResponse<T> {
  success: boolean
  message?: string
  data: T
}

function resolveIdempotencyKey(key?: string): string {
  if (key) return key
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// API Slice Definition
// ─────────────────────────────────────────────────────────────────────────────

export const messagingApi = createApi({
  reducerPath: "messagingApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Credits", "CreditRates", "Campaign", "ContactList", "CampaignTemplate"],
  endpoints: (builder) => ({
    // ─── Credits ───────────────────────────────────────────────────────────────
    listCredits: builder.query<{ success: boolean; data: CreditAccount[] }, string>({
      query: (organizationId) => ({
        url: `/organizations/${organizationId}/messaging/credits`,
        method: "GET",
      }),
      providesTags: (_res, _err, organizationId) => [
        { type: "Credits", id: organizationId },
      ],
    }),

    listCreditRates: builder.query<PaginatedResponse<CreditRateVersion>, string>({
      query: (organizationId) => ({
        url: `/organizations/${organizationId}/messaging/credit_rates`,
        method: "GET",
      }),
      providesTags: ["CreditRates"],
    }),

    estimateCreditTopUp: builder.mutation<
      SingleResponse<any>,
      { organizationId: string; channel: string; quantity: number; currency?: string; countryCode?: string }
    >({
      query: ({ organizationId, channel, quantity, currency = "ETB", countryCode = "ET" }) => ({
        url: `/organizations/${organizationId}/messaging/credit_estimates`,
        method: "POST",
        body: {
          credit_estimate: {
            channel,
            quantity,
            currency,
            country_code: countryCode,
          },
        },
      }),
    }),

    createCreditTopUp: builder.mutation<
      SingleResponse<CreditTopUpResponse>,
      {
        organizationId: string
        top_up: {
          channel: "sms" | "email"
          quantity: number
          currency?: string
          provider?: string
          payment_method?: string
        }
        idempotencyKey?: string
      }
    >({
      query: ({ organizationId, top_up, idempotencyKey }) => ({
        url: `/organizations/${organizationId}/messaging/credit_top_ups`,
        method: "POST",
        headers: {
          "Idempotency-Key": resolveIdempotencyKey(idempotencyKey),
        },
        body: {
          credit_top_up: {
            channel: top_up.channel,
            quantity: top_up.quantity,
            currency: top_up.currency || "ETB",
            provider: top_up.provider || "chapa",
            payment_method: top_up.payment_method || "telebirr",
          },
        },
      }),
      invalidatesTags: (_res, _err, { organizationId }) => [
        { type: "Credits", id: organizationId },
      ],
    }),

    // ─── Campaigns ─────────────────────────────────────────────────────────────
    listCampaigns: builder.query<
      PaginatedResponse<Campaign>,
      {
        organizationId: string
        page?: number
        per_page?: number
        order_by?: string
        order_direction?: "asc" | "desc"
        q?: Record<string, string>
      }
    >({
      query: ({ organizationId, page = 1, per_page = 25, order_by = "created_at", order_direction = "desc", q }) => {
        const params = new URLSearchParams()
        params.set("page", String(page))
        params.set("per_page", String(per_page))
        params.set("order_by", order_by)
        params.set("order_direction", order_direction)
        if (q) {
          Object.entries(q).forEach(([k, v]) => {
            if (v !== undefined && v !== "") {
              params.set(`q[${k}]`, v)
            }
          })
        }
        return {
          url: `/organizations/${organizationId}/campaigns?${params.toString()}`,
          method: "GET",
        }
      },
      providesTags: (res, _err, { organizationId }) => {
        const data = res?.data ?? []
        return [
          ...data.map((c) => ({ type: "Campaign" as const, id: c.id })),
          { type: "Campaign", id: `LIST_${organizationId}` },
        ]
      },
    }),

    getCampaign: builder.query<SingleResponse<Campaign>, { organizationId: string; campaignId: string }>({
      query: ({ organizationId, campaignId }) => ({
        url: `/organizations/${organizationId}/campaigns/${campaignId}`,
        method: "GET",
      }),
      providesTags: (_res, _err, { campaignId }) => [{ type: "Campaign", id: campaignId }],
    }),

    createCampaign: builder.mutation<
      SingleResponse<Campaign>,
      {
        organizationId: string
        campaign: {
          name: string
          channel: "sms" | "email"
          timezone?: string
          event_id?: string | null
          message_subject?: string | null
          message_body?: string | null
          variables?: Record<string, any>
          metadata?: Record<string, any>
        }
        idempotencyKey?: string
      }
    >({
      query: ({ organizationId, campaign, idempotencyKey }) => ({
        url: `/organizations/${organizationId}/campaigns`,
        method: "POST",
        headers: {
          "Idempotency-Key": resolveIdempotencyKey(idempotencyKey),
        },
        body: {
          campaign: {
            name: campaign.name,
            channel: campaign.channel,
            timezone: campaign.timezone || "Africa/Addis_Ababa",
            event_id: campaign.event_id || undefined,
            message_subject: campaign.message_subject || undefined,
            message_body: campaign.message_body || undefined,
            variables: campaign.variables || {},
            metadata: campaign.metadata || {},
          },
        },
      }),
      invalidatesTags: (_res, _err, { organizationId }) => [
        { type: "Campaign", id: `LIST_${organizationId}` },
      ],
    }),

    updateCampaign: builder.mutation<
      SingleResponse<Campaign>,
      {
        organizationId: string
        campaignId: string
        campaign: Partial<Campaign>
        idempotencyKey?: string
      }
    >({
      query: ({ organizationId, campaignId, campaign, idempotencyKey }) => ({
        url: `/organizations/${organizationId}/campaigns/${campaignId}`,
        method: "PATCH",
        headers: {
          "Idempotency-Key": resolveIdempotencyKey(idempotencyKey),
        },
        body: { campaign },
      }),
      invalidatesTags: (_res, _err, { organizationId, campaignId }) => [
        { type: "Campaign", id: campaignId },
        { type: "Campaign", id: `LIST_${organizationId}` },
      ],
    }),

    estimateCampaign: builder.mutation<
      SingleResponse<CampaignEstimate>,
      { organizationId: string; campaignId: string; idempotencyKey?: string }
    >({
      query: ({ organizationId, campaignId, idempotencyKey }) => ({
        url: `/organizations/${organizationId}/campaigns/${campaignId}/estimate`,
        method: "POST",
        headers: {
          "Idempotency-Key": resolveIdempotencyKey(idempotencyKey),
        },
      }),
    }),

    attestCampaign: builder.mutation<
      SingleResponse<CampaignAttestation>,
      {
        organizationId: string
        campaignId: string
        confirmation: boolean
        historical_basis?: string
        idempotencyKey?: string
      }
    >({
      query: ({ organizationId, campaignId, confirmation, historical_basis = "attendee_optin", idempotencyKey }) => ({
        url: `/organizations/${organizationId}/campaigns/${campaignId}/attest`,
        method: "POST",
        headers: {
          "Idempotency-Key": resolveIdempotencyKey(idempotencyKey),
        },
        body: {
          confirmation,
          historical_basis,
        },
      }),
      invalidatesTags: (_res, _err, { campaignId }) => [{ type: "Campaign", id: campaignId }],
    }),

    launchCampaign: builder.mutation<
      SingleResponse<Campaign>,
      {
        organizationId: string
        campaignId: string
        quote_digest?: string
        quoted_rate_version_id?: string
        quoted_quantity?: number
        idempotencyKey?: string
      }
    >({
      query: ({ organizationId, campaignId, quote_digest, quoted_rate_version_id, quoted_quantity, idempotencyKey }) => ({
        url: `/organizations/${organizationId}/campaigns/${campaignId}/launch`,
        method: "POST",
        headers: {
          "Idempotency-Key": resolveIdempotencyKey(idempotencyKey),
        },
        body: {
          quote_digest,
          quoted_rate_version_id,
          quoted_quantity,
        },
      }),
      invalidatesTags: (_res, _err, { organizationId, campaignId }) => [
        { type: "Campaign", id: campaignId },
        { type: "Campaign", id: `LIST_${organizationId}` },
        { type: "Credits", id: organizationId },
      ],
    }),

    pauseCampaign: builder.mutation<
      SingleResponse<Campaign>,
      { organizationId: string; campaignId: string; idempotencyKey?: string }
    >({
      query: ({ organizationId, campaignId, idempotencyKey }) => ({
        url: `/organizations/${organizationId}/campaigns/${campaignId}/pause`,
        method: "POST",
        headers: {
          "Idempotency-Key": resolveIdempotencyKey(idempotencyKey),
        },
      }),
      invalidatesTags: (_res, _err, { organizationId, campaignId }) => [
        { type: "Campaign", id: campaignId },
        { type: "Campaign", id: `LIST_${organizationId}` },
      ],
    }),

    resumeCampaign: builder.mutation<
      SingleResponse<Campaign>,
      { organizationId: string; campaignId: string; idempotencyKey?: string }
    >({
      query: ({ organizationId, campaignId, idempotencyKey }) => ({
        url: `/organizations/${organizationId}/campaigns/${campaignId}/resume`,
        method: "POST",
        headers: {
          "Idempotency-Key": resolveIdempotencyKey(idempotencyKey),
        },
      }),
      invalidatesTags: (_res, _err, { organizationId, campaignId }) => [
        { type: "Campaign", id: campaignId },
        { type: "Campaign", id: `LIST_${organizationId}` },
      ],
    }),

    cancelCampaign: builder.mutation<
      SingleResponse<Campaign>,
      { organizationId: string; campaignId: string; reason?: string; idempotencyKey?: string }
    >({
      query: ({ organizationId, campaignId, reason, idempotencyKey }) => ({
        url: `/organizations/${organizationId}/campaigns/${campaignId}/cancel`,
        method: "POST",
        headers: {
          "Idempotency-Key": resolveIdempotencyKey(idempotencyKey),
        },
        body: reason ? { reason } : undefined,
      }),
      invalidatesTags: (_res, _err, { organizationId, campaignId }) => [
        { type: "Campaign", id: campaignId },
        { type: "Campaign", id: `LIST_${organizationId}` },
        { type: "Credits", id: organizationId },
      ],
    }),

    abortCampaign: builder.mutation<
      SingleResponse<Campaign>,
      { organizationId: string; campaignId: string; reason?: string; idempotencyKey?: string }
    >({
      query: ({ organizationId, campaignId, reason, idempotencyKey }) => ({
        url: `/organizations/${organizationId}/campaigns/${campaignId}/abort`,
        method: "POST",
        headers: {
          "Idempotency-Key": resolveIdempotencyKey(idempotencyKey),
        },
        body: reason ? { reason } : undefined,
      }),
      invalidatesTags: (_res, _err, { organizationId, campaignId }) => [
        { type: "Campaign", id: campaignId },
        { type: "Campaign", id: `LIST_${organizationId}` },
        { type: "Credits", id: organizationId },
      ],
    }),

    getCampaignAnalytics: builder.query<
      SingleResponse<CampaignAnalytics>,
      { organizationId: string; campaignId: string }
    >({
      query: ({ organizationId, campaignId }) => ({
        url: `/organizations/${organizationId}/campaigns/${campaignId}/analytics`,
        method: "GET",
      }),
    }),

    // ─── Contact Lists ─────────────────────────────────────────────────────────
    listContactLists: builder.query<
      PaginatedResponse<CampaignContactList>,
      { organizationId: string; page?: number; per_page?: number }
    >({
      query: ({ organizationId, page = 1, per_page = 25 }) => ({
        url: `/organizations/${organizationId}/campaign_contact_lists?page=${page}&per_page=${per_page}`,
        method: "GET",
      }),
      providesTags: (res, _err, { organizationId }) => {
        const data = res?.data ?? []
        return [
          ...data.map((l) => ({ type: "ContactList" as const, id: l.id })),
          { type: "ContactList", id: `LIST_${organizationId}` },
        ]
      },
    }),

    createContactList: builder.mutation<
      SingleResponse<CampaignContactList>,
      { organizationId: string; name: string; idempotencyKey?: string }
    >({
      query: ({ organizationId, name, idempotencyKey }) => ({
        url: `/organizations/${organizationId}/campaign_contact_lists`,
        method: "POST",
        headers: {
          "Idempotency-Key": resolveIdempotencyKey(idempotencyKey),
        },
        body: {
          campaign_contact_list: { name },
        },
      }),
      invalidatesTags: (_res, _err, { organizationId }) => [
        { type: "ContactList", id: `LIST_${organizationId}` },
      ],
    }),

    importContactListCsv: builder.mutation<
      SingleResponse<{ import_id: string }>,
      { organizationId: string; contactListId: string; file: File; idempotencyKey?: string }
    >({
      query: ({ organizationId, contactListId, file, idempotencyKey }) => {
        const formData = new FormData()
        formData.append("file", file)
        return {
          url: `/organizations/${organizationId}/campaign_contact_lists/${contactListId}/import`,
          method: "POST",
          headers: {
            "Idempotency-Key": resolveIdempotencyKey(idempotencyKey),
          },
          body: formData,
        }
      },
      invalidatesTags: (_res, _err, { organizationId, contactListId }) => [
        { type: "ContactList", id: contactListId },
        { type: "ContactList", id: `LIST_${organizationId}` },
      ],
    }),

    getContactListImportReport: builder.query<
      SingleResponse<CampaignContactListImportReport>,
      { organizationId: string; contactListId: string; importId: string }
    >({
      query: ({ organizationId, contactListId, importId }) => ({
        url: `/organizations/${organizationId}/campaign_contact_lists/${contactListId}/imports/${importId}/report`,
        method: "GET",
      }),
    }),

    // ─── Templates ─────────────────────────────────────────────────────────────
    listCampaignTemplates: builder.query<
      PaginatedResponse<CampaignTemplate>,
      { organizationId: string }
    >({
      query: ({ organizationId }) => ({
        url: `/organizations/${organizationId}/campaign_templates`,
        method: "GET",
      }),
      providesTags: ["CampaignTemplate"],
    }),
  }),
})

export const {
  useListCreditsQuery,
  useListCreditRatesQuery,
  useEstimateCreditTopUpMutation,
  useCreateCreditTopUpMutation,
  useListCampaignsQuery,
  useGetCampaignQuery,
  useCreateCampaignMutation,
  useUpdateCampaignMutation,
  useEstimateCampaignMutation,
  useAttestCampaignMutation,
  useLaunchCampaignMutation,
  usePauseCampaignMutation,
  useResumeCampaignMutation,
  useCancelCampaignMutation,
  useAbortCampaignMutation,
  useGetCampaignAnalyticsQuery,
  useListContactListsQuery,
  useCreateContactListMutation,
  useImportContactListCsvMutation,
  useGetContactListImportReportQuery,
  useListCampaignTemplatesQuery,
} = messagingApi
