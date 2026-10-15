"use client"

import { useState } from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  WalletIcon,
  CheckmarkCircle01Icon,
  ArrowRight01Icon,
  RefreshIcon,
  Clock01Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { DataTable, type Column, type SortConfig } from "@/components/ui/data-table"
import { StatsCard } from "@/components/dashboard/stats-card"
import { useListRefundsQuery, type Refund } from "@/store/reducers/refundsApi"

function fmtCurrency(amountMinor: number | undefined, currency?: string) {
  if (amountMinor == null) return "—"
  const amount = amountMinor / 100
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency ?? "ETB",
  }).format(amount)
}

function StatusBadge({ status }: { status: string }) {
  const lower = String(status ?? "").toLowerCase()
  const approved = lower.includes("approv") || lower === "succeeded" || lower === "completed"
  const pending = lower.includes("pend") || lower.includes("process") || lower.includes("request")
  const rejected = lower.includes("reject") || lower.includes("fail") || lower.includes("cancel")
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
        approved
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
          : pending
            ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
            : rejected
              ? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
              : "bg-zinc-50 text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-500"
      )}
    >
      {status}
    </span>
  )
}

export default function RefundsPage() {
  const [page, setPage] = useState(1)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "created_at", direction: "desc" })

  const { data, isLoading, isFetching, refetch } = useListRefundsQuery({
    page,
    per_page: 10,
    order_by: sortConfig.key,
    order_direction: sortConfig.direction,
  })

  const refunds = data?.data ?? []
  const pagination = data?.pagination
  const total = pagination?.total_count ?? 0
  const totalPages = pagination?.total_pages ?? 1
  const perPage = pagination?.per_page ?? 10

  const approved = refunds.filter((r) =>
    String(r.status ?? "").toLowerCase().includes("approv")
  ).length
  const pending = refunds.filter((r) =>
    ["pending", "processing", "requested"].some((s) =>
      String(r.status ?? "").toLowerCase().includes(s)
    )
  ).length

  const columns: Column<Refund>[] = [
    {
      header: "Refund",
      accessorKey: "id",
      cell: (row) => (
        <Link href={`/admin/refunds/${row.id}`} className="flex items-center gap-3 group">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            <HugeiconsIcon icon={WalletIcon} strokeWidth={2} className="size-4" />
          </div>
          <div>
            <p className="font-medium text-foreground group-hover:underline">
              {fmtCurrency(row.amount_minor, row.currency)}
            </p>
            <p className="font-mono text-xs text-muted-foreground">{row.id.slice(0, 8)}</p>
          </div>
        </Link>
      ),
    },
    {
      header: "Event",
      cell: (row) => (
        <span className="text-sm text-muted-foreground max-w-48 truncate block">
          {row.payment?.order?.event?.title ?? <span className="text-muted-foreground/50">&mdash;</span>}
        </span>
      ),
      hideOnMobile: true,
    },
    { header: "Status", accessorKey: "status", sortable: true, cell: (row) => <StatusBadge status={row.status} /> },
    {
      header: "Created",
      accessorKey: "created_at",
      sortable: true,
      className: "text-muted-foreground",
      hideOnMobile: true,
      cell: (row) =>
        row.created_at
          ? new Date(row.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "—",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Refunds</h1>
          <p className="text-sm text-muted-foreground">
            Buyer refund status across all orders
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

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard title="Total Refunds" value={total} icon={WalletIcon} sparklineColor="var(--chart-1)" />
        <StatsCard title="Approved" value={approved} icon={CheckmarkCircle01Icon} sparklineColor="var(--chart-2)" />
        <StatsCard title="Pending" value={pending} icon={Clock01Icon} sparklineColor="var(--chart-3)" />
      </div>

      <DataTable
        columns={columns}
        data={refunds}
        keyExtractor={(row) => row.id}
        isLoading={isLoading || isFetching}
        sortConfig={sortConfig}
        onSort={(cfg) => {
          setSortConfig(cfg)
          setPage(1)
        }}
        pagination={{ page, perPage, total, totalPages }}
        onPageChange={setPage}
        renderActions={(row) => (
          <Link
            href={`/admin/refunds/${row.id}`}
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4" />
          </Link>
        )}
      />
    </div>
  )
}
