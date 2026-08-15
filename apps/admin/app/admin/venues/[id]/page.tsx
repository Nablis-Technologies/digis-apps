"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon, Building01Icon, Mail01Icon, SmartPhone01Icon, Calendar01Icon,
  MapPinpoint01Icon, MoreHorizontalIcon, Edit01Icon, Delete01Icon, Clock01Icon,
  Dollar01Icon, Ticket01Icon, UserGroupIcon,
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
import { VenueDialog } from "@/components/forms/venue-dialog"
import { ConfirmDialog } from "@/components/forms/confirm-dialog"
import { EventsTab } from "@/components/events-tab"
import { useGetVenueQuery, useDeleteVenueMutation } from "@/store/reducers/venuesApi"
import type { Venue } from "@/store/reducers/venuesApi"

const sparklineA = [4, 7, 5, 9, 8, 11, 10]
const sparklineB = [40, 55, 45, 65, 60, 78, 72]
const sparklineC = [12, 18, 14, 22, 19, 28, 24]
const sparklineD = [60, 68, 62, 75, 70, 82, 79]

type Tab = "overview" | "events"

const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "overview", label: "Overview", icon: <HugeiconsIcon icon={Building01Icon} strokeWidth={2} className="size-3.5" /> },
  { key: "events", label: "Events", icon: <HugeiconsIcon icon={Calendar01Icon} strokeWidth={2} className="size-3.5" /> },
]

function fmt(iso: string) { return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) }

export default function VenueDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data, isLoading: loading } = useGetVenueQuery(id)
  const [deleteVenue, { isLoading: deleting }] = useDeleteVenueMutation()

  const venue = data?.data

  const [tab, setTab] = useState<Tab>("overview")
  const [editOpen, setEditOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  async function handleDelete() {
    if (!venue) return
    try {
      await deleteVenue(venue.id).unwrap()
      toastSuccess("Venue deleted.")
      router.replace("/admin/venues")
    } catch (err) {
      toastError(err, "Failed to delete venue.")
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

  if (!venue) {
    return (
      <div className="space-y-6">
        <Link href="/admin/venues" className="flex size-9 items-center justify-center rounded-lg border border-border/50 bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" />
        </Link>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium">Venue not found</p>
          <p className="text-sm text-muted-foreground">The venue you&apos;re looking for doesn&apos;t exist or has been deleted.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Link href="/admin/venues" className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition-colors mt-1">
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight">{venue.name}</h1>
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", venue.active ? "bg-emerald-50 text-emerald-700" : "bg-zinc-50 text-zinc-500")}>
              {venue.active ? "Active" : "Inactive"}
            </span>
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", venue.verified ? "bg-blue-50 text-blue-700" : "bg-zinc-50 text-zinc-500")}>
              {venue.verified ? "Verified" : "Unverified"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {venue.address ?? `${venue.city}, ${venue.country}${venue.capacity ? ` · ${venue.capacity.toLocaleString()} capacity` : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" className="bg-lime-500 text-white hover:bg-lime-600" onClick={() => setEditOpen(true)}>
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
                <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} />Delete Venue
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatsCard title="Events Hosted" value={10} icon={Calendar01Icon} trend={{ value: "+3", positive: true }} sparklineData={sparklineA} sparklineColor="var(--chart-1)" />
        <StatsCard title="Avg Capacity" value="72%" icon={UserGroupIcon} trend={{ value: "+5%", positive: true }} sparklineData={sparklineB} sparklineColor="var(--chart-2)" />
        <StatsCard title="Tickets Sold" value="3,240" icon={Ticket01Icon} trend={{ value: "+12%", positive: true }} sparklineData={sparklineC} sparklineColor="var(--chart-3)" />
        <StatsCard title="Revenue" value="$64,800" icon={Dollar01Icon} trend={{ value: "+18%", positive: true }} sparklineData={sparklineD} sparklineColor="var(--chart-4)" />
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

      {tab === "overview" && <OverviewTab venue={venue} />}
      {tab === "events" && <EventsTab />}

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

function OverviewTab({ venue }: { venue: Venue }) {
  const fields = [
    { label: "Address", value: venue.address ?? "—", icon: <HugeiconsIcon icon={MapPinpoint01Icon} strokeWidth={2} className="size-4 text-muted-foreground" /> },
    { label: "Capacity", value: venue.capacity?.toLocaleString() ?? "—", icon: <HugeiconsIcon icon={Building01Icon} strokeWidth={2} className="size-4 text-muted-foreground" /> },
    { label: "Email", value: venue.contact_email ?? "—", icon: <HugeiconsIcon icon={Mail01Icon} strokeWidth={2} className="size-4 text-muted-foreground" /> },
    { label: "Phone", value: venue.contact_phone ?? "—", icon: <HugeiconsIcon icon={SmartPhone01Icon} strokeWidth={2} className="size-4 text-muted-foreground" /> },
    { label: "City", value: venue.city, icon: <HugeiconsIcon icon={MapPinpoint01Icon} strokeWidth={2} className="size-4 text-muted-foreground" /> },
    { label: "Country", value: venue.country, icon: <HugeiconsIcon icon={MapPinpoint01Icon} strokeWidth={2} className="size-4 text-muted-foreground" /> },
    { label: "Created", value: venue.created_at ? fmt(venue.created_at) : "—", icon: <HugeiconsIcon icon={Calendar01Icon} strokeWidth={2} className="size-4 text-muted-foreground" /> },
    { label: "Last Updated", value: venue.updated_at ? fmt(venue.updated_at) : "—", icon: <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-4 text-muted-foreground" /> },
  ]

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px] items-start">
      <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs">
        <h3 className="font-semibold mb-1">Venue Profile</h3>
        <p className="text-sm text-muted-foreground mb-4">Core information about this venue</p>
        {venue.description && <p className="text-sm text-muted-foreground mb-4">{venue.description}</p>}
        <Separator className="mb-5" />
        <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
          {fields.map((f) => (
            <div key={f.label} className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">{f.icon}</div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{f.label}</p>
                <p className="text-sm font-medium truncate">{f.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-border/50 bg-card p-5 shadow-xs lg:sticky lg:top-[calc(var(--header-height)+1.5rem)]">
        <div className="text-center">
          <div className="flex size-16 mx-auto items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
            <HugeiconsIcon icon={Building01Icon} strokeWidth={2} className="size-7" />
          </div>
          <p className="font-semibold">{venue.name}</p>
          <p className="text-sm text-muted-foreground">{venue.city}, {venue.country}</p>
          {venue.capacity && <p className="text-xs text-muted-foreground mt-1">{venue.capacity.toLocaleString()} capacity</p>}
        </div>
      </div>
    </div>
  )
}

