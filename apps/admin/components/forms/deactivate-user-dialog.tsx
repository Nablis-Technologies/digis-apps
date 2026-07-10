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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useDeactivateUserMutation } from "@/store/reducers/usersApi"

export function DeactivateUserDialog({
  open,
  onOpenChange,
  userId,
  userName,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId?: string
  userName?: string
}) {
  const [reason, setReason] = useState("")
  const [deactivateUser, { isLoading }] = useDeactivateUserMutation()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return
    try {
      await deactivateUser({ id: userId, body: { deactivated_reason: reason } }).unwrap()
      onOpenChange(false)
      setReason("")
    } catch {
      // stay open so user can retry
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!isLoading) { onOpenChange(o); if (!o) setReason("") } }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Deactivate User</DialogTitle>
          <DialogDescription>
            {userName ? <><strong>{userName}</strong> will be unable to log in. Their tokens will be revoked.</> : "This user will be unable to log in. Their tokens will be revoked."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason <span className="text-destructive">*</span></Label>
            <Input id="reason" placeholder="Account compromised" value={reason} onChange={(e) => setReason(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <DialogClose asChild><Button type="button" variant="outline" disabled={isLoading}>Cancel</Button></DialogClose>
            <Button type="submit" disabled={!reason.trim() || isLoading} className="bg-red-600 text-white hover:bg-red-700 disabled:bg-red-600/50">{isLoading ? "Deactivating..." : "Deactivate"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
