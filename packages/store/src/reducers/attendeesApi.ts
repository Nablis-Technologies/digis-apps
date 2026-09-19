import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQueryWithReauth } from "../api"

// ─────────────────────────────────────────────────────────────────────────────
// Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

export interface ScannerDevice {
  id: string
  organization_id: string
  device_identifier: string
  name: string
  status: "active" | "revoked" | string
  last_seen_at?: string | null
  revoked_at?: string | null
  created_at: string
  updated_at: string
}

export interface AttendeeExport {
  id: string
  event_id: string
  requested_by_id?: string
  status: "pending" | "processing" | "ready" | "failed" | "expired" | string
  row_mode: "registration" | "admission" | string
  format_version?: number
  field_set_digest?: string
  filter_digest?: string
  reason_code?: string
  data_cutoff_at?: string | null
  row_count?: number | null
  file_sha256?: string | null
  attempt_count?: number
  processing_started_at?: string | null
  ready_at?: string | null
  failed_at?: string | null
  expires_at?: string | null
  last_download_authorized_at?: string | null
  failure_code?: string | null
  created_at: string
  updated_at: string
}

export interface Registration {
  id: string
  event_id: string
  ticket_type_id: string
  selected_event_date_id?: string | null
  source?: string
  package_quantity?: number
  admissions_per_unit_snapshot?: number
  party_size?: number
  status: "pending" | "approved" | "rejected" | "waitlisted" | "confirmed" | "cancelled" | string
  next_action_snapshot?: Record<string, unknown> | null
  submitted_at?: string | null
  waitlisted_at?: string | null
  offered_at?: string | null
  offer_expires_at?: string | null
  approved_at?: string | null
  rejected_at?: string | null
  confirmed_at?: string | null
  cancelled_at?: string | null
  created_at: string
  updated_at: string
}

export interface IssueComplimentaryTicketPayload {
  ticket_type_id: string
  phone: string
  package_quantity?: number
  selected_event_date_id?: string
  reason?: string
  answers?: Array<{
    question_key: string
    form_version_id?: string
    value: string | number | boolean | string[]
  }>
  consents?: Array<{
    consent_document_version_id: string
    acceptance_method: string
  }>
}

export interface RequestAttendeeExportPayload {
  row_mode?: "registration" | "admission"
  field_keys?: string[]
  filters?: Record<string, unknown>
  reason_code?: "event_operations" | "marketing" | "compliance" | string
  proof?: string
}

export interface AuthorizeDownloadPayload {
  proof?: string
}

interface SingleResponse<T> {
  success: boolean
  data: T
  message?: string
}

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

// ─────────────────────────────────────────────────────────────────────────────
// API Slice
// ─────────────────────────────────────────────────────────────────────────────

