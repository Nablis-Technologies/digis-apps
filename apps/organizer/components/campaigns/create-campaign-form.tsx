"use client"

import { useState, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Megaphone01Icon,
  SmartPhone01Icon,
  Mail01Icon,
  Loading03Icon,
  InformationCircleIcon,
  Shield01Icon,
  Link01Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  Calendar03Icon,
  ArrowDown01Icon,
  UserIcon,
  TicketIcon,
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
import { Badge, StatusBadge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@workspace/ui/lib/utils"
import { useCreateCampaignMutation, useListContactListsQuery } from "@workspace/store/reducers/messagingApi"
import { useListEventsQuery } from "@workspace/store/reducers/organizerEventsApi"
import { useActiveOrganization, isOrgSuspendedOrRemoved } from "../../providers/organization-provider"

interface CreateCampaignFormProps {
  organizationId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

const MERGE_TAGS = [
  {
    tag: "{{first_name}}",
    label: "Attendee First Name",
    desc: "Replaced with recipient's first name",
    sample: "Sarah",
    icon: <HugeiconsIcon icon={UserIcon} size={13} className="text-teal-600 dark:text-teal-400 shrink-0" />,
  },
  {
    tag: "{{last_name}}",
    label: "Attendee Last Name",
    desc: "Replaced with recipient's family name",
    sample: "Kibret",
    icon: <HugeiconsIcon icon={UserIcon} size={13} className="text-teal-600 dark:text-teal-400 shrink-0" />,
  },
  {
    tag: "{{event_title}}",
    label: "Event Name",
    desc: "Replaced with target event title",
    sample: "Gize Concert Night",
    icon: <HugeiconsIcon icon={Megaphone01Icon} size={13} className="text-indigo-600 dark:text-indigo-400 shrink-0" />,
  },
  {
    tag: "{{event_link}}",
    label: "Event Page Link",
    desc: "Branded short link to event page",
    sample: "dig.is/gize-2026",
    icon: <HugeiconsIcon icon={Link01Icon} size={13} className="text-lime-600 dark:text-lime-400 shrink-0" />,
  },
  {
    tag: "{{ticket_link}}",
    label: "Personal Ticket Link",
    desc: "Direct personalized ticket pass link",
    sample: "dig.is/t/vip-pass",
    icon: <HugeiconsIcon icon={TicketIcon} size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />,
  },
]

const POPULAR_EMOJIS = [
  "👋", "🎶", "🎟️", "🔥", "✨", "📍", "📅", "⏰",
  "⚡", "🎉", "🚀", "❤️", "👏", "🙌", "📣", "💡",
]

const DEFAULT_SMS_TEMPLATE = `Hey {{first_name}}! 👋

Gize Concert Night is almost here! 🎶
Join us on May 23, 2026 at Friendship Park, Addis Ababa for an unforgettable night of music, lights, and vibes.

🎟️ Get your tickets now: {{event_link}}

See you there! 🔥
- Digis Team`

export function CreateCampaignForm({
  organizationId: propOrgId,
  onSuccess,
  onCancel,
}: CreateCampaignFormProps) {
  const router = useRouter()
  const { activeOrg, activeOrgId } = useActiveOrganization()
  const organizationId = propOrgId || activeOrgId || ""

  const [name, setName] = useState("")
  const [channel, setChannel] = useState<"sms" | "email">("sms")
  const [audienceType, setAudienceType] = useState<"event" | "contact_list">("event")
  const [selectedEventId, setSelectedEventId] = useState<string>("")
  const [selectedListId, setSelectedListId] = useState<string>("")
  const [messageSubject, setMessageSubject] = useState("")
  const [messageBody, setMessageBody] = useState(DEFAULT_SMS_TEMPLATE)
  const [activeMobileTab, setActiveMobileTab] = useState<"compose" | "preview">("compose")

  // Test SMS Modal
  const [testModalOpen, setTestModalOpen] = useState(false)
  const [testPhone, setTestPhone] = useState("+2519")
  const [isSendingTest, setIsSendingTest] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [createCampaign, { isLoading: isCreating }] = useCreateCampaignMutation()
  const { data: eventsData, isLoading: isLoadingEvents } = useListEventsQuery(
    { "q[organization_id_eq]": organizationId, per_page: 50 },
    { skip: !organizationId }
  )
  const { data: contactListsData, isLoading: isLoadingLists } = useListContactListsQuery(
    { organizationId, per_page: 50 },
    { skip: !organizationId }
  )

  const rawEvents = eventsData?.data ?? []
  const events = useMemo(() => {
    return rawEvents.filter((evt) => {
      const st = (evt.status || "").toLowerCase().trim()
      return st !== "completed" && st !== "cancelled" && st !== "canceled"
    })
  }, [rawEvents])
  const contactLists = contactListsData?.data ?? []

  // Character and segment calculations
  const charLength = messageBody.length
  const isUnicode = useMemo(() => /[^\u0000-\u007F]/.test(messageBody), [messageBody])
  const segmentLimit = isUnicode ? 70 : 160
  const multiSegmentLimit = isUnicode ? 67 : 153
  const segmentCount = useMemo(() => {
    if (charLength === 0) return 0
    if (charLength <= segmentLimit) return 1
    return Math.ceil(charLength / multiSegmentLimit)
  }, [charLength, segmentLimit, multiSegmentLimit])

  // Sample data for live phone resolution
  const currentEvent = events.find((e) => e.id === selectedEventId)
  const eventTitleSample = currentEvent?.title || "Gize Concert Night"
  const eventLinkSample = currentEvent?.slug ? `dig.is/${currentEvent.slug}` : "dig.is/gize-2026"

  // Live interpolated preview string
  const previewMessage = useMemo(() => {
    let result = messageBody
    result = result.replace(/\{\{first_name\}\}/g, "Sarah")
    result = result.replace(/\{\{last_name\}\}/g, "Kibret")
    result = result.replace(/\{\{event_title\}\}/g, eventTitleSample)
    result = result.replace(/\{\{event_link\}\}/g, eventLinkSample)
    result = result.replace(/\{\{ticket_link\}\}/g, "dig.is/t/vip-pass")
    return result
  }, [messageBody, eventTitleSample, eventLinkSample])

  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current
    if (!textarea) {
      setMessageBody((prev) => prev + text)
      return
    }
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const prev = messageBody
    const next = prev.substring(0, start) + text + prev.substring(end)
    setMessageBody(next)
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + text.length, start + text.length)
    }, 0)
  }

  const handleInsertTag = (tag: string) => {
    insertAtCursor(tag)
  }

  const handleInsertEmoji = (emoji: string) => {
    insertAtCursor(emoji)
  }

  const handleSendTestSms = () => {
    if (!testPhone.trim() || testPhone.length < 9) {
      toast.error("Please enter a valid phone number")
      return
    }
    setIsSendingTest(true)
    setTimeout(() => {
      setIsSendingTest(false)
      setTestModalOpen(false)
      toast.success("Test message dispatched!", {
        description: `Simulated test SMS sent to ${testPhone}. Check your phone preview.`,
      })
    }, 900)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isOrgSuspendedOrRemoved(activeOrg)) {
      toast.error(`You cannot launch campaigns because your membership in "${activeOrg?.name}" is suspended.`)
      return
    }
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

    if (audienceType === "contact_list" && !selectedListId) {
      toast.error("Please select a contact list for this campaign")
      return
    }
    if (audienceType === "event" && !selectedEventId) {
      toast.error("Please select an event for the audience")
      return
    }

    try {
      const audienceSources =
        audienceType === "contact_list" && selectedListId
          ? [{ type: "contact_list", id: selectedListId }]
          : audienceType === "event" && selectedEventId
          ? [{ type: "event", event_id: selectedEventId, basis: "issued" }]
          : []

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
            currency: "ETB",
            country_code: "ET",
            audience_type: audienceType,
            contact_list_id: audienceType === "contact_list" ? selectedListId : null,
            audience_sources: audienceSources,
          },
        },
      }).unwrap()

      toast.success("Draft campaign created!", {
        description: `"${name}" is ready for quote estimation and compliance attestation.`,
      })

      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/organizer/campaigns")
      }
    } catch (err: any) {
      toast.error("Failed to create campaign", {
        description:
          err?.data?.message || err?.data?.error || err?.message || "An unexpected error occurred",
      })
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      router.push("/organizer/campaigns")
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* ─── PAGE HEADER BAR ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground">
              <Link href="/organizer/campaigns">
                <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-3.5 mr-1" />
                Back to Campaigns
              </Link>
            </Button>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <HugeiconsIcon icon={Megaphone01Icon} size={24} className="text-lime-600 dark:text-lime-400" />
            {channel === "sms" ? "Compose SMS message" : "Compose Email message"}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Create a compelling message for your audience with real-time phone preview.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setTestModalOpen(true)}
            className="h-8.5 text-xs gap-1.5 shadow-2xs font-medium border-border/80"
          >
            <HugeiconsIcon icon={SmartPhone01Icon} size={15} />
            Send test to phone
          </Button>
        </div>
      </div>

      {/* ─── MOBILE VIEW SWITCHER ────────────────────────────────────────── */}
      <div className="flex lg:hidden">
        <div className="grid grid-cols-2 w-full p-1 bg-muted/60 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setActiveMobileTab("compose")}
            className={cn(
              "py-1.5 rounded-lg font-medium transition-all text-center",
              activeMobileTab === "compose"
                ? "bg-background shadow-xs text-foreground font-semibold"
                : "text-muted-foreground"
            )}
          >
            Compose Message
          </button>
          <button
            type="button"
            onClick={() => setActiveMobileTab("preview")}
            className={cn(
              "py-1.5 rounded-lg font-medium transition-all text-center",
              activeMobileTab === "preview"
                ? "bg-background shadow-xs text-foreground font-semibold"
                : "text-muted-foreground"
            )}
          >
            Live Phone Preview 📱
          </button>
        </div>
      </div>

      {/* ─── MAIN TWO-COLUMN WORKSPACE ────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ─── LEFT COLUMN: COMPOSER & SETUP (7 COLS) ────────────────────── */}
          <div
            className={cn(
              "lg:col-span-7 space-y-5",
              activeMobileTab === "preview" ? "hidden lg:block" : "block"
            )}
          >
            {/* 1. Setup Card: Campaign Name & Channel Switcher */}
            <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-4 shadow-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Campaign Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="campaign-name" className="text-xs font-semibold text-foreground">
                    Campaign Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="campaign-name"
                    placeholder="e.g. VIP Early Bird Reminder"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-xs h-9 bg-background"
                    required
                  />
                </div>

                {/* Channel Switcher */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Broadcast Channel</Label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl border bg-muted/30 h-9">
                    <button
                      type="button"
                      onClick={() => setChannel("sms")}
                      className={cn(
                        "flex items-center justify-center gap-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer",
                        channel === "sms"
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs font-semibold dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <HugeiconsIcon icon={SmartPhone01Icon} size={14} strokeWidth={2} />
                      SMS
                    </button>
                    <button
                      type="button"
                      onClick={() => setChannel("email")}
                      className={cn(
                        "flex items-center justify-center gap-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer",
                        channel === "email"
                          ? "bg-sky-600 hover:bg-sky-700 text-white shadow-xs font-semibold dark:bg-sky-500 dark:text-zinc-950 dark:hover:bg-sky-400"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <HugeiconsIcon icon={Mail01Icon} size={14} strokeWidth={2} />
                      Email
                    </button>
                  </div>
                </div>
              </div>

              {/* Target Audience Segment */}
              <div className="space-y-2.5 pt-3 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-semibold text-foreground">Target Audience</Label>
                    <p className="text-[11px] text-muted-foreground">Select who will receive this broadcast</p>
                  </div>
                  <div className="flex items-center gap-1 p-0.5 rounded-lg border bg-muted/30 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setAudienceType("event")}
                      className={cn(
                        "px-2.5 py-1 rounded-md font-medium transition-colors",
                        audienceType === "event"
                          ? "bg-background text-foreground shadow-2xs font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Event Attendees
                    </button>
                    <button
                      type="button"
                      onClick={() => setAudienceType("contact_list")}
                      className={cn(
                        "px-2.5 py-1 rounded-md font-medium transition-colors",
                        audienceType === "contact_list"
                          ? "bg-background text-foreground shadow-2xs font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Contact List
                    </button>
                  </div>
                </div>

                {audienceType === "event" ? (
                  <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                    <SelectTrigger className="text-xs h-9 bg-background w-full">
                      <SelectValue placeholder="Select target event attendees">
                        {currentEvent ? (
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{currentEvent.title}</span>
                            <StatusBadge status={currentEvent.status} className="h-4.5 px-2 text-[10px]" />
                          </div>
                        ) : undefined}
                      </SelectValue>
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
                          <SelectItem key={evt.id} value={evt.id} className="text-xs py-2">
                            <div className="flex items-center justify-between gap-3 w-full">
                              <span className="truncate font-medium">{evt.title}</span>
                              <StatusBadge status={evt.status} className="h-4.5 px-2 text-[10px] shrink-0" />
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                ) : (
                  <Select value={selectedListId} onValueChange={setSelectedListId}>
                    <SelectTrigger className="text-xs h-9 bg-background w-full">
                      <SelectValue placeholder="Select custom audience contact list">
                        {contactLists.find((l) => l.id === selectedListId) ? (
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">
                              {contactLists.find((l) => l.id === selectedListId)?.name}
                            </span>
                            <Badge variant="secondary" className="h-4.5 px-2 text-[10px] font-mono">
                              {contactLists.find((l) => l.id === selectedListId)?.entries_count || 0} contacts
                            </Badge>
                          </div>
                        ) : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingLists ? (
                        <SelectItem value="loading" disabled>
                          Loading contact lists...
                        </SelectItem>
                      ) : contactLists.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No contact lists found
                        </SelectItem>
                      ) : (
                        contactLists.map((list) => (
                          <SelectItem key={list.id} value={list.id} className="text-xs py-2">
                            <div className="flex items-center justify-between gap-3 w-full">
                              <span className="truncate font-medium">{list.name}</span>
                              <Badge variant="secondary" className="h-4.5 px-2 text-[10px] font-mono shrink-0">
                                {list.entries_count || 0} contacts
                              </Badge>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Email Subject Line (if Email channel is selected) */}
            {channel === "email" && (
              <div className="space-y-1.5 rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
                <Label htmlFor="email-subject" className="text-xs font-semibold text-foreground">
                  Email Subject Line <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email-subject"
                  placeholder="e.g. Your Ticket & Entry Pass for Gize Concert Night"
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  className="text-xs h-9 bg-background"
                  required={channel === "email"}
                />
              </div>
            )}

            {/* 2. Message Composer Area with Bottom Attached Toolbar */}
            <div className="space-y-2">
              <Label htmlFor="message-body" className="text-xs font-semibold text-foreground">
                Message Content
              </Label>

              <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden focus-within:ring-2 focus-within:ring-lime-500/40 focus-within:border-lime-600 transition-all">
                <Textarea
                  id="message-body"
                  ref={textareaRef}
                  rows={8}
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="Type your message here..."
                  className="w-full border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-[13.5px] leading-relaxed resize-none p-4 bg-transparent font-normal"
                  required
                />

                {/* Attached Bottom Formatting Toolbar */}
                <div className="flex flex-wrap items-center gap-1.5 px-3.5 py-2.5 border-t border-border/60 bg-muted/20">
                  {/* Personalization Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7.5 text-xs gap-1.5 px-3 bg-background shadow-2xs font-medium text-foreground hover:bg-muted"
                      >
                        <HugeiconsIcon icon={UserIcon} size={13} className="text-lime-600 dark:text-lime-400" />
                        <span className="hidden sm:inline">Personalize (Name, Link...)</span>
                        <span className="sm:hidden">Personalize</span>
                        <HugeiconsIcon icon={ArrowDown01Icon} size={12} className="opacity-60" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-72 p-1.5">
                      <div className="px-2 py-1.5 border-b border-border/50 mb-1">
                        <p className="text-xs font-semibold text-foreground">Personalize Message</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Automatically replaces with each recipient&apos;s real info when sent.
                        </p>
                      </div>
                      {MERGE_TAGS.map((t) => (
                        <DropdownMenuItem
                          key={t.tag}
                          onClick={() => handleInsertTag(t.tag)}
                          className="flex items-start gap-2.5 px-2.5 py-1.5 cursor-pointer rounded-lg hover:bg-muted/60"
                        >
                          <div className="p-1 rounded-md bg-muted shrink-0 mt-0.5">
                            {t.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="font-semibold text-xs text-foreground">{t.label}</span>
                              <code className="font-mono text-[10px] text-muted-foreground bg-muted/70 px-1 py-0.5 rounded">
                                {t.tag}
                              </code>
                            </div>
                            <p className="text-[10.5px] text-muted-foreground mt-0.5 leading-snug">
                              {t.desc} <span className="text-foreground/70">({t.sample})</span>
                            </p>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Insert Link Button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => insertAtCursor("{{event_link}}")}
                    className="h-7.5 text-xs gap-1.5 px-3 bg-background shadow-2xs text-muted-foreground hover:text-foreground"
                  >
                    <HugeiconsIcon icon={Link01Icon} size={13} />
                    Insert link
                  </Button>

                  {/* Event Link Quick Button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => insertAtCursor("{{event_link}}")}
                    className="h-7.5 text-xs gap-1.5 px-3 bg-background shadow-2xs text-muted-foreground hover:text-foreground"
                  >
                    <HugeiconsIcon icon={Calendar03Icon} size={13} />
                    Event link
                  </Button>

                  {/* Shorten Link Pill */}
                  <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] text-muted-foreground border bg-background/60 shadow-2xs">
                    <HugeiconsIcon icon={Link01Icon} size={12} className="text-lime-600 dark:text-lime-400" />
                    <span>Shorten link</span>
                  </div>

                  {/* Emoji Picker Popover */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7.5 w-7.5 p-0 ml-auto text-base hover:bg-muted/80 rounded-md"
                        title="Add emoji"
                      >
                        😊
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-52 p-2">
                      <p className="text-[10px] font-semibold text-muted-foreground mb-1.5 px-1">
                        Insert Emoji
                      </p>
                      <div className="grid grid-cols-4 gap-1">
                        {POPULAR_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleInsertEmoji(emoji)}
                            className="h-8 text-base flex items-center justify-center rounded hover:bg-muted/80 transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* 3. Real-Time Metrics & Cost Cards */}
            <div className="grid grid-cols-3 gap-3">
              {/* Character Counter */}
              <div className="rounded-2xl border border-border/80 bg-card p-3.5 shadow-2xs">
                <p className="text-[11px] text-muted-foreground font-medium">Characters</p>
                <p className="text-base font-bold text-foreground mt-0.5 font-mono">
                  {charLength} <span className="text-xs font-normal text-muted-foreground">/ 1600</span>
                </p>
              </div>

              {/* Estimated Segments */}
              <div className="rounded-2xl border border-border/80 bg-card p-3.5 shadow-2xs">
                <div className="flex items-center gap-1">
                  <p className="text-[11px] text-muted-foreground font-medium">Estimated segments</p>
                  <span title="SMS messages over 160 standard characters (or 70 unicode characters) are delivered across concatenated segments.">
                    <HugeiconsIcon icon={InformationCircleIcon} size={11} className="text-muted-foreground opacity-70" />
                  </span>
                </div>
                <p className="text-base font-bold text-foreground mt-0.5 font-mono">
                  {segmentCount}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  ~{segmentLimit} chars per segment
                </p>
              </div>

              {/* Dynamic Status Pill */}
              <div className="rounded-2xl border border-border/80 bg-card p-3.5 flex flex-col justify-center shadow-2xs">
                {segmentCount <= 1 ? (
                  <div className="space-y-0.5">
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-semibold text-[11px] gap-1 px-2.5 py-0.5">
                      Looks good! 👍
                    </Badge>
                    <p className="text-[10px] text-muted-foreground mt-1">1 credit per recipient</p>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 font-semibold text-[11px] gap-1 px-2.5 py-0.5">
                      {segmentCount} segments ⚠️
                    </Badge>
                    <p className="text-[10px] text-muted-foreground mt-1">{segmentCount} credits per recipient</p>
                  </div>
                )}
              </div>
            </div>

            {/* 4. SMS Compliance Callout */}
            <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 dark:bg-purple-950/20 p-4 flex items-start gap-3.5">
              <div className="flex size-7.5 items-center justify-center rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5">
                <HugeiconsIcon icon={Shield01Icon} size={17} />
              </div>
              <div className="flex-1 text-xs">
                <p className="font-semibold text-foreground">SMS compliance</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                  We will automatically include &quot;Reply STOP to opt out&quot; to comply with international SMS regulations.
                </p>
                <a
                  href="#compliance-info"
                  onClick={(e) => {
                    e.preventDefault()
                    toast.info("Anti-Spam & Carrier Regulations", {
                      description:
                        "Carriers require mandatory opt-out instructions for promotional SMS broadcasts. STOP keywords are handled automatically.",
                    })
                  }}
                  className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline mt-1.5 inline-flex items-center gap-0.5"
                >
                  Learn more <HugeiconsIcon icon={ArrowRight01Icon} size={11} />
                </a>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-border/60">
              <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isCreating}
                className="gap-2 shadow-xs font-semibold px-5"
              >
                {isCreating ? (
                  <>
                    <HugeiconsIcon icon={Loading03Icon} size={14} className="animate-spin" />
                    Saving Campaign...
                  </>
                ) : (
                  "Save & Prepare Launch"
                )}
              </Button>
            </div>
          </div>

          {/* ─── RIGHT COLUMN: STICKY LIVE PHONE MOCKUP (5 COLS) ──────────── */}
          <div
            className={cn(
              "lg:col-span-5 flex flex-col items-center justify-center lg:sticky lg:top-6",
              activeMobileTab === "compose" ? "hidden lg:flex" : "flex"
            )}
          >
            {/* Realistic Smartphone Body Frame */}
            <div className="relative w-full max-w-[325px] aspect-[9/18.8] bg-card rounded-[44px] p-3 shadow-2xl border-4 border-muted/80 dark:border-muted/30 ring-1 ring-border/80 flex flex-col overflow-hidden">
              {/* Dynamic Island Pill */}
              <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-full z-30 flex items-center justify-between px-2">
                <div className="size-2 rounded-full bg-slate-900" />
                <div className="size-2 rounded-full bg-emerald-950/80" />
              </div>

              {/* Status Bar */}
              <div className="flex items-center justify-between px-4 pt-1.5 pb-2 text-[11px] font-semibold text-foreground shrink-0 z-20">
                <span>9:41</span>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span>5G</span>
                  <div className="w-4 h-2 rounded-xs border border-foreground/60 p-0.5 flex items-center">
                    <div className="h-full w-full bg-foreground rounded-2xs" />
                  </div>
                </div>
              </div>

              {/* Screen Canvas Container */}
              <div className="flex-1 flex flex-col rounded-[32px] overflow-hidden bg-background border border-border/40 relative">
                {channel === "sms" ? (
                  <>
                    {/* Messages App Header */}
                    <div className="flex items-center justify-between px-3 py-2 border-b border-border/40 bg-muted/20 shrink-0">
                      <span className="text-xs text-primary font-medium cursor-pointer flex items-center">
                        ‹
                      </span>
                      <div className="flex flex-col items-center">
                        <div className="flex size-7 items-center justify-center rounded-full bg-muted font-bold text-xs text-foreground">
                          DG
                        </div>
                        <span className="text-[10px] font-semibold text-foreground mt-0.5 flex items-center gap-0.5">
                          Digis Events <span className="text-[9px] text-muted-foreground">›</span>
                        </span>
                      </div>
                      <span className="size-4" />
                    </div>

                    {/* Chat Bubble Canvas */}
                    <div className="flex-1 p-3 overflow-y-auto flex flex-col justify-end space-y-2">
                      <p className="text-[10px] text-center text-muted-foreground font-medium mb-1">
                        Text Message • Today 9:41 AM
                      </p>

                      <div className="self-start max-w-[92%] rounded-[18px] rounded-bl-[4px] bg-muted/80 text-foreground px-3.5 py-3 text-[11.5px] leading-relaxed shadow-2xs space-y-2">
                        <p className="whitespace-pre-line break-words">
                          {previewMessage || "Your preview message will appear here as you type..."}
                        </p>

                        <div className="pt-1.5 border-t border-border/40 text-[9.5px] text-muted-foreground">
                          Reply STOP to opt out
                        </div>
                      </div>
                    </div>

                    {/* Bottom iMessage Bar */}
                    <div className="p-2 border-t border-border/40 bg-muted/10 flex items-center gap-1.5 shrink-0">
                      <div className="flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-bold">
                        +
                      </div>
                      <div className="flex-1 h-7 rounded-full border border-border/80 bg-background px-3 text-[11px] text-muted-foreground flex items-center justify-between">
                        <span>Text Message</span>
                        <span className="text-[10px] text-muted-foreground">🎙️</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Email App Header */}
                    <div className="flex items-center justify-between px-3 py-2 border-b border-border/40 bg-muted/20 shrink-0">
                      <span className="text-xs text-primary font-medium flex items-center">
                        ‹ Inbox
                      </span>
                      <span className="text-[10px] font-semibold text-foreground">
                        Email Campaign
                      </span>
                      <span className="text-xs text-muted-foreground">•••</span>
                    </div>

                    {/* Email Body Canvas */}
                    <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs">
                      <div className="border-b border-border/40 pb-2 space-y-1">
                        <p className="font-bold text-sm text-foreground">
                          {messageSubject || "Your Event Pass & Information"}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <span className="font-semibold text-foreground">Digis Events</span>
                          <span>&lt;broadcast@digis.et&gt;</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-card border border-border/60 text-[11.5px] leading-relaxed space-y-2">
                        <p className="whitespace-pre-line break-words text-foreground">
                          {previewMessage || "Write your email message..."}
                        </p>

                        {selectedEventId && (
                          <div className="mt-2 pt-2 border-t border-border/40 text-center">
                            <Button
                              size="sm"
                              type="button"
                              className="h-7 text-xs w-full bg-lime-600 hover:bg-lime-700 text-white font-semibold"
                            >
                              View Event Tickets
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground text-center mt-3 font-medium">
              Live attendee phone preview with variable resolution
            </p>
          </div>
        </div>
      </form>

      {/* ─── SEND TEST SMS POPUP ─────────────────────────────────────────── */}
      <Dialog open={testModalOpen} onOpenChange={setTestModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <HugeiconsIcon icon={SmartPhone01Icon} size={18} />
              </div>
              <div>
                <DialogTitle className="text-sm font-semibold">Send Test SMS</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Verify message formatting on a real mobile device
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label htmlFor="test-phone-field" className="text-xs font-medium">
                Your Phone Number
              </Label>
              <Input
                id="test-phone-field"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="+251 91 123 4567"
                className="font-mono text-xs h-9"
              />
              <p className="text-[10px] text-muted-foreground">
                Supported formats: +251 9XXXXXXXX or 09XXXXXXXX
              </p>
            </div>

            <div className="p-2.5 rounded-lg border bg-muted/20 text-[11px] text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">Message Preview:</p>
              <p className="line-clamp-3 font-mono text-[10.5px]">
                {previewMessage}
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTestModalOpen(false)}
              disabled={isSendingTest}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSendTestSms}
              disabled={isSendingTest}
              className="gap-1.5 shadow-xs font-medium"
            >
              {isSendingTest ? (
                <>
                  <HugeiconsIcon icon={Loading03Icon} size={13} className="animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Test SMS"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
