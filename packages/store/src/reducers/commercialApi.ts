import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQueryWithReauth } from "../api"

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

export interface FeeComponent {
  id?: string
  fee_component_id?: string
  label: string
  component_type: string
  calculation_type: string
  charged_to: "buyer" | "organizer"
  basis_type: string
  rate_bps: number
  refund_policy: string
  currency: string
  amounts?: FeeAmount[]
  tiers?: FeeTier[]
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
    charged_to: string
  }
}

export interface SetEventPayerSelectionPayload {
  fee_component_id: string
  charged_to: "buyer" | "organizer"
}

export interface SingleResponse<T> {
  success: boolean
  message?: string
  data: T
}

export interface ArrayResponse<T> {
  success: boolean
  message?: string
  data: T[]
}

export const commercialApi = createApi({
  reducerPath: "commercialApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["CommercialTerms", "EventPayerSelections"],
  endpoints: (builder) => ({
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
  }),
})

export const {
  useGetOrganizationTermsQuery,
  useListEventPayerSelectionsQuery,
  useGetEventPayerSelectionQuery,
  useSetEventPayerSelectionMutation,
} = commercialApi
