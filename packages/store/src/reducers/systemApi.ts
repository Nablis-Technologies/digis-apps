import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQueryWithReauth } from "../api"

export interface ReadinessDetail {
  name?: string
  status?: string
  ok?: boolean
  message?: string
  [key: string]: unknown
}

export interface ReadinessReport {
  success?: boolean
  status?: string
  healthy?: boolean
  checks?: ReadinessDetail[]
  [key: string]: unknown
}

export const systemApi = createApi({
  reducerPath: "systemApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Readiness"],
  endpoints: (builder) => ({
    getReadiness: builder.query<{ data?: ReadinessReport }, void>({
      query: () => "/admin/system/readiness",
      providesTags: [{ type: "Readiness", id: "SINGLE" }],
    }),
  }),
})

export const { useGetReadinessQuery } = systemApi
