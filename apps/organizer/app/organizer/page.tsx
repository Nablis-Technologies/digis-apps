"use client"

import { motion } from "framer-motion"
import { StatsCard } from "@/components/dashboard/stats-card"
import { Button } from "@/components/ui/button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
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
} from "@hugeicons/core-free-icons"
import Link from "next/link"
import {
  sampleKPIs,
  sampleTopEvents,
  samplePerformanceData,
  sampleEvents,
} from "@/lib/sample-data"
import { formatCurrencyShort, formatNumber } from "@/lib/utils"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
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

const ticketTypeData = sampleEvents.flatMap((event) =>
  event.tiers.map((tier) => ({
    name: `${tier.name} - ${event.name}`,
    sold: tier.sold,
    total: tier.total,
    revenue: tier.sold * tier.price,
  }))
)

const ticketsPerEvent = sampleEvents.map((event) => {
  const totalSold = event.tiers.reduce((s, t) => s + t.sold, 0)
  const totalCapacity = event.tiers.reduce((s, t) => s + t.total, 0)
  const totalRevenue = event.tiers.reduce((s, t) => s + t.sold * t.price, 0)
  return {
    name: event.name,
    sold: totalSold,
    capacity: totalCapacity,
    revenue: totalRevenue,
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

// ─── Page ───────────────────────────────────────────────────────────────────

export default function OrganizerDashboard() {
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
        <Link href="/organizer/events/new">
          <Button size="lg" className="gap-2">
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4" />
            Create Event
          </Button>
        </Link>
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
                <Link href="/organizer/events/new">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button variant="outline" className="h-24 w-full flex-col gap-2">
                      <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-6" />
                      <span>Create Event</span>
                    </Button>
                  </motion.div>
                </Link>
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

          {/* Ticket breakdown */}
          <motion.div {...containerVariants(0.3)}>
            <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs">
              <div className="mb-4">
                <h3 className="font-semibold">Tickets Per Event</h3>
                <p className="text-xs text-muted-foreground">Sold vs capacity by event</p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ticketsPerEvent} margin={{ left: -12, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Bar
                    dataKey="sold"
                    name="Sold"
                    fill="var(--chart-2)"
                    radius={[4, 4, 0, 0]}
                    barSize={32}
                  />
                  <Bar
                    dataKey="capacity"
                    name="Capacity"
                    fill="var(--chart-3)"
                    radius={[4, 4, 0, 0]}
                    barSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Ticket type breakdown */}
          <motion.div {...containerVariants(0.4)}>
            <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs">
              <div className="mb-4">
                <h3 className="font-semibold">Ticket Type Breakdown</h3>
                <p className="text-xs text-muted-foreground">Sales by tier across all events</p>
              </div>
              <div className="space-y-3">
                {ticketTypeData.map((tier, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{tier.name}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                            style={{ width: `${(tier.sold / tier.total) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-medium">
                        {formatNumber(tier.sold)} / {formatNumber(tier.total)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrencyShort(tier.revenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
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
                <AreaChart data={samplePerformanceData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value / 1000}K`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
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