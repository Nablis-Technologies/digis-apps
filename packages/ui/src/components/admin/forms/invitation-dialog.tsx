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
import { PhoneInput, normalizeEthiopianPhone } from "@workspace/ui/components/phone-input"
import { Label } from "@workspace/ui/components/label"
import { toastSuccess, toastError } from "@workspace/ui/lib/toast"
import { useCreateInvitationMutation } from "@workspace/store/reducers/ticketingApi"

type FormData = {
  email: string
  name: string
  allowed_quantity: string
  expires_at: string
  phone: string
}

const empty: FormData = {
  email: "",
  name: "",
  allowed_quantity: "1",
  expires_at: "",
  phone: "",
}

export function InvitationDialog({
  open,
  onOpenChange,
  eventId,
  productId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  productId: string
}) {
  const [form, setForm] = useState<FormData>(empty)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [createInvite, { isLoading: isCreating }] = useCreateInvitationMutation()

  useEffect(() => {
    if (open) {
      setForm(empty)
      setErrorMsg(null)
    }
  }, [open])

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((p) => ({ ...p, [key]: value }))
  }
  function isValid() {
    return form.email.trim() || form.phone.trim()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid()) return
    setErrorMsg(null)
    try {
      await createInvite({
        eventId,
        productId,
        body: {
          email: form.email || undefined,
          name: form.name || undefined,
          allowed_quantity: form.allowed_quantity ? Number(form.allowed_quantity) : undefined,
          expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : undefined,
          phone: normalizeEthiopianPhone(form.phone) || undefined,
        },
      }).unwrap()
      onOpenChange(false)
      toastSuccess("Invitation created.")
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? (err as { data?: { message?: string } }).data?.message
          : undefined
      setErrorMsg(msg ?? "Something went wrong. Please try again.")
      toastError(err, "Failed to create invitation.")
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!isCreating) onOpenChange(o)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Invitation</DialogTitle>
          <DialogDescription>Invite someone to purchase this ticket type.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="guest@example.com" value={form.email} onChange={(e) => update("email", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Guest" value={form.name} onChange={(e) => update("name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <PhoneInput id="phone" placeholder="91 123 4567" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="allowed_quantity">Allowed quantity</Label>
              <Input id="allowed_quantity" type="number" min={1} value={form.allowed_quantity} onChange={(e) => update("allowed_quantity", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expires_at">Expires at</Label>
              <Input id="expires_at" type="datetime-local" value={form.expires_at} onChange={(e) => update("expires_at", e.target.value)} />
            </div>
          </div>
          {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isCreating}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={!isValid() || isCreating}
              className="bg-lime-500 text-white hover:bg-lime-600 disabled:bg-lime-500/50"
            >
              {isCreating ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
