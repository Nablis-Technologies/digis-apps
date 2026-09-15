"use client"

import { useState, useMemo } from "react"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge, CategoryBadge, StatusBadge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataTable, type Column, type RowAction } from "@/components/ui/data-table"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  Search01Icon,
  Calendar03Icon,
  TicketIcon,
  Wallet01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"
import { Eye, Pencil, Share2, Copy, Trash2, Rocket } from "lucide-react"
import { StatsGrid } from "@/components/dashboard/stats-grid"
import { CreateEventDialog } from "../../../components/events/create-event-dialog"
import { EditEventDialog } from "../../../components/events/edit-event-dialog"
import { ShareEventDialog } from "../../../components/events/share-event-dialog"
import { formatNumber, formatCurrencyShort, formatCurrency, formatDateTime, calculatePercentage } from "@/lib/utils"
import { ViewToggle, type ViewMode } from "../../../components/events/view-toggle"
import { EmptyState } from "../../../components/events/empty-state"
import { ApiEventCard } from "../../../components/events/api-event-card"
import { useListEventsQuery, usePublishEventMutation } from "@workspace/store/reducers/organizerEventsApi"
import type { Event } from "@workspace/store/reducers/organizerEventsApi"
import { useListOwnerOrganizationsQuery } from "@workspace/store/reducers/organizationsApi"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

// Helper to get cover image from event_media
function getCoverImage(event: Event): string {
  const coverMedia = event.event_media?.find(
    media => media.type?.toLowerCase() === "cover" || Number(media.position) === 0
  )
  return coverMedia?.file?.medium || coverMedia?.file?.url || coverMedia?.file_url || ""
}

// Event row type for DataTable
type EventRow = {
  id: string
  name: string
  bannerUrl: string
  categories: string[]
  venue: string
  city: string
  startAt: string
  status: "Live" | "Published" | "Draft"
  totalSold: number
  totalCapacity: number
  totalRevenue: number
}

