"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Calendar03Icon } from "@hugeicons/core-free-icons"

interface EmptyStateProps {
  hasFilters?: boolean
  onCreateEvent?: () => void
}

export function EmptyState({ hasFilters = false, onCreateEvent }: EmptyStateProps) {
  if (hasFilters) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-12 text-center bg-card/20"
      >
        <HugeiconsIcon
          icon={Calendar03Icon}
          strokeWidth={1.5}
          className="mb-4 size-12 text-muted-foreground"
        />
        <h3 className="mb-2 text-lg font-semibold">No events found</h3>
        <p className="text-sm text-muted-foreground">
          Try adjusting your search query or status filter.
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-12 text-center bg-card/40"
    >
      <div className="flex size-14 items-center justify-center rounded-2xl bg-chart-1/10 text-chart-1 mb-4 shadow-xs">
        <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-7" />
      </div>
      <h3 className="text-lg font-bold">Start Organizing Your First Event</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        Create a ticketed, RSVP, free, or invite-only event. Track ticket sales, attendees, and revenue directly from this dashboard.
      </p>
      {onCreateEvent ? (
        <Button size="lg" className="mt-6 gap-2" onClick={onCreateEvent}>
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4" />
          Create Your First Event
        </Button>
      ) : (
        <Link href="/organizer/events/new">
          <Button size="lg" className="mt-6 gap-2">
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4" />
            Create Your First Event
          </Button>
        </Link>
      )}
    </motion.div>
  )
}
