import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQueryWithReauth } from "../api"

export type FeeComponentAmount = {
  currency?: string
  fixed_amount_minor?: number
  minimum_minor?: number
  maximum_minor?: number
}

export type FeeComponentTier = {
  position?: number
  metric_type?: string
  window_type?: string
  currency?: string
  starts_at_value?: number
  rate_bps?: number
  fixed_amount_minor?: number
  minimum_minor?: number
  maximum_minor?: number
}

export interface FeeAmount {
  currency: string
  fixed_amount_minor: number
  minimum_minor: number | null
  maximum_minor: number | null
}

export interface FeeTier {
  position: number
  metric_type: string
  window_type: string
  currency: string
  starts_at_value: number
  rate_bps: number
}

export type FeeComponent = {
  id?: string
  fee_component_id?: string
  label?: string
  component_type: string
  calculation_type: string
  charged_to: "buyer" | "organizer"
  organizer_payer_choice?: string
  funded_by?: string
  basis_type?: string
  rate_bps: number
  refund_policy?: string
  event_product_id?: string
  product_type?: string
  sale_context?: string
  provider?: string
  sales_channel?: string
  currency?: string
  amounts?: FeeComponentAmount[] | FeeAmount[]
  tiers?: FeeComponentTier[] | FeeTier[]
}

export interface FeeScheduleVersion {
  id: string
  fee_schedule_id: string
  supersedes_version_id?: string | null
  status: string
  acceptance_policy?: string | null
  grandfather_until?: string | null
  effective_from?: string | null
  effective_until?: string | null
  legal_document_version_id?: string | null
  fee_components?: FeeComponent[]
  components?: FeeComponent[]
  created_at: string
  updated_at: string
}

export interface CommercialTermsVersion {
  id: string
  status: string
  effective_from: string | null
  effective_until: string | null
  acceptance_policy: string
  legal_document_version_id: string | null
  components: FeeComponent[]
}

export interface OrganizationTermsData {
  organization_id: string
  current_terms: CommercialTermsVersion | null
  scheduled_terms: CommercialTermsVersion | null
  acceptance_history?: unknown[]
  event_exceptions?: unknown[]
}

export interface EventPayerSelection {
  id: string
  event_id: string
  fee_component_id: string
  charged_to: "buyer" | "organizer"
  selected_at?: string
  selected_by_id?: string
  created_at?: string
  updated_at?: string
  fee_component?: {
    id: string
    label: string
    component_type: string
    calculation_type: string
    rate_bps: number
    charged_to: "buyer" | "organizer" | string
  }
}

export interface SetEventPayerSelectionPayload {
  fee_component_id: string
  charged_to: "buyer" | "organizer"
}

export interface FeeSchedule {
  id: string
  name: string
  code: string
  schedule_type: string
  fee_schedule_versions?: FeeScheduleVersion[]
  created_at: string
  updated_at: string
}

export interface CommercialProgram {
  id: string
  fee_schedule_id: string
  program_type: string
  enrollment_mode?: string
  starts_at?: string | null
  ends_at?: string | null
  per_organization_use_limit?: number | null
  active?: boolean
  created_at: string
  updated_at: string
}

export interface CommercialAssignment {
  id: string
  organization_id: string
  event_id?: string | null
  fee_schedule_version_id: string
  program_id?: string | null
  assignment_type: string
  status: string
  reason?: string | null
  effective_from?: string | null
  effective_until?: string | null
  created_at: string
  updated_at: string
}

export interface SubsidyBudget {
  id: string
  assignment_id?: string | null
  program_id?: string | null
  fee_component_id?: string | null
  currency: string
  limit_minor: number
  created_at: string
  updated_at: string
}

