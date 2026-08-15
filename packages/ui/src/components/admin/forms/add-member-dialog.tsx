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
import { useCreateMembershipMutation } from "@workspace/store/reducers/membershipsApi"
import { useListUsersQuery } from "@workspace/store/reducers/usersApi"
import { toastSuccess, toastError } from "@workspace/ui/lib/toast"

const roleOptions = ["admin", "staff", "member"] as const

type FormData = { userId: string; role: "admin" | "staff" | "member" }

const empty: FormData = { userId: "", role: "member" }

export function AddMemberDialog({
  open,
  onOpenChange,
  orgId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  orgId?: string
}) {
  const [form, setForm] = useState<FormData>(empty)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [createMember, { isLoading: isCreating }] =
    useCreateMembershipMutation()
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
    return !!form.userId && !!orgId
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid()) return
    setErrorMsg(null)
    try {
      await createMember({
        organizationId: orgId!,
        body: { membership: { user_id: form.userId, role: form.role } },
      }).unwrap()
      onOpenChange(false)
      toastSuccess("Member added.")
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? (err as { data?: { message?: string } }).data?.message
          : undefined
      setErrorMsg(msg ?? "Something went wrong. Please try again.")
      toastError(err, "Failed to add member.")
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!isCreating) onOpenChange(o)
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Member</DialogTitle>
          <DialogDescription>
            Add an existing user to the organization.
          </DialogDescription>
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
                  <p className="px-2 py-1.5 text-sm text-muted-foreground">
                    No active users found.
                  </p>
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
                      {u.phone && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {u.phone}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <div className="flex gap-2">
              {roleOptions.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => update("role", r)}
                  className={cn(
                    "flex-1 rounded-md border px-2.5 py-1.5 text-xs font-medium capitalize transition-colors",
                    form.role === r
                      ? "border-lime-500 bg-lime-50 text-lime-700 dark:bg-lime-950/20 dark:text-lime-400"
                      : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                  )}
                >
                  {r}
                </button>
              ))}
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
              className="bg-lime-500 text-white hover:bg-lime-600 disabled:bg-lime-500/50"
            >
              {isCreating ? "Adding..." : "Add Member"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
