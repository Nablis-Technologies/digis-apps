"use client"

import { useState, useEffect } from "react"
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
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRequestAttendeeExportMutation } from "@workspace/store/reducers/attendeesApi"
import { useActiveOrganization } from "@/providers/organization-provider"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon, LockKeyIcon } from "@hugeicons/core-free-icons"
import { cn } from "@workspace/ui/lib/utils"

const exportSchema = z.object({
  rowMode: z.enum(["registration", "admission"]),
  reasonCode: z.string().min(1, "Reason is required"),
})

type ExportFormValues = z.infer<typeof exportSchema>

interface RequestExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  canExportContactInfo?: boolean
  onSuccess?: () => void
}

// Built-in fields strictly supported by FieldRegistry
const REGISTRATION_FIELDS = [
  { id: "registration_id", label: "Registration ID (Unique identifier)", isContact: false },
  { id: "registration_status", label: "Registration Status (Confirmed, Pending, etc.)", isContact: false },
  { id: "ticket_type_id", label: "Ticket Tier ID", isContact: false },
  { id: "selected_event_date_id", label: "Selected Event Date ID", isContact: false },
  { id: "registration_user_phone", label: "Attendee Mobile Phone", isContact: true },
  { id: "registration_user_email", label: "Attendee Email Address", isContact: true },
]

const ADMISSION_FIELDS = [
  { id: "package_unit_number", label: "Package Unit Number", isContact: false },
  { id: "admission_position", label: "Admission Position Slot", isContact: false },
]

const CONTACT_FIELD_KEYS = ["registration_user_phone", "registration_user_email"]

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
  canExportContactInfo: canExportContactInfoProp,
  onSuccess,
}: RequestExportDialogProps) {
  const { isOwnerOrAdmin } = useActiveOrganization()
  const hasContactAccess = canExportContactInfoProp ?? isOwnerOrAdmin

  // Initial fields: only include phone/email if user has owner or admin contact access
  const [selectedFields, setSelectedFields] = useState<string[]>(() => {
    return hasContactAccess
      ? ["registration_id", "registration_status", "ticket_type_id", "registration_user_phone"]
      : ["registration_id", "registration_status", "ticket_type_id"]
  })

  // Synchronize when dialog opens or permissions change
  useEffect(() => {
    if (!hasContactAccess) {
      setSelectedFields((prev) =>
        prev.filter((id) => !CONTACT_FIELD_KEYS.includes(id))
      )
    }
  }, [hasContactAccess, open])

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
    if (CONTACT_FIELD_KEYS.includes(fieldId) && !hasContactAccess) {
      toast.error("Contact information export (email/phone) is restricted to Organization Owners and Admins.")
      return
    }

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
    // Sanitize: ensure no contact fields are submitted if caller is not owner/admin
    const sanitizedFields = hasContactAccess
      ? selectedFields
      : selectedFields.filter((id) => !CONTACT_FIELD_KEYS.includes(id))

    if (sanitizedFields.length === 0) {
      toast.error("Please select at least one field to export")
      return
    }

    try {
      await requestExport({
        eventId,
        payload: {
          row_mode: values.rowMode,
          field_keys: sanitizedFields,
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
      const errObj =
        err && typeof err === "object" && "data" in err
          ? (err as { data?: { error?: string; message?: string } }).data
          : null
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
            <div className="flex items-center justify-between">
              <Label>Include Fields in CSV</Label>
              {!hasContactAccess && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                  <HugeiconsIcon icon={LockKeyIcon} className="size-3 text-amber-500" />
                  Email & Phone: Owners & Admins only
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 gap-2 rounded-lg border border-border/60 p-3 text-sm">
              {availableFields.map((f) => {
                const isContact = CONTACT_FIELD_KEYS.includes(f.id)
                const isLocked = isContact && !hasContactAccess
                const isChecked = selectedFields.includes(f.id)

                return (
                  <label
                    key={f.id}
                    className={cn(
                      "flex items-center justify-between gap-2.5 rounded px-2 py-1.5 transition-colors",
                      isLocked
                        ? "opacity-60 cursor-not-allowed bg-muted/20"
                        : "cursor-pointer hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Checkbox
                        checked={isChecked}
                        disabled={isLocked}
                        onCheckedChange={() => toggleField(f.id)}
                      />
                      <span className="text-xs font-medium leading-none text-foreground truncate">
                        {f.label}
                      </span>
                    </div>

                    {isContact && (
                      <span className="shrink-0">
                        {isLocked ? (
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1.5 py-0 h-4 border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 gap-1 font-semibold"
                          >
                            <HugeiconsIcon icon={LockKeyIcon} className="size-2.5" />
                            Owner & Admin
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1.5 py-0 h-4 border-lime-500/30 bg-lime-500/10 text-lime-700 dark:text-lime-300 font-semibold"
                          >
                            Contact
                          </Badge>
                        )}
                      </span>
                    )}
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
