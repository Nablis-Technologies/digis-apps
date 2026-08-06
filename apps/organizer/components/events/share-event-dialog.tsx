"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ShareCardGenerator } from "./share-card-generator"
import { QRCodeGenerator } from "./qr-code-generator"
import { Separator } from "@/components/ui/separator"
import type { Event } from "@/lib/types"

interface ShareEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: Event
}

export function ShareEventDialog({ open, onOpenChange, event }: ShareEventDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader className="shrink-0">
          <DialogTitle>Share your event</DialogTitle>
          <DialogDescription>
            Design and download a shareable image for {event.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ShareCardGenerator event={event} />
          <Separator className="my-6" />
          <QRCodeGenerator eventId={event.id} eventName={event.name} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
