"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  MusicNote01Icon,
  CheckmarkCircle01Icon,
  StarIcon,
  Tag02Icon,
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
import { ArtistDialog } from "@/components/forms/artist-dialog"
import {
  useListArtistsQuery,
  useDeleteArtistMutation,
  type Artist,
} from "@/store/reducers/artistsApi"

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

const genreColors: Record<string, string> = {
  pop: "bg-pink-50 text-pink-700 dark:bg-pink-950/30 dark:text-pink-400",
  folk: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  jazz: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400",
  electronic: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-400",
  dance: "bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400",
  rock: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400",
  "r&b": "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400",
  soul: "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400",
  "hip-hop": "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  traditional: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
}

function GenreBadge({ genre }: { genre: string }) {
  return (
    <span className={cn("inline-block rounded-md px-2 py-0.5 text-xs font-medium capitalize", genreColors[genre] ?? "bg-muted text-muted-foreground")}>
      {genre}
    </span>
  )
}

function ArtistActions({ artist, onEdit, onDelete }: { artist: Artist; onEdit: (a: Artist) => void; onDelete: (a: Artist) => void }) {
  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={() => onEdit(artist)} className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
        <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} className="size-4" />
      </button>
      <button type="button" onClick={() => onDelete(artist)} className="flex size-8 items-center justify-center rounded-md text-destructive transition-colors hover:bg-destructive/10">
        <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} className="size-4" />
      </button>
    </div>
  )
}

export default function ArtistsPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "name", direction: "asc" })

  const { data, isLoading, isFetching, refetch } = useListArtistsQuery({
    page,
    per_page: 10,
    order_by: sortConfig.key,
    order_direction: sortConfig.direction,
  })

  const [deleteArtist] = useDeleteArtistMutation()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Artist | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmItem, setConfirmItem] = useState<Artist | null>(null)
  const [confirmSubmitting, setConfirmSubmitting] = useState(false)

  const artists = data?.data ?? []
  const pagination = data?.pagination
  const total = pagination?.total_count ?? 0
  const totalPages = pagination?.total_pages ?? 1
  const perPage = pagination?.per_page ?? 10

  const stats = {
    total,
    active: artists.filter((a) => a.active).length,
    verified: artists.filter((a) => a.verified).length,
    genresCount: new Set(artists.flatMap((a) => a.genres)).size,
  }

  const columns: Column<Artist>[] = [
    {
      header: "Name",
      accessorKey: "name",
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-medium text-foreground">{row.name}</p>
          {row.description && <p className="text-xs text-muted-foreground max-w-48 truncate">{row.description}</p>}
        </div>
      ),
    },
    {
      header: "Genres",
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.genres.length > 0 ? row.genres.map((g) => <GenreBadge key={g} genre={g} />) : <span className="text-muted-foreground/50">&mdash;</span>}
        </div>
      ),
      hideOnMobile: true,
    },
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
      await deleteArtist(confirmItem.id).unwrap()
      toastSuccess("Artist deleted.")
      setConfirmOpen(false)
      setConfirmItem(null)
    } catch (err) {
      toastError(err, "Failed to delete artist.")
      // stay open to retry
    } finally {
      setConfirmSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Artists</h1>
          <p className="text-sm text-muted-foreground">Manage performers and musical artists</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => refetch()} className="inline-flex items-center gap-2 rounded-lg border border-border/50 bg-card px-4 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-accent">
            <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className="size-4" />Refresh
          </button>
          <button type="button" onClick={() => { setEditing(null); setDialogOpen(true) }} className="inline-flex items-center gap-2 rounded-lg bg-lime-500 px-4 py-2 text-sm font-medium text-white shadow-xs transition-colors hover:bg-lime-600">
            <HugeiconsIcon icon={PlusSignCircleIcon} strokeWidth={2} className="size-4" />Create Artist
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Artists" value={stats.total} icon={MusicNote01Icon} sparklineData={[620, 680, 720, 780, 830, 860, stats.total]} sparklineColor="var(--chart-1)" />
        <StatsCard title="Active" value={stats.active} icon={CheckmarkCircle01Icon} trend={{ value: stats.total > 0 ? `${Math.round((stats.active / stats.total) * 100)}%` : "0%", positive: true }} sparklineData={[500, 550, 600, 650, 700, 720, stats.active]} sparklineColor="var(--chart-2)" />
        <StatsCard title="Verified" value={stats.verified} icon={StarIcon} trend={{ value: stats.total > 0 ? `${Math.round((stats.verified / stats.total) * 100)}%` : "0%", positive: true }} sparklineData={[200, 240, 280, 320, 360, 400, stats.verified]} sparklineColor="var(--chart-3)" />
        <StatsCard title="Genres" value={stats.genresCount} icon={Tag02Icon} sparklineData={[18, 20, 22, 24, 26, 28, stats.genresCount]} sparklineColor="var(--chart-4)" />
      </div>

      <DataTable
        columns={columns}
        data={artists}
        keyExtractor={(row) => row.id}
        isLoading={isLoading || isFetching}
        sortConfig={sortConfig}
        onSort={(cfg) => { setSortConfig(cfg); setPage(1) }}
        pagination={{ page, perPage, total, totalPages }}
        onPageChange={setPage}
        onRowClick={(row) => router.push(`/admin/artists/${row.id}`)}
        renderActions={(row) => <ArtistActions artist={row} onEdit={(a) => { setEditing(a); setDialogOpen(true) }} onDelete={(a) => { setConfirmItem(a); setConfirmOpen(true) }} />}
      />

      <ArtistDialog open={dialogOpen} onOpenChange={setDialogOpen} artist={editing} />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(o) => { if (!confirmSubmitting) setConfirmOpen(o) }}
        title="Delete Artist"
        description={`Delete artist "${confirmItem?.name}"? This action cannot be undone.`}
        confirmLabel={confirmSubmitting ? "Deleting..." : "Delete"}
        onConfirm={handleDelete}
      />
    </div>
  )
}
