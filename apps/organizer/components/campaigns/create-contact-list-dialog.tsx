"use client"

import { useState } from "react"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { UserGroupIcon, Loading03Icon } from "@hugeicons/core-free-icons"
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
import { useCreateContactListMutation } from "@workspace/store/reducers/messagingApi"

interface CreateContactListDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  onSuccess?: () => void
}

export function CreateContactListDialog({
  open,
  onOpenChange,
  organizationId,
  onSuccess,
}: CreateContactListDialogProps) {
  const [name, setName] = useState("")
  const [createList, { isLoading }] = useCreateContactListMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    try {
      await createList({
        organizationId,
        name: name.trim(),
      }).unwrap()

      toast.success("Contact list created!", {
        description: `"${name}" is ready for CSV import.`,
      })
      setName("")
      onOpenChange(false)
      onSuccess?.()
    } catch (err: any) {
      toast.error("Failed to create contact list", {
        description:
          err?.data?.message || err?.data?.error || err?.message || "An unexpected error occurred",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-lime-500/10 text-lime-600 dark:bg-lime-500/20 dark:text-lime-400">
              <HugeiconsIcon icon={UserGroupIcon} size={20} strokeWidth={2} />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">Create Audience List</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Organize custom contacts and subscribers for direct campaigns
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="list-name" className="text-xs font-medium">
              List Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="list-name"
              placeholder="e.g. VIP Past Attendees 2025"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-xs h-9"
              required
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isLoading || !name.trim()}
              className="gap-1.5 bg-lime-500 hover:bg-lime-600 text-zinc-950 font-bold dark:bg-lime-500 dark:text-zinc-950 dark:hover:bg-lime-400 border-0 shadow-xs"
            >
              {isLoading ? (
                <>
                  <HugeiconsIcon icon={Loading03Icon} size={14} className="animate-spin" />
                  Creating...
                </>
              ) : (
                "Create List"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
