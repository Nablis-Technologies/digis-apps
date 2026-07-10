"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkBadge01Icon,
  CheckmarkCircle01Icon,
  FileLockIcon,
  FileBlockIcon,
  MoreHorizontalIcon,
  Edit01Icon,
  Delete01Icon,
  PlusSignCircleIcon,
  RefreshIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { DataTable, type Column, type SortConfig } from "@/components/ui/data-table"
import { StatsCard } from "@/components/dashboard/stats-card"
import { ConfirmDialog } from "@/components/forms/confirm-dialog"
import { PermissionDialog } from "@/components/forms/permission-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  useListPermissionsQuery,
  useDeletePermissionMutation,
  type Permission,
} from "@/store/reducers/permissionsApi"

const resourceColors: Record<string, string> = {
  user: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  role: "bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400",
  organization: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  venue: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  artist: "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400",
  category: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-400",
  verification: "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400",
  report: "bg-zinc-50 text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-400",
}

const actionStyles: Record<string, string> = {
  manage: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400",
  view: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  create: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  update: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  delete: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400",
  approve: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  reject: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400",
  export: "bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400",
}

const namespaceColors: Record<string, string> = {
  core: "bg-zinc-50 text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-400",
  events: "bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400",
  orgs: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  analytics: "bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400",
}

function ResourceBadge({ resource }: { resource: string }) {
  return (
    <span className={cn("inline-block rounded-md px-2 py-0.5 text-xs font-medium capitalize", resourceColors[resource] ?? "bg-muted text-muted-foreground")}>
      {resource}
    </span>
  )
}

function ActionBadge({ action }: { action: string }) {
  return (
    <span className={cn("inline-block rounded-md px-2 py-0.5 text-xs font-medium capitalize", actionStyles[action] ?? "bg-muted text-muted-foreground")}>
      {action}
    </span>
  )
}

function NamespaceBadge({ namespace }: { namespace: string | null }) {
  if (!namespace) return <span className="text-muted-foreground/50">&mdash;</span>
  return (
    <span className={cn("inline-block rounded-md px-2 py-0.5 text-xs font-medium capitalize", namespaceColors[namespace] ?? "bg-muted text-muted-foreground")}>
      {namespace}
    </span>
  )
}

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", active ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-zinc-50 text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-500")}>
      {active ? "Active" : "Inactive"}
    </span>
  )
}

function PermissionActions({ permission, onEdit, onDelete }: { permission: Permission; onEdit: (p: Permission) => void; onDelete: (p: Permission) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
          <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => onEdit(permission)}>
          <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} />Edit Permission
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(permission)}>
          <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} />Delete Permission
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function PermissionsPage() {
  const [page, setPage] = useState(1)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "resource", direction: "asc" })

  const { data, isLoading, isFetching, refetch } = useListPermissionsQuery({
    page,
    per_page: 20,
    order_by: sortConfig.key,
    order_direction: sortConfig.direction,
  })

  const [deletePermission] = useDeletePermissionMutation()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Permission | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmItem, setConfirmItem] = useState<Permission | null>(null)
  const [confirmSubmitting, setConfirmSubmitting] = useState(false)

  const permissions = data?.data ?? []
  const pagination = data?.pagination
  const total = pagination?.total_count ?? 0
  const totalPages = pagination?.total_pages ?? 1
  const perPage = pagination?.per_page ?? 20

  const stats = {
    total,
    active: permissions.filter((p) => p.active !== false).length,
    inactive: permissions.filter((p) => p.active === false).length,
    resources: new Set(permissions.map((p) => p.resource)).size,
  }

  const columns: Column<Permission>[] = [
    {
      header: "Code",
      accessorKey: "code",
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-mono text-sm font-medium text-foreground">{row.code}</p>
          {row.description && <p className="text-xs text-muted-foreground max-w-56 truncate">{row.description}</p>}
        </div>
      ),
    },
    { header: "Resource", accessorKey: "resource", sortable: true, cell: (row) => <ResourceBadge resource={row.resource} /> },
    { header: "Action", accessorKey: "action", sortable: true, cell: (row) => <ActionBadge action={row.action} />, hideOnMobile: true },
    { header: "Namespace", accessorKey: "namespace", sortable: true, cell: (row) => <NamespaceBadge namespace={row.namespace} />, hideOnMobile: true },
    { header: "Status", accessorKey: "active", sortable: true, cell: (row) => <ActiveBadge active={row.active !== false} /> },
  ]

  async function handleDelete() {
    if (!confirmItem) return
    setConfirmSubmitting(true)
    try {
      await deletePermission(confirmItem.id).unwrap()
      setConfirmOpen(false)
      setConfirmItem(null)
    } catch {
      // stay open to retry
    } finally {
      setConfirmSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Permissions</h1>
          <p className="text-sm text-muted-foreground">Define granular permissions for roles and resources</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => refetch()} className="inline-flex items-center gap-2 rounded-lg border border-border/50 bg-card px-4 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-accent">
            <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className="size-4" />Refresh
          </button>
          <button type="button" onClick={() => { setEditing(null); setDialogOpen(true) }} className="inline-flex items-center gap-2 rounded-lg bg-lime-500 px-4 py-2 text-sm font-medium text-white shadow-xs transition-colors hover:bg-lime-600">
            <HugeiconsIcon icon={PlusSignCircleIcon} strokeWidth={2} className="size-4" />Create Permission
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Permissions" value={stats.total} icon={CheckmarkBadge01Icon} sparklineData={[20, 22, 24, 26, 28, 30, stats.total]} sparklineColor="var(--chart-1)" />
        <StatsCard title="Active" value={stats.active} icon={CheckmarkCircle01Icon} trend={{ value: stats.total > 0 ? `${Math.round((stats.active / stats.total) * 100)}%` : "0%", positive: true }} sparklineData={[16, 18, 20, 22, 24, 26, stats.active]} sparklineColor="var(--chart-2)" />
        <StatsCard title="Inactive" value={stats.inactive} icon={FileBlockIcon} sparklineData={[5, 4, 4, 4, 4, 4, stats.inactive]} sparklineColor="var(--chart-3)" />
        <StatsCard title="Resources" value={stats.resources} icon={FileLockIcon} sparklineData={[6, 7, 7, 8, 8, 8, stats.resources]} sparklineColor="var(--chart-4)" />
      </div>

      <DataTable
        columns={columns}
        data={permissions}
        keyExtractor={(row) => row.id}
        isLoading={isLoading || isFetching}
        sortConfig={sortConfig}
        onSort={(cfg) => { setSortConfig(cfg); setPage(1) }}
        pagination={{ page, perPage, total, totalPages }}
        onPageChange={setPage}
        renderActions={(row) => (
          <PermissionActions
            permission={row}
            onEdit={(p) => { setEditing(p); setDialogOpen(true) }}
            onDelete={(p) => { setConfirmItem(p); setConfirmOpen(true) }}
          />
        )}
      />

      <PermissionDialog open={dialogOpen} onOpenChange={setDialogOpen} permission={editing} />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(o) => { if (!confirmSubmitting) setConfirmOpen(o) }}
        title="Delete Permission"
        description={`Delete permission "${confirmItem?.code}"? This will affect all roles that have this permission.`}
        confirmLabel={confirmSubmitting ? "Deleting..." : "Delete"}
        onConfirm={handleDelete}
      />
    </div>
  )
}
