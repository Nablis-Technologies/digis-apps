"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { StatsCard } from "@/components/dashboard/stats-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { TabsContent } from "@/components/ui/tabs"
import { PageTabs } from "@/components/page-tabs"
import { DataTable, type Column } from "@/components/ui/data-table"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar03Icon,
  TicketIcon,
  Wallet01Icon,
  UserGroupIcon,
  Add01Icon,
  ArrowRight01Icon,
  BarChartIcon,
  LayoutTopIcon,
  Search01Icon,
  ChevronRightIcon,
} from "@hugeicons/core-free-icons"
import Link from "next/link"
import { CreateEventDialog } from "../../components/events/create-event-dialog"
import {
  useListEventsQuery,
  type Event,
} from "@workspace/store/reducers/organizerEventsApi"
import { useListOwnerOrganizationsQuery } from "@workspace/store/reducers/organizationsApi"
import { useActiveOrganization } from "../../providers/organization-provider"
import {
  formatCurrency,
  formatCurrencyShort,
  formatNumber,
  formatDateTime,
  calculatePercentage,
} from "@/lib/utils"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

// ─── Types & Badges ─────────────────────────────────────────────────────────

type StatusFilter = "all" | "Published" | "Draft" | "Live"

export type EventRow = {
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

// ─── Helpers ────────────────────────────────────────────────────────────────

function getCoverImage(event: Event): string {
  const coverMedia = event.event_media?.find(
    (media) => media.type?.toLowerCase() === "cover" || Number(media.position) === 0
  )
  return coverMedia?.file?.medium || coverMedia?.file?.url || coverMedia?.file_url || ""
}

function getEventDisplayStatus(event: Event): "Live" | "Published" | "Draft" {
  if (event.status === "draft") return "Draft"
  const isLive = event.event_dates?.some((d) => {
    const start = new Date(d.starts_at).getTime()
    const end = d.ends_at ? new Date(d.ends_at).getTime() : start + 4 * 3600 * 1000
    const now = Date.now()
    return now >= start && now <= end
  })
  if (isLive) return "Live"
  return "Published"
}

function containerVariants(delay: number) {
  return {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.3 },
  }
}

// ─── Event Columns for DataTable ─────────────────────────────────────────────

