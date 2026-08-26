import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQueryWithReauth } from "../api"

// ─────────────────────────────────────────────────────────────────────────────
// Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

export interface Event {
  id: string
  title: string
  description: string | null
  visibility: "public" | "private"
  timezone: string
  currency: string
  organization_id: string
  category_ids: string[]
  status: "draft" | "published" | "cancelled" | "completed"
  published_at?: string | null
  created_at: string
  updated_at: string
  [key: string]: unknown
}

export interface EventDate {
  id: string
  event_id: string
  venue_id?: string | null
  name?: string | null
  doors_at?: string | null
  starts_at: string
  ends_at?: string | null
  timezone: string
  status?: string
  venue_capacity?: number | null
  created_at?: string
  updated_at?: string
}

export interface TicketTypeAttributes {
  approval_mode?: "automatic" | "manual"
  audience?: "public" | "invite_only" | "passcode"
  date_selection?: "fixed" | "flexible"
  admissions_per_unit?: number
  waitlist_enabled?: boolean
  transferable?: boolean
  delegation_enabled?: boolean
  entry_validation_mode?: "qr" | "manual"
  resale_enabled?: boolean
  max_packages_per_user?: number
}

export interface PriceAttributes {
  type?: "base" | "override"
  currency?: string
  amount_minor?: number
  active_from?: string
  active_to?: string | null
}

export interface InventoryConfiguration {
  mode?: "per_date" | "shared"
  capacity?: number
  dates?: {
    event_date_id: string
    capacity: number
  }[]
}

