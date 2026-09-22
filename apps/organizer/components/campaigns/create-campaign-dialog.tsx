"use client"

import { useState } from "react"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Megaphone01Icon,
  SmartPhone01Icon,
  Mail01Icon,
  Ticket01Icon,
  UserGroupIcon,
  Loading03Icon,
  CheckmarkCircle01Icon,
  InformationCircleIcon,
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@workspace/ui/lib/utils"
import { useCreateCampaignMutation, useListContactListsQuery } from "@workspace/store/reducers/messagingApi"
import { useListEventsQuery } from "@workspace/store/reducers/organizerEventsApi"

interface CreateCampaignDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  onSuccess?: () => void
}

const MERGE_TAGS = [
  { tag: "{first_name}", label: "First Name", sample: "Abel" },
  { tag: "{event_title}", label: "Event Title", sample: "Addis Tech Summit" },
  { tag: "{ticket_link}", label: "Ticket Link", sample: "dig.is/tkt-xyz" },
]

export function CreateCampaignDialog({
  open,
  onOpenChange,
  organizationId,
  onSuccess,
}: CreateCampaignDialogProps) {
  const [name, setName] = useState("")
  const [channel, setChannel] = useState<"sms" | "email">("sms")
  const [audienceType, setAudienceType] = useState<"event" | "contact_list">("event")
  const [selectedEventId, setSelectedEventId] = useState<string>("")
  const [selectedListId, setSelectedListId] = useState<string>("")
  const [messageSubject, setMessageSubject] = useState("")
  const [messageBody, setMessageBody] = useState("")

  // Fetch events for audience dropdown
  const { data: eventsData, isLoading: isLoadingEvents } = useListEventsQuery({
    page: 1,
    per_page: 50,
  })
  const events = eventsData?.data ?? []

  // Fetch contact lists for audience dropdown
  const { data: contactListsData, isLoading: isLoadingLists } = useListContactListsQuery(
    { organizationId },
    { skip: !organizationId }
  )
  const contactLists = contactListsData?.data ?? []

  const [createCampaign, { isLoading: isCreating }] = useCreateCampaignMutation()

  // Live SMS Segment Calculator
  // Standard GSM-7 character count: 160 chars per SMS, or 153 for multi-part
  const isUnicode = /[^\u0000-\u007F]/.test(messageBody)
  const maxCharsPerSegment = isUnicode ? 70 : 160
  const charLength = messageBody.length
  const segmentCount = charLength === 0 ? 1 : Math.ceil(charLength / maxCharsPerSegment)

  const handleInsertTag = (tag: string) => {
    setMessageBody((prev) => prev + tag)
  }

  const handleReset = () => {
    setName("")
    setChannel("sms")
    setAudienceType("event")
    setSelectedEventId("")
    setSelectedListId("")
    setMessageSubject("")
    setMessageBody("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Campaign name is required")
      return
    }
    if (!messageBody.trim()) {
      toast.error("Message body cannot be empty")
      return
    }
    if (channel === "email" && !messageSubject.trim()) {
      toast.error("Email subject is required")
      return
    }

    try {
      await createCampaign({
        organizationId,
        campaign: {
          name: name.trim(),
          channel,
          timezone: "Africa/Addis_Ababa",
          event_id: audienceType === "event" && selectedEventId ? selectedEventId : null,
          message_subject: channel === "email" ? messageSubject.trim() : undefined,
          message_body: messageBody.trim(),
          metadata: {
            audience_type: audienceType,
            contact_list_id: audienceType === "contact_list" ? selectedListId : null,
          },
        },
      }).unwrap()

      toast.success("Draft campaign created!", {
        description: `"${name}" is ready for quote estimation and compliance attestation.`,
      })
      handleReset()
      onOpenChange(false)
      onSuccess?.()
    } catch (err: any) {
      toast.error("Failed to create campaign", {
        description:
          err?.data?.message || err?.data?.error || err?.message || "An unexpected error occurred",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-lime-500/10 text-lime-600 dark:bg-lime-500/20 dark:text-lime-400">
              <HugeiconsIcon icon={Megaphone01Icon} size={20} strokeWidth={2} />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">New Marketing Campaign</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Broadcast instant SMS alerts or rich emails to your attendees
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Campaign Name */}
          <div className="space-y-1.5">
            <Label htmlFor="campaign-name" className="text-xs font-medium">
              Campaign Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="campaign-name"
              placeholder="e.g. VIP Early Bird Reminder"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-xs h-9"
              required
            />
          </div>

          {/* Channel Choice */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Broadcast Channel</Label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setChannel("sms")}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all",
                  channel === "sms"
                    ? "border-lime-500/60 bg-lime-500/5 dark:bg-lime-500/10"
                    : "border-border/60 hover:bg-muted/50"
                )}
              >
                <div
                  className={cn(
                    "flex size-7 items-center justify-center rounded-lg",
                    channel === "sms"
                      ? "bg-lime-500 text-zinc-950 font-bold"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <HugeiconsIcon icon={SmartPhone01Icon} size={15} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-xs font-semibold leading-tight">SMS Broadcast</p>
                  <p className="text-[10px] text-muted-foreground">Direct SMS to attendees</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setChannel("email")}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all",
                  channel === "email"
                    ? "border-lime-500/60 bg-lime-500/5 dark:bg-lime-500/10"
                    : "border-border/60 hover:bg-muted/50"
                )}
              >
                <div
                  className={cn(
                    "flex size-7 items-center justify-center rounded-lg",
                    channel === "email"
                      ? "bg-lime-500 text-zinc-950 font-bold"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <HugeiconsIcon icon={Mail01Icon} size={15} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-xs font-semibold leading-tight">Email Campaign</p>
                  <p className="text-[10px] text-muted-foreground">Rich format newsletter</p>
                </div>
              </button>
            </div>
          </div>

          {/* Target Audience */}
          <div className="space-y-2 rounded-xl border bg-muted/20 p-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Target Audience</Label>
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setAudienceType("event")}
                  className={cn(
                    "px-2 py-0.5 rounded-md font-medium transition-colors",
                    audienceType === "event"
                      ? "bg-background shadow-xs text-foreground font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Event Attendees
                </button>
                <button
                  type="button"
                  onClick={() => setAudienceType("contact_list")}
                  className={cn(
                    "px-2 py-0.5 rounded-md font-medium transition-colors",
                    audienceType === "contact_list"
                      ? "bg-background shadow-xs text-foreground font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Contact List
                </button>
              </div>
            </div>

            {audienceType === "event" ? (
              <div className="space-y-1">
                <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                  <SelectTrigger className="text-xs h-9 bg-background">
                    <SelectValue placeholder="Select target event" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingEvents ? (
                      <SelectItem value="loading" disabled>
                        Loading events...
                      </SelectItem>
                    ) : events.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No active events found
                      </SelectItem>
                    ) : (
                      events.map((evt) => (
                        <SelectItem key={evt.id} value={evt.id} className="text-xs">
                          {evt.title} ({evt.status})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">
                  Recipients will be automatically selected from confirmed and valid ticket holders.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <Select value={selectedListId} onValueChange={setSelectedListId}>
                  <SelectTrigger className="text-xs h-9 bg-background">
                    <SelectValue placeholder="Select contact audience list" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingLists ? (
                      <SelectItem value="loading" disabled>
                        Loading lists...
                      </SelectItem>
                    ) : contactLists.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No contact lists created yet
                      </SelectItem>
                    ) : (
                      contactLists.map((list) => (
                        <SelectItem key={list.id} value={list.id} className="text-xs">
                          {list.name} ({list.entries_count || 0} contacts)
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">
                  Imported phone numbers or email contacts from your audience groups.
                </p>
              </div>
            )}
          </div>

          {/* Email Subject (if email channel) */}
          {channel === "email" && (
            <div className="space-y-1.5">
              <Label htmlFor="email-subject" className="text-xs font-medium">
                Email Subject Line <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email-subject"
                placeholder="e.g. Your Ticket & Entry Information for Addis Live"
                value={messageSubject}
                onChange={(e) => setMessageSubject(e.target.value)}
                className="text-xs h-9"
                required={channel === "email"}
              />
            </div>
          )}

          {/* Message Body */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="message-body" className="text-xs font-medium">
                Message Content <span className="text-destructive">*</span>
              </Label>
              {channel === "sms" && (
                <span
                  className={cn(
                    "text-[10px] font-mono",
                    charLength > 160 ? "text-amber-600 dark:text-amber-400 font-bold" : "text-muted-foreground"
                  )}
                >
                  {charLength} chars • {segmentCount} {segmentCount === 1 ? "SMS credit" : "SMS credits"}/contact
                </span>
              )}
            </div>

            <Textarea
              id="message-body"
              rows={4}
              placeholder={
                channel === "sms"
                  ? "Hello {first_name}, doors open at 6PM for {event_title}. Access your entry pass at {ticket_link}."
                  : "Dear {first_name},\n\nWe look forward to seeing you at {event_title}!\n\nYour tickets: {ticket_link}"
              }
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              className="text-xs font-mono leading-relaxed"
              required
            />

            {/* Merge Tag Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                Insert variables:
              </span>
              {MERGE_TAGS.map((tag) => (
                <button
                  key={tag.tag}
                  type="button"
                  onClick={() => handleInsertTag(tag.tag)}
                  className="rounded-md border bg-background px-2 py-0.5 text-[10px] font-mono text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  {tag.tag}
                </button>
              ))}
            </div>

            {channel === "sms" && isUnicode && (
              <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <HugeiconsIcon icon={InformationCircleIcon} size={12} />
                Contains special/unicode characters: SMS billing reduces to 70 chars per segment.
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
            <Button variant="outline" size="sm" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isCreating}
              className="gap-1.5 bg-lime-500 hover:bg-lime-600 text-zinc-950 font-bold dark:bg-lime-500 dark:text-zinc-950 dark:hover:bg-lime-400 border-0 shadow-xs"
            >
              {isCreating ? (
                <>
                  <HugeiconsIcon icon={Loading03Icon} size={14} className="animate-spin" />
                  Creating Campaign...
                </>
              ) : (
                "Save & Prepare Launch"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
