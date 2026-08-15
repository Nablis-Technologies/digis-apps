import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQueryWithReauth } from "../api"

export interface UserRole {
  id: string
  code: string
  name: string
}

export interface User {
  id: string
  email: string
  phone: string | null
  verified_at: string | null
  deactivated_at: string | null
  deactivated_reason: string | null
  created_at: string
  updated_at: string
  roles: UserRole[]
}

interface ListUsersParams {
  page?: number
  per_page?: number
  status?: "active" | "deactivated" | "all"
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

interface CreateUserPayload {
  user: {
    email: string
    phone?: string
    password: string
    verified_at?: string | null
  }
}

interface UpdateUserPayload {
  user: {
    email?: string
    phone?: string
    verified_at?: string | null
  }
}

interface DeactivatePayload {
  deactivated_reason: string
}

interface AssignRolePayload {
  user_role: {
    role_id: string
  }
}

export const usersApi = createApi({
  reducerPath: "usersApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Users", "User", "UserRoles"],
  endpoints: (builder) => ({
    listUsers: builder.query<PaginatedResponse<User>, ListUsersParams | void>({
      query: (params) => ({
        url: "/admin/users",
        params: params ?? undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "Users" as const, id })),
              { type: "Users", id: "LIST" },
            ]
          : [{ type: "Users", id: "LIST" }],
    }),
    getUser: builder.query<SingleResponse<User>, string>({
      query: (id) => `/admin/users/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Users", id }],
    }),
    createUser: builder.mutation<SingleResponse<User>, CreateUserPayload>({
      query: (body) => ({
        url: "/admin/users",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Users", id: "LIST" }],
    }),
    updateUser: builder.mutation<
      SingleResponse<User>,
      { id: string; body: UpdateUserPayload }
    >({
      query: ({ id, body }) => ({
        url: `/admin/users/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Users", id }],
    }),
    deleteUser: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/users/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Users", id: "LIST" }],
    }),
    deactivateUser: builder.mutation<
      SingleResponse<User>,
      { id: string; body: DeactivatePayload }
    >({
      query: ({ id, body }) => ({
        url: `/admin/users/${id}/deactivate`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Users", id }],
    }),
    reactivateUser: builder.mutation<SingleResponse<User>, string>({
      query: (id) => ({
        url: `/admin/users/${id}/reactivate`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [{ type: "Users", id }],
    }),
    assignRole: builder.mutation<
      void,
      { userId: string; body: AssignRolePayload }
    >({
      query: ({ userId, body }) => ({
        url: `/admin/users/${userId}/roles`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { userId }) => [
        { type: "Users", id: userId },
        { type: "UserRoles", id: userId },
      ],
    }),
    removeRole: builder.mutation<void, { userId: string; roleId: string }>({
      query: ({ userId, roleId }) => ({
        url: `/admin/users/${userId}/roles/${roleId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { userId }) => [
        { type: "Users", id: userId },
        { type: "UserRoles", id: userId },
      ],
    }),
    listUserRoles: builder.query<UserRole[], string>({
      query: (userId) => `/admin/users/${userId}/roles`,
      transformResponse: (response: { success: boolean; data: UserRole[] }) =>
        response.data,
      providesTags: (_result, _error, userId) => [
        { type: "UserRoles", id: userId },
      ],
    }),
  }),
})

export const {
  useListUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useDeactivateUserMutation,
  useReactivateUserMutation,
  useAssignRoleMutation,
  useRemoveRoleMutation,
  useListUserRolesQuery,
} = usersApi
