"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon, Building01Icon, Mail01Icon, SmartPhone01Icon, Calendar01Icon,
  Globe02Icon, MapPinpoint01Icon, MoreHorizontalIcon, Edit01Icon, Delete01Icon,
  CheckmarkCircle01Icon, Edit02Icon, Cancel01Icon,
  Clock01Icon, PlusSignCircleIcon, Ticket01Icon, Dollar01Icon,
  UserGroupIcon, Mail02Icon, File01Icon, ChartBarLineIcon,
  Calendar03Icon, CheckmarkBadge01Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { toastSuccess, toastError } from "@/lib/toast"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTable, type Column } from "@/components/ui/data-table"
import { StatsCard } from "@/components/dashboard/stats-card"
import { OrganizationDialog } from "@/components/forms/organization-dialog"
import { TransferOwnershipDialog } from "@/components/forms/transfer-ownership-dialog"
import { AddMemberDialog } from "@/components/forms/add-member-dialog"
import { ConfirmDialog } from "@/components/forms/confirm-dialog"
import {
  useGetOrganizationQuery,
  useDeleteOrganizationMutation,
  useApproveVerificationMutation,
  useRejectVerificationMutation,
  useRequestVerificationModificationMutation,
  type Organization,
} from "@/store/reducers/organizationsApi"
import {
  useListMembershipsQuery,
  useUpdateMembershipMutation,
  useDeleteMembershipMutation,
} from "@/store/reducers/membershipsApi"

// ─── Mock Data ──────────────────────────────────────────────────────────────

const sparklineA = [4, 7, 5, 12, 8, 10, 14]
const sparklineB = [800, 1200, 950, 1800, 1500, 2100, 2450]
const sparklineC = [18, 25, 20, 35, 28, 40, 42]
const sparklineD = [8, 8, 9, 10, 11, 12, 14]

type MockEvent = {
  id: string; name: string; type: string; date: string; venue: string
  status: "published" | "draft" | "cancelled" | "completed"
  ticketsSold: number; totalTickets: number; revenue: number
}

const mockEvents: MockEvent[] = [
  { id: "e1", name: "Summer Music Festival", type: "Concert", date: "2026-07-15T18:00:00Z", venue: "Addis Stadium", status: "published", ticketsSold: 2450, totalTickets: 5000, revenue: 49000 },
  { id: "e2", name: "Tech Summit 2026", type: "Conference", date: "2026-08-01T09:00:00Z", venue: "Sheraton Ballroom", status: "published", ticketsSold: 890, totalTickets: 1200, revenue: 44500 },
  { id: "e3", name: "Ethiopian Jazz Night", type: "Concert", date: "2026-09-10T20:00:00Z", venue: "Jazzamba Lounge", status: "draft", ticketsSold: 0, totalTickets: 300, revenue: 0 },
  { id: "e4", name: "Addis Art Expo", type: "Exhibition", date: "2026-06-20T10:00:00Z", venue: "National Museum", status: "completed", ticketsSold: 1580, totalTickets: 1600, revenue: 23700 },
  { id: "e5", name: "Startup Pitch Night", type: "Networking", date: "2026-10-05T17:00:00Z", venue: "ICE Addis", status: "published", ticketsSold: 420, totalTickets: 500, revenue: 8400 },
  { id: "e6", name: "Cultural Dance Festival", type: "Festival", date: "2026-11-20T14:00:00Z", venue: "Meskel Square", status: "published", ticketsSold: 3100, totalTickets: 8000, revenue: 46500 },
]

type ActivityItem = {
  icon: React.ReactNode
  description: string
  time: string
  color: string
}

const mockActivity: ActivityItem[] = [
  { icon: <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-3.5" />, description: "Published new event: Summer Music Festival", time: "2h ago", color: "text-blue-500" },
  { icon: <HugeiconsIcon icon={File01Icon} strokeWidth={2} className="size-3.5" />, description: "Uploaded tax identification document", time: "1d ago", color: "text-amber-500" },
  { icon: <HugeiconsIcon icon={ChartBarLineIcon} strokeWidth={2} className="size-3.5" />, description: "Generated monthly revenue report", time: "3d ago", color: "text-emerald-500" },
  { icon: <HugeiconsIcon icon={CheckmarkBadge01Icon} strokeWidth={2} className="size-3.5" />, description: "Address verification completed", time: "5d ago", color: "text-violet-500" },
  { icon: <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className="size-3.5" />, description: "Added 2 new team members", time: "1w ago", color: "text-rose-500" },
]

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtDate(iso: string) { return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) }

