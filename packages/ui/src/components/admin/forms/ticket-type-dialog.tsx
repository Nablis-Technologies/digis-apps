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
  useCreateTicketTypeMutation,
  useUpdateTicketTypeMutation,
  type TicketType,
} from "@workspace/store/reducers/ticketingApi"

const approvalModes = ["automatic", "manual"] as const
const audiences = ["public", "private"] as const
const dateSelections = ["fixed", "choose_one"] as const
const validationModes = ["offline_allowed", "online_required"] as const
const entryModes = ["qr", "manual"] as const

type FormData = {
  approval_mode: string
  audience: string
  date_selection: string
  waitlist_enabled: boolean
  transferable: boolean
  admissions_per_unit: string
  delegation_enabled: boolean
  delegation_validation_mode: string
  entry_validation_mode: string
  resale_enabled: boolean
  max_completed_resales: string
}

const empty: FormData = {
  approval_mode: "automatic",
  audience: "public",
  date_selection: "fixed",
  waitlist_enabled: false,
  transferable: false,
  admissions_per_unit: "1",
  delegation_enabled: false,
  delegation_validation_mode: "offline_allowed",
  entry_validation_mode: "qr",
  resale_enabled: false,
  max_completed_resales: "1",
}

export function TicketTypeDialog({
  open,
  onOpenChange,
  eventId,
  productId,
  ticketType,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  productId: string
  ticketType?: TicketType | null
}) {
  const isEdit = !!ticketType
  const [form, setForm] = useState<FormData>(empty)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [createType, { isLoading: isCreating }] = useCreateTicketTypeMutation()
  const [updateType, { isLoading: isUpdating }] = useUpdateTicketTypeMutation()
  const submitting = isCreating || isUpdating

  useEffect(() => {
    if (open) {
      setForm(
        ticketType
          ? {
              approval_mode: ticketType.approval_mode,
              audience: ticketType.audience,
              date_selection: ticketType.date_selection,
              waitlist_enabled: ticketType.waitlist_enabled,
              transferable: ticketType.transferable,
              admissions_per_unit: String(ticketType.admissions_per_unit),
              delegation_enabled: ticketType.delegation_enabled,
              delegation_validation_mode: ticketType.delegation_validation_mode,
              entry_validation_mode: ticketType.entry_validation_mode,
              resale_enabled: ticketType.resale_enabled,
              max_completed_resales: ticketType.max_completed_resales ? String(ticketType.max_completed_resales) : "1",
            }
          : empty
      )
      setErrorMsg(null)
    }
  }, [open, ticketType])

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((p) => ({ ...p, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg(null)
    const payload = {
      approval_mode: form.approval_mode,
      audience: form.audience,
      date_selection: form.date_selection,
      waitlist_enabled: form.waitlist_enabled,
      transferable: form.transferable,
      admissions_per_unit: Number(form.admissions_per_unit),
      delegation_enabled: form.delegation_enabled,
      delegation_validation_mode: form.delegation_validation_mode,
      entry_validation_mode: form.entry_validation_mode,
      resale_enabled: form.resale_enabled,
      max_completed_resales: Number(form.max_completed_resales),
    }
    try {
      if (isEdit && ticketType) {
        await updateType({ eventId, productId, body: payload }).unwrap()
      } else {
        await createType({ eventId, productId, body: payload }).unwrap()
      }
      onOpenChange(false)
      toastSuccess(isEdit ? "Ticket type updated." : "Ticket type created.")
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? (err as { data?: { message?: string } }).data?.message
          : undefined
      setErrorMsg(msg ?? "Something went wrong. Please try again.")
      toastError(err, isEdit ? "Failed to update ticket type." : "Failed to create ticket type.")
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
          <DialogTitle>{isEdit ? "Edit Ticket Type" : "Create Ticket Type"}</DialogTitle>
          <DialogDescription>Configure how this ticket type behaves.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Approval</Label>
              <select value={form.approval_mode} onChange={(e) => update("approval_mode", e.target.value)} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50">
                {approvalModes.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Audience</Label>
              <select value={form.audience} onChange={(e) => update("audience", e.target.value)} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50">
                {audiences.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Date selection</Label>
              <select value={form.date_selection} onChange={(e) => update("date_selection", e.target.value)} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50">
                {dateSelections.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Delegation validation</Label>
              <select value={form.delegation_validation_mode} onChange={(e) => update("delegation_validation_mode", e.target.value)} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50">
                {validationModes.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Entry validation</Label>
              <select value={form.entry_validation_mode} onChange={(e) => update("entry_validation_mode", e.target.value)} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50">
                {entryModes.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="admissions_per_unit">Admissions per unit</Label>
              <Input id="admissions_per_unit" type="number" min={1} value={form.admissions_per_unit} onChange={(e) => update("admissions_per_unit", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_completed_resales">Max completed resales</Label>
              <Input id="max_completed_resales" type="number" min={0} value={form.max_completed_resales} onChange={(e) => update("max_completed_resales", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {([
              ["waitlist_enabled", "Waitlist enabled"],
              ["transferable", "Transferable"],
              ["delegation_enabled", "Delegation enabled"],
              ["resale_enabled", "Resale enabled"],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form[key]}
                  onChange={(e) => update(key, e.target.checked)}
                  className="size-4 rounded border-border"
                />
                {label}
              </label>
            ))}
          </div>
          {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={submitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={submitting}
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
