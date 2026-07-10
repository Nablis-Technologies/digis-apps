"use client"

import { useEffect, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  UserGroupIcon,
  Building01Icon,
  MusicNote01Icon,
  OfficeIcon,
  RefreshIcon,
} from "@hugeicons/core-free-icons"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { StatsCard, StatsCardSkeleton } from "@/components/dashboard/stats-card"
import { Skeleton } from "@/components/ui/skeleton"

// ─── Mock Data ──────────────────────────────────────────────────────────────

const mockStats = {
  totalUsers: 2483,
  userTrend: { value: "12.5%", positive: true },
  totalOrganizations: 156,
  orgTrend: { value: "8.3%", positive: true },
  totalVenues: 342,
  venueTrend: { value: "5.7%", positive: true },
  totalArtists: 891,
  artistTrend: { value: "18.2%", positive: true },
}

const mockGrowthData = [
  { month: "Jan", users: 400, organizations: 24, venues: 50, artists: 120 },
  { month: "Feb", users: 600, organizations: 35, venues: 78, artists: 180 },
  { month: "Mar", users: 850, organizations: 48, venues: 110, artists: 260 },
  { month: "Apr", users: 1100, organizations: 62, venues: 145, artists: 340 },
  { month: "May", users: 1400, organizations: 78, venues: 180, artists: 450 },
  { month: "Jun", users: 1750, organizations: 95, venues: 220, artists: 560 },
  { month: "Jul", users: 2100, organizations: 115, venues: 265, artists: 700 },
  { month: "Aug", users: 2483, organizations: 156, venues: 342, artists: 891 },
]

const mockResources = [
  {
    name: "Active",
    users: 2100,
    organizations: 120,
    venues: 280,
    artists: 750,
  },
  { name: "Pending", users: 250, organizations: 28, venues: 45, artists: 110 },
  { name: "Inactive", users: 133, organizations: 8, venues: 17, artists: 31 },
]

const mockRecentActivity = [
  {
    id: "1",
    type: "user" as const,
    action: "joined",
    name: "Abebe Kebede",
    detail: "New user registration",
    time: "2 minutes ago",
  },
  {
    id: "2",
    type: "organization" as const,
    action: "created",
    name: "Ethio Events PLC",
    detail: "Organization created",
    time: "15 minutes ago",
  },
  {
    id: "3",
    type: "venue" as const,
    action: "added",
    name: "Millennium Hall",
    detail: "New venue added",
    time: "1 hour ago",
  },
  {
    id: "4",
    type: "artist" as const,
    action: "verified",
    name: "Teddy Afro",
    detail: "Artist verified",
    time: "2 hours ago",
  },
  {
    id: "5",
    type: "organization" as const,
    action: "verified",
    name: "Nabis Entertainment",
    detail: "Organization verified",
    time: "3 hours ago",
  },
  {
    id: "6",
    type: "user" as const,
    action: "joined",
    name: "Meron Tadesse",
    detail: "New user registration",
    time: "5 hours ago",
  },
]

// ─── Chart Configs ──────────────────────────────────────────────────────────

const growthChartConfig = {
  users: {
    label: "Users",
    color: "oklch(0.623 0.214 259.815)",
  },
  organizations: {
    label: "Orgs",
    color: "oklch(0.769 0.188 70.08)",
  },
  venues: {
    label: "Venues",
    color: "oklch(0.792 0.209 151.711)",
  },
  artists: {
    label: "Artists",
    color: "oklch(0.656 0.241 303.495)",
  },
}

const resourceChartConfig = {
  users: {
    label: "Users",
    color: "oklch(0.623 0.214 259.815)",
  },
  organizations: {
    label: "Orgs",
    color: "oklch(0.769 0.188 70.08)",
  },
  venues: {
    label: "Venues",
    color: "oklch(0.792 0.209 151.711)",
  },
  artists: {
    label: "Artists",
    color: "oklch(0.656 0.241 303.495)",
  },
}

// ─── Activity Icon ──────────────────────────────────────────────────────────

