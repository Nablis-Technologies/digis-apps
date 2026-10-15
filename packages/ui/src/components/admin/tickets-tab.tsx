"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Ticket01Icon,
  PlusSignCircleIcon,
  Edit01Icon,
  Delete01Icon,
  RefreshIcon,
  EyeIcon,
  EyeClosedIcon,
  LockKeyIcon,
  Mail01Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import { DataTable, type Column } from "@workspace/ui/components/data-table"
import { ConfirmDialog } from "@workspace/ui/components/admin/forms/confirm-dialog"
import { toastSuccess, toastError } from "@workspace/ui/lib/toast"
import {
  useListEventProductsQuery,
  useDeleteEventProductMutation,
  useActivateEventProductMutation,
  useDeactivateEventProductMutation,
  useGetTicketTypeQuery,
  useDeleteTicketTypeMutation,
  useListAccessCodesQuery,
  useDeleteAccessCodeMutation,
  useListInvitationsQuery,
  useDeleteInvitationMutation,
  type EventProduct,
} from "@workspace/store/reducers/ticketingApi"
import { EventProductDialog } from "@workspace/ui/components/admin/forms/event-product-dialog"
import { TicketTypeDialog } from "@workspace/ui/components/admin/forms/ticket-type-dialog"
import { AccessCodeDialog } from "@workspace/ui/components/admin/forms/access-code-dialog"
import { InvitationDialog } from "@workspace/ui/components/admin/forms/invitation-dialog"

