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
import { cn } from "@/lib/utils"

const roleOptions = ["admin", "staff", "member"] as const

type FormData = { user_email: string; role: string }

const empty: FormData = { user_email: "", role: "staff" }

export function AddMemberDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [form, setForm] = useState<FormData>(empty)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { if (open) setForm(empty) }, [open])

  function update<K extends keyof FormData>(key: K, value: FormData[K]) { setForm((p) => ({ ...p, [key]: value })) }
  function isValid() { return form.user_email.trim() }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid()) return
    setSubmitting(true)
    console.log("POST /admin/organizations/:id/memberships", { membership: form })
    setTimeout(() => { setSubmitting(false); onOpenChange(false) }, 600)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!submitting) onOpenChange(o) }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Member</DialogTitle>
          <DialogDescription>Add an existing user to the organization.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
            <Input id="email" type="email" placeholder="user@example.com" value={form.user_email} onChange={(e) => update("user_email", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <div className="flex gap-2">
              {roleOptions.map((r) => (
                <button key={r} type="button" onClick={() => update("role", r)} className={cn("flex-1 rounded-md border px-2.5 py-1.5 text-xs font-medium capitalize transition-colors", form.role === r ? "border-lime-500 bg-lime-50 text-lime-700 dark:bg-lime-950/20 dark:text-lime-400" : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground")}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={submitting}>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={!isValid() || submitting} className="bg-lime-500 text-white hover:bg-lime-600 disabled:bg-lime-500/50">
              {submitting ? "Adding..." : "Add Member"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
