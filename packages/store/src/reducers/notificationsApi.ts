import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQueryWithReauth } from "../api"

export interface NotificationItem {
  id: string
  user_id?: string
  title: string
  message: string
  category?: string
  notification_type?: string
  read: boolean
  read_at: string | null
  available_at?: string | null
  data?: Record<string, unknown>
  metadata?: Record<string, unknown>
  created_at: string
  updated_at?: string
}

export interface NotificationPreferenceRecord {
  id?: string
  category: string
  channel: string
  enabled: boolean
}

export interface NotificationPreferences {
  email_enabled?: boolean
  sms_enabled?: boolean
  push_enabled?: boolean
  marketing_emails?: boolean
  transactional_sms?: boolean
  security_alerts?: boolean
  preferences?: NotificationPreferenceRecord[]
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
      transformResponse: (response: any) => {
        const rawList = Array.isArray(response?.data) ? response.data : []
        const data: NotificationItem[] = rawList.map((item: any) => ({
          ...item,
          title:
            item.title ??
            item.data?.title ??
            item.notification_type?.replace(/_/g, " ") ??
            "Notification",
          message: item.message ?? item.data?.message ?? item.data?.text ?? "",
          read: item.read ?? Boolean(item.read_at),
        }))
        return {
          ...response,
          data,
        }
      },
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
      transformResponse: (response: any) => {
        const item = response.data || {}
        return {
          ...response,
          data: {
            ...item,
            title:
              item.title ??
              item.data?.title ??
              item.notification_type?.replace(/_/g, " ") ??
              "Notification",
            message: item.message ?? item.data?.message ?? item.data?.text ?? "",
            read: item.read ?? Boolean(item.read_at),
          },
        }
      },
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
      transformResponse: (response: any) => {
        const raw = response.data
        if (Array.isArray(raw)) {
          const prefsMap: NotificationPreferences = {
            preferences: raw,
            email_enabled: !raw.some((p) => p.channel === "email" && p.enabled === false),
            sms_enabled: !raw.some((p) => p.channel === "sms" && p.enabled === false),
            push_enabled: !raw.some((p) => p.channel === "push" && p.enabled === false),
            security_alerts: !raw.some(
              (p) => p.category === "security" && p.enabled === false
            ),
            transactional_sms: !raw.some(
              (p) => p.category === "transactional" && p.channel === "sms" && p.enabled === false
            ),
          }
          return {
            ...response,
            data: prefsMap,
          }
        }
        return response
      },
      providesTags: [{ type: "NotificationPreferences", id: "CURRENT" }],
    }),
    updateNotificationPreferences: builder.mutation<
      SingleResponse<NotificationPreferences>,
      | Partial<NotificationPreferences>
      | { preferences: NotificationPreferenceRecord[] }
    >({
      query: (body) => {
        let preferences: NotificationPreferenceRecord[] = []
        if ("preferences" in body && Array.isArray(body.preferences)) {
          preferences = body.preferences
        } else {
          if ("email_enabled" in body && typeof body.email_enabled === "boolean") {
            preferences.push({ category: "general", channel: "email", enabled: body.email_enabled })
          }
          if ("sms_enabled" in body && typeof body.sms_enabled === "boolean") {
            preferences.push({ category: "general", channel: "sms", enabled: body.sms_enabled })
          }
          if ("push_enabled" in body && typeof body.push_enabled === "boolean") {
            preferences.push({ category: "general", channel: "push", enabled: body.push_enabled })
          }
          if ("security_alerts" in body && typeof body.security_alerts === "boolean") {
            preferences.push({ category: "security", channel: "email", enabled: body.security_alerts })
          }
          if ("transactional_sms" in body && typeof body.transactional_sms === "boolean") {
            preferences.push({ category: "transactional", channel: "sms", enabled: body.transactional_sms })
          }
        }
        return {
          url: "/notification_preferences",
          method: "PATCH",
          body: { preferences },
        }
      },
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
