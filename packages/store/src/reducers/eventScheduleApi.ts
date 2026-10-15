import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQueryWithReauth, generateIdempotencyKey } from "../api"

// ─── Event Dates ─────────────────────────────────────────────────────────────

export interface EventDateVenue {
  id: string
  name: string
  city?: string | null
}

export interface EventDate {
  id: string
  event_id: string
  venue_id: string | null
  venue?: EventDateVenue | null
  name: string | null
  doors_at: string | null
  starts_at: string
  ends_at: string
  status: string
  venue_capacity: number | null
  held_venue_count: number
  issued_venue_count: number
  source_key: string | null
  created_at: string
  updated_at: string
}

interface CreateEventDatePayload {
  event_date: {
    venue_id?: string
    name?: string
    doors_at?: string
    starts_at: string
    ends_at: string
    venue_capacity?: number
  }
}

interface UpdateEventDatePayload {
  event_date: {
    name?: string
  }
}

// ─── Event Organizations ─────────────────────────────────────────────────────

export interface EventOrganization {
  id: string
  type: string
  role: string
  status: string
  organization_id: string
  event_id: string
  organization?: {
    id: string
    name: string
    slug?: string
    logo_url?: string | null
    verified?: boolean
  }
  created_at: string
  updated_at: string
}

interface CreateEventOrgPayload {
  event_organization: {
    organization_id: string
    type: string
    role: string
  }
}

interface UpdateEventOrgPayload {
  event_organization: {
    type?: string
    role?: string
  }
}

// ─── Staff Assignments ───────────────────────────────────────────────────────

export interface EventStaffAssignment {
  id: string
  role: "manager" | "staff" | "scanner" | "contractor" | string
  status: "active" | "suspended" | "revoked" | "expired" | string
  user_id: string
  organization_id: string | null
  event_id: string
  created_at: string
  updated_at: string
  user?: {
    id: string
    email?: string
    phone?: string
  }
  organization?: {
    id: string
    name?: string
  }
}

interface CreateStaffPayload {
  event_staff_assignment: {
    user_id: string
    role: string
  }
}

export interface StaffInvitation {
  id: string
  event_id: string
  role: "manager" | "staff" | "contractor"
  contact_type: "phone" | "email"
  masked_contact: string
  status: "pending" | "accepted" | "revoked" | "expired"
  delivery_status: string
  delivery_revision: number
  expires_at: string
  assignment_expires_at?: string | null
  accepted_at?: string | null
  revoked_at?: string | null
  expired_at?: string | null
  created_at: string
}

export interface StaffRosterData {
  assignments: {
    data: EventStaffAssignment[]
    pagination: {
      current_page: number
      total_pages: number
      total_count: number
      per_page?: number
    }
  }
  invitations: {
    data: StaffInvitation[]
    pagination: {
      current_page: number
      total_pages: number
      total_count: number
      per_page?: number
    }
  }
}

export interface StaffRosterParams {
  assignments_page?: number
  assignments_per_page?: number
  invitations_page?: number
  invitations_per_page?: number
}

export interface CreateStaffInvitationPayload {
  staff_invitation: {
    phone: string
    role: "manager" | "staff" | "contractor"
    assignment_expires_at?: string
    email?: string
  }
}

export interface CreateStaffInvitationResponse {
  invitation: StaffInvitation
  claim_url?: string
}

export interface StaffInvitationPreview {
  event: {
    id: string
    title: string
  }
  role: "manager" | "staff" | "contractor"
  inviter?: {
    email?: string
  }
  masked_contact: string
  expires_at: string
  assignment_expires_at?: string | null
}

export interface ClaimStaffInvitationResponse {
  assignment: EventStaffAssignment
  already_assigned: boolean
}

// ─── Access Zones ────────────────────────────────────────────────────────────

export interface AccessZone {
  id: string
  event_id: string
  event_date_id: string | null
  type: string
  name: string
  code: string
  active: boolean
  sort_order: number | null
  created_at: string
  updated_at: string
}

interface CreateAccessZonePayload {
  access_zone: {
    event_date_id?: string
    type?: string
    name: string
    code: string
    active?: boolean
    sort_order?: number
  }
}

