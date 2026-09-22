"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge, StatusBadge } from "@/components/ui/badge"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle01Icon,
  AlertCircleIcon,
  Loading03Icon,
} from "@hugeicons/core-free-icons"
import { useCompleteEventMutation } from "@workspace/store/reducers/organizerEventsApi"
import { cn } from "@workspace/ui/lib/utils"

interface EventDateItem {
  id?: string
  starts_at?: string
  ends_at?: string | null
  status?: string
}

interface CompleteEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  eventTitle: string
  eventStatus?: string
  eventDates?: EventDateItem[]
}

export function CompleteEventDialog({
  open,
  onOpenChange,
  eventId,
  eventTitle,
  eventStatus = "draft",
  eventDates = [],
}: CompleteEventDialogProps) {
  const [completeEvent, { isLoading }] = useCompleteEventMutation()

  const isPublished = eventStatus.toLowerCase() === "published"
  const now = new Date()

  // An event can only be completed if all its dates have finished (in the past) or are cancelled/completed
  const allDatesEnded =
    eventDates.length > 0 &&
    eventDates.every((d) => {
      if (d.status === "completed" || d.status === "cancelled") return true
      if (!d.ends_at) return false
      try {
        return new Date(d.ends_at) <= now
      } catch {
        return false
      }
    })

  const handleComplete = async () => {
    try {
      await completeEvent(eventId).unwrap()
      toast.success("Event completed successfully", {
        description: "Event has been marked complete and ticket revenue payout maturity has been initiated.",
      })
      onOpenChange(false)
    } catch (err: any) {
      toast.error("Failed to complete event", {
        description:
          err?.data?.error ||
          err?.data?.message ||
          err?.message ||
          "The event cannot be completed from its current state",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lime-500/15 text-lime-600 dark:bg-lime-500/20 dark:text-lime-400 border border-lime-500/20 shadow-xs">
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={22} strokeWidth={2} />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Complete Event</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Conclude operations and mature ticket revenue
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-3 text-sm">
          <div className="rounded-lg border bg-muted/30 p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Target Event</span>
              {isPublished ? (
                <Badge className="bg-chart-2/10 text-chart-2 dark:bg-chart-2/20 dark:text-chart-2 border-0 shadow-none text-[11px] font-semibold h-6 px-2.5 gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full shrink-0 bg-chart-2" />
                  <span>Published</span>
                </Badge>
              ) : (
                <StatusBadge status={eventStatus} />
              )}
            </div>
            <p className="font-semibold text-foreground">{eventTitle}</p>
          </div>

          {!isPublished && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 flex gap-3 text-destructive">
              <HugeiconsIcon icon={AlertCircleIcon} size={18} className="shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <p className="font-semibold mb-0.5">Event is in Draft</p>
                Only live, published events can be finalized. Please publish the event first to begin tracking tickets and attendance.
              </div>
            </div>
          )}

          {isPublished && !allDatesEnded && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 flex gap-3 text-amber-700 dark:text-amber-400">
              <HugeiconsIcon icon={AlertCircleIcon} size={18} className="shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed space-y-1">
                <p className="font-semibold">Event Sessions Ongoing</p>
                <p>
                  This event cannot be completed yet because one or more scheduled sessions are still active or set in the future.
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Events can only be finalized once all event dates have officially concluded, ensuring attendee admissions are finished and ticket revenue can be safely matured for payout.
                </p>
              </div>
            </div>
          )}

          <div className="rounded-lg border border-lime-500/25 bg-lime-500/5 p-3 flex gap-3 text-foreground">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} className="shrink-0 mt-0.5 text-lime-600 dark:text-lime-400" />
            <div className="text-xs leading-relaxed">
              <p className="font-semibold text-lime-700 dark:text-lime-300 mb-0.5">Payout Maturity</p>
              Finalizing this event closes gate check-ins and unlocks your ticket proceeds into your available ledger balance for payout withdrawal.
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleComplete}
            disabled={isLoading || !isPublished || !allDatesEnded}
            className={cn(
              "gap-2 font-medium transition-colors",
              isPublished && allDatesEnded && !isLoading
                ? "bg-lime-500 hover:bg-lime-600 text-zinc-950 font-bold dark:bg-lime-500 dark:text-zinc-950 dark:hover:bg-lime-400 border-0 shadow-xs"
                : ""
            )}
          >
            {isLoading ? (
              <>
                <HugeiconsIcon icon={Loading03Icon} size={16} className="animate-spin" />
                Completing...
              </>
            ) : (
              <>
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} />
                {!isPublished
                  ? "Publish Event First"
                  : !allDatesEnded
                  ? "Session Not Ended Yet"
                  : "Confirm Completion"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
