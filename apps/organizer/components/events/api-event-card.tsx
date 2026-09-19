"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar03Icon,
  Location01Icon,
  Image01Icon,
  TicketIcon,
  MoreVerticalIcon,
} from "@hugeicons/core-free-icons"
import { Eye, Pencil, Share2, Rocket, Copy, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge, CategoryBadge, StatusBadge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDate, formatNumber, calculatePercentage } from "@/lib/utils"
import { cn } from "@workspace/ui/lib/utils"
import type { Event } from "@workspace/store/reducers/organizerEventsApi"
import { usePublishEventMutation } from "@workspace/store/reducers/organizerEventsApi"
import { toast } from "sonner"

interface ApiEventCardProps {
  event: Event
  index?: number
  onEdit?: (event: Event) => void
  onShare?: (event: Event) => void
  onDuplicate?: (event: Event) => void
  onDelete?: (event: Event) => void
}

// Helper to get cover image
function getCoverImage(event: Event): string {
  const coverMedia = event.event_media?.find(
    (media) => media.type?.toLowerCase() === "cover" || Number(media.position) === 0
  )
  return coverMedia?.file?.medium || coverMedia?.file?.url || coverMedia?.file_url || ""
}

export function ApiEventCard({
  event,
  index = 0,
  onEdit,
  onShare,
  onDuplicate,
  onDelete,
}: ApiEventCardProps) {
  const [publishEvent, { isLoading: isPublishing }] = usePublishEventMutation()
  const [isLocalPublishing, setIsLocalPublishing] = useState(false)

  const isDraft = event.status?.toLowerCase() === "draft"
  const isPublished = event.status?.toLowerCase() === "published"
  const isLive = event.status?.toLowerCase() === "live"

  // TODO: Replace with real ticket data from API when available
  const totalTickets = 0
  const soldTickets = 0
  const soldPercentage = totalTickets > 0 ? calculatePercentage(soldTickets, totalTickets) : 0

  const categories = event.categories?.map((cat) => cat.name) || []
  const coverImageUrl = getCoverImage(event)
  const primaryDate = event.event_dates?.[0]
  const venueLabel = primaryDate?.venue
    ? `${primaryDate.venue.name}${primaryDate.venue.city ? `, ${primaryDate.venue.city}` : ""}`
    : "TBD"
  const dateLabel = primaryDate?.starts_at
    ? formatDate(primaryDate.starts_at)
    : formatDate(event.created_at)

  // Parse start date for calendar chip
  const startDate = primaryDate?.starts_at ? new Date(primaryDate.starts_at) : null
  const monthStr =
    startDate && !isNaN(startDate.getTime())
      ? startDate.toLocaleDateString("en-US", { month: "short" }).toUpperCase()
      : null
  const dayStr =
    startDate && !isNaN(startDate.getTime())
      ? startDate.toLocaleDateString("en-US", { day: "numeric" })
      : null

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="h-full"
    >
      <Link href={`/organizer/events/${event.id}`} className="block h-full">
        <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card p-3.5 transition-all duration-300 hover:-translate-y-1 hover:border-lime-500/40 hover:shadow-xl hover:shadow-lime-500/5">
          {/* Banner Media */}
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-muted">
            {coverImageUrl ? (
              <img
                src={coverImageUrl}
                alt={event.title}
                className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-olive-100 to-olive-200 dark:from-olive-900/60 dark:to-olive-800/40">
                <HugeiconsIcon
                  icon={Image01Icon}
                  className="size-12 text-olive-400 dark:text-olive-600"
                />
              </div>
            )}

            {/* Subtle dark gradient overlay on image */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

            {/* Top-left: Date Chip & Status */}
            <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-2">
              {monthStr && dayStr ? (
                <div className="flex flex-col items-center justify-center rounded-lg bg-background/90 px-2 py-1 shadow-md backdrop-blur-md border border-white/20 dark:border-white/10">
                  <span className="text-[9px] font-black tracking-wider text-lime-600 dark:text-lime-400 leading-none">
                    {monthStr}
                  </span>
                  <span className="text-sm font-extrabold leading-tight text-foreground">
                    {dayStr}
                  </span>
                </div>
              ) : null}

              <StatusBadge
                status={event.status}
                className="shadow-md backdrop-blur-md"
              />
            </div>

            {/* Top-right: Floating Quick Action Pills */}
            <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
              {onShare && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onShare(event)
                  }}
                  className="flex size-9 items-center justify-center rounded-full bg-white/95 text-zinc-900 dark:bg-zinc-900/95 dark:text-white shadow-lg border border-black/10 dark:border-white/20 backdrop-blur-md transition-all duration-200 hover:scale-110 hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-95"
                  title="Share Event"
                >
                  <Share2 className="size-4 stroke-[2.2]" />
                </button>
              )}

              {onEdit && isDraft && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onEdit(event)
                  }}
                  className="flex size-9 items-center justify-center rounded-full bg-white/95 text-zinc-900 dark:bg-zinc-900/95 dark:text-white shadow-lg border border-black/10 dark:border-white/20 backdrop-blur-md transition-all duration-200 hover:scale-110 hover:text-lime-600 dark:hover:text-lime-400 active:scale-95"
                  title="Edit Event"
                >
                  <Pencil className="size-4 stroke-[2.2]" />
                </button>
              )}
            </div>
          </div>

          {/* Card Body */}
          <div className="flex flex-1 flex-col pt-3 space-y-2.5">
            {/* Dedicated Categories Row (Border-free Badge component with distinct colors) */}
            <div className="flex flex-wrap items-center gap-1.5 min-h-5">
              {categories.length > 0 ? (
                <>
                  {categories.slice(0, 3).map((category, idx) => (
                    <CategoryBadge
                      key={idx}
                      category={category}
                    />
                  ))}
                  {categories.length > 3 && (
                    <Badge
                      variant="secondary"
                      className="border-0 shadow-none text-[11px] h-5 px-2 font-medium"
                      title={categories.slice(3).join(", ")}
                    >
                      +{categories.length - 3}
                    </Badge>
                  )}
                </>
              ) : (
                <Badge
                  variant="outline"
                  className="border-0 shadow-none text-[11px] h-5 px-2 font-medium text-muted-foreground/60"
                >
                  General
                </Badge>
              )}
            </div>

            {/* Title & Description */}
            <div className="space-y-1">
              <h3 className="font-bold text-base text-foreground leading-snug tracking-tight line-clamp-1 group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">
                {event.title}
              </h3>
              <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed min-h-8">
                {event.description || "No description provided."}
              </p>
            </div>

            {/* Date & Location Meta */}
            <div className="space-y-1.5 pt-2 border-t border-border/40 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <HugeiconsIcon
                  icon={Calendar03Icon}
                  strokeWidth={2}
                  className="size-3.5 text-lime-600 dark:text-lime-400 shrink-0"
                />
                <span className="truncate font-medium text-foreground/80">{dateLabel}</span>
              </div>
              <div className="flex items-center gap-2">
                <HugeiconsIcon
                  icon={Location01Icon}
                  strokeWidth={2}
                  className="size-3.5 text-muted-foreground shrink-0"
                />
                <span className="truncate">{venueLabel}</span>
              </div>
            </div>

            {/* Card Footer */}
            <div className="mt-auto pt-3 border-t border-border/50 flex items-center justify-between gap-2">
              {/* Left: Tickets / Status Indicator */}
              {totalTickets > 0 ? (
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Sold</span>
                    <span className="font-semibold text-foreground">
                      {formatNumber(soldTickets)} / {formatNumber(totalTickets)}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-lime-500 transition-all duration-500"
                      style={{ width: `${soldPercentage}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <HugeiconsIcon
                    icon={TicketIcon}
                    strokeWidth={2}
                    className="size-3.5 text-muted-foreground/70"
                  />
                  <span className="text-[11px] font-medium">
                    {isDraft ? "Draft event" : "Public RSVP"}
                  </span>
                </div>
              )}

              {/* Right: Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                {isDraft && (
                  <Button
                    size="sm"
                    onClick={handlePublish}
                    disabled={isPublishing || isLocalPublishing}
                    className="h-8 px-3.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-600/25 hover:shadow-lg hover:shadow-emerald-600/35 active:scale-95 transition-all duration-200 rounded-xl gap-1.5 border border-emerald-400/25"
                  >
                    <Rocket
                      className={cn("size-3.5 text-white", (isPublishing || isLocalPublishing) && "animate-bounce")}
                    />
                    <span>{isPublishing || isLocalPublishing ? "Publishing..." : "Publish"}</span>
                  </Button>
                )}

                {onEdit && isDraft && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      onEdit(event)
                    }}
                    className="h-8 w-8 p-0 text-foreground/80 hover:text-foreground hover:border-lime-500/50 rounded-xl"
                    title="Edit Event"
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                )}

                {onShare && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      onShare(event)
                    }}
                    className="h-8 w-8 p-0 text-foreground/80 hover:text-foreground hover:border-indigo-500/50 rounded-xl"
                    title="Share Event"
                  >
                    <Share2 className="size-3.5" />
                  </Button>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground rounded-lg"
                      title="More options"
                    >
                      <HugeiconsIcon
                        icon={MoreVerticalIcon}
                        strokeWidth={2}
                        className="size-4"
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem asChild>
                      <Link href={`/organizer/events/${event.id}`} className="gap-2 cursor-pointer">
                        <Eye className="size-4" />
                        View details
                      </Link>
                    </DropdownMenuItem>
                    {onEdit && isDraft && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          onEdit(event)
                        }}
                        className="gap-2 cursor-pointer"
                      >
                        <Pencil className="size-4" />
                        Edit event
                      </DropdownMenuItem>
                    )}
                    {onShare && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          onShare(event)
                        }}
                        className="gap-2 cursor-pointer"
                      >
                        <Share2 className="size-4" />
                        Share event
                      </DropdownMenuItem>
                    )}
                    {(onDuplicate || onDelete) && <DropdownMenuSeparator />}
                    {onDuplicate && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          onDuplicate(event)
                        }}
                        className="gap-2 cursor-pointer"
                      >
                        <Copy className="size-4" />
                        Duplicate
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(event)
                        }}
                        className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
