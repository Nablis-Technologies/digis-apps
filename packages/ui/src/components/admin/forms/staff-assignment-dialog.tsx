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
import { useCreateStaffAssignmentMutation } from "@workspace/store/reducers/eventScheduleApi"
import { useListUsersQuery } from "@workspace/store/reducers/usersApi"

const roleOptions = ["staff", "manager", "lead"] as const

type FormData = { userId: string; role: string }

const empty: FormData = { userId: "", role: "staff" }

export function StaffAssignmentDialog({
  open,
  onOpenChange,
  eventId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
}) {
  const [form, setForm] = useState<FormData>(empty)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [createStaff, { isLoading: isCreating }] = useCreateStaffAssignmentMutation()
  const { data: usersData, isLoading: usersLoading } = useListUsersQuery(
    { page: 1, per_page: 50, status: "active", order_by: "created_at", order_direction: "desc" },
    { skip: !open }
  )
  const users = usersData?.data ?? []

  useEffect(() => {
    if (open) {
      setForm(empty)
      setErrorMsg(null)
    }
  }, [open])

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((p) => ({ ...p, [key]: value }))
  }
  function isValid() {
    return !!form.userId
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid()) return
    setErrorMsg(null)
    try {
      await createStaff({
        eventId,
        body: { event_staff_assignment: { user_id: form.userId, role: form.role } },
      }).unwrap()
      onOpenChange(false)
      toastSuccess("Staff member assigned.")
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? (err as { data?: { message?: string } }).data?.message
          : undefined
      setErrorMsg(msg ?? "Something went wrong. Please try again.")
      toastError(err, "Failed to assign staff member.")
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!isCreating) onOpenChange(o)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Staff</DialogTitle>
          <DialogDescription>Assign a user to work this event.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label>
              User <span className="text-destructive">*</span>
            </Label>
            {usersLoading ? (
              <p className="text-sm text-muted-foreground">Loading users...</p>
            ) : (
              <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-lg border border-border/50 p-2">
                {users.length === 0 ? (
                  <p className="px-2 py-1.5 text-sm text-muted-foreground">No active users found.</p>
                ) : (
                  users.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => update("userId", u.id)}
                      className={cn(
                        "w-full rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors",
                        form.userId === u.id
                          ? "border-lime-500 bg-lime-50 text-lime-700 dark:bg-lime-950/20 dark:text-lime-400"
                          : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                      )}
                    >
                      {u.email}
                      {u.phone && <span className="ml-2 text-xs text-muted-foreground">{u.phone}</span>}
                    </button>
                  ))
                )}
              </div>
            )}
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
              {isCreating ? "Assigning..." : "Assign"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
