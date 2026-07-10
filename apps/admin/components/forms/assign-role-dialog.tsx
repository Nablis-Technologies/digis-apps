"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useAssignRoleMutation } from "@/store/reducers/usersApi"
import { useListRolesQuery } from "@/store/reducers/rolesApi"

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
  const { data: rolesData } = useListRolesQuery(undefined, { skip: !open })

  const roles = rolesData?.data ?? []

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected || !userId) return
    try {
      await assignRole({ userId, body: { user_role: { role_id: selected } } }).unwrap()
      onOpenChange(false)
      setSelected("")
    } catch {
      // stay open so user can retry
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!isLoading) { onOpenChange(o); if (!o) setSelected("") } }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Assign Role</DialogTitle>
          <DialogDescription>Select a role to assign to this user.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label>Role</Label>
            <div className="space-y-1.5">
              {roles.map((r) => (
                <button key={r.id} type="button" onClick={() => setSelected(r.id)} className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors ${selected === r.id ? "border-lime-500 bg-lime-50 text-lime-700 dark:bg-lime-950/20 dark:text-lime-400" : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground"}`}>
                  <span className="text-xs font-mono text-muted-foreground mr-2">{r.code}</span>
                  {r.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <DialogClose asChild><Button type="button" variant="outline" disabled={isLoading}>Cancel</Button></DialogClose>
            <Button type="submit" disabled={!selected || isLoading} className="bg-lime-500 text-white hover:bg-lime-600 disabled:bg-lime-500/50">{isLoading ? "Assigning..." : "Assign Role"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
