"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon, Building01Icon, Mail01Icon, SmartPhone01Icon, Calendar01Icon,
  Globe02Icon, MapPinpoint01Icon, MoreHorizontalIcon, Edit01Icon, Delete01Icon,
  CheckmarkCircle01Icon, Cancel01Icon, Edit02Icon, UserCheck01Icon, UserBlock01Icon,
  Clock01Icon, PlusSignCircleIcon, RefreshIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { OrganizationDialog } from "@/components/forms/organization-dialog"
import { TransferOwnershipDialog } from "@/components/forms/transfer-ownership-dialog"
import { AddMemberDialog } from "@/components/forms/add-member-dialog"
import { ConfirmDialog } from "@/components/forms/confirm-dialog"
import { RequestModificationDialog } from "@/components/forms/request-modification-dialog"
import {
  useGetOrganizationQuery,
  useDeleteOrganizationMutation,
  type Organization,
} from "@/store/reducers/organizationsApi"

type VerificationRecord = {
  id: string; status: "pending" | "approved" | "rejected" | "modification_requested"
  submitted_at: string; reviewed_at: string | null; notes: string | null; feedback: string | null
}

type Member = {
  id: string; user_id: string; user_email: string; role: "owner" | "admin" | "staff" | "member"
  suspended: boolean; joined_at: string
}

type Tab = "overview" | "verification" | "members"

const mockVerifications: VerificationRecord[] = [
  { id: "v1", status: "approved", submitted_at: "2026-01-12T10:00:00Z", reviewed_at: "2026-01-14T09:00:00Z", notes: "All documents verified", feedback: null },
  { id: "v2", status: "modification_requested", submitted_at: "2026-03-01T11:00:00Z", reviewed_at: "2026-03-03T14:00:00Z", notes: "Update required", feedback: "TIN certificate unclear" },
  { id: "v3", status: "approved", submitted_at: "2026-03-10T09:00:00Z", reviewed_at: "2026-03-12T11:00:00Z", notes: "Resubmitted documents OK", feedback: null },
  { id: "v4", status: "pending", submitted_at: "2026-06-20T08:00:00Z", reviewed_at: null, notes: "Initial submission awaiting review", feedback: null },
]

const mockMembers: Member[] = [
  { id: "m1", user_id: "u1", user_email: "abebe@example.com", role: "owner", suspended: false, joined_at: "2026-01-10T00:00:00Z" },
  { id: "m2", user_id: "u2", user_email: "meron@example.com", role: "admin", suspended: false, joined_at: "2026-01-15T00:00:00Z" },
  { id: "m3", user_id: "u4", user_email: "hanna@example.com", role: "staff", suspended: false, joined_at: "2026-02-01T00:00:00Z" },
  { id: "m4", user_id: "u9", user_email: "fikir@example.com", role: "member", suspended: true, joined_at: "2026-04-01T00:00:00Z" },
]

function fmt(iso: string) { return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) }
function fmtDate(iso: string) { return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) }

const verifStatus: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "bg-amber-50 text-amber-700" },
  approved: { label: "Approved", cls: "bg-emerald-50 text-emerald-700" },
  rejected: { label: "Rejected", cls: "bg-red-50 text-red-700" },
  modification_requested: { label: "Changes Requested", cls: "bg-orange-50 text-orange-700" },
}

const roleConfig: Record<string, { label: string; cls: string }> = {
  owner: { label: "Owner", cls: "bg-violet-50 text-violet-700" },
  admin: { label: "Admin", cls: "bg-blue-50 text-blue-700" },
  staff: { label: "Staff", cls: "bg-amber-50 text-amber-700" },
  member: { label: "Member", cls: "bg-zinc-50 text-zinc-600" },
}