export const attendeesApi = createApi({
  reducerPath: "attendeesApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["ScannerDevices", "AttendeeExports", "Registrations", "ComplimentaryTickets"],
  endpoints: (builder) => ({
    // ── Complimentary Tickets ──
    issueComplimentaryTicket: builder.mutation<
      SingleResponse<Registration>,
      { eventId: string; payload: IssueComplimentaryTicketPayload }
    >({
      query: ({ eventId, payload }) => ({
        url: `/events/${eventId}/complimentary_tickets`,
        method: "POST",
        headers: {
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: payload,
      }),
      invalidatesTags: (_result, _error, { eventId }) => [
        { type: "ComplimentaryTickets", id: eventId },
        { type: "Registrations", id: eventId },
      ],
    }),

    // ── Attendee Exports ──
    requestAttendeeExport: builder.mutation<
      SingleResponse<AttendeeExport>,
      { eventId: string; payload?: RequestAttendeeExportPayload }
    >({
      query: ({ eventId, payload = {} }) => ({
        url: `/events/${eventId}/attendee_exports`,
        method: "POST",
        headers: {
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: {
          row_mode: payload.row_mode ?? "registration",
          field_keys: payload.field_keys ?? ["registration_id", "registration_status"],
          filters: payload.filters ?? {},
          reason_code: payload.reason_code ?? "event_operations",
          ...(payload.proof ? { proof: payload.proof } : {}),
        },
      }),
      invalidatesTags: (_result, _error, { eventId }) => [
        { type: "AttendeeExports", id: eventId },
      ],
    }),

    getAttendeeExport: builder.query<SingleResponse<AttendeeExport>, string>({
      query: (exportId) => `/attendee_exports/${exportId}`,
      providesTags: (_result, _error, exportId) => [{ type: "AttendeeExports", id: exportId }],
    }),

    authorizeAttendeeExportDownload: builder.mutation<
      SingleResponse<{ token?: string; download_url?: string; [key: string]: unknown }>,
      { exportId: string; payload?: AuthorizeDownloadPayload }
    >({
      query: ({ exportId, payload }) => ({
        url: `/attendee_exports/${exportId}/download_authorizations`,
        method: "POST",
        body: payload ?? { proof: "organizer_session" },
      }),
    }),

    // ── Scanner Devices ──
    listScannerDevices: builder.query<
      SingleResponse<ScannerDevice[]> | PaginatedResponse<ScannerDevice>,
      string
    >({
      query: (organizationId) => `/organizations/${organizationId}/scanner_devices`,
      providesTags: (_result, _error, organizationId) => [
        { type: "ScannerDevices", id: organizationId },
      ],
    }),

    rotateScannerToken: builder.mutation<
      SingleResponse<{ scanner_device: ScannerDevice; token: string }>,
      { deviceId: string; organizationId?: string }
    >({
      query: ({ deviceId }) => ({
        url: `/scanner_devices/${deviceId}/rotate_token`,
        method: "POST",
        headers: {
          "Idempotency-Key": crypto.randomUUID(),
        },
      }),
      invalidatesTags: (_result, _error, { organizationId }) =>
        organizationId ? [{ type: "ScannerDevices", id: organizationId }] : [{ type: "ScannerDevices" }],
    }),

    revokeScannerDevice: builder.mutation<
      SingleResponse<ScannerDevice>,
      { deviceId: string; reason: string; organizationId?: string }
    >({
      query: ({ deviceId, reason }) => ({
        url: `/scanner_devices/${deviceId}/revoke`,
        method: "POST",
        headers: {
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: { reason },
      }),
      invalidatesTags: (_result, _error, { organizationId }) =>
        organizationId ? [{ type: "ScannerDevices", id: organizationId }] : [{ type: "ScannerDevices" }],
    }),

    // ── Registrations & Attendee Management ──
    getRegistration: builder.query<SingleResponse<Registration>, string>({
      query: (registrationId) => `/registrations/${registrationId}`,
      providesTags: (_result, _error, id) => [{ type: "Registrations", id }],
    }),

    approveRegistration: builder.mutation<SingleResponse<Registration>, string>({
      query: (registrationId) => ({
        url: `/registrations/${registrationId}/approve`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [{ type: "Registrations", id }],
    }),

    rejectRegistration: builder.mutation<
      SingleResponse<Registration>,
      { registrationId: string; reason?: string }
    >({
      query: ({ registrationId, reason }) => ({
        url: `/registrations/${registrationId}/reject`,
        method: "POST",
        body: reason ? { reason } : {},
      }),
      invalidatesTags: (_result, _error, { registrationId }) => [
        { type: "Registrations", id: registrationId },
      ],
    }),

    reconsiderRegistration: builder.mutation<SingleResponse<Registration>, string>({
      query: (registrationId) => ({
        url: `/registrations/${registrationId}/reconsider`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [{ type: "Registrations", id }],
    }),

    releaseRegistration: builder.mutation<SingleResponse<Registration>, string>({
      query: (registrationId) => ({
        url: `/registrations/${registrationId}/release`,
        method: "POST",
        headers: {
          "Idempotency-Key": crypto.randomUUID(),
        },
      }),
      invalidatesTags: (_result, _error, id) => [{ type: "Registrations", id }],
    }),
  }),
})

// ─────────────────────────────────────────────────────────────────────────────
// Export Hooks
// ─────────────────────────────────────────────────────────────────────────────

export const {
  useIssueComplimentaryTicketMutation,
  useRequestAttendeeExportMutation,
  useGetAttendeeExportQuery,
  useAuthorizeAttendeeExportDownloadMutation,
  useListScannerDevicesQuery,
  useRotateScannerTokenMutation,
  useRevokeScannerDeviceMutation,
  useGetRegistrationQuery,
  useApproveRegistrationMutation,
  useRejectRegistrationMutation,
  useReconsiderRegistrationMutation,
  useReleaseRegistrationMutation,
} = attendeesApi
