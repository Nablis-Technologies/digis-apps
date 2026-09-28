"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import {
  UserGroupIcon,
  Building01Icon,
  MusicNote01Icon,
  OfficeIcon,
  RefreshIcon,
  Calendar03Icon,
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
import { useListUsersQuery } from "@workspace/store/reducers/usersApi"
import { useListOrganizationsQuery } from "@workspace/store/reducers/organizationsApi"
import { useListVenuesQuery } from "@workspace/store/reducers/venuesApi"
import { useListArtistsQuery } from "@workspace/store/reducers/artistsApi"
import { useListEventsQuery } from "@workspace/store/reducers/eventsApi"
import { useListNotificationsQuery } from "@workspace/store/reducers/notificationsApi"

function formatRelativeTime(dateString: string) {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return "just now"
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  } catch {
    return dateString
  }
}

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
  count: {
    label: "Count",
    color: "oklch(0.623 0.214 259.815)",
  },
}

function ActivityIcon({ type }: { type: string }) {
  const map: Record<string, string> = {
    users: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
    organizations:
      "bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400",
    events:
      "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
    system:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  }
  const label: Record<string, string> = {
    users: "U",
    organizations: "O",
    events: "E",
    system: "S",
  }
  return (
    <div
      className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${map[type] ?? "bg-muted text-muted-foreground"}`}
    >
      {label[type] ?? "N"}
    </div>
  )
}

export default function DashboardPage() {
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useListUsersQuery({ per_page: 1 })
  const { data: orgsData, isLoading: orgsLoading, refetch: refetchOrgs } = useListOrganizationsQuery({ per_page: 1 })
  const { data: venuesData, isLoading: venuesLoading, refetch: refetchVenues } = useListVenuesQuery({ per_page: 1 })
  const { data: artistsData, isLoading: artistsLoading, refetch: refetchArtists } = useListArtistsQuery({ per_page: 1 })
  const { data: eventsData, isLoading: eventsLoading, refetch: refetchEvents } = useListEventsQuery({ per_page: 1 })
  const { data: notifData, refetch: refetchNotifs } = useListNotificationsQuery({ per_page: 6 })

  const handleRefresh = () => {
    refetchUsers()
    refetchOrgs()
    refetchVenues()
    refetchArtists()
    refetchEvents()
    refetchNotifs()
  }

  const isLoading = usersLoading || orgsLoading || venuesLoading || artistsLoading || eventsLoading

  const totalUsers = usersData?.pagination?.total_count ?? 0
  const totalOrgs = orgsData?.pagination?.total_count ?? 0
  const totalVenues = venuesData?.pagination?.total_count ?? 0
  const totalArtists = artistsData?.pagination?.total_count ?? 0
  const totalEvents = eventsData?.pagination?.total_count ?? 0

  const resourceDistributionData = [
    { name: "Users", count: totalUsers },
    { name: "Organizations", count: totalOrgs },
    { name: "Venues", count: totalVenues },
    { name: "Artists", count: totalArtists },
    { name: "Events", count: totalEvents },
  ]

  const liveActivity = notifData?.data ?? []

  if (isLoading) {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Live platform overview and analytics
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
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
          value={totalUsers.toLocaleString()}
          icon={UserGroupIcon}
          sparklineData={[
            Math.max(0, totalUsers - 30),
            Math.max(0, totalUsers - 20),
            Math.max(0, totalUsers - 10),
            totalUsers,
          ]}
          sparklineColor="var(--chart-1)"
        />
        <StatsCard
          title="Organizations"
          value={totalOrgs.toLocaleString()}
          icon={OfficeIcon}
          sparklineData={[
            Math.max(0, totalOrgs - 5),
            Math.max(0, totalOrgs - 3),
            Math.max(0, totalOrgs - 1),
            totalOrgs,
          ]}
          sparklineColor="var(--chart-2)"
        />
        <StatsCard
          title="Venues"
          value={totalVenues.toLocaleString()}
          icon={Building01Icon}
          sparklineData={[
            Math.max(0, totalVenues - 4),
            Math.max(0, totalVenues - 2),
            totalVenues,
          ]}
          sparklineColor="var(--chart-3)"
        />
        <StatsCard
          title="Artists"
          value={totalArtists.toLocaleString()}
          icon={MusicNote01Icon}
          sparklineData={[
            Math.max(0, totalArtists - 8),
            Math.max(0, totalArtists - 4),
            totalArtists,
          ]}
          sparklineColor="var(--chart-4)"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Resource Distribution */}
        <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs lg:col-span-4">
          <div className="mb-4">
            <h3 className="font-semibold">Resource Distribution</h3>
            <p className="text-xs text-muted-foreground">
              Total registered entities across the platform
            </p>
          </div>
          <ChartContainer
            config={resourceChartConfig}
            className="h-[280px] w-full"
          >
            <BarChart data={resourceDistributionData} margin={{ left: -12, right: 12 }}>
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
                dataKey="count"
                fill="oklch(0.623 0.214 259.815)"
                radius={[4, 4, 0, 0]}
                barSize={32}
              />
            </BarChart>
          </ChartContainer>
        </div>

        {/* Live Metrics Summary */}
        <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs lg:col-span-3">
          <div className="mb-4">
            <h3 className="font-semibold">Platform Breakdown</h3>
            <p className="text-xs text-muted-foreground">Key entity proportions</p>
          </div>
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={Calendar03Icon} className="size-4 text-amber-600" />
                <span className="text-sm font-medium">Events Published</span>
              </div>
              <span className="text-sm font-semibold">{totalEvents.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={OfficeIcon} className="size-4 text-violet-600" />
                <span className="text-sm font-medium">Organizations</span>
              </div>
              <span className="text-sm font-semibold">{totalOrgs.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={Building01Icon} className="size-4 text-emerald-600" />
                <span className="text-sm font-medium">Venues Managed</span>
              </div>
              <span className="text-sm font-semibold">{totalVenues.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={MusicNote01Icon} className="size-4 text-pink-600" />
                <span className="text-sm font-medium">Artists Verified</span>
              </div>
              <span className="text-sm font-semibold">{totalArtists.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs">
        <div className="mb-4">
          <h3 className="font-semibold">Recent Platform Notifications</h3>
          <p className="text-xs text-muted-foreground">
            Latest operational events and system alerts
          </p>
        </div>
        <div className="space-y-0">
          {liveActivity.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">No recent activity</p>
          ) : (
            liveActivity.map((activity, i) => (
              <div
                key={activity.id}
                className={`flex items-center gap-4 py-3 ${i < liveActivity.length - 1 ? "border-b border-border/50" : ""}`}
              >
                <ActivityIcon type={activity.category ?? "system"} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.message}
                  </p>
                </div>
                <time className="shrink-0 text-xs text-muted-foreground">
                  {formatRelativeTime(activity.created_at)}
                </time>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