function ActivityIcon({ type }: { type: string }) {
  const map: Record<string, string> = {
    user: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
    organization:
      "bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400",
    venue:
      "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
    artist:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  }
  const label: Record<string, string> = {
    user: "U",
    organization: "O",
    venue: "V",
    artist: "A",
  }
  return (
    <div
      className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${map[type] ?? "bg-muted text-muted-foreground"}`}
    >
      {label[type] ?? "?"}
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [loading, setLoading] = useState(false)

  // ── Loading State ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatsCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-7">
          <div className="lg:col-span-4">
            <Skeleton className="h-[350px] w-full rounded-xl" />
          </div>
          <div className="lg:col-span-3">
            <Skeleton className="h-[350px] w-full rounded-xl" />
          </div>
        </div>
        <Skeleton className="h-[300px] w-full rounded-xl" />
      </div>
    )
  }

  // ── Rendered Dashboard ────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Platform overview and analytics
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-border/50 bg-card px-4 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-accent"
        >
          <HugeiconsIcon
            icon={RefreshIcon}
            strokeWidth={2}
            className="size-4"
          />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={mockStats.totalUsers.toLocaleString()}
          icon={UserGroupIcon}
          trend={mockStats.userTrend}
          sparklineData={[1800, 2000, 2100, 2200, 2300, 2400, 2483]}
          sparklineColor="var(--chart-1)"
        />
        <StatsCard
          title="Organizations"
          value={mockStats.totalOrganizations.toLocaleString()}
          icon={OfficeIcon}
          trend={mockStats.orgTrend}
          sparklineData={[110, 118, 125, 132, 140, 148, 156]}
          sparklineColor="var(--chart-2)"
        />
        <StatsCard
          title="Venues"
          value={mockStats.totalVenues.toLocaleString()}
          icon={Building01Icon}
          trend={mockStats.venueTrend}
          sparklineData={[260, 275, 290, 305, 320, 330, 342]}
          sparklineColor="var(--chart-3)"
        />
        <StatsCard
          title="Artists"
          value={mockStats.totalArtists.toLocaleString()}
          icon={MusicNote01Icon}
          trend={mockStats.artistTrend}
          sparklineData={[600, 650, 700, 750, 800, 850, 891]}
          sparklineColor="var(--chart-4)"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Area Chart — Growth Over Time */}
        <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs lg:col-span-4">
          <div className="mb-4">
            <h3 className="font-semibold">Growth Over Time</h3>
            <p className="text-xs text-muted-foreground">
              Cumulative registrations across all resource types
            </p>
          </div>
          <ChartContainer
            config={growthChartConfig}
            className="h-[280px] w-full"
          >
            <AreaChart data={mockGrowthData} margin={{ left: -12, right: 12 }}>
              <defs>
                <linearGradient id="gradient-users" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.623 0.214 259.815)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.623 0.214 259.815)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradient-organizations" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.769 0.188 70.08)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.769 0.188 70.08)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradient-venues" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.792 0.209 151.711)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.792 0.209 151.711)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradient-artists" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.656 0.241 303.495)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.656 0.241 303.495)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <Area
                type="monotone"
                dataKey="users"
                stroke="oklch(0.623 0.214 259.815)"
                fill="url(#gradient-users)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="organizations"
                stroke="oklch(0.769 0.188 70.08)"
                fill="url(#gradient-organizations)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="venues"
                stroke="oklch(0.792 0.209 151.711)"
                fill="url(#gradient-venues)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="artists"
                stroke="oklch(0.656 0.241 303.495)"
                fill="url(#gradient-artists)"
                strokeWidth={2}
              />
              <ChartLegend
                content={<ChartLegendContent className="flex-wrap gap-3" />}
              />
            </AreaChart>
          </ChartContainer>
        </div>

        {/* Bar Chart — Resource Distribution */}
        <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs lg:col-span-3">
          <div className="mb-4">
            <h3 className="font-semibold">Resource Distribution</h3>
            <p className="text-xs text-muted-foreground">Breakdown by status</p>
          </div>
          <ChartContainer
            config={resourceChartConfig}
            className="h-[280px] w-full"
          >
            <BarChart data={mockResources} margin={{ left: -12, right: 12 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Bar
                dataKey="users"
                fill="oklch(0.623 0.214 259.815)"
                radius={[4, 4, 0, 0]}
                barSize={24}
              />
              <Bar
                dataKey="organizations"
                fill="oklch(0.769 0.188 70.08)"
                radius={[4, 4, 0, 0]}
                barSize={24}
              />
              <Bar
                dataKey="venues"
                fill="oklch(0.792 0.209 151.711)"
                radius={[4, 4, 0, 0]}
                barSize={24}
              />
              <Bar
                dataKey="artists"
                fill="oklch(0.656 0.241 303.495)"
                radius={[4, 4, 0, 0]}
                barSize={24}
              />
              <ChartLegend
                content={<ChartLegendContent className="flex-wrap gap-3" />}
              />
            </BarChart>
          </ChartContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs">
        <div className="mb-4">
          <h3 className="font-semibold">Recent Activity</h3>
          <p className="text-xs text-muted-foreground">
            Latest actions across the platform
          </p>
        </div>
        <div className="space-y-0">
          {mockRecentActivity.map((activity, i) => (
            <div
              key={activity.id}
              className={`flex items-center gap-4 py-3 ${i < mockRecentActivity.length - 1 ? "border-b border-border/50" : ""}`}
            >
              <ActivityIcon type={activity.type} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{activity.name}</p>
                <p className="text-xs text-muted-foreground">
                  {activity.detail}
                </p>
              </div>
              <time className="shrink-0 text-xs text-muted-foreground">
                {activity.time}
              </time>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
