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
  useCreateRegistrationFormMutation,
  useUpdateRegistrationFormMutation,
  type RegistrationForm,
} from "@workspace/store/reducers/registrationApi"

type FormData = {
  name: string
  active: boolean
}

const empty: FormData = { name: "", active: true }

export function RegistrationFormDialog({
  open,
  onOpenChange,
  eventId,
  form,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  form?: RegistrationForm | null
}) {
  const isEdit = !!form
  const [formData, setFormData] = useState<FormData>(empty)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [createForm, { isLoading: isCreating }] = useCreateRegistrationFormMutation()
  const [updateForm, { isLoading: isUpdating }] = useUpdateRegistrationFormMutation()
  const submitting = isCreating || isUpdating

  useEffect(() => {
    if (open) {
      setFormData(form ? { name: form.name, active: form.active } : empty)
      setErrorMsg(null)
    }
  }, [open, form])

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setFormData((p) => ({ ...p, [key]: value }))
  }
  function isValid() {
    return formData.name.trim()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid()) return
    setErrorMsg(null)

    try {
      if (isEdit && form) {
        await updateForm({
          eventId,
          id: form.id,
          body: { name: formData.name, active: formData.active },
        }).unwrap()
      } else {
        await createForm({ eventId, body: { name: formData.name, active: formData.active } }).unwrap()
      }
      onOpenChange(false)
      toastSuccess(isEdit ? "Registration form updated." : "Registration form created.")
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? (err as { data?: { message?: string } }).data?.message
          : undefined
      setErrorMsg(msg ?? "Something went wrong. Please try again.")
      toastError(err, isEdit ? "Failed to update registration form." : "Failed to create registration form.")
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
          <DialogTitle>{isEdit ? "Edit Registration Form" : "Create Registration Form"}</DialogTitle>
          <DialogDescription>Define a form used to collect attendee details at registration.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input id="name" placeholder="Attendee details" value={formData.name} onChange={(e) => update("name", e.target.value)} required />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="active" checked={formData.active} onChange={(e) => update("active", e.target.checked)} className="size-4 rounded border-border" />
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
