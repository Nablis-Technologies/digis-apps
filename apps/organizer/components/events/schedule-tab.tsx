"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar03Icon,
  Clock01Icon,
  Location01Icon,
  UserGroupIcon,
  Ticket01Icon,
  CheckmarkCircle01Icon,
  Edit01Icon,
} from "@hugeicons/core-free-icons"
import { formatDate, formatDateTime, formatNumber } from "@/lib/utils"
import { useListEventDatesQuery, type EventDate } from "@workspace/store/reducers/organizerEventsApi"

interface ScheduleTabProps {
  eventId: string
  fallbackDates?: any[]
  eventStatus?: string
  onRescheduleSession?: (sessionDate?: any) => void
}

export function ScheduleTab({
  eventId,
  fallbackDates = [],
  eventStatus,
  onRescheduleSession,
}: ScheduleTabProps) {
  const { data: datesResponse, isLoading } = useListEventDatesQuery(eventId)
  const rawDates = (datesResponse as any)?.data
  const dates: EventDate[] = Array.isArray(rawDates) && rawDates.length > 0
    ? rawDates
    : (fallbackDates as EventDate[])

  // Calculate total venue limit & available seats
  const totalCapacity = dates.reduce((sum, d) => sum + (d.capacity?.limit || d.venue_capacity || 0), 0)
  const totalIssued = dates.reduce((sum, d) => sum + (d.capacity?.issued || (d as any).issued_venue_count || 0), 0)
  const totalAvailable = dates.reduce((sum, d) => sum + (d.capacity?.available ?? Math.max(0, (d.capacity?.limit || d.venue_capacity || 0) - (d.capacity?.issued || 0))), 0)

  const getStatusBadge = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "scheduled":
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">Scheduled</Badge>
      case "in_progress":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30">In Progress</Badge>
      case "completed":
        return <Badge variant="secondary">Completed</Badge>
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status || "Scheduled"}</Badge>
    }
  }

  if (isLoading && dates.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Top Session Metrics */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4 bg-card/60 backdrop-blur-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Configured Sessions</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold">{dates.length}</div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {dates.length === 1 ? "Single day event" : "Multi-date scheduled program"}
          </p>
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Venue Capacity</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
              <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className="size-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold">{formatNumber(totalCapacity)}</div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Allocated across all sessions
          </p>
        </Card>

        <Card className="p-4 bg-card/60 backdrop-blur-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Available Slots</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
              <HugeiconsIcon icon={Ticket01Icon} strokeWidth={2} className="size-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold">{formatNumber(totalAvailable)}</div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {totalIssued} seats currently issued
          </p>
        </Card>
      </div>

      {/* Main Schedule List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-bold">Event Sessions & Venue Schedule</CardTitle>
            <CardDescription className="text-xs">
              Manage event date intervals, door open times, venues, and capacity limits.
            </CardDescription>
          </div>
          {onRescheduleSession && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-8"
              onClick={() => onRescheduleSession()}
              disabled={eventStatus === "cancelled" || eventStatus === "completed"}
            >
              <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} className="size-3.5" />
              Reschedule Session
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {dates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <HugeiconsIcon icon={Calendar03Icon} className="size-6 text-muted-foreground" />
              </div>
              <h3 className="mt-3 text-base font-semibold">No Sessions Configured</h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                Add event dates and times to specify when your doors open and sessions take place.
              </p>
            </div>
          ) : (
            dates.map((date, idx) => {
              const capLimit = date.capacity?.limit || date.venue_capacity || 0
              const capIssued = date.capacity?.issued || (date as any).issued_venue_count || 0
              const capHeld = date.capacity?.held || (date as any).held_venue_count || 0
              const capAvailable = date.capacity?.available ?? Math.max(0, capLimit - capIssued - capHeld)
              const percentOccupied = capLimit > 0 ? Math.min(100, Math.round(((capIssued + capHeld) / capLimit) * 100)) : 0

              return (
                <div
                  key={date.id || idx}
                  className="rounded-xl border border-border/70 bg-muted/15 p-4 sm:p-5 transition-colors hover:border-border hover:bg-muted/25"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    {/* Left: Session name & timing */}
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-bold font-mono">
                          {idx + 1}
                        </span>
                        <h4 className="text-base font-bold text-foreground">
                          {date.name || `Session ${idx + 1}`}
                        </h4>
                        {getStatusBadge(date.status)}
                      </div>

                      {/* Timing breakdown */}
                      <div className="grid gap-2 sm:grid-cols-2 pt-1 text-xs">
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-background/80 border border-border/50">
                          <HugeiconsIcon icon={Calendar03Icon} className="size-4 text-primary shrink-0" />
                          <div>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Starts At</p>
                            <p className="font-semibold text-foreground">{formatDateTime(date.starts_at)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 p-2 rounded-lg bg-background/80 border border-border/50">
                          <HugeiconsIcon icon={Clock01Icon} className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <div>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Doors Open</p>
                            <p className="font-semibold text-foreground">
                              {date.doors_at ? formatDateTime(date.doors_at) : "Same as start time"}
                            </p>
                          </div>
                        </div>

                        {date.ends_at && (
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-background/80 border border-border/50 sm:col-span-2">
                            <HugeiconsIcon icon={Calendar03Icon} className="size-4 text-muted-foreground shrink-0" />
                            <div>
                              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Concludes</p>
                              <p className="font-semibold text-foreground">{formatDateTime(date.ends_at)}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Venue & Capacity Card */}
                    <div className="md:w-80 flex flex-col gap-3 rounded-xl border border-border/60 bg-background/90 p-3.5 shadow-2xs">
                      {date.venue ? (
                        <div className="flex items-start gap-2.5">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <HugeiconsIcon icon={Location01Icon} className="size-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-xs text-foreground truncate">{date.venue.name}</p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {date.venue.city || "Venue confirmed"}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <HugeiconsIcon icon={Location01Icon} className="size-4" />
                          <span>Venue not specified / Virtual event</span>
                        </div>
                      )}

                      {/* Capacity metrics bar */}
                      <div className="space-y-1.5 pt-1 border-t border-border/40">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground font-medium">Session Capacity</span>
                          <span className="font-mono font-semibold">{formatNumber(capLimit)} seats</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-300"
                            style={{ width: `${percentOccupied}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>{formatNumber(capAvailable)} Available</span>
                          <span>{formatNumber(capIssued)} Issued</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
