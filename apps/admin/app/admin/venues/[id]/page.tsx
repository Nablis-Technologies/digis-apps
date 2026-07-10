"use client"

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon, Building01Icon, Mail01Icon, SmartPhone01Icon, Calendar01Icon,
  MapPinpoint01Icon, MoreHorizontalIcon, Edit01Icon, Delete01Icon, Clock01Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { VenueDialog } from "@/components/forms/venue-dialog"
import { ConfirmDialog } from "@/components/forms/confirm-dialog"
import { useGetVenueQuery, useDeleteVenueMutation, type Venue } from "@/store/reducers/venuesApi"
import { useState } from "react"

function fmt(iso: string) { return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) }

export default function VenueDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data, isLoading: loading } = useGetVenueQuery(id)
  const [deleteVenue, { isLoading: deleting }] = useDeleteVenueMutation()

  const venue = data?.data

  const [editOpen, setEditOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  async function handleDelete() {
    if (!venue) return
    try {
      await deleteVenue(venue.id).unwrap()
      router.replace("/admin/venues")
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

  if (!venue) {
    return (
      <div className="space-y-6">
        <Link href="/admin/venues" className="flex size-9 items-center justify-center rounded-lg border border-border/50 bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"><HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" /></Link>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium">Venue not found</p>
          <p className="text-sm text-muted-foreground">The venue you're looking for doesn't exist or has been deleted.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/venues" className="flex size-9 items-center justify-center rounded-lg border border-border/50 bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"><HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{venue.name}</h1>
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", venue.active ? "bg-emerald-50 text-emerald-700" : "bg-zinc-50 text-zinc-500")}>{venue.active ? "Active" : "Inactive"}</span>
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", venue.verified ? "bg-blue-50 text-blue-700" : "bg-zinc-50 text-zinc-500")}>{venue.verified ? "Verified" : "Unverified"}</span>
          </div>
          <p className="text-sm text-muted-foreground font-mono mt-0.5">{venue.id}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="outline" size="sm"><HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} className="size-4" />Actions</Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => setEditOpen(true)}><HugeiconsIcon icon={Edit01Icon} strokeWidth={2} />Edit Venue</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => setConfirmOpen(true)}><HugeiconsIcon icon={Delete01Icon} strokeWidth={2} />Delete Venue</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs lg:col-span-2">
          <h3 className="font-semibold mb-4">Details</h3>
          {venue.description && <p className="text-sm text-muted-foreground mb-4">{venue.description}</p>}
          <Separator className="mb-4" />
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Address" value={venue.address ?? "—"} icon={<HugeiconsIcon icon={MapPinpoint01Icon} strokeWidth={2} className="size-4 text-muted-foreground" />} />
            <InfoRow label="Capacity" value={venue.capacity?.toLocaleString() ?? "—"} icon={<HugeiconsIcon icon={Building01Icon} strokeWidth={2} className="size-4 text-muted-foreground" />} />
            <InfoRow label="Email" value={venue.contact_email ?? "—"} icon={<HugeiconsIcon icon={Mail01Icon} strokeWidth={2} className="size-4 text-muted-foreground" />} />
            <InfoRow label="Phone" value={venue.contact_phone ?? "—"} icon={<HugeiconsIcon icon={SmartPhone01Icon} strokeWidth={2} className="size-4 text-muted-foreground" />} />
            <InfoRow label="City" value={venue.city} icon={<HugeiconsIcon icon={MapPinpoint01Icon} strokeWidth={2} className="size-4 text-muted-foreground" />} />
            <InfoRow label="Country" value={venue.country} icon={<HugeiconsIcon icon={MapPinpoint01Icon} strokeWidth={2} className="size-4 text-muted-foreground" />} />
            <InfoRow label="Created" value={venue.created_at ? fmt(venue.created_at) : "—"} icon={<HugeiconsIcon icon={Calendar01Icon} strokeWidth={2} className="size-4 text-muted-foreground" />} />
            <InfoRow label="Updated" value={venue.updated_at ? fmt(venue.updated_at) : "—"} icon={<HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-4 text-muted-foreground" />} />
          </div>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs flex items-center justify-center">
          <div className="text-center">
            <div className="flex size-16 mx-auto items-center justify-center rounded-full bg-muted mb-3">
              <HugeiconsIcon icon={Building01Icon} strokeWidth={2} className="size-7 text-muted-foreground" />
            </div>
            <p className="font-semibold">{venue.name}</p>
            <p className="text-sm text-muted-foreground">{venue.city}, {venue.country}</p>
            {venue.capacity && <p className="text-xs text-muted-foreground mt-1">{venue.capacity.toLocaleString()} capacity</p>}
          </div>
        </div>
      </div>

      <VenueDialog open={editOpen} onOpenChange={setEditOpen} venue={venue} />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete Venue"
        description={`Delete ${venue.name}? This action cannot be undone.`}
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        onConfirm={handleDelete}
      />
    </div>
  )
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (<div className="flex items-start gap-3"><div className="mt-0.5">{icon}</div><div><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm font-medium">{value}</p></div></div>)
}
