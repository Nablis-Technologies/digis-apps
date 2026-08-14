"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { StatsCard } from "@/components/dashboard/stats-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
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
  SlidersHorizontalIcon,
  ChevronRightIcon,
} from "@hugeicons/core-free-icons"
import Link from "next/link"
import { CreateEventDialog } from "../../components/events/create-event-dialog"
import {
  sampleKPIs,
  sampleTopEvents,
  samplePerformanceData,
  sampleEvents,
} from "@/lib/sample-data"
import { formatCurrency, formatCurrencyShort, formatNumber, formatDateTime, calculatePercentage } from "@/lib/utils"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

// ─── Shared KPI config ──────────────────────────────────────────────────────

const kpis = [
  {
    title: sampleKPIs[0].label,
    value: sampleKPIs[0].value,
    icon: Calendar03Icon,
    trend: sampleKPIs[0].change
      ? { value: `${sampleKPIs[0].change}%`, positive: sampleKPIs[0].trend === "up" }
      : undefined,
    sparklineData: [18, 20, 21, 22, 23, 24, 24],
    sparklineColor: "var(--chart-1)",
  },
  {
    title: sampleKPIs[1].label,
    value: sampleKPIs[1].value,
    icon: TicketIcon,
    trend: sampleKPIs[1].change
      ? { value: `${sampleKPIs[1].change}%`, positive: sampleKPIs[1].trend === "up" }
      : undefined,
    sparklineData: [6000, 6500, 7000, 7500, 8000, 8300, 8543],
    sparklineColor: "var(--chart-2)",
  },
  {
    title: sampleKPIs[2].label,
    value: sampleKPIs[2].value,
    icon: Wallet01Icon,
    trend: sampleKPIs[2].change
      ? { value: `${sampleKPIs[2].change}%`, positive: sampleKPIs[2].trend === "up" }
      : undefined,
    sparklineData: [400, 450, 500, 550, 580, 620, 645],
    sparklineColor: "var(--chart-3)",
  },
  {
    title: sampleKPIs[3].label,
    value: sampleKPIs[3].value,
    icon: UserGroupIcon,
    trend: sampleKPIs[3].change
      ? { value: `${sampleKPIs[3].change}%`, positive: sampleKPIs[3].trend === "up" }
      : undefined,
    sparklineData: [6500, 6800, 7000, 7200, 7500, 7700, 7891],
    sparklineColor: "var(--chart-4)",
  },
]

// ─── Ticket breakdown data ──────────────────────────────────────────────────

const eventsForTable = sampleEvents.map((event) => {
  const totalSold = event.tiers.reduce((s, t) => s + t.sold, 0)
  const totalCapacity = event.tiers.reduce((s, t) => s + t.total, 0)
  const totalRevenue = event.tiers.reduce((s, t) => s + t.sold * t.price, 0)
  return {
    ...event,
    totalSold,
    totalCapacity,
    totalRevenue,
  }
})

// ─── Helpers ────────────────────────────────────────────────────────────────

function containerVariants(delay: number) {
  return {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.3 },
  }
}

// ─── Stats grid (shared) ────────────────────────────────────────────────────

function StatsGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi, index) => (
        <motion.div key={index} {...containerVariants(index * 0.1)}>
          <StatsCard {...kpi} />
        </motion.div>
      ))}
    </div>
  )
}

// ─── Tickets Table ─────────────────────────────────────────────────────────

type StatusFilter = "all" | "Published" | "Draft" | "Live"

type EventRow = (typeof eventsForTable)[number]

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

