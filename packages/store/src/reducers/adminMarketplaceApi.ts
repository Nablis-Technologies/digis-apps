import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQueryWithReauth } from "../api"

export interface AdminSellerPayoutAccount {
  id: string
  seller_id: string
  account_type: "bank" | "mobile_money"
  account_number: string
  account_name: string
  institution_code: string
  institution_name?: string
  currency: string
  verified: boolean
  active: boolean
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface AdminSellerPayout {
  id: string
  seller_id: string
  seller_payout_account_id: string
  amount_minor: number
  currency: string
  status: "pending" | "dispatched" | "reconciled" | "failed"
  provider_reference?: string
  dispatched_at?: string
  reconciled_at?: string
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

export const adminMarketplaceApi = createApi({
  reducerPath: "adminMarketplaceApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["SellerPayoutAccounts", "SellerPayouts"],
  endpoints: (builder) => ({
    listAdminSellerPayoutAccounts: builder.query<
      PaginatedResponse<AdminSellerPayoutAccount>,
      ListParams | void
    >({
      query: (params) => ({
        url: "/admin/marketplace/seller_payout_accounts",
        params: params ?? undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: "SellerPayoutAccounts" as const,
                id,
              })),
              { type: "SellerPayoutAccounts", id: "LIST" },
            ]
          : [{ type: "SellerPayoutAccounts", id: "LIST" }],
    }),
    getAdminSellerPayoutAccount: builder.query<
      SingleResponse<AdminSellerPayoutAccount>,
      string
    >({
      query: (id) => `/admin/marketplace/seller_payout_accounts/${id}`,
      providesTags: (_result, _error, id) => [
        { type: "SellerPayoutAccounts", id },
      ],
    }),
    verifyAdminSellerPayoutAccount: builder.mutation<
      SingleResponse<AdminSellerPayoutAccount>,
      string
    >({
      query: (id) => ({
        url: `/admin/marketplace/seller_payout_accounts/${id}/verify`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "SellerPayoutAccounts", id },
        { type: "SellerPayoutAccounts", id: "LIST" },
      ],
    }),

    listAdminSellerPayouts: builder.query<
      PaginatedResponse<AdminSellerPayout>,
      ListParams | void
    >({
      query: (params) => ({
        url: "/admin/marketplace/seller_payouts",
        params: params ?? undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: "SellerPayouts" as const,
                id,
              })),
              { type: "SellerPayouts", id: "LIST" },
            ]
          : [{ type: "SellerPayouts", id: "LIST" }],
    }),
    getAdminSellerPayout: builder.query<
      SingleResponse<AdminSellerPayout>,
      string
    >({
      query: (id) => `/admin/marketplace/seller_payouts/${id}`,
      providesTags: (_result, _error, id) => [{ type: "SellerPayouts", id }],
    }),
    dispatchAdminSellerPayout: builder.mutation<
      SingleResponse<AdminSellerPayout>,
      { id: string; provider?: string }
    >({
      query: ({ id, provider }) => ({
        url: `/admin/marketplace/seller_payouts/${id}/dispatch`,
        method: "POST",
        body: provider ? { provider } : undefined,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "SellerPayouts", id },
        { type: "SellerPayouts", id: "LIST" },
      ],
    }),
    reconcileAdminSellerPayout: builder.mutation<
      SingleResponse<AdminSellerPayout>,
      { id: string; reference?: string }
    >({
      query: ({ id, reference }) => ({
        url: `/admin/marketplace/seller_payouts/${id}/reconcile`,
        method: "POST",
        body: reference ? { reference } : undefined,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "SellerPayouts", id },
        { type: "SellerPayouts", id: "LIST" },
      ],
    }),
  }),
})

export const {
  useListAdminSellerPayoutAccountsQuery,
  useGetAdminSellerPayoutAccountQuery,
  useVerifyAdminSellerPayoutAccountMutation,
  useListAdminSellerPayoutsQuery,
  useGetAdminSellerPayoutQuery,
  useDispatchAdminSellerPayoutMutation,
  useReconcileAdminSellerPayoutMutation,
} = adminMarketplaceApi
