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
import { SearchableSelect } from "@workspace/ui/components/searchable-select"
import { useCreateRetentionHoldMutation } from "@workspace/store/reducers/dataRetentionApi"
import { useListEventsQuery } from "@workspace/store/reducers/eventsApi"
import { useListUsersQuery } from "@workspace/store/reducers/usersApi"
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

type ScopeType = "event" | "user" | "registration"

type FormData = {
  scopeType: ScopeType
  event_id: string
  user_id: string
  registration_id: string
  category: string
  reason_code: string
  starts_at: string
  expires_at: string
}

const empty: FormData = {
  scopeType: "event",
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

  const { data: eventsData, isLoading: eventsLoading } = useListEventsQuery(
    { per_page: 100 },
    { skip: !open || form.scopeType !== "event" }
  )
  const { data: usersData, isLoading: usersLoading } = useListUsersQuery(
    { per_page: 100 },
    { skip: !open || form.scopeType !== "user" }
  )

  const eventOptions = (eventsData?.data ?? []).map((e) => ({
    value: e.id,
    label: e.title,
    description: e.slug ? `Slug: ${e.slug}` : undefined,
  }))

  const userOptions = (usersData?.data ?? []).map((u) => ({
    value: u.id,
    label: u.email,
    description: u.phone ? `Phone: ${u.phone}` : undefined,
  }))

  useEffect(() => {
    if (open) {
      setForm(empty)
      setErrorMsg(null)
    }
  }, [open])

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((p) => ({ ...p, [key]: value }))
  }

  const selectedScopeValue =
    form.scopeType === "event"
      ? form.event_id
      : form.scopeType === "user"
      ? form.user_id
      : form.registration_id

  function isValid() {
    return selectedScopeValue.trim() && form.reason_code && form.starts_at
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid()) return
    setErrorMsg(null)

    try {
      await createHold({
        data_retention_hold: {
          event_id: form.scopeType === "event" ? form.event_id : undefined,
          user_id: form.scopeType === "user" ? form.user_id : undefined,
          registration_id:
            form.scopeType === "registration" ? form.registration_id : undefined,
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
          <DialogDescription>
            Suspend retention processing for one event, user, or registration.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-3">
            <Label>Scope Type <span className="text-destructive">*</span></Label>
            <div className="flex gap-2">
              {(["event", "user", "registration"] as ScopeType[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      scopeType: st,
                      event_id: "",
                      user_id: "",
                      registration_id: "",
                    }))
                  }
                  className={`flex-1 rounded-md border px-2.5 py-1.5 text-xs font-medium capitalize transition-colors ${
                    form.scopeType === st
                      ? "border-lime-500 bg-lime-50 text-lime-700 dark:bg-lime-950/20 dark:text-lime-400"
                      : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {form.scopeType === "event" && (
              <div className="space-y-1">
                <Label className="text-xs">Event</Label>
                <SearchableSelect
                  options={eventOptions}
                  value={form.event_id}
                  onChange={(val) => update("event_id", val)}
                  placeholder="Select event..."
                  searchPlaceholder="Search events..."
                  loading={eventsLoading}
                  emptyMessage="No events found."
                />
              </div>
            )}

            {form.scopeType === "user" && (
              <div className="space-y-1">
                <Label className="text-xs">User</Label>
                <SearchableSelect
                  options={userOptions}
                  value={form.user_id}
                  onChange={(val) => update("user_id", val)}
                  placeholder="Select user..."
                  searchPlaceholder="Search users..."
                  loading={usersLoading}
                  emptyMessage="No users found."
                />
              </div>
            )}

            {form.scopeType === "registration" && (
              <div className="space-y-1">
                <Label htmlFor="registration_id" className="text-xs">Registration ID</Label>
                <Input
                  id="registration_id"
                  placeholder="Enter registration UUID"
                  value={form.registration_id}
                  onChange={(e) => update("registration_id", e.target.value)}
                  required
                />
              </div>
            )}
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
            <Input
              id="category"
              placeholder="e.g. registration_free_text"
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="starts_at">Starts At <span className="text-destructive">*</span></Label>
              <Input
                id="starts_at"
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => update("starts_at", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expires_at">Expires At</Label>
              <Input
                id="expires_at"
                type="datetime-local"
                value={form.expires_at}
                onChange={(e) => update("expires_at", e.target.value)}
              />
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
            >
              {isCreating ? "Placing..." : "Place Hold"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
