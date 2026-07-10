"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  UserGroupIcon,
  UserAdd01Icon,
  UserBlock01Icon,
  UserCheck01Icon,
  MoreHorizontalIcon,
  Edit01Icon,
  ShieldUserIcon,
  Delete01Icon,
  PlusSignCircleIcon,
  RefreshIcon,
  EyeIcon,
} from "@hugeicons/core-free-icons"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { DataTable, type Column, type SortConfig } from "@/components/ui/data-table"
import { StatsCard } from "@/components/dashboard/stats-card"
import { UserDialog } from "@/components/forms/user-dialog"
import { DeactivateUserDialog } from "@/components/forms/deactivate-user-dialog"
import { AssignRoleDialog } from "@/components/forms/assign-role-dialog"
import { ConfirmDialog } from "@/components/forms/confirm-dialog"
import {
  useListUsersQuery,
  useDeleteUserMutation,
  useReactivateUserMutation,
  type User,
} from "@/store/reducers/usersApi"

function formatDate(iso: string) { return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) }
function isActive(user: User) { return user.deactivated_at === null }
function isVerified(user: User) { return user.verified_at !== null }

function StatusBadge({ user }: { user: User }) {
  const active = isActive(user)
  return <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", active ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400")}>{active ? "Active" : "Deactivated"}</span>
}

const roleColors: Record<string, string> = {
  SUPER_ADMIN: "bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400",
  ADMIN: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  ORGANIZER: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  SUPPORT: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-400",
  USER: "bg-zinc-50 text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-400",
}

function RoleBadge({ role }: { role: { id: string; code: string; name: string } }) {
  return <span className={cn("inline-block rounded-md px-2 py-0.5 text-xs font-medium", roleColors[role.code] ?? "bg-muted text-muted-foreground")}>{role.name}</span>
}

function VerifiedBadge({ user }: { user: User }) {
  const verified = isVerified(user)
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", verified ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-zinc-50 text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-500")}>{verified ? "Verified" : "Unverified"}</span>
}

function UserActions({ user, onEdit, onView, onRoles, onDeactivate, onReactivate, onDelete }: {
  user: User; onEdit: (u: User) => void; onView: (u: User) => void
  onRoles: (u: User) => void; onDeactivate: (u: User) => void
  onReactivate: (u: User) => void; onDelete: (u: User) => void
}) {
  const active = isActive(user)
  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={() => onView(user)} className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
        <HugeiconsIcon icon={EyeIcon} strokeWidth={2} className="size-4" />
      </button>
      <button type="button" onClick={() => onEdit(user)} className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
        <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} className="size-4" />
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
            <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => onRoles(user)}><HugeiconsIcon icon={ShieldUserIcon} strokeWidth={2} />Manage Roles</DropdownMenuItem>
          {active ? (
            <DropdownMenuItem variant="destructive" onClick={() => onDeactivate(user)}><HugeiconsIcon icon={UserBlock01Icon} strokeWidth={2} />Deactivate</DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => onReactivate(user)}><HugeiconsIcon icon={UserCheck01Icon} strokeWidth={2} />Reactivate</DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => onDelete(user)}><HugeiconsIcon icon={Delete01Icon} strokeWidth={2} />Delete User</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

const columns: Column<User>[] = [
  { header: "Email", accessorKey: "email", sortable: true, cell: (row) => (<div><p className="font-medium text-foreground">{row.email}</p>{row.phone && <p className="text-xs text-muted-foreground">{row.phone}</p>}</div>) },
  { header: "Phone", accessorKey: "phone", sortable: true, hideOnMobile: true, cell: (row) => row.phone ?? <span className="text-muted-foreground/50">&mdash;</span> },
  { header: "Status", accessorKey: "deactivated_at", sortable: true, cell: (row) => <StatusBadge user={row} /> },
  { header: "Roles", cell: (row) => (<div className="flex flex-wrap gap-1">{row.roles.length > 0 ? row.roles.map((r) => <RoleBadge key={r.id} role={r} />) : <span className="text-muted-foreground/50">&mdash;</span>}</div>), hideOnMobile: true },
  { header: "Verified", cell: (row) => <VerifiedBadge user={row} />, hideOnMobile: true },
  { header: "Joined", accessorKey: "created_at", sortable: true, className: "text-muted-foreground", hideOnMobile: true, cell: (row) => formatDate(row.created_at) },
]

