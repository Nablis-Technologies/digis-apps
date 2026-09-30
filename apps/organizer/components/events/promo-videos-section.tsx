"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
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
import { cn, normalizeYoutubeUrl, validateYoutubeUrl } from "@/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  PlayIcon,
  Add01Icon,
  Delete02Icon,
  CheckmarkCircle01Icon,
  Loading03Icon,
  GlobeIcon,
} from "@hugeicons/core-free-icons"
import {
  useListEventVideoLinksQuery,
  useCreateEventVideoLinkMutation,
  useDeleteEventVideoLinkMutation,
} from "@workspace/store/reducers/organizerEventsApi"

interface PromoVideosSectionProps {
  eventId: string
}

export function PromoVideosSection({ eventId }: PromoVideosSectionProps) {
  const { data: videosData, isLoading } = useListEventVideoLinksQuery({ eventId })
  const [createVideo, { isLoading: isCreating }] = useCreateEventVideoLinkMutation()
  const [deleteVideo] = useDeleteEventVideoLinkMutation()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [urlError, setUrlError] = useState("")

  const videos = videosData?.data || []

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedUrl = url.trim()
    if (!trimmedUrl) {
      setUrlError("Please enter a YouTube video URL")
      toast.error("Please enter a YouTube video URL")
      return
    }

    const check = validateYoutubeUrl(trimmedUrl)
    if (!check.valid) {
      setUrlError(check.error || "Please provide a valid YouTube link")
      toast.error(check.error || "Please provide a valid YouTube link (youtube.com or youtu.be)")
      return
    }

    setUrlError("")
    const cleanUrl = check.normalizedUrl || normalizeYoutubeUrl(trimmedUrl)

    try {
      await createVideo({
        eventId,
        videoLink: {
          title: title.trim() || "Event Video",
          url: cleanUrl,
          provider: "youtube",
        },
      }).unwrap()

      toast.success("Promo video added")
      setTitle("")
      setUrl("")
      setUrlError("")
      setDialogOpen(false)
    } catch (err: any) {
      const errDetail =
        err?.data?.errors?.url?.[0] ||
        err?.data?.error ||
        err?.data?.message ||
        "Failed to add promo video"
      setUrlError(errDetail)
      toast.error(errDetail)
    }
  }

  const handleDelete = async (videoId: string) => {
    try {
      await deleteVideo({ eventId, videoLinkId: videoId }).unwrap()
      toast.success("Promo video removed")
    } catch (err: any) {
      toast.error(err?.data?.message || err?.data?.error || "Failed to remove video")
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={PlayIcon} strokeWidth={2} className="size-4 text-muted-foreground" />
            <span className="font-semibold text-sm">Promo Videos</span>
            <Badge variant="secondary" className="text-xs px-2 py-0">
              {videos.length}
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => setDialogOpen(true)}
          >
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-3.5" />
            Add Video
          </Button>
        </CardHeader>
        <CardContent className="px-4 pb-3 pt-0">
          {isLoading ? (
            <p className="text-xs text-muted-foreground py-2">Loading videos...</p>
          ) : videos.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">
              No promo or teaser videos linked yet. Add a YouTube video to showcase your event.
            </p>
          ) : (
            <div className="space-y-2">
              {videos.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between gap-3 p-2 rounded-xl border border-border/60 bg-muted/20 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="size-8 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center shrink-0">
                      <HugeiconsIcon icon={PlayIcon} strokeWidth={2} className="size-4" />
                    </div>
                    <div className="truncate">
                      <p className="font-semibold text-foreground truncate">{v.title}</p>
                      <a
                        href={v.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 truncate"
                      >
                        <span className="truncate">{v.url}</span>
                        <HugeiconsIcon icon={GlobeIcon} className="size-2.5 shrink-0" />
                      </a>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(v.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors shrink-0 p-1"
                    title="Remove Video"
                  >
                    <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setUrlError("")
        }}
      >
        <DialogContent className="max-w-md">
          <form onSubmit={handleCreate} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Add YouTube Promo Video</DialogTitle>
              <DialogDescription className="text-xs">
                Link an official trailer, teaser, or aftermovie from YouTube.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 pt-1">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Video Title</Label>
                <Input
                  placeholder="e.g. Official Trailer 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">YouTube URL *</Label>
                <Input
                  placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value)
                    if (urlError) {
                      const c = validateYoutubeUrl(e.target.value)
                      if (c.valid || !e.target.value.trim()) setUrlError("")
                    }
                  }}
                  onBlur={() => {
                    const trimmed = url.trim()
                    if (trimmed) {
                      const c = validateYoutubeUrl(trimmed)
                      if (!c.valid) {
                        setUrlError(c.error || "Invalid YouTube link")
                      } else {
                        setUrlError("")
                        if (c.normalizedUrl && c.normalizedUrl !== url) {
                          setUrl(c.normalizedUrl)
                        }
                      }
                    } else {
                      setUrlError("")
                    }
                  }}
                  className={cn("h-9 text-xs", urlError && "border-destructive focus-visible:ring-destructive text-destructive")}
                />
                {urlError ? (
                  <p className="text-[11px] text-destructive font-medium mt-0.5">
                    {urlError}
                  </p>
                ) : (
                  <p className="text-[10px] text-muted-foreground">
                    Standard YouTube watch link, shorts, or youtu.be shortlink.
                  </p>
                )}
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
                    Add Video
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
