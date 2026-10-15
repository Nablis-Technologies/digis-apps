import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQueryWithReauth } from "../api"

export interface Role {
  id: string
  code: string
  name: string
  description?: string | null
  active?: boolean
  permission_ids?: string[]
}

interface ListRolesParams {
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

interface CreateRolePayload {
  role: {
    code: string
    name: string
    description?: string
    active?: boolean
    permission_ids?: string[]
  }
}

interface UpdateRolePayload {
  role: {
    name?: string
    description?: string
    active?: boolean
    permission_ids?: string[]
  }
}

export const rolesApi = createApi({
  reducerPath: "rolesApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Roles"],
  endpoints: (builder) => ({
    listRoles: builder.query<PaginatedResponse<Role>, ListRolesParams | void>({
      query: (params) => ({
        url: "/admin/roles",
        params: params ?? undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "Roles" as const, id })),
              { type: "Roles", id: "LIST" },
            ]
          : [{ type: "Roles", id: "LIST" }],
    }),
    getRole: builder.query<SingleResponse<Role>, string>({
      query: (id) => `/admin/roles/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Roles", id }],
    }),
    createRole: builder.mutation<SingleResponse<Role>, CreateRolePayload>({
      query: (body) => ({
        url: "/admin/roles",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Roles", id: "LIST" }],
    }),
    updateRole: builder.mutation<
      SingleResponse<Role>,
      { id: string; body: UpdateRolePayload }
    >({
      query: ({ id, body }) => ({
        url: `/admin/roles/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Roles", id }],
    }),
    deleteRole: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/roles/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Roles", id: "LIST" }],
    }),
  }),
})

export const {
  useListRolesQuery,
  useGetRoleQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
} = rolesApi
