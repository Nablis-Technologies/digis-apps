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
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"

export function TransferOwnershipDialog({
  open,
  onOpenChange,
  orgName,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  orgName?: string
}) {
  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setSubmitting(true)
    setTimeout(() => { setSubmitting(false); onOpenChange(false); setEmail("") }, 800)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!submitting) { onOpenChange(o); if (!o) setEmail("") } }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Transfer Ownership</DialogTitle>
          <DialogDescription>
            {orgName ? <>Transfer ownership of <strong>{orgName}</strong> to another user. The new owner must already be a member.</> : "Transfer ownership to another user. The new owner must already be a member."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="newOwner">New Owner Email <span className="text-destructive">*</span></Label>
            <Input id="newOwner" type="email" placeholder="user@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <DialogClose asChild><Button type="button" variant="outline" disabled={submitting}>Cancel</Button></DialogClose>
            <Button type="submit" disabled={!email.trim() || submitting} className="bg-lime-500 text-white hover:bg-lime-600 disabled:bg-lime-500/50">{submitting ? "Transferring..." : "Transfer"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
