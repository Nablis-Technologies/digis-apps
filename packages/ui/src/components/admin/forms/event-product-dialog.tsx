"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { toastSuccess, toastError } from "@workspace/ui/lib/toast"
import {
  useCreateEventProductMutation,
  useUpdateEventProductMutation,
  type EventProduct,
} from "@workspace/store/reducers/ticketingApi"

const audienceOptions = ["public", "private"] as const

type FormData = {
  name: string
  description: string
  type: string
  allow_custom_price: boolean
  min_per_order: string
  max_per_order: string
  sort_order: string
  sales_start_at: string
  sales_end_at: string
  ticketApprovalMode: string
  ticketAudience: string
  ticketAdmissionsPerUnit: string
  priceCurrency: string
  priceAmountMinor: string
}

const empty: FormData = {
  name: "",
  description: "",
  type: "ticket",
  allow_custom_price: false,
  min_per_order: "1",
  max_per_order: "10",
  sort_order: "1",
  sales_start_at: "",
  sales_end_at: "",
  ticketApprovalMode: "automatic",
  ticketAudience: "public",
  ticketAdmissionsPerUnit: "1",
  priceCurrency: "ETB",
  priceAmountMinor: "",
}

export function EventProductDialog({
  open,
  onOpenChange,
  eventId,
  product,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  product?: EventProduct | null
}) {
  const isEdit = !!product
  const [form, setForm] = useState<FormData>(empty)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [createProduct, { isLoading: isCreating }] = useCreateEventProductMutation()
  const [updateProduct, { isLoading: isUpdating }] = useUpdateEventProductMutation()
  const submitting = isCreating || isUpdating

  useEffect(() => {
    if (open) {
      setForm(
        product
          ? {
              name: product.name,
              description: product.description ?? "",
              type: product.type,
              allow_custom_price: product.allow_custom_price,
              min_per_order: product.min_per_order ? String(product.min_per_order) : "1",
              max_per_order: product.max_per_order ? String(product.max_per_order) : "10",
              sort_order: product.sort_order ? String(product.sort_order) : "1",
              sales_start_at: product.sales_start_at ?? "",
              sales_end_at: product.sales_end_at ?? "",
              ticketApprovalMode: product.ticket_type?.approval_mode ?? "automatic",
              ticketAudience: product.ticket_type?.audience ?? "public",
              ticketAdmissionsPerUnit: product.ticket_type ? String(product.ticket_type.admissions_per_unit) : "1",
              priceCurrency: "ETB",
              priceAmountMinor: "",
            }
          : empty
      )
      setErrorMsg(null)
    }
  }, [open, product])

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((p) => ({ ...p, [key]: value }))
  }
  function isValid() {
    return form.name.trim()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid()) return
    setErrorMsg(null)

    try {
      if (isEdit && product) {
        await updateProduct({
          eventId,
          id: product.id,
          body: {
            name: form.name,
            description: form.description || undefined,
            allow_custom_price: form.allow_custom_price,
            min_per_order: Number(form.min_per_order),
            max_per_order: Number(form.max_per_order),
            sort_order: Number(form.sort_order),
            sales_start_at: form.sales_start_at ? new Date(form.sales_start_at).toISOString() : undefined,
            sales_end_at: form.sales_end_at ? new Date(form.sales_end_at).toISOString() : undefined,
          },
        }).unwrap()
      } else {
        await createProduct({
          eventId,
          body: {
            name: form.name,
            type: form.type,
            description: form.description || undefined,
            allow_custom_price: form.allow_custom_price,
            min_per_order: Number(form.min_per_order),
            max_per_order: Number(form.max_per_order),
            sort_order: Number(form.sort_order),
            sales_start_at: form.sales_start_at ? new Date(form.sales_start_at).toISOString() : undefined,
            sales_end_at: form.sales_end_at ? new Date(form.sales_end_at).toISOString() : undefined,
            ticket_type_attributes: {
              approval_mode: form.ticketApprovalMode,
              audience: form.ticketAudience,
              admissions_per_unit: Number(form.ticketAdmissionsPerUnit),
            },
            price_attributes: form.priceAmountMinor
              ? {
                  type: "base",
                  currency: form.priceCurrency,
                  amount_minor: Number(form.priceAmountMinor),
                }
              : undefined,
          },
        }).unwrap()
      }
      onOpenChange(false)
      toastSuccess(isEdit ? "Product updated." : "Product created.")
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? (err as { data?: { message?: string } }).data?.message
          : undefined
      setErrorMsg(msg ?? "Something went wrong. Please try again.")
      toastError(err, isEdit ? "Failed to update product." : "Failed to create product.")
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!submitting) onOpenChange(o)
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Ticket Product" : "Create Ticket Product"}</DialogTitle>
          <DialogDescription>
            {isEdit ? `Update "${product?.name}".` : "Add a new ticket product to this event."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input id="name" placeholder="General Admission" value={form.name} onChange={(e) => update("name", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Input id="desc" placeholder="Standard entry to the event" value={form.description} onChange={(e) => update("description", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <select value={form.type} onChange={(e) => update("type", e.target.value)} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50">
                <option value="ticket">ticket</option>
                <option value="merchandise">merchandise</option>
              </select>
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.allow_custom_price} onChange={(e) => update("allow_custom_price", e.target.checked)} className="size-4 rounded border-border" />
                Allow custom price
              </label>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min_per_order">Min per order</Label>
              <Input id="min_per_order" type="number" min={1} value={form.min_per_order} onChange={(e) => update("min_per_order", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_per_order">Max per order</Label>
              <Input id="max_per_order" type="number" min={1} value={form.max_per_order} onChange={(e) => update("max_per_order", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sort_order">Sort order</Label>
              <Input id="sort_order" type="number" value={form.sort_order} onChange={(e) => update("sort_order", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sales_start_at">Sales start</Label>
              <Input id="sales_start_at" type="datetime-local" value={form.sales_start_at} onChange={(e) => update("sales_start_at", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sales_end_at">Sales end</Label>
              <Input id="sales_end_at" type="datetime-local" value={form.sales_end_at} onChange={(e) => update("sales_end_at", e.target.value)} />
            </div>
          </div>

          {!isEdit && (
            <>
              <div className="rounded-lg border border-border/50 p-4 space-y-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ticket type</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Approval mode</Label>
                    <select value={form.ticketApprovalMode} onChange={(e) => update("ticketApprovalMode", e.target.value)} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50">
                      <option value="automatic">automatic</option>
                      <option value="manual">manual</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Audience</Label>
                    <select value={form.ticketAudience} onChange={(e) => update("ticketAudience", e.target.value)} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50">
                      {audienceOptions.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ticketAdmissionsPerUnit">Admissions per unit</Label>
                  <Input id="ticketAdmissionsPerUnit" type="number" min={1} value={form.ticketAdmissionsPerUnit} onChange={(e) => update("ticketAdmissionsPerUnit", e.target.value)} />
                </div>
              </div>

              <div className="rounded-lg border border-border/50 p-4 space-y-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Base price</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priceCurrency">Currency</Label>
                    <Input id="priceCurrency" value={form.priceCurrency} onChange={(e) => update("priceCurrency", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priceAmountMinor">Amount (minor units)</Label>
                    <Input id="priceAmountMinor" type="number" min={0} placeholder="50000" value={form.priceAmountMinor} onChange={(e) => update("priceAmountMinor", e.target.value)} />
                  </div>
                </div>
              </div>
            </>
          )}

          {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={submitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={!isValid() || submitting}
              className="bg-lime-500 text-white hover:bg-lime-600 disabled:bg-lime-500/50"
            >
              {submitting ? "Saving..." : isEdit ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
