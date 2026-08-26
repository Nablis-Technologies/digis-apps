import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQueryWithReauth } from "../api"

export interface Venue {
  id: string
  name: string
  description: string | null
  address: string | null
  city: string
  country: string
  capacity: number | null
  contact_phone: string | null
  contact_email: string | null
  verified: boolean
  active: boolean
  created_at?: string
  updated_at?: string
}

interface ListVenuesParams {
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

interface CreateVenuePayload {
  venue: {
    name: string
    description?: string
    address?: string
    city: string
    country: string
    capacity?: number | null
    contact_phone?: string
    contact_email?: string
    verified?: boolean
    active?: boolean
  }
}

interface UpdateVenuePayload {
  venue: Partial<CreateVenuePayload["venue"]>
}

export const venuesApi = createApi({
  reducerPath: "venuesApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Venues"],
  endpoints: (builder) => ({
    listPublicVenues: builder.query<PaginatedResponse<Venue>, ListVenuesParams | void>({
      query: (params) => ({
        url: "/venues",
        params: params ?? undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "Venues" as const, id })),
              { type: "Venues", id: "PUBLIC_LIST" },
            ]
          : [{ type: "Venues", id: "PUBLIC_LIST" }],
    }),
    getPublicVenue: builder.query<SingleResponse<Venue>, string>({
      query: (id) => `/venues/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Venues", id }],
    }),
    listVenues: builder.query<PaginatedResponse<Venue>, ListVenuesParams | void>({
      query: (params) => ({
        url: "/admin/venues",
        params: params ?? undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "Venues" as const, id })),
              { type: "Venues", id: "LIST" },
            ]
          : [{ type: "Venues", id: "LIST" }],
    }),
    getVenue: builder.query<SingleResponse<Venue>, string>({
      query: (id) => `/admin/venues/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Venues", id }],
    }),
    createVenue: builder.mutation<SingleResponse<Venue>, CreateVenuePayload>({
      query: (body) => ({
        url: "/admin/venues",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Venues", id: "LIST" }, { type: "Venues", id: "PUBLIC_LIST" }],
    }),
    updateVenue: builder.mutation<SingleResponse<Venue>, { id: string; body: UpdateVenuePayload }>({
      query: ({ id, body }) => ({
        url: `/admin/venues/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Venues", id },
        { type: "Venues", id: "LIST" },
        { type: "Venues", id: "PUBLIC_LIST" },
      ],
    }),
    deleteVenue: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/venues/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Venues", id: "LIST" }, { type: "Venues", id: "PUBLIC_LIST" }],
    }),
  }),
})

export const {
  useListPublicVenuesQuery,
  useGetPublicVenueQuery,
  useListVenuesQuery,
  useGetVenueQuery,
  useCreateVenueMutation,
  useUpdateVenueMutation,
  useDeleteVenueMutation,
} = venuesApi