export interface Simulation {
  id: string
  fee_schedule_version_id: string
  assignment_id?: string | null
  digest?: string | null
  created_at: string
  updated_at: string
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

interface SingleResponse<T> {
  success: boolean
  data: T
  message?: string
}

interface ArrayResponse<T> {
  success: boolean
  message?: string
  data: T[]
}

interface ListParams {
  page?: number
  per_page?: number
  order_by?: string
  order_direction?: "asc" | "desc"
}

export const commercialApi = createApi({
  reducerPath: "commercialApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "FeeSchedules",
    "FeeScheduleVersions",
    "Programs",
    "Assignments",
    "SubsidyBudgets",
    "Simulations",
    "CommercialTerms",
    "EventPayerSelections",
  ],
  endpoints: (builder) => ({
    // ── Organizer Commercial Endpoints ────────────────────────────────────
    getOrganizationTerms: builder.query<
      SingleResponse<OrganizationTermsData>,
      { organizationId: string }
    >({
      query: ({ organizationId }) => ({
        url: `/commercial/organizations/${organizationId}/terms`,
      }),
      providesTags: (_res, _err, { organizationId }) => [
        { type: "CommercialTerms", id: organizationId },
      ],
    }),

    listEventPayerSelections: builder.query<
      ArrayResponse<EventPayerSelection>,
      { eventId: string }
    >({
      query: ({ eventId }) => ({
        url: `/commercial/events/${eventId}/event_payer_selections`,
      }),
      providesTags: (_res, _err, { eventId }) => [
        { type: "EventPayerSelections", id: `LIST-${eventId}` },
      ],
    }),

    getEventPayerSelection: builder.query<
      SingleResponse<EventPayerSelection>,
      { eventId: string; selectionId: string }
    >({
      query: ({ eventId, selectionId }) => ({
        url: `/commercial/events/${eventId}/event_payer_selections/${selectionId}`,
      }),
      providesTags: (_res, _err, { selectionId }) => [
        { type: "EventPayerSelections", id: selectionId },
      ],
    }),

    setEventPayerSelection: builder.mutation<
      SingleResponse<EventPayerSelection>,
      {
        eventId: string
        selection: SetEventPayerSelectionPayload
        idempotencyKey?: string
      }
    >({
      query: ({ eventId, selection, idempotencyKey }) => {
        const key =
          idempotencyKey ||
          (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`)
        return {
          url: `/commercial/events/${eventId}/event_payer_selections`,
          method: "POST",
          headers: {
            "Idempotency-Key": key,
          },
          body: {
            event_payer_selection: selection,
          },
        }
      },
      invalidatesTags: (_res, _err, { eventId }) => [
        { type: "EventPayerSelections", id: `LIST-${eventId}` },
      ],
    }),

    // ── Admin Fee Schedules ────────────────────────────────────────────────
    listFeeSchedules: builder.query<PaginatedResponse<FeeSchedule>, ListParams | void>({
      query: (params) => ({
        url: "/admin/commercial/fee_schedules",
        params: params ?? undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "FeeSchedules" as const, id })),
              { type: "FeeSchedules", id: "LIST" },
            ]
          : [{ type: "FeeSchedules", id: "LIST" }],
    }),
    createFeeSchedule: builder.mutation<
      SingleResponse<FeeSchedule>,
      { body: { fee_schedule: { name: string; code: string; schedule_type: string } }; idempotencyKey?: string }
    >({
      query: ({ body, idempotencyKey }) => ({
        url: "/admin/commercial/fee_schedules",
        method: "POST",
        body,
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      }),
      invalidatesTags: [{ type: "FeeSchedules", id: "LIST" }],
    }),
    updateFeeSchedule: builder.mutation<
      SingleResponse<FeeSchedule>,
      {
        id: string
        body: { fee_schedule: { name?: string; code?: string; schedule_type?: string } }
        idempotencyKey?: string
      }
    >({
      query: ({ id, body, idempotencyKey }) => ({
        url: `/admin/commercial/fee_schedules/${id}`,
        method: "PATCH",
        body,
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "FeeSchedules", id }],
    }),

    // ── Admin Fee Schedule Versions ────────────────────────────────────────
    listFeeScheduleVersions: builder.query<PaginatedResponse<FeeScheduleVersion>, { feeScheduleId?: string } | void>({
      query: (params) => ({
        url: "/admin/commercial/fee_schedule_versions",
        params: params && params.feeScheduleId ? { fee_schedule_id: params.feeScheduleId } : undefined,
      }),
      providesTags: (result) =>
        result
          ? [...result.data.map(({ id }) => ({ type: "FeeScheduleVersions" as const, id }))]
          : [],
    }),
    getFeeScheduleVersion: builder.query<SingleResponse<FeeScheduleVersion>, string>({
      query: (id) => `/admin/commercial/fee_schedule_versions/${id}`,
      providesTags: (_result, _error, id) => [{ type: "FeeScheduleVersions", id }],
    }),
    createFeeScheduleVersion: builder.mutation<
      SingleResponse<FeeScheduleVersion>,
      {
        body: {
          fee_schedule_version: {
            fee_schedule_id?: string
            supersedes_version_id?: string
            acceptance_policy?: string
            grandfather_until?: string
            effective_from?: string
            effective_until?: string
            legal_document_version_id?: string
            components?: FeeComponent[]
          }
        }
        idempotencyKey?: string
      }
    >({
      query: ({ body, idempotencyKey }) => ({
        url: "/admin/commercial/fee_schedule_versions",
        method: "POST",
        body,
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      }),
      invalidatesTags: [{ type: "FeeScheduleVersions", id: "LIST" }],
    }),
    updateFeeScheduleVersion: builder.mutation<
      SingleResponse<FeeScheduleVersion>,
      { id: string; body: { fee_schedule_version: Partial<FeeScheduleVersion> & { components?: FeeComponent[] } }; idempotencyKey?: string }
    >({
      query: ({ id, body, idempotencyKey }) => ({
        url: `/admin/commercial/fee_schedule_versions/${id}`,
        method: "PATCH",
        body,
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "FeeScheduleVersions", id }],
    }),
    submitFeeScheduleVersion: builder.mutation<
      SingleResponse<FeeScheduleVersion>,
      { id: string; idempotencyKey?: string }
    >({
      query: ({ id, idempotencyKey }) => ({
        url: `/admin/commercial/fee_schedule_versions/${id}/submit`,
        method: "POST",
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "FeeScheduleVersions", id }],
    }),
    approveFeeScheduleVersion: builder.mutation<
      SingleResponse<FeeScheduleVersion>,
      { id: string; reason?: string; breakGlass?: boolean; idempotencyKey?: string }
    >({
      query: ({ id, reason, breakGlass, idempotencyKey }) => ({
        url: `/admin/commercial/fee_schedule_versions/${id}/approve`,
        method: "POST",
        params: { reason: reason ?? undefined, break_glass: breakGlass ?? undefined },
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "FeeScheduleVersions", id }],
    }),
    rejectFeeScheduleVersion: builder.mutation<
      SingleResponse<FeeScheduleVersion>,
      { id: string; reason?: string; idempotencyKey?: string }
    >({
      query: ({ id, reason, idempotencyKey }) => ({
        url: `/admin/commercial/fee_schedule_versions/${id}/reject`,
        method: "POST",
        params: reason ? { reason } : undefined,
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "FeeScheduleVersions", id }],
    }),
    scheduleFeeScheduleVersion: builder.mutation<
      SingleResponse<FeeScheduleVersion>,
      { id: string; reason?: string; breakGlass?: boolean; idempotencyKey?: string }
    >({
      query: ({ id, reason, breakGlass, idempotencyKey }) => ({
        url: `/admin/commercial/fee_schedule_versions/${id}/schedule`,
        method: "POST",
        params: { reason: reason ?? undefined, break_glass: breakGlass ?? undefined },
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "FeeScheduleVersions", id }],
    }),
    activateFeeScheduleVersion: builder.mutation<
      SingleResponse<FeeScheduleVersion>,
      { id: string; reason?: string; breakGlass?: boolean; idempotencyKey?: string }
    >({
      query: ({ id, reason, breakGlass, idempotencyKey }) => ({
        url: `/admin/commercial/fee_schedule_versions/${id}/activate`,
        method: "POST",
        params: { reason: reason ?? undefined, break_glass: breakGlass ?? undefined },
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "FeeScheduleVersions", id }],
    }),
    terminateFeeScheduleVersion: builder.mutation<
      SingleResponse<FeeScheduleVersion>,
      { id: string; reason?: string; breakGlass?: boolean; idempotencyKey?: string }
    >({
      query: ({ id, reason, breakGlass, idempotencyKey }) => ({
        url: `/admin/commercial/fee_schedule_versions/${id}/terminate`,
        method: "POST",
        params: { reason: reason ?? undefined, break_glass: breakGlass ?? undefined },
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "FeeScheduleVersions", id }],
    }),

    // ── Admin Programs ─────────────────────────────────────────────────────
    listPrograms: builder.query<PaginatedResponse<CommercialProgram>, ListParams | void>({
      query: (params) => ({
        url: "/admin/commercial/programs",
        params: params ?? undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "Programs" as const, id })),
              { type: "Programs", id: "LIST" },
            ]
          : [{ type: "Programs", id: "LIST" }],
    }),
    createProgram: builder.mutation<
      SingleResponse<CommercialProgram>,
      {
        body: {
          program: {
            fee_schedule_id: string
            program_type: string
            enrollment_mode?: string
            starts_at?: string
            ends_at?: string
            per_organization_use_limit?: number
            active?: boolean
          }
        }
        idempotencyKey?: string
      }
    >({
      query: ({ body, idempotencyKey }) => ({
        url: "/admin/commercial/programs",
        method: "POST",
        body,
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      }),
      invalidatesTags: [{ type: "Programs", id: "LIST" }],
    }),
    updateProgram: builder.mutation<
      SingleResponse<CommercialProgram>,
      { id: string; body: { program: Partial<CommercialProgram> }; idempotencyKey?: string }
    >({
      query: ({ id, body, idempotencyKey }) => ({
        url: `/admin/commercial/programs/${id}`,
        method: "PATCH",
        body,
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Programs", id }],
    }),

    // ── Admin Assignments ──────────────────────────────────────────────────
    listAssignments: builder.query<PaginatedResponse<CommercialAssignment>, ListParams | void>({
      query: (params) => ({
        url: "/admin/commercial/assignments",
        params: params ?? undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "Assignments" as const, id })),
              { type: "Assignments", id: "LIST" },
            ]
          : [{ type: "Assignments", id: "LIST" }],
    }),
    getAssignment: builder.query<SingleResponse<CommercialAssignment>, string>({
      query: (id) => `/admin/commercial/assignments/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Assignments", id }],
    }),
    createAssignment: builder.mutation<
      SingleResponse<CommercialAssignment>,
      {
        body: {
          assignment: {
            organization_id: string
            event_id?: string
            fee_schedule_version_id: string
            program_id?: string
            assignment_type: string
            reason?: string
            effective_from?: string
            effective_until?: string
            baseline_resolution_digest?: string
          }
        }
        idempotencyKey?: string
      }
    >({
      query: ({ body, idempotencyKey }) => ({
        url: "/admin/commercial/assignments",
        method: "POST",
        body,
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      }),
      invalidatesTags: [{ type: "Assignments", id: "LIST" }],
    }),
    submitAssignment: builder.mutation<
      SingleResponse<CommercialAssignment>,
      { id: string; idempotencyKey?: string }
    >({
      query: ({ id, idempotencyKey }) => ({
        url: `/admin/commercial/assignments/${id}/submit`,
        method: "POST",
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Assignments", id }],
    }),
    approveAssignment: builder.mutation<
      SingleResponse<CommercialAssignment>,
      { id: string; reason?: string; breakGlass?: boolean; idempotencyKey?: string }
    >({
      query: ({ id, reason, breakGlass, idempotencyKey }) => ({
        url: `/admin/commercial/assignments/${id}/approve`,
        method: "POST",
        params: { reason: reason ?? undefined, break_glass: breakGlass ?? undefined },
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Assignments", id }],
    }),
    rejectAssignment: builder.mutation<
      SingleResponse<CommercialAssignment>,
      { id: string; reason?: string; idempotencyKey?: string }
    >({
      query: ({ id, reason, idempotencyKey }) => ({
        url: `/admin/commercial/assignments/${id}/reject`,
        method: "POST",
        params: reason ? { reason } : undefined,
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Assignments", id }],
    }),
    activateAssignment: builder.mutation<
      SingleResponse<CommercialAssignment>,
      { id: string; reason?: string; breakGlass?: boolean; idempotencyKey?: string }
    >({
      query: ({ id, reason, breakGlass, idempotencyKey }) => ({
        url: `/admin/commercial/assignments/${id}/activate`,
        method: "POST",
        params: { reason: reason ?? undefined, break_glass: breakGlass ?? undefined },
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Assignments", id }],
    }),
    terminateAssignment: builder.mutation<
      SingleResponse<CommercialAssignment>,
      { id: string; reason?: string; breakGlass?: boolean; idempotencyKey?: string }
    >({
      query: ({ id, reason, breakGlass, idempotencyKey }) => ({
        url: `/admin/commercial/assignments/${id}/terminate`,
        method: "POST",
        params: { reason: reason ?? undefined, break_glass: breakGlass ?? undefined },
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Assignments", id }],
    }),

    // ── Admin Subsidy Budgets ──────────────────────────────────────────────
    listSubsidyBudgets: builder.query<PaginatedResponse<SubsidyBudget>, ListParams | void>({
      query: (params) => ({
        url: "/admin/commercial/subsidy_budgets",
        params: params ?? undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "SubsidyBudgets" as const, id })),
              { type: "SubsidyBudgets", id: "LIST" },
            ]
          : [{ type: "SubsidyBudgets", id: "LIST" }],
    }),
    createSubsidyBudget: builder.mutation<
      SingleResponse<SubsidyBudget>,
      {
        body: {
          subsidy_budget: {
            assignment_id?: string
            program_id?: string
            fee_component_id?: string
            currency: string
            limit_minor: number
          }
        }
        idempotencyKey?: string
      }
    >({
      query: ({ body, idempotencyKey }) => ({
        url: "/admin/commercial/subsidy_budgets",
        method: "POST",
        body,
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      }),
      invalidatesTags: [{ type: "SubsidyBudgets", id: "LIST" }],
    }),
    updateSubsidyBudget: builder.mutation<
      SingleResponse<SubsidyBudget>,
      { id: string; body: { subsidy_budget: Partial<SubsidyBudget> }; idempotencyKey?: string }
    >({
      query: ({ id, body, idempotencyKey }) => ({
        url: `/admin/commercial/subsidy_budgets/${id}`,
        method: "PATCH",
        body,
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "SubsidyBudgets", id }],
    }),

    // ── Admin Simulations ──────────────────────────────────────────────────
    listSimulations: builder.query<PaginatedResponse<Simulation>, ListParams | void>({
      query: (params) => ({
        url: "/admin/commercial/simulations",
        params: params ?? undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "Simulations" as const, id })),
              { type: "Simulations", id: "LIST" },
            ]
          : [{ type: "Simulations", id: "LIST" }],
    }),
    getSimulation: builder.query<SingleResponse<Simulation>, string>({
      query: (id) => `/admin/commercial/simulations/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Simulations", id }],
    }),
    createSimulation: builder.mutation<
      SingleResponse<Simulation>,
      {
        body: {
          simulation: { fee_schedule_version_id: string; assignment_id?: string; scenario?: Record<string, unknown> }
        }
        idempotencyKey?: string
      }
    >({
      query: ({ body, idempotencyKey }) => ({
        url: "/admin/commercial/simulations",
        method: "POST",
        body,
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      }),
      invalidatesTags: [{ type: "Simulations", id: "LIST" }],
    }),
  }),
})

export const {
  // Organizer hooks
  useGetOrganizationTermsQuery,
  useListEventPayerSelectionsQuery,
  useGetEventPayerSelectionQuery,
  useSetEventPayerSelectionMutation,

  // Admin hooks
  useListFeeSchedulesQuery,
  useCreateFeeScheduleMutation,
  useUpdateFeeScheduleMutation,
  useListFeeScheduleVersionsQuery,
  useGetFeeScheduleVersionQuery,
  useCreateFeeScheduleVersionMutation,
  useUpdateFeeScheduleVersionMutation,
  useSubmitFeeScheduleVersionMutation,
  useApproveFeeScheduleVersionMutation,
  useRejectFeeScheduleVersionMutation,
  useScheduleFeeScheduleVersionMutation,
  useActivateFeeScheduleVersionMutation,
  useTerminateFeeScheduleVersionMutation,
  useListProgramsQuery,
  useCreateProgramMutation,
  useUpdateProgramMutation,
  useListAssignmentsQuery,
  useGetAssignmentQuery,
  useCreateAssignmentMutation,
  useSubmitAssignmentMutation,
  useApproveAssignmentMutation,
  useRejectAssignmentMutation,
  useActivateAssignmentMutation,
  useTerminateAssignmentMutation,
  useListSubsidyBudgetsQuery,
  useCreateSubsidyBudgetMutation,
  useUpdateSubsidyBudgetMutation,
  useListSimulationsQuery,
  useGetSimulationQuery,
  useCreateSimulationMutation,
} = commercialApi