const roleConfig: Record<string, { label: string; cls: string }> = {
  owner: { label: "Owner", cls: "bg-violet-50 text-violet-700" },
  admin: { label: "Admin", cls: "bg-blue-50 text-blue-700" },
  staff: { label: "Staff", cls: "bg-amber-50 text-amber-700" },
  member: { label: "Member", cls: "bg-zinc-50 text-zinc-600" },
}

function roleBadge(role: string) {
  const cfg = roleConfig[role] ?? { label: role, cls: "bg-zinc-50 text-zinc-600" }
  return <span className={cn("rounded-md px-2 py-0.5 text-xs font-medium", cfg.cls)}>{cfg.label}</span>
}

const eventStatus: Record<string, { label: string; cls: string }> = {
  published: { label: "Published", cls: "bg-emerald-50 text-emerald-700" },
  draft: { label: "Draft", cls: "bg-zinc-50 text-zinc-500" },
  cancelled: { label: "Cancelled", cls: "bg-red-50 text-red-700" },
  completed: { label: "Completed", cls: "bg-blue-50 text-blue-700" },
}

type Tab = "overview" | "verification" | "members" | "activity"

const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "overview", label: "Overview", icon: <HugeiconsIcon icon={Building01Icon} strokeWidth={2} className="size-3.5" /> },
  { key: "verification", label: "Verification", icon: <HugeiconsIcon icon={CheckmarkBadge01Icon} strokeWidth={2} className="size-3.5" /> },
  { key: "members", label: "Members", icon: <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className="size-3.5" /> },
  { key: "activity", label: "Activity", icon: <HugeiconsIcon icon={ChartBarLineIcon} strokeWidth={2} className="size-3.5" /> },
]

// ─── Main Page Component ────────────────────────────────────────────────────

