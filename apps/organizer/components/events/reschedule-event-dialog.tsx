"use client"

import { useState, useEffect } from "react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar03Icon,
  Clock01Icon,
  AlertCircleIcon,
  Loading03Icon,
} from "@hugeicons/core-free-icons"
import { useCreateEventScheduleChangeMutation } from "@workspace/store/reducers/organizerEventsApi"

interface EventDateItem {
  id: string
  name?: string | null
  starts_at: string
  ends_at?: string | null
}

interface RescheduleEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  eventTitle: string
  eventDates?: EventDateItem[]
}

export function RescheduleEventDialog({
  open,
  onOpenChange,
  eventId,
  eventTitle,
  eventDates = [],
}: RescheduleEventDialogProps) {
  const [selectedDateId, setSelectedDateId] = useState<string>("")
  const [newStartAt, setNewStartAt] = useState<string>("")
  const [newEndAt, setNewEndAt] = useState<string>("")
  const [changeType, setChangeType] = useState<"rescheduled" | "time_adjusted">("rescheduled")

  const [createScheduleChange, { isLoading }] = useCreateEventScheduleChangeMutation()

  useEffect(() => {
    if (eventDates.length > 0) {
      setSelectedDateId(eventDates[0]?.id ?? "")
      // Convert existing starts_at to datetime-local format YYYY-MM-DDTHH:mm
      if (eventDates[0]?.starts_at) {
        try {
          const d = new Date(eventDates[0].starts_at)
          setNewStartAt(d.toISOString().slice(0, 16))
        } catch {
          setNewStartAt("")
        }
      }
      if (eventDates[0]?.ends_at) {
        try {
          const d = new Date(eventDates[0].ends_at)
          setNewEndAt(d.toISOString().slice(0, 16))
        } catch {
          setNewEndAt("")
        }
      }
    }
  }, [eventDates, open])

  const handleDateSelectionChange = (dateId: string) => {
    setSelectedDateId(dateId)
    const found = eventDates.find((d) => d.id === dateId)
    if (found?.starts_at) {
      try {
        setNewStartAt(new Date(found.starts_at).toISOString().slice(0, 16))
      } catch {
        setNewStartAt("")
      }
    }
    if (found?.ends_at) {
      try {
        setNewEndAt(new Date(found.ends_at).toISOString().slice(0, 16))
      } catch {
        setNewEndAt("")
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedDateId) {
      toast.error("Please select an event date session to modify")
      return
    }

    if (!newStartAt) {
      toast.error("Please specify a new start date and time")
      return
    }

    if (!newEndAt) {
      toast.error("Please specify a new end date and time")
      return
    }

    const startDate = new Date(newStartAt)
    const endDate = new Date(newEndAt)

    if (endDate <= startDate) {
      toast.error("End date and time must be after the start date and time")
      return
    }

    try {
      await createScheduleChange({
        eventId,
        payload: {
          changes: [
            {
              event_date_id: selectedDateId,
              new_start_at: startDate.toISOString(),
              new_end_at: endDate.toISOString(),
              change_type: "reschedule",
            },
          ],
        },
      }).unwrap()

      toast.success("Schedule change announced successfully", {
        description: "Updated session timing and broadcast change to ticket holders.",
      })
      onOpenChange(false)
    } catch (err: any) {
      toast.error("Failed to reschedule event", {
        description: err?.data?.message || err?.data?.error || err?.message || "An unexpected error occurred",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <HugeiconsIcon icon={Calendar03Icon} size={20} strokeWidth={2} />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">Reschedule Event</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Update timings and broadcast changes to attendees
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4 text-sm">
            {eventDates.length > 1 && (
              <div className="space-y-1.5">
                <Label htmlFor="session-select" className="text-xs font-medium">
                  Select Session / Date
                </Label>
                <Select value={selectedDateId} onValueChange={handleDateSelectionChange}>
                  <SelectTrigger id="session-select" className="h-9 text-xs">
                    <SelectValue placeholder="Choose session" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventDates.map((d, index) => (
                      <SelectItem key={d.id} value={d.id} className="text-xs">
                        {d.name || `Session ${index + 1}`} ({new Date(d.starts_at).toLocaleDateString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="change-type" className="text-xs font-medium">
                Change Classification
              </Label>
              <Select
                value={changeType}
                onValueChange={(val: "rescheduled" | "time_adjusted") => setChangeType(val)}
              >
                <SelectTrigger id="change-type" className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rescheduled" className="text-xs">
                    Rescheduled (Different Date or Major Shift)
                  </SelectItem>
                  <SelectItem value="time_adjusted" className="text-xs">
                    Time Adjusted (Minor Hours/Doors Adjustment)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="new-start-at" className="text-xs font-medium">
                  New Start Date & Time
                </Label>
                <Input
                  id="new-start-at"
                  type="datetime-local"
                  value={newStartAt}
                  onChange={(e) => setNewStartAt(e.target.value)}
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="new-end-at" className="text-xs font-medium">
                  New End Date & Time <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="new-end-at"
                  type="datetime-local"
                  value={newEndAt}
                  onChange={(e) => setNewEndAt(e.target.value)}
                  required
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 flex gap-3 text-blue-700 dark:text-blue-400">
              <HugeiconsIcon icon={AlertCircleIcon} size={18} className="shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                Registered attendees and ticket holders will automatically receive schedule update notifications with revised ticket timestamps.
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
            <Button type="submit" disabled={isLoading} className="gap-2 font-medium">
              {isLoading ? (
                <>
                  <HugeiconsIcon icon={Loading03Icon} size={16} className="animate-spin" />
                  Broadcasting...
                </>
              ) : (
                <>
                  <HugeiconsIcon icon={Clock01Icon} size={16} />
                  Announce Schedule
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
