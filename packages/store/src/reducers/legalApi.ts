import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQueryWithReauth } from "../api"

export interface LegalDocumentVersion {
  id: string
  legal_document_id: string
  version: number
  title: string
  body: string
  content_sha256: string
  status: "draft" | "published"
  commercial_policy_reference: string | null
  published_by_id: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface LegalDocument {
  id: string
  document_type: string
  internal_name: string
  jurisdiction_code: string
  locale: string
  active: boolean
  created_by_id: string
  created_at: string
  updated_at: string
  versions?: LegalDocumentVersion[]
}

interface ListLegalParams {
  page?: number
  per_page?: number
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

interface CreateLegalDocumentPayload {
  legal_document: {
    document_type: string
    internal_name: string
    jurisdiction_code: string
    locale: string
    title?: string
    body?: string
    commercial_policy_reference?: string
  }
}

interface UpdateLegalDocumentPayload {
  legal_document: {
    document_type?: string
    internal_name?: string
    jurisdiction_code?: string
    locale?: string
    title?: string
    body?: string
    commercial_policy_reference?: string
  }
}

export const legalApi = createApi({
  reducerPath: "legalApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["LegalDocuments"],
  endpoints: (builder) => ({
    listLegalDocuments: builder.query<PaginatedResponse<LegalDocument>, ListLegalParams | void>({
      query: (params) => ({
        url: "/admin/legal_documents",
        params: params ?? undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "LegalDocuments" as const, id })),
              { type: "LegalDocuments", id: "LIST" },
            ]
          : [{ type: "LegalDocuments", id: "LIST" }],
    }),
    getLegalDocument: builder.query<SingleResponse<LegalDocument>, string>({
      query: (id) => `/admin/legal_documents/${id}`,
      providesTags: (_result, _error, id) => [{ type: "LegalDocuments", id }],
    }),
    createLegalDocument: builder.mutation<SingleResponse<LegalDocument>, CreateLegalDocumentPayload>({
      query: (body) => ({
        url: "/admin/legal_documents",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "LegalDocuments", id: "LIST" }],
    }),
    updateLegalDocument: builder.mutation<
      SingleResponse<LegalDocument>,
      { id: string; body: UpdateLegalDocumentPayload }
    >({
      query: ({ id, body }) => ({
        url: `/admin/legal_documents/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "LegalDocuments", id }],
    }),
    deleteLegalDocument: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/legal_documents/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "LegalDocuments", id: "LIST" }],
    }),
    publishLegalDocument: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/legal_documents/${id}/publish`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [{ type: "LegalDocuments", id }],
    }),
    activateLegalDocument: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/legal_documents/${id}/activate`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [{ type: "LegalDocuments", id }],
    }),
    deactivateLegalDocument: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/legal_documents/${id}/deactivate`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [{ type: "LegalDocuments", id }],
    }),
  }),
})

export const {
  useListLegalDocumentsQuery,
  useGetLegalDocumentQuery,
  useCreateLegalDocumentMutation,
  useUpdateLegalDocumentMutation,
  useDeleteLegalDocumentMutation,
  usePublishLegalDocumentMutation,
  useActivateLegalDocumentMutation,
  useDeactivateLegalDocumentMutation,
} = legalApi
