"use client"

import { useState, useEffect, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Edit01Icon,
  Calendar03Icon,
  Location01Icon,
  Image01Icon,
  Upload01Icon,
  GlobeIcon,
  LockIcon,
  Tick02Icon,
  InformationCircleIcon,
  Loading01Icon,
  AlertCircleIcon,
  Delete01Icon,
} from "@hugeicons/core-free-icons"
import {
  useUpdateEventMutation,
  useCreateEventMediaMutation,
  useUpdateEventMediaMutation,
  useListEventMediaQuery,
  useGetEventQuery,
  type Event as ApiEvent,
  type EventMedia,
} from "@workspace/store/reducers/organizerEventsApi"
import { useListPublicCategoriesQuery } from "@workspace/store/reducers/categoriesApi"
import { toast } from "sonner"
import { cn } from "@workspace/ui/lib/utils"
import { formatDateTime } from "@/lib/utils"

interface EditEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: ApiEvent | null
  onSuccess?: () => void
}

function findCoverFromList(list?: EventMedia[] | null): EventMedia | undefined {
  if (!list || !Array.isArray(list)) return undefined
  return (
    list.find((m) => m?.id && m.type?.toLowerCase() === "cover") ||
    list.find((m) => m?.id && Number(m.position) === 0) ||
    list.find((m) => m?.id && m.type?.toLowerCase() === "image") ||
    list.find((m) => m?.id)
  )
}

function getCoverImageUrl(event: ApiEvent | null | undefined): string {
  if (!event?.event_media) return ""
  const cover = findCoverFromList(event.event_media)
  return cover?.file?.medium || cover?.file?.url || cover?.file_url || ""
}

