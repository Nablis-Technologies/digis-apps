import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQueryWithReauth } from "../api"

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  active: boolean
  metadata: { icon: string | null; color: string | null }
  created_at?: string
  updated_at?: string
}

interface ListCategoriesParams {
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

interface CreateCategoryPayload {
  category: {
    name: string
    description?: string
    active?: boolean
    metadata?: { icon?: string | null; color?: string | null }
  }
}

interface UpdateCategoryPayload {
  category: {
    name?: string
    description?: string
    active?: boolean
    metadata?: { icon?: string | null; color?: string | null }
  }
}

export const categoriesApi = createApi({
  reducerPath: "categoriesApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Categories"],
  endpoints: (builder) => ({
    listPublicCategories: builder.query<PaginatedResponse<Category>, ListCategoriesParams | void>({
      query: (params) => ({
        url: "/categories",
        params: params ?? undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "Categories" as const, id })),
              { type: "Categories", id: "PUBLIC_LIST" },
            ]
          : [{ type: "Categories", id: "PUBLIC_LIST" }],
    }),
    getPublicCategory: builder.query<SingleResponse<Category>, string>({
      query: (id) => `/categories/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Categories", id }],
    }),
    getCategory: builder.query<SingleResponse<Category>, string>({
      query: (id) => `/admin/categories/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Categories", id }],
    }),
    listCategories: builder.query<PaginatedResponse<Category>, ListCategoriesParams | void>({
      query: (params) => ({
        url: "/admin/categories",
        params: params ?? undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "Categories" as const, id })),
              { type: "Categories", id: "LIST" },
            ]
          : [{ type: "Categories", id: "LIST" }],
    }),
    createCategory: builder.mutation<SingleResponse<Category>, CreateCategoryPayload>({
      query: (body) => ({
        url: "/admin/categories",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Categories", id: "LIST" }, { type: "Categories", id: "PUBLIC_LIST" }],
    }),
    updateCategory: builder.mutation<SingleResponse<Category>, { id: string; body: UpdateCategoryPayload }>({
      query: ({ id, body }) => ({
        url: `/admin/categories/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Categories", id },
        { type: "Categories", id: "LIST" },
        { type: "Categories", id: "PUBLIC_LIST" },
      ],
    }),
    deleteCategory: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/categories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Categories", id: "LIST" }, { type: "Categories", id: "PUBLIC_LIST" }],
    }),
  }),
})

export const {
  useListPublicCategoriesQuery,
  useGetPublicCategoryQuery,
  useListCategoriesQuery,
  useGetCategoryQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoriesApi

