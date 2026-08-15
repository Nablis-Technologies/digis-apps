import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQueryWithReauth } from "../api"

// ─── Event Products ─────────────────────────────────────────────────────────

export interface EventProduct {
  id: string
  event_id: string
  name: string
  description: string | null
  type: string
  status: "draft" | "active" | "retired"
  inventory_mode: string | null
  allow_custom_price: boolean
  sales_start_at: string | null
  sales_end_at: string | null
  min_per_order: number | null
  max_per_order: number | null
  schedule_change_refund_policy: string | null
  sort_order: number | null
  metadata: Record<string, unknown> | null
  lock_version: number
  created_at: string
  updated_at: string
  ticket_type?: TicketType | null
}

export interface TicketType {
  id: string
  event_product_id: string
  approval_mode: string
  audience: string
  date_selection: string
  delegation_enabled: boolean
  delegation_validation_mode: string
  entry_validation_mode: string
  transferable: boolean
  transfer_cutoff_seconds_before_start: number | null
  admissions_per_unit: number
  resale_enabled: boolean
  resale_price_cap_type: string | null
  resale_fixed_cap_currency: string | null
  resale_fixed_cap_minor: number | null
  resale_percentage_cap_bps: number | null
  resale_cutoff_seconds_before_start: number | null
  max_completed_resales: number | null
  max_packages_per_user: number | null
  waitlist_enabled: boolean
  created_at: string
  updated_at: string
}

