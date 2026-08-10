"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  Edit01Icon,
  ViewIcon,
  Share01Icon,
  Copy01Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons"
import { StatsGrid } from "@/components/dashboard/stats-grid"
import { CreateEventDialog } from "../../../components/events/create-event-dialog"
import { ShareEventDialog } from "../../../components/events/share-event-dialog"
import { sampleEvents } from "@/lib/sample-data"
import { formatNumber, formatCurrencyShort, formatCurrency, formatDateTime, calculatePercentage } from "@/lib/utils"
import { EventCard } from "../../../components/events/event-card"
import { EventListItem } from "../../../components/events/event-list-item"
import { ViewToggle, type ViewMode } from "../../../components/events/view-toggle"
import { EmptyState } from "../../../components/events/empty-state"

// Event row type for DataTable
type EventRow = {
  id: string
  name: string
  bannerUrl: string
  category: string
  venue: string
  city: string
  startAt: string
  status: "Live" | "Published" | "Draft"
  totalSold: number
  totalCapacity: number
  totalRevenue: number
}

type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "success"
  | "warning"
  | "info"
  | "violet"
  | "pink"
  | "orange"
  | "outline"

function getStatusVariant(status: EventRow["status"]): BadgeVariant {
  switch (status) {
    case "Live":
      return "success"
    case "Published":
      return "info"
    case "Draft":
      return "outline"
  }
}

function getCategoryVariant(category: string): BadgeVariant {
  const variants: BadgeVariant[] = [
    "violet",
    "pink",
    "orange",
    "info",
    "success",
    "warning",
  ]
  const hash = category
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return variants[hash % variants.length]
}

export default function EventsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [selectedEventForShare, setSelectedEventForShare] = useState<typeof sampleEvents[0] | null>(null)

  // Prepare event data for table
  const eventsForTable: EventRow[] = useMemo(
    () =>
      sampleEvents.map((event) => {
        const totalSold = event.tiers.reduce((s, t) => s + t.sold, 0)
        const totalCapacity = event.tiers.reduce((s, t) => s + t.total, 0)
        const totalRevenue = event.tiers.reduce((s, t) => s + t.sold * t.price, 0)
        return {
          id: event.id,
          name: event.name,
          bannerUrl: event.bannerUrl,
          category: event.category,
          venue: event.venue,
          city: event.city,
          startAt: event.startAt,
          status: event.status,
          totalSold,
          totalCapacity,
          totalRevenue,
        }
      }),
    []
  )

  // Filter events based on search and status
  const filteredEvents = useMemo(() => {
    return sampleEvents.filter((event) => {
      const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "all" || event.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [searchQuery, statusFilter])

  // Filter table events
  const filteredTableEvents = useMemo(() => {
    return eventsForTable.filter((event) => {
      const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "all" || event.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [eventsForTable, searchQuery, statusFilter])

  const hasFilters = searchQuery !== "" || statusFilter !== "all"

  // Analytics across all events
  const ticketsSold = sampleEvents.reduce(
    (sum, event) => sum + event.tiers.reduce((s, tier) => s + tier.sold, 0),
    0
  )
  const totalCapacity = sampleEvents.reduce(
    (sum, event) => sum + event.tiers.reduce((s, tier) => s + tier.total, 0),
    0
  )
  const totalRevenue = sampleEvents.reduce(
    (sum, event) =>
      sum + event.tiers.reduce((s, tier) => s + tier.sold * tier.price, 0),
    0
  )

  const statsCards = [
    {
      key: "total-events",
      title: "Total Events",
      value: formatNumber(sampleEvents.length),
      icon: Calendar03Icon,
      trend: { value: "+12%", positive: true },
      sparklineData: [16, 18, 19, 21, 22, 23, sampleEvents.length],
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
        value: `${Math.round((ticketsSold / totalCapacity) * 100)}% sold`,
        positive: true,
      },
      sparklineData: [2200, 2400, 2600, 2700, 2800, 2900, totalCapacity],
      sparklineColor: "var(--chart-4)",
    },
  ]

  // Table columns (same as dashboard)
  const eventColumns: Column<EventRow>[] = [
    {
      header: "Event",
      accessorKey: "name",
      cell: (row: EventRow) => (
        <div className="flex items-center gap-3">
          <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
            <img
              src={row.bannerUrl}
              alt={row.name}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{row.name}</p>
            <Badge variant={getCategoryVariant(row.category)} className="mt-1">
              {row.category}
            </Badge>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {row.venue} - {row.city}
            </p>
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
        <Badge variant={getStatusVariant(row.status)}>
          {row.status}
        </Badge>
      ),
    },
  ]

  // Define actions for each row
  const eventActions: RowAction<EventRow>[] = [
    {
      label: "View",
      icon: ViewIcon,
      primary: true,
      iconOnly: true,
      onClick: (row) => {
        window.location.href = `/organizer/events/${row.id}`
      },
    },
    {
      label: "Edit",
      icon: Edit01Icon,
      primary: true,
      iconOnly: true,
      onClick: (row) => {
        // TODO: Open edit dialog
        console.log("Edit event", row.id)
      },
    },
    {
      label: "Share",
      icon: Share01Icon,
      primary: true,
      iconOnly: true,
      onClick: (row) => {
        const event = sampleEvents.find((e) => e.id === row.id)
        if (event) {
          setSelectedEventForShare(event)
          setShareDialogOpen(true)
        }
      },
    },
    {
      label: "Duplicate",
      icon: Copy01Icon,
      onClick: (row) => {
        // TODO: Duplicate event
        console.log("Duplicate event", row.id)
      },
    },
    {
      label: "Delete",
      icon: Delete02Icon,
      variant: "destructive",
      onClick: (row) => {
        // TODO: Confirm and delete
        if (confirm(`Are you sure you want to delete "${row.name}"?`)) {
          console.log("Delete event", row.id)
        }
      },
    },
  ]

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
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
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
                  <EventCard key={event.id} event={event} index={index} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEvents.map((event, index) => (
                  <EventListItem key={event.id} event={event} index={index} />
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
                  <EventCard key={event.id} event={event} index={index} />
                ))}
              </div>
            )}
          </div>
        </>
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
