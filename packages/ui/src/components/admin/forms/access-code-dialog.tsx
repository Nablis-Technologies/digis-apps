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
import { useCreateAccessCodeMutation } from "@workspace/store/reducers/ticketingApi"

type FormData = {
  code: string
  label: string
  max_uses: string
  max_quantity_per_use: string
  starts_at: string
  expires_at: string
  active: boolean
}

const empty: FormData = {
  code: "",
  label: "",
  max_uses: "",
  max_quantity_per_use: "1",
  starts_at: "",
  expires_at: "",
  active: true,
}

export function AccessCodeDialog({
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
  const [createCode, { isLoading: isCreating }] = useCreateAccessCodeMutation()

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
    return form.code.trim()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid()) return
    setErrorMsg(null)
    try {
      await createCode({
        eventId,
        productId,
        body: {
          code: form.code.trim(),
          label: form.label || undefined,
          max_uses: form.max_uses ? Number(form.max_uses) : undefined,
          max_quantity_per_use: form.max_quantity_per_use ? Number(form.max_quantity_per_use) : undefined,
          starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : undefined,
          expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : undefined,
          active: form.active,
        },
      }).unwrap()
      onOpenChange(false)
      toastSuccess("Access code created.")
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? (err as { data?: { message?: string } }).data?.message
          : undefined
      setErrorMsg(msg ?? "Something went wrong. Please try again.")
      toastError(err, "Failed to create access code.")
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
          <DialogTitle>Create Access Code</DialogTitle>
          <DialogDescription>Add an access code to control who can buy this ticket type.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="code">
              Code <span className="text-destructive">*</span>
            </Label>
            <Input id="code" placeholder="VIP-2026" value={form.code} onChange={(e) => update("code", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="label">Label</Label>
            <Input id="label" placeholder="VIP access" value={form.label} onChange={(e) => update("label", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max_uses">Max uses</Label>
              <Input id="max_uses" type="number" min={1} placeholder="100" value={form.max_uses} onChange={(e) => update("max_uses", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_quantity_per_use">Max qty per use</Label>
              <Input id="max_quantity_per_use" type="number" min={1} value={form.max_quantity_per_use} onChange={(e) => update("max_quantity_per_use", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="starts_at">Starts at</Label>
              <Input id="starts_at" type="datetime-local" value={form.starts_at} onChange={(e) => update("starts_at", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expires_at">Expires at</Label>
              <Input id="expires_at" type="datetime-local" value={form.expires_at} onChange={(e) => update("expires_at", e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="active" checked={form.active} onChange={(e) => update("active", e.target.checked)} className="size-4 rounded border-border" />
            <Label htmlFor="active" className="cursor-pointer">Active</Label>
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
            >
              {isCreating ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
