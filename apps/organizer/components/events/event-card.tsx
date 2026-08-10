"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { HugeiconsIcon } from "@hugeicons/react"
import { Calendar03Icon, Location01Icon } from "@hugeicons/core-free-icons"
import { formatDate, formatNumber, calculatePercentage } from "@/lib/utils"
import type { Event } from "@/lib/types"

interface EventCardProps {
  event: Event
  index?: number
}

export function EventCard({ event, index = 0 }: EventCardProps) {
  const totalTickets = event.tiers.reduce((sum, tier) => sum + tier.total, 0)
  const soldTickets = event.tiers.reduce((sum, tier) => sum + tier.sold, 0)
  const soldPercentage = calculatePercentage(soldTickets, totalTickets)

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link href={`/organizer/events/${event.id}`}>
        <div className="group overflow-hidden rounded-2xl border bg-card transition-all hover:shadow-lg">
          {/* Banner Image */}
          <div className="relative aspect-video overflow-hidden bg-muted">
            <Image
              src={event.bannerUrl}
              alt={event.name}
              fill
              className="object-cover object-top transition-transform group-hover:scale-105"
              placeholder="empty"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
            <div className="absolute right-2 top-2">
              <Badge className={getStatusColor(event.status)}>
                {event.status}
              </Badge>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="mb-2 font-semibold group-hover:text-primary">
              {event.name}
            </h3>

            <div className="mb-3 space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <HugeiconsIcon
                  icon={Calendar03Icon}
                  strokeWidth={2}
                  className="size-4"
                />
                <span>{formatDate(event.startAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <HugeiconsIcon
                  icon={Location01Icon}
                  strokeWidth={2}
                  className="size-4"
                />
                <span>
                  {event.venue}, {event.city}
                </span>
              </div>
            </div>

            {/* Progress */}
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
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
