"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon, Mail01Icon, SmartPhone01Icon, Calendar01Icon,
  CheckmarkBadge01Icon, Shield01Icon, MoreHorizontalIcon, PlusSignCircleIcon,
  Delete01Icon, Edit01Icon, UserCheck01Icon, UserBlock01Icon, Clock01Icon,
  ChartBarLineIcon, Ticket01Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { StatsCard } from "@/components/dashboard/stats-card"
import { UserDialog } from "@/components/forms/user-dialog"
import { DeactivateUserDialog } from "@/components/forms/deactivate-user-dialog"
import { AssignRoleDialog } from "@/components/forms/assign-role-dialog"
import { ConfirmDialog } from "@/components/forms/confirm-dialog"
import {
  useGetUserQuery,
  useDeleteUserMutation,
  useReactivateUserMutation,
  useRemoveRoleMutation,
  useListUserRolesQuery,
} from "@/store/reducers/usersApi"
import type { User } from "@/store/reducers/usersApi"

const sparklineA = [2, 5, 3, 7, 4, 8, 6]
const sparklineB = [0, 1, 0, 2, 1, 3, 2]
const sparklineC = [5, 8, 6, 10, 7, 12, 9]

type Tab = "overview" | "roles" | "activity"

const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "overview", label: "Overview", icon: <HugeiconsIcon icon={Mail01Icon} strokeWidth={2} className="size-3.5" /> },
  { key: "roles", label: "Roles", icon: <HugeiconsIcon icon={Shield01Icon} strokeWidth={2} className="size-3.5" /> },
  { key: "activity", label: "Activity", icon: <HugeiconsIcon icon={ChartBarLineIcon} strokeWidth={2} className="size-3.5" /> },
]

function fmt(iso: string) { return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) }

const roleColors: Record<string, string> = {
  SUPER_ADMIN: "bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400",
  ADMIN: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  ORGANIZER: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  SUPPORT: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-400",
  USER: "bg-zinc-50 text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-400",
}

