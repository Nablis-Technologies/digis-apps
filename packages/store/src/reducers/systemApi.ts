import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQueryWithReauth } from "../api"

export interface ReadinessDetail {
  name: string
  status: string
  ok?: boolean
  message?: string
  [key: string]: unknown
}

export interface ReadinessReport {
  success?: boolean
  status?: string
  healthy?: boolean
  checks?: ReadinessDetail[]
  components?: Record<string, string>
  [key: string]: unknown
}

export const systemApi = createApi({
  reducerPath: "systemApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Readiness"],
  endpoints: (builder) => ({
    getReadiness: builder.query<{ data?: ReadinessReport }, void>({
      query: () => "/admin/system/readiness",
      transformResponse: (response: any) => {
        if (!response?.data) return response
        const rawData = response.data
        let checks: ReadinessDetail[] = rawData.checks ?? []
        if (!checks.length && rawData.components) {
          checks = Object.entries(rawData.components).map(([name, status]) => ({
            name,
            status: String(status),
            ok: status === "ok",
          }))
        }
        return {
          ...response,
          data: {
            ...rawData,
            healthy: rawData.status === "ok",
            checks,
          },
        }
      },
      providesTags: [{ type: "Readiness", id: "SINGLE" }],
    }),
  }),
})

export const { useGetReadinessQuery } = systemApi
