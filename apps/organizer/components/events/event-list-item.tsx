"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { HugeiconsIcon } from "@hugeicons/react"
import { Calendar03Icon, Location01Icon, TicketIcon } from "@hugeicons/core-free-icons"
import { formatDate, formatNumber, calculatePercentage } from "@/lib/utils"
import type { Event } from "@/lib/types"

interface EventListItemProps {
  event: Event
  index?: number
}

export function EventListItem({ event, index = 0 }: EventListItemProps) {
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
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link href={`/organizer/events/${event.id}`}>
        <div className="group flex gap-4 rounded-2xl border bg-card p-4 transition-all hover:shadow-lg">
          {/* Thumbnail */}
          <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-muted">
            <Image
              src={event.bannerUrl}
              alt={event.name}
              fill
              className="object-cover object-top"
              placeholder="empty"
            />
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col justify-between">
            <div>
              <div className="mb-1 flex items-start justify-between gap-2">
                <h3 className="font-semibold group-hover:text-primary">
                  {event.name}
                </h3>
                <Badge className={getStatusColor(event.status)}>
                  {event.status}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <HugeiconsIcon
                    icon={Calendar03Icon}
                    strokeWidth={2}
                    className="size-4"
                  />
                  <span>{formatDate(event.startAt)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <HugeiconsIcon
                    icon={Location01Icon}
                    strokeWidth={2}
                    className="size-4"
                  />
                  <span>
                    {event.venue}, {event.city}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <HugeiconsIcon
                    icon={TicketIcon}
                    strokeWidth={2}
                    className="size-4"
                  />
                  <span>
                    {formatNumber(soldTickets)} / {formatNumber(totalTickets)} sold
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-2">
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-lime-500 transition-all"
                  style={{ width: `${soldPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
