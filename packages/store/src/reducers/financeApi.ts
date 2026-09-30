import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQueryWithReauth } from "../api"

// ─────────────────────────────────────────────────────────────────────────────
// Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

export interface OrganizerBalance {
  currency: string
  ledger_total_minor: number
  reserved_minor: number
  available_minor: number
  pending_maturity_minor: number
  next_available_at?: string | null
}

export interface PayoutAccount {
  id: string
  type: "bank" | "mobile_money" | string
  provider: string
  bank_slug?: string | number | null
  account_number?: string | null
  account_name?: string | null
  account_label?: string | null
  status: "verified" | "pending" | "suspended" | "closed" | string
  is_default: boolean
  verified_at?: string | null
  created_at?: string | null
}

export interface Payout {
  id: string
  organization_id: string
  payout_account_id: string
  currency: string
  status: "pending" | "processing" | "paid" | "failed" | "cancelled" | string
  amount_minor: number
  period_start?: string | null
  period_end?: string | null
  requested_at: string
  paid_at?: string | null
  payout_account?: PayoutAccount | null
  status_reason_code?: string | null
}

export interface LedgerEntry {
  id: string
  organization_id: string
  event_id?: string | null
  order_id?: string | null
  refund_id?: string | null
  type: "sale" | "payout" | "refund" | "fee" | "adjustment" | string
  amount_minor: number
  currency: string
  available_at?: string | null
  description?: string | null
  event?: {
    id: string
    slug?: string
    title?: string
  } | null
  created_at: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    current_page: number
    per_page: number
    total_count: number
    total_pages: number
    links?: Record<string, string | null>
  }
}

export interface SingleResponse<T> {
  success: boolean
  data: T
}

export interface AddPayoutAccountPayload {
  organizationId: string
  idempotencyKey?: string
  payout_account: {
    type?: "bank" | "mobile_money" | string
    provider?: string
    bank_slug?: string
    account_number: string
    account_name: string
    account_label?: string
  }
}

export interface RequestPayoutPayload {
  organizationId: string
  idempotencyKey?: string
  payout: {
    currency: string
    amount_minor: number
  }
}

