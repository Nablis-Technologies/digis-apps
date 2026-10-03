import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQueryWithReauth, generateIdempotencyKey } from "../api"

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

export interface BalanceReport {
  currency?: string
  available_minor?: number
  pending_minor?: number
  reserved_minor?: number
  total_minor?: number
}

export interface PayoutAccount {
  id: string
  organization_id?: string
  type: "bank" | "mobile_money" | string
  provider: string
  bank_slug?: string | number | null
  bank_code?: string | null
  account_number?: string | null
  account_name?: string | null
  account_label?: string | null
  status: "verified" | "pending" | "suspended" | "closed" | string
  is_default?: boolean
  verified_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface Payout {
  id: string
  organization_id: string
  payout_account_id?: string
  currency: string
  amount_minor: number
  status: "pending" | "processing" | "paid" | "failed" | "cancelled" | string
  provider?: string | null
  period_start?: string | null
  period_end?: string | null
  requested_at: string
  paid_at?: string | null
  payout_account?: PayoutAccount | null
  status_reason_code?: string | null
  created_at?: string
  updated_at?: string
}

export interface LedgerEntry {
  id: string
  organization_id: string
  currency: string
  amount_minor: number
  entry_type?: string
  type: "sale" | "payout" | "refund" | "fee" | "adjustment" | string
  event_id?: string | null
  order_id?: string | null
  refund_id?: string | null
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
  pagination?: {
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
  message?: string
}

export interface AddPayoutAccountPayload {
  organizationId: string
  idempotencyKey?: string
  payout_account: {
    type?: "bank" | "mobile_money" | string
    provider?: string
    bank_slug?: string
    bank_code?: string
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
  organizationId?: string
  page?: number
  per_page?: number
  currency?: string
  order_by?: string
  order_direction?: "asc" | "desc"
}

// ─────────────────────────────────────────────────────────────────────────────
// API Slice Definition
// ─────────────────────────────────────────────────────────────────────────────

export const financeApi = createApi({
  reducerPath: "financeApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "FinanceBalance",
    "PayoutAccount",
    "Payout",
    "LedgerEntry",
    "Payouts",
    "PayoutAccounts",
    "LedgerEntries",
    "Balance",
  ],
  endpoints: (builder) => ({
    // ── Organizer Endpoints ───────────────────────────────────────────────
    getOrganizerBalance: builder.query<
      SingleResponse<OrganizerBalance[]> | { success: boolean; data: OrganizerBalance[] },
      { organizationId: string; currency?: string }
    >({
      query: ({ organizationId, currency = "ETB" }) => ({
        url: `/finance/organizations/${organizationId}/balance?currency=${currency}`,
        method: "GET",
      }),
      providesTags: (_res, _err, { organizationId }) => [
        { type: "FinanceBalance", id: organizationId },
        { type: "Balance", id: organizationId },
      ],
    }),

    listOrganizerPayoutAccounts: builder.query<
      SingleResponse<PayoutAccount[]> | { success: boolean; data: PayoutAccount[] },
      string
    >({
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
          "Idempotency-Key": idempotencyKey || generateIdempotencyKey(),
        },
        body: { payout_account },
      }),
      invalidatesTags: (_res, _err, { organizationId }) => [
        { type: "PayoutAccount", id: `LIST_${organizationId}` },
        { type: "PayoutAccounts", id: "LIST" },
      ],
    }),

    setDefaultOrganizerPayoutAccount: builder.mutation<
      SingleResponse<PayoutAccount>,
      { organizationId: string; payoutAccountId: string; idempotencyKey?: string }
    >({
      query: ({ organizationId, payoutAccountId, idempotencyKey }) => ({
        url: `/finance/organizations/${organizationId}/payout_accounts/${payoutAccountId}/set_default`,
        method: "POST",
        headers: {
          "Idempotency-Key": idempotencyKey || generateIdempotencyKey(),
        },
      }),
      invalidatesTags: (_res, _err, { organizationId }) => [
        { type: "PayoutAccount", id: `LIST_${organizationId}` },
        { type: "PayoutAccounts", id: "LIST" },
      ],
    }),

    suspendOrganizerPayoutAccount: builder.mutation<
      SingleResponse<PayoutAccount>,
      { organizationId: string; payoutAccountId: string; reason?: string; idempotencyKey?: string }
    >({
      query: ({ organizationId, payoutAccountId, reason, idempotencyKey }) => ({
        url: `/finance/organizations/${organizationId}/payout_accounts/${payoutAccountId}/suspend`,
        method: "POST",
        headers: {
          "Idempotency-Key": idempotencyKey || generateIdempotencyKey(),
        },
        body: reason ? { reason } : undefined,
      }),
      invalidatesTags: (_res, _err, { organizationId }) => [
        { type: "PayoutAccount", id: `LIST_${organizationId}` },
        { type: "PayoutAccounts", id: "LIST" },
      ],
    }),