export default function EventsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedEventForEdit, setSelectedEventForEdit] = useState<Event | null>(null)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [selectedEventForShare, setSelectedEventForShare] = useState<Event | null>(null)
  const [publishEvent] = usePublishEventMutation()

  // Fetch events from API
  // NOTE: the backend policy scope now returns ONLY events the current user
  // can manage (own orgs + co-organizer links + manager assignments).
  // Public discovery lives on GET /public/events and must never appear here.
  // As defense-in-depth (stale cache, admin token, pre-fix data), we also
  // filter client-side to the user's own organization(s).
  const { data: organizationsData } = useListOwnerOrganizationsQuery()
  const myOrganizationIds = useMemo(
    () => new Set((organizationsData?.data ?? []).map((org) => org.id)),
    [organizationsData]
  )

  const { data: eventsResponse, isLoading, error } = useListEventsQuery({
    page: 1,
    per_page: 100,
    order_by: "created_at",
    order_direction: "desc",
  })

  const events = useMemo(() => {
    const all = eventsResponse?.data || []
    // Only apply the client filter once we know the user's orgs; otherwise
    // (e.g. orgs query still loading) fall back to the server-scoped result.
    if (myOrganizationIds.size === 0) return all
    return all.filter((event) => {
      const orgId = event.organization_id ?? event.organization?.id
      return orgId !== undefined && myOrganizationIds.has(orgId)
    })
  }, [eventsResponse, myOrganizationIds])

  // Prepare event data for table - using real API data
  const eventsForTable: EventRow[] = useMemo(
    () =>
      events.map((event) => {
        // For now, using mock tier data since API doesn't return this yet
        // TODO: Replace with real product/ticket data from API
        const totalSold = 0
        const totalCapacity = 0
        const totalRevenue = 0
        
        const categories = event.categories?.map(cat => cat.name) || []
        const primaryDate = event.event_dates?.[0]
        
        return {
          id: event.id,
          name: event.title,
          bannerUrl: getCoverImage(event),
          categories: categories,
          venue: primaryDate?.venue?.name ?? "TBD",
          city: primaryDate?.venue?.city ?? "Addis Ababa",
          startAt: primaryDate?.starts_at ?? event.created_at,
          status: (event.status.charAt(0).toUpperCase() + event.status.slice(1)) as "Live" | "Published" | "Draft",
          totalSold,
          totalCapacity,
          totalRevenue,
        }
      }),
    [events]
  )

  // Filter events based on search and status
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "all" || event.status === statusFilter.toLowerCase()
      return matchesSearch && matchesStatus
    })
  }, [events, searchQuery, statusFilter])

  // Filter table events
  const filteredTableEvents = useMemo(() => {
    return eventsForTable.filter((event) => {
      const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.categories.some(cat => cat.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesStatus = statusFilter === "all" || event.status.toLowerCase() === statusFilter.toLowerCase()
      return matchesSearch && matchesStatus
    })
  }, [eventsForTable, searchQuery, statusFilter])

  const hasFilters = searchQuery !== "" || statusFilter !== "all"

  // Analytics across all events (using mock data for now)
  // TODO: Replace with real analytics from API
  const ticketsSold = 0
  const totalCapacity = 0
  const totalRevenue = 0

  const statsCards = [
    {
      key: "total-events",
      title: "Total Events",
      value: formatNumber(events.length),
      icon: Calendar03Icon,
      trend: { value: "+12%", positive: true },
      sparklineData: [16, 18, 19, 21, 22, 23, events.length],
      sparklineColor: "var(--chart-1)",
    },
    {
      key: "tickets-sold",
      title: "Tickets Sold",
      value: formatNumber(ticketsSold),
      icon: TicketIcon,
      trend: { value: "+18%", positive: true },
      sparklineData: [1800, 2200, 2600, 3000, 3400, 3600, ticketsSold],
      sparklineColor: "var(--chart-2)",
    },
    {
      key: "total-revenue",
      title: "Total Revenue",
      value: formatCurrencyShort(totalRevenue),
      icon: Wallet01Icon,
      trend: { value: "+25%", positive: true },
      sparklineData: [2400, 2800, 3200, 3600, 4100, 4400, totalRevenue / 1000],
      sparklineColor: "var(--chart-3)",
    },
    {
      key: "total-capacity",
      title: "Total Capacity",
      value: formatNumber(totalCapacity),
      icon: UserGroupIcon,
      trend: {
        value: totalCapacity > 0 ? `${Math.round((ticketsSold / totalCapacity) * 100)}% sold` : "N/A",
        positive: true,
      },
      sparklineData: [2200, 2400, 2600, 2700, 2800, 2900, totalCapacity],
      sparklineColor: "var(--chart-4)",
    },
  ]

  // Table columns
  const eventColumns: Column<EventRow>[] = [
    {
      header: "Event",
      accessorKey: "name",
      cell: (row: EventRow) => (
        <div className="flex items-center gap-3">
          {row.bannerUrl ? (
            <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
              <img
                src={row.bannerUrl}
                alt={row.name}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-olive-100 to-olive-200 dark:from-olive-900 dark:to-olive-800">
              <HugeiconsIcon icon={Calendar03Icon} className="size-5 text-olive-500 dark:text-olive-400" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{row.name}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1">
              {row.categories.length > 0 ? (
                row.categories.map((category, idx) => (
                  <CategoryBadge 
                    key={idx}
                    category={category}
                  />
                ))
              ) : (
                <Badge variant="outline" className="border-0 shadow-none text-[11px] h-5 px-2 font-medium text-muted-foreground/60">
                  Uncategorized
                </Badge>
              )}
            </div>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      header: "Date & venue",
      accessorKey: "startAt",
      cell: (row: EventRow) => (
        <div>
          <p className="text-sm font-medium">{formatDateTime(row.startAt)}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {row.venue} - {row.city}
          </p>
        </div>
      ),
    },
    {
      header: "Tickets",
      cell: (row: EventRow) => {
        if (row.totalCapacity === 0) {
          return <span className="text-xs text-muted-foreground">No tickets yet</span>
        }
        const pct = calculatePercentage(row.totalSold, row.totalCapacity)
        return (
          <div className="flex items-center gap-3">
            <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-lime-500 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="whitespace-nowrap text-xs text-muted-foreground">
              {formatNumber(row.totalSold)} / {formatNumber(row.totalCapacity)} sold
            </span>
          </div>
        )
      },
    },
    {
      header: "Revenue",
      cell: (row: EventRow) => (
        <div>
          <p className="text-sm font-semibold">{formatCurrency(row.totalRevenue)}</p>
          <p className="text-xs text-muted-foreground">
            from {formatNumber(row.totalSold)} sales
          </p>
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row: EventRow) => (
        <StatusBadge status={row.status} />
      ),
    },
  ]

  // Define actions for each row
  const eventActions: RowAction<EventRow>[] = [
    {
      label: "View",
      icon: Eye,
      primary: true,
      iconOnly: true,
      onClick: (row) => {
        window.location.href = `/organizer/events/${row.id}`
      },
    },
    {
      label: "Edit",
      icon: Pencil,
      primary: true,
      iconOnly: true,
      onClick: (row) => {
        const found = events.find((e) => e.id === row.id)
        if (found) {
          setSelectedEventForEdit(found)
          setEditDialogOpen(true)
        }
      },
      // Published events cannot be modified per backend policy; only show for drafts
      hidden: (row: EventRow) => row.status?.toLowerCase() !== "draft",
    },
    {
      label: "Publish",
      icon: Rocket,
      primary: true,
      iconOnly: true,
      variant: "success",
      onClick: async (row) => {
        try {
          await publishEvent({
            id: row.id,
            idempotencyKey: `event-publish-${row.id}-${Date.now()}`,
          }).unwrap()
          toast.success("Event published successfully!")
        } catch (err: any) {
          const errorMessage = err?.data?.message || err?.message || "Failed to publish event"
          toast.error(errorMessage)
          console.error("Publish error:", err)
        }
      },
      // Only show for draft events (remove publish icon if published or live)
      hidden: (row: EventRow) => row.status?.toLowerCase() !== "draft",
    },
    {
      label: "Share",
      icon: Share2,
      primary: true,
      iconOnly: true,
      onClick: (row) => {
        const event = events.find((e) => e.id === row.id)
        if (event) {
          setSelectedEventForShare(event)
          setShareDialogOpen(true)
        }
      },
    },
    {
      label: "Duplicate",
      icon: Copy,
      onClick: (row) => {
        // TODO: Duplicate event
        console.log("Duplicate event", row.id)
      },
    },
    {
      label: "Delete",
      icon: Trash2,
      variant: "destructive",
      onClick: (row) => {
        // TODO: Confirm and delete
        if (confirm(`Are you sure you want to delete "${row.name}"?`)) {
          console.log("Delete event", row.id)
        }
      },
    },
  ]

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Skeleton className="h-9 w-48" />
            <Skeleton className="mt-2 h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Events</h1>
            <p className="text-muted-foreground">
              Create and manage your events
            </p>
          </div>
        </div>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Failed to load events. Please try again later.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground">
            Create and manage your events
          </p>
        </div>
        <Button size="lg" className="gap-2" onClick={() => setCreateDialogOpen(true)}>
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-5" />
          Create Event
        </Button>
        <CreateEventDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      </div>

      {/* Top Analytics */}
      <StatsGrid cards={statsCards} />

      {/* Filters and Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <HugeiconsIcon
            icon={Search01Icon}
            strokeWidth={2}
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40 rounded-xl">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Published">Published</SelectItem>
            <SelectItem value="Live">Live</SelectItem>
          </SelectContent>
        </Select>

        <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
      </div>

      {/* Events Display */}
      {filteredEvents.length === 0 ? (
        <EmptyState hasFilters={hasFilters} />
      ) : (
        <>
          {/* Mobile: List/Grid View */}
          <div className="block md:hidden">
            {viewMode === "grid" ? (
              <div className="grid gap-6 sm:grid-cols-2">
                {filteredEvents.map((event, index) => (
                  <ApiEventCard
                    key={event.id}
                    event={event}
                    index={index}
                    onEdit={(e) => {
                      setSelectedEventForEdit(e)
                      setEditDialogOpen(true)
                    }}
                    onShare={(e) => {
                      setSelectedEventForShare(e)
                      setShareDialogOpen(true)
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEvents.map((event, index) => (
                  <div key={event.id} className="rounded-lg border p-4">
                    <h3 className="font-semibold">{event.title}</h3>
                    <p className="text-sm text-muted-foreground">{event.status}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Desktop: Table or Grid View */}
          <div className="hidden md:block">
            {viewMode === "list" ? (
              <DataTable
                columns={eventColumns}
                data={filteredTableEvents}
                keyExtractor={(row: EventRow) => row.id}
                emptyMessage="No events found."
                onRowClick={(row: EventRow) => {
                  window.location.href = `/organizer/events/${row.id}`
                }}
                actions={eventActions}
              />
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredEvents.map((event, index) => (
                  <ApiEventCard
                    key={event.id}
                    event={event}
                    index={index}
                    onEdit={(e) => {
                      setSelectedEventForEdit(e)
                      setEditDialogOpen(true)
                    }}
                    onShare={(e) => {
                      setSelectedEventForShare(e)
                      setShareDialogOpen(true)
                    }}
                    onDuplicate={(e) => {
                      console.log("Duplicate event", e.id)
                    }}
                    onDelete={(e) => {
                      if (confirm(`Are you sure you want to delete "${e.title}"?`)) {
                        console.log("Delete event", e.id)
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Edit Event Dialog */}
      {selectedEventForEdit && (
        <EditEventDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          event={selectedEventForEdit}
        />
      )}

      {/* Share Event Dialog */}
      {selectedEventForShare && (
        <ShareEventDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          event={selectedEventForShare}
        />
      )}
    </div>
  )
}
