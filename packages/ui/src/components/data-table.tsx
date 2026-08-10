"use client"

import { cn } from "@workspace/ui/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import type { HugeiconsIconProps } from "@hugeicons/react"
import {
  ArrowUp02Icon,
  ArrowDown02Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FileEmpty01Icon,
  MoreVerticalIcon,
} from "@hugeicons/core-free-icons"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Button } from "@workspace/ui/components/button"

// ─── Types ──────────────────────────────────────────────────────────────────

export type SortDirection = "asc" | "desc"

export type SortConfig = {
  key: string
  direction: SortDirection
}

export type Column<T> = {
  /** Column header label */
  header: string
  /** Key to access the value on the row object (used for sorting) */
  accessorKey?: keyof T & string
  /** Custom cell renderer — receives the full row */
  cell?: (row: T) => React.ReactNode
  /** Whether this column can be sorted */
  sortable?: boolean
  /** Additional class on the header cell */
  className?: string
  /** Hide on mobile (<768px) */
  hideOnMobile?: boolean
}

export type RowAction<T> = {
  /** Action label */
  label: string
  /** Icon component from hugeicons */
  icon?: HugeiconsIconProps["icon"]
  /** Click handler */
  onClick: (row: T) => void
  /** Variant for styling */
  variant?: "default" | "destructive"
  /** Whether to show in primary actions (max 3) */
  primary?: boolean
  /** Show only icon without label (for primary actions) */
  iconOnly?: boolean
}

export type PaginationState = {
  page: number
  totalPages: number
  total: number
  perPage: number
}

type DataTableProps<T> = {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T) => string | number
  /** Loading skeleton state */
  isLoading?: boolean
  /** Message shown when data is empty */
  emptyMessage?: string
  /** Controlled sort */
  sortConfig?: SortConfig | null
  /** Sort change handler */
  onSort?: (config: SortConfig) => void
  /** Client-side pagination (pass this OR server-side pagination below) */
  pagination?: PaginationState
  onPageChange?: (page: number) => void
  /** Click handler for rows */
  onRowClick?: (row: T) => void
  /** Actions rendered in the last column (legacy - kept for backward compatibility) */
  renderActions?: (row: T) => React.ReactNode
  /** New actions system - array of action objects */
  actions?: RowAction<T>[] | ((row: T) => RowAction<T>[])
}

// ─── Action Buttons ─────────────────────────────────────────────────────────

