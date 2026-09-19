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
import { Input } from "@/components/ui/input"
import { PhoneInput } from "@/components/ui/phone-input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useListEventsQuery, useListEventDatesQuery } from "@workspace/store/reducers/organizerEventsApi"
import { useListEventProductsQuery } from "@workspace/store/reducers/ticketingApi"
import { useIssueComplimentaryTicketMutation } from "@workspace/store/reducers/attendeesApi"
import { HugeiconsIcon } from "@hugeicons/react"
import { Ticket01Icon } from "@hugeicons/core-free-icons"

const issueComplimentarySchema = z.object({
  eventId: z.string().min(1, "Event is required"),
  ticketTypeId: z.string().min(1, "Ticket tier is required"),
  selectedEventDateId: z.string().optional(),
  phone: z
    .string()
    .min(9, "Phone number is required")
    .regex(/^(?:\+251|251|0)?[97]\d{8}$/, "Enter a valid Ethiopian phone number (09... or 07...)"),
  packageQuantity: z.number().min(1, "Quantity must be at least 1").max(50, "Maximum 50 tickets at once"),
  reason: z.string().min(1, "Reason is required"),
})

type IssueComplimentaryFormValues = z.infer<typeof issueComplimentarySchema>

interface IssueComplimentaryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId?: string
  defaultTicketTypeId?: string
  onSuccess?: () => void
}

const REASONS = [
  { value: "community_partner", label: "Community Partner / VIP / Artist" },
  { value: "sponsor_guest", label: "Sponsor Guest / Partner Allocation" },
  { value: "staff_guest", label: "Staff & Crew Guest Pass" },
  { value: "accessibility", label: "Accessibility Accommodation" },
  { value: "accommodation", label: "General Accommodation" },
  { value: "service_recovery", label: "Service Recovery & Resolution" },
]

