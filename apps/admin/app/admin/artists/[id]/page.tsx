"use client"

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon, MusicNote01Icon, Calendar01Icon, Clock01Icon,
  MoreHorizontalIcon, Edit01Icon, Delete01Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { ArtistDialog } from "@/components/forms/artist-dialog"
import { ConfirmDialog } from "@/components/forms/confirm-dialog"
import { useGetArtistQuery, useDeleteArtistMutation, type Artist } from "@/store/reducers/artistsApi"
import { useState } from "react"

function fmt(iso: string) { return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) }

const genreColors: Record<string, string> = {
  pop: "bg-pink-50 text-pink-700", folk: "bg-amber-50 text-amber-700", jazz: "bg-indigo-50 text-indigo-700",
  electronic: "bg-cyan-50 text-cyan-700", rock: "bg-red-50 text-red-700", dance: "bg-violet-50 text-violet-700",
  traditional: "bg-emerald-50 text-emerald-700",
}

export default function ArtistDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data, isLoading: loading } = useGetArtistQuery(id)
  const [deleteArtist, { isLoading: deleting }] = useDeleteArtistMutation()

  const artist = data?.data

  const [editOpen, setEditOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  async function handleDelete() {
    if (!artist) return
    try {
      await deleteArtist(artist.id).unwrap()
      router.replace("/admin/artists")
    } catch {
      // stay open to retry
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-9 rounded-lg" />
          <div className="flex-1"><Skeleton className="h-7 w-48" /><Skeleton className="mt-1 h-4 w-72" /></div>
          <Skeleton className="h-9 w-24 rounded-lg" />
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
          <p className="text-sm text-muted-foreground">The artist you're looking for doesn't exist or has been deleted.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/artists" className="flex size-9 items-center justify-center rounded-lg border border-border/50 bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"><HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{artist.name}</h1>
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", artist.active ? "bg-emerald-50 text-emerald-700" : "bg-zinc-50 text-zinc-500")}>{artist.active ? "Active" : "Inactive"}</span>
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", artist.verified ? "bg-blue-50 text-blue-700" : "bg-zinc-50 text-zinc-500")}>{artist.verified ? "Verified" : "Unverified"}</span>
          </div>
          <p className="text-sm text-muted-foreground font-mono mt-0.5">{artist.id}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="outline" size="sm"><HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} className="size-4" />Actions</Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => setEditOpen(true)}><HugeiconsIcon icon={Edit01Icon} strokeWidth={2} />Edit Artist</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => setConfirmOpen(true)}><HugeiconsIcon icon={Delete01Icon} strokeWidth={2} />Delete Artist</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs lg:col-span-2">
          <h3 className="font-semibold mb-4">Details</h3>
          {artist.description && <p className="text-sm text-muted-foreground mb-4">{artist.description}</p>}
          <Separator className="mb-4" />
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2">Genres</p>
              <div className="flex flex-wrap gap-1.5">
                {artist.genres.length > 0
                  ? artist.genres.map((g) => <span key={g} className={cn("rounded-md px-2.5 py-0.5 text-xs font-medium capitalize", genreColors[g] ?? "bg-muted text-muted-foreground")}>{g}</span>)
                  : <span className="text-sm text-muted-foreground">No genres</span>}
              </div>
            </div>
            <Separator />
            <InfoRow label="Created" value={artist.created_at ? fmt(artist.created_at) : "—"} />
            <InfoRow label="Last Updated" value={artist.updated_at ? fmt(artist.updated_at) : "—"} />
          </div>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs flex items-center justify-center">
          <div className="text-center">
            <div className="flex size-16 mx-auto items-center justify-center rounded-full bg-muted mb-3"><HugeiconsIcon icon={MusicNote01Icon} strokeWidth={2} className="size-7 text-muted-foreground" /></div>
            <p className="font-semibold">{artist.name}</p>
            <div className="flex flex-wrap justify-center gap-1 mt-2">
              {artist.genres.map((g) => <span key={g} className={cn("rounded-md px-2 py-0.5 text-xs font-medium capitalize", genreColors[g] ?? "bg-muted text-muted-foreground")}>{g}</span>)}
            </div>
          </div>
        </div>
      </div>

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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (<div className="flex items-start gap-3"><div className="mt-0.5"><HugeiconsIcon icon={Calendar01Icon} strokeWidth={2} className="size-4 text-muted-foreground" /></div><div><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm font-medium">{value}</p></div></div>)
}
