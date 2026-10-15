"use client"

import { useState } from "react"
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
import { useAssignRoleMutation } from "@workspace/store/reducers/usersApi"
import { useListRolesQuery } from "@workspace/store/reducers/rolesApi"
import { toastSuccess, toastError } from "@workspace/ui/lib/toast"

export function AssignRoleDialog({
  open,
  onOpenChange,
  userId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId?: string
}) {
  const [selected, setSelected] = useState("")
  const [assignRole, { isLoading }] = useAssignRoleMutation()
  const { data: rolesData, isLoading: rolesLoading } = useListRolesQuery(undefined, { skip: !open })

  const roles = rolesData?.data ?? []
  const roleOptions = roles.map((r) => ({
    value: r.id,
    label: r.name,
    badge: r.code,
    description: r.description || undefined,
  }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected || !userId) return
    try {
      await assignRole({
        userId,
        body: { user_role: { role_id: selected } },
      }).unwrap()
      onOpenChange(false)
      toastSuccess("Role assigned.")
      setSelected("")
    } catch (err) {
      toastError(err, "Failed to assign role.")
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!isLoading) {
          onOpenChange(o)
          if (!o) setSelected("")
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Role</DialogTitle>
          <DialogDescription>
            Select a role to assign to this user.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label>Role</Label>
            <SearchableSelect
              options={roleOptions}
              value={selected}
              onChange={setSelected}
              placeholder="Select a role..."
              searchPlaceholder="Search roles..."
              loading={rolesLoading}
              emptyMessage="No roles available."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isLoading}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={!selected || isLoading}
            >
              {isLoading ? "Assigning..." : "Assign Role"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
