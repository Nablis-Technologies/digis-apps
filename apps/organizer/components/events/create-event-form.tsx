"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Add01Icon,
  Calendar03Icon,
  TicketIcon,
  UserGroupIcon,
  GlobeIcon,
  EyeOffIcon,
  CalendarCheckIcon,
  GiftIcon,
  Link01Icon,
  CheckmarkCircle01Icon,
  Rocket01Icon,
  Loading01Icon,
  Key01Icon,
  LockIcon,
  Cancel01Icon,
  Remove01Icon,
  Copy01Icon,
  Upload01Icon,
  CircleMinusIcon,
  ArrowDown01Icon,
} from "@hugeicons/core-free-icons"

type TicketTypeInput = {
  name: string
  price: number | string
  quantity: number | string
  description: string
  maxPerPerson: string
  salesStart: string
  salesEnd: string
}

type EntryType = "ticketed" | "rsvp" | "free" | "invite_only"
type Visibility = "public" | "private"

type InviteCodeInput = {
  _id: string
  code: string
  label: string
  useType: "unlimited" | "single" | "limited"
  maxUses: string
  hasExpiry: boolean
  expiresAt: string
}

type GuestInput = {
  _id: string
  name: string
  contact: string
  personalLink: string
  allowedGuests: number
}

const ENTRY_TYPES: { value: EntryType; label: string; desc: string; icon: React.ReactNode; color: string; bgClass: string; textClass: string; borderClass: string }[] = [
  {
    value: "ticketed",
    label: "Ticketed",
    desc: "Paid entry — sell General, VIP, VVIP tiers",
    icon: <HugeiconsIcon icon={TicketIcon} strokeWidth={2} className="size-5" />,
    color: "--chart-1",
    bgClass: "bg-chart-1",
    textClass: "text-chart-1",
    borderClass: "border-chart-1",
  },
  {
    value: "rsvp",
    label: "RSVP",
    desc: "Free registration, optional approval queue",
    icon: <HugeiconsIcon icon={CalendarCheckIcon} strokeWidth={2} className="size-5" />,
    color: "--event-rsvp",
    bgClass: "bg-event-rsvp",
    textClass: "text-event-rsvp",
    borderClass: "border-event-rsvp",
  },
  {
    value: "free",
    label: "Free Entry",
    desc: "No tickets, no registration — just show up",
    icon: <HugeiconsIcon icon={GiftIcon} strokeWidth={2} className="size-5" />,
    color: "--chart-3",
    bgClass: "bg-chart-3",
    textClass: "text-chart-3",
    borderClass: "border-chart-3",
  },
  {
    value: "invite_only",
    label: "Invite Only",
    desc: "Code-gated or curated guest list access",
    icon: <HugeiconsIcon icon={LockIcon} strokeWidth={2} className="size-5" />,
    color: "--event-invite",
    bgClass: "bg-event-invite",
    textClass: "text-event-invite",
    borderClass: "border-event-invite",
  },
]

const VISIBILITY_OPTIONS: { value: Visibility; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    value: "public",
    label: "Public",
    desc: "Listed on the browse page, anyone can find it",
    icon: <HugeiconsIcon icon={GlobeIcon} strokeWidth={2} className="size-4" />,
  },
  {
    value: "private",
    label: "Private",
    desc: "Hidden from browse — share the direct link yourself",
    icon: <HugeiconsIcon icon={EyeOffIcon} strokeWidth={2} className="size-4" />,
  },
]

const steps = ["Event Type", "Event Details", "Entry Settings", "Recurring", "Review & Publish"]

function generateCode(length = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
}

function generateGuestSlug(name: string, contact: string): string {
  const base = (name || contact).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8)
  const rand = Math.random().toString(36).slice(2, 6)
  return `tikket.et/g/${base}${rand}`
}

