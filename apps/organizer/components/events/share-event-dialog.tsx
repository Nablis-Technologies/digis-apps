"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ShareCardGenerator } from "./share-card-generator"
import { QRCodeGenerator } from "./qr-code-generator"
import { HugeiconsIcon } from "@hugeicons/react"
import { Image01Icon, QrCodeIcon } from "@hugeicons/core-free-icons"
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
          const cover = event.event_media?.find(
            (m) => m.type?.toLowerCase() === "cover" || Number(m.position) === 0
          )
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
      <DialogContent className="sm:max-w-4xl max-h-[92vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="shrink-0 pb-2">
          <DialogTitle className="text-xl font-bold tracking-tight">
            Share &amp; Promote Event
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Generate high-converting social share cards, smart links, and print-ready branded QR codes for &ldquo;{eventForShare.name}&rdquo;.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="share-card" className="min-h-0 flex-1 flex flex-col overflow-hidden">
          <TabsList className="shrink-0 w-full justify-start border-b border-border/80 bg-transparent p-0 mb-4 h-11">
            <TabsTrigger
              value="share-card"
              className="gap-2 text-sm font-semibold py-2.5 px-4 cursor-pointer data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-400"
            >
              <HugeiconsIcon icon={Image01Icon} size={16} strokeWidth={2} />
              <span>Social Share Card</span>
            </TabsTrigger>
            <TabsTrigger
              value="smart-link-qr"
              className="gap-2 text-sm font-semibold py-2.5 px-4 cursor-pointer data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-400"
            >
              <HugeiconsIcon icon={QrCodeIcon} size={16} strokeWidth={2} />
              <span>Smart Link &amp; Branded QR</span>
            </TabsTrigger>
          </TabsList>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <TabsContent value="share-card" className="mt-0 focus-visible:ring-0">
              <ShareCardGenerator event={eventForShare} />
            </TabsContent>

            <TabsContent value="smart-link-qr" className="mt-0 focus-visible:ring-0">
              <QRCodeGenerator eventId={eventForShare.id} eventName={eventForShare.name} />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
