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
import { SearchableSelect } from "@workspace/ui/components/searchable-select"
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
    { per_page: 100 },
    { skip: !open || !!org }
  )
  const submitting = isCreating || isUpdating
  const organizations = orgsData?.data ?? []

  const orgOptions = organizations.map((o) => ({
    value: o.id,
    label: o.name,
    description: o.city ? `${o.city}, ${o.country ?? ""}` : undefined,
  }))

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
          <DialogTitle>{isEdit ? "Edit Organization" : "Add Organization"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update organization role and type." : "Associate an organization with this event."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          {!isEdit && (
            <div className="space-y-2">
              <Label>
                Organization <span className="text-destructive">*</span>
              </Label>
              <SearchableSelect
                options={orgOptions}
                value={form.organizationId}
                onChange={(val) => update("organizationId", val)}
                placeholder="Select organization..."
                searchPlaceholder="Search organizations..."
                loading={orgsLoading}
                emptyMessage="No organizations found."
              />
            </div>
          )}
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {typeOptions.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => update("type", t)}
                  className={cn(
                    "rounded-md border px-2.5 py-1.5 text-xs font-medium capitalize transition-colors",
                    form.type === t
                      ? "border-lime-500 bg-lime-50 text-lime-700 dark:bg-lime-950/20 dark:text-lime-400"
                      : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <div className="grid grid-cols-3 gap-2">
              {roleOptions.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => update("role", r)}
                  className={cn(
                    "rounded-md border px-2.5 py-1.5 text-xs font-medium capitalize transition-colors",
                    form.role === r
                      ? "border-lime-500 bg-lime-50 text-lime-700 dark:bg-lime-950/20 dark:text-lime-400"
                      : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                  )}
                >
                  {r.replace("_", " ")}
                </button>
              ))}
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
