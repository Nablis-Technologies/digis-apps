"use client"

import { motion } from "framer-motion"
import { StatsCard } from "@/components/dashboard/stats-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar03Icon,
  TicketIcon,
  Wallet01Icon,
  UserGroupIcon,
  Add01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons"
import Link from "next/link"
import { sampleKPIs, sampleTopEvents, samplePerformanceData } from "@/lib/sample-data"
import { formatCurrencyShort, formatNumber } from "@/lib/utils"
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

export default function OrganizerDashboard() {
  const kpis = [
    {
      title: sampleKPIs[0].label,
      value: sampleKPIs[0].value,
      icon: Calendar03Icon,
      trend: sampleKPIs[0].change
        ? {
            value: `${sampleKPIs[0].change}%`,
            positive: sampleKPIs[0].trend === "up",
          }
        : undefined,
    },
    {
      title: sampleKPIs[1].label,
      value: sampleKPIs[1].value,
      icon: TicketIcon,
      trend: sampleKPIs[1].change
        ? {
            value: `${sampleKPIs[1].change}%`,
            positive: sampleKPIs[1].trend === "up",
          }
        : undefined,
    },
    {
      title: sampleKPIs[2].label,
      value: sampleKPIs[2].value,
      icon: Wallet01Icon,
      trend: sampleKPIs[2].change
        ? {
            value: `${sampleKPIs[2].change}%`,
            positive: sampleKPIs[2].trend === "up",
          }
        : undefined,
    },
    {
      title: sampleKPIs[3].label,
      value: sampleKPIs[3].value,
      icon: UserGroupIcon,
      trend: sampleKPIs[3].change
        ? {
            value: `${sampleKPIs[3].change}%`,
            positive: sampleKPIs[3].trend === "up",
          }
        : undefined,
    },
  ]

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

      {/* KPI Cards - Bento Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
          >
            <StatsCard {...kpi} />
          </motion.div>
        ))}
      </div>

      {/* Charts and Lists */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Performance Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <Card>
          <CardHeader>
            <CardTitle>Revenue Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={samplePerformanceData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="hsl(var(--chart-1))"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(var(--chart-1))"
                      stopOpacity={0}
                    />
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
                    `${formatCurrencyShort(value)}`,
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
          </CardContent>
        </Card>
        </motion.div>

        {/* Top Performing Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Top Performing Events</CardTitle>
            <Link href="/organizer/events">
              <Button variant="ghost" size="sm" className="gap-2">
                View All
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  strokeWidth={2}
                  className="size-4"
                />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
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
                    <p className="text-sm font-medium leading-none">
                      {event.name}
                    </p>
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
          </CardContent>
        </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.4 }}
      >
        <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/organizer/events/new">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button variant="outline" className="h-24 w-full flex-col gap-2">
                  <HugeiconsIcon
                    icon={Calendar03Icon}
                    strokeWidth={2}
                    className="size-6"
                  />
                  <span>Create Event</span>
                </Button>
              </motion.div>
            </Link>
            <Link href="/organizer/events">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button variant="outline" className="h-24 w-full flex-col gap-2">
                  <HugeiconsIcon
                    icon={TicketIcon}
                    strokeWidth={2}
                    className="size-6"
                  />
                  <span>View Tickets</span>
                </Button>
              </motion.div>
            </Link>
            <Link href="/organizer/payouts">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button variant="outline" className="h-24 w-full flex-col gap-2">
                  <HugeiconsIcon
                    icon={Wallet01Icon}
                    strokeWidth={2}
                    className="size-6"
                  />
                  <span>View Payouts</span>
                </Button>
              </motion.div>
            </Link>
          </div>
        </CardContent>
      </Card>
      </motion.div>
    </div>
  )
}
