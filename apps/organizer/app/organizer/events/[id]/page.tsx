"use client"

import { use, useState } from "react"
import { motion } from "framer-motion"
import { notFound } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { DataTable, type Column } from "@/components/ui/data-table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { HugeiconsIcon } from "@hugeicons/react"
import type { HugeiconsIconProps } from "@hugeicons/react"
import {
  TicketIcon,
  Edit01Icon,
  Wallet01Icon,
  UserGroupIcon,
  Ticket01Icon,
  Share01Icon,
  ChartBarLineIcon,
  BarChartIcon,
  GlobeIcon,
  Store01Icon,
  LayoutTopIcon,
} from "@hugeicons/core-free-icons"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { StatsGrid } from "@/components/dashboard/stats-grid"
import { sampleEvents } from "@/lib/sample-data"
import { formatDate, formatCurrency, formatCurrencyShort, formatNumber, calculatePercentage } from "@/lib/utils"
import { ShareEventDialog } from "@/organizer-components/events/share-event-dialog"

interface EventDetailPageProps {
  params: Promise<{
    id: string
  }>
}

// ─── Analytics data config ──────────────────────────────────────────────────

const SALE_CHANNELS: {
  name: string
  icon: HugeiconsIconProps["icon"]
  weight: number
}[] = [
  { name: "Online", icon: GlobeIcon, weight: 0.62 },
  { name: "At Gate", icon: Ticket01Icon, weight: 0.23 },
  { name: "Resellers", icon: Store01Icon, weight: 0.15 },
]

/** Percentage of total sales/revenue per day (last 7 days). */
const SALES_WEIGHTS = [6, 10, 14, 18, 22, 16, 14]

type ChannelRow = {
  name: string
  icon: HugeiconsIconProps["icon"]
  tickets: number
  share: number
  revenue: number
}

// ─── Sales & Revenue Chart Tooltip ───────────────────────────────────────────

function SalesTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{
    dataKey?: string
    value?: number
    color?: string
  }>
  label?: string
}) {
  if (!active || !payload?.length) return null

  const items = payload.filter(
    (item) => item.dataKey === "sales" || item.dataKey === "revenue"
  )

  return (
    <div className="grid min-w-32 items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
      <div className="font-medium">{label}</div>
      <div className="grid gap-1.5">
        {items.map((item) => {
          const isSales = item.dataKey === "sales"
          return (
            <div key={item.dataKey} className="flex w-full items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex flex-1 items-center justify-between gap-4">
                <span className="text-muted-foreground">
                  {isSales ? "Tickets sold" : "Revenue"}
                </span>
                <span className="font-mono font-medium text-foreground tabular-nums">
                  {isSales
                    ? formatNumber(Number(item.value))
                    : formatCurrency(Number(item.value))}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = use(params)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const event = sampleEvents.find((e) => e.id === id)

  if (!event) {
    notFound()
  }

  const totalTickets = event.tiers.reduce((sum, tier) => sum + tier.total, 0)
  const soldTickets = event.tiers.reduce((sum, tier) => sum + tier.sold, 0)
  const totalRevenue = event.tiers.reduce(
    (sum, tier) => sum + tier.sold * tier.price,
    0
  )
  const remainingTickets = totalTickets - soldTickets
  const sellThrough = calculatePercentage(soldTickets, totalTickets)

  const statsCards = [
    {
      key: "tickets-sold",
      title: "Tickets Sold",
      value: formatNumber(soldTickets),
      icon: TicketIcon,
      trend: { value: `${sellThrough}%`, positive: true },
      sparklineData: [40, 80, 120, 160, 200, 240, soldTickets],
      sparklineColor: "var(--chart-1)",
    },
    {
      key: "revenue",
      title: "Revenue",
      value: formatCurrency(totalRevenue),
      icon: Wallet01Icon,
      trend: { value: "+18%", positive: true },
      sparklineData: [120, 160, 200, 240, 280, 320, totalRevenue / 1000],
      sparklineColor: "var(--chart-2)",
    },
    {
      key: "total-capacity",
      title: "Total Capacity",
      value: formatNumber(totalTickets),
      icon: UserGroupIcon,
      sparklineData: [2200, 2400, 2600, 2700, 2800, 2900, totalTickets],
      sparklineColor: "var(--chart-3)",
    },
    {
      key: "remaining",
      title: "Tickets Remaining",
      value: formatNumber(remainingTickets),
      icon: Ticket01Icon,
      sparklineData: [360, 320, 280, 240, 200, 160, remainingTickets],
      sparklineColor: "var(--chart-4)",
    },
  ]

  // Sales & revenue overview (7 days leading up to the event start)
  const salesOverviewData = SALES_WEIGHTS.map((weight, index) => {
    const date = new Date(event.startAt)
    date.setDate(date.getDate() - (SALES_WEIGHTS.length - 1 - index))
    return {
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      sales: Math.round((soldTickets * weight) / 100),
      revenue: Math.round((totalRevenue * weight) / 100),
    }
  })

  // Sale channel breakdown
  const saleChannelRows: ChannelRow[] = SALE_CHANNELS.map((channel) => ({
    name: channel.name,
    icon: channel.icon,
    tickets: Math.round(soldTickets * channel.weight),
    share: Math.round(channel.weight * 100),
    revenue: Math.round(totalRevenue * channel.weight),
  }))

  // Ticket tier rows for DataTable
  type TierRow = {
    id: string
    name: string
    price: number
    sold: number
    total: number
    remaining: number
    revenue: number
    sellThrough: number
  }

  const tierRows: TierRow[] = event.tiers.map((tier) => ({
    id: tier.id,
    name: tier.name,
    price: tier.price,
    sold: tier.sold,
    total: tier.total,
    remaining: tier.total - tier.sold,
    revenue: tier.sold * tier.price,
    sellThrough: calculatePercentage(tier.sold, tier.total),
  }))

  const tierColumns: Column<TierRow>[] = [
    {
      header: "Tier",
      accessorKey: "name",
      cell: (row) => (
        <div>
          <p className="font-semibold">{row.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(row.price)} per ticket
          </p>
        </div>
      ),
      sortable: true,
    },
    {
      header: "Sold / Total",
      cell: (row) => (
        <div>
          <p className="font-medium">
            {formatNumber(row.sold)} / {formatNumber(row.total)}
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-lime-500 transition-all"
                style={{ width: `${row.sellThrough}%` }}
              />
            </div>
            <span className="whitespace-nowrap text-xs text-muted-foreground">
              {row.sellThrough}%
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Remaining",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Badge variant={row.remaining === 0 ? "secondary" : "outline"} className="text-xs">
            {formatNumber(row.remaining)} left
          </Badge>
        </div>
      ),
    },
    {
      header: "Revenue",
      cell: (row) => (
        <div>
          <p className="font-semibold">{formatCurrency(row.revenue)}</p>
          <p className="text-xs text-muted-foreground">
            from {formatNumber(row.sold)} sales
          </p>
        </div>
      ),
    },
  ]

  const channelColumns: Column<ChannelRow>[] = [
    {
      header: "Channel",
      accessorKey: "name",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-lime-500/10 text-lime-500">
            <HugeiconsIcon icon={row.icon} strokeWidth={2} className="size-4" />
          </div>
          <span className="font-medium">{row.name}</span>
        </div>
      ),
    },
    {
      header: "Tickets sold",
      cell: (row) => <span className="font-medium">{formatNumber(row.tickets)}</span>,
    },
    {
      header: "Share",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-2 w-28 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-lime-500"
              style={{ width: `${row.share}%` }}
            />
          </div>
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            {row.share}%
          </span>
        </div>
      ),
    },
    {
      header: "Revenue",
      cell: (row) => <p className="font-semibold">{formatCurrency(row.revenue)}</p>,
    },
  ]

  const getStatusColor = (status: typeof event.status) => {
    switch (status) {
      case "Live":
        return "bg-chart-1/10 text-chart-1 dark:bg-chart-1/20 dark:text-chart-1"
      case "Published":
        return "bg-chart-2/10 text-chart-2 dark:bg-chart-2/20 dark:text-chart-2"
      case "Draft":
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-start gap-4"
      >
        <div className="relative size-20 overflow-hidden rounded-lg">
          <Image
            src={event.bannerUrl}
            alt={event.name}
            fill
            className="object-cover object-top"
            placeholder="empty"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Badge className={getStatusColor(event.status)}>{event.status}</Badge>
            <span className="text-sm text-muted-foreground">{formatNumber(soldTickets)}/{formatNumber(totalTickets)} sold</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{event.name}</h1>
          <p className="text-sm text-muted-foreground">{formatDate(event.startAt)} · {event.venue}, {event.city}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <HugeiconsIcon icon={TicketIcon} strokeWidth={2} className="size-4" />
            Gift tickets
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setShareDialogOpen(true)}>
            <HugeiconsIcon icon={Share01Icon} strokeWidth={2} className="size-4" />
            Share
          </Button>
          <Button size="sm" className="gap-2">
            <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} className="size-4" />
            View event page
          </Button>
        </div>
      </motion.div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">
            <HugeiconsIcon icon={LayoutTopIcon} strokeWidth={2} className="size-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <HugeiconsIcon icon={ChartBarLineIcon} strokeWidth={2} className="size-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="tickets">
            <HugeiconsIcon icon={Ticket01Icon} strokeWidth={2} className="size-4" />
            Tickets
          </TabsTrigger>
          <TabsTrigger value="sales">
            <HugeiconsIcon icon={BarChartIcon} strokeWidth={2} className="size-4" />
            Sales
          </TabsTrigger>
        </TabsList>

        {/* ─── OVERVIEW TAB ──────────────────────────────────────────────────── */}
        <TabsContent value="overview" className="flex flex-col gap-4">
          {/* Top Analytics */}
          <StatsGrid cards={statsCards} />

          <div className="grid gap-6 md:grid-cols-2">
            {/* Ticket Tiers */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="flex flex-col gap-2"
            >
              <div>
                <h3 className="font-semibold">Ticket tiers</h3>
                <p className="text-sm text-muted-foreground">Inventory and pricing overview.</p>
              </div>
              <DataTable
                columns={tierColumns}
                data={tierRows}
                keyExtractor={(row) => row.id}
                emptyMessage="No ticket tiers found."
              />
            </motion.div>

            {/* Quick Stats Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                  <p className="text-sm text-muted-foreground">Event performance at a glance.</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Revenue</span>
                      <span className="text-lg font-bold">{formatCurrency(totalRevenue)}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Sell-through Rate</span>
                      <span className="text-lg font-bold">{sellThrough}%</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Average Ticket Price</span>
                      <span className="text-lg font-bold">
                        {formatCurrency(totalRevenue / soldTickets)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Event Capacity</span>
                      <span className="text-lg font-bold">{formatNumber(totalTickets)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        {/* ─── ANALYTICS TAB ─────────────────────────────────────────────────── */}
        <TabsContent value="analytics" className="flex flex-col gap-4">
          <StatsGrid cards={statsCards} />

          {/* Sales & Revenue Overview - full row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HugeiconsIcon icon={ChartBarLineIcon} strokeWidth={2} className="size-5" />
                  Sales & revenue overview
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Ticket sales and revenue over the last 7 days
                </p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={salesOverviewData} margin={{ left: -12, right: 12 }}>
                    <defs>
                      <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
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
                      yAxisId="sales"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      tickFormatter={(value) => formatNumber(value)}
                    />
                    <YAxis
                      yAxisId="revenue"
                      orientation="right"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      tickFormatter={(value) => formatCurrencyShort(value)}
                    />
                    <Tooltip cursor={false} content={<SalesTooltip />} />
                    <Area
                      yAxisId="sales"
                      type="monotone"
                      dataKey="sales"
                      name="Tickets sold"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#salesGradient)"
                    />
                    <Area
                      yAxisId="revenue"
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#revenueGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>

                {/* Legend */}
                <div className="flex items-center justify-center gap-4 pt-3">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 shrink-0 rounded-[2px] bg-chart-1"
                    />
                    <span className="text-xs">Tickets sold</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 shrink-0 rounded-[2px] bg-chart-2"
                    />
                    <span className="text-xs">Revenue</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ─── TICKETS TAB ───────────────────────────────────────────────────── */}
        <TabsContent value="tickets" className="flex flex-col gap-4">
          <StatsGrid cards={statsCards} />

          {/* Ticket Tiers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="flex flex-col gap-2"
          >
            <div>
              <h3 className="font-semibold">Ticket tiers</h3>
              <p className="text-sm text-muted-foreground">Inventory and pricing overview.</p>
            </div>
            <DataTable
              columns={tierColumns}
              data={tierRows}
              keyExtractor={(row) => row.id}
              emptyMessage="No ticket tiers found."
            />
          </motion.div>
        </TabsContent>

        {/* ─── SALES TAB ─────────────────────────────────────────────────────── */}
        <TabsContent value="sales" className="flex flex-col gap-4">
          <StatsGrid cards={statsCards} />

          {/* Sale Channel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="flex flex-col gap-2"
          >
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={BarChartIcon} strokeWidth={2} className="size-5" />
              <h3 className="font-semibold">Sale channel</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Where your tickets are being sold.
            </p>
            <DataTable
              columns={channelColumns}
              data={saleChannelRows}
              keyExtractor={(row) => row.name}
              emptyMessage="No sales channels found."
            />
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Social Share Card Dialog */}
      <ShareEventDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        event={event}
      />
    </div>
  )
}
