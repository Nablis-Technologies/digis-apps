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
import {
  useCreateRoleMutation,
  useUpdateRoleMutation,
} from "@workspace/store/reducers/rolesApi"
import { useListPermissionsQuery } from "@workspace/store/reducers/permissionsApi"
import { toastSuccess, toastError } from "@workspace/ui/lib/toast"

type RoleFormData = {
  code: string
  name: string
  description: string
  active: boolean
  permission_ids: string[]
}

const empty: RoleFormData = {
  code: "",
  name: "",
  description: "",
  active: true,
  permission_ids: [],
}

export function RoleDialog({
  open,
  onOpenChange,
  role,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  role?: {
    id: string
    code: string
    name: string
    description: string | null
    active: boolean
    permission_ids?: string[]
  } | null
}) {
  const isEdit = !!role
  const [form, setForm] = useState<RoleFormData>(empty)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation()
  const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation()
  const { data: permsData, isLoading: permsLoading } = useListPermissionsQuery(
    { per_page: 100 },
    { skip: !open }
  )

  const submitting = isCreating || isUpdating

  const permOptions = (permsData?.data ?? []).map((p) => ({
    value: p.id,
    label: p.code,
    description: p.description || `${p.resource}:${p.action}`,
  }))

  useEffect(() => {
    if (open) {
      setForm(
        role
          ? {
              code: role.code,
              name: role.name,
              description: role.description ?? "",
              active: role.active,
              permission_ids: role.permission_ids ?? [],
            }
          : empty
      )
      setErrorMsg(null)
    }
  }, [open, role])

  function update<K extends keyof RoleFormData>(
    key: K,
    value: RoleFormData[K]
  ) {
    setForm((p) => ({ ...p, [key]: value }))
  }

  function isValid() {
    return form.code.trim() && form.name.trim()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid()) return
    setErrorMsg(null)

    try {
      if (isEdit && role) {
        await updateRole({
          id: role.id,
          body: {
            role: {
              name: form.name,
              description: form.description || undefined,
              active: form.active,
              permission_ids: form.permission_ids,
            },
          },
        }).unwrap()
      } else {
        await createRole({
          role: {
            code: form.code.toUpperCase(),
            name: form.name,
            description: form.description || undefined,
            active: form.active,
            permission_ids: form.permission_ids,
          },
        }).unwrap()
      }
      onOpenChange(false)
      toastSuccess(isEdit ? "Role updated." : "Role created.")
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? (err as { data?: { message?: string } }).data?.message
          : undefined
      setErrorMsg(msg ?? "Something went wrong. Please try again.")
      toastError(err, isEdit ? "Failed to update role." : "Failed to create role.")
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
          <DialogTitle>{isEdit ? "Edit Role" : "Create Role"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? `Update role "${role?.code}".`
              : "Define a new role with a unique code."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="code">
              Code <span className="text-destructive">*</span>
            </Label>
            <Input
              id="code"
              placeholder="ORGANIZER"
              value={form.code}
              onChange={(e) => update("code", e.target.value.toUpperCase())}
              required
              disabled={isEdit}
            />
            <p className="text-xs text-muted-foreground">
              Unique uppercase identifier. Cannot be changed after creation.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Organizer"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Input
              id="desc"
              placeholder="Event organizer role"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Permissions</Label>
            <SearchableSelect
              options={permOptions}
              value={form.permission_ids}
              onChange={(val) => update("permission_ids", val)}
              placeholder="Select permissions..."
              searchPlaceholder="Search permissions..."
              loading={permsLoading}
              multiple
              emptyMessage="No permissions found."
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={form.active}
              onChange={(e) => update("active", e.target.checked)}
              className="size-4 rounded border-border"
            />
            <Label htmlFor="active" className="cursor-pointer">
              Active
            </Label>
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
            >
              {submitting
                ? "Saving..."
                : isEdit
                  ? "Update Role"
                  : "Create Role"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