export default function UsersPage() {
  const [page, setPage] = useState(1)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "created_at", direction: "desc" })

  const { data, isLoading, isFetching, refetch } = useListUsersQuery({
    page,
    per_page: 10,
    status: "all",
    order_by: sortConfig.key,
    order_direction: sortConfig.direction,
  })

  const [deleteUser] = useDeleteUserMutation()
  const [reactivateUser] = useReactivateUserMutation()

  const [createOpen, setCreateOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [actionUser, setActionUser] = useState<User | null>(null)
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const [assignRoleOpen, setAssignRoleOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmConfig, setConfirmConfig] = useState<{ title: string; desc: string; label: string; action: () => void | Promise<void> }>({ title: "", desc: "", label: "", action: () => {} })
  const router = useRouter()

  const users = data?.data ?? []
  const pagination = data?.pagination
  const total = pagination?.total_count ?? 0
  const totalPages = pagination?.total_pages ?? 1
  const perPage = pagination?.per_page ?? 10

  const stats = {
    total,
    active: users.filter((u) => isActive(u)).length,
    deactivated: users.filter((u) => !isActive(u)).length,
    unverified: users.filter((u) => !isVerified(u)).length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold tracking-tight">Users</h1><p className="text-sm text-muted-foreground">Manage platform users and their roles</p></div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => refetch()} className="inline-flex items-center gap-2 rounded-lg border border-border/50 bg-card px-4 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-accent"><HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className="size-4" />Refresh</button>
          <button type="button" onClick={() => { setEditingUser(null); setCreateOpen(true) }} className="inline-flex items-center gap-2 rounded-lg bg-lime-500 px-4 py-2 text-sm font-medium text-white shadow-xs transition-colors hover:bg-lime-600"><HugeiconsIcon icon={PlusSignCircleIcon} strokeWidth={2} className="size-4" />Add User</button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Users" value={stats.total} icon={UserGroupIcon} trend={{ value: "8.4%", positive: true }} sparklineData={[1800, 2000, 2100, 2250, 2350, 2420, stats.total]} sparklineColor="var(--chart-1)" />
        <StatsCard title="Active" value={stats.active} icon={UserCheck01Icon} trend={{ value: "12.5%", positive: true }} sparklineData={[1500, 1700, 1850, 2000, 2150, 2280, stats.active]} sparklineColor="var(--chart-2)" />
        <StatsCard title="Deactivated" value={stats.deactivated} icon={UserBlock01Icon} trend={{ value: "2.1%", positive: false }} sparklineData={[35, 42, 40, 38, 45, 48, stats.deactivated]} sparklineColor="var(--chart-3)" />
        <StatsCard title="Unverified" value={stats.unverified} icon={UserAdd01Icon} sparklineData={[280, 260, 240, 220, 200, 180, stats.unverified]} sparklineColor="var(--chart-4)" />
      </div>

      <DataTable
        columns={columns}
        data={users}
        keyExtractor={(row) => row.id}
        isLoading={isLoading || isFetching}
        sortConfig={sortConfig}
        onSort={(cfg) => { setSortConfig(cfg); setPage(1) }}
        pagination={{ page, perPage, total, totalPages }}
        onPageChange={setPage}
        onRowClick={(row) => router.push(`/admin/users/${row.id}`)}
        renderActions={(row) => (
          <UserActions
            user={row}
            onEdit={(u) => { setEditingUser(u); setCreateOpen(true) }}
            onView={(u) => router.push(`/admin/users/${u.id}`)}
            onRoles={(u) => { setActionUser(u); setAssignRoleOpen(true) }}
            onDeactivate={(u) => { setActionUser(u); setDeactivateOpen(true) }}
            onReactivate={(u) => {
              setConfirmConfig({
                title: "Reactivate User",
                desc: `Reactivate ${u.email}? They will be able to log in again.`,
                label: "Reactivate",
                action: async () => { await reactivateUser(u.id).unwrap() },
              })
              setConfirmOpen(true)
            }}
            onDelete={(u) => {
              setConfirmConfig({
                title: "Delete User",
                desc: `Permanently delete ${u.email}? This action cannot be undone.`,
                label: "Delete",
                action: async () => { await deleteUser(u.id).unwrap() },
              })
              setConfirmOpen(true)
            }}
          />
        )}
      />

      <UserDialog open={createOpen} onOpenChange={setCreateOpen} user={editingUser ? { id: editingUser.id, email: editingUser.email, phone: editingUser.phone, verified_at: editingUser.verified_at } : null} />
      <DeactivateUserDialog open={deactivateOpen} onOpenChange={setDeactivateOpen} userId={actionUser?.id} userName={actionUser?.email} />
      <AssignRoleDialog open={assignRoleOpen} onOpenChange={setAssignRoleOpen} userId={actionUser?.id} />
      <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} title={confirmConfig.title} description={confirmConfig.desc} confirmLabel={confirmConfig.label} onConfirm={confirmConfig.action} />
    </div>
  )
}