export default function OrgDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data, isLoading: loading } = useGetOrganizationQuery(id)
  const [deleteOrg, { isLoading: deleting }] = useDeleteOrganizationMutation()

  const org = data?.data

  const [tab, setTab] = useState<Tab>("overview")
  const [editOpen, setEditOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [addMemberOpen, setAddMemberOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [modifyOpen, setModifyOpen] = useState(false)
  const [confirmConfig, setConfirmConfig] = useState({ title: "", desc: "", label: "", action: (() => {}) as () => void | Promise<void> })

  function confirmAction(title: string, desc: string, label: string) {
    setConfirmConfig({ title, desc, label, action: () => {} })
    setConfirmOpen(true)
  }

  async function handleDelete() {
    if (!org) return
    try {
      await deleteOrg(org.id).unwrap()
      router.replace("/admin/organizations")
    } catch {
      // stay open to retry
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-9 rounded-lg" />
          <div className="flex-1"><Skeleton className="h-7 w-64" /><Skeleton className="mt-1 h-4 w-72" /></div>
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
        <Skeleton className="h-[500px] w-full rounded-xl" />
      </div>
    )
  }

  if (!org) {
    return (
      <div className="space-y-6">
        <Link href="/admin/organizations" className="flex size-9 items-center justify-center rounded-lg border border-border/50 bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"><HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" /></Link>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium">Organization not found</p>
          <p className="text-sm text-muted-foreground">The organization you're looking for doesn't exist or has been deleted.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/organizations" className="flex size-9 items-center justify-center rounded-lg border border-border/50 bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"><HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3"><h1 className="text-2xl font-semibold tracking-tight">{org.name}</h1><span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-50 text-blue-700">{org.verified ? "Verified" : "Unverified"}</span><span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700">{org.active ? "Active" : "Inactive"}</span></div>
          <p className="text-sm text-muted-foreground font-mono mt-0.5">{org.id}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="outline" size="sm"><HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} className="size-4" />Actions</Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={() => setEditOpen(true)}><HugeiconsIcon icon={Edit01Icon} strokeWidth={2} />Edit Organization</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTransferOpen(true)}><HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />Transfer Ownership</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => setConfirmOpen(true)}><HugeiconsIcon icon={Delete01Icon} strokeWidth={2} />Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex gap-1 border-b border-border/50">
        {(["overview", "verification", "members"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn("px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px capitalize", tab === t ? "border-lime-500 text-lime-600" : "border-transparent text-muted-foreground hover:text-foreground")}>{t}</button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab org={org} />}
      {tab === "verification" && <VerificationTab onConfirm={confirmAction} onRequestModification={() => setModifyOpen(true)} />}
      {tab === "members" && <MembersTab onAdd={() => setAddMemberOpen(true)} onConfirm={confirmAction} />}

      <OrganizationDialog open={editOpen} onOpenChange={setEditOpen} organization={org} />
      <TransferOwnershipDialog open={transferOpen} onOpenChange={setTransferOpen} orgName={org.name} />
      <AddMemberDialog open={addMemberOpen} onOpenChange={setAddMemberOpen} />
      <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} title="Delete Organization" description={`Delete ${org.name}? All members will be removed and events will be affected.`} confirmLabel={deleting ? "Deleting..." : "Delete"} onConfirm={handleDelete} />
      <RequestModificationDialog open={modifyOpen} onOpenChange={setModifyOpen} orgName={org.name} />
    </div>
  )
}

function OverviewTab({ org }: { org: Organization }) {
  const info = [
    { label: "Type", value: org.organizer_type, icon: <HugeiconsIcon icon={Building01Icon} strokeWidth={2} className="size-4 text-muted-foreground" /> },
    { label: "Category", value: org.category, icon: <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} className="size-4 text-muted-foreground" /> },
    { label: "Email", value: org.contact_email ?? "—", icon: <HugeiconsIcon icon={Mail01Icon} strokeWidth={2} className="size-4 text-muted-foreground" /> },
    { label: "Phone", value: org.contact_phone ?? "—", icon: <HugeiconsIcon icon={SmartPhone01Icon} strokeWidth={2} className="size-4 text-muted-foreground" /> },
    { label: "Location", value: `${org.city}, ${org.region ?? ""} — ${org.country}`, icon: <HugeiconsIcon icon={MapPinpoint01Icon} strokeWidth={2} className="size-4 text-muted-foreground" /> },
    { label: "Website", value: org.website_url ?? "—", icon: <HugeiconsIcon icon={Globe02Icon} strokeWidth={2} className="size-4 text-muted-foreground" /> },
    { label: "TIN Number", value: org.tin_number ?? "—", icon: <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-4 text-muted-foreground" /> },
    { label: "Est. Audience", value: org.estimated_audience?.replace("_", "—") ?? "—", icon: <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} className="size-4 text-muted-foreground" /> },
    { label: "Frequency", value: org.event_frequency ?? "—", icon: <HugeiconsIcon icon={Calendar01Icon} strokeWidth={2} className="size-4 text-muted-foreground" /> },
    { label: "Created", value: org.created_at ? fmt(org.created_at) : "—", icon: <HugeiconsIcon icon={Calendar01Icon} strokeWidth={2} className="size-4 text-muted-foreground" /> },
    { label: "Updated", value: org.updated_at ? fmt(org.updated_at) : "—", icon: <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-4 text-muted-foreground" /> },
  ]
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs">
        <h3 className="font-semibold mb-4">Details</h3>
        {org.description && <p className="text-sm text-muted-foreground mb-4">{org.description}</p>}
        <div className="space-y-4">{info.map((i) => (<div key={i.label} className="flex items-start gap-3"><div className="mt-0.5">{i.icon}</div><div><p className="text-xs text-muted-foreground capitalize">{i.label}</p><p className="text-sm font-medium">{i.value}</p></div></div>))}</div>
      </div>
      <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs flex items-center justify-center">
        <div className="text-center"><div className="flex size-16 mx-auto items-center justify-center rounded-full bg-muted mb-3"><HugeiconsIcon icon={Building01Icon} strokeWidth={2} className="size-7 text-muted-foreground" /></div><p className="font-semibold">{org.name}</p><p className="text-sm text-muted-foreground">{org.organizer_type} — {org.category}</p></div>
      </div>
    </div>
  )
}

