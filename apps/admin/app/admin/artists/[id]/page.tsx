"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon, MusicNote01Icon, Calendar01Icon, Clock01Icon,
  MoreHorizontalIcon, Edit01Icon, Delete01Icon, UserGroupIcon,
  ChartBarLineIcon, Dollar01Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { toastSuccess, toastError } from "@/lib/toast"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { StatsCard } from "@/components/dashboard/stats-card"
import { ArtistDialog } from "@/components/forms/artist-dialog"
import { ConfirmDialog } from "@/components/forms/confirm-dialog"
import { EventsTab } from "@/components/events-tab"
import { useGetArtistQuery, useDeleteArtistMutation } from "@/store/reducers/artistsApi"
import type { Artist } from "@/store/reducers/artistsApi"

const genreColors: Record<string, string> = {
  pop: "bg-pink-50 text-pink-700", folk: "bg-amber-50 text-amber-700", jazz: "bg-indigo-50 text-indigo-700",
  electronic: "bg-cyan-50 text-cyan-700", rock: "bg-red-50 text-red-700", dance: "bg-violet-50 text-violet-700",
  traditional: "bg-emerald-50 text-emerald-700",
}

const sparklineA = [120, 180, 150, 220, 190, 280, 240]
const sparklineB = [3, 5, 4, 6, 5, 7, 8]
const sparklineC = [800, 1200, 900, 1500, 1100, 1800, 1600]
const sparklineD = [8, 12, 9, 15, 11, 18, 14]

type Tab = "overview" | "events"

const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "overview", label: "Overview", icon: <HugeiconsIcon icon={MusicNote01Icon} strokeWidth={2} className="size-3.5" /> },
  { key: "events", label: "Events", icon: <HugeiconsIcon icon={Calendar01Icon} strokeWidth={2} className="size-3.5" /> },
]

function fmt(iso: string) { return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) }

export default function ArtistDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data, isLoading: loading } = useGetArtistQuery(id)
  const [deleteArtist, { isLoading: deleting }] = useDeleteArtistMutation()

  const artist = data?.data

  const [tab, setTab] = useState<Tab>("overview")
  const [editOpen, setEditOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  async function handleDelete() {
    if (!artist) return
    try {
      await deleteArtist(artist.id).unwrap()
      toastSuccess("Artist deleted.")
      router.replace("/admin/artists")
    } catch (err) {
      toastError(err, "Failed to delete artist.")
      // stay open to retry
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-9 rounded-lg" />
          <div className="flex-1"><Skeleton className="h-7 w-64" /><Skeleton className="mt-1 h-4 w-72" /></div>
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[120px] rounded-xl" />)}
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    )
  }

  if (!artist) {
    return (
      <div className="space-y-6">
        <Link href="/admin/artists" className="flex size-9 items-center justify-center rounded-lg border border-border/50 bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"><HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" /></Link>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium">Artist not found</p>
          <p className="text-sm text-muted-foreground">The artist you&apos;re looking for doesn&apos;t exist or has been deleted.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Link href="/admin/artists" className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition-colors mt-1">
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight">{artist.name}</h1>
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", artist.active ? "bg-emerald-50 text-emerald-700" : "bg-zinc-50 text-zinc-500")}>
              {artist.active ? "Active" : "Inactive"}
            </span>
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", artist.verified ? "bg-blue-50 text-blue-700" : "bg-zinc-50 text-zinc-500")}>
              {artist.verified ? "Verified" : "Unverified"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {artist.description ?? `${artist.genres.length > 0 ? artist.genres.map((g) => g.charAt(0).toUpperCase() + g.slice(1)).join(", ") : "No genres"} artist`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" onClick={() => setEditOpen(true)}>
            <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} className="size-4" />
            Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem variant="destructive" onClick={() => setConfirmOpen(true)}>
                <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} />Delete Artist
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatsCard title="Total Events" value={24} icon={Calendar01Icon} trend={{ value: "+5", positive: true }} sparklineData={sparklineA} sparklineColor="var(--chart-1)" />
        <StatsCard title="Genre Rank" value="#3" icon={ChartBarLineIcon} trend={{ value: "+2", positive: true }} sparklineData={sparklineB} sparklineColor="var(--chart-2)" />
        <StatsCard title="Followers" value="1,626" icon={UserGroupIcon} trend={{ value: "+15%", positive: true }} sparklineData={sparklineC} sparklineColor="var(--chart-3)" />
        <StatsCard title="Revenue" value="$48,500" icon={Dollar01Icon} trend={{ value: "+22%", positive: true }} sparklineData={sparklineD} sparklineColor="var(--chart-4)" />
      </div>

      <div className="flex gap-1 border-b border-border/50">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px capitalize inline-flex items-center gap-1.5",
              tab === t.key ? "border-lime-500 text-lime-600" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="flex items-center">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab artist={artist} />}
      {tab === "events" && <EventsTab />}

      <ArtistDialog open={editOpen} onOpenChange={setEditOpen} artist={artist} />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete Artist"
        description={`Delete ${artist.name}? This action cannot be undone.`}
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        onConfirm={handleDelete}
      />
    </div>
  )
}