const statusConfig: Record<string, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "bg-zinc-50 text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-500" },
  active: { label: "Active", cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" },
  retired: { label: "Retired", cls: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400" },
}

function StatusBadge({ status }: { status: string }) {
  const s = statusConfig[status] ?? statusConfig.draft
  return <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", s.cls)}>{s.label}</span>
}

export function TicketsTab({ eventId }: { eventId: string }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data, isLoading, isFetching, refetch } = useListEventProductsQuery({
    eventId,
    params: { page: 1, per_page: 50 },
  })
  const products = data?.data ?? []

  const [deleteProduct] = useDeleteEventProductMutation()
  const [activateProduct] = useActivateEventProductMutation()
  const [deactivateProduct] = useDeactivateEventProductMutation()

  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<EventProduct | null>(null)
  const [confirmItem, setConfirmItem] = useState<EventProduct | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  async function handleDeleteProduct() {
    if (!confirmItem) return
    try {
      await deleteProduct({ eventId, id: confirmItem.id }).unwrap()
      toastSuccess("Product deleted.")
      setConfirmOpen(false)
      setConfirmItem(null)
    } catch (err) {
      toastError(err, "Failed to delete product.")
    }
  }

  async function toggleActive(p: EventProduct) {
    try {
      if (p.status === "active") {
        await deactivateProduct({ eventId, id: p.id }).unwrap()
        toastSuccess("Product deactivated.")
      } else {
        await activateProduct({ eventId, id: p.id }).unwrap()
        toastSuccess("Product activated.")
      }
    } catch (err) {
      toastError(err, "Failed to update product status.")
    }
  }

  const columns: Column<EventProduct>[] = [
    {
      header: "Name",
      accessorKey: "name",
      cell: (row) => (
        <div>
          <p className="font-medium text-foreground">{row.name}</p>
          {row.description && <p className="text-xs text-muted-foreground max-w-56 truncate">{row.description}</p>}
        </div>
      ),
    },
    { header: "Type", accessorKey: "type", cell: (row) => <span className="text-sm capitalize">{row.type}</span> },
    { header: "Status", accessorKey: "status", cell: (row) => <StatusBadge status={row.status} /> },
    {
      header: "Price",
      cell: (row) => {
        // price not embedded in the product list serializer; show sales window
        return <span className="text-sm">{row.sales_start_at ? new Date(row.sales_start_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}</span>
      },
      hideOnMobile: true,
    },
    {
      header: "Orders",
      accessorKey: "min_per_order",
      cell: (row) => (
        <span className="text-sm">
          {row.min_per_order ?? 1}–{row.max_per_order ?? 10}
        </span>
      ),
      hideOnMobile: true,
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Ticket Products</h3>
          <span className="text-xs text-muted-foreground">{products.length} products</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className="size-4" />Refresh
          </Button>
          <Button size="sm" onClick={() => { setEditingProduct(null); setProductDialogOpen(true) }}>
            <HugeiconsIcon icon={PlusSignCircleIcon} strokeWidth={2} className="size-4" />Add Product
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={products}
        keyExtractor={(row) => row.id}
        isLoading={isLoading || isFetching}
        onRowClick={(row) => setExpandedId(expandedId === row.id ? null : row.id)}
        renderActions={(row) => (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); toggleActive(row) }}
              disabled={row.status === "retired"}
              className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
              title={row.status === "active" ? "Deactivate" : "Activate"}
            >
              <HugeiconsIcon icon={row.status === "active" ? EyeClosedIcon : EyeIcon} strokeWidth={2} className="size-4" />
            </button>
            <button type="button" onClick={(e) => { e.stopPropagation(); setEditingProduct(row); setProductDialogOpen(true) }} className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} className="size-4" />
            </button>
            <button type="button" onClick={(e) => { e.stopPropagation(); setConfirmItem(row); setConfirmOpen(true) }} className="flex size-8 items-center justify-center rounded-md text-destructive transition-colors hover:bg-destructive/10">
              <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} className="size-4" />
            </button>
          </div>
        )}
      />

      {expandedId && (
        <ProductDetail
          eventId={eventId}
          product={products.find((p) => p.id === expandedId)}
        />
      )}

      <EventProductDialog
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        eventId={eventId}
        product={editingProduct}
      />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(o) => { if (!o) setConfirmOpen(false) }}
        title="Delete Product"
        description={`Delete "${confirmItem?.name}"? Only draft products can be deleted.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteProduct}
      />
    </div>
  )
}

function ProductDetail({ eventId, product }: { eventId: string; product?: EventProduct }) {
  if (!product) return null

  const { data: ticketTypeData, isLoading: ttLoading } = useGetTicketTypeQuery(
    { eventId, productId: product.id },
    { skip: !product }
  )
  const ticketType = ticketTypeData?.data

  const { data: codesData, isLoading: codesLoading } = useListAccessCodesQuery(
    { eventId, productId: product.id },
    { skip: !ticketType }
  )
  const { data: invitesData, isLoading: invitesLoading } = useListInvitationsQuery(
    { eventId, productId: product.id },
    { skip: !ticketType }
  )

  const [deleteTicketType] = useDeleteTicketTypeMutation()
  const [deleteAccessCode] = useDeleteAccessCodeMutation()
  const [deleteInvitation] = useDeleteInvitationMutation()

  const [ttDialogOpen, setTtDialogOpen] = useState(false)
  const [codeDialogOpen, setCodeDialogOpen] = useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)

  const codes = codesData?.data ?? []
  const invites = invitesData?.data ?? []

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={Ticket01Icon} strokeWidth={2} className="size-4 text-muted-foreground" />
          <h4 className="font-semibold">{product.name} — configuration</h4>
        </div>
        {ticketType && (
          <Button variant="outline" size="sm" onClick={() => setTtDialogOpen(true)}>
            <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} className="size-3.5" />Edit Ticket Type
          </Button>
        )}
      </div>

      {ttLoading ? (
        <p className="text-sm text-muted-foreground">Loading ticket type...</p>
      ) : ticketType ? (
        <div className="mb-5 rounded-lg border border-border/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Ticket Type</p>
            <button
              type="button"
              onClick={() => deleteTicketType({ eventId, productId: product.id }).unwrap()}
              className="flex size-7 items-center justify-center rounded-md text-destructive hover:bg-destructive/10"
              title="Delete ticket type"
            >
              <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} className="size-3.5" />
            </button>
          </div>
          <div className="grid gap-x-6 gap-y-2 sm:grid-cols-3 text-sm">
            <div><p className="text-xs text-muted-foreground">Approval</p><p className="capitalize">{ticketType.approval_mode}</p></div>
            <div><p className="text-xs text-muted-foreground">Audience</p><p className="capitalize">{ticketType.audience}</p></div>
            <div><p className="text-xs text-muted-foreground">Admissions / unit</p><p>{ticketType.admissions_per_unit}</p></div>
            <div><p className="text-xs text-muted-foreground">Entry validation</p><p className="capitalize">{ticketType.entry_validation_mode}</p></div>
            <div><p className="text-xs text-muted-foreground">Transferable</p><p>{ticketType.transferable ? "Yes" : "No"}</p></div>
            <div><p className="text-xs text-muted-foreground">Waitlist</p><p>{ticketType.waitlist_enabled ? "Enabled" : "Disabled"}</p></div>
          </div>
        </div>
      ) : (
        <div className="mb-5 flex items-center justify-between rounded-lg border border-dashed border-border/60 p-4">
          <p className="text-sm text-muted-foreground">No ticket type configured for this product.</p>
          <Button size="sm" variant="outline" onClick={() => setTtDialogOpen(true)}>
            <HugeiconsIcon icon={PlusSignCircleIcon} strokeWidth={2} className="size-3.5" />Create Ticket Type
          </Button>
        </div>
      )}

      {ticketType && (
        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <HugeiconsIcon icon={LockKeyIcon} strokeWidth={2} className="size-3.5 text-muted-foreground" />
                <p className="text-sm font-medium">Access Codes</p>
              </div>
              <Button variant="outline" size="xs" onClick={() => setCodeDialogOpen(true)}>
                <HugeiconsIcon icon={PlusSignCircleIcon} strokeWidth={2} className="size-3" />Add
              </Button>
            </div>
            {codesLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : codes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No access codes.</p>
            ) : (
              <div className="space-y-1.5">
                {codes.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{c.label || c.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">{c.used_count}/{c.max_uses ?? "∞"} used</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteAccessCode({ eventId, productId: product.id, id: c.id }).unwrap()}
                      className="flex size-7 items-center justify-center rounded-md text-destructive hover:bg-destructive/10"
                    >
                      <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <HugeiconsIcon icon={Mail01Icon} strokeWidth={2} className="size-3.5 text-muted-foreground" />
                <p className="text-sm font-medium">Invitations</p>
              </div>
              <Button variant="outline" size="xs" onClick={() => setInviteDialogOpen(true)}>
                <HugeiconsIcon icon={PlusSignCircleIcon} strokeWidth={2} className="size-3" />Add
              </Button>
            </div>
            {invitesLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : invites.length === 0 ? (
              <p className="text-sm text-muted-foreground">No invitations.</p>
            ) : (
              <div className="space-y-1.5">
                {invites.map((iv) => (
                  <div key={iv.id} className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{iv.name || iv.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground capitalize">{iv.status} · qty {iv.allowed_quantity}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteInvitation({ eventId, productId: product.id, id: iv.id }).unwrap()}
                      className="flex size-7 items-center justify-center rounded-md text-destructive hover:bg-destructive/10"
                    >
                      <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <TicketTypeDialog
        open={ttDialogOpen}
        onOpenChange={setTtDialogOpen}
        eventId={eventId}
        productId={product.id}
        ticketType={ticketType}
      />
      <AccessCodeDialog open={codeDialogOpen} onOpenChange={setCodeDialogOpen} eventId={eventId} productId={product.id} />
      <InvitationDialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen} eventId={eventId} productId={product.id} />
    </div>
  )
}
