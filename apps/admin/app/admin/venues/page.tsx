"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Building01Icon,
  CheckmarkCircle01Icon,
  MapsLocation01Icon,
  StarIcon,
  MoreHorizontalIcon,
  Edit01Icon,
  Delete01Icon,
  PlusSignCircleIcon,
  RefreshIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { DataTable, type Column, type SortConfig } from "@/components/ui/data-table"
import { StatsCard } from "@/components/dashboard/stats-card"
import { ConfirmDialog } from "@/components/forms/confirm-dialog"
import { VenueDialog } from "@/components/forms/venue-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  useListVenuesQuery,
  useDeleteVenueMutation,
  type Venue,
} from "@/store/reducers/venuesApi"

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", active ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-zinc-50 text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-500")}>
      {active ? "Active" : "Inactive"}
    </span>
  )
}

function VerifiedBadge({ verified }: { verified: boolean }) {
  return (
    <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", verified ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400" : "bg-zinc-50 text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-500")}>
      {verified ? "Verified" : "Unverified"}
    </span>
  )
}

function formatCapacity(capacity: number | null) {
  if (capacity === null) return <span className="text-muted-foreground/50">&mdash;</span>
  return capacity.toLocaleString()
}

function VenueActions({ venue, onEdit, onDelete }: { venue: Venue; onEdit: (v: Venue) => void; onDelete: (v: Venue) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
          <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => onEdit(venue)}><HugeiconsIcon icon={Edit01Icon} strokeWidth={2} />Edit Venue</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(venue)}><HugeiconsIcon icon={Delete01Icon} strokeWidth={2} />Delete Venue</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function VenuesPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "name", direction: "asc" })

  const { data, isLoading, isFetching, refetch } = useListVenuesQuery({
    page,
    per_page: 10,
    order_by: sortConfig.key,
    order_direction: sortConfig.direction,
  })

  const [deleteVenue] = useDeleteVenueMutation()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Venue | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmItem, setConfirmItem] = useState<Venue | null>(null)
  const [confirmSubmitting, setConfirmSubmitting] = useState(false)

  const venues = data?.data ?? []
  const pagination = data?.pagination
  const total = pagination?.total_count ?? 0
  const totalPages = pagination?.total_pages ?? 1
  const perPage = pagination?.per_page ?? 10

  const stats = {
    total,
    active: venues.filter((v) => v.active).length,
    verified: venues.filter((v) => v.verified).length,
    totalCapacity: venues.reduce((sum, v) => sum + (v.capacity ?? 0), 0),
  }

  const columns: Column<Venue>[] = [
    {
      header: "Name",
      accessorKey: "name",
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-medium text-foreground">{row.name}</p>
          {row.description && <p className="text-xs text-muted-foreground max-w-56 truncate">{row.description}</p>}
        </div>
      ),
    },
    {
      header: "Location",
      cell: (row) => (
        <div className="text-sm">
          <p className="text-foreground">{row.city}</p>
          <p className="text-xs text-muted-foreground">{row.country}</p>
        </div>
      ),
    },
    { header: "Capacity", accessorKey: "capacity", sortable: true, className: "text-muted-foreground", hideOnMobile: true, cell: (row) => formatCapacity(row.capacity) },
    { header: "Verified", accessorKey: "verified", sortable: true, cell: (row) => <VerifiedBadge verified={row.verified} /> },
    { header: "Status", accessorKey: "active", sortable: true, cell: (row) => <ActiveBadge active={row.active} /> },
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
      await deleteVenue(confirmItem.id).unwrap()
      setConfirmOpen(false)
      setConfirmItem(null)
    } catch {
      // stay open to retry
    } finally {
      setConfirmSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Venues</h1>
          <p className="text-sm text-muted-foreground">Manage event venues and locations</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => refetch()} className="inline-flex items-center gap-2 rounded-lg border border-border/50 bg-card px-4 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-accent">
            <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className="size-4" />Refresh
          </button>
          <button type="button" onClick={() => { setEditing(null); setDialogOpen(true) }} className="inline-flex items-center gap-2 rounded-lg bg-lime-500 px-4 py-2 text-sm font-medium text-white shadow-xs transition-colors hover:bg-lime-600">
            <HugeiconsIcon icon={PlusSignCircleIcon} strokeWidth={2} className="size-4" />Create Venue
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Venues" value={stats.total} icon={Building01Icon} sparklineData={[260, 280, 300, 310, 325, 335, stats.total]} sparklineColor="var(--chart-1)" />
        <StatsCard title="Active" value={stats.active} icon={CheckmarkCircle01Icon} trend={{ value: stats.total > 0 ? `${Math.round((stats.active / stats.total) * 100)}%` : "0%", positive: true }} sparklineData={[230, 250, 260, 275, 290, 300, stats.active]} sparklineColor="var(--chart-2)" />
        <StatsCard title="Verified" value={stats.verified} icon={StarIcon} trend={{ value: stats.total > 0 ? `${Math.round((stats.verified / stats.total) * 100)}%` : "0%", positive: true }} sparklineData={[120, 140, 160, 180, 190, 200, stats.verified]} sparklineColor="var(--chart-3)" />
        <StatsCard title="Total Capacity" value={stats.totalCapacity.toLocaleString()} icon={MapsLocation01Icon} sparklineData={[45000, 52000, 58000, 62000, 68000, 72000, stats.totalCapacity]} sparklineColor="var(--chart-4)" />
      </div>

      <DataTable
        columns={columns}
        data={venues}
        keyExtractor={(row) => row.id}
        isLoading={isLoading || isFetching}
        sortConfig={sortConfig}
        onSort={(cfg) => { setSortConfig(cfg); setPage(1) }}
        pagination={{ page, perPage, total, totalPages }}
        onPageChange={setPage}
        onRowClick={(row) => router.push(`/admin/venues/${row.id}`)}
        renderActions={(row) => <VenueActions venue={row} onEdit={(v) => { setEditing(v); setDialogOpen(true) }} onDelete={(v) => { setConfirmItem(v); setConfirmOpen(true) }} />}
      />

      <VenueDialog open={dialogOpen} onOpenChange={setDialogOpen} venue={editing} />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(o) => { if (!confirmSubmitting) setConfirmOpen(o) }}
        title="Delete Venue"
        description={`Delete venue "${confirmItem?.name}"? This action cannot be undone.`}
        confirmLabel={confirmSubmitting ? "Deleting..." : "Delete"}
        onConfirm={handleDelete}
      />
    </div>
  )
}
