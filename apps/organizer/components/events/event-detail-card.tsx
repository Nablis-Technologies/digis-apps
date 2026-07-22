"use client"

import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar03Icon,
  Location01Icon,
  TicketIcon,
  Edit01Icon,
} from "@hugeicons/core-free-icons"
import { formatDate, formatNumber } from "@/lib/utils"
import type { Event } from "@/lib/types"

interface EventDetailCardProps {
  event: Event
}

export function EventDetailCard({ event }: EventDetailCardProps) {
  const totalTickets = event.tiers.reduce((sum, tier) => sum + tier.total, 0)
  const soldTickets = event.tiers.reduce((sum, tier) => sum + tier.sold, 0)

  const getStatusColor = (status: Event["status"]) => {
    switch (status) {
      case "Live":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
      case "Published":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
      case "Draft":
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex gap-4">
          {/* Event Thumbnail */}
          <div className="relative size-32 shrink-0 overflow-hidden rounded-lg bg-muted">
            <Image
              src={event.bannerUrl}
              alt={event.name}
              fill
              className="object-cover object-top"
              placeholder="empty"
            />
          </div>

          {/* Event Info */}
          <div className="flex flex-1 flex-col justify-between">
            <div>
              <div className="mb-2 flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">{event.name}</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {event.category}
                  </p>
                </div>
                <Badge className={getStatusColor(event.status)}>{event.status}</Badge>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-4" />
                  <span>{formatDate(event.startAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={Location01Icon} strokeWidth={2} className="size-4" />
                  <span>{event.venue}, {event.city}</span>
                </div>
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={TicketIcon} strokeWidth={2} className="size-4" />
                  <span>{formatNumber(soldTickets)} / {formatNumber(totalTickets)} sold</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex gap-2">
              <Button size="sm" className="gap-2">
                <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} className="size-4" />
                View event page
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <HugeiconsIcon icon={TicketIcon} strokeWidth={2} className="size-4" />
                Gift tickets
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