    closeOrganizerPayoutAccount: builder.mutation<
      SingleResponse<PayoutAccount>,
      { organizationId: string; payoutAccountId: string; reason?: string; idempotencyKey?: string }
    >({
      query: ({ organizationId, payoutAccountId, reason, idempotencyKey }) => ({
        url: `/finance/organizations/${organizationId}/payout_accounts/${payoutAccountId}/close`,
        method: "POST",
        headers: {
          "Idempotency-Key": idempotencyKey || generateIdempotencyKey(),
        },
        body: reason ? { reason } : undefined,
      }),
      invalidatesTags: (_res, _err, { organizationId }) => [
        { type: "PayoutAccount", id: `LIST_${organizationId}` },
        { type: "PayoutAccounts", id: "LIST" },
      ],
    }),

    listOrganizerPayouts: builder.query<PaginatedResponse<Payout>, ListParams & { organizationId: string }>({
      query: ({ organizationId, page = 1, per_page = 25 }) => ({
        url: `/finance/organizations/${organizationId}/payouts?page=${page}&per_page=${per_page}`,
        method: "GET",
      }),
      providesTags: (res, _err, { organizationId }) => {
        const data = res?.data ?? []
        return [
          ...data.map((payout) => ({ type: "Payout" as const, id: payout.id })),
          { type: "Payout", id: `LIST_${organizationId}` },
          { type: "Payouts", id: "LIST" },
        ]
      },
    }),

    requestOrganizerPayout: builder.mutation<SingleResponse<Payout>, RequestPayoutPayload>({
      query: ({ organizationId, payout, idempotencyKey }) => ({
        url: `/finance/organizations/${organizationId}/payouts`,
        method: "POST",
        headers: {
          "Idempotency-Key": idempotencyKey || generateIdempotencyKey(),
        },
        body: { payout },
      }),
      invalidatesTags: (_res, _err, { organizationId }) => [
        { type: "FinanceBalance", id: organizationId },
        { type: "Balance", id: organizationId },
        { type: "Payout", id: `LIST_${organizationId}` },
        { type: "Payouts", id: "LIST" },
        { type: "LedgerEntry", id: `LIST_${organizationId}` },
        { type: "LedgerEntries", id: "LIST" },
      ],
    }),

    getOrganizerPayout: builder.query<SingleResponse<Payout>, { organizationId: string; payoutId: string }>({
      query: ({ organizationId, payoutId }) => ({
        url: `/finance/organizations/${organizationId}/payouts/${payoutId}`,
        method: "GET",
      }),
      providesTags: (_res, _err, { payoutId }) => [
        { type: "Payout", id: payoutId },
        { type: "Payouts", id: payoutId },
      ],
    }),

    listOrganizerLedgerEntries: builder.query<PaginatedResponse<LedgerEntry>, ListParams & { organizationId: string }>({
      query: ({ organizationId, currency = "ETB", page = 1, per_page = 25 }) => ({
        url: `/finance/organizations/${organizationId}/ledger_entries?currency=${currency}&page=${page}&per_page=${per_page}`,
        method: "GET",
      }),
      providesTags: (res, _err, { organizationId }) => {
        const data = res?.data ?? []
        return [
          ...data.map((entry) => ({ type: "LedgerEntry" as const, id: entry.id })),
          { type: "LedgerEntry", id: `LIST_${organizationId}` },
          { type: "LedgerEntries", id: "LIST" },
        ]
      },
    }),