export interface ListParams {
  organizationId: string
  page?: number
  per_page?: number
  currency?: string
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

export const financeApi = createApi({
  reducerPath: "financeApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["FinanceBalance", "PayoutAccount", "Payout", "LedgerEntry"],
  endpoints: (builder) => ({
    // Balance
    getOrganizerBalance: builder.query<SingleResponse<OrganizerBalance[]> | { success: boolean; data: OrganizerBalance[] }, { organizationId: string; currency?: string }>({
      query: ({ organizationId, currency = "ETB" }) => ({
        url: `/finance/organizations/${organizationId}/balance?currency=${currency}`,
        method: "GET",
      }),
      providesTags: (_res, _err, { organizationId }) => [
        { type: "FinanceBalance", id: organizationId },
      ],
    }),

    // Payout Accounts
    listOrganizerPayoutAccounts: builder.query<SingleResponse<PayoutAccount[]> | { success: boolean; data: PayoutAccount[] }, string>({
      query: (organizationId) => ({
        url: `/finance/organizations/${organizationId}/payout_accounts`,
        method: "GET",
      }),
      providesTags: (res, _err, organizationId) => {
        const data = res?.data ?? []
        return [
          ...data.map((account) => ({ type: "PayoutAccount" as const, id: account.id })),
          { type: "PayoutAccount", id: `LIST_${organizationId}` },
        ]
      },
    }),

    addOrganizerPayoutAccount: builder.mutation<SingleResponse<PayoutAccount>, AddPayoutAccountPayload>({
      query: ({ organizationId, payout_account, idempotencyKey }) => ({
        url: `/finance/organizations/${organizationId}/payout_accounts`,
        method: "POST",
        headers: {
          "Idempotency-Key": resolveIdempotencyKey(idempotencyKey),
        },
        body: { payout_account },
      }),
      invalidatesTags: (_res, _err, { organizationId }) => [
        { type: "PayoutAccount", id: `LIST_${organizationId}` },
      ],
    }),

    setDefaultOrganizerPayoutAccount: builder.mutation<SingleResponse<PayoutAccount>, { organizationId: string; payoutAccountId: string; idempotencyKey?: string }>({
      query: ({ organizationId, payoutAccountId, idempotencyKey }) => ({
        url: `/finance/organizations/${organizationId}/payout_accounts/${payoutAccountId}/set_default`,
        method: "POST",
        headers: {
          "Idempotency-Key": resolveIdempotencyKey(idempotencyKey),
        },
      }),
      invalidatesTags: (_res, _err, { organizationId }) => [
        { type: "PayoutAccount", id: `LIST_${organizationId}` },
      ],
    }),

    suspendOrganizerPayoutAccount: builder.mutation<SingleResponse<PayoutAccount>, { organizationId: string; payoutAccountId: string; reason?: string; idempotencyKey?: string }>({
      query: ({ organizationId, payoutAccountId, reason, idempotencyKey }) => ({
        url: `/finance/organizations/${organizationId}/payout_accounts/${payoutAccountId}/suspend`,
        method: "POST",
        headers: {
          "Idempotency-Key": resolveIdempotencyKey(idempotencyKey),
        },
        body: reason ? { reason } : undefined,
      }),
      invalidatesTags: (_res, _err, { organizationId }) => [
        { type: "PayoutAccount", id: `LIST_${organizationId}` },
      ],
    }),

    closeOrganizerPayoutAccount: builder.mutation<SingleResponse<PayoutAccount>, { organizationId: string; payoutAccountId: string; reason?: string; idempotencyKey?: string }>({
      query: ({ organizationId, payoutAccountId, reason, idempotencyKey }) => ({
        url: `/finance/organizations/${organizationId}/payout_accounts/${payoutAccountId}/close`,
        method: "POST",
        headers: {
          "Idempotency-Key": resolveIdempotencyKey(idempotencyKey),
        },
        body: reason ? { reason } : undefined,
      }),
      invalidatesTags: (_res, _err, { organizationId }) => [
        { type: "PayoutAccount", id: `LIST_${organizationId}` },
      ],
    }),

    // Payouts
    listOrganizerPayouts: builder.query<PaginatedResponse<Payout>, ListParams>({
      query: ({ organizationId, page = 1, per_page = 25 }) => ({
        url: `/finance/organizations/${organizationId}/payouts?page=${page}&per_page=${per_page}`,
        method: "GET",
      }),
      providesTags: (res, _err, { organizationId }) => {
        const data = res?.data ?? []
        return [
          ...data.map((payout) => ({ type: "Payout" as const, id: payout.id })),
          { type: "Payout", id: `LIST_${organizationId}` },
        ]
      },
    }),

    requestOrganizerPayout: builder.mutation<SingleResponse<Payout>, RequestPayoutPayload>({
      query: ({ organizationId, payout, idempotencyKey }) => ({
        url: `/finance/organizations/${organizationId}/payouts`,
        method: "POST",
        headers: {
          "Idempotency-Key": resolveIdempotencyKey(idempotencyKey),
        },
        body: { payout },
      }),
      invalidatesTags: (_res, _err, { organizationId }) => [
        { type: "FinanceBalance", id: organizationId },
        { type: "Payout", id: `LIST_${organizationId}` },
        { type: "LedgerEntry", id: `LIST_${organizationId}` },
      ],
    }),

    // Get Single Payout (Receipt & Audit)
    getOrganizerPayout: builder.query<SingleResponse<Payout>, { organizationId: string; payoutId: string }>({
      query: ({ organizationId, payoutId }) => ({
        url: `/finance/organizations/${organizationId}/payouts/${payoutId}`,
        method: "GET",
      }),
      providesTags: (_res, _err, { payoutId }) => [{ type: "Payout", id: payoutId }],
    }),

    // Ledger Entries
    listOrganizerLedgerEntries: builder.query<PaginatedResponse<LedgerEntry>, ListParams>({
      query: ({ organizationId, currency = "ETB", page = 1, per_page = 25 }) => ({
        url: `/finance/organizations/${organizationId}/ledger_entries?currency=${currency}&page=${page}&per_page=${per_page}`,
        method: "GET",
      }),
      providesTags: (res, _err, { organizationId }) => {
        const data = res?.data ?? []
        return [
          ...data.map((entry) => ({ type: "LedgerEntry" as const, id: entry.id })),
          { type: "LedgerEntry", id: `LIST_${organizationId}` },
        ]
      },
    }),
  }),
})

export const {
  useGetOrganizerBalanceQuery,
  useListOrganizerPayoutAccountsQuery,
  useAddOrganizerPayoutAccountMutation,
  useSetDefaultOrganizerPayoutAccountMutation,
  useSuspendOrganizerPayoutAccountMutation,
  useCloseOrganizerPayoutAccountMutation,
  useListOrganizerPayoutsQuery,
  useGetOrganizerPayoutQuery,
  useRequestOrganizerPayoutMutation,
  useListOrganizerLedgerEntriesQuery,
} = financeApi
