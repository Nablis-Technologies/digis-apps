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
import { useCreateRetentionHoldMutation } from "@workspace/store/reducers/dataRetentionApi"
import { toastSuccess, toastError } from "@workspace/ui/lib/toast"

const reasonOptions = [
  "legal_hold",
  "litigation",
  "regulatory_investigation",
  "security_incident",
  "security_hold",
  "fraud_investigation",
  "law_enforcement_request",
] as const

type FormData = {
  event_id: string
  user_id: string
  registration_id: string
  category: string
  reason_code: string
  starts_at: string
  expires_at: string
}

const empty: FormData = {
  event_id: "",
  user_id: "",
  registration_id: "",
  category: "",
  reason_code: "legal_hold",
  starts_at: "",
  expires_at: "",
}

export function RetentionHoldDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [form, setForm] = useState<FormData>(empty)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [createHold, { isLoading: isCreating }] =
    useCreateRetentionHoldMutation()

  useEffect(() => {
    if (open) {
      setForm(empty)
      setErrorMsg(null)
    }
  }, [open])

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((p) => ({ ...p, [key]: value }))
  }

  const scopeCount = [form.event_id, form.user_id, form.registration_id].filter(Boolean).length

  function isValid() {
    return scopeCount === 1 && form.reason_code && form.starts_at
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid()) return
    setErrorMsg(null)

    try {
      await createHold({
        data_retention_hold: {
          event_id: form.event_id || undefined,
          user_id: form.user_id || undefined,
          registration_id: form.registration_id || undefined,
          category: form.category || undefined,
          reason_code: form.reason_code,
          starts_at: new Date(form.starts_at).toISOString(),
          expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : undefined,
        },
      }).unwrap()
      onOpenChange(false)
      toastSuccess("Retention hold created.")
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? (err as { data?: { message?: string } }).data?.message
          : undefined
      setErrorMsg(msg ?? "Something went wrong. Please try again.")
      toastError(err, "Failed to create retention hold.")
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!isCreating) onOpenChange(o)
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Place Data Retention Hold</DialogTitle>
          <DialogDescription>Suspend retention processing for one event, registration, or user. Provide exactly one scope.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label>Scope <span className="text-destructive">*</span></Label>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="event_id" className="text-xs">Event ID</Label>
                <Input id="event_id" placeholder="event uuid" value={form.event_id} onChange={(e) => update("event_id", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="user_id" className="text-xs">User ID</Label>
                <Input id="user_id" placeholder="user uuid" value={form.user_id} onChange={(e) => update("user_id", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="registration_id" className="text-xs">Registration ID</Label>
                <Input id="registration_id" placeholder="registration uuid" value={form.registration_id} onChange={(e) => update("registration_id", e.target.value)} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Exactly one of event / user / registration is required.</p>
          </div>
          <div className="space-y-2">
            <Label>Reason Code <span className="text-destructive">*</span></Label>
            <select
              value={form.reason_code}
              onChange={(e) => update("reason_code", e.target.value)}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
            >
              {reasonOptions.map((r) => (
                <option key={r} value={r}>
                  {r.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input id="category" placeholder="e.g. registration_free_text" value={form.category} onChange={(e) => update("category", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="starts_at">Starts At <span className="text-destructive">*</span></Label>
              <Input id="starts_at" type="datetime-local" value={form.starts_at} onChange={(e) => update("starts_at", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expires_at">Expires At</Label>
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
              {isCreating ? "Placing..." : "Place Hold"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
