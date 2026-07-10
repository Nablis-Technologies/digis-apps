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

export function RequestModificationDialog({
  open,
  onOpenChange,
  orgName,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  orgName?: string
}) {
  const [feedback, setFeedback] = useState("")
  const [submitting, setSubmitting] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!feedback.trim()) return
    setSubmitting(true)
    console.log("POST /admin/organizations/:id/verification/request_modification", { feedback: { message: feedback } })
    setTimeout(() => { setSubmitting(false); onOpenChange(false); setFeedback("") }, 800)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!submitting) { onOpenChange(o); if (!o) setFeedback("") } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Modification</DialogTitle>
          <DialogDescription>
            {orgName ? <>Ask <strong>{orgName}</strong> to provide additional information or fix issues.</> : "Ask the organization to provide additional information or fix issues."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="feedback">Feedback <span className="text-destructive">*</span></Label>
            <textarea
              id="feedback"
              rows={4}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50 resize-none"
              placeholder="Please provide a clearer copy of your TIN certificate..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <DialogClose asChild><Button type="button" variant="outline" disabled={submitting}>Cancel</Button></DialogClose>
            <Button type="submit" disabled={!feedback.trim() || submitting} className="bg-lime-500 text-white hover:bg-lime-600 disabled:bg-lime-500/50">
              {submitting ? "Sending..." : "Send Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