export default function OrgDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data, isLoading: loading } = useGetOrganizationQuery(id)
  const [deleteOrg, { isLoading: deleting }] = useDeleteOrganizationMutation()
  const [approveVerification] = useApproveVerificationMutation()
  const [rejectVerification] = useRejectVerificationMutation()
  const [requestVerificationModification] = useRequestVerificationModificationMutation()

  const org = data?.data

  const [tab, setTab] = useState<Tab>("overview")
  const [editOpen, setEditOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [addMemberOpen, setAddMemberOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [feedbackDialog, setFeedbackDialog] = useState<{ mode: "reject" | "modify" } | null>(null)

  async function handleDelete() {
    if (!org) return
    try {
      await deleteOrg(org.id).unwrap()
      toastSuccess("Organization deleted.")
      router.replace("/admin/organizations")
    } catch (err) {
      toastError(err, "Failed to delete organization.")
      // stay open to retry
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-9 rounded-lg" />
          <div className="flex-1"><Skeleton className="h-7 w-64" /><Skeleton className="mt-1 h-4 w-96" /></div>
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[120px] rounded-xl" />)}
        </div>
        <Skeleton className="h-[600px] w-full rounded-xl" />
      </div>
    )
  }

  if (!org) {
    return (
      <div className="space-y-6">
        <Link href="/admin/organizations" className="flex size-9 items-center justify-center rounded-lg border border-border/50 bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"><HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" /></Link>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium">Organization not found</p>
          <p className="text-sm text-muted-foreground">The organization you&apos;re looking for doesn&apos;t exist or has been deleted.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start gap-4">
        <Link href="/admin/organizations" className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition-colors mt-1">
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight">{org.name}</h1>
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", org.verified ? "bg-blue-50 text-blue-700" : "bg-zinc-50 text-zinc-500")}>
              {org.verified ? "Verified" : "Unverified"}
            </span>
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", org.active ? "bg-emerald-50 text-emerald-700" : "bg-zinc-50 text-zinc-500")}>
              {org.active ? "Active" : "Inactive"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {org.description ?? `${org.organizer_type === "company" ? "Company" : "Individual"} organizer based in ${org.city ?? "—"}, ${org.country ?? "—"}`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm">
            <HugeiconsIcon icon={Mail02Icon} strokeWidth={2} className="size-4" />
            Message
          </Button>
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
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => setTransferOpen(true)}>
                <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} />Transfer Ownership
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setConfirmOpen(true)}>
                <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} />Delete Organization
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatsCard title="Events Hosted" value={48} icon={Calendar01Icon} trend={{ value: "+12%", positive: true }} sparklineData={sparklineA} sparklineColor="var(--chart-2)" />
        <StatsCard title="Tickets Sold" value="12,450" icon={Ticket01Icon} trend={{ value: "+8.3%", positive: true }} sparklineData={sparklineB} sparklineColor="var(--chart-1)" />
        <StatsCard title="Revenue" value="$284,200" icon={Dollar01Icon} trend={{ value: "+18.5%", positive: true }} sparklineData={sparklineC} sparklineColor="var(--chart-3)" />
        <StatsCard title="Team Members" value={14} icon={UserGroupIcon} trend={{ value: "+2", positive: true }} sparklineData={sparklineD} sparklineColor="var(--chart-4)" />
      </div>

      {/* ── Tabs ── */}
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

      {/* ── Tab Content ── */}
      {tab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px] items-start">
          <div className="space-y-6 min-w-0">
            <OverviewTab org={org} />
          </div>
          <div className="space-y-4 lg:sticky lg:top-[calc(var(--header-height)+1.5rem)]">
            <OrgSummaryCard org={org} />
            <AccountManagerCard />
            <ActivityFeedCard items={mockActivity} />
          </div>
        </div>
      )}
      {tab === "verification" && (
        <VerificationTab
          verified={org.verified}
          onApprove={async () => {
            try {
              await approveVerification(org.id).unwrap()
              toastSuccess("Verification approved.")
            } catch (err) {
              toastError(err, "Failed to approve verification.")
            }
          }}
          onReject={() => setFeedbackDialog({ mode: "reject" })}
          onRequestModification={() => setFeedbackDialog({ mode: "modify" })}
        />
      )}
      {tab === "members" && <MembersTab orgId={org.id} onAdd={() => setAddMemberOpen(true)} />}
      {tab === "activity" && <PlaceholderTab title="Activity" description="Full activity history coming soon." />}

      {/* ── Dialogs ── */}
      <OrganizationDialog open={editOpen} onOpenChange={setEditOpen} organization={org} />
      <TransferOwnershipDialog open={transferOpen} onOpenChange={setTransferOpen} orgId={org.id} orgName={org.name} />
      <AddMemberDialog open={addMemberOpen} onOpenChange={setAddMemberOpen} orgId={org.id} />
      <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} title="Delete Organization" description={`Delete ${org.name}? All members will be removed and events will be affected.`} confirmLabel={deleting ? "Deleting..." : "Delete"} onConfirm={handleDelete} />
      {feedbackDialog && (
        <VerificationFeedbackDialog
          mode={feedbackDialog.mode}
          onOpenChange={(o) => { if (!o) setFeedbackDialog(null) }}
          onConfirm={async (feedback) => {
            if (feedbackDialog.mode === "reject") {
              await rejectVerification({ id: org.id, feedback }).unwrap()
              toastSuccess("Verification rejected.")
            } else {
              await requestVerificationModification({ id: org.id, feedback }).unwrap()
              toastSuccess("Modification requested.")
            }
            setFeedbackDialog(null)
          }}
        />
      )}
    </div>
  )
}

// ─── Tab Components ─────────────────────────────────────────────────────────