function ActionButtons<T>({ row, actions }: { row: T; actions: RowAction<T>[] }) {
  const primaryActions = actions.filter((a) => a.primary).slice(0, 3)
  const secondaryActions = actions.filter((a) => !a.primary)
  const hasMore = secondaryActions.length > 0 || actions.filter((a) => a.primary).length > 3
  const moreActions = [
    ...actions.filter((a) => a.primary).slice(3),
    ...secondaryActions,
  ]

  return (
    <div className="flex items-center justify-center gap-1">
      {primaryActions.map((action, index) => (
        <Button
          key={index}
          variant={action.variant === "destructive" ? "destructive" : "ghost"}
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            action.onClick(row)
          }}
          className={cn(
            "h-8 text-muted-foreground hover:text-foreground",
            action.iconOnly ? "w-8 p-0" : "px-2"
          )}
          title={action.label}
        >
          {action.icon && (
            <HugeiconsIcon icon={action.icon} strokeWidth={2} className="size-4" />
          )}
          {!action.iconOnly && <span className="ml-1.5">{action.label}</span>}
        </Button>
      ))}

      {hasMore && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              onClick={(e) => e.stopPropagation()}
              title="More actions"
            >
              <HugeiconsIcon
                icon={MoreVerticalIcon}
                strokeWidth={2}
                className="size-4"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {moreActions.map((action, index) => (
              <DropdownMenuItem
                key={index}
                variant={action.variant}
                onClick={(e) => {
                  e.stopPropagation()
                  action.onClick(row)
                }}
              >
                {action.icon && (
                  <HugeiconsIcon icon={action.icon} strokeWidth={2} className="size-4" />
                )}
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

// ─── Skeleton Rows ──────────────────────────────────────────────────────────

function TableSkeleton({ columns }: { columns: number }) {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: columns }).map((_, j) => (
            <td key={j} className="px-4 py-3.5">
              <div className="h-4 w-full max-w-[160px] animate-pulse rounded bg-muted" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

// ─── Empty State ────────────────────────────────────────────────────────────

function TableEmpty({ message }: { message: string }) {
  return (
    <tr>
      <td colSpan={99}>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
            <HugeiconsIcon
              icon={FileEmpty01Icon}
              strokeWidth={2}
              className="size-5 text-muted-foreground"
            />
          </div>
          <p className="text-sm font-medium text-foreground">{message}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Try adjusting your search or filters
          </p>
        </div>
      </td>
    </tr>
  )
}

// ─── Sort Indicator ─────────────────────────────────────────────────────────

function SortIndicator({
  active,
  direction,
}: {
  active: boolean
  direction: SortDirection
}) {
  return (
    <span className="ml-1.5 inline-flex flex-col items-center leading-none">
      {active && direction === "asc" ? (
        <HugeiconsIcon
          icon={ArrowUp02Icon}
          strokeWidth={2}
          className="size-3 text-lime-500"
        />
      ) : active && direction === "desc" ? (
        <HugeiconsIcon
          icon={ArrowDown02Icon}
          strokeWidth={2}
          className="size-3 text-lime-500"
        />
      ) : (
        <div className="flex flex-col gap-px">
          <HugeiconsIcon
            icon={ArrowUp02Icon}
            strokeWidth={2}
            className="size-2.5 text-muted-foreground/30"
          />
          <HugeiconsIcon
            icon={ArrowDown02Icon}
            strokeWidth={2}
            className="size-2.5 -mt-1 text-muted-foreground/30"
          />
        </div>
      )}
    </span>
  )
}

// ─── Pagination ─────────────────────────────────────────────────────────────

function TablePagination({
  pagination,
  onPageChange,
}: {
  pagination: PaginationState
  onPageChange?: (page: number) => void
}) {
  const { page, totalPages, total, perPage } = pagination
  const from = (page - 1) * perPage + 1
  const to = Math.min(page * perPage, total)

  return (
    <div className="flex items-center justify-between border-t border-border/50 px-4 py-3 text-sm">
      <p className="text-muted-foreground">
        <span className="font-medium text-foreground">{from}</span>
        {" — "}
        <span className="font-medium text-foreground">{to}</span>
        {" of "}
        <span className="font-medium text-foreground">{total}</span>
      </p>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange?.(page - 1)}
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
          >
            <HugeiconsIcon
              icon={ChevronLeftIcon}
              strokeWidth={2}
              className="size-4"
            />
          </button>

          {generatePageNumbers(page, totalPages).map((p, i) =>
            p === "..." ? (
              <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground/40">
                ...
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange?.(p as number)}
                className={cn(
                  "flex size-8 items-center justify-center rounded-md text-sm font-medium transition-colors",
                  p === page
                    ? "bg-lime-500 text-white shadow-xs"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {p}
              </button>
            )
          )}

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange?.(page + 1)}
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
          >
            <HugeiconsIcon
              icon={ChevronRightIcon}
              strokeWidth={2}
              className="size-4"
            />
          </button>
        </div>
      )}
    </div>
  )
}

function generatePageNumbers(
  current: number,
  total: number
): (number | "...")[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | "...")[] = [1]

  if (current > 3) pages.push("...")

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  for (let i = start; i <= end; i++) pages.push(i)

  if (current < total - 2) pages.push("...")

  if (total > 1) pages.push(total)

  return pages
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyMessage = "No results found",
  sortConfig,
  onSort,
  pagination,
  onPageChange,
  onRowClick,
  renderActions,
  actions,
}: DataTableProps<T>) {
  const hasActions = !!renderActions || !!actions

  return (
    <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* ── Header ── */}
          <thead>
            <tr className="border-b border-border/50">
              {columns.map((col) => (
                <th
                  key={col.header}
                  className={cn(
                    "px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground",
                    col.sortable && "cursor-pointer select-none hover:text-foreground",
                    col.hideOnMobile && "hidden md:table-cell",
                    col.className
                  )}
                  onClick={() => {
                    if (!col.sortable || !col.accessorKey || !onSort) return
                    const key = col.accessorKey as string
                    const direction =
                      sortConfig?.key === key && sortConfig.direction === "asc"
                        ? "desc"
                        : "asc"
                    onSort({ key, direction })
                  }}
                >
                  <span className="inline-flex items-center">
                    {col.header}
                    {col.sortable && col.accessorKey && (
                      <SortIndicator
                        active={sortConfig?.key === col.accessorKey}
                        direction={
                          sortConfig?.key === col.accessorKey
                            ? sortConfig.direction
                            : "asc"
                        }
                      />
                    )}
                  </span>
                </th>
              ))}
              {hasActions && (
                <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          {/* ── Body ── */}
          <tbody>
            {isLoading ? (
              <TableSkeleton columns={columns.length + (hasActions ? 1 : 0)} />
            ) : data.length === 0 ? (
              <TableEmpty message={emptyMessage} />
            ) : (
              data.map((row) => {
                const rowActions = typeof actions === "function" ? actions(row) : actions
                return (
                  <tr
                    key={keyExtractor(row)}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      "border-b border-border/25 transition-colors last:border-0",
                      onRowClick && "cursor-pointer",
                      "hover:bg-accent/30"
                    )}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.header}
                        className={cn(
                          "px-4 py-3.5 text-sm",
                          col.hideOnMobile && "hidden md:table-cell",
                          col.className
                        )}
                      >
                        {col.cell
                          ? col.cell(row)
                          : col.accessorKey
                            ? String(row[col.accessorKey] ?? "")
                            : null}
                      </td>
                    ))}
                    {hasActions && (
                      <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        {renderActions
                          ? renderActions(row)
                          : rowActions && <ActionButtons row={row} actions={rowActions} />}
                      </td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {pagination && !isLoading && data.length > 0 && (
        <TablePagination pagination={pagination} onPageChange={onPageChange} />
      )}
    </div>
  )
}
