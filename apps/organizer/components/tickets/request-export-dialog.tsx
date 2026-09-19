"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
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
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRequestAttendeeExportMutation } from "@workspace/store/reducers/attendeesApi"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon } from "@hugeicons/core-free-icons"

const exportSchema = z.object({
  rowMode: z.enum(["registration", "admission"]),
  reasonCode: z.string().min(1, "Reason is required"),
})

type ExportFormValues = z.infer<typeof exportSchema>

interface RequestExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  onSuccess?: () => void
}

// Built-in fields strictly supported by FieldRegistry
const REGISTRATION_FIELDS = [
  { id: "registration_id", label: "Registration ID (Unique identifier)" },
  { id: "registration_status", label: "Registration Status (Confirmed, Pending, etc.)" },
  { id: "ticket_type_id", label: "Ticket Tier ID" },
  { id: "selected_event_date_id", label: "Selected Event Date ID" },
  { id: "registration_user_phone", label: "Attendee Mobile Phone" },
  { id: "registration_user_email", label: "Attendee Email Address" },
]

const ADMISSION_FIELDS = [
  { id: "package_unit_number", label: "Package Unit Number" },
  { id: "admission_position", label: "Admission Position Slot" },
]

// Reason codes strictly permitted by AttendeeExportPolicy
const REASON_CODES = [
  { value: "event_operations", label: "Event Operations & Gate Check-in" },
  { value: "attendee_communication", label: "Attendee Communications & Notifications" },
  { value: "customer_support", label: "Customer Support & Ticketing Inquiries" },
  { value: "accessibility_accommodation", label: "Accessibility Accommodation" },
  { value: "dietary_accommodation", label: "Dietary Accommodation" },
  { value: "legal_compliance", label: "Legal & Regulatory Compliance" },
]

export function RequestExportDialog({
  open,
  onOpenChange,
  eventId,
  onSuccess,
}: RequestExportDialogProps) {
  const [selectedFields, setSelectedFields] = useState<string[]>([
    "registration_id",
    "registration_status",
    "ticket_type_id",
    "registration_user_phone",
  ])

  const [requestExport, { isLoading }] = useRequestAttendeeExportMutation()

  const form = useForm<ExportFormValues>({
    resolver: zodResolver(exportSchema as any),
    defaultValues: {
      rowMode: "registration",
      reasonCode: "event_operations",
    },
  })

  const currentRowMode = form.watch("rowMode")
  const availableFields =
    currentRowMode === "admission"
      ? [...REGISTRATION_FIELDS, ...ADMISSION_FIELDS]
      : REGISTRATION_FIELDS

  const toggleField = (fieldId: string) => {
    setSelectedFields((prev) =>
      prev.includes(fieldId) ? prev.filter((f) => f !== fieldId) : [...prev, fieldId]
    )
  }

  const handleRowModeChange = (val: "registration" | "admission") => {
    form.setValue("rowMode", val)
    if (val === "registration") {
      // Prune admission-only fields
      const validIds = new Set(REGISTRATION_FIELDS.map((f) => f.id))
      setSelectedFields((prev) => prev.filter((id) => validIds.has(id)))
    }
  }

  const onSubmit = async (values: ExportFormValues) => {
    if (selectedFields.length === 0) {
      toast.error("Please select at least one field to export")
      return
    }

    try {
      await requestExport({
        eventId,
        payload: {
          row_mode: values.rowMode,
          field_keys: selectedFields,
          reason_code: values.reasonCode,
          filters: {},
        },
      }).unwrap()

      toast.success("Attendee export job requested!", {
        description: "Your report is being generated and will be ready for download shortly.",
      })
      onOpenChange(false)
      onSuccess?.()
    } catch (err: unknown) {
      const errObj = err && typeof err === "object" && "data" in err ? (err as { data?: { error?: string; message?: string } }).data : null
      const errorMsg =
        errObj?.error ||
        errObj?.message ||
        "Failed to request attendee export. Please try again."
      toast.error("Export request failed", { description: errorMsg })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
              <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} className="size-4" />
            </div>
            <div>
              <DialogTitle>Request Attendee Export</DialogTitle>
              <DialogDescription>
                Generate an export of registered attendees and admission logs.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="row-mode">Export Format Level</Label>
            <Select
              value={currentRowMode}
              onValueChange={handleRowModeChange}
            >
              <SelectTrigger id="row-mode">
                <SelectValue placeholder="Select row level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="registration">One Row per Registration Package</SelectItem>
                <SelectItem value="admission">One Row per Admission Slot (Individual Entry)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Include Fields in CSV</Label>
            <div className="grid grid-cols-1 gap-2 rounded-lg border border-border/60 p-3 text-sm">
              {availableFields.map((f) => {
                const isChecked = selectedFields.includes(f.id)
                return (
                  <label
                    key={f.id}
                    className="flex cursor-pointer items-center gap-2.5 rounded px-1.5 py-1 transition-colors hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => toggleField(f.id)}
                    />
                    <span className="text-xs font-medium leading-none text-foreground">
                      {f.label}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reason-code">Audit Reason Code</Label>
            <Select
              value={form.watch("reasonCode")}
              onValueChange={(val) => form.setValue("reasonCode", val)}
            >
              <SelectTrigger id="reason-code">
                <SelectValue placeholder="Select purpose" />
              </SelectTrigger>
              <SelectContent>
                {REASON_CODES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Starting Export..." : "Generate Export"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
