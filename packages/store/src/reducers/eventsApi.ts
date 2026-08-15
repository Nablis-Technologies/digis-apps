import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQueryWithReauth } from "../api"
import type { Organization } from "./organizationsApi"
import type { Category } from "./categoriesApi"

export interface Event {
  id: string
  slug: string
  title: string
  description: string | null
  status: "draft" | "published" | "cancelled"
  visibility: string
  timezone: string
  currency: string
  version: number
  published_at: string | null
  cancelled_at: string | null
  created_at: string
  updated_at: string
  organization?: Organization
  categories?: Category[]
}

interface ListEventsParams {
  page?: number
  per_page?: number
  order_by?: string
  order_direction?: "asc" | "desc"
  q?: Record<string, string>
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

interface CreateEventPayload {
  event: {
    title: string
    description?: string
    visibility?: string
    timezone?: string
    currency?: string
    organization_id: string
    category_ids?: string[]
  }
}

interface UpdateEventPayload {
  event: Partial<Omit<CreateEventPayload["event"], "organization_id">>
}

export const eventsApi = createApi({
  reducerPath: "eventsApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Events"],
  endpoints: (builder) => ({
    listEvents: builder.query<PaginatedResponse<Event>, ListEventsParams | void>({
      query: (params) => ({
        url: "/admin/events",
        params: params ?? undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "Events" as const, id })),
              { type: "Events", id: "LIST" },
            ]
          : [{ type: "Events", id: "LIST" }],
    }),
    getEvent: builder.query<SingleResponse<Event>, string>({
      query: (id) => `/admin/events/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Events", id }],
    }),
    createEvent: builder.mutation<SingleResponse<Event>, CreateEventPayload>({
      query: (body) => ({
        url: "/admin/events",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Events", id: "LIST" }],
    }),
    updateEvent: builder.mutation<
      SingleResponse<Event>,
      { id: string; body: UpdateEventPayload }
    >({
      query: ({ id, body }) => ({
        url: `/admin/events/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Events", id }],
    }),
    deleteEvent: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/events/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Events", id: "LIST" }],
    }),
    publishEvent: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/events/${id}/publish`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [{ type: "Events", id }],
    }),
    unpublishEvent: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/events/${id}/unpublish`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [{ type: "Events", id }],
    }),
  }),
})

export const {
  useListEventsQuery,
  useGetEventQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
  usePublishEventMutation,
  useUnpublishEventMutation,
} = eventsApi
