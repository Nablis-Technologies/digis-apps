"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AlertDiamondIcon,
  Cancel01Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons"
import { useCreateEventCancellationMutation } from "@workspace/store/reducers/organizerEventsApi"

interface CancelEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  eventTitle: string
}

export function CancelEventDialog({
  open,
  onOpenChange,
  eventId,
  eventTitle,
}: CancelEventDialogProps) {
  const [attendeeReason, setAttendeeReason] = useState<string>("")
  const [internalNote, setInternalNote] = useState<string>("")
  const [confirmText, setConfirmText] = useState<string>("")

  const [cancelEvent, { isLoading }] = useCreateEventCancellationMutation()

  const isConfirmed = confirmText.trim().toUpperCase() === "CANCEL"

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isConfirmed) {
      toast.error('Please type "CANCEL" to confirm event cancellation')
      return
    }

    if (!attendeeReason.trim()) {
      toast.error("Please provide a cancellation reason for attendees")
      return
    }

    try {
      await cancelEvent({
        eventId,
        payload: {
          attendee_reason: attendeeReason.trim(),
          ...(internalNote.trim() ? { internal_note: internalNote.trim() } : {}),
        },
      }).unwrap()

      toast.success("Event cancelled successfully", {
        description: "The event has been cancelled and attendees have been notified.",
      })
      onOpenChange(false)
    } catch (err: any) {
      toast.error("Failed to cancel event", {
        description: err?.data?.message || err?.message || "An unexpected error occurred",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleCancel}>
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <HugeiconsIcon icon={AlertDiamondIcon} size={20} strokeWidth={2} />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">Cancel Event</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Permanently cancel this event and initiate refund obligations
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4 text-sm">
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3.5 space-y-1">
              <p className="font-semibold text-xs text-destructive">Warning: Permanent Action</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Cancelling <span className="font-semibold text-foreground">{eventTitle}</span> will permanently halt all ticket sales, revoke active check-in admissions, and initiate refund processing for ticket holders.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="attendee-reason" className="text-xs font-medium">
                Public Reason for Attendees <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="attendee-reason"
                placeholder="Explain to attendees why the event is being cancelled (e.g. unexpected weather, venue emergency)..."
                value={attendeeReason}
                onChange={(e) => setAttendeeReason(e.target.value)}
                required
                rows={3}
                className="text-xs resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="internal-note" className="text-xs font-medium">
                Internal Audit Note (Optional)
              </Label>
              <Input
                id="internal-note"
                placeholder="Internal memo for your team and organization records..."
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
              <Label htmlFor="confirm-cancel" className="text-xs font-medium">
                Type <span className="font-mono font-bold text-destructive">CANCEL</span> to confirm:
              </Label>
              <Input
                id="confirm-cancel"
                placeholder="CANCEL"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Nevermind
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={!isConfirmed || isLoading || !attendeeReason.trim()}
              className="gap-2 font-medium"
            >
              {isLoading ? (
                <>
                  <HugeiconsIcon icon={Loading03Icon} size={16} className="animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <HugeiconsIcon icon={Cancel01Icon} size={16} />
                  Confirm Cancellation
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
