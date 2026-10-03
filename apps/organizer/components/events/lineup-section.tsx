"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
} from "@hugeicons/core-free-icons"
import {
  useListEventParticipantsQuery,
  useCreateEventParticipantMutation,
  useDeleteEventParticipantMutation,
} from "@workspace/store/reducers/organizerEventsApi"
import { useListArtistsQuery } from "@workspace/store/reducers/artistsApi"

interface LineupSectionProps {
  eventId: string
  primaryDateId?: string
}

export function LineupSection({ eventId, primaryDateId }: LineupSectionProps) {
  const { data: participantsData, isLoading } = useListEventParticipantsQuery({ eventId })
  const { data: artistsData } = useListArtistsQuery({ per_page: 100 })
  const [createParticipant, { isLoading: isCreating }] = useCreateEventParticipantMutation()
  const [deleteParticipant] = useDeleteEventParticipantMutation()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState("")
  const [type, setType] = useState("performer")
  const [description, setDescription] = useState("")
  const [artistId, setArtistId] = useState("")

  const participants = participantsData?.data || []

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Please enter a performer or speaker name")
      return
    }

    try {
      await createParticipant({
        eventId,
        participant: {
          event_date_id: primaryDateId,
          name: name.trim(),
          type,
          description: description.trim() || undefined,
          artist_id: artistId || undefined,
          display_order: participants.length + 1,
        },
      }).unwrap()

      toast.success("Performer added to lineup")
      setName("")
      setDescription("")
      setArtistId("")
      setType("performer")
      setDialogOpen(false)
    } catch (err: any) {
      toast.error(err?.data?.message || err?.data?.error || "Failed to add performer")
    }
  }

  const handleDelete = async (participantId: string) => {
    try {
      await deleteParticipant({ eventId, participantId }).unwrap()
      toast.success("Performer removed from lineup")
    } catch (err: any) {
      toast.error(err?.data?.message || err?.data?.error || "Failed to remove performer")
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className="size-4 text-muted-foreground" />
            <span className="font-semibold text-sm">Lineup & Participants</span>
            <Badge variant="secondary" className="text-xs px-2 py-0">
              {participants.length}
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => setDialogOpen(true)}
          >
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-3.5" />
            Add Performer
          </Button>
        </CardHeader>
        <CardContent className="px-4 pb-3 pt-0">
          {isLoading ? (
            <p className="text-xs text-muted-foreground py-2">Loading lineup...</p>
          ) : participants.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">
              No performers or speakers added yet. Click &quot;Add Performer&quot; to build your lineup.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {participants.map((p, idx) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-border/60 bg-muted/20 text-xs"
                >
                  <span className="size-4 rounded-full bg-muted flex items-center justify-center font-bold text-[9px] text-muted-foreground">
                    {p.display_order ?? idx + 1}
                  </span>
                  <div>
                    <span className="font-semibold text-foreground">{p.name}</span>
                    <span className="text-[10px] text-muted-foreground ml-1.5 capitalize">
                      ({p.description || p.type})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors ml-1"
                    title="Remove"
                  >
                    <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleCreate} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Add Performer to Lineup</DialogTitle>
              <DialogDescription className="text-xs">
                Add an artist, speaker, DJ, or host participating in this event.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 pt-1">
              {artistsData?.data && artistsData.data.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Artist Directory (Optional)</Label>
                  <Select
                    value={artistId}
                    onValueChange={(val) => {
                      setArtistId(val)
                      const matched = artistsData.data.find((a) => a.id === val)
                      if (matched) {
                        setName(matched.name)
                        setDescription(matched.genres?.join(", ") || "")
                      }
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Pick registered artist..." />
                    </SelectTrigger>
                    <SelectContent>
                      {artistsData.data.map((art) => (
                        <SelectItem key={art.id} value={art.id} className="text-xs">
                          {art.name}{art.genres?.length ? ` (${art.genres.join(", ")})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Performer Name *</Label>
                <Input
                  placeholder="e.g. Teddy Afro, DJ Rophnan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Role *</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="performer">Performer / Artist</SelectItem>
                      <SelectItem value="speaker">Speaker / Keynote</SelectItem>
                      <SelectItem value="host">Host / MC</SelectItem>
                      <SelectItem value="panelist">Panelist</SelectItem>
                      <SelectItem value="instructor">Instructor</SelectItem>
                      <SelectItem value="guest">Special Guest</SelectItem>
                      <SelectItem value="team">Crew / Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Stage Note / Role</Label>
                  <Input
                    placeholder="e.g. Headliner, 10 PM Set"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
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
    </>
  )
}
