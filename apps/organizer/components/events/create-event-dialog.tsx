"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { CreateEventForm } from "./create-event-form"

interface CreateEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateEventDialog({ open, onOpenChange }: CreateEventDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-4xl"
        showCloseButton
      >
        <div className="pr-1">
          <CreateEventForm onSuccess={() => onOpenChange(false)} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
