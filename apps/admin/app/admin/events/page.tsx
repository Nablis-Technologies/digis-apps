"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar01Icon,
  CheckmarkCircle01Icon,
  File01Icon,
  Edit01Icon,
  Delete01Icon,
  PlusSignCircleIcon,
  RefreshIcon,
  EyeIcon,
  EyeClosedIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { toastSuccess, toastError } from "@/lib/toast"
import { DataTable, type Column, type SortConfig } from "@/components/ui/data-table"
import { StatsCard } from "@/components/dashboard/stats-card"
import { ConfirmDialog } from "@/components/forms/confirm-dialog"
import { EventDialog } from "@/components/forms/event-dialog"
import {
  useListEventsQuery,
  useDeleteEventMutation,
  usePublishEventMutation,
  useUnpublishEventMutation,
  type Event,
} from "@/store/reducers/eventsApi"

const statusConfig: Record<string, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "bg-zinc-50 text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-500" },
  published: { label: "Published", cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" },
  cancelled: { label: "Cancelled", cls: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400" },
}

function StatusBadge({ status }: { status: string }) {
  const s = statusConfig[status] ?? statusConfig.draft
  return <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", s.cls)}>{s.label}</span>
}

export default function EventsPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "created_at", direction: "desc" })

  const { data, isLoading, isFetching, refetch } = useListEventsQuery({
    page,
    per_page: 10,
    order_by: sortConfig.key,
    order_direction: sortConfig.direction,
  })

  const [deleteEvent] = useDeleteEventMutation()
  const [publishEvent] = usePublishEventMutation()
  const [unpublishEvent] = useUnpublishEventMutation()

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmItem, setConfirmItem] = useState<Event | null>(null)
  const [confirmSubmitting, setConfirmSubmitting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Event | null>(null)

  const events = data?.data ?? []
  const pagination = data?.pagination
  const total = pagination?.total_count ?? 0
  const totalPages = pagination?.total_pages ?? 1
  const perPage = pagination?.per_page ?? 10

  const stats = {
    total,
    published: events.filter((e) => e.status === "published").length,
    draft: events.filter((e) => e.status === "draft").length,
    cancelled: events.filter((e) => e.status === "cancelled").length,
  }

  const columns: Column<Event>[] = [
    {
      header: "Title",
      accessorKey: "title",
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-medium text-foreground">{row.title}</p>
          {row.description && <p className="text-xs text-muted-foreground max-w-64 truncate">{row.description}</p>}
        </div>
      ),
    },
    {
      header: "Organization",
      cell: (row) => <span className="text-sm">{row.organization?.name ?? "—"}</span>,
      hideOnMobile: true,
    },
    { header: "Status", accessorKey: "status", sortable: true, cell: (row) => <StatusBadge status={row.status} /> },
    { header: "Visibility", accessorKey: "visibility", cell: (row) => <span className="capitalize text-sm">{row.visibility}</span>, hideOnMobile: true },
    { header: "Currency", accessorKey: "currency", cell: (row) => <span className="text-sm">{row.currency}</span>, hideOnMobile: true },
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
      await deleteEvent(confirmItem.id).unwrap()
      toastSuccess("Event deleted.")
      setConfirmOpen(false)
      setConfirmItem(null)
    } catch (err) {
      toastError(err, "Failed to delete event.")
      // stay open to retry
    } finally {
      setConfirmSubmitting(false)
    }
  }

  async function togglePublish(event: Event) {
    try {
      if (event.status === "published") {
        await unpublishEvent(event.id).unwrap()
        toastSuccess("Event unpublished.")
      } else if (event.status === "draft") {
        await publishEvent(event.id).unwrap()
        toastSuccess("Event published.")
      }
    } catch (err) {
      toastError(err, "Failed to publish event.")
      // ignore — tag invalidation will refetch
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Events</h1>
          <p className="text-sm text-muted-foreground">Manage all platform events</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => refetch()} className="inline-flex items-center gap-2 rounded-lg border border-border/50 bg-card px-4 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-accent">
            <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className="size-4" />Refresh
          </button>
          <button type="button" onClick={() => { setEditing(null); setDialogOpen(true) }} className="inline-flex items-center gap-2 rounded-lg bg-lime-500 px-4 py-2 text-sm font-medium text-white shadow-xs transition-colors hover:bg-lime-600">
            <HugeiconsIcon icon={PlusSignCircleIcon} strokeWidth={2} className="size-4" />Create Event
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Events" value={stats.total} icon={Calendar01Icon} sparklineData={[5, 8, 7, 10, 12, 11, stats.total]} sparklineColor="var(--chart-1)" />
        <StatsCard title="Published" value={stats.published} icon={CheckmarkCircle01Icon} trend={{ value: stats.total > 0 ? `${Math.round((stats.published / stats.total) * 100)}%` : "0%", positive: true }} sparklineData={[4, 5, 6, 7, 8, 9, stats.published]} sparklineColor="var(--chart-2)" />
        <StatsCard title="Draft" value={stats.draft} icon={File01Icon} sparklineData={[3, 2, 3, 4, 3, 4, stats.draft]} sparklineColor="var(--chart-3)" />
        <StatsCard title="Cancelled" value={stats.cancelled} icon={Delete01Icon} sparklineData={[1, 2, 1, 1, 2, 1, stats.cancelled]} sparklineColor="var(--chart-4)" />
      </div>

      <DataTable
        columns={columns}
        data={events}
        keyExtractor={(row) => row.id}
        isLoading={isLoading || isFetching}
        sortConfig={sortConfig}
        onSort={(cfg) => { setSortConfig(cfg); setPage(1) }}
        pagination={{ page, perPage, total, totalPages }}
        onPageChange={setPage}
        onRowClick={(row) => router.push(`/admin/events/${row.id}`)}
        renderActions={(row) => (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); togglePublish(row) }}
              disabled={row.status === "cancelled"}
              className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              title={row.status === "published" ? "Unpublish" : "Publish"}
            >
              <HugeiconsIcon icon={row.status === "published" ? EyeClosedIcon : EyeIcon} strokeWidth={2} className="size-4" />
            </button>
            <button type="button" onClick={(e) => { e.stopPropagation(); setEditing(row); setDialogOpen(true) }} className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} className="size-4" />
            </button>
            <button type="button" onClick={(e) => { e.stopPropagation(); setConfirmItem(row); setConfirmOpen(true) }} className="flex size-8 items-center justify-center rounded-md text-destructive transition-colors hover:bg-destructive/10">
              <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} className="size-4" />
            </button>
          </div>
        )}
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(o) => { if (!confirmSubmitting) setConfirmOpen(o) }}
        title="Delete Event"
        description={`Delete event "${confirmItem?.title}"? This action cannot be undone.`}
        confirmLabel={confirmSubmitting ? "Deleting..." : "Delete"}
        onConfirm={handleDelete}
      />
      <EventDialog open={dialogOpen} onOpenChange={setDialogOpen} event={editing} />
    </div>
  )
}
