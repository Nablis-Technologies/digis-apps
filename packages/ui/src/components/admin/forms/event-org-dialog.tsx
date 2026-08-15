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
import { Label } from "@workspace/ui/components/label"
import { cn } from "@workspace/ui/lib/utils"
import { toastSuccess, toastError } from "@workspace/ui/lib/toast"
import {
  useCreateEventOrganizationMutation,
  useUpdateEventOrganizationMutation,
  type EventOrganization,
} from "@workspace/store/reducers/eventScheduleApi"
import { useListOrganizationsQuery } from "@workspace/store/reducers/organizationsApi"

const typeOptions = ["promoter", "vendor", "partner", "sponsor"] as const
const roleOptions = ["collaborator", "primary_owner", "owner"] as const

type FormData = {
  organizationId: string
  type: string
  role: string
}

const empty: FormData = { organizationId: "", type: "promoter", role: "collaborator" }

export function EventOrgDialog({
  open,
  onOpenChange,
  eventId,
  org,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  org?: EventOrganization | null
}) {
  const isEdit = !!org
  const [form, setForm] = useState<FormData>(empty)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [createOrg, { isLoading: isCreating }] = useCreateEventOrganizationMutation()
  const [updateOrg, { isLoading: isUpdating }] = useUpdateEventOrganizationMutation()
  const { data: orgsData, isLoading: orgsLoading } = useListOrganizationsQuery(
    { page: 1, per_page: 50 },
    { skip: !open || !!org }
  )
  const submitting = isCreating || isUpdating
  const organizations = orgsData?.data ?? []

  useEffect(() => {
    if (open) {
      setForm(
        org
          ? { organizationId: org.organization_id, type: org.type, role: org.role }
          : empty
      )
      setErrorMsg(null)
    }
  }, [open, org])

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((p) => ({ ...p, [key]: value }))
  }
  function isValid() {
    return !!form.organizationId
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid()) return
    setErrorMsg(null)

    try {
      if (isEdit && org) {
        await updateOrg({
          eventId,
          id: org.id,
          body: { event_organization: { type: form.type, role: form.role } },
        }).unwrap()
      } else {
        await createOrg({
          eventId,
          body: {
            event_organization: { organization_id: form.organizationId, type: form.type, role: form.role },
          },
        }).unwrap()
      }
      onOpenChange(false)
      toastSuccess(isEdit ? "Event organization updated." : "Event organization added.")
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? (err as { data?: { message?: string } }).data?.message
          : undefined
      setErrorMsg(msg ?? "Something went wrong. Please try again.")
      toastError(err, isEdit ? "Failed to update event organization." : "Failed to add event organization.")
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
          <DialogTitle>{isEdit ? "Edit Event Organization" : "Add Event Organization"}</DialogTitle>
          <DialogDescription>Link an organization to this event as a collaborator.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          {!isEdit && (
            <div className="space-y-2">
              <Label>
                Organization <span className="text-destructive">*</span>
              </Label>
              {orgsLoading ? (
                <p className="text-sm text-muted-foreground">Loading organizations...</p>
              ) : (
                <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-lg border border-border/50 p-2">
                  {organizations.length === 0 ? (
                    <p className="px-2 py-1.5 text-sm text-muted-foreground">No organizations found.</p>
                  ) : (
                    organizations.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => update("organizationId", o.id)}
                        className={cn(
                          "w-full rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors",
                          form.organizationId === o.id
                            ? "border-lime-500 bg-lime-50 text-lime-700 dark:bg-lime-950/20 dark:text-lime-400"
                            : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                        )}
                      >
                        {o.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
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
              <Label>Role</Label>
              <select
                value={form.role}
                onChange={(e) => update("role", e.target.value)}
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
              >
                {roleOptions.map((r) => (
                  <option key={r} value={r} className="capitalize">
                    {r}
                  </option>
                ))}
              </select>
            </div>
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
              className="bg-lime-500 text-white hover:bg-lime-600 disabled:bg-lime-500/50"
            >
              {submitting ? "Saving..." : isEdit ? "Update" : "Add"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
