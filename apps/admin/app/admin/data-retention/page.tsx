"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Shield01Icon,
  CheckmarkCircle01Icon,
  LockIcon,
  PlusSignCircleIcon,
  RefreshIcon,
  Edit01Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { DataTable, type Column, type SortConfig } from "@/components/ui/data-table"
import { StatsCard } from "@/components/dashboard/stats-card"
import { RetentionPolicyDialog } from "@/components/forms/retention-policy-dialog"
import { RetentionHoldDialog } from "@/components/forms/retention-hold-dialog"
import {
  useListRetentionPoliciesQuery,
  useListRetentionHoldsQuery,
  type DataRetentionPolicy,
  type DataRetentionHold,
} from "@/store/reducers/dataRetentionApi"

type Tab = "policies" | "holds"

const statusConfig: Record<string, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "bg-zinc-50 text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-500" },
  active: { label: "Active", cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" },
  retired: { label: "Retired", cls: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400" },
}

export default function DataRetentionPage() {
  const [tab, setTab] = useState<Tab>("policies")
  const [policyPage, setPolicyPage] = useState(1)
  const [holdPage, setHoldPage] = useState(1)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "created_at", direction: "desc" })

  const { data: policiesData, isLoading: policiesLoading, isFetching: policiesFetching, refetch: refetchPolicies } = useListRetentionPoliciesQuery({
    page: policyPage,
    per_page: 10,
    order_by: sortConfig.key,
    order_direction: sortConfig.direction,
  })
  const { data: holdsData, isLoading: holdsLoading, isFetching: holdsFetching, refetch: refetchHolds } = useListRetentionHoldsQuery({
    page: holdPage,
    per_page: 10,
    order_by: "created_at",
    order_direction: "desc",
  })

  const [policyDialogOpen, setPolicyDialogOpen] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<DataRetentionPolicy | null>(null)
  const [holdDialogOpen, setHoldDialogOpen] = useState(false)

  const policies = policiesData?.data ?? []
  const holds = holdsData?.data ?? []
  const policiesPagination = policiesData?.pagination
  const holdsPagination = holdsData?.pagination

  const stats = {
    total: policiesPagination?.total_count ?? 0,
    active: policies.filter((p) => p.status === "active").length,
    holds: holdsPagination?.total_count ?? 0,
  }

  const policyColumns: Column<DataRetentionPolicy>[] = [
    { header: "Category", accessorKey: "category", cell: (row) => <span className="text-sm font-mono">{row.category}</span> },
    { header: "Jurisdiction", accessorKey: "jurisdiction_code", cell: (row) => <span className="text-sm font-mono">{row.jurisdiction_code ?? "—"}</span> },
    { header: "Version", accessorKey: "version", cell: (row) => <span className="text-sm">v{row.version}</span> },
    { header: "Action", accessorKey: "action", cell: (row) => <span className="text-sm capitalize">{row.action.replace("_", " ")}</span> },
    { header: "Retention", accessorKey: "retention_days", cell: (row) => <span className="text-sm">{row.retention_days ? `${row.retention_days}d` : "—"}</span> },
    { header: "Status", accessorKey: "status", cell: (row) => { const s = statusConfig[row.status] ?? statusConfig.draft; return <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", s.cls)}>{s.label}</span> } },
  ]

  const holdColumns: Column<DataRetentionHold>[] = [
    {
      header: "Scope",
      cell: (row) => (
        <span className="text-sm font-mono">
          {row.event_id ? `event:${row.event_id.slice(0, 8)}` : row.user_id ? `user:${row.user_id.slice(0, 8)}` : `registration:${row.registration_id?.slice(0, 8)}`}
        </span>
      ),
    },
    { header: "Reason", accessorKey: "reason_code", cell: (row) => <span className="text-sm">{row.reason_code.replace(/_/g, " ")}</span> },
    { header: "Category", accessorKey: "category", cell: (row) => <span className="text-sm">{row.category ?? "—"}</span> },
    { header: "Starts", accessorKey: "starts_at", cell: (row) => <span className="text-sm">{new Date(row.starts_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span> },
    {
      header: "Status",
      cell: (row) => (
        <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", row.released_at ? "bg-zinc-50 text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-500" : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400")}>
          {row.released_at ? "Released" : "Active"}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Data Retention</h1>
          <p className="text-sm text-muted-foreground">Manage retention policies and legal holds</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => (tab === "policies" ? refetchPolicies() : refetchHolds())}
            className="inline-flex items-center gap-2 rounded-lg border border-border/50 bg-card px-4 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-accent"
          >
            <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className="size-4" />Refresh
          </button>
          {tab === "policies" ? (
            <button type="button" onClick={() => { setEditingPolicy(null); setPolicyDialogOpen(true) }} className="inline-flex items-center gap-2 rounded-lg bg-lime-500 px-4 py-2 text-sm font-medium text-white shadow-xs transition-colors hover:bg-lime-600">
              <HugeiconsIcon icon={PlusSignCircleIcon} strokeWidth={2} className="size-4" />Create Policy
            </button>
          ) : (
            <button type="button" onClick={() => setHoldDialogOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-lime-500 px-4 py-2 text-sm font-medium text-white shadow-xs transition-colors hover:bg-lime-600">
              <HugeiconsIcon icon={PlusSignCircleIcon} strokeWidth={2} className="size-4" />Place Hold
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard title="Policies" value={stats.total} icon={Shield01Icon} sparklineData={[2, 3, 3, 4, 5, 5, stats.total]} sparklineColor="var(--chart-1)" />
        <StatsCard title="Active Policies" value={stats.active} icon={CheckmarkCircle01Icon} sparklineData={[2, 2, 3, 3, 4, 4, stats.active]} sparklineColor="var(--chart-2)" />
        <StatsCard title="Active Holds" value={stats.holds} icon={LockIcon} sparklineData={[1, 1, 2, 2, 2, 3, stats.holds]} sparklineColor="var(--chart-3)" />
      </div>

      <div className="flex gap-1 border-b border-border/50">
        {(["policies", "holds"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px capitalize",
              tab === t ? "border-lime-500 text-lime-600" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "policies" ? (
        <DataTable
          columns={policyColumns}
          data={policies}
          keyExtractor={(row) => row.id}
          isLoading={policiesLoading || policiesFetching}
          sortConfig={sortConfig}
          onSort={(cfg) => { setSortConfig(cfg); setPolicyPage(1) }}
          pagination={{ page: policyPage, perPage: policiesPagination?.per_page ?? 10, total: policiesPagination?.total_count ?? 0, totalPages: policiesPagination?.total_pages ?? 1 }}
          onPageChange={setPolicyPage}
          renderActions={(row) => (
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => { setEditingPolicy(row); setPolicyDialogOpen(true) }} className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} className="size-4" />
              </button>
            </div>
          )}
        />
      ) : (
        <DataTable
          columns={holdColumns}
          data={holds}
          keyExtractor={(row) => row.id}
          isLoading={holdsLoading || holdsFetching}
          pagination={{ page: holdPage, perPage: holdsPagination?.per_page ?? 10, total: holdsPagination?.total_count ?? 0, totalPages: holdsPagination?.total_pages ?? 1 }}
          onPageChange={setHoldPage}
        />
      )}

      <RetentionPolicyDialog open={policyDialogOpen} onOpenChange={setPolicyDialogOpen} policy={editingPolicy} />
      <RetentionHoldDialog open={holdDialogOpen} onOpenChange={setHoldDialogOpen} />
    </div>
  )
}
