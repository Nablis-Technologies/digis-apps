import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQueryWithReauth } from "../api"

export interface Permission {
  id: string
  code: string
  resource: string
  action: string
  namespace: string | null
  description: string | null
  active: boolean
  created_at?: string
  updated_at?: string
}

interface ListPermissionsParams {
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

interface CreatePermissionPayload {
  permission: {
    code: string
    resource: string
    action: string
    namespace?: string
    description?: string
    active?: boolean
  }
}

interface UpdatePermissionPayload {
  permission: {
    description?: string
    active?: boolean
  }
}

export const permissionsApi = createApi({
  reducerPath: "permissionsApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Permissions"],
  endpoints: (builder) => ({
    listPermissions: builder.query<
      PaginatedResponse<Permission>,
      ListPermissionsParams | void
    >({
      query: (params) => ({
        url: "/admin/permissions",
        params: params ?? undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: "Permissions" as const,
                id,
              })),
              { type: "Permissions", id: "LIST" },
            ]
          : [{ type: "Permissions", id: "LIST" }],
    }),
    createPermission: builder.mutation<
      SingleResponse<Permission>,
      CreatePermissionPayload
    >({
      query: (body) => ({
        url: "/admin/permissions",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Permissions", id: "LIST" }],
    }),
    updatePermission: builder.mutation<
      SingleResponse<Permission>,
      { id: string; body: UpdatePermissionPayload }
    >({
      query: ({ id, body }) => ({
        url: `/admin/permissions/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Permissions", id },
      ],
    }),
    deletePermission: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/permissions/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Permissions", id: "LIST" }],
    }),
  }),
})

export const {
  useListPermissionsQuery,
  useCreatePermissionMutation,
  useUpdatePermissionMutation,
  useDeletePermissionMutation,
} = permissionsApi
