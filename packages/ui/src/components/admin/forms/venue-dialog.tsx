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
import { useCreateVenueMutation, useUpdateVenueMutation } from "@workspace/store/reducers/venuesApi"

type FormData = {
  name: string
  description: string
  address: string
  city: string
  country: string
  capacity: string
  contact_phone: string
  contact_email: string
  verified: boolean
  active: boolean
}

const empty: FormData = { name: "", description: "", address: "", city: "", country: "Ethiopia", capacity: "", contact_phone: "", contact_email: "", verified: false, active: true }

export function VenueDialog({
  open,
  onOpenChange,
  venue,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  venue?: { id: string; name: string; description: string | null; address: string | null; city: string; country: string; capacity: number | null; contact_phone: string | null; contact_email: string | null; verified: boolean; active: boolean } | null
}) {
  const isEdit = !!venue
  const [form, setForm] = useState<FormData>(empty)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [createVenue, { isLoading: isCreating }] = useCreateVenueMutation()
  const [updateVenue, { isLoading: isUpdating }] = useUpdateVenueMutation()
  const submitting = isCreating || isUpdating

  useEffect(() => {
    if (open) {
      setForm(venue ? { name: venue.name, description: venue.description ?? "", address: venue.address ?? "", city: venue.city, country: venue.country, capacity: venue.capacity?.toString() ?? "", contact_phone: venue.contact_phone ?? "", contact_email: venue.contact_email ?? "", verified: venue.verified, active: venue.active } : empty)
      setErrorMsg(null)
    }
  }, [open, venue])

  function update<K extends keyof FormData>(key: K, value: FormData[K]) { setForm((p) => ({ ...p, [key]: value })) }
  function isValid() { return form.name.trim() && form.city.trim() && form.country.trim() }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid()) return
    setErrorMsg(null)

    const payload = {
      venue: {
        name: form.name,
        description: form.description || undefined,
        address: form.address || undefined,
        city: form.city,
        country: form.country,
        capacity: form.capacity ? parseInt(form.capacity) : null,
        contact_phone: form.contact_phone || undefined,
        contact_email: form.contact_email || undefined,
        verified: form.verified,
        active: form.active,
      },
    }

    try {
      if (isEdit && venue) {
        await updateVenue({ id: venue.id, body: payload }).unwrap()
      } else {
        await createVenue(payload).unwrap()
      }
      onOpenChange(false)
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "data" in err
        ? (err as { data?: { message?: string } }).data?.message
        : undefined
      setErrorMsg(msg ?? "Something went wrong. Please try again.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!submitting) onOpenChange(o) }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Venue" : "Create Venue"}</DialogTitle>
          <DialogDescription>{isEdit ? `Update venue "${venue?.name}".` : "Add a new event venue."}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
              <Input id="name" placeholder="Grand Arena" value={form.name} onChange={(e) => update("name", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input id="capacity" type="number" placeholder="5000" value={form.capacity} onChange={(e) => update("capacity", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Input id="desc" placeholder="A large indoor arena" value={form.description} onChange={(e) => update("description", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" placeholder="123 Main St" value={form.address} onChange={(e) => update("address", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City <span className="text-destructive">*</span></Label>
              <Input id="city" placeholder="Addis Ababa" value={form.city} onChange={(e) => update("city", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country <span className="text-destructive">*</span></Label>
              <Input id="country" placeholder="Ethiopia" value={form.country} onChange={(e) => update("country", e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" placeholder="+251911123456" value={form.contact_phone} onChange={(e) => update("contact_phone", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="info@venue.com" value={form.contact_email} onChange={(e) => update("contact_email", e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.verified} onChange={(e) => update("verified", e.target.checked)} className="size-4 rounded border-border" />
              <span className="text-sm">Verified</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.active} onChange={(e) => update("active", e.target.checked)} className="size-4 rounded border-border" />
              <span className="text-sm">Active</span>
            </label>
          </div>
          {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={submitting}>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={!isValid() || submitting} className="bg-lime-500 text-white hover:bg-lime-600 disabled:bg-lime-500/50">
              {submitting ? "Saving..." : isEdit ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
