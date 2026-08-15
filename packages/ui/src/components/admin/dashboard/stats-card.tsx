"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import type { HugeiconsIconProps } from "@hugeicons/react"
import { cn } from "@workspace/ui/lib/utils"
import { Area, AreaChart } from "recharts"

interface StatsCardProps {
  title: string
  value: string | number
  icon: HugeiconsIconProps["icon"]
  trend?: {
    value: string
    positive: boolean
  }
  sparklineData?: number[]
  sparklineColor?: string
  className?: string
}

export function StatsCard({
  title,
  value,
  icon,
  trend,
  sparklineData,
  sparklineColor = "var(--chart-2)",
  className,
}: StatsCardProps) {
  const chartData = sparklineData?.map((v, i) => ({ i, v }))

  return (
    <div
      className={cn(
        "rounded-xl border border-border/50 bg-card p-6 shadow-xs transition-shadow hover:shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <HugeiconsIcon icon={icon} strokeWidth={2} className="size-4.5" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium",
              trend.positive
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
            )}
          >
            <svg
              className="size-3"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
            >
              <path
                d={
                  trend.positive
                    ? "M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
                    : "M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m0 0l-5.511 3.182"
                }
              />
            </svg>
            {trend.value}
          </span>
        )}
      </div>
      {chartData && (
        <div className="mt-3 h-8">
          <AreaChart
            width={200}
            height={32}
            data={chartData}
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          >
            <defs>
              <linearGradient
                id={`sparkline-${title.replace(/\s+/g, "-")}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={sparklineColor}
                  stopOpacity={0.3}
                />
                <stop
                  offset="100%"
                  stopColor={sparklineColor}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <Area
              dataKey="v"
              stroke={sparklineColor}
              fill={`url(#sparkline-${title.replace(/\s+/g, "-")})`}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </div>
      )}
    </div>
  )
}

export function StatsCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="size-9 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="mt-3">
        <div className="h-8 w-20 animate-pulse rounded bg-muted" />
      </div>
    </div>
  )
}
