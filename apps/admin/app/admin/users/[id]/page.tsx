"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon, Mail01Icon, SmartPhone01Icon, Calendar01Icon,
  CheckmarkBadge01Icon, Shield01Icon, MoreHorizontalIcon, PlusSignCircleIcon,
  Delete01Icon, Edit01Icon, UserCheck01Icon, UserBlock01Icon, Clock01Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
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
  type User,
} from "@/store/reducers/usersApi"

type Tab = "overview" | "roles"

function fmt(iso: string) { return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) }

function StatusBadge({ user }: { user: User }) {
  const active = user.deactivated_at === null
  return <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", active ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400")}>{active ? "Active" : "Deactivated"}</span>
}

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
          <div className="flex-1"><Skeleton className="h-7 w-48" /><Skeleton className="mt-1 h-4 w-72" /></div>
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
        <Skeleton className="h-[500px] w-full rounded-xl" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <Link href="/admin/users" className="flex size-9 items-center justify-center rounded-lg border border-border/50 bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"><HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" /></Link>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium">User not found</p>
          <p className="text-sm text-muted-foreground">The user you&apos;re looking for doesn&apos;t exist or has been deleted.</p>
        </div>
      </div>
    )
  }

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
      <div className="flex items-center gap-4">
        <Link href="/admin/users" className="flex size-9 items-center justify-center rounded-lg border border-border/50 bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"><HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3"><h1 className="text-2xl font-semibold tracking-tight">{user.email}</h1><StatusBadge user={user} /></div>
          <p className="text-sm text-muted-foreground font-mono mt-0.5">{user.id}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="outline" size="sm"><HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} className="size-4" />Actions</Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setEditOpen(true)}><HugeiconsIcon icon={Edit01Icon} strokeWidth={2} />Edit User</DropdownMenuItem>
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

      <div className="flex gap-1 border-b border-border/50">
        {(["overview", "roles"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn("px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px capitalize", tab === t ? "border-lime-500 text-lime-600" : "border-transparent text-muted-foreground hover:text-foreground")}>{t}</button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab user={user} />}
      {tab === "roles" && <RolesTab userId={id} onAssign={() => setAssignRoleOpen(true)} onRemove={(roleId) => removeRole({ userId: id, roleId }).unwrap()} />}

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
      <div className="flex items-center gap-3 mb-6">
        <div className="flex size-12 items-center justify-center rounded-full bg-lime-500 text-xl font-bold text-white">{user.email.charAt(0).toUpperCase()}</div>
        <div><p className="font-semibold">{user.email}</p><p className="text-xs text-muted-foreground">{user.roles.map((r) => r.name).join(", ") || "No roles"}</p></div>
      </div>
      <Separator className="mb-4" />
      <div className="space-y-4">{info.map((i) => (<div key={i.label} className="flex items-start gap-3"><div className="mt-0.5">{i.icon}</div><div><p className="text-xs text-muted-foreground">{i.label}</p><p className="text-sm font-medium">{i.value}</p></div></div>))}</div>
    </div>
  )
}

function RolesTab({ userId, onAssign, onRemove }: { userId: string; onAssign: () => void; onRemove: (roleId: string) => void }) {
  const { data: roles = [], isLoading } = useListUserRolesQuery(userId)

  return (
    <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div><h3 className="font-semibold">Assigned Roles</h3><p className="text-xs text-muted-foreground">Manage role assignments for this user</p></div>
        <Button size="sm" onClick={onAssign} className="bg-lime-500 text-white hover:bg-lime-600"><HugeiconsIcon icon={PlusSignCircleIcon} strokeWidth={2} className="size-4" />Assign Role</Button>
      </div>
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (<Skeleton key={i} className="h-12 w-full rounded-lg" />))}
        </div>
      ) : roles.length === 0 ? (
        <p className="text-sm text-muted-foreground">No roles assigned.</p>
      ) : (
        <div className="space-y-3">{roles.map((r) => (<div key={r.id} className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-3"><div className="flex items-center gap-3"><span className={cn("rounded-md px-2 py-0.5 text-xs font-mono font-medium", roleColors[r.code] ?? "bg-muted")}>{r.code}</span><span className="text-sm">{r.name}</span></div><Button variant="destructive" size="xs" onClick={() => onRemove(r.id)}><HugeiconsIcon icon={Delete01Icon} strokeWidth={2} className="size-3" />Remove</Button></div>))}</div>
      )}
    </div>
  )
}