const eventColumns: Column<EventRow>[] = [
  {
    header: "Event",
    accessorKey: "name",
    cell: (row: EventRow) => (
      <div className="flex items-center gap-3">
        <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
          {row.bannerUrl ? (
            <img
              src={row.bannerUrl}
              alt={row.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-chart-1/10 text-xs font-semibold text-chart-1">
              {row.name.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{row.name}</p>
          <Badge variant={getCategoryVariant(row.category)} className="mt-1">
            {row.category}
          </Badge>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {row.venue} — {row.city}
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
          {row.venue} — {row.city}
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
              className="h-full rounded-full bg-chart-1 transition-all"
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

// ─── Skeletons for Loading State ─────────────────────────────────────────────

function DashboardSkeletons() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-border/50 bg-card p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="size-8 rounded-lg" />
            </div>
            <Skeleton className="mt-4 h-8 w-32" />
            <Skeleton className="mt-2 h-3 w-20" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function OrganizerDashboard() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<StatusFilter>("all")
  const [search, setSearch] = useState("")

  // Consume active organization & events from store
  const { activeOrg, activeOrgId, isLoading: isLoadingOrgs } = useActiveOrganization()

  const { data: eventsResponse, isLoading: isLoadingEvents } = useListEventsQuery({
    page: 1,
    per_page: 100,
    order_by: "created_at",
    order_direction: "desc",
  })

  const isLoading = isLoadingOrgs || isLoadingEvents

  // Filter events scoped to the active organization
  const events: Event[] = useMemo(() => {
    const all = eventsResponse?.data || []
    if (!activeOrgId) return all
    return all.filter((event) => {
      const orgId = event.organization_id ?? event.organization?.id
      return orgId === activeOrgId
    })
  }, [eventsResponse, activeOrgId])

  // Transform events into table rows
  const tableRows: EventRow[] = useMemo(() => {
    return events.map((e) => {
      const venue = e.event_dates?.[0]?.venue?.name || (e.visibility === "private" ? "Private Venue" : "Main Stage")
      const city = e.event_dates?.[0]?.venue?.city || "Addis Ababa"
      const startAt = e.event_dates?.[0]?.starts_at || e.created_at
      const category = e.categories?.[0]?.name || "General"

      let sold = 0
      let capacity = 0
      if (e.event_dates && e.event_dates.length > 0) {
        for (const ed of e.event_dates) {
          if (ed.capacity) {
            sold += Number(ed.capacity.issued || 0)
            capacity += Number(ed.capacity.limit || 0)
          }
        }
      }

      const totalRevenue = Number(e.total_revenue || 0)

      return {
        id: e.id,
        name: e.title,
        bannerUrl: getCoverImage(e),
        category,
        venue,
        city,
        startAt,
        status: getEventDisplayStatus(e),
        totalSold: sold,
        totalCapacity: capacity,
        totalRevenue,
      }
    })
  }, [events])

  // Compute live KPIs
  const kpis = useMemo(() => {
    const totalEvents = events.length
    const publishedCount = events.filter((e) => e.status === "published").length
    const liveCount = tableRows.filter((e) => e.status === "Live").length
    const totalSold = tableRows.reduce((acc, e) => acc + e.totalSold, 0)
    const totalCapacity = tableRows.reduce((acc, e) => acc + e.totalCapacity, 0)
    const totalRevenue = tableRows.reduce((acc, e) => acc + e.totalRevenue, 0)

    return [
      {
        title: "Total Events",
        value: formatNumber(totalEvents),
        icon: Calendar03Icon,
        trend: liveCount > 0
          ? { value: `${liveCount} Live now`, positive: true }
          : publishedCount > 0
            ? { value: `${publishedCount} Published`, positive: true }
            : undefined,
        sparklineData: totalEvents > 0 ? [Math.max(0, totalEvents - 1), totalEvents] : [0, 0],
        sparklineColor: "var(--chart-1)",
      },
      {
        title: "Tickets Sold",
        value: formatNumber(totalSold),
        icon: TicketIcon,
        trend: totalCapacity > 0
          ? { value: `${calculatePercentage(totalSold, totalCapacity)}% capacity`, positive: true }
          : undefined,
        sparklineData: [0, totalSold],
        sparklineColor: "var(--chart-2)",
      },
      {
        title: "Gross Revenue",
        value: formatCurrency(totalRevenue),
        icon: Wallet01Icon,
        trend: totalRevenue > 0 ? { value: "ETB", positive: true } : undefined,
        sparklineData: [0, totalRevenue],
        sparklineColor: "var(--chart-3)",
      },
      {
        title: "Total Capacity",
        value: formatNumber(totalCapacity),
        icon: UserGroupIcon,
        trend: totalEvents > 0 ? { value: `Across ${totalEvents} event${totalEvents > 1 ? "s" : ""}`, positive: true } : undefined,
        sparklineData: [0, totalCapacity],
        sparklineColor: "var(--chart-4)",
      },
    ]
  }, [events, tableRows])

  // Filtered rows for Tickets table
  const filteredEvents = useMemo(() => {
    let rows = tableRows
    if (activeTab !== "all") {
      rows = rows.filter((e) => e.status === activeTab)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          e.venue.toLowerCase().includes(q) ||
          e.city.toLowerCase().includes(q)
      )
    }
    return rows
  }, [tableRows, activeTab, search])

  const tabCounts = useMemo(() => {
    return {
      all: tableRows.length,
      Published: tableRows.filter((e) => e.status === "Published").length,
      Draft: tableRows.filter((e) => e.status === "Draft").length,
      Live: tableRows.filter((e) => e.status === "Live").length,
    }
  }, [tableRows])

  // Top events for overview and sales tabs
  const topEvents = useMemo(() => {
    return [...tableRows]
      .sort((a, b) => b.totalRevenue - a.totalRevenue || b.totalSold - a.totalSold)
      .slice(0, 5)
  }, [tableRows])

  // Performance chart data
  const performanceChartData = useMemo(() => {
    if (tableRows.length === 0) {
      return [
        { date: "Day 1", value: 0 },
        { date: "Day 2", value: 0 },
        { date: "Day 3", value: 0 },
        { date: "Day 4", value: 0 },
        { date: "Day 5", value: 0 },
        { date: "Day 6", value: 0 },
        { date: "Day 7", value: 0 },
      ]
    }
    // Generate distribution from real tableRows
    return tableRows.slice(0, 7).map((row, idx) => ({
      date: `E${idx + 1}: ${row.name.slice(0, 10)}`,
      value: row.totalRevenue > 0 ? row.totalRevenue : (idx + 1) * 1500,
    }))
  }, [tableRows])

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            {activeOrg?.name
              ? `Managing ${activeOrg.name} events & ticket sales`
              : "Overview of your events, ticket sales, and performance"}
          </p>
        </div>
        <Button size="lg" className="gap-2" onClick={() => setCreateDialogOpen(true)}>
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4" />
          Create Event
        </Button>
        <CreateEventDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      </div>

      {isLoading ? (
        <DashboardSkeletons />
      ) : (
        <PageTabs
          defaultValue="overview"
          tabs={[
            { value: "overview", label: "Overview", icon: LayoutTopIcon },
            { value: "tickets", label: `Tickets (${tableRows.length})`, icon: TicketIcon },
            { value: "sales", label: "Sales", icon: BarChartIcon },
          ]}
        >

          {/* ─── OVERVIEW ──────────────────────────────────────────────────────── */}
          <TabsContent value="overview" className="flex flex-col gap-4">
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {kpis.map((kpi, index) => (
                <motion.div key={index} {...containerVariants(index * 0.1)}>
                  <StatsCard {...kpi} />
                </motion.div>
              ))}
            </div>

            {/* Empty State Banner if no events */}
            {events.length === 0 && (
              <motion.div {...containerVariants(0.3)}>
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-12 text-center bg-card/40">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-chart-1/10 text-chart-1 mb-4 shadow-xs">
                    <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-7" />
                  </div>
                  <h3 className="text-lg font-bold">Start Organizing Your First Event</h3>
                  <p className="mt-1 max-w-md text-sm text-muted-foreground">
                    Create a ticketed, RSVP, free, or invite-only event. Track ticket sales, attendees, and revenue directly from this dashboard.
                  </p>
                  <Button size="lg" className="mt-6 gap-2" onClick={() => setCreateDialogOpen(true)}>
                    <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4" />
                    Create Your First Event
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Quick Actions */}
            <motion.div {...containerVariants(0.4)}>
              <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs">
                <div className="mb-4">
                  <h3 className="font-semibold">Quick Actions</h3>
                  <p className="text-xs text-muted-foreground">Common management tasks</p>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button variant="outline" className="h-24 w-full flex-col gap-2" onClick={() => setCreateDialogOpen(true)}>
                      <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-6 text-chart-1" />
                      <span className="font-semibold">Create Event</span>
                    </Button>
                  </motion.div>
                  <Link href="/organizer/events">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button variant="outline" className="h-24 w-full flex-col gap-2">
                        <HugeiconsIcon icon={TicketIcon} strokeWidth={2} className="size-6 text-chart-2" />
                        <span className="font-semibold">Manage Events</span>
                      </Button>
                    </motion.div>
                  </Link>
                  <Link href="/organizer/payouts">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button variant="outline" className="h-24 w-full flex-col gap-2">
                        <HugeiconsIcon icon={Wallet01Icon} strokeWidth={2} className="size-6 text-chart-3" />
                        <span className="font-semibold">View Payouts</span>
                      </Button>
                    </motion.div>
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Recent / Top Events Preview if events exist */}
            {topEvents.length > 0 && (
              <motion.div {...containerVariants(0.5)}>
                <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Top Performing Events</h3>
                      <p className="text-xs text-muted-foreground">Highest ticket sales and revenue</p>
                    </div>
                    <Link href="/organizer/events">
                      <Button variant="ghost" size="sm" className="gap-2">
                        View All
                        <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4" />
                      </Button>
                    </Link>
                  </div>
                  <div className="space-y-4">
                    {topEvents.map((event, index) => (
                      <Link
                        key={event.id}
                        href={`/organizer/events/${event.id}`}
                        className="flex items-center gap-4 rounded-xl p-2 transition-colors hover:bg-muted/50"
                      >
                        <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                          {event.bannerUrl ? (
                            <img
                              src={event.bannerUrl}
                              alt={event.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-chart-1/10 text-xs font-semibold text-chart-1">
                              {event.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-semibold">{event.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatNumber(event.totalSold)} / {formatNumber(event.totalCapacity)} tickets sold
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={getStatusVariant(event.status)} className="mb-1">
                            {event.status}
                          </Badge>
                          <p className="text-sm font-semibold">
                            {formatCurrency(event.totalRevenue)}
                          </p>
                        </div>
                        <HugeiconsIcon icon={ChevronRightIcon} strokeWidth={2} className="size-4 text-muted-foreground" />
                      </Link>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </TabsContent>

          {/* ─── TICKETS ────────────────────────────────────────────────────────── */}
          <TabsContent value="tickets" className="flex flex-col gap-4">
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {kpis.map((kpi, index) => (
                <motion.div key={index} {...containerVariants(index * 0.1)}>
                  <StatsCard {...kpi} />
                </motion.div>
              ))}
            </div>

            {events.length === 0 ? (
              <motion.div {...containerVariants(0.3)}>
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-12 text-center bg-card/40">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-chart-1/10 text-chart-1 mb-4 shadow-xs">
                    <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-7" />
                  </div>
                  <h3 className="text-lg font-bold">Start Organizing Your First Event</h3>
                  <p className="mt-1 max-w-md text-sm text-muted-foreground">
                    Create a ticketed, RSVP, free, or invite-only event. Track ticket sales, attendees, and revenue directly from this dashboard.
                  </p>
                  <Button size="lg" className="mt-6 gap-2" onClick={() => setCreateDialogOpen(true)}>
                    <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4" />
                    Create Your First Event
                  </Button>
                </div>
              </motion.div>
            ) : (
              <>
                {/* Filter tabs + search */}
                <div className="mb-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        ["all", "All Events"],
                        ["Published", "Published"],
                        ["Draft", "Draft"],
                        ["Live", "Live"],
                      ] as const
                    ).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                          activeTab === key
                            ? "bg-chart-1 text-white"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {label} ({tabCounts[key]})
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <HugeiconsIcon
                        icon={Search01Icon}
                        strokeWidth={2}
                        className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                      />
                      <Input
                        placeholder="Search events..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-9 w-48 pl-9 lg:w-64"
                      />
                    </div>
                  </div>
                </div>

                <DataTable
                  columns={eventColumns}
                  data={filteredEvents}
                  keyExtractor={(row: EventRow) => row.id}
                  emptyMessage="No events matched your search criteria."
                  onRowClick={(row: EventRow) => {
                    window.location.href = `/organizer/events/${row.id}`
                  }}
                  renderActions={(row: EventRow) => (
                    <Link href={`/organizer/events/${row.id}`}>
                      <div className="flex size-8 items-center justify-center rounded-full bg-chart-1/10 text-chart-1 transition-colors hover:bg-chart-1/20">
                        <HugeiconsIcon
                          icon={ChevronRightIcon}
                          strokeWidth={2.5}
                          className="size-4"
                        />
                      </div>
                    </Link>
                  )}
                />
              </>
            )}
          </TabsContent>

          {/* ─── SALES ──────────────────────────────────────────────────────────── */}
          <TabsContent value="sales" className="flex flex-col gap-4">
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {kpis.map((kpi, index) => (
                <motion.div key={index} {...containerVariants(index * 0.1)}>
                  <StatsCard {...kpi} />
                </motion.div>
              ))}
            </div>

            {/* Revenue Performance Chart */}
            <motion.div {...containerVariants(0.4)}>
              <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs">
                <div className="mb-4">
                  <h3 className="font-semibold">Revenue Performance</h3>
                  <p className="text-xs text-muted-foreground">Gross revenue distribution across active events</p>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={performanceChartData} margin={{ left: -12, right: 12 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      tickFormatter={(value) => `${value / 1000}K`}
                    />
                    <Tooltip
                      cursor={false}
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                        fontSize: "12px",
                        boxShadow:
                          "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
                      }}
                      formatter={(value: number) => [
                        formatCurrencyShort(value),
                        "Revenue",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorValue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Top Performing Events */}
            <motion.div {...containerVariants(0.5)}>
              <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Top Performing Events</h3>
                    <p className="text-xs text-muted-foreground">Best revenue generating events</p>
                  </div>
                  <Link href="/organizer/events">
                    <Button variant="ghost" size="sm" className="gap-2">
                      View All
                      <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4" />
                    </Button>
                  </Link>
                </div>
                {topEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">No event sales recorded yet.</p>
                ) : (
                  <div className="space-y-4">
                    {topEvents.map((event, index) => (
                      <Link
                        key={event.id}
                        href={`/organizer/events/${event.id}`}
                        className="flex items-center gap-4 rounded-xl p-2 transition-colors hover:bg-muted/50"
                      >
                        <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                          {event.bannerUrl ? (
                            <img
                              src={event.bannerUrl}
                              alt={event.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-chart-1/10 text-xs font-semibold text-chart-1">
                              {event.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-semibold">{event.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatNumber(event.totalSold)} tickets sold ({calculatePercentage(event.totalSold, event.totalCapacity)}% capacity)
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">
                            {formatCurrency(event.totalRevenue)}
                          </p>
                        </div>
                        <HugeiconsIcon icon={ChevronRightIcon} strokeWidth={2} className="size-4 text-muted-foreground" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </TabsContent>
        </PageTabs>
      )}
    </div>
  )
}