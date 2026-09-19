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
import type { Event as SampleEvent } from "@/lib/types"
import type { Event as ApiEvent } from "@workspace/store/reducers/organizerEventsApi"

interface ShareEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: SampleEvent | ApiEvent
}

// Type guard to check if event is from API
function isApiEvent(event: SampleEvent | ApiEvent): event is ApiEvent {
  return "visibility" in event && "event_media" in event
}

export function ShareEventDialog({ open, onOpenChange, event }: ShareEventDialogProps) {
  // Convert API event to sample event format for the share components
  const eventForShare: SampleEvent = isApiEvent(event) 
    ? {
        id: event.id,
        name: event.title,
        category: event.categories?.[0]?.name || event.category_ids?.[0] || "Event",
        bannerUrl: (() => {
          const cover = event.event_media?.find(m => m.type?.toLowerCase() === "cover" || Number(m.position) === 0)
          return cover?.file?.medium || cover?.file?.url || cover?.file_url || "/assets/placeholder-event.jpg"
        })(),
        venue: event.event_dates?.[0]?.venue?.name || "TBD",
        city: event.event_dates?.[0]?.venue?.city || "Addis Ababa",
        startAt: event.event_dates?.[0]?.starts_at || event.created_at,
        status: (event.status.charAt(0).toUpperCase() + event.status.slice(1)) as any,
        tiers: [],
      }
    : event

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader className="shrink-0">
          <DialogTitle>Share your event</DialogTitle>
          <DialogDescription>
            Design and download a shareable image for {eventForShare.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ShareCardGenerator event={eventForShare} />
          <Separator className="my-6" />
          <QRCodeGenerator eventId={eventForShare.id} eventName={eventForShare.name} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