export interface AccessCode {
  id: string
  ticket_type_id: string
  label: string
  max_uses: number | null
  used_count: number
  max_quantity_per_use: number | null
  starts_at: string | null
  expires_at: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface Invitation {
  id: string
  ticket_type_id: string
  invited_user_id: string | null
  name: string
  allowed_quantity: number
  status: string
  expires_at: string | null
  accepted_at: string | null
  created_by_id: string
  created_at: string
  updated_at: string
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

interface CreateEventProductPayload {
  name: string
  type: string
  description?: string
  allow_custom_price?: boolean
  sales_start_at?: string
  sales_end_at?: string
  min_per_order?: number
  max_per_order?: number
  sort_order?: number
  ticket_type_attributes?: {
    approval_mode?: string
    audience?: string
    date_selection?: string
    admissions_per_unit?: number
  }
  price_attributes?: {
    type?: string
    currency?: string
    amount_minor?: number
    active_from?: string
  }
}

interface UpdateEventProductPayload {
  name?: string
  description?: string
  allow_custom_price?: boolean
  sales_start_at?: string
  sales_end_at?: string
  min_per_order?: number
  max_per_order?: number
  sort_order?: number
}

interface CreateTicketTypePayload {
  approval_mode?: string
  audience?: string
  date_selection?: string
  waitlist_enabled?: boolean
  transferable?: boolean
  admissions_per_unit?: number
  delegation_enabled?: boolean
  delegation_validation_mode?: string
  entry_validation_mode?: string
  resale_enabled?: boolean
  max_completed_resales?: number
}

interface CreateAccessCodePayload {
  code?: string
  max_uses?: number
  max_quantity_per_use?: number
  label?: string
  starts_at?: string
  expires_at?: string
  active?: boolean
}

interface CreateInvitationPayload {
  email?: string
  name?: string
  allowed_quantity?: number
  expires_at?: string
  phone?: string
}

export const ticketingApi = createApi({
  reducerPath: "ticketingApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["EventProducts", "TicketTypes", "AccessCodes", "Invitations"],
  endpoints: (builder) => ({
    // ── Event Products ──
    listEventProducts: builder.query<
      PaginatedResponse<EventProduct>,
      { eventId: string; params?: { page?: number; per_page?: number } }
    >({
      query: ({ eventId, params }) => ({
        url: `/events/${eventId}/event_products`,
        params,
      }),
      providesTags: (result, _error, { eventId }) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "EventProducts" as const, id })),
              { type: "EventProducts", id: `LIST-${eventId}` },
            ]
          : [{ type: "EventProducts", id: `LIST-${eventId}` }],
    }),
    getEventProduct: builder.query<SingleResponse<EventProduct>, { eventId: string; id: string }>({
      query: ({ eventId, id }) => `/events/${eventId}/event_products/${id}`,
      providesTags: (_result, _error, { id }) => [{ type: "EventProducts", id }],
    }),
    createEventProduct: builder.mutation<
      SingleResponse<EventProduct>,
      { eventId: string; body: CreateEventProductPayload }
    >({
      query: ({ eventId, body }) => ({
        url: `/events/${eventId}/event_products`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { eventId }) => [
        { type: "EventProducts", id: `LIST-${eventId}` },
      ],
    }),
    updateEventProduct: builder.mutation<
      SingleResponse<EventProduct>,
      { eventId: string; id: string; body: UpdateEventProductPayload }
    >({
      query: ({ eventId, id, body }) => ({
        url: `/events/${eventId}/event_products/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { eventId, id }) => [
        { type: "EventProducts", id },
        { type: "EventProducts", id: `LIST-${eventId}` },
      ],
    }),
    deleteEventProduct: builder.mutation<void, { eventId: string; id: string }>({
      query: ({ eventId, id }) => ({
        url: `/events/${eventId}/event_products/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { eventId }) => [
        { type: "EventProducts", id: `LIST-${eventId}` },
      ],
    }),
    activateEventProduct: builder.mutation<void, { eventId: string; id: string }>({
      query: ({ eventId, id }) => ({
        url: `/events/${eventId}/event_products/${id}/activate`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, { eventId, id }) => [
        { type: "EventProducts", id },
        { type: "EventProducts", id: `LIST-${eventId}` },
      ],
    }),
    deactivateEventProduct: builder.mutation<void, { eventId: string; id: string }>({
      query: ({ eventId, id }) => ({
        url: `/events/${eventId}/event_products/${id}/deactivate`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, { eventId, id }) => [
        { type: "EventProducts", id },
        { type: "EventProducts", id: `LIST-${eventId}` },
      ],
    }),

    // ── Ticket Types ──
    getTicketType: builder.query<
      SingleResponse<TicketType>,
      { eventId: string; productId: string }
    >({
      query: ({ eventId, productId }) =>
        `/events/${eventId}/event_products/${productId}/ticket_type`,
      providesTags: (_result, _error, { productId }) => [{ type: "TicketTypes", id: productId }],
    }),
    createTicketType: builder.mutation<
      SingleResponse<TicketType>,
      { eventId: string; productId: string; body: CreateTicketTypePayload }
    >({
      query: ({ eventId, productId, body }) => ({
        url: `/events/${eventId}/event_products/${productId}/ticket_type`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { productId }) => [{ type: "TicketTypes", id: productId }],
    }),
    updateTicketType: builder.mutation<
      SingleResponse<TicketType>,
      { eventId: string; productId: string; body: CreateTicketTypePayload }
    >({
      query: ({ eventId, productId, body }) => ({
        url: `/events/${eventId}/event_products/${productId}/ticket_type`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { productId }) => [{ type: "TicketTypes", id: productId }],
    }),
    deleteTicketType: builder.mutation<void, { eventId: string; productId: string }>({
      query: ({ eventId, productId }) => ({
        url: `/events/${eventId}/event_products/${productId}/ticket_type`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { productId }) => [{ type: "TicketTypes", id: productId }],
    }),

    // ── Access Codes ──
    listAccessCodes: builder.query<
      PaginatedResponse<AccessCode>,
      { eventId: string; productId: string }
    >({
      query: ({ eventId, productId }) =>
        `/events/${eventId}/event_products/${productId}/ticket_type/access_codes`,
      providesTags: (_result, _error, { productId }) => [{ type: "AccessCodes", id: productId }],
    }),
    createAccessCode: builder.mutation<
      SingleResponse<AccessCode>,
      { eventId: string; productId: string; body: CreateAccessCodePayload }
    >({
      query: ({ eventId, productId, body }) => ({
        url: `/events/${eventId}/event_products/${productId}/ticket_type/access_codes`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { productId }) => [{ type: "AccessCodes", id: productId }],
    }),
    deleteAccessCode: builder.mutation<
      void,
      { eventId: string; productId: string; id: string }
    >({
      query: ({ eventId, productId, id }) => ({
        url: `/events/${eventId}/event_products/${productId}/ticket_type/access_codes/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { productId }) => [{ type: "AccessCodes", id: productId }],
    }),

    // ── Invitations ──
    listInvitations: builder.query<
      PaginatedResponse<Invitation>,
      { eventId: string; productId: string }
    >({
      query: ({ eventId, productId }) =>
        `/events/${eventId}/event_products/${productId}/ticket_type/invitations`,
      providesTags: (_result, _error, { productId }) => [{ type: "Invitations", id: productId }],
    }),
    createInvitation: builder.mutation<
      SingleResponse<Invitation>,
      { eventId: string; productId: string; body: CreateInvitationPayload }
    >({
      query: ({ eventId, productId, body }) => ({
        url: `/events/${eventId}/event_products/${productId}/ticket_type/invitations`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { productId }) => [{ type: "Invitations", id: productId }],
    }),
    deleteInvitation: builder.mutation<
      void,
      { eventId: string; productId: string; id: string }
    >({
      query: ({ eventId, productId, id }) => ({
        url: `/events/${eventId}/event_products/${productId}/ticket_type/invitations/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { productId }) => [{ type: "Invitations", id: productId }],
    }),
  }),
})

export const {
  useListEventProductsQuery,
  useGetEventProductQuery,
  useCreateEventProductMutation,
  useUpdateEventProductMutation,
  useDeleteEventProductMutation,
  useActivateEventProductMutation,
  useDeactivateEventProductMutation,
  useGetTicketTypeQuery,
  useCreateTicketTypeMutation,
  useUpdateTicketTypeMutation,
  useDeleteTicketTypeMutation,
  useListAccessCodesQuery,
  useCreateAccessCodeMutation,
  useDeleteAccessCodeMutation,
  useListInvitationsQuery,
  useCreateInvitationMutation,
  useDeleteInvitationMutation,
} = ticketingApi