    // ── Admin Endpoints ───────────────────────────────────────────────────
    listPayouts: builder.query<PaginatedResponse<Payout>, { organizationId: string; params?: ListParams }>({
      query: ({ organizationId, params }) => ({
        url: `/finance/organizations/${organizationId}/payouts`,
        params: params ?? undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "Payouts" as const, id })),
              { type: "Payouts", id: "LIST" },
            ]
          : [{ type: "Payouts", id: "LIST" }],
    }),
    getPayout: builder.query<SingleResponse<Payout>, { organizationId: string; id: string }>({
      query: ({ organizationId, id }) => `/finance/organizations/${organizationId}/payouts/${id}`,
      providesTags: (_result, _error, { id }) => [{ type: "Payouts", id }],
    }),
    createPayout: builder.mutation<
      SingleResponse<Payout>,
      { organizationId: string; body: { payout: { currency: string; amount_minor?: number } }; idempotencyKey?: string }
    >({
      query: ({ organizationId, body, idempotencyKey }) => ({
        url: `/finance/organizations/${organizationId}/payouts`,
        method: "POST",
        body,
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      }),
      invalidatesTags: [{ type: "Payouts", id: "LIST" }],
    }),
    dispatchPayout: builder.mutation<
      SingleResponse<Payout>,
      { organizationId: string; id: string; provider?: string; treasuryApprovalId?: string; idempotencyKey?: string }
    >({
      query: ({ organizationId, id, provider, treasuryApprovalId, idempotencyKey }) => ({
        url: `/finance/organizations/${organizationId}/payouts/${id}/dispatch`,
        method: "POST",
        params: {
          provider: provider ?? undefined,
          treasury_approval_id: treasuryApprovalId ?? undefined,
        },
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Payouts", id }],
    }),
    reconcilePayout: builder.mutation<
      SingleResponse<Payout>,
      { organizationId: string; id: string; provider?: string; idempotencyKey?: string }
    >({
      query: ({ organizationId, id, provider, idempotencyKey }) => ({
        url: `/finance/organizations/${organizationId}/payouts/${id}/reconcile`,
        method: "POST",
        params: { provider: provider ?? undefined },
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Payouts", id }],
    }),
    listPayoutAccounts: builder.query<PaginatedResponse<PayoutAccount>, { organizationId: string; params?: ListParams }>({
      query: ({ organizationId, params }) => ({
        url: `/finance/organizations/${organizationId}/payout_accounts`,
        params: params ?? undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "PayoutAccounts" as const, id })),
              { type: "PayoutAccounts", id: "LIST" },
            ]
          : [{ type: "PayoutAccounts", id: "LIST" }],
    }),
    createPayoutAccount: builder.mutation<
      SingleResponse<PayoutAccount>,
      {
        organizationId: string;
        body: {
          payout_account: {
            type: string
            provider: string
            bank_code: string
            account_number: string
            account_name?: string
            account_label?: string
          }
        }
        idempotencyKey?: string
      }
    >({
      query: ({ organizationId, body, idempotencyKey }) => ({
        url: `/finance/organizations/${organizationId}/payout_accounts`,
        method: "POST",
        body,
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      }),
      invalidatesTags: [{ type: "PayoutAccounts", id: "LIST" }],
    }),
    verifyPayoutAccount: builder.mutation<
      SingleResponse<PayoutAccount>,
      { organizationId: string; id: string; body: { reason: string; evidence_reference: string }; idempotencyKey?: string }
    >({
      query: ({ organizationId, id, body, idempotencyKey }) => ({
        url: `/finance/organizations/${organizationId}/payout_accounts/${id}/verify`,
        method: "POST",
        body,
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "PayoutAccounts", id }],
    }),
    setDefaultPayoutAccount: builder.mutation<
      SingleResponse<PayoutAccount>,
      { organizationId: string; id: string; idempotencyKey?: string }
    >({
      query: ({ organizationId, id, idempotencyKey }) => ({
        url: `/finance/organizations/${organizationId}/payout_accounts/${id}/set_default`,
        method: "POST",
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "PayoutAccounts", id }],
    }),
    suspendPayoutAccount: builder.mutation<
      SingleResponse<PayoutAccount>,
      { organizationId: string; id: string; body: { reason: string }; idempotencyKey?: string }
    >({
      query: ({ organizationId, id, body, idempotencyKey }) => ({
        url: `/finance/organizations/${organizationId}/payout_accounts/${id}/suspend`,
        method: "POST",
        body,
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "PayoutAccounts", id }],
    }),
    closePayoutAccount: builder.mutation<
      SingleResponse<PayoutAccount>,
      { organizationId: string; id: string; body: { reason: string }; idempotencyKey?: string }
    >({
      query: ({ organizationId, id, body, idempotencyKey }) => ({
        url: `/finance/organizations/${organizationId}/payout_accounts/${id}/close`,
        method: "POST",
        body,
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "PayoutAccounts", id }],
    }),
    listLedgerEntries: builder.query<
      PaginatedResponse<LedgerEntry>,
      { organizationId: string; currency?: string }
    >({
      query: ({ organizationId, currency }) => ({
        url: `/finance/organizations/${organizationId}/ledger_entries`,
        params: currency ? { currency } : undefined,
      }),
      providesTags: (result) =>
        result
          ? [...result.data.map(({ id }) => ({ type: "LedgerEntries" as const, id }))]
          : [],
    }),
    getBalance: builder.query<SingleResponse<BalanceReport>, { organizationId: string; currency?: string }>({
      query: ({ organizationId, currency }) => ({
        url: `/finance/organizations/${organizationId}/balance`,
        params: currency ? { currency } : undefined,
      }),
      providesTags: [{ type: "Balance", id: "SINGLE" }],
    }),
    updateReservePolicy: builder.mutation<
      SingleResponse<Record<string, unknown>>,
      { provider: string; currency: string; targetMinor: number; actor?: string; idempotencyKey?: string }
    >({
      query: ({ provider, currency, targetMinor, idempotencyKey }) => ({
        url: `/finance/reserve_policies/${provider}/${currency}`,
        method: "PUT",
        body: { target_minor: targetMinor },
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      }),
      invalidatesTags: [{ type: "Balance", id: "SINGLE" }],
    }),
  }),
})

export const {
  // Organizer hooks
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

  // Admin hooks
  useListPayoutsQuery,
  useGetPayoutQuery,
  useCreatePayoutMutation,
  useDispatchPayoutMutation,
  useReconcilePayoutMutation,
  useListPayoutAccountsQuery,
  useCreatePayoutAccountMutation,
  useVerifyPayoutAccountMutation,
  useSetDefaultPayoutAccountMutation,
  useSuspendPayoutAccountMutation,
  useClosePayoutAccountMutation,
  useListLedgerEntriesQuery,
  useGetBalanceQuery,
  useUpdateReservePolicyMutation,
} = financeApi
