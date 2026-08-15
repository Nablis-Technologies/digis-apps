"use client"

import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { Calendar01Icon } from "@hugeicons/core-free-icons"
import { cn } from "@workspace/ui/lib/utils"
import { DataTable, type Column } from "@workspace/ui/components/data-table"
import { useListEventsQuery, type Event } from "@workspace/store/reducers/eventsApi"

const statusConfig: Record<string, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "bg-zinc-50 text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-500" },
  published: { label: "Published", cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" },
  cancelled: { label: "Cancelled", cls: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400" },
  completed: { label: "Completed", cls: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400" },
}

export function EventsTab() {
  const router = useRouter()
  const { data, isLoading, isFetching } = useListEventsQuery({
    page: 1,
    per_page: 10,
    order_by: "created_at",
    order_direction: "desc",
  })
  const events = data?.data ?? []

  const columns: Column<Event>[] = [
    {
      header: "Title",
      accessorKey: "title",
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
    {
      header: "Status",
      accessorKey: "status",
      cell: (row) => {
        const s = statusConfig[row.status] ?? statusConfig.draft
        return <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", s.cls)}>{s.label}</span>
      },
    },
    {
      header: "Created",
      accessorKey: "created_at",
      hideOnMobile: true,
      cell: (row) => row.created_at ? new Date(row.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—",
    },
  ]

  return (
    <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Events</h3>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <HugeiconsIcon icon={Calendar01Icon} strokeWidth={2} className="size-3.5" />
          Platform events
        </span>
      </div>
      {events.length === 0 && !isLoading ? (
        <p className="text-sm text-muted-foreground">No events found.</p>
      ) : (
        <DataTable
          columns={columns}
          data={events}
          keyExtractor={(row) => row.id}
          isLoading={isLoading || isFetching}
          pagination={{ page: 1, totalPages: data?.pagination?.total_pages ?? 1, total: data?.pagination?.total_count ?? events.length, perPage: data?.pagination?.per_page ?? 10 }}
          onRowClick={(row) => router.push(`/admin/events/${row.id}`)}
        />
      )}
    </div>
  )
}
