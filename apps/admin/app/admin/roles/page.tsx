"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Shield01Icon,
  ShieldPlusIcon,
  ShieldBlockchainIcon,
  ShieldQuestionMarkIcon,
  MoreHorizontalIcon,
  Edit01Icon,
  Delete01Icon,
  PlusSignCircleIcon,
  RefreshIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { DataTable, type Column, type SortConfig } from "@/components/ui/data-table"
import { StatsCard } from "@/components/dashboard/stats-card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { RoleDialog } from "@/components/forms/role-dialog"
import { ConfirmDialog } from "@/components/forms/confirm-dialog"
import {
  useListRolesQuery,
  useDeleteRoleMutation,
  type Role,
} from "@/store/reducers/rolesApi"

const roleColors: Record<string, string> = {
  SUPER_ADMIN: "bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400",
  ADMIN: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  ORGANIZER: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  SUPPORT: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-400",
  USER: "bg-zinc-50 text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-400",
  AUDITOR: "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400",
}

function RoleCodeBadge({ code }: { code: string }) {
  return (
    <span className={cn("inline-block rounded-md px-2 py-0.5 text-xs font-mono font-medium", roleColors[code] ?? "bg-muted text-muted-foreground")}>
      {code}
    </span>
  )
}

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", active ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400")}>
      {active ? "Active" : "Inactive"}
    </span>
  )
}

function RoleActions({ role, onEdit, onDelete }: { role: Role; onEdit: (r: Role) => void; onDelete: (r: Role) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
          <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => onEdit(role)}>
          <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} />Edit Role
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(role)}>
          <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} />Delete Role
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function RolesPage() {
  const [page, setPage] = useState(1)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "code", direction: "asc" })

  const { data, isLoading, isFetching, refetch } = useListRolesQuery({
    page,
    per_page: 10,
    order_by: sortConfig.key,
    order_direction: sortConfig.direction,
  })

  const [deleteRole] = useDeleteRoleMutation()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmItem, setConfirmItem] = useState<Role | null>(null)
  const [confirmSubmitting, setConfirmSubmitting] = useState(false)

  const roles = data?.data ?? []
  const pagination = data?.pagination
  const total = pagination?.total_count ?? 0
  const totalPages = pagination?.total_pages ?? 1
  const perPage = pagination?.per_page ?? 10

  const stats = {
    total,
    active: roles.filter((r) => r.active !== false).length,
    inactive: roles.filter((r) => r.active === false).length,
    withPermissions: roles.filter((r) => (r.permission_ids?.length ?? 0) > 0).length,
  }

  const columns: Column<Role>[] = [
    { header: "Code", accessorKey: "code", sortable: true, cell: (row) => <RoleCodeBadge code={row.code} /> },
    { header: "Name", accessorKey: "name", sortable: true, cell: (row) => (<div><p className="font-medium text-foreground">{row.name}</p>{row.description && <p className="text-xs text-muted-foreground max-w-64 truncate">{row.description}</p>}</div>) },
    { header: "Status", accessorKey: "active", sortable: true, cell: (row) => <ActiveBadge active={row.active !== false} /> },
    { header: "Permissions", cell: (row) => <span className="text-sm text-muted-foreground">{row.permission_ids?.length ?? 0} assigned</span>, hideOnMobile: true },
  ]

  async function handleDelete() {
    if (!confirmItem) return
    setConfirmSubmitting(true)
    try {
      await deleteRole(confirmItem.id).unwrap()
      setConfirmOpen(false)
      setConfirmItem(null)
    } catch {
      // stay open so user can retry
    } finally {
      setConfirmSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold tracking-tight">Roles</h1><p className="text-sm text-muted-foreground">Manage user roles and their permission assignments</p></div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => refetch()} className="inline-flex items-center gap-2 rounded-lg border border-border/50 bg-card px-4 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-accent"><HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className="size-4" />Refresh</button>
          <button type="button" onClick={() => { setEditingRole(null); setDialogOpen(true) }} className="inline-flex items-center gap-2 rounded-lg bg-lime-500 px-4 py-2 text-sm font-medium text-white shadow-xs transition-colors hover:bg-lime-600"><HugeiconsIcon icon={PlusSignCircleIcon} strokeWidth={2} className="size-4" />Create Role</button>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Roles" value={stats.total} icon={Shield01Icon} />
        <StatsCard title="Active" value={stats.active} icon={ShieldPlusIcon} trend={{ value: "83%", positive: true }} />
        <StatsCard title="Inactive" value={stats.inactive} icon={ShieldBlockchainIcon} />
        <StatsCard title="With Permissions" value={stats.withPermissions} icon={ShieldQuestionMarkIcon} />
      </div>
      <DataTable
        columns={columns}
        data={roles}
        keyExtractor={(row) => row.id}
        isLoading={isLoading || isFetching}
        sortConfig={sortConfig}
        onSort={(cfg) => { setSortConfig(cfg); setPage(1) }}
        pagination={{ page, perPage, total, totalPages }}
        onPageChange={setPage}
        renderActions={(row) => (
          <RoleActions
            role={row}
            onEdit={(r) => { setEditingRole(r); setDialogOpen(true) }}
            onDelete={(r) => { setConfirmItem(r); setConfirmOpen(true) }}
          />
        )}
      />
      <RoleDialog open={dialogOpen} onOpenChange={setDialogOpen} role={editingRole ? { id: editingRole.id, code: editingRole.code, name: editingRole.name, description: editingRole.description ?? null, active: editingRole.active !== false } : null} />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(o) => { if (!confirmSubmitting) setConfirmOpen(o) }}
        title="Delete Role"
        description={`Delete role "${confirmItem?.name}"? This may affect all users assigned to this role.`}
        confirmLabel={confirmSubmitting ? "Deleting..." : "Delete"}
        onConfirm={handleDelete}
      />
    </div>
  )
}