function OverviewTab({ org }: { org: Organization }) {
  const profileFields = [
    { label: "Organization Type", value: org.organizer_type === "company" ? "Company" : "Individual", icon: Building01Icon },
    { label: "Category", value: org.category ?? "—", icon: Building01Icon },
    { label: "Email", value: org.contact_email ?? "—", icon: Mail01Icon },
    { label: "Phone", value: org.contact_phone ?? "—", icon: SmartPhone01Icon },
    { label: "Website", value: org.website_url ?? "—", icon: Globe02Icon },
    { label: "Business Reg #", value: "REG-2024-00142", icon: File01Icon },
    { label: "TIN Number", value: org.tin_number ?? "—", icon: CheckmarkCircle01Icon },
    { label: "Location", value: `${org.city ?? "—"}, ${org.region ?? ""} — ${org.country ?? "—"}`, icon: MapPinpoint01Icon },
    { label: "Est. Audience", value: org.estimated_audience?.replace(/_/g, " ") ?? "—", icon: UserGroupIcon },
    { label: "Event Frequency", value: org.event_frequency ?? "—", icon: Calendar01Icon },
  ]

  const eventColumns: Column<MockEvent>[] = [
    { header: "Event", accessorKey: "name", cell: (row) => <span className="font-medium">{row.name}</span> },
    { header: "Type", accessorKey: "type", hideOnMobile: true, cell: (row) => <span className="text-muted-foreground">{row.type}</span> },
    { header: "Date", accessorKey: "date", cell: (row) => <span className="text-sm">{fmtDate(row.date)}</span> },
    { header: "Venue", accessorKey: "venue", hideOnMobile: true },
    { header: "Status", accessorKey: "status", cell: (row) => {
      const s = eventStatus[row.status]
      return <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", s.cls)}>{s.label}</span>
    }},
    { header: "Tickets", accessorKey: "ticketsSold", cell: (row) => (
      <div className="flex items-center gap-2 min-w-[120px]">
        <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-lime-500 transition-all" style={{ width: `${row.totalTickets > 0 ? (row.ticketsSold / row.totalTickets) * 100 : 0}%` }} />
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">{row.ticketsSold}/{row.totalTickets}</span>
      </div>
    )},
    { header: "Revenue", accessorKey: "revenue", cell: (row) => <span className="font-medium tabular-nums">${row.revenue.toLocaleString()}</span> },
  ]

  return (
    <>
      {/* Profile Card */}
      <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs">
        <h3 className="font-semibold mb-1">Organization Profile</h3>
        <p className="text-sm text-muted-foreground mb-4">Core information about this organization</p>
        <Separator className="mb-5" />
        <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
          {profileFields.map((f) => (
            <div key={f.label} className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                <HugeiconsIcon icon={f.icon} strokeWidth={2} className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{f.label}</p>
                <p className="text-sm font-medium truncate">{f.value}</p>
              </div>
            </div>
          ))}
        </div>
        {org.description && (
          <>
            <Separator className="my-5" />
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Description</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{org.description}</p>
            </div>
          </>
        )}
      </div>

      {/* Events Table */}
      <div>
        <h3 className="font-semibold mb-3">Upcoming / Recent Events</h3>
        <DataTable
          columns={eventColumns}
          data={mockEvents}
          keyExtractor={(row) => row.id}
          pagination={{ page: 1, totalPages: 1, total: mockEvents.length, perPage: 10 }}
          renderActions={() => (
            <div className="flex items-center gap-1">
              <button className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} className="size-4" />
              </button>
              <button className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                <HugeiconsIcon icon={Calendar01Icon} strokeWidth={2} className="size-4" />
              </button>
            </div>
          )}
        />
      </div>
    </>
  )
}

function VerificationTab({
  verified,
  onApprove,
  onReject,
  onRequestModification,
}: {
  verified: boolean
  onApprove: () => void
  onReject: () => void
  onRequestModification: () => void
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs">
      <h3 className="font-semibold mb-1">Verification</h3>
      <p className="text-sm text-muted-foreground mb-5">Review and manage this organization&apos;s verification status.</p>
      <div className="flex items-center gap-3 rounded-lg border border-border/50 px-4 py-3 mb-5">
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", verified ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400")}>
          {verified ? "Verified" : "Unverified"}
        </span>
        <span className="text-sm text-muted-foreground">
          {verified ? "This organization has been verified." : "This organization has not been verified yet."}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" className="bg-emerald-500 text-white hover:bg-emerald-600" onClick={onApprove} disabled={verified}>
          <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-4" />Approve
        </Button>
        <Button size="sm" variant="destructive" onClick={onReject} disabled={!verified}>
          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-4" />Reject
        </Button>
        <Button size="sm" variant="outline" onClick={onRequestModification} disabled={!verified}>
          <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} className="size-4" />Request Changes
        </Button>
      </div>
    </div>
  )
}