export function IssueComplimentaryDialog({
  open,
  onOpenChange,
  eventId: initialEventId,
  defaultTicketTypeId,
  onSuccess,
}: IssueComplimentaryDialogProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>(initialEventId ?? "")

  const { data: eventsData, isLoading: isLoadingEvents } = useListEventsQuery(
    { page: 1, per_page: 100 },
    { skip: !!initialEventId }
  )

  const activeEventId = initialEventId || selectedEventId

  const { data: productsData, isLoading: isLoadingProducts } = useListEventProductsQuery(
    { eventId: activeEventId },
    { skip: !activeEventId }
  )

  const { data: datesData, isLoading: isLoadingDates } = useListEventDatesQuery(
    activeEventId,
    { skip: !activeEventId }
  )

  const [issueTicket, { isLoading: isSubmitting }] = useIssueComplimentaryTicketMutation()

  const form = useForm<IssueComplimentaryFormValues>({
    resolver: zodResolver(issueComplimentarySchema as any),
    defaultValues: {
      eventId: initialEventId ?? "",
      ticketTypeId: defaultTicketTypeId ?? "",
      selectedEventDateId: "",
      phone: "",
      packageQuantity: 1,
      reason: "community_partner",
    },
  })

  useEffect(() => {
    if (initialEventId) {
      setSelectedEventId(initialEventId)
      form.setValue("eventId", initialEventId)
    }
  }, [initialEventId, form])

  useEffect(() => {
    if (defaultTicketTypeId) {
      form.setValue("ticketTypeId", defaultTicketTypeId)
    }
  }, [defaultTicketTypeId, form])

  const eventProducts = productsData?.data ?? []
  const eventDates = Array.isArray(datesData?.data) ? datesData.data : []

  const onSubmit = async (values: IssueComplimentaryFormValues) => {
    try {
      // Normalize Ethiopian phone to international format without plus e.g. 251911223344
      let cleanPhone = values.phone.replace(/\D/g, "")
      if (cleanPhone.startsWith("0")) {
        cleanPhone = "251" + cleanPhone.slice(1)
      } else if (!cleanPhone.startsWith("251")) {
        cleanPhone = "251" + cleanPhone
      }

      await issueTicket({
        eventId: values.eventId,
        payload: {
          ticket_type_id: values.ticketTypeId,
          phone: cleanPhone,
          package_quantity: values.packageQuantity,
          selected_event_date_id: values.selectedEventDateId || undefined,
          reason: values.reason,
          answers: [],
        },
      }).unwrap()

      toast.success("Complimentary ticket issued successfully!", {
        description: `Issued ${values.packageQuantity} ticket(s) to ${cleanPhone}.`,
      })
      form.reset()
      onOpenChange(false)
      onSuccess?.()
    } catch (err: unknown) {
      const errObj = err && typeof err === "object" && "data" in err ? (err as { data?: { error?: string; message?: string } }).data : null
      const errorMsg =
        errObj?.error ||
        errObj?.message ||
        "Failed to issue complimentary ticket. Please verify capacity and try again."
      toast.error("Issuance failed", { description: errorMsg })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <HugeiconsIcon icon={Ticket01Icon} strokeWidth={2} className="size-4" />
            </div>
            <div>
              <DialogTitle>Issue Complimentary Ticket</DialogTitle>
              <DialogDescription>
                Grant a free guest ticket with zero checkout charge.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Event Selector (if not locked to an event) */}
          {!initialEventId && (
            <div className="space-y-1.5">
              <Label htmlFor="event-select">Event</Label>
              <Select
                value={form.watch("eventId")}
                onValueChange={(val) => {
                  form.setValue("eventId", val, { shouldValidate: true })
                  setSelectedEventId(val)
                  form.setValue("ticketTypeId", "")
                  form.setValue("selectedEventDateId", "")
                }}
              >
                <SelectTrigger id="event-select">
                  <SelectValue placeholder={isLoadingEvents ? "Loading events..." : "Select an event"} />
                </SelectTrigger>
                <SelectContent>
                  {eventsData?.data?.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.eventId && (
                <p className="text-xs text-destructive">{form.formState.errors.eventId.message}</p>
              )}
            </div>
          )}

          {/* Ticket Tier Selector */}
          <div className="space-y-1.5">
            <Label htmlFor="tier-select">Ticket Tier / Type</Label>
            <Select
              value={form.watch("ticketTypeId")}
              onValueChange={(val) => form.setValue("ticketTypeId", val, { shouldValidate: true })}
              disabled={!activeEventId || isLoadingProducts}
            >
              <SelectTrigger id="tier-select">
                <SelectValue
                  placeholder={
                    !activeEventId
                      ? "Select an event first"
                      : isLoadingProducts
                        ? "Loading tiers..."
                        : eventProducts.length === 0
                          ? "No ticket tiers found"
                          : "Select ticket tier"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {eventProducts.map((product) => {
                  const typeId = product.ticket_type?.id || product.id
                  return (
                    <SelectItem key={product.id} value={typeId}>
                      {product.name} ({product.status})
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            {form.formState.errors.ticketTypeId && (
              <p className="text-xs text-destructive">{form.formState.errors.ticketTypeId.message}</p>
            )}
          </div>

          {/* Event Date Selector (optional if multi-date) */}
          {eventDates.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="date-select">Event Date (Optional)</Label>
              <Select
                value={form.watch("selectedEventDateId")}
                onValueChange={(val) => form.setValue("selectedEventDateId", val)}
                disabled={isLoadingDates}
              >
                <SelectTrigger id="date-select">
                  <SelectValue placeholder="All dates / Standard admission" />
                </SelectTrigger>
                <SelectContent>
                  {eventDates.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name || new Date(d.starts_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Recipient Phone */}
          <div className="space-y-1.5">
            <Label htmlFor="phone">Recipient Phone Number</Label>
            <PhoneInput
              id="phone"
              placeholder="91 123 4567"
              {...form.register("phone")}
            />
            {form.formState.errors.phone ? (
              <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Ticket claim SMS/link will be associated with this phone.
              </p>
            )}
          </div>

          {/* Quantity & Reason Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                max={50}
                {...form.register("packageQuantity", { valueAsNumber: true })}
              />
              {form.formState.errors.packageQuantity && (
                <p className="text-xs text-destructive">{form.formState.errors.packageQuantity.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reason">Issuance Reason</Label>
              <Select
                value={form.watch("reason")}
                onValueChange={(val) => form.setValue("reason", val, { shouldValidate: true })}
              >
                <SelectTrigger id="reason">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Issuing..." : "Issue Ticket"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