export default function UserDetailPage() {
  const params = useParams()
  const id = params.id as string

  const { data, isLoading: loading } = useGetUserQuery(id)
  const [deleteUser] = useDeleteUserMutation()
  const [reactivateUser] = useReactivateUserMutation()
  const [removeRole] = useRemoveRoleMutation()

  const user = data?.data

  const [tab, setTab] = useState<Tab>("overview")
  const [editOpen, setEditOpen] = useState(false)
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const [assignRoleOpen, setAssignRoleOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmConfig, setConfirmConfig] = useState<{ title: string; desc: string; label: string; action: () => void | Promise<void> }>({ title: "", desc: "", label: "", action: () => {} })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-9 rounded-lg" />
          <div className="flex-1"><Skeleton className="h-7 w-64" /><Skeleton className="mt-1 h-4 w-72" /></div>
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[120px] rounded-xl" />)}
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <Link href="/admin/users" className="flex size-9 items-center justify-center rounded-lg border border-border/50 bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" />
        </Link>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium">User not found</p>
          <p className="text-sm text-muted-foreground">The user you&apos;re looking for doesn&apos;t exist or has been deleted.</p>
        </div>
      </div>
    )
  }

  const active = user.deactivated_at === null

  const handleDelete = () => {
    setConfirmConfig({
      title: "Delete User",
      desc: `Permanently delete ${user.email}? This action cannot be undone.`,
      label: "Delete",
      action: async () => {
        await deleteUser(user.id).unwrap()
        window.location.href = "/admin/users"
      },
    })
    setConfirmOpen(true)
  }

  const handleReactivate = () => {
    setConfirmConfig({
      title: "Reactivate User",
      desc: `Reactivate ${user.email}? They will be able to log in again.`,
      label: "Reactivate",
      action: async () => { await reactivateUser(user.id).unwrap() },
    })
    setConfirmOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Link href="/admin/users" className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition-colors mt-1">
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex size-9 items-center justify-center rounded-lg bg-lime-500 text-sm font-bold text-white">
              {user.email.charAt(0).toUpperCase()}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">{user.email}</h1>
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>
              {active ? "Active" : "Deactivated"}
            </span>
            {user.roles.length > 0 && (
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", roleColors[user.roles[0].code] ?? "bg-zinc-50 text-zinc-500")}>
                {user.roles[0].name}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {user.roles.map((r) => r.name).join(", ") || "No roles"} · Joined {fmt(user.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" className="bg-lime-500 text-white hover:bg-lime-600" onClick={() => setEditOpen(true)}>
            <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} className="size-4" />
            Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {user.deactivated_at ? (
                <DropdownMenuItem onClick={handleReactivate}><HugeiconsIcon icon={UserCheck01Icon} strokeWidth={2} />Reactivate</DropdownMenuItem>
              ) : (
                <DropdownMenuItem variant="destructive" onClick={() => setDeactivateOpen(true)}><HugeiconsIcon icon={UserBlock01Icon} strokeWidth={2} />Deactivate</DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={handleDelete}><HugeiconsIcon icon={Delete01Icon} strokeWidth={2} />Delete User</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard title="Roles Assigned" value={user.roles.length} icon={Shield01Icon} sparklineData={sparklineA} sparklineColor="var(--chart-1)" />
        <StatsCard title="Reports Filed" value={3} icon={ChartBarLineIcon} sparklineData={sparklineB} sparklineColor="var(--chart-2)" />
        <StatsCard title="Sessions" value="127" icon={Ticket01Icon} sparklineData={sparklineC} sparklineColor="var(--chart-3)" />
      </div>

      <div className="flex gap-1 border-b border-border/50">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px capitalize inline-flex items-center gap-1.5",
              tab === t.key ? "border-lime-500 text-lime-600" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="flex items-center">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab user={user} />}
      {tab === "roles" && <RolesTab userId={id} onAssign={() => setAssignRoleOpen(true)} onRemove={(roleId: string) => removeRole({ userId: id, roleId }).unwrap()} />}
      {tab === "activity" && <PlaceholderTab title="Activity" description="Activity history for this user coming soon." />}

      <UserDialog open={editOpen} onOpenChange={setEditOpen} user={{ id: user.id, email: user.email, phone: user.phone, verified_at: user.verified_at }} />
      <DeactivateUserDialog open={deactivateOpen} onOpenChange={setDeactivateOpen} userId={user.id} userName={user.email} />
      <AssignRoleDialog open={assignRoleOpen} onOpenChange={setAssignRoleOpen} userId={user.id} />
      <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} title={confirmConfig.title} description={confirmConfig.desc} confirmLabel={confirmConfig.label} onConfirm={confirmConfig.action} />
    </div>
  )
}

function OverviewTab({ user }: { user: User }) {
  const info = [
    { label: "Email", value: user.email, icon: <HugeiconsIcon icon={Mail01Icon} strokeWidth={2} className="size-4 text-muted-foreground" /> },
    { label: "Phone", value: user.phone ?? "—", icon: <HugeiconsIcon icon={SmartPhone01Icon} strokeWidth={2} className="size-4 text-muted-foreground" /> },
    { label: "Verified", value: user.verified_at ? fmt(user.verified_at) : "Not verified", icon: <HugeiconsIcon icon={CheckmarkBadge01Icon} strokeWidth={2} className="size-4 text-muted-foreground" /> },
    { label: "Deactivated", value: user.deactivated_at ? `${fmt(user.deactivated_at)} — ${user.deactivated_reason ?? "No reason"}` : "N/A", icon: <HugeiconsIcon icon={UserBlock01Icon} strokeWidth={2} className="size-4 text-muted-foreground" /> },
    { label: "Joined", value: fmt(user.created_at), icon: <HugeiconsIcon icon={Calendar01Icon} strokeWidth={2} className="size-4 text-muted-foreground" /> },
    { label: "Last Updated", value: fmt(user.updated_at), icon: <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-4 text-muted-foreground" /> },
  ]
  return (
    <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs">
      <h3 className="font-semibold mb-1">User Profile</h3>
      <p className="text-sm text-muted-foreground mb-4">Core information about this user</p>
      <Separator className="mb-5" />
      <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
        {info.map((i) => (
          <div key={i.label} className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0">{i.icon}</div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{i.label}</p>
              <p className="text-sm font-medium truncate">{i.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RolesTab({ userId, onAssign, onRemove }: { userId: string; onAssign: () => void; onRemove: (roleId: string) => void }) {
  const { data: roles = [], isLoading } = useListUserRolesQuery(userId)

  return (
    <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">Assigned Roles</h3>
          <p className="text-xs text-muted-foreground">Manage role assignments for this user</p>
        </div>
        <Button size="sm" onClick={onAssign} className="bg-lime-500 text-white hover:bg-lime-600">
          <HugeiconsIcon icon={PlusSignCircleIcon} strokeWidth={2} className="size-4" />Assign Role
        </Button>
      </div>
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (<Skeleton key={i} className="h-12 w-full rounded-lg" />))}
        </div>
      ) : roles.length === 0 ? (
        <p className="text-sm text-muted-foreground">No roles assigned.</p>
      ) : (
        <div className="space-y-3">{roles.map((r) => (
          <div key={r.id} className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className={cn("rounded-md px-2 py-0.5 text-xs font-mono font-medium", roleColors[r.code] ?? "bg-muted")}>{r.code}</span>
              <span className="text-sm">{r.name}</span>
            </div>
            <Button variant="destructive" size="xs" onClick={() => onRemove(r.id)}>
              <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} className="size-3" />Remove
            </Button>
          </div>
        ))}</div>
      )}
    </div>
  )
}

function PlaceholderTab({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-12 shadow-xs flex flex-col items-center justify-center text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted mb-4">
        <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-5 text-muted-foreground" />
      </div>
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