function VerificationFeedbackDialog({
  mode,
  onOpenChange,
  onConfirm,
}: {
  mode: "reject" | "modify"
  onOpenChange: (open: boolean) => void
  onConfirm: (feedback: string) => Promise<void>
}) {
  const [feedback, setFeedback] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!feedback.trim()) return
    setSubmitting(true)
    try {
      await onConfirm(feedback)
      onOpenChange(false)
    } catch {
      // stay open to retry
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!submitting) onOpenChange(o) }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "reject" ? "Reject Verification" : "Request Changes"}</DialogTitle>
          <DialogDescription>
            {mode === "reject" ? "Provide a reason for rejecting this verification." : "Ask the organization to provide additional information or fix issues."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="feedback">
              Feedback <span className="text-destructive">*</span>
            </Label>
            <textarea
              id="feedback"
              rows={4}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50 resize-none"
              placeholder="Please provide a clearer copy of your TIN certificate..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={submitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!feedback.trim() || submitting} className="bg-lime-500 text-white hover:bg-lime-600 disabled:bg-lime-500/50">
              {submitting ? "Sending..." : "Send"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function MembersTab({
  orgId,
  onAdd,
}: {
  orgId: string
  onAdd: () => void
}) {
  const { data, isLoading } = useListMembershipsQuery({ organizationId: orgId })
  const [updateMember, { isLoading: updating }] = useUpdateMembershipMutation()
  const [deleteMember, { isLoading: deleting }] = useDeleteMembershipMutation()
  const members = data?.data ?? []

  async function changeRole(m: (typeof members)[number], role: "admin" | "member") {
    try {
      await updateMember({
        organizationId: orgId,
        id: m.id,
        body: { membership: { role } },
      }).unwrap()
      toastSuccess("Member role updated.")
    } catch (err) {
      toastError(err, "Failed to update member role.")
      // stay — RTK invalidation will refetch
    }
  }

  async function removeMember(m: (typeof members)[number]) {
    try {
      await deleteMember({ organizationId: orgId, id: m.id }).unwrap()
      toastSuccess("Member removed.")
    } catch (err) {
      toastError(err, "Failed to remove member.")
      // stay
    }
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Members</h3>
        <Button size="sm" onClick={onAdd} className="bg-lime-500 text-white hover:bg-lime-600">
          <HugeiconsIcon icon={PlusSignCircleIcon} strokeWidth={2} className="size-4" />Add Member
        </Button>
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading members...</p>
      ) : members.length === 0 ? (
        <p className="text-sm text-muted-foreground">No members yet.</p>
      ) : (
        <div className="space-y-2">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-3">
              <div className="flex items-center gap-3">
                {roleBadge(m.role)}
                <span className="text-sm font-mono">{m.user_id}</span>
                {m.suspended && (
                  <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-red-50 text-red-700">Suspended</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                  disabled={updating || deleting || m.role === "owner"}
                  onClick={() => changeRole(m, m.role === "admin" ? "member" : "admin")}
                  title="Toggle role"
                >
                  <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} className="size-3.5" />
                </button>
                <button
                  className="flex size-7 items-center justify-center rounded-md text-destructive hover:bg-destructive/10"
                  disabled={deleting || m.role === "owner"}
                  onClick={() => removeMember(m)}
                  title="Remove member"
                >
                  <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
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

// ─── Right Sidebar Cards ────────────────────────────────────────────────────

function OrgSummaryCard({ org }: { org: Organization }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 shadow-xs">
      <div className="flex items-center gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <HugeiconsIcon icon={Building01Icon} strokeWidth={2} className="size-6" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold truncate">{org.name}</p>
          <p className="text-xs text-muted-foreground capitalize">{org.category ?? "—"}</p>
          <p className="text-xs text-muted-foreground">{org.city ?? "—"}, {org.country ?? "—"}</p>
        </div>
      </div>
    </div>
  )
}

function AccountManagerCard() {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 shadow-xs">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Account Manager</p>
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400 text-sm font-semibold">
          SJ
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Sarah Johnson</p>
          <p className="text-xs text-muted-foreground truncate">sarah.j@digisevents.com</p>
        </div>
      </div>
      <Button variant="outline" size="sm" className="w-full mt-3">
        <HugeiconsIcon icon={Mail02Icon} strokeWidth={2} className="size-3.5" />
        Message
      </Button>
    </div>
  )
}

function ActivityFeedCard({ items }: { items: ActivityItem[] }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 shadow-xs">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Recent Activity</p>
      <div className="space-y-0">
        {items.map((item, i) => (
          <div key={i} className={cn("flex gap-3 py-2.5", i < items.length - 1 && "border-b border-border/25")}>
            <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-full bg-muted", item.color)}>
              {item.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-snug">{item.description}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.time}</p>
            </div>
          </div>
        ))}
      </div>
      <Button variant="ghost" size="sm" className="w-full mt-3 text-xs text-muted-foreground hover:text-foreground">
        View All Activity
      </Button>
    </div>
  )
}
