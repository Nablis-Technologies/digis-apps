"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { Calendar03Icon, Location01Icon, Image01Icon, Rocket01Icon } from "@hugeicons/core-free-icons"
import { formatDate, formatNumber, calculatePercentage } from "@/lib/utils"
import type { Event } from "@workspace/store/reducers/organizerEventsApi"
import { usePublishEventMutation } from "@workspace/store/reducers/organizerEventsApi"
import { toast } from "sonner"
import { useState } from "react"

interface ApiEventCardProps {
  event: Event
  index?: number
}

// Helper to get cover image
function getCoverImage(event: Event): string {
  const coverMedia = event.event_media?.find(media => media.type === "cover")
  return coverMedia?.file?.medium || coverMedia?.file?.url || ""
}

export function ApiEventCard({ event, index = 0 }: ApiEventCardProps) {
  const [publishEvent, { isLoading: isPublishing }] = usePublishEventMutation()
  const [isLocalPublishing, setIsLocalPublishing] = useState(false)
  
  // TODO: Replace with real ticket data from API when available
  const totalTickets = 0
  const soldTickets = 0
  const soldPercentage = totalTickets > 0 ? calculatePercentage(soldTickets, totalTickets) : 0

  const categories = event.categories?.map(cat => cat.name) || []
  const coverImageUrl = getCoverImage(event)
  const primaryDate = event.event_dates?.[0]
  const venueLabel = primaryDate?.venue
    ? `${primaryDate.venue.name}${primaryDate.venue.city ? `, ${primaryDate.venue.city}` : ""}`
    : "TBD"
  const dateLabel = primaryDate?.starts_at ? formatDate(primaryDate.starts_at) : formatDate(event.created_at)

  const handlePublish = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setIsLocalPublishing(true)
    try {
      await publishEvent({
        id: event.id,
        idempotencyKey: `event-publish-${event.id}-${Date.now()}`,
      }).unwrap()
      
      toast.success("Event published successfully!")
    } catch (err: any) {
      const errorMessage = err?.data?.message || err?.message || "Failed to publish event"
      toast.error(errorMessage)
      console.error("Publish error:", err)
    } finally {
      setIsLocalPublishing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "live":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
      case "published":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
      case "draft":
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  type BadgeVariant =
    | "default"
    | "secondary"
    | "destructive"
    | "success"
    | "warning"
    | "info"
    | "violet"
    | "pink"
    | "orange"
    | "outline"

  const getCategoryVariant = (category: string): BadgeVariant => {
    const variants: BadgeVariant[] = [
      "violet",
      "pink",
      "orange",
      "info",
      "success",
      "warning",
    ]
    const hash = category
      .split("")
      .reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
    return variants[hash % variants.length]
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link href={`/organizer/events/${event.id}`}>
        <div className="group overflow-hidden rounded-2xl border bg-card transition-all hover:shadow-lg">
          {/* Banner Image */}
          <div className="relative aspect-video overflow-hidden bg-muted">
            {coverImageUrl ? (
              <img
                src={coverImageUrl}
                alt={event.title}
                className="h-full w-full object-cover object-center transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-olive-100 to-olive-200 dark:from-olive-900 dark:to-olive-800">
                <HugeiconsIcon icon={Image01Icon} className="size-16 text-olive-400 dark:text-olive-600" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
            <div className="absolute right-2 top-2">
              <Badge className={getStatusColor(event.status)}>
                {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
              </Badge>
            </div>
            
            {/* Publish Button Overlay for Draft Events */}
            {event.status.toLowerCase() === "draft" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  size="lg"
                  onClick={handlePublish}
                  disabled={isPublishing || isLocalPublishing}
                  className="gap-2 bg-gradient-to-r from-emerald-500 to-lime-500 font-bold text-white shadow-xl hover:from-emerald-600 hover:to-lime-600"
                >
                  <HugeiconsIcon icon={Rocket01Icon} strokeWidth={2} className="size-5" />
                  {isPublishing || isLocalPublishing ? "Publishing..." : "Publish Now"}
                </Button>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="mb-2 flex items-start justify-between gap-2">
              <h3 className="flex-1 font-semibold group-hover:text-primary">
                {event.title}
              </h3>
              <div className="flex flex-wrap gap-1">
                {categories.length > 0 ? (
                  categories.slice(0, 2).map((category, idx) => (
                    <Badge 
                      key={idx}
                      variant={getCategoryVariant(category)} 
                      className="shrink-0 border border-current/20 text-xs"
                    >
                      {category}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="outline" className="shrink-0 border border-current/20 text-xs">
                    Uncategorized
                  </Badge>
                )}
                {categories.length > 2 && (
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    +{categories.length - 2}
                  </Badge>
                )}
              </div>
            </div>

            {event.description && (
              <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                {event.description}
              </p>
            )}

            <div className="mb-3 space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <HugeiconsIcon
                  icon={Calendar03Icon}
                  strokeWidth={2}
                  className="size-4"
                />
                <span>{dateLabel}</span>
              </div>
              <div className="flex items-center gap-2">
                <HugeiconsIcon
                  icon={Location01Icon}
                  strokeWidth={2}
                  className="size-4"
                />
                <span>{venueLabel}</span>
              </div>
            </div>



            {/* Progress */}
            {totalTickets > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tickets Sold</span>
                  <span className="font-medium">
                    {formatNumber(soldTickets)} / {formatNumber(totalTickets)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-lime-500 transition-all"
                    style={{ width: `${soldPercentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {soldPercentage}% capacity
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-3 text-center">
                <p className="text-xs text-muted-foreground">
                  No tickets created yet
                </p>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
