"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCreatePermissionMutation, useUpdatePermissionMutation } from "@/store/reducers/permissionsApi"

type FormData = {
  code: string
  resource: string
  action: string
  namespace: string
  description: string
  active: boolean
}

const empty: FormData = { code: "", resource: "", action: "", namespace: "", description: "", active: true }

export function PermissionDialog({
  open,
  onOpenChange,
  permission,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  permission?: { id: string; code: string; resource: string; action: string; namespace: string | null; description: string | null; active: boolean } | null
}) {
  const isEdit = !!permission
  const [form, setForm] = useState<FormData>(empty)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [createPermission, { isLoading: isCreating }] = useCreatePermissionMutation()
  const [updatePermission, { isLoading: isUpdating }] = useUpdatePermissionMutation()
  const submitting = isCreating || isUpdating

  useEffect(() => {
    if (open) {
      setForm(permission ? { code: permission.code, resource: permission.resource, action: permission.action, namespace: permission.namespace ?? "", description: permission.description ?? "", active: permission.active } : empty)
      setErrorMsg(null)
    }
  }, [open, permission])

  function update<K extends keyof FormData>(key: K, value: FormData[K]) { setForm((p) => ({ ...p, [key]: value })) }
  function isValid() { return form.code.trim() && form.resource.trim() && form.action.trim() }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid()) return
    setErrorMsg(null)

    try {
      if (isEdit && permission) {
        await updatePermission({
          id: permission.id,
          body: {
            permission: {
              description: form.description || undefined,
              active: form.active,
            },
          },
        }).unwrap()
      } else {
        await createPermission({
          permission: {
            code: form.code,
            resource: form.resource,
            action: form.action,
            namespace: form.namespace || undefined,
            description: form.description || undefined,
            active: form.active,
          },
        }).unwrap()
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Permission" : "Create Permission"}</DialogTitle>
          <DialogDescription>{isEdit ? `Update permission "${permission?.code}".` : "Define a new permission. Code must be unique."}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code <span className="text-destructive">*</span></Label>
              <Input id="code" placeholder="user.view" value={form.code} onChange={(e) => update("code", e.target.value)} required disabled={isEdit} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="action">Action <span className="text-destructive">*</span></Label>
              <Input id="action" placeholder="view" value={form.action} onChange={(e) => update("action", e.target.value)} required disabled={isEdit} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="resource">Resource <span className="text-destructive">*</span></Label>
              <Input id="resource" placeholder="user" value={form.resource} onChange={(e) => update("resource", e.target.value)} required disabled={isEdit} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="namespace">Namespace</Label>
              <Input id="namespace" placeholder="core" value={form.namespace} onChange={(e) => update("namespace", e.target.value)} disabled={isEdit} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Input id="desc" placeholder="View user details" value={form.description} onChange={(e) => update("description", e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="active" checked={form.active} onChange={(e) => update("active", e.target.checked)} className="size-4 rounded border-border" />
            <Label htmlFor="active" className="cursor-pointer">Active</Label>
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
