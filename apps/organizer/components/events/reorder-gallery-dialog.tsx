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
import { Badge } from "@/components/ui/badge"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Image01Icon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  CheckmarkCircle01Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons"
import {
  useReorderEventMediaMutation,
  type EventMedia,
} from "@workspace/store/reducers/organizerEventsApi"

interface ReorderGalleryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  mediaItems: EventMedia[]
}

export function ReorderGalleryDialog({
  open,
  onOpenChange,
  eventId,
  mediaItems,
}: ReorderGalleryDialogProps) {
  const [items, setItems] = useState<EventMedia[]>([])
  const [reorderEventMedia, { isLoading }] = useReorderEventMediaMutation()

  useEffect(() => {
    if (open) {
      setItems([...mediaItems].sort((a, b) => a.position - b.position))
    }
  }, [open, mediaItems])

  const moveItem = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= items.length) return

    const newItems = [...items]
    const [moved] = newItems.splice(index, 1)
    newItems.splice(targetIndex, 0, moved)
    setItems(newItems)
  }

  const handleSave = async () => {
    const orderedIds = items.map((m) => m.id)
    try {
      await reorderEventMedia({
        eventId,
        orderedIds,
      }).unwrap()
      toast.success("Gallery photos reordered successfully")
      onOpenChange(false)
    } catch (err: any) {
      const msg = err?.data?.message || err?.data?.error || "Failed to reorder gallery photos"
      toast.error(msg)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <HugeiconsIcon icon={Image01Icon} strokeWidth={2} className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Reorder Gallery Photos</DialogTitle>
              <DialogDescription className="text-xs">
                Change the sequence of photos displayed on your event page.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 py-1">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 p-2 rounded-xl border border-border/60 bg-muted/20 text-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="size-5 rounded-full bg-muted flex items-center justify-center font-bold text-[10px] text-muted-foreground shrink-0">
                  {index + 1}
                </span>
                <div className="size-10 rounded-lg overflow-hidden border bg-muted shrink-0">
                  <img
                    src={item.file?.thumbnail || item.file?.url || item.file_url || ""}
                    alt={item.caption || item.alt_text || `Photo ${index + 1}`}
                    className="size-full object-cover"
                  />
                </div>
                <div className="truncate">
                  <p className="font-semibold text-foreground truncate">
                    {item.caption || item.alt_text || `Gallery Photo ${index + 1}`}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Position {index + 1}</p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground hover:text-foreground"
                  disabled={index === 0 || isLoading}
                  onClick={() => moveItem(index, "up")}
                  title="Move Up"
                >
                  <HugeiconsIcon icon={ArrowUp01Icon} strokeWidth={2} className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground hover:text-foreground"
                  disabled={index === items.length - 1 || isLoading}
                  onClick={() => moveItem(index, "down")}
                  title="Move Down"
                >
                  <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={isLoading}
            className="gap-1.5"
          >
            {isLoading ? (
              <>
                <HugeiconsIcon icon={Loading03Icon} className="size-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-3.5" />
                Save Order
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