export interface EventProduct {
  id: string
  event_id: string
  name: string
  type: "ticket" | "addon" | "donation" | string
  description?: string | null
  allow_custom_price?: boolean
  sales_start_at?: string | null
  sales_end_at?: string | null
  min_per_order?: number
  max_per_order?: number
  sort_order?: number
  status?: "draft" | "active" | "deactivated" | "retired"
  ticket_type?: TicketTypeAttributes & { id?: string }
  price?: PriceAttributes & { id?: string }
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

export interface CreateEventProductPayload {
  name: string
  type?: "ticket" | "addon" | "donation" | string
  description?: string
  allow_custom_price?: boolean
  sales_start_at?: string
  sales_end_at?: string
  min_per_order?: number
  max_per_order?: number
  sort_order?: number
  ticket_type_attributes?: TicketTypeAttributes
  price_attributes?: PriceAttributes
  inventory_configuration?: InventoryConfiguration
}

export interface UpdateEventProductPayload {
  name?: string
  description?: string
  allow_custom_price?: boolean
  min_per_order?: number
  max_per_order?: number
  sort_order?: number
}

export interface AccessCode {
  id: string
  code?: string
  label?: string | null
  max_uses?: number | null
  max_quantity_per_use?: number | null
  starts_at?: string | null
  expires_at?: string | null
  active?: boolean
  created_at?: string
  updated_at?: string
}

export interface CreateAccessCodePayload {
  code: string
  label?: string
  max_uses?: number | null
  max_quantity_per_use?: number
  starts_at?: string
  expires_at?: string
  active?: boolean
}

export interface Invitation {
  id: string
  name?: string | null
  email?: string | null
  phone?: string | null
  allowed_quantity?: number
  expires_at?: string | null
  claimed_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface CreateInvitationPayload {
  name?: string
  email?: string
  phone?: string
  allowed_quantity?: number
  expires_at?: string
}

export interface RegistrationQuestion {
  key: string
  type: "short_text" | "long_text" | "number" | "single_choice" | "multiple_choice" | "checkbox" | "phone" | "email"
  response_scope?: "registration" | "attendee"
  sensitivity?: "standard" | "pii"
  label: string
  help_text?: string
  required: boolean
  position: number
  options?: { label: string; value: string }[] | string[]
  validation_rules?: Record<string, unknown>
}

export interface RegistrationForm {
  id: string
  event_id: string
  name: string
  active: boolean
  created_at?: string
  updated_at?: string
}

export interface RegistrationFormVersion {
  id: string
  form_id: string
  version: number
  status: "draft" | "published" | "archived"
  questions: RegistrationQuestion[]
  created_at?: string
  updated_at?: string
}

export interface EventMedia {
  id: string
  event_id: string
  type: "cover" | "gallery" | "logo" | string
  position: number
  alt_text?: string | null
  caption?: string | null
  file_url?: string | null
  created_at?: string
  updated_at?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Request / Response Wrappers
// ─────────────────────────────────────────────────────────────────────────────

interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination?: {
    current_page: number
    per_page: number
    total_count: number
    total_pages: number
  }
}

interface SingleResponse<T> {
  success: boolean
  data: T
  message?: string
}

interface ListEventsParams {
  page?: number
  per_page?: number
  order_by?: string
  order_direction?: "asc" | "desc"
  "q[status_eq]"?: string
  "q[visibility_eq]"?: string
}

export interface CreateEventPayload {
  event: {
    title: string
    description?: string
    visibility: "public" | "private"
    timezone?: string
    currency?: string
    organization_id: string
    category_ids?: string[]
  }
}

export interface UpdateEventPayload {
  event: Partial<CreateEventPayload["event"]>
}

// ─────────────────────────────────────────────────────────────────────────────
// API Slice
// ─────────────────────────────────────────────────────────────────────────────

export const organizerEventsApi = createApi({
  reducerPath: "organizerEventsApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Events",
    "EventDates",
    "EventProducts",
    "AccessCodes",
    "Invitations",
    "RegistrationForms",
    "RegistrationFormVersions",
    "EventMedia",
  ],
  endpoints: (builder) => ({
    // ─── Event Core Operations ───────────────────────────────────────────────
    listEvents: builder.query<PaginatedResponse<Event>, ListEventsParams | void>({
      query: (params) => ({
        url: "/events",
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
      query: (id) => `/events/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Events", id }],
    }),

    createEvent: builder.mutation<SingleResponse<Event>, CreateEventPayload>({
      query: (body) => ({
        url: "/events",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Events", id: "LIST" }],
    }),

    updateEvent: builder.mutation<SingleResponse<Event>, { id: string; body: UpdateEventPayload }>({
      query: ({ id, body }) => ({
        url: `/events/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Events", id },
        { type: "Events", id: "LIST" },
      ],
    }),

    publishEvent: builder.mutation<SingleResponse<Event>, { id: string; idempotencyKey?: string }>({
      query: ({ id, idempotencyKey }) => ({
        url: `/events/${id}/publish`,
        method: "POST",
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Events", id },
        { type: "Events", id: "LIST" },
      ],
    }),

    // ─── Event Dates ──────────────────────────────────────────────────────────
    listEventDates: builder.query<PaginatedResponse<EventDate> | SingleResponse<EventDate[]>, string>({
      query: (eventId) => `/events/${eventId}/event_dates`,
      providesTags: (_result, _error, eventId) => [{ type: "EventDates", id: eventId }],
    }),

    getEventDate: builder.query<SingleResponse<EventDate>, { eventId: string; dateId: string }>({
      query: ({ eventId, dateId }) => `/events/${eventId}/event_dates/${dateId}`,
      providesTags: (_result, _error, { dateId }) => [{ type: "EventDates", id: dateId }],
    }),

    createEventDate: builder.mutation<SingleResponse<EventDate>, { eventId: string; date: Partial<EventDate> }>({
      query: ({ eventId, date }) => ({
        url: `/events/${eventId}/event_dates`,
        method: "POST",
        body: { event_date: date },
      }),
      invalidatesTags: (_result, _error, { eventId }) => [
        { type: "EventDates", id: eventId },
        { type: "Events", id: eventId },
      ],
    }),

    updateEventDate: builder.mutation<SingleResponse<EventDate>, { eventId: string; dateId: string; date: Partial<EventDate> }>({
      query: ({ eventId, dateId, date }) => ({
        url: `/events/${eventId}/event_dates/${dateId}`,
        method: "PATCH",
        body: { event_date: date },
      }),
      invalidatesTags: (_result, _error, { eventId, dateId }) => [
        { type: "EventDates", id: dateId },
        { type: "EventDates", id: eventId },
      ],
    }),

    deleteEventDate: builder.mutation<void, { eventId: string; dateId: string }>({
      query: ({ eventId, dateId }) => ({
        url: `/events/${eventId}/event_dates/${dateId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { eventId }) => [{ type: "EventDates", id: eventId }],
    }),

    // ─── Event Products (Tickets / Entry Types) ───────────────────────────────
    listEventProducts: builder.query<PaginatedResponse<EventProduct> | SingleResponse<EventProduct[]>, string>({
      query: (eventId) => `/events/${eventId}/event_products`,
      providesTags: (_result, _error, eventId) => [{ type: "EventProducts", id: eventId }],
    }),

    getEventProduct: builder.query<SingleResponse<EventProduct>, { eventId: string; productId: string }>({
      query: ({ eventId, productId }) => `/events/${eventId}/event_products/${productId}`,
      providesTags: (_result, _error, { productId }) => [{ type: "EventProducts", id: productId }],
    }),

    createEventProduct: builder.mutation<
      SingleResponse<EventProduct>,
      { eventId: string; product: CreateEventProductPayload; idempotencyKey?: string }
    >({
      query: ({ eventId, product, idempotencyKey }) => ({
        url: `/events/${eventId}/event_products`,
        method: "POST",
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
        body: product,
      }),
      invalidatesTags: (_result, _error, { eventId }) => [
        { type: "EventProducts", id: eventId },
        { type: "Events", id: eventId },
      ],
    }),

    updateEventProduct: builder.mutation<
      SingleResponse<EventProduct>,
      { eventId: string; productId: string; product: UpdateEventProductPayload }
    >({
      query: ({ eventId, productId, product }) => ({
        url: `/events/${eventId}/event_products/${productId}`,
        method: "PATCH",
        body: product,
      }),
      invalidatesTags: (_result, _error, { eventId, productId }) => [
        { type: "EventProducts", id: productId },
        { type: "EventProducts", id: eventId },
      ],
    }),

    deleteEventProduct: builder.mutation<void, { eventId: string; productId: string }>({
      query: ({ eventId, productId }) => ({
        url: `/events/${eventId}/event_products/${productId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { eventId }) => [{ type: "EventProducts", id: eventId }],
    }),

    activateEventProduct: builder.mutation<SingleResponse<EventProduct>, { eventId: string; productId: string }>({
      query: ({ eventId, productId }) => ({
        url: `/events/${eventId}/event_products/${productId}/activate`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, { productId, eventId }) => [
        { type: "EventProducts", id: productId },
        { type: "EventProducts", id: eventId },
      ],
    }),

    deactivateEventProduct: builder.mutation<SingleResponse<EventProduct>, { eventId: string; productId: string }>({
      query: ({ eventId, productId }) => ({
        url: `/events/${eventId}/event_products/${productId}/deactivate`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, { productId, eventId }) => [
        { type: "EventProducts", id: productId },
        { type: "EventProducts", id: eventId },
      ],
    }),

    updateInventoryConfiguration: builder.mutation<
      SingleResponse<EventProduct>,
      { eventId: string; productId: string; inventory: InventoryConfiguration }
    >({
      query: ({ eventId, productId, inventory }) => ({
        url: `/events/${eventId}/event_products/${productId}/update_inventory_configuration`,
        method: "PATCH",
        body: { inventory_configuration: inventory },
      }),
      invalidatesTags: (_result, _error, { productId }) => [{ type: "EventProducts", id: productId }],
    }),

    // ─── Ticket Type Sub-Resource ─────────────────────────────────────────────
    getTicketType: builder.query<SingleResponse<TicketTypeAttributes>, { eventId: string; productId: string }>({
      query: ({ eventId, productId }) => `/events/${eventId}/event_products/${productId}/ticket_type`,
    }),

    createTicketType: builder.mutation<
      SingleResponse<TicketTypeAttributes>,
      { eventId: string; productId: string; ticketType: TicketTypeAttributes }
    >({
      query: ({ eventId, productId, ticketType }) => ({
        url: `/events/${eventId}/event_products/${productId}/ticket_type`,
        method: "POST",
        body: ticketType,
      }),
      invalidatesTags: (_result, _error, { productId }) => [{ type: "EventProducts", id: productId }],
    }),

    updateTicketType: builder.mutation<
      SingleResponse<TicketTypeAttributes>,
      { eventId: string; productId: string; ticketType: Partial<TicketTypeAttributes> }
    >({
      query: ({ eventId, productId, ticketType }) => ({
        url: `/events/${eventId}/event_products/${productId}/ticket_type`,
        method: "PATCH",
        body: ticketType,
      }),
      invalidatesTags: (_result, _error, { productId }) => [{ type: "EventProducts", id: productId }],
    }),

    deleteTicketType: builder.mutation<void, { eventId: string; productId: string }>({
      query: ({ eventId, productId }) => ({
        url: `/events/${eventId}/event_products/${productId}/ticket_type`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { productId }) => [{ type: "EventProducts", id: productId }],
    }),

    // ─── Access Codes (for invite-only / gated tiers) ─────────────────────────
    listAccessCodes: builder.query<
      PaginatedResponse<AccessCode> | SingleResponse<AccessCode[]>,
      { eventId: string; productId: string }
    >({
      query: ({ eventId, productId }) => `/events/${eventId}/event_products/${productId}/ticket_type/access_codes`,
      providesTags: (_result, _error, { productId }) => [{ type: "AccessCodes", id: productId }],
    }),

    getAccessCode: builder.query<
      SingleResponse<AccessCode>,
      { eventId: string; productId: string; accessCodeId: string }
    >({
      query: ({ eventId, productId, accessCodeId }) =>
        `/events/${eventId}/event_products/${productId}/ticket_type/access_codes/${accessCodeId}`,
      providesTags: (_result, _error, { accessCodeId }) => [{ type: "AccessCodes", id: accessCodeId }],
    }),

    createAccessCode: builder.mutation<
      SingleResponse<AccessCode>,
      { eventId: string; productId: string; accessCode: CreateAccessCodePayload; idempotencyKey?: string }
    >({
      query: ({ eventId, productId, accessCode, idempotencyKey }) => ({
        url: `/events/${eventId}/event_products/${productId}/ticket_type/access_codes`,
        method: "POST",
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
        body: accessCode,
      }),
      invalidatesTags: (_result, _error, { productId }) => [{ type: "AccessCodes", id: productId }],
    }),

    deleteAccessCode: builder.mutation<void, { eventId: string; productId: string; accessCodeId: string }>({
      query: ({ eventId, productId, accessCodeId }) => ({
        url: `/events/${eventId}/event_products/${productId}/ticket_type/access_codes/${accessCodeId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { productId }) => [{ type: "AccessCodes", id: productId }],
    }),

    // ─── Invitations (Guest List for invite-only tiers) ───────────────────────
    listInvitations: builder.query<
      PaginatedResponse<Invitation> | SingleResponse<Invitation[]>,
      { eventId: string; productId: string }
    >({
      query: ({ eventId, productId }) => `/events/${eventId}/event_products/${productId}/ticket_type/invitations`,
      providesTags: (_result, _error, { productId }) => [{ type: "Invitations", id: productId }],
    }),

    getInvitation: builder.query<
      SingleResponse<Invitation>,
      { eventId: string; productId: string; invitationId: string }
    >({
      query: ({ eventId, productId, invitationId }) =>
        `/events/${eventId}/event_products/${productId}/ticket_type/invitations/${invitationId}`,
      providesTags: (_result, _error, { invitationId }) => [{ type: "Invitations", id: invitationId }],
    }),

    createInvitation: builder.mutation<
      SingleResponse<Invitation>,
      { eventId: string; productId: string; invitation: CreateInvitationPayload; idempotencyKey?: string }
    >({
      query: ({ eventId, productId, invitation, idempotencyKey }) => ({
        url: `/events/${eventId}/event_products/${productId}/ticket_type/invitations`,
        method: "POST",
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
        body: invitation,
      }),
      invalidatesTags: (_result, _error, { productId }) => [{ type: "Invitations", id: productId }],
    }),

    deleteInvitation: builder.mutation<void, { eventId: string; productId: string; invitationId: string }>({
      query: ({ eventId, productId, invitationId }) => ({
        url: `/events/${eventId}/event_products/${productId}/ticket_type/invitations/${invitationId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { productId }) => [{ type: "Invitations", id: productId }],
    }),

    // ─── Registration Forms & Versions (Custom Questions) ─────────────────────
    listRegistrationForms: builder.query<
      PaginatedResponse<RegistrationForm> | SingleResponse<RegistrationForm[]>,
      string
    >({
      query: (eventId) => `/events/${eventId}/registration_forms`,
      providesTags: (_result, _error, eventId) => [{ type: "RegistrationForms", id: eventId }],
    }),

    getRegistrationForm: builder.query<SingleResponse<RegistrationForm>, { eventId: string; formId: string }>({
      query: ({ eventId, formId }) => `/events/${eventId}/registration_forms/${formId}`,
      providesTags: (_result, _error, { formId }) => [{ type: "RegistrationForms", id: formId }],
    }),

    createRegistrationForm: builder.mutation<
      SingleResponse<RegistrationForm>,
      { eventId: string; form: { name: string; active?: boolean } }
    >({
      query: ({ eventId, form }) => ({
        url: `/events/${eventId}/registration_forms`,
        method: "POST",
        body: form,
      }),
      invalidatesTags: (_result, _error, { eventId }) => [{ type: "RegistrationForms", id: eventId }],
    }),

    updateRegistrationForm: builder.mutation<
      SingleResponse<RegistrationForm>,
      { eventId: string; formId: string; form: { name?: string; active?: boolean } }
    >({
      query: ({ eventId, formId, form }) => ({
        url: `/events/${eventId}/registration_forms/${formId}`,
        method: "PATCH",
        body: form,
      }),
      invalidatesTags: (_result, _error, { formId }) => [{ type: "RegistrationForms", id: formId }],
    }),

    deleteRegistrationForm: builder.mutation<void, { eventId: string; formId: string }>({
      query: ({ eventId, formId }) => ({
        url: `/events/${eventId}/registration_forms/${formId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { eventId }) => [{ type: "RegistrationForms", id: eventId }],
    }),

    listRegistrationFormVersions: builder.query<
      PaginatedResponse<RegistrationFormVersion> | SingleResponse<RegistrationFormVersion[]>,
      { eventId: string; formId: string }
    >({
      query: ({ eventId, formId }) => `/events/${eventId}/registration_forms/${formId}/versions`,
      providesTags: (_result, _error, { formId }) => [{ type: "RegistrationFormVersions", id: formId }],
    }),

    getRegistrationFormVersion: builder.query<
      SingleResponse<RegistrationFormVersion>,
      { eventId: string; formId: string; versionId: string }
    >({
      query: ({ eventId, formId, versionId }) =>
        `/events/${eventId}/registration_forms/${formId}/versions/${versionId}`,
      providesTags: (_result, _error, { versionId }) => [{ type: "RegistrationFormVersions", id: versionId }],
    }),

    createRegistrationFormVersion: builder.mutation<
      SingleResponse<RegistrationFormVersion>,
      { eventId: string; formId: string; version: number; questions: RegistrationQuestion[] }
    >({
      query: ({ eventId, formId, version, questions }) => ({
        url: `/events/${eventId}/registration_forms/${formId}/versions`,
        method: "POST",
        body: { version, questions },
      }),
      invalidatesTags: (_result, _error, { formId }) => [{ type: "RegistrationFormVersions", id: formId }],
    }),

    publishRegistrationFormVersion: builder.mutation<
      SingleResponse<RegistrationFormVersion>,
      { eventId: string; formId: string; versionId: string; idempotencyKey?: string }
    >({
      query: ({ eventId, formId, versionId, idempotencyKey }) => ({
        url: `/events/${eventId}/registration_forms/${formId}/versions/${versionId}/publish`,
        method: "POST",
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
        body: {},
      }),
      invalidatesTags: (_result, _error, { formId, versionId }) => [
        { type: "RegistrationFormVersions", id: formId },
        { type: "RegistrationFormVersions", id: versionId },
      ],
    }),

    // ─── Event Media (Images / Covers) ────────────────────────────────────────
    listEventMedia: builder.query<PaginatedResponse<EventMedia> | SingleResponse<EventMedia[]>, string>({
      query: (eventId) => `/events/${eventId}/event_media`,
      providesTags: (_result, _error, eventId) => [{ type: "EventMedia", id: eventId }],
    }),

    getEventMedia: builder.query<SingleResponse<EventMedia>, { eventId: string; mediaId: string }>({
      query: ({ eventId, mediaId }) => `/events/${eventId}/event_media/${mediaId}`,
      providesTags: (_result, _error, { mediaId }) => [{ type: "EventMedia", id: mediaId }],
    }),

    createEventMedia: builder.mutation<SingleResponse<EventMedia>, { eventId: string; formData: FormData }>({
      query: ({ eventId, formData }) => ({
        url: `/events/${eventId}/event_media`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (_result, _error, { eventId }) => [{ type: "EventMedia", id: eventId }],
    }),

    updateEventMedia: builder.mutation<
      SingleResponse<EventMedia>,
      { eventId: string; mediaId: string; formData: FormData }
    >({
      query: ({ eventId, mediaId, formData }) => ({
        url: `/events/${eventId}/event_media/${mediaId}`,
        method: "PATCH",
        body: formData,
      }),
      invalidatesTags: (_result, _error, { mediaId, eventId }) => [
        { type: "EventMedia", id: mediaId },
        { type: "EventMedia", id: eventId },
      ],
    }),

    deleteEventMedia: builder.mutation<void, { eventId: string; mediaId: string }>({
      query: ({ eventId, mediaId }) => ({
        url: `/events/${eventId}/event_media/${mediaId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { eventId }) => [{ type: "EventMedia", id: eventId }],
    }),

    reorderEventMedia: builder.mutation<SingleResponse<EventMedia[]>, { eventId: string; orderedIds: string[] }>({
      query: ({ eventId, orderedIds }) => ({
        url: `/events/${eventId}/event_media/reorder`,
        method: "POST",
        body: { ordered_ids: orderedIds },
      }),
      invalidatesTags: (_result, _error, { eventId }) => [{ type: "EventMedia", id: eventId }],
    }),
  }),
})

// ─────────────────────────────────────────────────────────────────────────────
// Export Hooks
// ─────────────────────────────────────────────────────────────────────────────

export const {
  // Events
  useListEventsQuery,
  useGetEventQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  usePublishEventMutation,

  // Event Dates
  useListEventDatesQuery,
  useGetEventDateQuery,
  useCreateEventDateMutation,
  useUpdateEventDateMutation,
  useDeleteEventDateMutation,

  // Event Products
  useListEventProductsQuery,
  useGetEventProductQuery,
  useCreateEventProductMutation,
  useUpdateEventProductMutation,
  useDeleteEventProductMutation,
  useActivateEventProductMutation,
  useDeactivateEventProductMutation,
  useUpdateInventoryConfigurationMutation,

  // Ticket Types
  useGetTicketTypeQuery,
  useCreateTicketTypeMutation,
  useUpdateTicketTypeMutation,
  useDeleteTicketTypeMutation,

  // Access Codes
  useListAccessCodesQuery,
  useGetAccessCodeQuery,
  useCreateAccessCodeMutation,
  useDeleteAccessCodeMutation,

  // Invitations
  useListInvitationsQuery,
  useGetInvitationQuery,
  useCreateInvitationMutation,
  useDeleteInvitationMutation,

  // Registration Forms
  useListRegistrationFormsQuery,
  useGetRegistrationFormQuery,
  useCreateRegistrationFormMutation,
  useUpdateRegistrationFormMutation,
  useDeleteRegistrationFormMutation,
  useListRegistrationFormVersionsQuery,
  useGetRegistrationFormVersionQuery,
  useCreateRegistrationFormVersionMutation,
  usePublishRegistrationFormVersionMutation,

  // Event Media
  useListEventMediaQuery,
  useGetEventMediaQuery,
  useCreateEventMediaMutation,
  useUpdateEventMediaMutation,
  useDeleteEventMediaMutation,
  useReorderEventMediaMutation,
} = organizerEventsApi
