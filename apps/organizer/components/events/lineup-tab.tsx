"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  UserGroupIcon,
  Add01Icon,
  Delete02Icon,
  CheckmarkCircle01Icon,
  Loading03Icon,
  Calendar03Icon,
  PresentationPodiumIcon,
} from "@hugeicons/core-free-icons"
import {
  useListEventParticipantsQuery,
  useCreateEventParticipantMutation,
  useDeleteEventParticipantMutation,
  type EventParticipant,
} from "@workspace/store/reducers/organizerEventsApi"
import { useListPublicArtistsQuery } from "@workspace/store/reducers/artistsApi"
import { formatDate } from "@/lib/utils"

interface LineupTabProps {
  eventId: string
  eventDates?: any[]
}

const PARTICIPANT_TYPES = [
  { value: "performer", label: "Performer / Artist", badge: "default" },
  { value: "speaker", label: "Keynote Speaker", badge: "secondary" },
  { value: "host", label: "Host / MC", badge: "outline" },
  { value: "panelist", label: "Panelist", badge: "secondary" },
  { value: "instructor", label: "Instructor / Trainer", badge: "outline" },
  { value: "guest", label: "Special Guest", badge: "default" },
  { value: "team", label: "Crew / Team", badge: "outline" },
]

export function LineupTab({ eventId, eventDates = [] }: LineupTabProps) {
  const { data: participantsData, isLoading } = useListEventParticipantsQuery({ eventId })
  const { data: artistsData } = useListPublicArtistsQuery({ per_page: 100 })
  const [createParticipant, { isLoading: isCreating }] = useCreateEventParticipantMutation()
  const [deleteParticipant] = useDeleteEventParticipantMutation()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [filterType, setFilterType] = useState<string>("all")

  // Form State
  const [name, setName] = useState("")
  const [type, setType] = useState("performer")
  const [description, setDescription] = useState("")
  const [artistId, setArtistId] = useState("")
  const [eventDateId, setEventDateId] = useState(eventDates[0]?.id || "")

  // Keep eventDateId in sync when eventDates load
  useEffect(() => {
    if (eventDates.length > 0 && !eventDateId) {
      setEventDateId(eventDates[0]?.id || "")
    }
  }, [eventDates, eventDateId])

  const handleOpenDialog = () => {
    if (eventDates.length > 0 && !eventDateId) {
      setEventDateId(eventDates[0]?.id || "")
    }
    setDialogOpen(true)
  }

  const participants: EventParticipant[] = participantsData?.data || []
  const artists = artistsData?.data || []

  const filteredParticipants = filterType === "all"
    ? participants
    : participants.filter((p) => p.type?.toLowerCase() === filterType.toLowerCase())

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Please enter a participant or artist name")
      return
    }

    try {
      await createParticipant({
        eventId,
        participant: {
          event_date_id: eventDateId || undefined,
          name: name.trim(),
          type,
          description: description.trim() || undefined,
          artist_id: artistId || undefined,
          display_order: participants.length + 1,
        },
      }).unwrap()

      toast.success("Added to event lineup")
      setName("")
      setDescription("")
      setArtistId("")
      setType("performer")
      setEventDateId(eventDates[0]?.id || "")
      setDialogOpen(false)
    } catch (err: any) {
      toast.error(err?.data?.message || err?.data?.error || "Failed to add participant")
    }
  }

  const handleDelete = async (participantId: string) => {
    try {
      await deleteParticipant({ eventId, participantId }).unwrap()
      toast.success("Removed from lineup")
    } catch (err: any) {
      toast.error(err?.data?.message || err?.data?.error || "Failed to remove participant")
    }
  }

  const getRoleBadgeVariant = (roleType?: string) => {
    switch (roleType?.toLowerCase()) {
      case "performer":
        return "bg-primary/10 text-primary border-primary/20"
      case "speaker":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
      case "host":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Top Header & Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Performers, Speakers & Lineup
          </h2>
          <p className="text-xs text-muted-foreground">
            Feature headliners, keynote speakers, artists, and guests appearing on your stage.
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5 text-xs h-9 shadow-xs"
          onClick={handleOpenDialog}
        >
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4" />
          Add Performer / Speaker
        </Button>
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <Button
          variant={filterType === "all" ? "default" : "outline"}
          size="sm"
          className="h-8 text-xs rounded-full px-3"
          onClick={() => setFilterType("all")}
        >
          All ({participants.length})
        </Button>
        {PARTICIPANT_TYPES.map((t) => {
          const count = participants.filter((p) => p.type?.toLowerCase() === t.value.toLowerCase()).length
          if (count === 0 && filterType !== t.value) return null
          return (
            <Button
              key={t.value}
              variant={filterType === t.value ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs rounded-full px-3 capitalize"
              onClick={() => setFilterType(t.value)}
            >
              {t.label.split(" ")[0]} ({count})
            </Button>
          )
        })}
      </div>

      {/* Participant Grid */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredParticipants.length === 0 ? (
        <Card className="py-12 text-center">
          <div className="flex size-12 mx-auto items-center justify-center rounded-full bg-muted">
            <HugeiconsIcon icon={PresentationPodiumIcon} className="size-6 text-muted-foreground" />
          </div>
          <h3 className="mt-3 text-base font-semibold">No Lineup Configured</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
            {filterType === "all"
              ? "Add headliners, performers, speakers, or panelists to announce your talent roster."
              : `No participants found in the "${filterType}" category.`}
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-4 gap-1.5 text-xs"
            onClick={handleOpenDialog}
          >
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-3.5" />
            Add First Performer
          </Button>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredParticipants.map((p, idx) => {
            const assignedDate = eventDates.find((d) => d.id === p.event_date_id)
            const linkedArtist = artists.find((a: any) => a.id === p.artist_id)
            const bioText = p.description || (linkedArtist?.genres?.length ? linkedArtist.genres.join(", ") : "")
            return (
              <Card
                key={p.id || idx}
                className="overflow-hidden border border-border/70 hover:border-border transition-all bg-card/80 backdrop-blur-xs flex flex-col justify-between"
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar Monogram */}
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 text-primary font-bold text-sm border border-primary/20 shadow-2xs">
                        {(p.name?.slice(0, 2) || "AR").toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-sm text-foreground truncate">{p.name}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant="outline" className={`text-[10px] capitalize px-1.5 py-0 ${getRoleBadgeVariant(p.type)}`}>
                            {p.type?.replace("_", " ")}
                          </Badge>
                          {p.display_order && (
                            <span className="text-[10px] font-mono text-muted-foreground">
                              #{p.display_order}
                            </span>
                          )}
                          {linkedArtist?.verified && (
                            <span className="text-[10px] text-primary font-semibold">✓</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => handleDelete(p.id)}
                      title="Remove participant"
                    >
                      <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-3.5" />
                    </Button>
                  </div>

                  {bioText && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {bioText}
                    </p>
                  )}

                  {assignedDate && (
                    <div className="flex items-center gap-1.5 pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
                      <HugeiconsIcon icon={Calendar03Icon} className="size-3 text-primary shrink-0" />
                      <span className="truncate">
                        Appearing: {assignedDate.name || "Main Session"}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add Participant Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleCreate} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Add Performer / Speaker</DialogTitle>
              <DialogDescription className="text-xs">
                Add an artist, speaker, host, or panelist to your event program.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 pt-1">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Role / Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {PARTICIPANT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value} className="text-xs">
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Artist / Performer Name *</Label>
                <Input
                  placeholder="e.g. Teddy Afro, Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              {artists.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Link Master Artist Record (Optional)</Label>
                  <Select value={artistId} onValueChange={(val) => {
                    setArtistId(val)
                    const found = artists.find((a: any) => a.id === val)
                    if (found && !name) setName(found.name)
                  }}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Choose from registered artists" />
                    </SelectTrigger>
                    <SelectContent>
                      {artists.map((a: any) => (
                        <SelectItem key={a.id} value={a.id} className="text-xs">
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {eventDates.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Appearing Session Date</Label>
                  <Select value={eventDateId} onValueChange={setEventDateId}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Select session" />
                    </SelectTrigger>
                    <SelectContent>
                      {eventDates.map((d: any) => (
                        <SelectItem key={d.id} value={d.id} className="text-xs">
                          {d.name || "Main Session"} ({formatDate(d.starts_at)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Bio / Genre / Highlights</Label>
                <Input
                  placeholder="e.g. ethio-pop, Grammy Nominee, Keynote on AI"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isCreating} className="gap-1.5">
                {isCreating ? (
                  <>
                    <HugeiconsIcon icon={Loading03Icon} className="size-3.5 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-3.5" />
                    Add to Lineup
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
