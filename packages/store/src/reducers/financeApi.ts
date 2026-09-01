import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQueryWithReauth } from "../api"

export interface PayoutAccount {
  id: string
  organization_id: string
  type: string
  provider: string
  bank_code?: string
  account_name?: string
  account_label?: string
  status: string
  verified_at?: string | null
  created_at: string
  updated_at: string
}

export interface Payout {
  id: string
  organization_id: string
  currency: string
  amount_minor: number
  status: string
  provider?: string | null
  requested_at: string
  created_at: string
  updated_at: string
}

export interface LedgerEntry {
  id: string
  organization_id: string
  currency: string
  amount_minor: number
  entry_type: string
  description?: string | null
  created_at: string
}

export interface BalanceReport {
  currency?: string
  available_minor?: number
  pending_minor?: number
  reserved_minor?: number
  total_minor?: number
}

interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination?: {
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

interface ListParams {
  page?: number
  per_page?: number
  order_by?: string
  order_direction?: "asc" | "desc"
}

export const financeApi = createApi({
  reducerPath: "financeApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Payouts", "PayoutAccounts", "LedgerEntries", "Balance"],
  endpoints: (builder) => ({
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
