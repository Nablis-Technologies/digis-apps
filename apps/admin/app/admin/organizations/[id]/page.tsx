"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon, Building01Icon, Mail01Icon, SmartPhone01Icon, Calendar01Icon,
  Globe02Icon, MapPinpoint01Icon, MoreHorizontalIcon, Edit01Icon, Delete01Icon,
  CheckmarkCircle01Icon, Cancel01Icon, Edit02Icon, UserCheck01Icon, UserBlock01Icon,
  Clock01Icon, PlusSignCircleIcon, RefreshIcon, Ticket01Icon, Dollar01Icon,
  UserGroupIcon, Mail02Icon, File01Icon, ChartBarLineIcon,
  Calendar03Icon, CheckmarkBadge01Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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
import { RequestModificationDialog } from "@/components/forms/request-modification-dialog"
import {
  useGetOrganizationQuery,
  useDeleteOrganizationMutation,
  type Organization,
} from "@/store/reducers/organizationsApi"

// ─── Mock Data ──────────────────────────────────────────────────────────────

const mockVerifications: {
  id: string; status: "pending" | "approved" | "rejected" | "modification_requested"
  submitted_at: string; reviewed_at: string | null; notes: string | null; feedback: string | null
}[] = [
  { id: "v1", status: "approved", submitted_at: "2026-01-12T10:00:00Z", reviewed_at: "2026-01-14T09:00:00Z", notes: "All documents verified", feedback: null },
  { id: "v2", status: "modification_requested", submitted_at: "2026-03-01T11:00:00Z", reviewed_at: "2026-03-03T14:00:00Z", notes: "Update required", feedback: "TIN certificate unclear" },
  { id: "v3", status: "approved", submitted_at: "2026-03-10T09:00:00Z", reviewed_at: "2026-03-12T11:00:00Z", notes: "Resubmitted documents OK", feedback: null },
  { id: "v4", status: "pending", submitted_at: "2026-06-20T08:00:00Z", reviewed_at: null, notes: "Initial submission awaiting review", feedback: null },
]

const mockMembers: {
  id: string; user_id: string; user_email: string; role: "owner" | "admin" | "staff" | "member"
  suspended: boolean; joined_at: string
}[] = [
  { id: "m1", user_id: "u1", user_email: "abebe@example.com", role: "owner", suspended: false, joined_at: "2026-01-10T00:00:00Z" },
  { id: "m2", user_id: "u2", user_email: "meron@example.com", role: "admin", suspended: false, joined_at: "2026-01-15T00:00:00Z" },
  { id: "m3", user_id: "u4", user_email: "hanna@example.com", role: "staff", suspended: false, joined_at: "2026-02-01T00:00:00Z" },
  { id: "m4", user_id: "u9", user_email: "fikir@example.com", role: "member", suspended: true, joined_at: "2026-04-01T00:00:00Z" },
]

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

const eventStatus: Record<string, { label: string; cls: string }> = {
  published: { label: "Published", cls: "bg-emerald-50 text-emerald-700" },
  draft: { label: "Draft", cls: "bg-zinc-50 text-zinc-500" },
  cancelled: { label: "Cancelled", cls: "bg-red-50 text-red-700" },
  completed: { label: "Completed", cls: "bg-blue-50 text-blue-700" },
}

const verificationItems = [
  { label: "Business Registration", status: "verified" as const },
  { label: "Tax Identification Number", status: "verified" as const },
  { label: "Address Verification", status: "verified" as const },
  { label: "Bank Information", status: "pending" as const },
  { label: "Brand Assets", status: "pending" as const },
]

type Tab = "overview" | "verification" | "members" | "activity" | "documents"

// ─── Main Page Component ────────────────────────────────────────────────────

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

  function confirmAction() {
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

  const verifiedCount = verificationItems.filter((v) => v.status === "verified").length
  const onboardingPercent = Math.round((verifiedCount / verificationItems.length) * 100)

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
        {(["overview", "verification", "members", "activity", "documents"] as Tab[]).map((t) => (
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

      {/* ── Tab Content ── */}
      {tab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px] items-start">
          <div className="space-y-6 min-w-0">
            <OverviewTab org={org} />
          </div>
          <div className="space-y-4 lg:sticky lg:top-[calc(var(--header-height)+1.5rem)]">
            <OrgSummaryCard org={org} />
            <AccountManagerCard />
            <OnboardingProgressCard percent={onboardingPercent} verifiedCount={verifiedCount} total={verificationItems.length} />
            <VerificationChecklistCard items={verificationItems} />
            <ActivityFeedCard items={mockActivity} />
          </div>
        </div>
      )}
      {tab === "verification" && <VerificationTab onConfirm={confirmAction} onRequestModification={() => setModifyOpen(true)} />}
      {tab === "members" && <MembersTab onAdd={() => setAddMemberOpen(true)} onConfirm={confirmAction} />}
      {tab === "activity" && <PlaceholderTab title="Activity" description="Full activity history coming soon." />}
      {tab === "documents" && <PlaceholderTab title="Documents" description="Document management coming soon." />}

      {/* ── Dialogs ── */}
      <OrganizationDialog open={editOpen} onOpenChange={setEditOpen} organization={org} />
      <TransferOwnershipDialog open={transferOpen} onOpenChange={setTransferOpen} orgName={org.name} />
      <AddMemberDialog open={addMemberOpen} onOpenChange={setAddMemberOpen} />
      <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} title="Delete Organization" description={`Delete ${org.name}? All members will be removed and events will be affected.`} confirmLabel={deleting ? "Deleting..." : "Delete"} onConfirm={handleDelete} />
      <RequestModificationDialog open={modifyOpen} onOpenChange={setModifyOpen} orgName={org.name} />
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                  <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem><HugeiconsIcon icon={Edit01Icon} strokeWidth={2} />Edit</DropdownMenuItem>
                <DropdownMenuItem><HugeiconsIcon icon={Calendar01Icon} strokeWidth={2} />View Details</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        />
      </div>
    </>
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

function OnboardingProgressCard({ percent, verifiedCount, total }: { percent: number; verifiedCount: number; total: number }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 shadow-xs">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Onboarding Progress</p>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-2xl font-semibold tracking-tight">{percent}%</span>
        <span className="text-xs text-muted-foreground">{verifiedCount} of {total} steps completed</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-lime-500 transition-all duration-500" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

function VerificationChecklistCard({ items }: { items: { label: string; status: "verified" | "pending" }[] }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 shadow-xs">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Verification Status</p>
      <div className="space-y-2.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-2">
            <span className="text-sm">{item.label}</span>
            {item.status === "verified" ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-full px-2 py-0.5">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-3" />
                Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 rounded-full px-2 py-0.5">
                <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-3" />
                Pending
              </span>
            )}
          </div>
        ))}
      </div>
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
