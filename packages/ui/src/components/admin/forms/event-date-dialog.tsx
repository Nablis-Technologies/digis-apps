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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { toastSuccess, toastError } from "@workspace/ui/lib/toast"
import {
  useCreateEventDateMutation,
  useUpdateEventDateMutation,
  type EventDate,
} from "@workspace/store/reducers/eventScheduleApi"
import { useListVenuesQuery } from "@workspace/store/reducers/venuesApi"

type FormData = {
  name: string
  starts_at: string
  ends_at: string
  venue_id: string
  venue_capacity: string
}

const empty: FormData = { name: "", starts_at: "", ends_at: "", venue_id: "", venue_capacity: "" }

export function EventDateDialog({
  open,
  onOpenChange,
  eventId,
  eventDate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  eventDate?: EventDate | null
}) {
  const isEdit = !!eventDate
  const [form, setForm] = useState<FormData>(empty)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [createDate, { isLoading: isCreating }] = useCreateEventDateMutation()
  const [updateDate, { isLoading: isUpdating }] = useUpdateEventDateMutation()
  const { data: venuesData, isLoading: venuesLoading } = useListVenuesQuery(
    { page: 1, per_page: 100 },
    { skip: !open }
  )
  const submitting = isCreating || isUpdating
  const venues = venuesData?.data ?? []

  useEffect(() => {
    if (open) {
      setForm(
        eventDate
          ? {
              name: eventDate.name ?? "",
              starts_at: eventDate.starts_at ? new Date(eventDate.starts_at).toISOString().slice(0, 16) : "",
              ends_at: eventDate.ends_at ? new Date(eventDate.ends_at).toISOString().slice(0, 16) : "",
              venue_id: eventDate.venue_id ?? eventDate.venue?.id ?? "",
              venue_capacity: eventDate.venue_capacity ? String(eventDate.venue_capacity) : "",
            }
          : empty
      )
      setErrorMsg(null)
    }
  }, [open, eventDate])

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((p) => ({ ...p, [key]: value }))
  }
  function isValid() {
    return form.starts_at && form.ends_at
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid()) return
    setErrorMsg(null)

    try {
      if (isEdit && eventDate) {
        // Ordinary updates only allow the name; schedule changes go through commands.
        await updateDate({ eventId, id: eventDate.id, body: { event_date: { name: form.name || undefined } } }).unwrap()
      } else {
        await createDate({
          eventId,
          body: {
            event_date: {
              name: form.name || undefined,
              starts_at: new Date(form.starts_at).toISOString(),
              ends_at: new Date(form.ends_at).toISOString(),
              venue_id: form.venue_id || undefined,
              venue_capacity: form.venue_capacity ? Number(form.venue_capacity) : undefined,
            },
          },
        }).unwrap()
      }
      onOpenChange(false)
      toastSuccess(isEdit ? "Event date updated." : "Event date created.")
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? (err as { data?: { message?: string } }).data?.message
          : undefined
      setErrorMsg(msg ?? "Something went wrong. Please try again.")
      toastError(err, isEdit ? "Failed to update event date." : "Failed to create event date.")
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
          <DialogTitle>{isEdit ? "Edit Event Date" : "Create Event Date"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Only the name can be edited here — schedule changes use the schedule-change flow."
              : "Add a scheduled date for this event."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Night 1 — Main show" value={form.name} onChange={(e) => update("name", e.target.value)} />
          </div>
          {!isEdit && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="starts_at">
                    Starts at <span className="text-destructive">*</span>
                  </Label>
                  <Input id="starts_at" type="datetime-local" value={form.starts_at} onChange={(e) => update("starts_at", e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ends_at">
                    Ends at <span className="text-destructive">*</span>
                  </Label>
                  <Input id="ends_at" type="datetime-local" value={form.ends_at} onChange={(e) => update("ends_at", e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="venue_id">Venue</Label>
                {venuesLoading ? (
                  <p className="text-sm text-muted-foreground">Loading venues...</p>
                ) : (
                  <Select value={form.venue_id} onValueChange={(v) => update("venue_id", v)}>
                    <SelectTrigger id="venue_id" className="w-full">
                      <SelectValue placeholder="Select a venue..." />
                    </SelectTrigger>
                    <SelectContent>
                      {venues.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.name}{v.city ? ` — ${v.city}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="venue_capacity">Venue capacity</Label>
                <Input id="venue_capacity" type="number" min={1} placeholder="5000" value={form.venue_capacity} onChange={(e) => update("venue_capacity", e.target.value)} />
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