function TicketsTable() {
  const [activeTab, setActiveTab] = useState<StatusFilter>("all")
  const [search, setSearch] = useState("")

  const filteredEvents = useMemo(() => {
    let events = eventsForTable
    if (activeTab !== "all") {
      events = events.filter((e) => e.status === activeTab)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      events = events.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          e.venue.toLowerCase().includes(q) ||
          e.city.toLowerCase().includes(q)
      )
    }
    return events
  }, [activeTab, search])

  const tabCounts = useMemo(() => {
    const base = search.trim()
      ? eventsForTable.filter((e) => {
          const q = search.toLowerCase()
          return (
            e.name.toLowerCase().includes(q) ||
            e.category.toLowerCase().includes(q) ||
            e.venue.toLowerCase().includes(q) ||
            e.city.toLowerCase().includes(q)
          )
        })
      : eventsForTable
    return {
      all: base.length,
      Published: base.filter((e) => e.status === "Published").length,
      Draft: base.filter((e) => e.status === "Draft").length,
      Live: base.filter((e) => e.status === "Live").length,
    }
  }, [search])

  return (
    <motion.div {...containerVariants(0.3)}>
      {/* Filter tabs + search */}
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
          <Button variant="outline" size="sm" className="gap-2">
            <HugeiconsIcon icon={SlidersHorizontalIcon} strokeWidth={2} className="size-4" />
            Filters
          </Button>
        </div>
      </div>

      <DataTable
        columns={eventColumns}
        data={filteredEvents}
        keyExtractor={(row: EventRow) => row.id}
        emptyMessage="No events found."
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
    </motion.div>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function OrganizerDashboard() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your events
          </p>
        </div>
        <Button size="lg" className="gap-2" onClick={() => setCreateDialogOpen(true)}>
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4" />
          Create Event
        </Button>
        <CreateEventDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">
            <HugeiconsIcon icon={LayoutTopIcon} strokeWidth={2} className="size-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="tickets">
            <HugeiconsIcon icon={TicketIcon} strokeWidth={2} className="size-4" />
            Tickets
          </TabsTrigger>
          <TabsTrigger value="sales">
            <HugeiconsIcon icon={BarChartIcon} strokeWidth={2} className="size-4" />
            Sales
          </TabsTrigger>
        </TabsList>

        {/* ─── OVERVIEW ──────────────────────────────────────────────────────── */}
        <TabsContent value="overview" className="flex flex-col gap-4">
          <StatsGrid />

          {/* Quick Actions */}
          <motion.div {...containerVariants(0.5)}>
            <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs">
              <div className="mb-4">
                <h3 className="font-semibold">Quick Actions</h3>
                <p className="text-xs text-muted-foreground">Common tasks</p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button variant="outline" className="h-24 w-full flex-col gap-2" onClick={() => setCreateDialogOpen(true)}>
                    <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-6" />
                    <span>Create Event</span>
                  </Button>
                </motion.div>
                <Link href="/organizer/events">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button variant="outline" className="h-24 w-full flex-col gap-2">
                      <HugeiconsIcon icon={TicketIcon} strokeWidth={2} className="size-6" />
                      <span>View Tickets</span>
                    </Button>
                  </motion.div>
                </Link>
                <Link href="/organizer/payouts">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button variant="outline" className="h-24 w-full flex-col gap-2">
                      <HugeiconsIcon icon={Wallet01Icon} strokeWidth={2} className="size-6" />
                      <span>View Payouts</span>
                    </Button>
                  </motion.div>
                </Link>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* ─── TICKETS ────────────────────────────────────────────────────────── */}
        <TabsContent value="tickets" className="flex flex-col gap-4">
          <StatsGrid />
          <TicketsTable />
        </TabsContent>

        {/* ─── SALES ──────────────────────────────────────────────────────────── */}
        <TabsContent value="sales" className="flex flex-col gap-4">
          <StatsGrid />

          {/* Revenue Performance */}
          <motion.div {...containerVariants(0.4)}>
            <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs">
              <div className="mb-4">
                <h3 className="font-semibold">Revenue Performance</h3>
                <p className="text-xs text-muted-foreground">Monthly revenue trends</p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={samplePerformanceData} margin={{ left: -12, right: 12 }}>
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
              <div className="space-y-4">
                {sampleTopEvents.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1, duration: 0.3 }}
                    className="flex items-center gap-4"
                  >
                    <div className="relative size-12 overflow-hidden rounded-lg">
                      <div className="h-full w-full bg-muted" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{event.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatNumber(event.ticketsSold)} tickets sold
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatCurrencyShort(event.revenue)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}