export function EditEventDialog({
  open,
  onOpenChange,
  event,
  onSuccess,
}: EditEventDialogProps) {
  const [updateEvent, { isLoading: isUpdatingEvent }] = useUpdateEventMutation()
  const [createEventMedia, { isLoading: isCreatingMedia }] = useCreateEventMediaMutation()
  const [updateEventMedia, { isLoading: isUpdatingMedia }] = useUpdateEventMediaMutation()
  
  const { data: freshEventData, refetch: refetchFullEvent } = useGetEventQuery(event?.id ?? "", {
    skip: !open || !event?.id,
  })
  const { data: mediaResponse, refetch: refetchMedia } = useListEventMediaQuery(event?.id ?? "", {
    skip: !open || !event?.id,
  })
  const { data: categoriesData, isLoading: isLoadingCategories } = useListPublicCategoriesQuery()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [slug, setSlug] = useState("")
  const [visibility, setVisibility] = useState<"public" | "private">("public")
  const [timezone, setTimezone] = useState("Africa/Addis_Ababa")
  const [currency, setCurrency] = useState("ETB")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  
  const [bannerPreview, setBannerPreview] = useState<string>("")
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [error, setError] = useState<string | null>(null)
  const isSubmitting = isUpdatingEvent || isCreatingMedia || isUpdatingMedia
  const isPublished = event?.status?.toLowerCase() === "published"

  // Populate form state whenever event changes or dialog opens
  useEffect(() => {
    if (open && event) {
      setTitle(event.title || "")
      setDescription(event.description || "")
      setSlug(typeof event.slug === "string" ? event.slug : "")
      setVisibility((event.visibility as "public" | "private") || "public")
      setTimezone(typeof event.timezone === "string" ? event.timezone : "Africa/Addis_Ababa")
      setCurrency(typeof event.currency === "string" ? event.currency : "ETB")
      
      const categoryIds = event.categories?.map((c) => c.id) || event.category_ids || []
      setSelectedCategories(categoryIds)
      
      const currentCover =
        getCoverImageUrl(freshEventData?.data) || getCoverImageUrl(event)
      setBannerPreview(currentCover)
      setBannerFile(null)
      setError(null)
    }
  }, [open, event, freshEventData])

  const categories = categoriesData?.data || []

  function toggleCategory(categoryId: string) {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file is too large (max 5MB)")
      return
    }
    
    setBannerFile(file)
    setBannerPreview(URL.createObjectURL(file))
  }

  function handleRemoveNewBanner() {
    setBannerFile(null)
    const currentCover =
      getCoverImageUrl(freshEventData?.data) || getCoverImageUrl(event)
    setBannerPreview(currentCover)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!event) return

    if (!title.trim()) {
      setError("Event title is required.")
      return
    }

    if (isPublished) {
      toast.error("Published events cannot be modified directly.")
      return
    }

    setError(null)

    try {
      // 1. Update event core attributes via PATCH /events/:id
      await updateEvent({
        id: event.id,
        body: {
          event: {
            title: title.trim(),
            description: description.trim() || undefined,
            slug: slug.trim() || undefined,
            visibility,
            timezone,
            currency,
            category_ids: selectedCategories,
          },
        },
      }).unwrap()

      // 2. If a new cover image was selected, update existing cover or create new one
      if (bannerFile) {
        const formData = new FormData()
        formData.append("event_media[type]", "cover")
        formData.append("event_media[position]", "0")
        formData.append("event_media[alt_text]", title.trim())
        formData.append("event_media[caption]", "")
        formData.append("file", bannerFile)

        // Attempt to find existing cover media across all sources
        const mediaList = Array.isArray(mediaResponse?.data)
          ? mediaResponse.data
          : (mediaResponse?.data as any)?.event_media || []
        
        let existingCover =
          findCoverFromList(mediaList) ||
          findCoverFromList(freshEventData?.data?.event_media) ||
          findCoverFromList(event.event_media)

        // If not found in local cache, actively refetch from server
        if (!existingCover?.id) {
          try {
            const freshMedia = await refetchMedia().unwrap()
            const freshList = Array.isArray(freshMedia?.data)
              ? freshMedia.data
              : (freshMedia?.data as any)?.event_media || []
            existingCover = findCoverFromList(freshList)
          } catch {
            // ignore
          }
        }

        if (!existingCover?.id) {
          try {
            const freshEvt = await refetchFullEvent().unwrap()
            existingCover = findCoverFromList(freshEvt?.data?.event_media)
          } catch {
            // ignore
          }
        }

        if (existingCover?.id) {
          // Found existing cover -> Update via PATCH /events/:eventId/event_media/:mediaId
          await updateEventMedia({
            eventId: event.id,
            mediaId: existingCover.id,
            formData,
          }).unwrap()
        } else {
          // No existing cover found anywhere -> Attempt create
          try {
            await createEventMedia({ eventId: event.id, formData }).unwrap()
          } catch (createErr: any) {
            const errDetail =
              createErr?.data?.errors?.type?.[0] ||
              createErr?.data?.error ||
              createErr?.data?.message ||
              ""
            
            // If backend rejects because "already has a cover", discover media ID and update
            if (
              errDetail.toLowerCase().includes("cover") ||
              errDetail.toLowerCase().includes("already")
            ) {
              const refetched = await refetchFullEvent().unwrap().catch(() => null)
              const refetchedCover = findCoverFromList(refetched?.data?.event_media)

              if (refetchedCover?.id) {
                await updateEventMedia({
                  eventId: event.id,
                  mediaId: refetchedCover.id,
                  formData,
                }).unwrap()
              } else {
                const refetchedMed = await refetchMedia().unwrap().catch(() => null)
                const refList = Array.isArray(refetchedMed?.data)
                  ? refetchedMed.data
                  : (refetchedMed?.data as any)?.event_media || []
                const found = findCoverFromList(refList)
                if (found?.id) {
                  await updateEventMedia({
                    eventId: event.id,
                    mediaId: found.id,
                    formData,
                  }).unwrap()
                } else {
                  throw createErr
                }
              }
            } else {
              throw createErr
            }
          }
        }
      }

      toast.success("Event updated successfully!")
      onOpenChange(false)
      onSuccess?.()
    } catch (err: any) {
      console.error("Failed to update event:", err)
      const message =
        err?.data?.message ||
        (err?.data?.errors && typeof err.data.errors === "object"
          ? Object.entries(err.data.errors)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
              .join("; ")
          : err?.message || "Failed to update event.")
      setError(message)
      toast.error(message)
    }
  }

  if (!event) return null

  const primaryDate = event.event_dates?.[0]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50 shrink-0">
          <div className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-lime-500/10 text-lime-600 dark:text-lime-400">
                <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">Edit Event</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Update event details, media, and categorization
                </DialogDescription>
              </div>
            </div>
            <Badge
              variant={
                event.status.toLowerCase() === "published"
                  ? "default"
                  : event.status.toLowerCase() === "live"
                  ? "success"
                  : "outline"
              }
              className="capitalize"
            >
              {event.status}
            </Badge>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
              <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {isPublished && (
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
              <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} className="size-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Event is published</p>
                <p className="mt-0.5 text-muted-foreground">
                  According to platform policy, published events cannot be edited directly to preserve attendee ticket agreements.
                </p>
              </div>
            </div>
          )}

          {/* Current Schedule Summary */}
          {primaryDate && (
            <div className="flex flex-wrap items-center gap-4 rounded-lg bg-muted/40 border border-border/50 px-3.5 py-2.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-4 text-lime-600 dark:text-lime-400" />
                <span>{formatDateTime(primaryDate.starts_at)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <HugeiconsIcon icon={Location01Icon} strokeWidth={2} className="size-4 text-muted-foreground" />
                <span>{primaryDate.venue?.name || "TBD"} - {primaryDate.venue?.city || "Addis Ababa"}</span>
              </div>
            </div>
          )}

          {/* Title Field */}
          <div className="space-y-1.5">
            <Label htmlFor="event-title" className="text-xs font-semibold">
              Event Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Summer Music Festival 2026"
              disabled={isPublished || isSubmitting}
              className="h-10"
              required
            />
          </div>

          {/* Description Field */}
          <div className="space-y-1.5">
            <Label htmlFor="event-description" className="text-xs font-semibold">
              Description
            </Label>
            <textarea
              id="event-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell attendees what your event is all about..."
              disabled={isPublished || isSubmitting}
              rows={4}
              className={cn(
                "flex min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm",
                "ring-offset-background placeholder:text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
            />
          </div>

          {/* Custom Slug & Visibility */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="event-slug" className="text-xs font-semibold">
                Event URL Slug
              </Label>
              <Input
                id="event-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="summer-festival-2026"
                disabled={isPublished || isSubmitting}
                className="h-10 font-mono text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="event-visibility" className="text-xs font-semibold">
                Visibility
              </Label>
              <Select
                value={visibility}
                onValueChange={(val: "public" | "private") => setVisibility(val)}
                disabled={isPublished || isSubmitting}
              >
                <SelectTrigger id="event-visibility" className="h-10">
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon icon={GlobeIcon} strokeWidth={2} className="size-4 text-emerald-500" />
                      <span>Public (Listed on platform)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="private">
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon icon={LockIcon} strokeWidth={2} className="size-4 text-amber-500" />
                      <span>Private (Invite or direct link only)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">
                Categories
              </Label>
              <span className="text-[11px] text-muted-foreground">
                {selectedCategories.length} selected
              </span>
            </div>
            {isLoadingCategories ? (
              <div className="h-12 flex items-center justify-center text-xs text-muted-foreground">
                <HugeiconsIcon icon={Loading01Icon} className="size-4 animate-spin mr-2" />
                Loading categories...
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-border/50 bg-muted/20">
                {categories.map((cat) => {
                  const isSelected = selectedCategories.includes(cat.id)
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => !isPublished && toggleCategory(cat.id)}
                      disabled={isPublished || isSubmitting}
                      className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                        isSelected
                          ? "bg-lime-500 text-white shadow-xs"
                          : "bg-background text-muted-foreground hover:bg-accent border border-border/60"
                      )}
                    >
                      {isSelected && <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.5} className="size-3" />}
                      {cat.name}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Banner / Cover Image */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Cover Banner Image</Label>
            
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              {bannerPreview ? (
                <div className="relative size-32 shrink-0 rounded-lg overflow-hidden border bg-muted group">
                  <img
                    src={bannerPreview}
                    alt={title || "Event Banner"}
                    className="h-full w-full object-cover"
                  />
                  {bannerFile && (
                    <button
                      type="button"
                      onClick={handleRemoveNewBanner}
                      className="absolute top-1 right-1 size-6 rounded-full bg-destructive text-white flex items-center justify-center shadow-md hover:bg-destructive/90"
                      title="Revert to current banner"
                    >
                      <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} className="size-3.5" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex size-32 shrink-0 items-center justify-center rounded-lg border border-dashed bg-muted/30 text-muted-foreground">
                  <HugeiconsIcon icon={Image01Icon} strokeWidth={1.5} className="size-8 text-muted-foreground/50" />
                </div>
              )}

              <div className="flex-1 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isPublished || isSubmitting}
                  className="hidden"
                  id="banner-file-input"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isPublished || isSubmitting}
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <HugeiconsIcon icon={Upload01Icon} strokeWidth={2} className="size-4" />
                  {bannerFile ? "Change Selected Image" : "Upload New Cover Image"}
                </Button>
                {bannerFile ? (
                  <p className="text-xs text-lime-600 dark:text-lime-400 font-medium truncate">
                    Ready to upload: {bannerFile.name} ({(bannerFile.size / 1024).toFixed(0)} KB)
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    Recommended: 16:9 ratio, JPG or PNG up to 5MB.
                  </p>
                )}
              </div>
            </div>
          </div>
        </form>

        <DialogFooter className="px-6 py-3 border-t border-border/50 bg-muted/10 shrink-0 gap-2">
          <DialogClose asChild>
            <Button type="button" variant="outline" size="sm" disabled={isSubmitting}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={isPublished || isSubmitting}
            className="gap-2 bg-lime-500 hover:bg-lime-600 text-white font-medium"
          >
            {isSubmitting ? (
              <>
                <HugeiconsIcon icon={Loading01Icon} className="size-4 animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="size-4" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