interface UpdateAccessZonePayload {
  access_zone: {
    event_date_id?: string
    type?: string
    name?: string
    code?: string
    active?: boolean
    sort_order?: number
  }
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

export const eventScheduleApi = createApi({
  reducerPath: "eventScheduleApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["EventDates", "EventOrganizations", "StaffAssignments", "AccessZones"],
  endpoints: (builder) => ({
    // ── Event Dates ──
    listEventDates: builder.query<
      PaginatedResponse<EventDate>,
      { eventId: string; params?: { page?: number; per_page?: number } }
    >({
      query: ({ eventId, params }) => ({
        url: `/events/${eventId}/event_dates`,
        params,
      }),
      providesTags: (result, _error, { eventId }) =>
        Array.isArray(result?.data)
          ? [
              ...result.data.map(({ id }) => ({ type: "EventDates" as const, id })),
              { type: "EventDates", id: `LIST-${eventId}` },
            ]
          : [{ type: "EventDates", id: `LIST-${eventId}` }],
    }),
    createEventDate: builder.mutation<
      SingleResponse<EventDate>,
      { eventId: string; body: CreateEventDatePayload }
    >({
      query: ({ eventId, body }) => ({
        url: `/events/${eventId}/event_dates`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { eventId }) => [{ type: "EventDates", id: `LIST-${eventId}` }],
    }),
    updateEventDate: builder.mutation<
      SingleResponse<EventDate>,
      { eventId: string; id: string; body: UpdateEventDatePayload }
    >({
      query: ({ eventId, id, body }) => ({
        url: `/events/${eventId}/event_dates/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { eventId, id }) => [
        { type: "EventDates", id },
        { type: "EventDates", id: `LIST-${eventId}` },
      ],
    }),
    deleteEventDate: builder.mutation<void, { eventId: string; id: string }>({
      query: ({ eventId, id }) => ({
        url: `/events/${eventId}/event_dates/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { eventId }) => [{ type: "EventDates", id: `LIST-${eventId}` }],
    }),

    // ── Event Organizations ──
    listEventOrganizations: builder.query<
      PaginatedResponse<EventOrganization>,
      { eventId: string; params?: { page?: number; per_page?: number } }
    >({
      query: ({ eventId, params }) => ({
        url: `/events/${eventId}/event_organizations`,
        params,
      }),
      providesTags: (result, _error, { eventId }) => {
        const raw = result?.data as any
        const items: any[] = Array.isArray(raw?.collaborators)
          ? raw.collaborators
          : Array.isArray(raw)
          ? raw
          : []
        return [
          ...items.map(({ id }) => ({ type: "EventOrganizations" as const, id })),
          { type: "EventOrganizations", id: `LIST-${eventId}` },
        ]
      },
    }),
    createEventOrganization: builder.mutation<
      SingleResponse<EventOrganization>,
      { eventId: string; body: CreateEventOrgPayload }
    >({
      query: ({ eventId, body }) => ({
        url: `/events/${eventId}/event_organizations`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { eventId }) => [{ type: "EventOrganizations", id: `LIST-${eventId}` }],
    }),
    updateEventOrganization: builder.mutation<
      SingleResponse<EventOrganization>,
      { eventId: string; id: string; body: UpdateEventOrgPayload }
    >({
      query: ({ eventId, id, body }) => ({
        url: `/events/${eventId}/event_organizations/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { eventId, id }) => [
        { type: "EventOrganizations", id },
        { type: "EventOrganizations", id: `LIST-${eventId}` },
      ],
    }),
    deleteEventOrganization: builder.mutation<void, { eventId: string; id: string }>({
      query: ({ eventId, id }) => ({
        url: `/events/${eventId}/event_organizations/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { eventId }) => [{ type: "EventOrganizations", id: `LIST-${eventId}` }],
    }),
    activateEventOrganization: builder.mutation<void, { eventId: string; id: string }>({
      query: ({ eventId, id }) => ({
        url: `/events/${eventId}/event_organizations/${id}/activate`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, { eventId, id }) => [
        { type: "EventOrganizations", id },
        { type: "EventOrganizations", id: `LIST-${eventId}` },
      ],
    }),
    revokeEventOrganization: builder.mutation<void, { eventId: string; id: string }>({
      query: ({ eventId, id }) => ({
        url: `/events/${eventId}/event_organizations/${id}/revoke`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, { eventId, id }) => [
        { type: "EventOrganizations", id },
        { type: "EventOrganizations", id: `LIST-${eventId}` },
      ],
    }),

    // ── Staff Assignments ──
    listStaffAssignments: builder.query<
      PaginatedResponse<EventStaffAssignment>,
      { eventId: string; params?: { page?: number; per_page?: number } }
    >({
      query: ({ eventId, params }) => ({
        url: `/events/${eventId}/event_staff_assignments`,
        params,
      }),
      providesTags: (result, _error, { eventId }) =>
        Array.isArray(result?.data)
          ? [
              ...result.data.map(({ id }) => ({ type: "StaffAssignments" as const, id })),
              { type: "StaffAssignments", id: `LIST-${eventId}` },
            ]
          : [{ type: "StaffAssignments", id: `LIST-${eventId}` }],
    }),
    createStaffAssignment: builder.mutation<
      SingleResponse<EventStaffAssignment>,
      { eventId: string; body: CreateStaffPayload }
    >({
      query: ({ eventId, body }) => ({
        url: `/events/${eventId}/event_staff_assignments`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { eventId }) => [{ type: "StaffAssignments", id: `LIST-${eventId}` }],
    }),
    deleteStaffAssignment: builder.mutation<void, { eventId: string; id: string }>({
      query: ({ eventId, id }) => ({
        url: `/events/${eventId}/event_staff_assignments/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { eventId }) => [{ type: "StaffAssignments", id: `LIST-${eventId}` }],
    }),
    suspendStaffAssignment: builder.mutation<void, { eventId: string; id: string }>({
      query: ({ eventId, id }) => ({
        url: `/events/${eventId}/event_staff_assignments/${id}/suspend`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, { eventId, id }) => [
        { type: "StaffAssignments", id },
        { type: "StaffAssignments", id: `LIST-${eventId}` },
      ],
    }),
    activateStaffAssignment: builder.mutation<void, { eventId: string; id: string }>({
      query: ({ eventId, id }) => ({
        url: `/events/${eventId}/event_staff_assignments/${id}/activate`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, { eventId, id }) => [
        { type: "StaffAssignments", id },
        { type: "StaffAssignments", id: `LIST-${eventId}` },
      ],
    }),
    revokeStaffAssignment: builder.mutation<void, { eventId: string; id: string }>({
      query: ({ eventId, id }) => ({
        url: `/events/${eventId}/event_staff_assignments/${id}/revoke`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, { eventId, id }) => [
        { type: "StaffAssignments", id },
        { type: "StaffAssignments", id: `LIST-${eventId}` },
      ],
    }),
    changeStaffRole: builder.mutation<
      void,
      { eventId: string; id: string; role: string }
    >({
      query: ({ eventId, id, role }) => ({
        url: `/events/${eventId}/event_staff_assignments/${id}/change_role`,
        method: "POST",
        body: { role },
      }),
      invalidatesTags: (_result, _error, { eventId, id }) => [
        { type: "StaffAssignments", id },
        { type: "StaffAssignments", id: `LIST-${eventId}` },
      ],
    }),

    // ── Staff Roster & Invitations (Unified Phone-First Model) ───────────────
    getEventStaffRoster: builder.query<
      SingleResponse<StaffRosterData>,
      { eventId: string; params?: StaffRosterParams }
    >({
      query: ({ eventId, params }) => ({
        url: `/events/${eventId}/staff_roster`,
        params,
      }),
      providesTags: (_result, _error, { eventId }) => [
        { type: "StaffAssignments", id: `ROSTER-${eventId}` },
        { type: "StaffAssignments", id: `LIST-${eventId}` },
      ],
    }),
    createStaffInvitation: builder.mutation<
      SingleResponse<CreateStaffInvitationResponse>,
      { eventId: string; body: CreateStaffInvitationPayload; idempotencyKey?: string }
    >({
      query: ({ eventId, body, idempotencyKey }) => ({
        url: `/events/${eventId}/staff_invitations`,
        method: "POST",
        body,
        headers: {
          "Idempotency-Key": idempotencyKey || generateIdempotencyKey(),
        },
      }),
      invalidatesTags: (_result, _error, { eventId }) => [
        { type: "StaffAssignments", id: `ROSTER-${eventId}` },
        { type: "StaffAssignments", id: `LIST-${eventId}` },
      ],
    }),
    resendStaffInvitation: builder.mutation<
      SingleResponse<CreateStaffInvitationResponse>,
      { eventId: string; id: string; idempotencyKey?: string }
    >({
      query: ({ eventId, id, idempotencyKey }) => ({
        url: `/events/${eventId}/staff_invitations/${id}/resend`,
        method: "POST",
        headers: {
          "Idempotency-Key": idempotencyKey || generateIdempotencyKey(),
        },
      }),
      invalidatesTags: (_result, _error, { eventId }) => [
        { type: "StaffAssignments", id: `ROSTER-${eventId}` },
      ],
    }),
    revokeStaffInvitation: builder.mutation<
      SingleResponse<{ invitation: StaffInvitation }>,
      { eventId: string; id: string; idempotencyKey?: string }
    >({
      query: ({ eventId, id, idempotencyKey }) => ({
        url: `/events/${eventId}/staff_invitations/${id}/revoke`,
        method: "POST",
        headers: {
          "Idempotency-Key": idempotencyKey || generateIdempotencyKey(),
        },
      }),
      invalidatesTags: (_result, _error, { eventId }) => [
        { type: "StaffAssignments", id: `ROSTER-${eventId}` },
      ],
    }),
    previewStaffInvitation: builder.mutation<
      SingleResponse<StaffInvitationPreview>,
      { token: string }
    >({
      query: ({ token }) => ({
        url: `/events/staff_invitations/preview`,
        method: "POST",
        body: { token },
      }),
    }),
    claimStaffInvitation: builder.mutation<
      SingleResponse<ClaimStaffInvitationResponse>,
      { token: string; idempotencyKey?: string }
    >({
      query: ({ token, idempotencyKey }) => ({
        url: `/events/staff_invitations/claim`,
        method: "POST",
        body: { token },
        headers: {
          "Idempotency-Key": idempotencyKey || generateIdempotencyKey(),
        },
      }),
      invalidatesTags: () => [{ type: "StaffAssignments" }],
    }),

    // ── Access Zones ──
    listAccessZones: builder.query<
      PaginatedResponse<AccessZone>,
      { eventId: string; params?: { page?: number; per_page?: number } }
    >({
      query: ({ eventId, params }) => ({
        url: `/events/${eventId}/access_zones`,
        params,
      }),
      providesTags: (result, _error, { eventId }) =>
        Array.isArray(result?.data)
          ? [
              ...result.data.map(({ id }) => ({ type: "AccessZones" as const, id })),
              { type: "AccessZones", id: `LIST-${eventId}` },
            ]
          : [{ type: "AccessZones", id: `LIST-${eventId}` }],
    }),
    createAccessZone: builder.mutation<
      SingleResponse<AccessZone>,
      { eventId: string; body: CreateAccessZonePayload }
    >({
      query: ({ eventId, body }) => ({
        url: `/events/${eventId}/access_zones`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { eventId }) => [{ type: "AccessZones", id: `LIST-${eventId}` }],
    }),
    updateAccessZone: builder.mutation<
      SingleResponse<AccessZone>,
      { eventId: string; id: string; body: UpdateAccessZonePayload }
    >({
      query: ({ eventId, id, body }) => ({
        url: `/events/${eventId}/access_zones/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { eventId, id }) => [
        { type: "AccessZones", id },
        { type: "AccessZones", id: `LIST-${eventId}` },
      ],
    }),
    deleteAccessZone: builder.mutation<void, { eventId: string; id: string }>({
      query: ({ eventId, id }) => ({
        url: `/events/${eventId}/access_zones/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { eventId }) => [{ type: "AccessZones", id: `LIST-${eventId}` }],
    }),
  }),
})

export const {
  useListEventDatesQuery,
  useCreateEventDateMutation,
  useUpdateEventDateMutation,
  useDeleteEventDateMutation,
  useListEventOrganizationsQuery,
  useCreateEventOrganizationMutation,
  useUpdateEventOrganizationMutation,
  useDeleteEventOrganizationMutation,
  useActivateEventOrganizationMutation,
  useRevokeEventOrganizationMutation,
  useListStaffAssignmentsQuery,
  useCreateStaffAssignmentMutation,
  useDeleteStaffAssignmentMutation,
  useSuspendStaffAssignmentMutation,
  useActivateStaffAssignmentMutation,
  useRevokeStaffAssignmentMutation,
  useChangeStaffRoleMutation,
  useListAccessZonesQuery,
  useCreateAccessZoneMutation,
  useUpdateAccessZoneMutation,
  useDeleteAccessZoneMutation,
  useGetEventStaffRosterQuery,
  useCreateStaffInvitationMutation,
  useResendStaffInvitationMutation,
  useRevokeStaffInvitationMutation,
  usePreviewStaffInvitationMutation,
  useClaimStaffInvitationMutation,
} = eventScheduleApi
