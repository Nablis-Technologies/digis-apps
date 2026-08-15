"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  Calendar01Icon,
  EyeIcon,
  EyeClosedIcon,
  Clock01Icon,
  Delete01Icon,
  Edit01Icon,
  Building01Icon,
  Globe02Icon,
  DollarCircleIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { toastSuccess, toastError } from "@/lib/toast"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { StatsCard } from "@/components/dashboard/stats-card"
import { EventDialog } from "@/components/forms/event-dialog"
import { ConfirmDialog } from "@/components/forms/confirm-dialog"
import { TicketsTab } from "@/components/tickets-tab"
import { ScheduleTab, TeamTab } from "@/components/schedule-team-tabs"
import { RegistrationFormsTab } from "@/components/registration-forms-tab"
import {
  useGetEventQuery,
  useDeleteEventMutation,
  usePublishEventMutation,
  useUnpublishEventMutation,
} from "@/store/reducers/eventsApi"

const statusConfig: Record<string, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "bg-zinc-50 text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-500" },
  published: { label: "Published", cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" },
  cancelled: { label: "Cancelled", cls: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400" },
}

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data, isLoading: loading } = useGetEventQuery(id)
  const [deleteEvent, { isLoading: deleting }] = useDeleteEventMutation()
  const [publishEvent] = usePublishEventMutation()
  const [unpublishEvent] = useUnpublishEventMutation()

  const event = data?.data

  const [editOpen, setEditOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [tab, setTab] = useState<"overview" | "tickets" | "schedule" | "team" | "forms">("overview")

  async function handleDelete() {
    if (!event) return
    try {
      await deleteEvent(event.id).unwrap()
      toastSuccess("Event deleted.")
      router.replace("/admin/events")
    } catch (err) {
      toastError(err, "Failed to delete event.")
      // stay open to retry
    }
  }

  async function togglePublish() {
    if (!event) return
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
      // ignore — tag invalidation refetches
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-72" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[120px] rounded-xl" />)}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="space-y-6">
        <Link href="/admin/events" className="flex size-9 items-center justify-center rounded-lg border border-border/50 bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" />
        </Link>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium">Event not found</p>
          <p className="text-sm text-muted-foreground">The event you&apos;re looking for doesn&apos;t exist or has been deleted.</p>
        </div>
      </div>
    )
  }

  const s = statusConfig[event.status] ?? statusConfig.draft

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Link href="/admin/events" className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition-colors mt-1">
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight">{event.title}</h1>
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", s.cls)}>{s.label}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {event.description ?? "No description"} · {event.organization?.name ?? "—"}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={togglePublish} disabled={event.status === "cancelled"}>
            <HugeiconsIcon icon={event.status === "published" ? EyeClosedIcon : EyeIcon} strokeWidth={2} className="size-4" />
            {event.status === "published" ? "Unpublish" : "Publish"}
          </Button>
          <Button size="sm" className="bg-lime-500 text-white hover:bg-lime-600" onClick={() => setEditOpen(true)}>
            <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} className="size-4" />
            Edit
          </Button>
          <Button variant="outline" size="sm" className="text-destructive" onClick={() => setConfirmOpen(true)}>
            <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatsCard title="Status" value={s.label} icon={Calendar01Icon} sparklineData={[1, 2, 2, 3, 3, 4, 4]} sparklineColor="var(--chart-1)" />
        <StatsCard title="Visibility" value={event.visibility} icon={Globe02Icon} sparklineData={[2, 3, 3, 4, 4, 5, 5]} sparklineColor="var(--chart-2)" />
        <StatsCard title="Currency" value={event.currency} icon={DollarCircleIcon} sparklineData={[3, 3, 4, 4, 5, 5, 6]} sparklineColor="var(--chart-3)" />
        <StatsCard title="Version" value={event.version} icon={Clock01Icon} sparklineData={[1, 1, 2, 2, 2, 3, 3]} sparklineColor="var(--chart-4)" />
      </div>

      <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs">
        <h3 className="font-semibold mb-1">Event Profile</h3>
        <p className="text-sm text-muted-foreground mb-4">Core information about this event</p>
        <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0"><HugeiconsIcon icon={Building01Icon} strokeWidth={2} className="size-4 text-muted-foreground" /></div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Organization</p>
              <p className="text-sm font-medium">{event.organization?.name ?? "—"}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0"><HugeiconsIcon icon={Globe02Icon} strokeWidth={2} className="size-4 text-muted-foreground" /></div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Timezone</p>
              <p className="text-sm font-medium">{event.timezone}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0"><HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-4 text-muted-foreground" /></div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Slug</p>
              <p className="text-sm font-medium">/{event.slug}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0"><HugeiconsIcon icon={Calendar01Icon} strokeWidth={2} className="size-4 text-muted-foreground" /></div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Published</p>
              <p className="text-sm font-medium">{event.published_at ? new Date(event.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Not published"}</p>
            </div>
          </div>
        </div>
        {event.categories && event.categories.length > 0 && (
          <div className="mt-5">
            <p className="text-xs text-muted-foreground mb-1.5">Categories</p>
            <div className="flex flex-wrap gap-2">
              {event.categories.map((c) => (
                <span key={c.id} className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium">
                  {c.name}
                </span>
              ))}
            </div>
          </div>
        )}
        {event.description && (
          <div className="mt-5">
            <p className="text-xs text-muted-foreground mb-1.5">Description</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{event.description}</p>
          </div>
        )}
      </div>

      <div className="flex gap-1 border-b border-border/50">
        {(["overview", "tickets", "schedule", "team", "forms"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px capitalize",
              tab === t ? "border-lime-500 text-lime-600" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t === "tickets" ? "Tickets & Products" : t === "schedule" ? "Schedule" : t === "forms" ? "Registration Forms" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "tickets" && <TicketsTab eventId={event.id} />}
      {tab === "schedule" && <ScheduleTab eventId={event.id} />}
      {tab === "team" && <TeamTab eventId={event.id} />}
      {tab === "forms" && <RegistrationFormsTab eventId={event.id} />}

      <EventDialog open={editOpen} onOpenChange={setEditOpen} event={event} />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(o) => { if (!deleting) setConfirmOpen(o) }}
        title="Delete Event"
        description={`Delete event "${event.title}"? This action cannot be undone.`}
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        onConfirm={handleDelete}
      />
    </div>
  )
}
