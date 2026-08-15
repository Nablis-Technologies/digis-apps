"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  File01Icon,
  CheckmarkCircle01Icon,
  SquareIcon,
  Edit01Icon,
  Delete01Icon,
  PlusSignCircleIcon,
  RefreshIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { toastSuccess, toastError } from "@/lib/toast"
import { DataTable, type Column, type SortConfig } from "@/components/ui/data-table"
import { StatsCard } from "@/components/dashboard/stats-card"
import { ConfirmDialog } from "@/components/forms/confirm-dialog"
import { LegalDocumentDialog } from "@/components/forms/legal-document-dialog"
import {
  useListLegalDocumentsQuery,
  useDeleteLegalDocumentMutation,
  type LegalDocument,
} from "@/store/reducers/legalApi"

export default function LegalDocumentsPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "created_at", direction: "desc" })

  const { data, isLoading, isFetching, refetch } = useListLegalDocumentsQuery({
    page,
    per_page: 10,
    order_by: sortConfig.key,
    order_direction: sortConfig.direction,
  })

  const [deleteLegal] = useDeleteLegalDocumentMutation()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<LegalDocument | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmItem, setConfirmItem] = useState<LegalDocument | null>(null)
  const [confirmSubmitting, setConfirmSubmitting] = useState(false)

  const docs = data?.data ?? []
  const pagination = data?.pagination
  const total = pagination?.total_count ?? 0
  const totalPages = pagination?.total_pages ?? 1
  const perPage = pagination?.per_page ?? 10

  const stats = {
    total,
    active: docs.filter((d) => d.active).length,
    inactive: docs.filter((d) => !d.active).length,
  }

  const columns: Column<LegalDocument>[] = [
    {
      header: "Name",
      accessorKey: "internal_name",
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-medium text-foreground">{row.internal_name}</p>
          <p className="text-xs text-muted-foreground">{row.document_type}</p>
        </div>
      ),
    },
    { header: "Jurisdiction", accessorKey: "jurisdiction_code", cell: (row) => <span className="text-sm font-mono">{row.jurisdiction_code}</span> },
    { header: "Locale", accessorKey: "locale", cell: (row) => <span className="text-sm">{row.locale}</span>, hideOnMobile: true },
    {
      header: "Status",
      accessorKey: "active",
      cell: (row) => (
        <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", row.active ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-zinc-50 text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-500")}>
          {row.active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      header: "Versions",
      cell: (row) => <span className="text-sm">{row.versions?.length ?? 0}</span>,
      hideOnMobile: true,
    },
    {
      header: "Created",
      accessorKey: "created_at",
      sortable: true,
      className: "text-muted-foreground",
      hideOnMobile: true,
      cell: (row) => row.created_at ? new Date(row.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—",
    },
  ]

  async function handleDelete() {
    if (!confirmItem) return
    setConfirmSubmitting(true)
    try {
      await deleteLegal(confirmItem.id).unwrap()
      toastSuccess("Legal document deleted.")
      setConfirmOpen(false)
      setConfirmItem(null)
    } catch (err) {
      toastError(err, "Failed to delete legal document.")
      // stay open to retry
    } finally {
      setConfirmSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Legal Documents</h1>
          <p className="text-sm text-muted-foreground">Manage platform legal documents and versions</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => refetch()} className="inline-flex items-center gap-2 rounded-lg border border-border/50 bg-card px-4 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-accent">
            <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className="size-4" />Refresh
          </button>
          <button type="button" onClick={() => { setEditing(null); setDialogOpen(true) }} className="inline-flex items-center gap-2 rounded-lg bg-lime-500 px-4 py-2 text-sm font-medium text-white shadow-xs transition-colors hover:bg-lime-600">
            <HugeiconsIcon icon={PlusSignCircleIcon} strokeWidth={2} className="size-4" />Create Document
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard title="Total Documents" value={stats.total} icon={File01Icon} sparklineData={[3, 4, 5, 5, 6, 7, stats.total]} sparklineColor="var(--chart-1)" />
        <StatsCard title="Active" value={stats.active} icon={CheckmarkCircle01Icon} trend={{ value: stats.total > 0 ? `${Math.round((stats.active / stats.total) * 100)}%` : "0%", positive: true }} sparklineData={[2, 3, 3, 4, 4, 5, stats.active]} sparklineColor="var(--chart-2)" />
        <StatsCard title="Inactive" value={stats.inactive} icon={SquareIcon} sparklineData={[1, 2, 2, 2, 3, 3, stats.inactive]} sparklineColor="var(--chart-3)" />
      </div>

      <DataTable
        columns={columns}
        data={docs}
        keyExtractor={(row) => row.id}
        isLoading={isLoading || isFetching}
        sortConfig={sortConfig}
        onSort={(cfg) => { setSortConfig(cfg); setPage(1) }}
        pagination={{ page, perPage, total, totalPages }}
        onPageChange={setPage}
        onRowClick={(row) => router.push(`/admin/legal-documents/${row.id}`)}
        renderActions={(row) => (
          <div className="flex items-center gap-1">
            <button type="button" onClick={(e) => { e.stopPropagation(); setEditing(row); setDialogOpen(true) }} className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} className="size-4" />
            </button>
            <button type="button" onClick={(e) => { e.stopPropagation(); setConfirmItem(row); setConfirmOpen(true) }} className="flex size-8 items-center justify-center rounded-md text-destructive transition-colors hover:bg-destructive/10">
              <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} className="size-4" />
            </button>
          </div>
        )}
      />

      <LegalDocumentDialog open={dialogOpen} onOpenChange={setDialogOpen} document={editing} />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(o) => { if (!confirmSubmitting) setConfirmOpen(o) }}
        title="Delete Legal Document"
        description={`Delete legal document "${confirmItem?.internal_name}"?`}
        confirmLabel={confirmSubmitting ? "Deleting..." : "Delete"}
        onConfirm={handleDelete}
      />
    </div>
  )
}
