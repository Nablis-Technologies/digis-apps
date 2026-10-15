import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQueryWithReauth, generateIdempotencyKey } from "../api"

export interface NotificationDelivery {
  id: string
  channel: "in_app" | "email" | "sms" | string
  status: "pending" | "sent" | "failed" | string
  sent_at?: string | null
  failed_at?: string | null
}

export interface NotificationItem {
  id: string
  user_id?: string
  notification_type: string
  category: string
  title?: string
  message?: string
  description?: string
  read?: boolean
  read_at?: string | null
  available_at?: string | null
  data?: Record<string, unknown>
  metadata?: Record<string, unknown>
  deliveries?: NotificationDelivery[]
  created_at: string
  updated_at?: string
}

export interface NotificationPreferenceRecord {
  id?: string
  category: string
  channel: "in_app" | "email" | "sms" | string
  enabled: boolean
}

export type NotificationPreference = NotificationPreferenceRecord

export type NotificationPreferencesData = NotificationPreference[] & {
  email_enabled?: boolean
  sms_enabled?: boolean
  push_enabled?: boolean
  marketing_emails?: boolean
  transactional_sms?: boolean
  security_alerts?: boolean
  preferences?: NotificationPreference[]
  [key: string]: unknown
}

export type NotificationPreferences = NotificationPreferencesData

export interface ListNotificationsParams {
  page?: number
  per_page?: number
  "q[read_at_null]"?: boolean
  order_by?: string
  order_direction?: "asc" | "desc"
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
  data: NotificationPreferencesData
  message?: string
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
      transformResponse: (response: any) => {
        const rawList = Array.isArray(response?.data) ? response.data : []
        const data: NotificationItem[] = rawList.map((item: any) => {
          const payload = (item.data || {}) as Record<string, any>
          const derivedTitle =
            item.title ??
            payload?.title ??
            payload?.subject ??
            item.notification_type?.replace(/_/g, " ") ??
            "Notification"
          const derivedMessage =
            item.message ??
            payload?.message ??
            payload?.body ??
            payload?.description ??
            payload?.text ??
            item.category ??
            ""
          return {
            ...item,
            title: derivedTitle,
            message: derivedMessage,
            description: item.description ?? derivedMessage,
            read: item.read ?? Boolean(item.read_at),
          }
        })
        return {
          ...response,
          data,
        }
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({
                type: "Notifications" as const,
                id,
              })),
              { type: "Notifications", id: "LIST" },
            ]
          : [{ type: "Notifications", id: "LIST" }],
    }),

    getNotification: builder.query<SingleNotificationResponse, string>({
      query: (id) => `/notifications/${id}`,
      transformResponse: (response: any) => {
        const item = response.data || {}
        const payload = (item.data || {}) as Record<string, any>
        const derivedTitle =
          item.title ??
          payload?.title ??
          payload?.subject ??
          item.notification_type?.replace(/_/g, " ") ??
          "Notification"
        const derivedMessage =
          item.message ??
          payload?.message ??
          payload?.body ??
          payload?.description ??
          payload?.text ??
          ""
        return {
          ...response,
          data: {
            ...item,
            title: derivedTitle,
            message: derivedMessage,
            description: item.description ?? derivedMessage,
            read: item.read ?? Boolean(item.read_at),
          },
        }
      },
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

    markNotificationAsRead: builder.mutation<SingleNotificationResponse, string>({
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
      transformResponse: (response: any) => {
        const raw: NotificationPreference[] = Array.isArray(response?.data)
          ? response.data
          : []
        const prefsMap = {
          email_enabled: !raw.some((p) => p.channel === "email" && p.enabled === false),
          sms_enabled: !raw.some((p) => p.channel === "sms" && p.enabled === false),
          push_enabled: !raw.some((p) => p.channel === "push" && p.enabled === false),
          security_alerts: !raw.some(
            (p) => p.category === "security" && p.enabled === false
          ),
          transactional_sms: !raw.some(
            (p) => p.category === "transactional" && p.channel === "sms" && p.enabled === false
          ),
          preferences: raw,
        }
        const dataWithHelpers = Object.assign([...raw], prefsMap) as NotificationPreferencesData
        return {
          ...response,
          data: dataWithHelpers,
        }
      },
      providesTags: [
        { type: "NotificationPreferences", id: "CURRENT" },
        "NotificationPreferences",
      ],
    }),

    updateNotificationPreferences: builder.mutation<
      PreferencesResponse,
      | Partial<NotificationPreferences>
      | { preferences: NotificationPreference[] }
    >({
      query: (body) => {
        let preferences: NotificationPreference[] = []
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
          headers: {
            "Idempotency-Key": generateIdempotencyKey(),
          },
          body: { preferences },
        }
      },
      invalidatesTags: [
        { type: "NotificationPreferences", id: "CURRENT" },
        "NotificationPreferences",
      ],
    }),
  }),
})

export const {
  useListNotificationsQuery,
  useGetNotificationQuery,
  useMarkNotificationReadMutation,
  useMarkNotificationAsReadMutation,
  useGetNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
} = notificationsApi