function VerificationTab({ onConfirm, onRequestModification }: {
  onConfirm: (title: string, desc: string, label: string) => void
  onRequestModification: () => void
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs">
      <h3 className="font-semibold mb-4">Verification History</h3>
      <div className="space-y-4">
        {mockVerifications.map((v) => {
          const s = verifStatus[v.status]
          return (
            <div key={v.id} className="rounded-lg border border-border/50 px-4 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", s.cls)}>{s.label}</span>
                <span className="text-xs text-muted-foreground">Submitted {fmtDate(v.submitted_at)}</span>
              </div>
              {v.notes && <p className="text-sm text-muted-foreground mb-1">{v.notes}</p>}
              {v.feedback && <p className="text-sm text-amber-700 bg-amber-50 dark:bg-amber-950/20 rounded-lg px-3 py-1.5 mt-1">Feedback: {v.feedback}</p>}

              {(v.status === "pending" || v.status === "modification_requested") && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/25">
                  <Button size="xs" className="bg-emerald-500 text-white hover:bg-emerald-600" onClick={() => onConfirm("Approve Verification", "Approve this verification request?", "Approve")}>
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-3" />Approve
                  </Button>
                  <Button size="xs" variant="destructive" onClick={() => onConfirm("Reject Verification", "Reject this verification request?", "Reject")}>
                    <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-3" />Reject
                  </Button>
                  {v.status === "pending" && (
                    <Button size="xs" variant="outline" onClick={onRequestModification}>
                      <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} className="size-3" />Request Changes
                    </Button>
                  )}
                </div>
              )}

              {(v.status === "approved" || v.status === "rejected") && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/25">
                  <Button size="xs" variant="outline" onClick={() => onConfirm("Reopen Request", "Reopen this verification request for re-review?", "Reopen")}>
                    <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className="size-3" />Reopen
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MembersTab({ onAdd, onConfirm }: { onAdd: () => void; onConfirm: (title: string, desc: string, label: string) => void }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4"><h3 className="font-semibold">Members</h3><Button size="sm" onClick={onAdd} className="bg-lime-500 text-white hover:bg-lime-600"><HugeiconsIcon icon={PlusSignCircleIcon} strokeWidth={2} className="size-4" />Add Member</Button></div>
      <div className="space-y-2">{mockMembers.map((m) => (
        <div key={m.id} className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className={cn("rounded-md px-2 py-0.5 text-xs font-medium", roleConfig[m.role].cls)}>{roleConfig[m.role].label}</span>
            <span className="text-sm">{m.user_email}</span>
            {m.suspended && <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-red-50 text-red-700">Suspended</span>}
          </div>
          <div className="flex items-center gap-1">
            <button className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground" onClick={() => onConfirm("Change Role", `Update role for ${m.user_email}?`, "Change")}>
              <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} className="size-3.5" />
            </button>
            {m.suspended ? (
              <button className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground" onClick={() => onConfirm("Activate Member", `Activate ${m.user_email}?`, "Activate")}>
                <HugeiconsIcon icon={UserCheck01Icon} strokeWidth={2} className="size-3.5" />
              </button>
            ) : (
              <button className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground" onClick={() => onConfirm("Suspend Member", `Suspend ${m.user_email}?`, "Suspend")}>
                <HugeiconsIcon icon={UserBlock01Icon} strokeWidth={2} className="size-3.5" />
              </button>
            )}
            <button className="flex size-7 items-center justify-center rounded-md text-destructive hover:bg-destructive/10" onClick={() => onConfirm("Remove Member", `Remove ${m.user_email}?`, "Remove")}>
              <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} className="size-3.5" />
            </button>
          </div>
        </div>
      ))}</div>
    </div>
  )
}
