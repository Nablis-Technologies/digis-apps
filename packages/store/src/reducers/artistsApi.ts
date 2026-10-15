import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQueryWithReauth } from "../api"

export interface Artist {
  id: string
  name: string
  slug?: string
  description: string | null
  genres: string[]
  verified: boolean
  active: boolean
  profile_url?: string | null
  created_at?: string
  updated_at?: string
}

interface ListArtistsParams {
  page?: number
  per_page?: number
  order_by?: string
  order_direction?: "asc" | "desc"
  genre?: string
  verified?: boolean
  search?: string
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

interface CreateArtistPayload {
  artist: {
    name: string
    description?: string
    genres?: string[]
    verified?: boolean
    active?: boolean
  }
}

interface UpdateArtistPayload {
  artist: Partial<CreateArtistPayload["artist"]>
}

export const artistsApi = createApi({
  reducerPath: "artistsApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Artists"],
  endpoints: (builder) => ({
    listPublicArtists: builder.query<
      PaginatedResponse<Artist>,
      ListArtistsParams | void
    >({
      query: (params) => ({
        url: "/artists",
        params: params ?? undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: "Artists" as const,
                id,
              })),
              { type: "Artists", id: "PUBLIC_LIST" },
            ]
          : [{ type: "Artists", id: "PUBLIC_LIST" }],
    }),
    getPublicArtist: builder.query<SingleResponse<Artist>, string>({
      query: (id) => `/artists/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Artists", id }],
    }),
    listArtists: builder.query<
      PaginatedResponse<Artist>,
      ListArtistsParams | void
    >({
      query: (params) => ({
        url: "/admin/artists",
        params: params ?? undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: "Artists" as const,
                id,
              })),
              { type: "Artists", id: "LIST" },
            ]
          : [{ type: "Artists", id: "LIST" }],
    }),
    getArtist: builder.query<SingleResponse<Artist>, string>({
      query: (id) => `/admin/artists/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Artists", id }],
    }),
    createArtist: builder.mutation<SingleResponse<Artist>, CreateArtistPayload>(
      {
        query: (body) => ({
          url: "/admin/artists",
          method: "POST",
          body,
        }),
        invalidatesTags: [{ type: "Artists", id: "LIST" }],
      }
    ),
    updateArtist: builder.mutation<
      SingleResponse<Artist>,
      { id: string; body: UpdateArtistPayload }
    >({
      query: ({ id, body }) => ({
        url: `/admin/artists/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Artists", id }],
    }),
    deleteArtist: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/artists/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Artists", id: "LIST" }],
    }),
  }),
})

export const {
  useListPublicArtistsQuery,
  useGetPublicArtistQuery,
  useListArtistsQuery,
  useGetArtistQuery,
  useCreateArtistMutation,
  useUpdateArtistMutation,
  useDeleteArtistMutation,
} = artistsApi