function parseGuestCSV(text: string): Array<{ name: string; contact: string; personalLink: string }> {
  const lines = text.trim().split(/\r?\n/)
  const header = lines[0].toLowerCase().split(",").map((s) => s.trim().replace(/"/g, ""))
  const get = (cols: string[], keys: string[]) => {
    for (const k of keys) {
      const i = header.indexOf(k)
      if (i >= 0 && cols[i]) return cols[i].trim().replace(/"/g, "")
    }
    return ""
  }
  return lines
    .slice(1)
    .map((line) => {
      const cols = line.split(",")
      return {
        name: get(cols, ["name", "full name", "fullname"]),
        contact: get(cols, ["contact", "phone", "email", "phone or email"]),
        personalLink: get(cols, ["link", "personallink", "personal link", "url"]),
      }
    })
    .filter((g) => g.contact.trim())
}

interface CreateEventFormProps {
  onSuccess?: () => void
}

export function CreateEventForm({ onSuccess }: CreateEventFormProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<{ title?: string; date?: string; location?: string }>({})

  const [entryType, setEntryType] = useState<EntryType>("ticketed")
  const [visibility, setVisibility] = useState<Visibility>("public")

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("19:00")
  const [endDate, setEndDate] = useState("")
  const [endTime, setEndTime] = useState("")
  const [location, setLocation] = useState("")
  const [onlineUrl, setOnlineUrl] = useState("")
  const [bannerImage, setBannerImage] = useState("")

  const [requiresApproval, setRequiresApproval] = useState(false)
  const [rsvpCapacity, setRsvpCapacity] = useState("")
  const [ticketTypes, setTicketTypes] = useState<TicketTypeInput[]>([
    { name: "General Admission", price: "", quantity: "", description: "", maxPerPerson: "", salesStart: "", salesEnd: "" },
  ])

  const [useCodesSection, setUseCodesSection] = useState(false)
  const [inviteCodes, setInviteCodes] = useState<InviteCodeInput[]>([])
  const [newCode, setNewCode] = useState<Omit<InviteCodeInput, "_id">>({
    code: "",
    label: "",
    useType: "unlimited",
    maxUses: "",
    hasExpiry: false,
    expiresAt: "",
  })

  const [useGuestSection, setUseGuestSection] = useState(false)
  const [usePaidTickets, setUsePaidTickets] = useState(false)
  const [guests, setGuests] = useState<GuestInput[]>([])
  const [newGuest, setNewGuest] = useState<Omit<GuestInput, "_id">>({
    name: "",
    contact: "",
    personalLink: "",
    allowedGuests: 0,
  })
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null)
  const [editGuestForm, setEditGuestForm] = useState({ name: "", contact: "", personalLink: "", allowedGuests: 0 })

  // Toggle states for optional sections
  const [showEndDateTime, setShowEndDateTime] = useState(false)
  const [showOnlineLink, setShowOnlineLink] = useState(false)
  const [showBannerImage, setShowBannerImage] = useState(false)
  const [showTicketOptionalFields, setShowTicketOptionalFields] = useState<{ [key: number]: boolean }>({})

  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrenceType, setRecurrenceType] = useState<"weekly" | "biweekly" | "monthly" | "custom">("weekly")
  const [occurrenceCount, setOccurrenceCount] = useState(4)
  const [customDates, setCustomDates] = useState<string[]>([])
  const [isCreating, setIsCreating] = useState(false)

  const addTicketType = () =>
    setTicketTypes((p) => [...p, { name: "", price: "", quantity: "", description: "", maxPerPerson: "", salesStart: "", salesEnd: "" }])
  const removeTicketType = (i: number) =>
    setTicketTypes((p) => p.filter((_, idx) => idx !== i))
  const updateTicketType = (i: number, key: keyof TicketTypeInput, value: string) =>
    setTicketTypes((p) => p.map((t, idx) => (idx === i ? { ...t, [key]: value } : t)))

  const addInviteCode = () => {
    if (!newCode.code.trim()) return
    setInviteCodes((p) => [...p, { ...newCode, code: newCode.code.trim().toUpperCase(), _id: crypto.randomUUID() }])
    setNewCode({ code: "", label: "", useType: "unlimited", maxUses: "", hasExpiry: false, expiresAt: "" })
  }

  const handleCreate = async (publish: boolean) => {
    setError("")
    const dateTime = date && time ? `${date}T${time}:00` : ""
    if (!title || !dateTime || !location) {
      setError("Please fill in all required fields.")
      return
    }

    let validTypes = ticketTypes.filter((t) => t.name && Number(t.quantity) > 0)
    if (entryType === "ticketed" && validTypes.length === 0) {
      setError("Add at least one ticket type with name and quantity.")
      return
    }
    if (entryType !== "ticketed") {
      validTypes = [{ name: "Registration", price: "0", quantity: rsvpCapacity || "9999", description: "", maxPerPerson: "", salesStart: "", salesEnd: "" }]
    }

    if (isRecurring) {
      if (generatedDates.length < 2) {
        setError("Add at least 2 dates to create a series.")
        return
      }
      setIsCreating(true)
    }

    setIsCreating(true)
    try {
      const payload = {
        title,
        description: description || undefined,
        date: new Date(dateTime).toISOString(),
        endDate: endDate && endTime ? new Date(`${endDate}T${endTime}:00`).toISOString() : undefined,
        location,
        onlineUrl: onlineUrl || undefined,
        bannerImage: bannerImage || undefined,
        visibility,
        entryType,
        requiresApproval: requiresApproval || undefined,
        rsvpCapacity: rsvpCapacity ? Number(rsvpCapacity) : undefined,
        ticketTypes: validTypes.map((t) => ({
          name: t.name,
          price: Number(t.price) || 0,
          quantity: Number(t.quantity),
          description: t.description || undefined,
          maxPerPerson: t.maxPerPerson ? Number(t.maxPerPerson) : undefined,
          salesStart: t.salesStart ? new Date(t.salesStart).toISOString() : undefined,
          salesEnd: t.salesEnd ? new Date(t.salesEnd).toISOString() : undefined,
        })),
        inviteCodes: inviteCodes.map((c) => ({
          code: c.code,
          label: c.label || undefined,
          maxUses: c.useType === "single" ? 1 : c.useType === "limited" ? Number(c.maxUses) || undefined : undefined,
          expiresAt: c.hasExpiry && c.expiresAt ? new Date(c.expiresAt).toISOString() : undefined,
        })),
        guests: guests.map((g) => ({
          name: g.name || undefined,
          contact: g.contact,
          personalLink: g.personalLink || undefined,
          allowedGuests: g.allowedGuests,
        })),
        publish,
      }
      console.log("Create event payload:", payload)
      if (onSuccess) onSuccess()
      else router.push(`/organizer/events`)
    } catch (err) {
      setError((err as Error).message || "Failed to create event.")
    } finally {
      setIsCreating(false)
    }
  }

  const isLoading = isCreating
  const generatedDates = (() => {
    if (!date || !time) return []
    if (recurrenceType === "custom") return customDates
    const result: string[] = []
    const start = new Date(`${date}T${time}:00`)
    for (let i = 0; i < occurrenceCount; i++) {
      const d = new Date(start)
      if (recurrenceType === "weekly") d.setDate(d.getDate() + i * 7)
      else if (recurrenceType === "biweekly") d.setDate(d.getDate() + i * 14)
      else if (recurrenceType === "monthly") d.setMonth(d.getMonth() + i)
      result.push(d.toISOString())
    }
    return result
  })()
  const totalCapacity = ticketTypes.reduce((s, t) => s + (Number(t.quantity) || 0), 0)
  const selectedEntryType = ENTRY_TYPES.find((e) => e.value === entryType)!

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="sticky top-0 z-10 bg-popover pb-2">
      {/* Step indicators */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className="flex items-center gap-2">
              <div
                className={`size-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  i < step 
                    ? `${selectedEntryType.bgClass} text-white` 
                    : i === step 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {i < step ? <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-3.5" /> : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${i === step ? "text-foreground" : "text-muted-foreground"}`}>
                {s}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px ${i < step ? selectedEntryType.bgClass : "bg-border/50"}`} />
            )}
          </div>
        ))}
      </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
      <AnimatePresence mode="wait">
        {/* ─── Step 0: Event Type ─────────────────────────────────────── */}
        {step === 0 && (
          <motion.div
            key="type"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <div>
              <h2 className="font-bold text-lg mb-1">How do people get in?</h2>
              <p className="text-muted-foreground text-sm">Choose the entry model for your event</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {ENTRY_TYPES.map((et) => (
                <button
                  key={et.value}
                  onClick={() => {
                    setEntryType(et.value)
                    if (et.value === "invite_only") {
                      setVisibility("private")
                    }
                  }}
                  className={`text-left p-4 rounded-2xl border-2 transition-all ${
                    entryType === et.value ? `${et.borderClass} ${et.bgClass}/10` : "border-border/40 hover:border-border bg-card/50"
                  }`}
                >
                  <div className={`mb-2 ${entryType === et.value ? et.textClass : "text-muted-foreground"}`}>
                    {et.icon}
                  </div>
                  <div className="font-semibold text-sm">{et.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{et.desc}</div>
                </button>
              ))}
            </div>

            <div>
              <h2 className="font-bold text-base mb-1">Who can discover this event?</h2>
              <p className="text-muted-foreground text-sm mb-3">Controls whether it appears in the browse page</p>
              <div className="space-y-2">
                {VISIBILITY_OPTIONS.map((v) => (
                  <button
                    key={v.value}
                    onClick={() => setVisibility(v.value)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all flex items-start gap-3 ${
                      visibility === v.value ? `${selectedEntryType.borderClass} ${selectedEntryType.bgClass}/10` : "border-border/40 hover:border-border bg-card/50"
                    }`}
                  >
                    <div className={`mt-0.5 ${visibility === v.value ? selectedEntryType.textClass : "text-muted-foreground"}`}>
                      {v.icon}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{v.label}</div>
                      <div className="text-xs text-muted-foreground">{v.desc}</div>
                    </div>
                    {visibility === v.value && (
                      <div className={`ml-auto size-4 ${selectedEntryType.bgClass} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-2.5 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

          </motion.div>
        )}

        {/* ─── Step 1: Event Details ──────────────────────────────────── */}
        {step === 1 && (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-5"
          >
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="success" className="text-xs gap-1.5 font-semibold">
                {selectedEntryType.icon}
                {selectedEntryType.label}
              </Badge>
              <Badge 
                variant={visibility === "public" ? "info" : "violet"} 
                className="text-xs gap-1.5 font-semibold"
              >
                {VISIBILITY_OPTIONS.find((v) => v.value === visibility)?.icon}
                {visibility.charAt(0).toUpperCase() + visibility.slice(1)}
              </Badge>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-semibold">
                Event Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g. Addis Jazz Festival 2026"
                value={title}
                onChange={(e) => { setTitle(e.target.value); if (fieldErrors.title) setFieldErrors((p) => ({ ...p, title: undefined })) }}
                className={`h-11 ${fieldErrors.title ? "border-destructive focus-visible:border-destructive" : ""}`}
                autoFocus
              />
              {fieldErrors.title && <p className="text-destructive text-xs">{fieldErrors.title}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc" className="text-sm font-semibold">Description</Label>
              <textarea
                id="desc"
                placeholder="Tell people what to expect at your event..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex min-h-[100px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Date <span className="text-destructive">*</span></Label>
                <Input type="date" value={date} onChange={(e) => { setDate(e.target.value); if (fieldErrors.date) setFieldErrors((p) => ({ ...p, date: undefined })) }} className={`h-11 ${fieldErrors.date ? "border-destructive focus-visible:border-destructive" : ""}`} />
                {fieldErrors.date && <p className="text-destructive text-xs">{fieldErrors.date}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Start Time <span className="text-destructive">*</span></Label>
                <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-11" />
              </div>
            </div>

            {/* Optional: End Date/Time */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowEndDateTime(!showEndDateTime)}
                className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <HugeiconsIcon 
                  icon={ArrowDown01Icon} 
                  strokeWidth={2} 
                  className={`size-4 transition-transform ${showEndDateTime ? 'rotate-180' : ''}`} 
                />
                End Date & Time (optional)
              </button>
              <AnimatePresence initial={false}>
                {showEndDateTime && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">End Date</Label>
                        <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-11" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">End Time</Label>
                        <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="h-11" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-semibold">
                Venue / Location <span className="text-destructive">*</span>
              </Label>
              <Input
                id="location"
                placeholder="e.g. Millennium Hall, Addis Ababa"
                value={location}
                onChange={(e) => { setLocation(e.target.value); if (fieldErrors.location) setFieldErrors((p) => ({ ...p, location: undefined })) }}
                className={`h-11 ${fieldErrors.location ? "border-destructive focus-visible:border-destructive" : ""}`}
              />
              {fieldErrors.location && <p className="text-destructive text-xs">{fieldErrors.location}</p>}
            </div>

            {/* Optional: Online Link */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowOnlineLink(!showOnlineLink)}
                className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <HugeiconsIcon 
                  icon={ArrowDown01Icon} 
                  strokeWidth={2} 
                  className={`size-4 transition-transform ${showOnlineLink ? 'rotate-180' : ''}`} 
                />
                Online Link (optional)
              </button>
              <AnimatePresence initial={false}>
                {showOnlineLink && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="relative pt-2">
                      <HugeiconsIcon
                        icon={Link01Icon}
                        strokeWidth={2}
                        className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
                      />
                      <Input
                        id="onlineUrl"
                        placeholder="https://zoom.us/j/..."
                        value={onlineUrl}
                        onChange={(e) => setOnlineUrl(e.target.value)}
                        className="h-11 pl-10"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Optional: Banner Image */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowBannerImage(!showBannerImage)}
                className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <HugeiconsIcon 
                  icon={ArrowDown01Icon} 
                  strokeWidth={2} 
                  className={`size-4 transition-transform ${showBannerImage ? 'rotate-180' : ''}`} 
                />
                Banner Image (optional)
              </button>
              <AnimatePresence initial={false}>
                {showBannerImage && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-2 pt-2">
                      <Input
                        id="banner"
                        placeholder="https://..."
                        value={bannerImage}
                        onChange={(e) => setBannerImage(e.target.value)}
                        className="h-11"
                      />
                      {bannerImage && (
                        <img
                          src={bannerImage}
                          alt="Banner preview"
                          className="h-32 w-full object-cover rounded-xl mt-2"
                          onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </motion.div>
        )}

        {/* ─── Step 2: Entry Settings ─────────────────────────────────── */}
        {step === 2 && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* Ticketed */}
            {entryType === "ticketed" && (
              <div className="space-y-4">
                <div>
                  <h2 className="font-bold text-base mb-1">Ticket Types</h2>
                  <p className="text-muted-foreground text-sm">Add General, VIP, VVIP or any custom tier</p>
                </div>
                {ticketTypes.map((t, i) => (
                  <div key={i} className="bg-card border border-border/60 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">Ticket Type {i + 1}</h4>
                      {ticketTypes.length > 1 && (
                        <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-destructive" onClick={() => removeTicketType(i)}>
                          <HugeiconsIcon icon={Remove01Icon} strokeWidth={2} className="size-3.5" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-3 space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Name</Label>
                        <Input placeholder="e.g. VIP" value={t.name} onChange={(e) => updateTicketType(i, "name", e.target.value)} className="h-9" />
                      </div>
                      <div className="col-span-1 space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Price (ETB)</Label>
                        <Input type="number" placeholder="500" value={t.price} onChange={(e) => updateTicketType(i, "price", e.target.value)} className="h-9" min="0" />
                      </div>
                      <div className="col-span-1 space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Quantity</Label>
                        <Input type="number" placeholder="100" value={t.quantity} onChange={(e) => updateTicketType(i, "quantity", e.target.value)} className="h-9" min="1" />
                      </div>
                      <div className="col-span-1 space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Revenue</Label>
                        <div className="h-9 flex items-center text-sm font-semibold text-primary">
                          {(Number(t.price || 0) * Number(t.quantity || 0)).toLocaleString()} ETB
                        </div>
                      </div>
                    </div>
                    
                    {/* Optional: Advanced ticket settings */}
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowTicketOptionalFields(prev => ({ ...prev, [i]: !prev[i] }))}
                        className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <HugeiconsIcon 
                          icon={ArrowDown01Icon} 
                          strokeWidth={2} 
                          className={`size-3.5 transition-transform ${showTicketOptionalFields[i] ? 'rotate-180' : ''}`} 
                        />
                        Advanced settings (optional)
                      </button>
                      <AnimatePresence initial={false}>
                        {showTicketOptionalFields[i] && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-3 space-y-3">
                              <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Description</Label>
                                <Input placeholder="What's included?" value={t.description} onChange={(e) => updateTicketType(i, "description", e.target.value)} className="h-9" />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                  <Label className="text-xs text-muted-foreground">Sales start</Label>
                                  <Input
                                    type="datetime-local"
                                    value={t.salesStart}
                                    onChange={(e) => updateTicketType(i, "salesStart", e.target.value)}
                                    className="h-9 text-xs"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs text-muted-foreground">Sales end</Label>
                                  <Input
                                    type="datetime-local"
                                    value={t.salesEnd}
                                    onChange={(e) => updateTicketType(i, "salesEnd", e.target.value)}
                                    className="h-9 text-xs"
                                  />
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Max tickets per person</Label>
                                <Input
                                  type="number"
                                  placeholder="No limit"
                                  value={t.maxPerPerson}
                                  onChange={(e) => updateTicketType(i, "maxPerPerson", e.target.value)}
                                  className="h-9"
                                  min="1"
                                />
                                <p className="text-[10px] text-muted-foreground">Prevents bulk purchasing — leave blank for no limit</p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full border-dashed border-border h-10" onClick={addTicketType}>
                  <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4 mr-2" /> Add another ticket type
                </Button>
              </div>
            )}

            {/* Invite Only */}
            {entryType === "invite_only" && (
              <div className="space-y-3">
                <div>
                  <h2 className="font-bold text-base mb-0.5">Access Control</h2>
                  <p className="text-muted-foreground text-sm">Choose how you want to restrict entry — use one or both methods below.</p>
                </div>

                {/* Pricing model */}
                <div className="bg-card border border-border/60 rounded-2xl p-4 space-y-3">
                  <div>
                    <p className="text-sm font-semibold">Entry pricing</p>
                    <p className="text-xs text-muted-foreground mt-0.5">How will invited guests attend?</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setUsePaidTickets(false)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl border text-left transition-all ${
                        !usePaidTickets ? `${selectedEntryType.borderClass} ${selectedEntryType.bgClass}/15 ${selectedEntryType.textClass}` : "border-border/40 text-muted-foreground hover:border-border"
                      }`}
                    >
                      <div className={`size-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${!usePaidTickets ? selectedEntryType.borderClass : "border-muted-foreground/40"}`}>
                        {!usePaidTickets && <div className={`size-2 rounded-full ${selectedEntryType.bgClass}`} />}
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none">Free</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">RSVP — no payment</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setUsePaidTickets(true); if (ticketTypes.length === 0) addTicketType() }}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl border text-left transition-all ${
                        usePaidTickets ? `${selectedEntryType.borderClass} ${selectedEntryType.bgClass}/10 ${selectedEntryType.textClass}` : "border-border/40 text-muted-foreground hover:border-border"
                      }`}
                    >
                      <div className={`size-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${usePaidTickets ? selectedEntryType.borderClass : "border-muted-foreground/40"}`}>
                        {usePaidTickets && <div className={`size-2 rounded-full ${selectedEntryType.bgClass}`} />}
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none">Paid</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Sell ticket tiers</p>
                      </div>
                    </button>
                  </div>

                  <AnimatePresence initial={false}>
                    {usePaidTickets && (
                      <motion.div
                        key="inline-tickets"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-2 pt-1">
                          {ticketTypes.map((t, i) => (
                            <div key={i} className="bg-background border border-border/50 rounded-xl p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">Tier {i + 1}</span>
                                {ticketTypes.length > 1 && (
                                  <Button variant="ghost" size="icon" className="size-6" onClick={() => removeTicketType(i)}>
                                    <HugeiconsIcon icon={Remove01Icon} strokeWidth={2} className="size-3" />
                                  </Button>
                                )}
                              </div>
                              <Input placeholder="e.g. VIP Access" value={t.name} onChange={(e) => updateTicketType(i, "name", e.target.value)} className="h-8 text-sm" />
                              <div className="grid grid-cols-2 gap-2">
                                <Input type="number" placeholder="Price (ETB)" value={t.price} onChange={(e) => updateTicketType(i, "price", e.target.value)} className="h-8 text-sm" min="0" />
                                <Input type="number" placeholder="Qty" value={t.quantity} onChange={(e) => updateTicketType(i, "quantity", e.target.value)} className="h-8 text-sm" min="1" />
                              </div>
                            </div>
                          ))}
                          <Button variant="outline" size="sm" className="w-full border-dashed" onClick={addTicketType}>
                            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-3 mr-1" /> Add tier
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Invite Codes toggle */}
                <div className={`rounded-2xl border transition-colors ${useCodesSection ? `${selectedEntryType.borderClass} ${selectedEntryType.bgClass}/10` : "border-border/50 bg-card/50"}`}>
                  <div
                    role="button"
                    tabIndex={0}
                    className="w-full flex items-center gap-3 p-4 text-left cursor-pointer"
                    onClick={() => setUseCodesSection((v) => !v)}
                    onKeyDown={(e) => e.key === "Enter" && setUseCodesSection((v) => !v)}
                  >
                    <div className={`p-2 rounded-xl flex-shrink-0 transition-colors ${useCodesSection ? `${selectedEntryType.bgClass}/15` : "bg-muted"}`}>
                      <HugeiconsIcon icon={Key01Icon} strokeWidth={2} className={`size-4 ${useCodesSection ? selectedEntryType.textClass : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">Invite Codes</p>
                        {inviteCodes.length > 0 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 h-4">{inviteCodes.length} added</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">Share codes — single-use, multi-use, or with expiry</p>
                    </div>
                    <Switch checked={useCodesSection} onCheckedChange={setUseCodesSection} className="flex-shrink-0" onClick={(e) => e.stopPropagation()} />
                  </div>

                  <AnimatePresence initial={false}>
                    {useCodesSection && (
                      <motion.div
                        key="codes-body"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-3 border-t border-border/40 pt-3">
                          <div className="flex gap-2">
                            <div className="flex-1 space-y-1">
                              <Label className="text-xs text-muted-foreground">Code</Label>
                              <div className="relative">
                                <Input
                                  placeholder="e.g. ADDIS2026"
                                  value={newCode.code}
                                  onChange={(e) => setNewCode((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                                  className="h-9 font-mono pr-9"
                                />
                                <button
                                  type="button"
                                  onClick={() => setNewCode((p) => ({ ...p, code: generateCode() }))}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                                  title="Generate random code"
                                >
                                  <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} className="size-3.5" />
                                </button>
                              </div>
                            </div>
                            <div className="flex-1 space-y-1">
                              <Label className="text-xs text-muted-foreground">Label (optional)</Label>
                              <Input
                                placeholder="e.g. VIP Access"
                                value={newCode.label}
                                onChange={(e) => setNewCode((p) => ({ ...p, label: e.target.value }))}
                                className="h-9"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Uses</Label>
                            <div className="flex gap-1.5">
                              {(["unlimited", "single", "limited"] as const).map((t) => (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => setNewCode((p) => ({ ...p, useType: t }))}
                                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center justify-center gap-1 ${
                                    newCode.useType === t ? `${selectedEntryType.borderClass} ${selectedEntryType.bgClass}/15 ${selectedEntryType.textClass}` : "border-border/40 text-muted-foreground hover:border-border"
                                  }`}
                                >
                                  {t === "unlimited" ? "Unlimited" : t === "single" ? "Single-use" : "Limited"}
                                </button>
                              ))}
                            </div>
                            {newCode.useType === "limited" && (
                              <Input
                                type="number"
                                placeholder="Max uses, e.g. 50"
                                value={newCode.maxUses}
                                onChange={(e) => setNewCode((p) => ({ ...p, maxUses: e.target.value }))}
                                className="h-8 mt-1"
                                min="1"
                              />
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium">Expiration date</p>
                              <p className="text-xs text-muted-foreground">Code becomes invalid after this date</p>
                            </div>
                            <Switch
                              checked={newCode.hasExpiry}
                              onCheckedChange={(v) => setNewCode((p) => ({ ...p, hasExpiry: v }))}
                            />
                          </div>
                          {newCode.hasExpiry && (
                            <Input
                              type="date"
                              value={newCode.expiresAt}
                              onChange={(e) => setNewCode((p) => ({ ...p, expiresAt: e.target.value }))}
                              className="h-9"
                              min={new Date().toISOString().split("T")[0]}
                            />
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full border-dashed"
                            onClick={addInviteCode}
                            disabled={!newCode.code.trim()}
                          >
                            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-3.5 mr-1.5" />
                            Add code
                          </Button>

                          {inviteCodes.length > 0 && (
                            <div className="space-y-1.5">
                              {inviteCodes.map((c) => (
                                <div key={c._id} className="flex items-center gap-2 px-3 py-2 bg-background border border-border/40 rounded-xl">
                                  <HugeiconsIcon icon={Key01Icon} strokeWidth={2} className={`size-3.5 ${selectedEntryType.textClass} flex-shrink-0`} />
                                  <code className="font-mono text-sm font-bold flex-1">{c.code}</code>
                                  {c.label && <span className="text-xs text-muted-foreground">{c.label}</span>}
                                  <Badge variant="outline" className="text-[10px] px-1.5">
                                    {c.useType === "unlimited" ? "∞" : c.useType === "single" ? "1×" : `${c.maxUses}×`}
                                  </Badge>
                                  {c.hasExpiry && c.expiresAt && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 text-muted-foreground">
                                      exp {c.expiresAt}
                                    </Badge>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setInviteCodes((p) => p.filter((x) => x._id !== c._id))}
                                    className="ml-auto text-muted-foreground hover:text-destructive transition-colors"
                                  >
                                    <HugeiconsIcon icon={Remove01Icon} strokeWidth={2} className="size-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Guest List toggle */}
                <div className={`rounded-2xl border transition-colors ${useGuestSection ? "border-lime-500/40 bg-lime-500/5" : "border-border/50 bg-card/50"}`}>
                  <div
                    role="button"
                    tabIndex={0}
                    className="w-full flex items-center gap-3 p-4 text-left cursor-pointer"
                    onClick={() => setUseGuestSection((v) => !v)}
                    onKeyDown={(e) => e.key === "Enter" && setUseGuestSection((v) => !v)}
                  >
                    <div className={`p-2 rounded-xl flex-shrink-0 transition-colors ${useGuestSection ? "bg-lime-500/15" : "bg-muted"}`}>
                      <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className={`size-4 ${useGuestSection ? "text-lime-500" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">Guest List</p>
                        {guests.length > 0 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 h-4">{guests.length} added</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">Pre-add VIPs by name, phone, or email with optional personal links</p>
                    </div>
                    <Switch checked={useGuestSection} onCheckedChange={setUseGuestSection} className="flex-shrink-0" onClick={(e) => e.stopPropagation()} />
                  </div>

                  <AnimatePresence initial={false}>
                    {useGuestSection && (
                      <motion.div
                        key="guest-body"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-3 border-t border-border/40 pt-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Name (optional)</Label>
                              <Input
                                placeholder="Biruk Tadesse"
                                value={newGuest.name}
                                onChange={(e) => setNewGuest((p) => ({ ...p, name: e.target.value }))}
                                className="h-9"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Phone or Email <span className="text-destructive">*</span></Label>
                              <Input
                                placeholder="+251 91... or email@..."
                                value={newGuest.contact}
                                onChange={(e) => setNewGuest((p) => ({ ...p, contact: e.target.value }))}
                                className="h-9"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Personalized link (optional, auto-generated if left blank)</Label>
                            <div className="relative">
                              <HugeiconsIcon icon={Link01Icon} strokeWidth={2} className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                              <Input
                                placeholder="tikket.et/g/… (auto-generated)"
                                value={newGuest.personalLink}
                                onChange={(e) => setNewGuest((p) => ({ ...p, personalLink: e.target.value }))}
                                className="h-9 pl-8"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Allowed guests</Label>
                            <div className="flex items-center gap-1">
                              {[0, 1, 2, 3].map((n) => (
                                <button
                                  key={n}
                                  type="button"
                                  onClick={() => setNewGuest((p) => ({ ...p, allowedGuests: n }))}
                                  className={`h-7 px-2.5 rounded-lg text-xs font-medium border transition-colors ${
                                    newGuest.allowedGuests === n
                                      ? `${selectedEntryType.bgClass}/20 ${selectedEntryType.textClass} ${selectedEntryType.borderClass}`
                                      : "bg-muted/50 text-muted-foreground border-border/40 hover:border-border"
                                  }`}
                                >
                                  {n === 0 ? "Solo" : `+${n}`}
                                </button>
                              ))}
                              <input
                                type="number"
                                min="4"
                                placeholder="+N"
                                className="h-7 w-14 rounded-lg text-xs border border-border/40 bg-muted/50 text-center px-1 [appearance:textfield]"
                                value={newGuest.allowedGuests > 3 ? newGuest.allowedGuests : ""}
                                onChange={(e) => {
                                  const v = parseInt(e.target.value)
                                  setNewGuest((p) => ({ ...p, allowedGuests: isNaN(v) ? 0 : Math.max(0, v) }))
                                }}
                              />
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 border-dashed"
                              onClick={() => {
                                if (!newGuest.contact.trim()) return
                                const link = newGuest.personalLink.trim() || generateGuestSlug(newGuest.name, newGuest.contact)
                                setGuests((p) => [...p, { ...newGuest, personalLink: link, _id: crypto.randomUUID() }])
                                setNewGuest({ name: "", contact: "", personalLink: "", allowedGuests: 0 })
                              }}
                              disabled={!newGuest.contact.trim()}
                            >
                              <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className="size-3.5 mr-1.5" />
                              Add guest
                            </Button>
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                accept=".csv,text/csv"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (!file) return
                                  const reader = new FileReader()
                                  reader.onload = (ev) => {
                                    const rows = parseGuestCSV(ev.target?.result as string)
                                    setGuests((p) => [
                                      ...p,
                                      ...rows.map((r) => ({
                                        ...r,
                                        personalLink: r.personalLink || generateGuestSlug(r.name, r.contact),
                                        allowedGuests: 0,
                                        _id: crypto.randomUUID(),
                                      })),
                                    ])
                                  }
                                  reader.readAsText(file)
                                  e.target.value = ""
                                }}
                              />
                              <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border/50 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-border transition-colors">
                                <HugeiconsIcon icon={Upload01Icon} strokeWidth={2} className="size-3" />
                                CSV
                              </span>
                            </label>
                          </div>
                          <p className="text-[10px] text-muted-foreground">CSV columns: <code>name, contact, link</code> (header row required)</p>

                          {guests.length > 0 && (
                            <div className="space-y-1.5">
                              {guests.map((g) =>
                                editingGuestId === g._id ? (
                                  <div key={g._id} className={`bg-background border ${selectedEntryType.borderClass} rounded-xl p-3 space-y-2`}>
                                    <div className="grid grid-cols-2 gap-2">
                                      <Input
                                        placeholder="Name"
                                        value={editGuestForm.name}
                                        onChange={(e) => setEditGuestForm((p) => ({ ...p, name: e.target.value }))}
                                        className="h-8 text-xs"
                                      />
                                      <Input
                                        placeholder="Phone or email"
                                        value={editGuestForm.contact}
                                        onChange={(e) => setEditGuestForm((p) => ({ ...p, contact: e.target.value }))}
                                        className="h-8 text-xs"
                                      />
                                    </div>
                                    <Input
                                      placeholder="Personal link"
                                      value={editGuestForm.personalLink}
                                      onChange={(e) => setEditGuestForm((p) => ({ ...p, personalLink: e.target.value }))}
                                      className="h-8 text-xs"
                                    />
                                    <div className="flex items-center gap-1">
                                      {[0, 1, 2, 3].map((n) => (
                                        <button
                                          key={n}
                                          type="button"
                                          onClick={() => setEditGuestForm((p) => ({ ...p, allowedGuests: n }))}
                                          className={`h-6 px-2 rounded text-[10px] font-medium border transition-colors ${
                                            editGuestForm.allowedGuests === n
                                              ? `${selectedEntryType.bgClass}/20 ${selectedEntryType.textClass} ${selectedEntryType.borderClass}`
                                              : "bg-muted/50 text-muted-foreground border-border/40 hover:border-border"
                                          }`}
                                        >
                                          {n === 0 ? "Solo" : `+${n}`}
                                        </button>
                                      ))}
                                      <input
                                        type="number"
                                        min="4"
                                        placeholder="+N"
                                        className="h-6 w-12 rounded text-[10px] border border-border/40 bg-muted/50 text-center px-1 [appearance:textfield]"
                                        value={editGuestForm.allowedGuests > 3 ? editGuestForm.allowedGuests : ""}
                                        onChange={(e) => {
                                          const v = parseInt(e.target.value)
                                          setEditGuestForm((p) => ({ ...p, allowedGuests: isNaN(v) ? 0 : Math.max(0, v) }))
                                        }}
                                      />
                                    </div>
                                    <div className="flex gap-2">
                                      <Button size="sm" className="flex-1 h-7 text-xs" onClick={() => {
                                        if (!editGuestForm.contact.trim()) return
                                        const link = editGuestForm.personalLink.trim() || generateGuestSlug(editGuestForm.name, editGuestForm.contact)
                                        setGuests((p) => p.map((x) => x._id === g._id ? { ...x, ...editGuestForm, personalLink: link } : x))
                                        setEditingGuestId(null)
                                      }}>
                                        Save
                                      </Button>
                                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditingGuestId(null)}>
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div key={g._id} className="flex items-center gap-2 px-3 py-2 bg-background border border-border/40 rounded-xl group">
                                    <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className={`size-3.5 ${selectedEntryType.textClass} flex-shrink-0`} />
                                    <div className="flex-1 min-w-0">
                                      {g.name && <div className="text-sm font-medium truncate">{g.name}</div>}
                                      <div className="text-xs text-muted-foreground truncate">{g.contact}</div>
                                    </div>
                                    {g.allowedGuests > 0 && (
                                      <span className={`text-[10px] font-semibold ${selectedEntryType.textClass} ${selectedEntryType.bgClass}/15 border ${selectedEntryType.borderClass} rounded px-1.5 py-0.5 flex-shrink-0`}>
                                        +{g.allowedGuests}
                                      </span>
                                    )}
                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground flex-shrink-0 max-w-[80px]">
                                      <HugeiconsIcon icon={Link01Icon} strokeWidth={2} className="size-3 flex-shrink-0" />
                                      <span className="truncate">{g.personalLink}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => { setEditingGuestId(g._id); setEditGuestForm({ name: g.name, contact: g.contact, personalLink: g.personalLink, allowedGuests: g.allowedGuests }) }}
                                      className="text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                      <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setGuests((p) => p.filter((x) => x._id !== g._id))}
                                      className="text-muted-foreground hover:text-destructive transition-colors"
                                    >
                                      <HugeiconsIcon icon={Remove01Icon} strokeWidth={2} className="size-3.5" />
                                    </button>
                                  </div>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* RSVP */}
            {entryType === "rsvp" && (
              <div className="space-y-4">
                <div>
                  <h2 className="font-bold text-base mb-1">RSVP Settings</h2>
                  <p className="text-muted-foreground text-sm">People register for free; you track attendees</p>
                </div>
                <div className="bg-card border border-border/60 rounded-2xl p-4 space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">Capacity (optional)</Label>
                    <div className="relative">
                      <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="Leave blank for unlimited"
                        value={rsvpCapacity}
                        onChange={(e) => setRsvpCapacity(e.target.value)}
                        className="h-11 pl-10"
                        min="1"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Extra RSVPs will be automatically waitlisted</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">Approval</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setRequiresApproval(false)}
                        className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                          !requiresApproval ? "border-primary bg-primary/8 text-primary" : "border-border/40 text-muted-foreground"
                        }`}
                      >
                        Auto-approve
                      </button>
                      <button
                        onClick={() => setRequiresApproval(true)}
                        className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                          requiresApproval ? "border-primary bg-primary/8 text-primary" : "border-border/40 text-muted-foreground"
                        }`}
                      >
                        Require approval
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {requiresApproval
                        ? "Each RSVP waits in a pending queue until you approve or reject it"
                        : "RSVPs are confirmed instantly (up to capacity)"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Free */}
            {entryType === "free" && (
              <div className={`bg-card border ${selectedEntryType.borderClass} rounded-2xl p-5 text-center space-y-2`}>
                <HugeiconsIcon icon={GiftIcon} strokeWidth={2} className={`size-8 ${selectedEntryType.textClass} mx-auto`} />
                <h3 className="font-semibold">Free entry — no registration</h3>
                <p className="text-sm text-muted-foreground">
                  The event page shows date, time and location. Attendees just show up.
                </p>
                <div className="space-y-1.5 pt-2 text-left">
                  <Label className="text-sm font-semibold">Expected capacity (optional)</Label>
                  <div className="relative">
                    <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="e.g. 500"
                      value={rsvpCapacity}
                      onChange={(e) => setRsvpCapacity(e.target.value)}
                      className="h-10 pl-10"
                    />
                  </div>
                </div>
              </div>
            )}

          </motion.div>
        )}

        {/* ─── Step 3: Recurring / Series ─────────────────────────────── */}
        {step === 3 && (
          <motion.div
            key="recurring"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <div>
              <h2 className="font-bold text-lg mb-1">Recurring / Series</h2>
              <p className="text-muted-foreground text-sm">Generate multiple dated instances in one go — perfect for weekly workshops, monthly meetups, or concert tours</p>
            </div>

            <button
              type="button"
              onClick={() => setIsRecurring(false)}
              className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                !isRecurring ? `${selectedEntryType.borderClass} ${selectedEntryType.bgClass}/10` : "border-border/40 hover:border-border bg-card/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl flex-shrink-0 ${!isRecurring ? `${selectedEntryType.bgClass}/20` : "bg-muted"}`}>
                  <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className={`size-5 ${!isRecurring ? selectedEntryType.textClass : "text-muted-foreground"}`} />
                </div>
                <div>
                  <div className="font-semibold text-sm">Single event</div>
                  <div className="text-xs text-muted-foreground mt-0.5">One date, one event — standard mode</div>
                </div>
                {!isRecurring && (
                  <div className={`ml-auto size-5 ${selectedEntryType.bgClass} rounded-full flex items-center justify-center flex-shrink-0`}>
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-3 text-white" />
                  </div>
                )}
              </div>
            </button>

            <div className={`rounded-2xl border-2 transition-all overflow-hidden ${
              isRecurring ? `${selectedEntryType.borderClass} ${selectedEntryType.bgClass}/10` : "border-border/40 bg-card/50"
            }`}>
              <button
                type="button"
                onClick={() => setIsRecurring(true)}
                className="w-full text-left p-4"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl flex-shrink-0 ${isRecurring ? `${selectedEntryType.bgClass}/20` : "bg-muted"}`}>
                    <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className={`size-5 ${isRecurring ? selectedEntryType.textClass : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Recurring series</div>
                    <div className="text-xs text-muted-foreground mt-0.5">All instances share the same details — attendees pick their date</div>
                  </div>
                  {isRecurring && (
                    <div className={`ml-auto size-5 ${selectedEntryType.bgClass} rounded-full flex items-center justify-center flex-shrink-0`}>
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-3 text-white" />
                    </div>
                  )}
                </div>
              </button>

              <AnimatePresence initial={false}>
                {isRecurring && (
                  <motion.div
                    key="series-config"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className={`overflow-hidden border-t ${selectedEntryType.borderClass}/20`}
                  >
                    <div className="p-4 space-y-4">
                      <div className="space-y-2">
                        <Label className={`text-xs font-bold ${selectedEntryType.textClass} uppercase tracking-wider`}>Repeat every</Label>
                        <div className="grid grid-cols-4 gap-2">
                          {([
                            { value: "weekly", label: "1 week" },
                            { value: "biweekly", label: "2 weeks" },
                            { value: "monthly", label: "1 month" },
                            { value: "custom", label: "Custom" },
                          ] as const).map((p) => (
                            <button
                              key={p.value}
                              type="button"
                              onClick={() => setRecurrenceType(p.value)}
                              className={`py-2 px-2 rounded-xl border text-xs font-semibold transition-all ${
                                recurrenceType === p.value
                                  ? `${selectedEntryType.borderClass} ${selectedEntryType.bgClass}/15 ${selectedEntryType.textClass}`
                                  : "border-border/40 text-muted-foreground hover:border-border"
                              }`}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {recurrenceType !== "custom" && (
                        <div className="space-y-2">
                          <Label className={`text-xs font-bold ${selectedEntryType.textClass} uppercase tracking-wider`}>Occurrences</Label>
                          <div className="flex items-center gap-3">
                            <Button
                              variant="outline"
                              size="icon"
                              className="size-8 flex-shrink-0"
                              type="button"
                              onClick={() => setOccurrenceCount((n) => Math.max(2, n - 1))}
                            >
                              <HugeiconsIcon icon={CircleMinusIcon} strokeWidth={2} className="size-3.5" />
                            </Button>
                            <span className="font-black text-xl w-8 text-center tabular-nums">{occurrenceCount}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="size-8 flex-shrink-0"
                              type="button"
                              onClick={() => setOccurrenceCount((n) => Math.min(24, n + 1))}
                            >
                              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-3.5" />
                            </Button>
                            <span className="text-xs text-muted-foreground ml-1">
                              events ·
                              {recurrenceType === "weekly" && ` ${occurrenceCount} weeks`}
                              {recurrenceType === "biweekly" && ` ${occurrenceCount * 2} weeks`}
                              {recurrenceType === "monthly" && ` ${occurrenceCount} months`}
                            </span>
                          </div>
                        </div>
                      )}

                      {recurrenceType === "custom" && (
                        <div className="space-y-2">
                          <Label className={`text-xs font-bold ${selectedEntryType.textClass} uppercase tracking-wider`}>Add dates</Label>
                          <div className="flex gap-2">
                            <Input
                              type="date"
                              id="series-custom-date"
                              className="h-9 text-sm flex-1"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 flex-shrink-0 gap-1"
                              type="button"
                              onClick={() => {
                                const input = document.getElementById("series-custom-date") as HTMLInputElement
                                if (input?.value && time) {
                                  const iso = new Date(`${input.value}T${time}:00`).toISOString()
                                  if (!customDates.includes(iso)) setCustomDates((d) => [...d, iso].sort())
                                  input.value = ""
                                } else if (input?.value) {
                                  const iso = new Date(`${input.value}T00:00:00`).toISOString()
                                  if (!customDates.includes(iso)) setCustomDates((d) => [...d, iso].sort())
                                  input.value = ""
                                }
                              }}
                            >
                              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-3.5" />
                              Add
                            </Button>
                          </div>
                          {customDates.length === 0 && (
                            <p className="text-xs text-muted-foreground">Add at least 2 dates for your series</p>
                          )}
                        </div>
                      )}

                      {generatedDates.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-lime-500 uppercase tracking-wider">
                            {generatedDates.length} {generatedDates.length === 1 ? "date" : "dates"} in this series
                          </Label>
                          <div className="max-h-44 overflow-y-auto space-y-1.5 pr-0.5">
                            {generatedDates.map((d, i) => (
                              <div
                                key={d}
                                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm ${
                                  i === 0 ? "bg-lime-500/10 border border-lime-500/20" : "bg-muted/40"
                                }`}
                              >
                                <span className={`size-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                                  i === 0 ? "bg-lime-500 text-white" : "bg-muted text-muted-foreground"
                                }`}>
                                  {i + 1}
                                </span>
                                <span className={`flex-1 ${i === 0 ? "font-medium" : "text-muted-foreground"}`}>
                                  {new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })} · {new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                                </span>
                                {i === 0 && (
                                  <span className="text-[10px] text-lime-500 font-semibold flex-shrink-0">First</span>
                                )}
                                {recurrenceType === "custom" && (
                                  <button
                                    type="button"
                                    onClick={() => setCustomDates((prev) => prev.filter((x) => x !== d))}
                                    className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                                  >
                                    <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </motion.div>
        )}

        {/* ─── Step 4: Review & Publish ───────────────────────────────── */}
        {step === 4 && (
          <motion.div
            key="review"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-5"
          >
            <div className={`bg-card border ${selectedEntryType.borderClass} rounded-2xl overflow-hidden`}>
              {bannerImage && (
                <img
                  src={bannerImage}
                  alt="Banner"
                  className="h-40 w-full object-cover"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              )}
              <div className="p-5">
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <Badge variant="success" className="text-xs gap-1.5 font-semibold">
                    {selectedEntryType.icon}
                    {selectedEntryType.label}
                  </Badge>
                  <Badge 
                    variant={visibility === "public" ? "info" : "violet"} 
                    className="text-xs gap-1.5 font-semibold"
                  >
                    {VISIBILITY_OPTIONS.find((v) => v.value === visibility)?.icon}
                    {visibility.charAt(0).toUpperCase() + visibility.slice(1)}
                  </Badge>
                  {requiresApproval && <Badge variant="outline" className="text-xs">Approval required</Badge>}
                  {inviteCodes.length > 0 && (
                    <Badge variant="outline" className="text-xs gap-1 font-mono">
                      <HugeiconsIcon icon={Key01Icon} strokeWidth={2} className="size-2.5" />
                      {inviteCodes.length} code{inviteCodes.length !== 1 ? "s" : ""}
                    </Badge>
                  )}
                  {guests.length > 0 && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className="size-2.5" />
                      {guests.length} guest{guests.length !== 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>

                <h3 className="text-xl font-black mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {date && time
                    ? `${new Date(`${date}T${time}`).toLocaleDateString("en-US", {
                        weekday: "long", year: "numeric", month: "long", day: "numeric",
                      })} at ${time}`
                    : ""}
                  {location && ` · ${location}`}
                </p>
                {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}

                {entryType === "ticketed" && (
                  <div className="border-t border-border/40 pt-4 space-y-2">
                    {ticketTypes.filter((t) => t.name).map((t, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <div>
                          <span className="font-medium">{t.name}</span>
                          <span className="text-muted-foreground ml-2">× {t.quantity || 0}</span>
                        </div>
                        <span className="font-semibold text-primary">{Number(t.price || 0).toLocaleString()} ETB</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm font-bold border-t border-border/40 pt-2 mt-2">
                      <span>Total capacity</span>
                      <span>{totalCapacity.toLocaleString()} tickets</span>
                    </div>
                  </div>
                )}

                {entryType === "invite_only" && (inviteCodes.length > 0 || guests.length > 0) && (
                  <div className="border-t border-border/40 pt-3 space-y-1">
                    {inviteCodes.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {inviteCodes.length} invite code{inviteCodes.length !== 1 ? "s" : ""} —{" "}
                        {inviteCodes.map((c) => c.code).join(", ")}
                      </p>
                    )}
                    {guests.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {guests.length} pre-added guest{guests.length !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                )}

                {entryType === "rsvp" && rsvpCapacity && (
                  <div className="border-t border-border/40 pt-3">
                    <p className="text-sm text-muted-foreground">
                      Capacity: {Number(rsvpCapacity).toLocaleString()} spots ·{requiresApproval ? " Approval required" : " Auto-approve"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-card border border-border/60 rounded-2xl p-4 space-y-4">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${selectedEntryType.bgClass}/15`}>
                  {selectedEntryType.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold">How attendees will enter</p>
                  <p className="text-xs text-muted-foreground">{selectedEntryType.label}</p>
                </div>
              </div>

              {entryType === "ticketed" && (
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5 text-sm">
                    <div className="size-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <span>Attendees <strong>purchase a ticket online</strong> before the event. No ticket = no entry.</span>
                  </div>
                  {ticketTypes.filter((t) => t.name).length > 0 && (
                    <div className="space-y-2">
                      {ticketTypes.filter((t) => t.name).map((t, i) => (
                        <div key={i} className="rounded-xl bg-background border border-border/50 p-3 text-sm space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{t.name}</span>
                            <span className="text-primary font-bold">{Number(t.price || 0).toLocaleString()} ETB</span>
                          </div>
                          <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5">
                            <span>{Number(t.quantity || 0).toLocaleString()} tickets available</span>
                            {t.maxPerPerson && <span>Max {t.maxPerPerson} per person</span>}
                            {t.salesStart && <span>Opens {new Date(t.salesStart).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>}
                            {t.salesEnd && <span>Closes {new Date(t.salesEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <div className="size-1.5 rounded-full bg-muted-foreground/40 mt-1.5 flex-shrink-0" />
                    <span>Total capacity: <strong className="text-foreground">{totalCapacity.toLocaleString()} tickets</strong></span>
                  </div>
                </div>
              )}

              {entryType === "rsvp" && (
                <div className="space-y-2">
                  <div className="flex items-start gap-2.5 text-sm">
                    <div className="size-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <span>Attendees <strong>register for free</strong> — no payment required.</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-sm">
                    <div className="size-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    {requiresApproval
                      ? <span>Each RSVP <strong>waits in a pending queue</strong> until you manually approve or reject it.</span>
                      : <span>RSVPs are <strong>confirmed instantly</strong> (auto-approve).</span>}
                  </div>
                  {rsvpCapacity && (
                    <div className="flex items-start gap-2.5 text-sm">
                      <div className="size-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                      <span>Capacity: <strong>{Number(rsvpCapacity).toLocaleString()} spots</strong>. Extra registrations are waitlisted automatically.</span>
                    </div>
                  )}
                  {!rsvpCapacity && (
                    <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <div className="size-1.5 rounded-full bg-muted-foreground/40 mt-1.5 flex-shrink-0" />
                      <span>No capacity limit set — unlimited RSVPs accepted.</span>
                    </div>
                  )}
                </div>
              )}

              {entryType === "free" && (
                <div className="space-y-2">
                  <div className="flex items-start gap-2.5 text-sm">
                    <div className="size-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <span><strong>No registration required.</strong> Anyone can walk in on the day.</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <div className="size-1.5 rounded-full bg-muted-foreground/40 mt-1.5 flex-shrink-0" />
                    <span>No ticket, no RSVP, no guest list — open to everyone.</span>
                  </div>
                </div>
              )}

              {entryType === "invite_only" && (
                <div className="space-y-2">
                  <div className="flex items-start gap-2.5 text-sm">
                    <div className="size-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    {usePaidTickets
                      ? <span>Invited guests <strong>purchase a ticket</strong> after gaining access.</span>
                      : <span>Invited guests <strong>RSVP for free</strong> — no payment required.</span>}
                  </div>
                  {useCodesSection && inviteCodes.length > 0 && (
                    <div className="flex items-start gap-2.5 text-sm">
                      <div className="size-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                      <span>Access via <strong>invite code</strong> — {inviteCodes.length} code{inviteCodes.length !== 1 ? "s" : ""} ({inviteCodes.map((c) => c.code).join(", ")})</span>
                    </div>
                  )}
                  {useGuestSection && guests.length > 0 && (
                    <div className="flex items-start gap-2.5 text-sm">
                      <div className="size-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                      <span>Access via <strong>guest list</strong> — {guests.length} pre-added guest{guests.length !== 1 ? "s" : ""}</span>
                    </div>
                  )}
                  {!useCodesSection && !useGuestSection && (
                    <div className="flex items-start gap-2.5 text-sm text-amber-500">
                      <div className="size-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                      <span>No access method configured yet — add invite codes or a guest list in step 3.</span>
                    </div>
                  )}
                  {usePaidTickets && ticketTypes.filter((t) => t.name).length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {ticketTypes.filter((t) => t.name).map((t, i) => (
                        <div key={i} className="rounded-xl bg-background border border-border/50 p-3 text-sm space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{t.name}</span>
                            <span className="text-amber-500 font-bold">{Number(t.price || 0).toLocaleString()} ETB</span>
                          </div>
                          <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5">
                            <span>{Number(t.quantity || 0).toLocaleString()} tickets</span>
                            {t.maxPerPerson && <span>Max {t.maxPerPerson}/person</span>}
                            {t.salesStart && <span>Opens {new Date(t.salesStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
                            {t.salesEnd && <span>Closes {new Date(t.salesEnd).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>
      </div>

      <div className="sticky bottom-0 z-10 bg-popover pt-3 border-t border-border/60">
        {error && <p className="text-destructive text-sm mb-2">{error}</p>}

        {step === 0 && (
          <Button className="w-full h-11 font-semibold" onClick={() => { setError(""); setStep(1) }}>
            Next: Event Details
            <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="ml-2 size-4" />
          </Button>
        )}

        {step === 1 && (
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 h-11" onClick={() => setStep(0)}>
              <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4 mr-2" /> Back
            </Button>
            <Button
              className="flex-1 h-11 font-semibold"
              onClick={() => {
                const errors: { title?: string; date?: string; location?: string } = {}
                if (!title) errors.title = "Event name is required"
                if (!date) errors.date = "Date is required"
                if (!location) errors.location = "Location is required"
                setFieldErrors(errors)
                if (Object.keys(errors).length > 0) return
                setError("")
                setStep(2)
              }}
            >
              Next: Entry Settings
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="ml-2 size-4" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 h-11" onClick={() => setStep(1)}>
              <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4 mr-2" /> Back
            </Button>
            <Button className="flex-1 h-11 font-semibold" onClick={() => { setError(""); setStep(3) }}>
              Recurring
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="ml-2 size-4" />
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 h-11" onClick={() => { setError(""); setStep(2) }}>
              <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4 mr-2" /> Back
            </Button>
            <Button className="flex-1 h-11 font-semibold" onClick={() => { setError(""); setStep(4) }}>
              Next: Review
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="ml-2 size-4" />
            </Button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <Button
              className="w-full h-12 font-bold text-base"
              onClick={() => handleCreate(true)}
              disabled={isLoading}
            >
              {isLoading ? (
                <HugeiconsIcon icon={Loading01Icon} strokeWidth={2} className="size-4 animate-spin" />
              ) : (
                <>
                  <HugeiconsIcon icon={Rocket01Icon} strokeWidth={2} className="size-4 mr-2" />
                  {entryType === "ticketed" ? "Publish — Start Selling Now"
                    : entryType === "rsvp" ? "Publish — Open RSVP"
                    : entryType === "free" ? "Publish Event"
                    : "Publish — Share Invite Link"}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="w-full h-11 border-border/50"
              onClick={() => handleCreate(false)}
              disabled={isLoading}
            >
              Save as Draft
            </Button>
            <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => setStep(3)}>
              <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4 mr-1.5" />
              Back
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
