import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQueryWithReauth } from "../api"

export interface NotificationDelivery {
  id: string
  channel: "in_app" | "email" | "sms" | string
  status: "pending" | "sent" | "failed" | string
  sent_at?: string | null
  failed_at?: string | null
}

export interface NotificationItem {
  id: string
  notification_type: string
  category: string
  data: Record<string, unknown>
  read_at: string | null
  available_at: string
  created_at: string
  deliveries?: NotificationDelivery[]
}

export interface NotificationPreference {
  id?: string
  category: string
  channel: "in_app" | "email" | "sms" | string
  enabled: boolean
}

export interface PaginatedNotificationsResponse {
  success: boolean
  data: NotificationItem[]
  pagination?: {
    current_page: number
    per_page: number
    total_count: number
    total_pages: number
  }
}

export interface SingleNotificationResponse {
  success: boolean
  data: NotificationItem
  message?: string
}

export interface PreferencesResponse {
  success: boolean
  data: NotificationPreference[]
  message?: string
}

export interface ListNotificationsParams {
  page?: number
  per_page?: number
  "q[read_at_null]"?: boolean
  order_by?: string
  order_direction?: "asc" | "desc"
}

export const notificationsApi = createApi({
  reducerPath: "notificationsApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Notifications", "NotificationPreferences"],
  endpoints: (builder) => ({
    listNotifications: builder.query<
      PaginatedNotificationsResponse,
      ListNotificationsParams | void
    >({
      query: (params) => ({
        url: "/notifications",
        params: params || { page: 1, per_page: 25 },
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: "Notifications" as const, id })),
              { type: "Notifications", id: "LIST" },
            ]
          : [{ type: "Notifications", id: "LIST" }],
    }),

    getNotification: builder.query<SingleNotificationResponse, string>({
      query: (id) => `/notifications/${id}`,
      providesTags: (_res, _err, id) => [{ type: "Notifications", id }],
    }),

    markNotificationRead: builder.mutation<SingleNotificationResponse, string>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: "POST",
      }),
      invalidatesTags: (_res, _err, id) => [
        { type: "Notifications", id },
        { type: "Notifications", id: "LIST" },
      ],
    }),

    getNotificationPreferences: builder.query<PreferencesResponse, void>({
      query: () => "/notification_preferences",
      providesTags: ["NotificationPreferences"],
    }),

    updateNotificationPreferences: builder.mutation<
      PreferencesResponse,
      { preferences: NotificationPreference[] }
    >({
      query: ({ preferences }) => ({
        url: "/notification_preferences",
        method: "PATCH",
        headers: {
          "Idempotency-Key":
            typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
              ? crypto.randomUUID()
              : `pref-${Date.now()}`,
        },
        body: { preferences },
      }),
      invalidatesTags: ["NotificationPreferences"],
    }),
  }),
})

export const {
  useListNotificationsQuery,
  useGetNotificationQuery,
  useMarkNotificationReadMutation,
  useGetNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
} = notificationsApi
