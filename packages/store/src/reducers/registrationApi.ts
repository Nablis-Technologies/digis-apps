import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQueryWithReauth } from "../api"

export interface RegistrationQuestion {
  id: string
  registration_form_version_id: string
  key: string
  type: string
  response_scope: string
  sensitivity: string
  label: string
  help_text: string | null
  required: boolean
  position: number
  options: { key: string; label: string }[] | null
  validation_rules: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface RegistrationFormVersion {
  id: string
  registration_form_id: string
  version: number
  status: "draft" | "published"
  published_by_id: string | null
  published_at: string | null
  created_at: string
  updated_at: string
  questions?: RegistrationQuestion[]
}

export interface RegistrationForm {
  id: string
  event_id: string
  ticket_type_id: string | null
  name: string
  active: boolean
  created_at: string
  updated_at: string
  versions?: RegistrationFormVersion[]
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

interface CreateRegistrationFormPayload {
  name: string
  active: boolean
  ticket_type_id?: string
}

interface UpdateRegistrationFormPayload {
  name?: string
  active?: boolean
  ticket_type_id?: string
}

interface CreateFormVersionPayload {
  version: number
  questions: {
    key: string
    type: string
    response_scope?: string
    sensitivity?: string
    label: string
    help_text?: string
    required?: boolean
    position?: number
    options?: { key: string; label: string }[]
    validation_rules?: Record<string, unknown>
  }[]
}

export const registrationApi = createApi({
  reducerPath: "registrationApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["RegistrationForms", "FormVersions"],
  endpoints: (builder) => ({
    // ── Registration Forms ──
    listRegistrationForms: builder.query<
      PaginatedResponse<RegistrationForm>,
      { eventId: string; params?: { page?: number; per_page?: number } }
    >({
      query: ({ eventId, params }) => ({
        url: `/events/${eventId}/registration_forms`,
        params,
      }),
      providesTags: (result, _error, { eventId }) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "RegistrationForms" as const, id })),
              { type: "RegistrationForms", id: `LIST-${eventId}` },
            ]
          : [{ type: "RegistrationForms", id: `LIST-${eventId}` }],
    }),
    getRegistrationForm: builder.query<SingleResponse<RegistrationForm>, { eventId: string; id: string }>({
      query: ({ eventId, id }) => `/events/${eventId}/registration_forms/${id}`,
      providesTags: (_result, _error, { id }) => [{ type: "RegistrationForms", id }],
    }),
    createRegistrationForm: builder.mutation<
      SingleResponse<RegistrationForm>,
      { eventId: string; body: CreateRegistrationFormPayload }
    >({
      query: ({ eventId, body }) => ({
        url: `/events/${eventId}/registration_forms`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { eventId }) => [
        { type: "RegistrationForms", id: `LIST-${eventId}` },
      ],
    }),
    updateRegistrationForm: builder.mutation<
      SingleResponse<RegistrationForm>,
      { eventId: string; id: string; body: UpdateRegistrationFormPayload }
    >({
      query: ({ eventId, id, body }) => ({
        url: `/events/${eventId}/registration_forms/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { eventId, id }) => [
        { type: "RegistrationForms", id },
        { type: "RegistrationForms", id: `LIST-${eventId}` },
      ],
    }),
    deleteRegistrationForm: builder.mutation<void, { eventId: string; id: string }>({
      query: ({ eventId, id }) => ({
        url: `/events/${eventId}/registration_forms/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { eventId }) => [
        { type: "RegistrationForms", id: `LIST-${eventId}` },
      ],
    }),

    // ── Form Versions ──
    listFormVersions: builder.query<
      { success: boolean; data: RegistrationFormVersion[] },
      { eventId: string; formId: string }
    >({
      query: ({ eventId, formId }) =>
        `/events/${eventId}/registration_forms/${formId}/versions`,
      providesTags: (_result, _error, { formId }) => [{ type: "FormVersions", id: formId }],
    }),
    createFormVersion: builder.mutation<
      SingleResponse<RegistrationFormVersion>,
      { eventId: string; formId: string; body: CreateFormVersionPayload }
    >({
      query: ({ eventId, formId, body }) => ({
        url: `/events/${eventId}/registration_forms/${formId}/versions`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { formId }) => [{ type: "FormVersions", id: formId }],
    }),
    publishFormVersion: builder.mutation<
      void,
      { eventId: string; formId: string; versionId: string }
    >({
      query: ({ eventId, formId, versionId }) => ({
        url: `/events/${eventId}/registration_forms/${formId}/versions/${versionId}/publish`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, { formId, versionId }) => [
        { type: "FormVersions", id: formId },
        { type: "FormVersions", id: versionId },
      ],
    }),
  }),
})

export const {
  useListRegistrationFormsQuery,
  useGetRegistrationFormQuery,
  useCreateRegistrationFormMutation,
  useUpdateRegistrationFormMutation,
  useDeleteRegistrationFormMutation,
  useListFormVersionsQuery,
  useCreateFormVersionMutation,
  usePublishFormVersionMutation,
} = registrationApi
