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
  const [fileError, setFileError] = useState<string | null>(null)
  const [importCsv, { isLoading }] = useImportContactListCsvMutation()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null)
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0]
      if (selected.size > 5 * 1024 * 1024) {
        setFileError("File exceeds the maximum 5 MB limit.")
        setFile(null)
        return
      }
      if (!selected.name.toLowerCase().endsWith(".csv")) {
        setFileError("Only .csv files are supported.")
        setFile(null)
        return
      }
      setFile(selected)
    }
  }

  const handleDownloadSample = () => {
    const sampleHeaders = "phone_number,first_name,last_name,email\n"
    const sampleRows = [
      "0911234567,Abebe,Bikila,abebe@example.com",
      "0922345678,Tirunesh,Dibaba,tirunesh@example.com",
      "+251933456789,Haile,Gebrselassie,haile@example.com",
    ].join("\n")
    const csvContent = sampleHeaders + sampleRows
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", "sample_contacts.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.info("Sample CSV downloaded", {
      description: "Open sample_contacts.csv to see the expected column headers and format.",
    })
  }

  const handleUpload = async () => {
    if (!file || !contactListId) return

    try {
      const res = await importCsv({
        organizationId,
        contactListId,
        file,
      }).unwrap()

      toast.success("Contacts import started!", {
        description: `Import job for "${contactListName}" queued. Entries are being validated and added in the background.`,
      })
      setFile(null)
      setFileError(null)
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <HugeiconsIcon icon={FileUploadIcon} size={20} strokeWidth={2} />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">Import Contacts CSV</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Upload recipient audience records to list &quot;{contactListName}&quot;
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* File input zone */}
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 p-5 text-center bg-muted/10 hover:bg-muted/30 transition-colors">
            <HugeiconsIcon icon={FileUploadIcon} size={26} className="text-muted-foreground mb-2" />
            <Label htmlFor="csv-upload" className="cursor-pointer text-xs font-semibold text-primary hover:underline">
              {file ? file.name : "Choose a CSV file to upload"}
            </Label>
            <p className="text-[11px] text-muted-foreground mt-1">
              {file ? `${(file.size / 1024).toFixed(1)} KB` : "Supports UTF-8 CSV with headers (Max 5 MB, up to 10,000 rows)"}
            </p>
            <input
              id="csv-upload"
              type="file"
              accept=".csv,text/csv,application/vnd.ms-excel"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {fileError && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-2.5 text-xs text-destructive">
              <HugeiconsIcon icon={AlertCircleIcon} size={16} className="shrink-0" />
              <span>{fileError}</span>
            </div>
          )}

          {/* Format Specification */}
          <div className="rounded-xl border bg-muted/20 p-3.5 text-[11px] text-muted-foreground space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-foreground text-xs">Expected CSV Column Structure</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-6 text-[11px] gap-1 px-2 text-foreground shadow-2xs"
                onClick={handleDownloadSample}
              >
                <HugeiconsIcon icon={Download01Icon} size={12} />
                Download Sample CSV
              </Button>
            </div>

            <code className="block bg-background p-2 rounded-lg border font-mono text-[10.5px] text-foreground font-medium">
              phone_number,first_name,last_name,email
            </code>

            <div className="grid grid-cols-2 gap-2 text-[10.5px] leading-relaxed pt-1">
              <div className="rounded-lg border bg-background/50 p-2">
                <span className="font-semibold text-foreground">For SMS Campaigns:</span>
                <p className="mt-0.5 text-muted-foreground">
                  Uses <code className="text-foreground">phone_number</code>. Supports Ethiopian formats (<code className="text-[10px]">09...</code>, <code className="text-[10px]">2519...</code>, <code className="text-[10px]">+2519...</code>).
                </p>
              </div>
              <div className="rounded-lg border bg-background/50 p-2">
                <span className="font-semibold text-foreground">For Email Campaigns:</span>
                <p className="mt-0.5 text-muted-foreground">
                  Uses <code className="text-foreground">email</code>. Must be a valid email (<code className="text-[10px]">user@example.com</code>).
                </p>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground border-t pt-2">
              • Each row must contain at least a valid phone number or email (or both).<br />
              • <code className="text-foreground">first_name</code> and <code className="text-foreground">last_name</code> are optional and used for personalization (<code className="text-[10px]">&#123;&#123;first_name&#125;&#125;</code>).<br />
              • Duplicate numbers/emails within the list and unsubscribed contacts are filtered out automatically.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!file || isLoading}
            onClick={handleUpload}
            className="gap-1.5 shadow-xs"
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
