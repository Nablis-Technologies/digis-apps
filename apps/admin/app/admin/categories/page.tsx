"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Tag01Icon,
  CheckmarkCircle01Icon,
  SquareIcon,
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
import { CategoryDialog } from "@/components/forms/category-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  useListCategoriesQuery,
  useDeleteCategoryMutation,
  type Category,
} from "@/store/reducers/categoriesApi"

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", active ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-zinc-50 text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-500")}>
      {active ? "Active" : "Inactive"}
    </span>
  )
}

function ColorDot({ color }: { color: string | null }) {
  if (!color) return <span className="text-muted-foreground/50">&mdash;</span>
  return <span className="inline-block size-3.5 rounded-full ring-1 ring-black/10" style={{ backgroundColor: color }} />
}

function CategoryActions({ category, onEdit, onDelete }: { category: Category; onEdit: (c: Category) => void; onDelete: (c: Category) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
          <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => onEdit(category)}>
          <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} />Edit Category
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(category)}>
          <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} />Delete Category
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function CategoriesPage() {
  const [page, setPage] = useState(1)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "name", direction: "asc" })

  const { data, isLoading, isFetching, refetch } = useListCategoriesQuery({
    page,
    per_page: 10,
    order_by: sortConfig.key,
    order_direction: sortConfig.direction,
  })

  const [deleteCategory] = useDeleteCategoryMutation()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmItem, setConfirmItem] = useState<Category | null>(null)
  const [confirmSubmitting, setConfirmSubmitting] = useState(false)

  const categories = data?.data ?? []
  const pagination = data?.pagination
  const total = pagination?.total_count ?? 0
  const totalPages = pagination?.total_pages ?? 1
  const perPage = pagination?.per_page ?? 10

  const stats = {
    total,
    active: categories.filter((c) => c.active !== false).length,
    inactive: categories.filter((c) => c.active === false).length,
  }

  const columns: Column<Category>[] = [
    {
      header: "Name",
      accessorKey: "name",
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <ColorDot color={row.metadata.color} />
          <div>
            <p className="font-medium text-foreground">{row.name}</p>
            <p className="text-xs text-muted-foreground">/{row.slug}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Description",
      cell: (row) => (
        <span className="text-sm text-muted-foreground max-w-64 truncate block">
          {row.description ?? <span className="text-muted-foreground/50">&mdash;</span>}
        </span>
      ),
      hideOnMobile: true,
    },
    { header: "Status", accessorKey: "active", sortable: true, cell: (row) => <ActiveBadge active={row.active !== false} /> },
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
      await deleteCategory(confirmItem.id).unwrap()
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
          <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground">Manage event categories and their metadata</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => refetch()} className="inline-flex items-center gap-2 rounded-lg border border-border/50 bg-card px-4 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-accent">
            <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className="size-4" />Refresh
          </button>
          <button type="button" onClick={() => { setEditing(null); setDialogOpen(true) }} className="inline-flex items-center gap-2 rounded-lg bg-lime-500 px-4 py-2 text-sm font-medium text-white shadow-xs transition-colors hover:bg-lime-600">
            <HugeiconsIcon icon={PlusSignCircleIcon} strokeWidth={2} className="size-4" />Create Category
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard title="Total Categories" value={stats.total} icon={Tag01Icon} sparklineData={[8, 10, 11, 12, 13, 14, stats.total]} sparklineColor="var(--chart-1)" />
        <StatsCard title="Active" value={stats.active} icon={CheckmarkCircle01Icon} trend={{ value: stats.total > 0 ? `${Math.round((stats.active / stats.total) * 100)}%` : "0%", positive: true }} sparklineData={[6, 7, 8, 9, 10, 11, stats.active]} sparklineColor="var(--chart-2)" />
        <StatsCard title="Inactive" value={stats.inactive} icon={SquareIcon} sparklineData={[3, 4, 3, 3, 2, 3, stats.inactive]} sparklineColor="var(--chart-3)" />
      </div>

      <DataTable
        columns={columns}
        data={categories}
        keyExtractor={(row) => row.id}
        isLoading={isLoading || isFetching}
        sortConfig={sortConfig}
        onSort={(cfg) => { setSortConfig(cfg); setPage(1) }}
        pagination={{ page, perPage, total, totalPages }}
        onPageChange={setPage}
        renderActions={(row) => (
          <CategoryActions
            category={row}
            onEdit={(c) => { setEditing(c); setDialogOpen(true) }}
            onDelete={(c) => { setConfirmItem(c); setConfirmOpen(true) }}
          />
        )}
      />

      <CategoryDialog open={dialogOpen} onOpenChange={setDialogOpen} category={editing} />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(o) => { if (!confirmSubmitting) setConfirmOpen(o) }}
        title="Delete Category"
        description={`Delete category "${confirmItem?.name}"? This may affect events assigned to this category.`}
        confirmLabel={confirmSubmitting ? "Deleting..." : "Delete"}
        onConfirm={handleDelete}
      />
    </div>
  )
}
