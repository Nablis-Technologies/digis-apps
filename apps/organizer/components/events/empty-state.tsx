"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Calendar03Icon } from "@hugeicons/core-free-icons"

interface EmptyStateProps {
  hasFilters?: boolean
}

export function EmptyState({ hasFilters = false }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12"
    >
      <HugeiconsIcon
        icon={Calendar03Icon}
        strokeWidth={1.5}
        className="mb-4 size-12 text-muted-foreground"
      />
      <h3 className="mb-2 text-lg font-semibold">No events found</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        {hasFilters
          ? "Try adjusting your filters"
          : "Get started by creating your first event"}
      </p>
      {!hasFilters && (
        <Link href="/organizer/events/new">
          <Button className="gap-2">
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4" />
            Create Event
          </Button>
        </Link>
      )}
    </motion.div>
  )
}
