"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  OfficeIcon,
  CheckmarkCircle01Icon,
  SquareIcon,
  Building01Icon,
  MoreHorizontalIcon,
  Edit01Icon,
  Delete01Icon,
  Share01Icon,
  PlusSignCircleIcon,
  RefreshIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { DataTable, type Column, type SortConfig } from "@/components/ui/data-table"
import { StatsCard } from "@/components/dashboard/stats-card"
import { OrganizationDialog } from "@/components/forms/organization-dialog"
import { ConfirmDialog } from "@/components/forms/confirm-dialog"
import { TransferOwnershipDialog } from "@/components/forms/transfer-ownership-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  useListOrganizationsQuery,
  useDeleteOrganizationMutation,
  type Organization,
} from "@/store/reducers/organizationsApi"

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", active ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-zinc-50 text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-500")}>
      {active ? "Active" : "Inactive"}
    </span>
  )
}

function VerifiedBadge({ verified }: { verified: boolean }) {
  return (
    <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", verified ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400" : "bg-zinc-50 text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-500")}>
      {verified ? "Verified" : "Unverified"}
    </span>
  )
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span className={cn("inline-block rounded-md px-2 py-0.5 text-xs font-medium capitalize", type === "company" ? "bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400" : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400")}>
      {type}
    </span>
  )
}

function OrgActions({ org, onEdit, onTransfer, onDelete }: { org: Organization; onEdit: (o: Organization) => void; onTransfer: (o: Organization) => void; onDelete: (o: Organization) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
          <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={() => onEdit(org)}><HugeiconsIcon icon={Edit01Icon} strokeWidth={2} />Edit Organization</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onTransfer(org)}><HugeiconsIcon icon={Share01Icon} strokeWidth={2} />Transfer Ownership</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(org)}><HugeiconsIcon icon={Delete01Icon} strokeWidth={2} />Delete Organization</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function OrganizationsPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "name", direction: "asc" })

  const { data, isLoading, isFetching, refetch } = useListOrganizationsQuery({
    page,
    per_page: 10,
    order_by: sortConfig.key,
    order_direction: sortConfig.direction,
  })

  const [deleteOrg] = useDeleteOrganizationMutation()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Organization | null>(null)
  const [transferOrg, setTransferOrg] = useState<Organization | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmItem, setConfirmItem] = useState<Organization | null>(null)
  const [confirmSubmitting, setConfirmSubmitting] = useState(false)

  const orgs = data?.data ?? []
  const pagination = data?.pagination
  const total = pagination?.total_count ?? 0
  const totalPages = pagination?.total_pages ?? 1
  const perPage = pagination?.per_page ?? 10

  const stats = {
    total,
    active: orgs.filter((o) => o.active).length,
    verified: orgs.filter((o) => o.verified).length,
    companies: orgs.filter((o) => o.organizer_type === "company").length,
  }

  const columns: Column<Organization>[] = [
    {
      header: "Name",
      accessorKey: "name",
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-medium text-foreground">{row.name}</p>
          {row.description && <p className="text-xs text-muted-foreground max-w-56 truncate">{row.description}</p>}
        </div>
      ),
    },
    { header: "Type", accessorKey: "organizer_type", sortable: true, cell: (row) => <TypeBadge type={row.organizer_type} /> },
    {
      header: "Location",
      cell: (row) => (
        <div className="text-sm">
          <p>{row.city}</p>
          <p className="text-xs text-muted-foreground">{row.region ?? row.country}</p>
        </div>
      ),
      hideOnMobile: true,
    },
    { header: "Verified", accessorKey: "verified", sortable: true, cell: (row) => <VerifiedBadge verified={row.verified} /> },
    { header: "Status", accessorKey: "active", sortable: true, cell: (row) => <ActiveBadge active={row.active} /> },
    {
      header: "Created",
      accessorKey: "created_at",
      sortable: true,
      className: "text-muted-foreground",
      hideOnMobile: true,
      cell: (row) => row.created_at ? new Date(row.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—",
    },
  ]

  async function handleDelete() {
    if (!confirmItem) return
    setConfirmSubmitting(true)
    try {
      await deleteOrg(confirmItem.id).unwrap()
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
          <h1 className="text-2xl font-semibold tracking-tight">Organizations</h1>
          <p className="text-sm text-muted-foreground">Manage event organizer accounts</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => refetch()} className="inline-flex items-center gap-2 rounded-lg border border-border/50 bg-card px-4 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-accent">
            <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className="size-4" />Refresh
          </button>
          <button type="button" onClick={() => { setEditing(null); setDialogOpen(true) }} className="inline-flex items-center gap-2 rounded-lg bg-lime-500 px-4 py-2 text-sm font-medium text-white shadow-xs transition-colors hover:bg-lime-600">
            <HugeiconsIcon icon={PlusSignCircleIcon} strokeWidth={2} className="size-4" />Create Organization
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Orgs" value={stats.total} icon={OfficeIcon} sparklineData={[98, 112, 120, 134, 142, 150, 156]} sparklineColor="var(--chart-1)" />
        <StatsCard title="Active" value={stats.active} icon={CheckmarkCircle01Icon} trend={{ value: stats.total > 0 ? `${Math.round((stats.active / stats.total) * 100)}%` : "0%", positive: true }} sparklineData={[80, 88, 95, 105, 112, 118, stats.active]} sparklineColor="var(--chart-2)" />
        <StatsCard title="Verified" value={stats.verified} icon={Building01Icon} trend={{ value: stats.total > 0 ? `${Math.round((stats.verified / stats.total) * 100)}%` : "0%", positive: true }} sparklineData={[45, 52, 58, 65, 72, 78, stats.verified]} sparklineColor="var(--chart-3)" />
        <StatsCard title="Companies" value={stats.companies} icon={SquareIcon} sparklineData={[30, 34, 38, 42, 46, 50, stats.companies]} sparklineColor="var(--chart-4)" />
      </div>

      <DataTable
        columns={columns}
        data={orgs}
        keyExtractor={(row) => row.id}
        isLoading={isLoading || isFetching}
        sortConfig={sortConfig}
        onSort={(cfg) => { setSortConfig(cfg); setPage(1) }}
        pagination={{ page, perPage, total, totalPages }}
        onPageChange={setPage}
        onRowClick={(row) => router.push(`/admin/organizations/${row.id}`)}
        renderActions={(row) => <OrgActions org={row} onEdit={(o) => { setEditing(o); setDialogOpen(true) }} onTransfer={(o) => setTransferOrg(o)} onDelete={(o) => { setConfirmItem(o); setConfirmOpen(true) }} />}
      />

      <OrganizationDialog open={dialogOpen} onOpenChange={setDialogOpen} organization={editing} />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(o) => { if (!confirmSubmitting) setConfirmOpen(o) }}
        title="Delete Organization"
        description={`Delete "${confirmItem?.name}"? All members will be removed and events will be affected.`}
        confirmLabel={confirmSubmitting ? "Deleting..." : "Delete"}
        onConfirm={handleDelete}
      />
      <TransferOwnershipDialog open={!!transferOrg} onOpenChange={(o) => { if (!o) setTransferOrg(null) }} orgName={transferOrg?.name} />
    </div>
  )
}
