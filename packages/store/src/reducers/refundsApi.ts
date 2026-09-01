import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQueryWithReauth } from "../api"

export interface Refund {
  id: string
  amount_minor: number
  currency: string
  status: string
  reason?: string | null
  created_at: string
  updated_at: string
  payment?: {
    id: string
    order?: {
      id: string
      event?: {
        id: string
        title?: string
        slug?: string
      }
    }
  } | null
}

interface PageInfo {
  current_page: number
  per_page: number
  total_count: number
  total_pages: number
}

interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination?: PageInfo
}

interface SingleResponse<T> {
  success: boolean
  data: T
}

interface ListRefundParams {
  page?: number
  per_page?: number
  order_by?: string
  order_direction?: "asc" | "desc"
}

export const refundsApi = createApi({
  reducerPath: "refundsApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Refunds"],
  endpoints: (builder) => ({
    listRefunds: builder.query<PaginatedResponse<Refund>, ListRefundParams | void>({
      query: (params) => ({
        url: "/refunds",
        params: params ?? undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "Refunds" as const, id })),
              { type: "Refunds", id: "LIST" },
            ]
          : [{ type: "Refunds", id: "LIST" }],
    }),
    getRefund: builder.query<SingleResponse<Refund>, string>({
      query: (id) => `/refunds/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Refunds", id }],
    }),
  }),
})

export const { useListRefundsQuery, useGetRefundQuery } = refundsApi
