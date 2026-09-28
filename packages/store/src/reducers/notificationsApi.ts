import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQueryWithReauth } from "../api"

export interface NotificationItem {
  id: string
  user_id: string
  title: string
  message: string
  category?: string
  read: boolean
  read_at: string | null
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface NotificationPreferences {
  email_enabled: boolean
  sms_enabled: boolean
  push_enabled: boolean
  marketing_emails: boolean
  transactional_sms: boolean
  security_alerts: boolean
  [key: string]: unknown
}

interface ListNotificationsParams {
  page?: number
  per_page?: number
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

export const notificationsApi = createApi({
  reducerPath: "notificationsApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Notifications", "NotificationPreferences"],
  endpoints: (builder) => ({
    listNotifications: builder.query<
      PaginatedResponse<NotificationItem>,
      ListNotificationsParams | void
    >({
      query: (params) => ({
        url: "/notifications",
        params: params ?? undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: "Notifications" as const,
                id,
              })),
              { type: "Notifications", id: "LIST" },
            ]
          : [{ type: "Notifications", id: "LIST" }],
    }),
    getNotification: builder.query<SingleResponse<NotificationItem>, string>({
      query: (id) => `/notifications/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Notifications", id }],
    }),
    markNotificationAsRead: builder.mutation<
      SingleResponse<NotificationItem>,
      string
    >({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Notifications", id },
        { type: "Notifications", id: "LIST" },
      ],
    }),
    getNotificationPreferences: builder.query<
      SingleResponse<NotificationPreferences>,
      void
    >({
      query: () => "/notification_preferences",
      providesTags: [{ type: "NotificationPreferences", id: "CURRENT" }],
    }),
    updateNotificationPreferences: builder.mutation<
      SingleResponse<NotificationPreferences>,
      Partial<NotificationPreferences>
    >({
      query: (body) => ({
        url: "/notification_preferences",
        method: "PATCH",
        body: { notification_preferences: body },
      }),
      invalidatesTags: [{ type: "NotificationPreferences", id: "CURRENT" }],
    }),
  }),
})

export const {
  useListNotificationsQuery,
  useGetNotificationQuery,
  useMarkNotificationAsReadMutation,
  useGetNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
} = notificationsApi
