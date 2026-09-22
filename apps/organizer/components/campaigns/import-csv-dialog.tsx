"use client"

import { useState } from "react"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Download01Icon,
  FileUploadIcon,
  Loading03Icon,
  CheckmarkCircle01Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useImportContactListCsvMutation } from "@workspace/store/reducers/messagingApi"

interface ImportCsvDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  contactListId: string
  contactListName: string
  onSuccess?: () => void
}

export function ImportCsvDialog({
  open,
  onOpenChange,
  organizationId,
  contactListId,
  contactListName,
  onSuccess,
}: ImportCsvDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [importCsv, { isLoading }] = useImportContactListCsvMutation()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file || !contactListId) return

    try {
      await importCsv({
        organizationId,
        contactListId,
        file,
      }).unwrap()

      toast.success("Contacts import started!", {
        description: `Import job for "${contactListName}" queued. Entries are being validated and added.`,
      })
      setFile(null)
      onOpenChange(false)
      onSuccess?.()
    } catch (err: any) {
      toast.error("Failed to import CSV", {
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
              <HugeiconsIcon icon={FileUploadIcon} size={20} strokeWidth={2} />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">Import Contacts CSV</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Upload audience records to &quot;{contactListName}&quot;
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* File input zone */}
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 p-6 text-center bg-muted/10 hover:bg-muted/30 transition-colors">
            <HugeiconsIcon icon={FileUploadIcon} size={28} className="text-muted-foreground mb-2" />
            <Label htmlFor="csv-upload" className="cursor-pointer text-xs font-semibold text-foreground hover:underline">
              {file ? file.name : "Choose a CSV file to upload"}
            </Label>
            <p className="text-[11px] text-muted-foreground mt-1">
              {file ? `${(file.size / 1024).toFixed(1)} KB` : "Supports UTF-8 CSV with headers"}
            </p>
            <input
              id="csv-upload"
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Format Specification */}
          <div className="rounded-xl border bg-muted/20 p-3 text-[11px] text-muted-foreground space-y-1.5">
            <p className="font-semibold text-foreground">Expected CSV Column Headers:</p>
            <code className="block bg-background p-2 rounded border font-mono text-[10px] text-foreground">
              phone_number,first_name,last_name,email
            </code>
            <p className="text-[10px]">
              Ethiopian phone numbers will be automatically normalized into E.164 format (+251...). Duplicate entries in the list are filtered.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!file || isLoading}
            onClick={handleUpload}
            className="gap-1.5 bg-lime-500 hover:bg-lime-600 text-zinc-950 font-bold dark:bg-lime-500 dark:text-zinc-950 dark:hover:bg-lime-400 border-0 shadow-xs"
          >
            {isLoading ? (
              <>
                <HugeiconsIcon icon={Loading03Icon} size={14} className="animate-spin" />
                Uploading CSV...
              </>
            ) : (
              "Upload & Import"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
