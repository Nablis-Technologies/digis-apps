"use client"

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { CreateCampaignForm } from "./create-campaign-form"

interface CreateCampaignDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  onSuccess?: () => void
}

export function CreateCampaignDialog({
  open,
  onOpenChange,
  organizationId,
  onSuccess,
}: CreateCampaignDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl lg:max-w-6xl max-h-[94vh] p-6 overflow-y-auto rounded-2xl">
        <CreateCampaignForm
          organizationId={organizationId}
          onSuccess={() => {
            onOpenChange(false)
            onSuccess?.()
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
