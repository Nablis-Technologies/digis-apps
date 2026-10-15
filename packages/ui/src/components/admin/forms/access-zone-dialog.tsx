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
  useCreateAccessZoneMutation,
  useUpdateAccessZoneMutation,
  type AccessZone,
} from "@workspace/store/reducers/eventScheduleApi"
import { useListEventDatesQuery } from "@workspace/store/reducers/eventScheduleApi"

const typeOptions = ["general", "vip", "backstage", "ga"] as const

type FormData = {
  name: string
  code: string
  type: string
  event_date_id: string
  sort_order: string
  active: boolean
}

const empty: FormData = { name: "", code: "", type: "general", event_date_id: "", sort_order: "1", active: true }

export function AccessZoneDialog({
  open,
  onOpenChange,
  eventId,
  zone,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  zone?: AccessZone | null
}) {
  const isEdit = !!zone
  const [form, setForm] = useState<FormData>(empty)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [createZone, { isLoading: isCreating }] = useCreateAccessZoneMutation()
  const [updateZone, { isLoading: isUpdating }] = useUpdateAccessZoneMutation()
  const { data: datesData } = useListEventDatesQuery({ eventId, params: { page: 1, per_page: 50 } }, { skip: !open })
  const submitting = isCreating || isUpdating
  const dates = datesData?.data ?? []

  useEffect(() => {
    if (open) {
      setForm(
        zone
          ? {
              name: zone.name,
              code: zone.code,
              type: zone.type,
              event_date_id: zone.event_date_id ?? "",
              sort_order: zone.sort_order ? String(zone.sort_order) : "1",
              active: zone.active,
            }
          : empty
      )
      setErrorMsg(null)
    }
  }, [open, zone])

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((p) => ({ ...p, [key]: value }))
  }
  function isValid() {
    return form.name.trim() && form.code.trim()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid()) return
    setErrorMsg(null)

    const payload = {
      access_zone: {
        event_date_id: form.event_date_id || undefined,
        type: form.type,
        name: form.name,
        code: form.code,
        active: form.active,
        sort_order: Number(form.sort_order),
      },
    }

    try {
      if (isEdit && zone) {
        await updateZone({ eventId, id: zone.id, body: payload }).unwrap()
      } else {
        await createZone({ eventId, body: payload }).unwrap()
      }
      onOpenChange(false)
      toastSuccess(isEdit ? "Access zone updated." : "Access zone created.")
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? (err as { data?: { message?: string } }).data?.message
          : undefined
      setErrorMsg(msg ?? "Something went wrong. Please try again.")
      toastError(err, isEdit ? "Failed to update access zone." : "Failed to create access zone.")
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!submitting) onOpenChange(o)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Access Zone" : "Create Access Zone"}</DialogTitle>
          <DialogDescription>Define a zone for entry control at this event.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input id="name" placeholder="Front Stage" value={form.name} onChange={(e) => update("name", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">
                Code <span className="text-destructive">*</span>
              </Label>
              <Input id="code" placeholder="FRONT" value={form.code} onChange={(e) => update("code", e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <select
                value={form.type}
                onChange={(e) => update("type", e.target.value)}
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
              >
                {typeOptions.map((t) => (
                  <option key={t} value={t} className="capitalize">
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sort_order">Sort order</Label>
              <Input id="sort_order" type="number" value={form.sort_order} onChange={(e) => update("sort_order", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Event date</Label>
            <select
              value={form.event_date_id}
              onChange={(e) => update("event_date_id", e.target.value)}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
            >
              <option value="">No specific date</option>
              {dates.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name || new Date(d.starts_at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="active" checked={form.active} onChange={(e) => update("active", e.target.checked)} className="size-4 rounded border-border" />
            <Label htmlFor="active" className="cursor-pointer">Active</Label>
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
              disabled={!isValid() || submitting}
            >
              {submitting ? "Saving..." : isEdit ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
