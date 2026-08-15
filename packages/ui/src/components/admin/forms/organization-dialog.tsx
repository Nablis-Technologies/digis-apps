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
  useCreateOrganizationMutation,
  useUpdateOrganizationMutation,
} from "@workspace/store/reducers/organizationsApi"
import { toastSuccess, toastError } from "@workspace/ui/lib/toast"

type FormData = {
  name: string
  description: string
}

const empty: FormData = { name: "", description: "" }

export function OrganizationDialog({
  open,
  onOpenChange,
  organization,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  organization?: { id: string; name: string; description: string | null } | null
}) {
  const isEdit = !!organization
  const [form, setForm] = useState<FormData>(empty)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [createOrg, { isLoading: isCreating }] = useCreateOrganizationMutation()
  const [updateOrg, { isLoading: isUpdating }] = useUpdateOrganizationMutation()
  const submitting = isCreating || isUpdating

  useEffect(() => {
    if (open) {
      setForm(
        organization
          ? {
              name: organization.name,
              description: organization.description ?? "",
            }
          : empty
      )
      setErrorMsg(null)
    }
  }, [open, organization])

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((p) => ({ ...p, [key]: value }))
  }
  function isValid() {
    return form.name.trim()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid()) return
    setErrorMsg(null)

    const payload = {
      organization: {
        name: form.name,
        description: form.description || undefined,
      },
    }

    try {
      if (isEdit && organization) {
        await updateOrg({ id: organization.id, body: payload }).unwrap()
      } else {
        await createOrg({
          organization: { ...payload.organization, owner_id: "" },
        }).unwrap()
      }
      onOpenChange(false)
      toastSuccess(isEdit ? "Organization updated." : "Organization created.")
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? (err as { data?: { message?: string } }).data?.message
          : undefined
      setErrorMsg(msg ?? "Something went wrong. Please try again.")
      toastError(err, isEdit ? "Failed to update organization." : "Failed to create organization.")
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
          <DialogTitle>
            {isEdit ? "Edit Organization" : "Create Organization"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? `Update "${organization?.name}".`
              : "Register a new event organizer."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="New Organization"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Input
              id="desc"
              placeholder="Organization description"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
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
              {submitting ? "Saving..." : isEdit ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