function OverviewTab({ artist }: { artist: Artist }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px] items-start">
      <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs">
        <h3 className="font-semibold mb-1">Artist Profile</h3>
        <p className="text-sm text-muted-foreground mb-4">Core information about this artist</p>
        <Separator className="mb-5" />
        <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
          <InfoRow label="Genres" icon={<HugeiconsIcon icon={MusicNote01Icon} strokeWidth={2} className="size-4 text-muted-foreground" />}>
            <div className="flex flex-wrap gap-1.5 mt-0.5">
              {artist.genres.length > 0
                ? artist.genres.map((g) => <span key={g} className={cn("rounded-md px-2.5 py-0.5 text-xs font-medium capitalize", genreColors[g] ?? "bg-muted text-muted-foreground")}>{g}</span>)
                : <span className="text-sm text-muted-foreground">No genres</span>}
            </div>
          </InfoRow>
          <InfoRow label="Status" icon={<HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-4 text-muted-foreground" />}>
            <p className="text-sm font-medium">{artist.active ? "Active" : "Inactive"}</p>
          </InfoRow>
          <InfoRow label="Verification" icon={<HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-4 text-muted-foreground" />}>
            <p className="text-sm font-medium">{artist.verified ? "Verified" : "Unverified"}</p>
          </InfoRow>
          <InfoRow label="Created" icon={<HugeiconsIcon icon={Calendar01Icon} strokeWidth={2} className="size-4 text-muted-foreground" />}>
            <p className="text-sm font-medium">{artist.created_at ? fmt(artist.created_at) : "—"}</p>
          </InfoRow>
          <InfoRow label="Last Updated" icon={<HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-4 text-muted-foreground" />}>
            <p className="text-sm font-medium">{artist.updated_at ? fmt(artist.updated_at) : "—"}</p>
          </InfoRow>
        </div>
        {artist.description && (
          <>
            <Separator className="my-5" />
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Description</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{artist.description}</p>
            </div>
          </>
        )}
      </div>
      <div className="rounded-xl border border-border/50 bg-card p-5 shadow-xs lg:sticky lg:top-[calc(var(--header-height)+1.5rem)]">
        <div className="text-center">
          <div className="flex size-16 mx-auto items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
            <HugeiconsIcon icon={MusicNote01Icon} strokeWidth={2} className="size-7" />
          </div>
          <p className="font-semibold">{artist.name}</p>
          <div className="flex flex-wrap justify-center gap-1 mt-2">
            {artist.genres.map((g) => <span key={g} className={cn("rounded-md px-2 py-0.5 text-xs font-medium capitalize", genreColors[g] ?? "bg-muted text-muted-foreground")}>{g}</span>)}
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        {children}
      </div>
    </div>
  )
}
