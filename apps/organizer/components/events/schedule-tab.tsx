"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar03Icon,
  Clock01Icon,
  Location01Icon,
  UserGroupIcon,
  Ticket01Icon,
  CheckmarkCircle01Icon,
  Edit01Icon,
  Add01Icon,
  Delete02Icon,
  Loading03Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons"
import { formatDateTime, formatNumber, formatApiErrorMessage } from "@/lib/utils"
import {
  useListEventDatesQuery,
  useCreateEventDateMutation,
  useUpdateEventDateMutation,
  useDeleteEventDateMutation,
  type EventDate,
} from "@workspace/store/reducers/organizerEventsApi"

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

  // RTK Query Mutations
  const [createEventDate, { isLoading: isCreating }] = useCreateEventDateMutation()
  const [updateEventDate, { isLoading: isUpdating }] = useUpdateEventDateMutation()
  const [deleteEventDate, { isLoading: isDeleting }] = useDeleteEventDateMutation()

  // Modal States
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addName, setAddName] = useState("")
  const [addStartsAt, setAddStartsAt] = useState("")
  const [addDoorsAt, setAddDoorsAt] = useState("")
  const [addEndsAt, setAddEndsAt] = useState("")
  const [addCapacity, setAddCapacity] = useState("")

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingDate, setEditingDate] = useState<EventDate | null>(null)
  const [editName, setEditName] = useState("")

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deletingDate, setDeletingDate] = useState<EventDate | null>(null)

  const isEventReadOnly = eventStatus === "cancelled" || eventStatus === "completed"

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

  const handleOpenAdd = () => {
    setAddName("")
    setAddStartsAt("")
    setAddDoorsAt("")
    setAddEndsAt("")
    setAddCapacity("")
    setIsAddOpen(true)
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addStartsAt) {
      toast.error("Start time is required")
      return
    }

    if (!addEndsAt) {
      toast.error("End time is required")
      return
    }

    const startDate = new Date(addStartsAt)
    const endDate = new Date(addEndsAt)

    if (endDate <= startDate) {
      toast.error("Ends at must be after starts_at")
      return
    }

    if (addDoorsAt) {
      const doorsDate = new Date(addDoorsAt)
      if (doorsDate > startDate) {
        toast.error("Doors open must be at or before starts_at")
        return
      }
    }

    try {
      const payload: Partial<EventDate> = {
        name: addName.trim() || undefined,
        starts_at: startDate.toISOString(),
        doors_at: addDoorsAt ? new Date(addDoorsAt).toISOString() : undefined,
        ends_at: endDate.toISOString(),
        venue_capacity: addCapacity ? parseInt(addCapacity, 10) : undefined,
        timezone: "Africa/Addis_Ababa",
      }

      await createEventDate({ eventId, date: payload }).unwrap()
      toast.success("Event session added successfully")
      setIsAddOpen(false)
    } catch (err: any) {
      toast.error("Failed to add session", {
        description: formatApiErrorMessage(err),
      })
    }
  }

  const handleOpenEdit = (date: EventDate) => {
    setEditingDate(date)
    setEditName(date.name || "")
    setIsEditOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDate) return

    try {
      await updateEventDate({
        eventId,
        dateId: editingDate.id,
        date: { name: editName.trim() || undefined },
      }).unwrap()
      toast.success("Session updated successfully")
      setIsEditOpen(false)
    } catch (err: any) {
      toast.error("Failed to update session", {
        description: formatApiErrorMessage(err),
      })
    }
  }

  const handleOpenDelete = (date: EventDate) => {
    setDeletingDate(date)
    setIsDeleteOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingDate) return

    try {
      await deleteEventDate({ eventId, dateId: deletingDate.id }).unwrap()
      toast.success("Session deleted successfully")
      setIsDeleteOpen(false)
    } catch (err: any) {
      toast.error("Failed to delete session", {
        description: formatApiErrorMessage(err),
      })
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
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
          <div>
            <CardTitle className="text-base font-bold">Event Sessions & Venue Schedule</CardTitle>
            <CardDescription className="text-xs">
              Manage event date intervals, door open times, venues, and capacity limits.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              className="gap-1.5 text-xs h-8"
              onClick={handleOpenAdd}
              disabled={isEventReadOnly}
            >
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-3.5" />
              Add Session
            </Button>
            {onRescheduleSession && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-8"
                onClick={() => onRescheduleSession()}
                disabled={isEventReadOnly}
              >
                <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-3.5" />
                Reschedule Session
              </Button>
            )}
          </div>
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
              <Button
                size="sm"
                className="mt-4 gap-1.5 text-xs"
                onClick={handleOpenAdd}
                disabled={isEventReadOnly}
              >
                <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-3.5" />
                Add First Session
              </Button>
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

                      {/* Action buttons on session */}
                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => handleOpenEdit(date)}
                          disabled={isEventReadOnly}
                        >
                          <HugeiconsIcon icon={Edit01Icon} className="size-3" />
                          Edit Name
                        </Button>
                        {onRescheduleSession && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1"
                            onClick={() => onRescheduleSession(date)}
                            disabled={isEventReadOnly}
                          >
                            <HugeiconsIcon icon={Clock01Icon} className="size-3" />
                            Reschedule Times
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleOpenDelete(date)}
                          disabled={isEventReadOnly || dates.length <= 1}
                          title={dates.length <= 1 ? "At least one session is required" : "Delete session"}
                        >
                          <HugeiconsIcon icon={Delete02Icon} className="size-3" />
                          Delete
                        </Button>
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

      {/* Add Session Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Event Session</DialogTitle>
            <DialogDescription>
              Add a new date and schedule interval for your event.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="session-name">Session Name (Optional)</Label>
              <Input
                id="session-name"
                placeholder="e.g. Day 2 - Evening Concert"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="session-starts-at">Starts At *</Label>
              <Input
                id="session-starts-at"
                type="datetime-local"
                required
                value={addStartsAt}
                onChange={(e) => setAddStartsAt(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="session-doors-at">Doors Open (Optional)</Label>
                <Input
                  id="session-doors-at"
                  type="datetime-local"
                  value={addDoorsAt}
                  onChange={(e) => setAddDoorsAt(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="session-ends-at">Ends At *</Label>
                  {addStartsAt && addEndsAt && new Date(addEndsAt) <= new Date(addStartsAt) && (
                    <span className="text-[10px] text-destructive font-medium">Must be after starts_at</span>
                  )}
                </div>
                <Input
                  id="session-ends-at"
                  type="datetime-local"
                  required
                  min={addStartsAt || undefined}
                  value={addEndsAt}
                  onChange={(e) => setAddEndsAt(e.target.value)}
                  className={addStartsAt && addEndsAt && new Date(addEndsAt) <= new Date(addStartsAt) ? "border-destructive focus-visible:ring-destructive" : ""}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="session-capacity">Venue Capacity (Optional)</Label>
              <Input
                id="session-capacity"
                type="number"
                min="1"
                placeholder="e.g. 500"
                value={addCapacity}
                onChange={(e) => setAddCapacity(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating} className="gap-1.5">
                {isCreating && (
                  <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" />
                )}
                Add Session
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Session Name Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Session Name</DialogTitle>
            <DialogDescription>
              Update the label or description for this session.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-session-name">Session Name</Label>
              <Input
                id="edit-session-name"
                placeholder="e.g. VIP Day 1 Preview"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground flex items-start gap-2">
              <HugeiconsIcon icon={AlertCircleIcon} className="size-4 text-primary shrink-0 mt-0.5" />
              <span>
                To change session start or end dates and notify registered attendees, use the <strong>Reschedule Session</strong> action.
              </span>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating} className="gap-1.5">
                {isUpdating && (
                  <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Session Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <HugeiconsIcon icon={AlertCircleIcon} className="size-5" />
              Delete Session
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete session &quot;{deletingDate?.name || "Selected Session"}&quot;?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="gap-1.5"
            >
              {isDeleting && (
                <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" />
              )}
              Delete Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

