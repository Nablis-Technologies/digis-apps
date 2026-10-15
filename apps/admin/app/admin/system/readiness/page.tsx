"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import {
  ActivityIcon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  RefreshIcon,
  RadarIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { useGetReadinessQuery } from "@/store/reducers/systemApi"

function CheckRow({ name, status }: { name: string; status?: string }) {
  const ok = status === "ok" || status === "healthy" || status === "green"
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/50 py-3 last:border-b-0">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-full",
            ok
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
              : "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400"
          )}
        >
          <HugeiconsIcon
            icon={ok ? CheckmarkCircle01Icon : Cancel01Icon}
            strokeWidth={2}
            className="size-4.5"
          />
        </span>
        <div>
          <p className="text-sm font-medium capitalize">{name}</p>
        </div>
      </div>
      <span
        className={cn(
          "rounded-full px-2.5 py-0.5 text-xs font-medium",
          ok
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
            : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
        )}
      >
        {status ?? "unknown"}
      </span>
    </div>
  )
}

export default function SystemReadinessPage() {
  const { data, isLoading, isFetching, refetch } = useGetReadinessQuery()

  const report = data?.data
  const checks = report?.checks

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">System Readiness</h1>
          <p className="text-sm text-muted-foreground">
            Health status of platform infrastructure and dependencies
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 rounded-lg border border-border/50 bg-card px-4 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-accent"
        >
          <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className="size-4" />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <HugeiconsIcon icon={RadarIcon} strokeWidth={2} className="size-4" />
            <span className="text-sm font-medium">Overall Status</span>
          </div>
          <p className="mt-2 text-2xl font-semibold capitalize">
            {isLoading ? "…" : (report?.status ?? report?.healthy !== false ? "healthy" : "degraded")}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs">
        <div className="mb-4 flex items-center gap-2">
          <HugeiconsIcon icon={ActivityIcon} strokeWidth={2} className="size-4 text-muted-foreground" />
          <h3 className="font-semibold">Dependency Checks</h3>
        </div>

        {isLoading || isFetching ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : Array.isArray(checks) && checks.length > 0 ? (
          <div>
            {checks.map((c, i) => (
              <CheckRow
                key={i}
                name={typeof c.name === "string" ? c.name : `Check ${i + 1}`}
                status={typeof c.status === "string" ? c.status : c.ok ? "ok" : "unknown"}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <HugeiconsIcon
              icon={RadarIcon}
              strokeWidth={2}
              className="mb-3 size-10 text-muted-foreground/40"
            />
            <p className="text-sm text-muted-foreground">No readiness details available</p>
          </div>
        )}
      </div>
    </div>
  )
}
