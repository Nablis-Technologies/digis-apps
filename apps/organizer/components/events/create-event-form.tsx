"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence, Reorder } from "framer-motion"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge, CategoryBadge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn, normalizeYoutubeUrl, validateYoutubeUrl, mapDateSelection } from "@/lib/utils"
import { useGetMeQuery } from "@workspace/store/reducers/authApi"
import { useListOwnerOrganizationsQuery } from "@workspace/store/reducers/organizationsApi"
import { useActiveOrganization, isOrgSuspendedOrRemoved } from "../../providers/organization-provider"
import { useListPublicCategoriesQuery } from "@workspace/store/reducers/categoriesApi"
import { useListPublicVenuesQuery } from "@workspace/store/reducers/venuesApi"
import { useListArtistsQuery } from "@workspace/store/reducers/artistsApi"
import { 
  useCreateEventMutation, 
  usePublishEventMutation,
  useCreateEventMediaMutation,
  useCreateEventDateMutation,
  useCreateEventProductMutation,
  useActivateEventProductMutation,
  useCreateAccessCodeMutation,
  useCreateInvitationMutation,
  useCreateRegistrationFormMutation,
  useCreateRegistrationFormVersionMutation,
  usePublishRegistrationFormVersionMutation,
  useCreateEventParticipantMutation,
  useCreateEventVideoLinkMutation,
  useCreateEventOrganizationMutation,
} from "@workspace/store/reducers/organizerEventsApi"
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
  BookmarkIcon,
  Tick02Icon,
  ImageAddIcon,
  AlertCircleIcon,
  PlayIcon,
  Building02Icon,
  Location01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons"
import { 
  HelpCircle, 
  Plus, 
  X, 
  Clock, 
  ChevronUp, 
  ChevronDown, 
  Pencil, 
  Trash2, 
  Type, 
  Hash, 
  CheckSquare, 
  ChevronDown as ChevronDownIcon 
} from "lucide-react"

type TicketTypeInput = {
  name: string
  price: number | string
  quantity: number | string
  description: string
  maxPerPerson: string
  salesStart: string
  salesEnd: string
  admissionsPerUnit?: string
  allowCustomPrice?: boolean
  entryValidationMode?: "qr" | "manual"
  dateSelection?: "fixed" | "all_dates" | "attendee_choice"
}

type EntryType = "ticketed" | "rsvp" | "free" | "invite_only"
type Visibility = "public" | "private"

type VideoLinkInput = {
  _id: string
  title: string
  url: string
  provider: "youtube"
}

type ParticipantInput = {
  _id: string
  name: string
  type: string
  description: string
  artistId?: string
}

type CollaboratorInput = {
  _id: string
  organizationId: string
  orgName: string
  type: string
  role: string
}

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

type CustomQuestionType = "text" | "textarea" | "number" | "select" | "checkbox"

type CustomQuestion = {
  id: string
  label: string
  type: CustomQuestionType
  required: boolean
  placeholder?: string
  options?: string
}

type QuestionFormData = {
  label: string
  type: CustomQuestionType
  required: boolean
  placeholder: string
  options: string
}


const QUESTION_TYPES: { value: CustomQuestionType; label: string; icon: React.ReactNode }[] = [
  {
    value: "text",
    label: "Text",
    icon: <Type className="w-3.5 h-3.5" />,
  },
  {
    value: "textarea", 
    label: "Long Text",
    icon: <Type className="w-3.5 h-3.5" />,
  },
  {
    value: "number",
    label: "Number", 
    icon: <Hash className="w-3.5 h-3.5" />,
  },
  {
    value: "select",
    label: "Dropdown",
    icon: <ChevronDownIcon className="w-3.5 h-3.5" />,
  },
  {
    value: "checkbox",
    label: "Checkbox",
    icon: <CheckSquare className="w-3.5 h-3.5" />,
  },
]

const ENTRY_TYPES: { value: EntryType; label: string; desc: string; icon: React.ReactNode; color: string; bgClass: string; textClass: string; borderClass: string }[] = [
  {
    value: "ticketed",
    label: "Ticketed",
    desc: "Paid entry — sell General, VIP, VVIP tiers",
    icon: <HugeiconsIcon icon={TicketIcon} strokeWidth={2} className="size-5" />,
    color: "--event-ticketed",
    bgClass: "bg-event-ticketed",
    textClass: "text-event-ticketed",
    borderClass: "border-event-ticketed",
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
    color: "--event-free",
    bgClass: "bg-event-free",
    textClass: "text-event-free",
    borderClass: "border-event-free",
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

function isDoorsAfterStart(dTime: string, sTime: string): boolean {
  if (!dTime || !sTime) return false
  const [dh, dm] = dTime.split(":").map(Number)
  const [sh, sm] = sTime.split(":").map(Number)
  if (isNaN(dh) || isNaN(dm) || isNaN(sh) || isNaN(sm)) return false
  return dh * 60 + dm > sh * 60 + sm
}

function isEndsBeforeOrEqualStarts(sDate: string, sTime: string, eDate: string, eTime: string): boolean {
  if (!sDate || !sTime || !eDate || !eTime) return false
  const start = new Date(`${sDate}T${sTime}:00`).getTime()
  const end = new Date(`${eDate}T${eTime}:00`).getTime()
  if (isNaN(start) || isNaN(end)) return false
  return end <= start
}

function generateCode(length = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
}

function detectVideoProvider(url: string): "youtube" | "vimeo" | "other" {
  if (/youtube\.com|youtu\.be/i.test(url)) return "youtube"
  if (/vimeo\.com/i.test(url)) return "vimeo"
  return "other"
}

function extractYoutubeId(url: string): string | null {
  if (!url) return null
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i)
  return match ? match[1] : null
}

function getParticipantRoleConfig(type?: string) {
  const norm = (type || "").toLowerCase().trim()
  switch (norm) {
    case "performer":
    case "artist":
    case "musician":
      return {
        label: "Performer",
        avatarGradient: "from-violet-600 via-purple-600 to-indigo-600",
        badgeStyle: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30",
      }
    case "dj":
      return {
        label: "DJ",
        avatarGradient: "from-fuchsia-600 via-pink-600 to-purple-600",
        badgeStyle: "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-500/30",
      }
    case "speaker":
    case "keynote":
      return {
        label: "Speaker",
        avatarGradient: "from-sky-500 via-blue-600 to-indigo-600",
        badgeStyle: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
      }
    case "panelist":
      return {
        label: "Panelist",
        avatarGradient: "from-cyan-500 via-blue-600 to-indigo-600",
        badgeStyle: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
      }
    case "host":
    case "mc":
      return {
        label: norm === "mc" ? "MC" : "Host",
        avatarGradient: "from-amber-500 via-orange-600 to-rose-600",
        badgeStyle: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
      }
    case "guest":
      return {
        label: "Special Guest",
        avatarGradient: "from-emerald-500 via-teal-600 to-cyan-600",
        badgeStyle: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
      }
    case "instructor":
    case "trainer":
      return {
        label: "Instructor",
        avatarGradient: "from-rose-500 via-pink-600 to-red-600",
        badgeStyle: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
      }
    default:
      return {
        label: type ? type.replace(/_/g, " ") : "Participant",
        avatarGradient: "from-primary/90 to-primary/60",
        badgeStyle: "bg-primary/15 text-primary border-primary/25",
      }
  }
}

function getCollaboratorTypeConfig(type?: string) {
  const norm = (type || "").toLowerCase().trim()
  switch (norm) {
    case "sponsor":
      return {
        label: "Sponsor",
        badgeStyle: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
        avatarGradient: "from-amber-500 to-orange-600",
      }
    case "co_organizer":
    case "co-organizer":
      return {
        label: "Co-organizer",
        badgeStyle: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30",
        avatarGradient: "from-violet-500 to-purple-600",
      }
    case "partner":
      return {
        label: "Partner",
        badgeStyle: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
        avatarGradient: "from-indigo-500 to-blue-600",
      }
    case "vendor":
      return {
        label: "Vendor",
        badgeStyle: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
        avatarGradient: "from-emerald-500 to-teal-600",
      }
    default:
      return {
        label: type ? type.replace(/_/g, " ") : "Partner",
        badgeStyle: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
        avatarGradient: "from-sky-500 to-blue-600",
      }
  }
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
  
  // API mutations & queries
  const [createEvent, { isLoading: isCreatingEvent }] = useCreateEventMutation()
  const [publishEvent, { isLoading: isPublishingEvent }] = usePublishEventMutation()
  const [createEventDate] = useCreateEventDateMutation()
  const [createEventProduct] = useCreateEventProductMutation()
  const [activateEventProduct] = useActivateEventProductMutation()
  const [createAccessCode] = useCreateAccessCodeMutation()
  const [createInvitation] = useCreateInvitationMutation()
  const [createRegistrationForm] = useCreateRegistrationFormMutation()
  const [createRegistrationFormVersion] = useCreateRegistrationFormVersionMutation()
  const [publishRegistrationFormVersion] = usePublishRegistrationFormVersionMutation()
  const [createEventMedia] = useCreateEventMediaMutation()
  const [createEventParticipant] = useCreateEventParticipantMutation()
  const [createEventVideoLink] = useCreateEventVideoLinkMutation()
  const [createEventOrganization] = useCreateEventOrganizationMutation()
  
  // Get current user data, active organization, and categories
  const { data: userData } = useGetMeQuery()
  const { activeOrg, activeOrgId, organizations, isLoading: isLoadingOrgs } = useActiveOrganization()
  const { data: categoriesData } = useListPublicCategoriesQuery()
  const { data: venuesData, isLoading: isLoadingVenues } = useListPublicVenuesQuery({ page: 1, per_page: 100 })
  const { data: artistsData } = useListArtistsQuery({ per_page: 100 })
  
  const [selectedOrgId, setSelectedOrgId] = useState<string>("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [step, setStep] = useState(0)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<{ title?: string; date?: string; endDate?: string; doorsTime?: string; location?: string; banner?: string; category?: string }>({})

  const [entryType, setEntryType] = useState<EntryType>("ticketed")
  const [visibility, setVisibility] = useState<Visibility>("public")

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("19:00")
  const [endDate, setEndDate] = useState("")
  const [endTime, setEndTime] = useState("")
  const [doorsTime, setDoorsTime] = useState("")
  const [venueId, setVenueId] = useState("")
  const [venueCapacity, setVenueCapacity] = useState("")
  const [onlineUrl, setOnlineUrl] = useState("")
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState("")
  const [bannerCaption, setBannerCaption] = useState("")
  const [galleryFiles, setGalleryFiles] = useState<{ file: File; preview: string; caption?: string }[]>([])

  // Video Links state
  const [showVideoLinks, setShowVideoLinks] = useState(false)
  const [videoLinks, setVideoLinks] = useState<VideoLinkInput[]>([])
  const [newVideoLink, setNewVideoLink] = useState({ title: "", url: "" })
  const [videoUrlError, setVideoUrlError] = useState("")

  // Lineup / Participants state
  const [showLineup, setShowLineup] = useState(false)
  const [participants, setParticipants] = useState<ParticipantInput[]>([])
  const [newParticipant, setNewParticipant] = useState<{ name: string; type: string; description: string; artistId?: string }>({ name: "", type: "performer", description: "", artistId: "" })

  // Collaborators state
  const [showCollaborators, setShowCollaborators] = useState(false)
  const [collaborators, setCollaborators] = useState<CollaboratorInput[]>([])
  const [newCollaborator, setNewCollaborator] = useState({ organizationId: "", type: "co_organizer", role: "collaborator" })

  const MAX_GALLERY = 20

  const [requiresApproval, setRequiresApproval] = useState(false)
  const [rsvpCapacity, setRsvpCapacity] = useState("")
  const [ticketTypes, setTicketTypes] = useState<TicketTypeInput[]>([
    { name: "General Admission", price: "", quantity: "", description: "", maxPerPerson: "", salesStart: "", salesEnd: "", admissionsPerUnit: "" },
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
  const [showOnlineLink, setShowOnlineLink] = useState(false)
  const [showGallery, setShowGallery] = useState(false)

  const toggleGallery = (next: boolean) => {
    if (!next) {
      galleryFiles.forEach((item) => URL.revokeObjectURL(item.preview))
      setGalleryFiles([])
    }
    setShowGallery(next)
  }
  const [showTicketOptionalFields, setShowTicketOptionalFields] = useState<{ [key: number]: boolean }>({})

  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrenceType, setRecurrenceType] = useState<"weekly" | "biweekly" | "monthly" | "custom">("weekly")
  const [occurrenceCount, setOccurrenceCount] = useState(4)
  const [customDates, setCustomDates] = useState<string[]>([])
  const [customDateInput, setCustomDateInput] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  // Custom Questions state
  const [questions, setQuestions] = useState<CustomQuestion[]>([])
  const [showCustomQuestions, setShowCustomQuestions] = useState(false)
  const [showAllCategories, setShowAllCategories] = useState(false)
  const [showQForm, setShowQForm] = useState(false)
  const [editingQId, setEditingQId] = useState<string | null>(null)
  const [qSaving, setQSaving] = useState(false)
  const [qForm, setQForm] = useState<QuestionFormData>({
    label: "",
    type: "text",
    required: false,
    placeholder: "",
    options: ""
  })

  const addTicketType = () =>
    setTicketTypes((p) => [...p, { name: "", price: "", quantity: "", description: "", maxPerPerson: "", salesStart: "", salesEnd: "" }])
  const removeTicketType = (i: number) =>
    setTicketTypes((p) => p.filter((_, idx) => idx !== i))
  const updateTicketType = (i: number, key: keyof TicketTypeInput, value: TicketTypeInput[keyof TicketTypeInput]) =>
    setTicketTypes((p) => p.map((t, idx) => (idx === i ? { ...t, [key]: value } : t)))

  const handleEntryTypeSelect = (type: EntryType) => {
    setEntryType(type)
    if (type === "invite_only") {
      setVisibility("private")
    } else if (entryType === "invite_only") {
      setVisibility("public")
    }
  }

  const handleVideoUrlChange = (val: string) => {
    setNewVideoLink((prev) => ({ ...prev, url: val }))
    if (!val.trim()) {
      setVideoUrlError("")
      return
    }
    if (videoUrlError) {
      const check = validateYoutubeUrl(val)
      if (check.valid) {
        setVideoUrlError("")
      }
    }
  }

  const handleVideoUrlBlur = () => {
    const trimmed = newVideoLink.url.trim()
    if (!trimmed) {
      setVideoUrlError("")
      return
    }
    const check = validateYoutubeUrl(trimmed)
    if (!check.valid) {
      setVideoUrlError(check.error || "Please provide a valid YouTube video link")
    } else {
      setVideoUrlError("")
      if (check.normalizedUrl && check.normalizedUrl !== newVideoLink.url) {
        setNewVideoLink((prev) => ({ ...prev, url: check.normalizedUrl! }))
      }
    }
  }

  const handleAddVideoLink = () => {
    const rawUrl = newVideoLink.url.trim()
    if (!rawUrl) return false
    const check = validateYoutubeUrl(rawUrl)
    if (!check.valid) {
      setVideoUrlError(check.error || "Please provide a valid YouTube video link")
      toast.error(check.error || "Please provide a valid YouTube video link (youtube.com or youtu.be)")
      return false
    }
    setVideoUrlError("")
    const cleanUrl = check.normalizedUrl || normalizeYoutubeUrl(rawUrl)
    setVideoLinks((prev) => [
      ...prev,
      {
        _id: crypto.randomUUID(),
        title: newVideoLink.title.trim() || "YouTube Video",
        url: cleanUrl,
        provider: "youtube",
      },
    ])
    setNewVideoLink({ title: "", url: "" })
    return true
  }

  const addInviteCode = () => {
    if (!newCode.code.trim()) return
    setInviteCodes((p) => [...p, { ...newCode, code: newCode.code.trim().toUpperCase(), _id: crypto.randomUUID() }])
    setNewCode({ code: "", label: "", useType: "unlimited", maxUses: "", hasExpiry: false, expiresAt: "" })
  }

  const handleAddParticipant = () => {
    const trimmedName = newParticipant.name.trim()
    if (!trimmedName) return false
    setParticipants((prev) => [
      ...prev,
      {
        _id: crypto.randomUUID(),
        name: trimmedName,
        type: newParticipant.type || "performer",
        description: newParticipant.description.trim(),
        artistId: newParticipant.artistId,
      },
    ])
    setNewParticipant({ name: "", type: "performer", description: "", artistId: "" })
    return true
  }

  const handleAddCollaborator = () => {
    if (!newCollaborator.organizationId) return false
    const matchedOrg = organizations?.find((o) => o.id === newCollaborator.organizationId)
    setCollaborators((prev) => [
      ...prev,
      {
        _id: crypto.randomUUID(),
        organizationId: newCollaborator.organizationId,
        orgName: matchedOrg?.name || "Collaborator Org",
        type: newCollaborator.type || "co_organizer",
        role: newCollaborator.role || "collaborator",
      },
    ])
    setNewCollaborator({ organizationId: "", type: "co_organizer", role: "collaborator" })
    return true
  }

  // Custom Questions functions
  const openAddQuestion = () => {
    setQForm({
      label: "",
      type: "text",
      required: false,
      placeholder: "",
      options: ""
    })
    setEditingQId(null)
    setShowCustomQuestions(true)
    setShowQForm(true)
  }

  const openEditQuestion = (question: CustomQuestion) => {
    setQForm({
      label: question.label,
      type: question.type,
      required: question.required,
      placeholder: question.placeholder || "",
      options: question.options || ""
    })
    setEditingQId(question.id)
    setShowQForm(true)
  }

  const handleSaveQuestion = () => {
    if (!qForm.label.trim()) return
    
    setQSaving(true)
    
    // Simulate async operation
    setTimeout(() => {
      if (editingQId) {
        // Update existing question
        setQuestions(prev => prev.map(q => 
          q.id === editingQId 
            ? {
                ...q,
                label: qForm.label,
                type: qForm.type,
                required: qForm.required,
                placeholder: qForm.placeholder || undefined,
                options: qForm.type === "select" ? qForm.options : undefined
              }
            : q
        ))
      } else {
        // Add new question
        const newQuestion: CustomQuestion = {
          id: crypto.randomUUID(),
          label: qForm.label,
          type: qForm.type,
          required: qForm.required,
          placeholder: qForm.placeholder || undefined,
          options: qForm.type === "select" ? qForm.options : undefined
        }
        setQuestions(prev => [...prev, newQuestion])
      }
      
      setShowQForm(false)
      setEditingQId(null)
      setQSaving(false)
    }, 500)
  }

  const handleDeleteQuestion = (questionId: string) => {
    setQuestions(prev => prev.filter(q => q.id !== questionId))
  }

  const handleMoveQuestion = (question: CustomQuestion, direction: "up" | "down") => {
    setQuestions(prev => {
      const currentIndex = prev.findIndex(q => q.id === question.id)
      if (currentIndex === -1) return prev
      
      const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
      if (newIndex < 0 || newIndex >= prev.length) return prev
      
      const newQuestions = [...prev]
      const [removed] = newQuestions.splice(currentIndex, 1)
      newQuestions.splice(newIndex, 0, removed)
      return newQuestions
    })
  }


  const handleCreate = async (publish: boolean) => {
    setError("")
    setFieldErrors({})

    // If trying to create an event with a suspended organization
    if (isOrgSuspendedOrRemoved(activeOrg)) {
      const msg = `You cannot create events because your membership in "${activeOrg?.name}" is suspended. Please switch to an active organization.`
      toast.error(msg)
      setError(msg)
      return
    }

    // If trying to publish with an unverified organization
    if (publish && activeOrg && !activeOrg.verified) {
      const msg = "You cannot publish events until your organization is verified. Please save as draft instead."
      toast.error(msg)
      setError(msg)
      return
    }
    
    const dateTime = date && time ? `${date}T${time}:00` : ""
    const endDateTimeInput = endDate && endTime ? `${endDate}T${endTime}:00` : ""
    
    // Validation
    const errors: { title?: string; date?: string; endDate?: string; doorsTime?: string; location?: string } = {}
    if (!title.trim()) errors.title = "Event title is required"
    if (!dateTime) errors.date = "Event date and time are required"
    if (!endDateTimeInput) {
      errors.endDate = "Event end date and time are required"
    } else if (date && time && endDate && endTime && isEndsBeforeOrEqualStarts(date, time, endDate, endTime)) {
      errors.endDate = "Event end date and time must be after start date and time"
    }
    if (!venueId) errors.location = "Please select a venue"
    if (doorsTime && time && isDoorsAfterStart(doorsTime, time)) {
      errors.doorsTime = `Doors open time must be before or at event start time (${time})`
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setError(errors.endDate || errors.doorsTime || errors.date || errors.title || errors.location || "Please fill in all required fields.")
      if ((errors.doorsTime || errors.endDate || errors.date || errors.title || errors.location) && step !== 1) {
        setStep(1)
      }
      return
    }

    // Check if user has an active organization
    const organizationId = selectedOrgId || activeOrgId || activeOrg?.id
    if (!organizationId) {
      toast.error("You need an active organization to create events.")
      setError("No active organization found. Please select or create an organization first.")
      return
    }

    let validTypes = ticketTypes.filter((t) => t.name && Number(t.quantity) > 0)
    if (entryType === "ticketed" && validTypes.length === 0) {
      setError("Add at least one ticket type with name and quantity.")
      return
    }

    if (isRecurring && generatedDates.length < 2) {
      setError("Add at least 2 dates to create a series.")
      return
    }

    setIsCreating(true)

    if (!bannerFile) {
      setError("Please upload a banner image to continue.")
      setIsCreating(false)
      return
    }

    let stepLabel = "create-event"
    let createdEventId: string | null = null

    try {
      // Determine category IDs to attach (strictly at most 3 categories)
      let categoryIds = selectedCategories.slice(0, 3)
      if (categoryIds.length === 0 && categoriesData?.data?.[0]?.id) {
        categoryIds = [categoriesData.data[0].id]
      }

      // Step 1: Create the event (draft)
      stepLabel = "create-event"
      toast.loading("Creating event...")
      const finalVisibility: Visibility = entryType === "invite_only" ? "private" : (visibility === "private" ? "private" : "public")
      const eventResult = await createEvent({
        event: {
          title: title.trim(),
          description: description.trim() || undefined,
          visibility: finalVisibility,
          timezone: "Africa/Addis_Ababa",
          currency: "ETB",
          organization_id: organizationId,
          category_ids: categoryIds,
        },
      }).unwrap()

      const eventId = eventResult.data.id
      createdEventId = eventId
      toast.dismiss()

      // Step 1b: Upload banner image (required)
      if (bannerFile) {
        toast.loading("Uploading banner image...")
        const mediaFormData = new FormData()
        mediaFormData.append("event_media[type]", "cover")
        mediaFormData.append("event_media[position]", "0")
        mediaFormData.append("event_media[alt_text]", title || "")
        mediaFormData.append("event_media[caption]", bannerCaption.trim())
        mediaFormData.append("file", bannerFile)
        try {
          await createEventMedia({ eventId, formData: mediaFormData }).unwrap()
        } catch (mediaErr: any) {
          const errDetail =
            mediaErr?.data?.errors?.type?.[0] ||
            mediaErr?.data?.error ||
            mediaErr?.data?.message ||
            ""
          if (
            errDetail.toLowerCase().includes("cover") ||
            errDetail.toLowerCase().includes("already")
          ) {
            console.warn("Event already has a cover, continuing setup")
          } else {
            throw mediaErr
          }
        }
        toast.dismiss()
      }

      // Step 1c: Upload gallery images (optional)
      if (galleryFiles.length > 0) {
        toast.loading(`Uploading ${galleryFiles.length} gallery image${galleryFiles.length > 1 ? "s" : ""}...`)
        for (let idx = 0; idx < galleryFiles.length; idx++) {
          const galleryFormData = new FormData()
          galleryFormData.append("event_media[type]", "gallery")
          galleryFormData.append("event_media[position]", String(idx + 1))
          galleryFormData.append("event_media[alt_text]", `${title || "Gallery"} ${idx + 1}`)
          galleryFormData.append("event_media[caption]", galleryFiles[idx].caption?.trim() || "")
          galleryFormData.append("file", galleryFiles[idx].file)
          await createEventMedia({ eventId, formData: galleryFormData }).unwrap()
        }
        toast.dismiss()
      }

      // Step 1d: Add promo video links (optional)
      const finalVideoLinks: VideoLinkInput[] = [...videoLinks]
      if (newVideoLink.url.trim()) {
        const check = validateYoutubeUrl(newVideoLink.url.trim())
        if (check.valid) {
          const cleanUrl = check.normalizedUrl || normalizeYoutubeUrl(newVideoLink.url.trim())
          finalVideoLinks.push({
            _id: crypto.randomUUID(),
            title: newVideoLink.title.trim() || "Event Promo Video",
            url: cleanUrl,
            provider: "youtube",
          })
        }
      }

      if (finalVideoLinks.length > 0) {
        toast.loading(`Adding ${finalVideoLinks.length} promo video${finalVideoLinks.length > 1 ? "s" : ""}...`)
        for (let idx = 0; idx < finalVideoLinks.length; idx++) {
          const vl = finalVideoLinks[idx]
          const cleanUrl = normalizeYoutubeUrl(vl.url)
          if (cleanUrl) {
            try {
              await createEventVideoLink({
                eventId,
                videoLink: {
                  title: vl.title.trim() || "Event Promo Video",
                  url: cleanUrl,
                  provider: "youtube",
                  position: idx,
                },
              }).unwrap()
            } catch (vErr: any) {
              console.error("Failed to create video link:", vErr)
              const errDetail =
                vErr?.data?.errors?.url?.[0] ||
                vErr?.data?.error ||
                vErr?.data?.message ||
                "Failed to attach video link"
              toast.error(`Video "${vl.title || vl.url}": ${errDetail}`)
            }
          }
        }
        toast.dismiss()
      }

      toast.loading("Setting up event schedule...")

      // Step 2: Add event date(s)
      stepLabel = "create-event-date"
      const startDateTime = new Date(dateTime).toISOString()
      const endDateTime = new Date(endDateTimeInput).toISOString()
      const doorsDateTime = date && doorsTime ? `${date}T${doorsTime}:00` : undefined

      const createdDateIds: string[] = []
      if (isRecurring && generatedDates.length > 1) {
        const durationMs = new Date(endDateTimeInput).getTime() - new Date(dateTime).getTime()
        for (let idx = 0; idx < generatedDates.length; idx++) {
          const dStart = new Date(generatedDates[idx])
          const dEnd = new Date(dStart.getTime() + (durationMs > 0 ? durationMs : 4 * 3600000))
          let dDoors: string | undefined = undefined
          if (doorsTime) {
            const dStr = generatedDates[idx].split("T")[0]
            dDoors = new Date(`${dStr}T${doorsTime}:00`).toISOString()
          }
          const dRes = await createEventDate({
            eventId,
            date: {
              name: idx === 0 ? "Main Event" : `Session ${idx + 1}`,
              starts_at: dStart.toISOString(),
              ends_at: dEnd.toISOString(),
              doors_at: dDoors,
              timezone: "Africa/Addis_Ababa",
              venue_id: venueId,
              venue_capacity: venueCapacity ? Number(venueCapacity) : undefined,
            },
          }).unwrap()
          createdDateIds.push(dRes.data.id)
        }
      } else {
        const dateResult = await createEventDate({
          eventId,
          date: {
            name: "Main Event",
            starts_at: startDateTime,
            ends_at: endDateTime,
            doors_at: doorsDateTime ? new Date(doorsDateTime).toISOString() : undefined,
            timezone: "Africa/Addis_Ababa",
            venue_id: venueId,
            venue_capacity: venueCapacity ? Number(venueCapacity) : undefined,
          },
        }).unwrap()
        createdDateIds.push(dateResult.data.id)
      }

      const eventDateId = createdDateIds[0]
      toast.dismiss()
      toast.loading("Setting up entry & tickets...")

      // Step 3: Add event products (tickets / RSVP / Free / Invite)
      stepLabel = "create-event-product"
      if (entryType === "ticketed" && validTypes.length > 0) {
        for (let idx = 0; idx < validTypes.length; idx++) {
          const t = validTypes[idx]
          const priceAmount = Math.round((Number(t.price) || 0) * 100)
          const admissionsCount = t.admissionsPerUnit ? Math.max(1, parseInt(t.admissionsPerUnit, 10)) : 1
          const prodResult = await createEventProduct({
            eventId,
            idempotencyKey: `prod-${eventId}-${idx}-${Date.now()}`,
            product: {
              name: t.name,
              type: "ticket",
              description: t.description || undefined,
              allow_custom_price: Boolean(t.allowCustomPrice),
              sales_start_at: t.salesStart ? new Date(t.salesStart).toISOString() : undefined,
              sales_end_at: t.salesEnd ? new Date(t.salesEnd).toISOString() : undefined,
              min_per_order: 1,
              max_per_order: t.maxPerPerson ? Number(t.maxPerPerson) : 10,
              sort_order: idx + 1,
              ticket_type_attributes: {
                approval_mode: "automatic",
                audience: "public",
                date_selection: isRecurring ? mapDateSelection(t.dateSelection) : "fixed",
                admissions_per_unit: admissionsCount,
                entry_validation_mode: t.entryValidationMode || "qr",
              },
              price_attributes: {
                type: "base",
                currency: "ETB",
                amount_minor: priceAmount,
                active_from: t.salesStart ? new Date(t.salesStart).toISOString() : new Date().toISOString(),
                active_to: t.salesEnd ? new Date(t.salesEnd).toISOString() : undefined,
              },
              inventory_configuration: {
                mode: "per_date",
                dates: createdDateIds.map((dId) => ({
                  event_date_id: dId,
                  capacity: Number(t.quantity) || 100,
                })),
              },
            },
          }).unwrap()

          if (prodResult.data?.id) {
            try {
              await activateEventProduct({ eventId, productId: prodResult.data.id }).unwrap()
            } catch {
              // Activation may require published event or full verification
            }
          }
        }
      } else if (entryType === "rsvp") {
        const rsvpCap = rsvpCapacity ? Number(rsvpCapacity) : 1000
        const rsvpResult = await createEventProduct({
          eventId,
          idempotencyKey: `rsvp-${eventId}-${Date.now()}`,
          product: {
            name: "RSVP",
            type: "ticket",
            description: "RSVP Registration",
            allow_custom_price: false,
            min_per_order: 1,
            max_per_order: 5,
            sort_order: 1,
            ticket_type_attributes: {
              approval_mode: requiresApproval ? "manual" : "automatic",
              audience: "public",
              date_selection: "fixed",
              admissions_per_unit: 1,
            },
            price_attributes: {
              type: "base",
              currency: "ETB",
              amount_minor: 0,
              active_from: new Date().toISOString(),
            },
            inventory_configuration: {
              mode: "per_date",
              dates: [
                {
                  event_date_id: eventDateId,
                  capacity: rsvpCap,
                },
              ],
            },
          },
        }).unwrap()

        if (rsvpResult.data?.id) {
          try {
            await activateEventProduct({ eventId, productId: rsvpResult.data.id }).unwrap()
          } catch {
            // Activation optional at draft time
          }
        }
      } else if (entryType === "free") {
        const freeResult = await createEventProduct({
          eventId,
          idempotencyKey: `free-${eventId}-${Date.now()}`,
          product: {
            name: "Free Admission",
            type: "ticket",
            description: "General free admission",
            allow_custom_price: false,
            min_per_order: 1,
            max_per_order: 10,
            sort_order: 1,
            ticket_type_attributes: {
              approval_mode: "automatic",
              audience: "public",
              date_selection: "fixed",
              admissions_per_unit: 1,
            },
            price_attributes: {
              type: "base",
              currency: "ETB",
              amount_minor: 0,
              active_from: new Date().toISOString(),
            },
            inventory_configuration: {
              mode: "per_date",
              dates: [
                {
                  event_date_id: eventDateId,
                  capacity: 5000,
                },
              ],
            },
          },
        }).unwrap()

        if (freeResult.data?.id) {
          try {
            await activateEventProduct({ eventId, productId: freeResult.data.id }).unwrap()
          } catch {
            // Activation optional at draft time
          }
        }
      } else if (entryType === "invite_only") {
        const inviteAudience = useCodesSection && !useGuestSection ? "access_code" : (!useCodesSection && useGuestSection ? "invitation" : "code_or_invitation")
        const inviteResult = await createEventProduct({
          eventId,
          idempotencyKey: `invite-${eventId}-${Date.now()}`,
          product: {
            name: "Invite Only Admission",
            type: "ticket",
            description: "Exclusive guest admission",
            allow_custom_price: false,
            min_per_order: 1,
            max_per_order: 5,
            sort_order: 1,
            ticket_type_attributes: {
              approval_mode: "automatic",
              audience: inviteAudience,
              date_selection: "fixed",
              admissions_per_unit: 1,
            },
            price_attributes: {
              type: "base",
              currency: "ETB",
              amount_minor: 0,
              active_from: new Date().toISOString(),
            },
            inventory_configuration: {
              mode: "per_date",
              dates: [
                {
                  event_date_id: eventDateId,
                  capacity: 1000,
                },
              ],
            },
          },
        }).unwrap()

        const productId = inviteResult.data?.id
        if (productId) {
          try {
            await activateEventProduct({ eventId, productId }).unwrap()
          } catch {
            // Activation optional at draft time
          }

          // Add access codes
          if (inviteCodes.length > 0) {
            await Promise.all(
              inviteCodes.map((c) =>
                createAccessCode({
                  eventId,
                  productId,
                  idempotencyKey: `code-${productId}-${c._id}`,
                  accessCode: {
                    code: c.code,
                    label: c.label || undefined,
                    max_uses: c.useType === "single" ? 1 : c.useType === "limited" ? Number(c.maxUses) : null,
                    active: true,
                    expires_at: c.hasExpiry && c.expiresAt ? new Date(c.expiresAt).toISOString() : undefined,
                  },
                }).unwrap()
              )
            )
          }

          // Add invitations (guest list)
          if (guests.length > 0) {
            await Promise.all(
              guests.map((g) =>
                createInvitation({
                  eventId,
                  productId,
                  idempotencyKey: `inv-${productId}-${g._id}`,
                  invitation: {
                    name: g.name || undefined,
                    email: g.contact.includes("@") ? g.contact : undefined,
                    phone: !g.contact.includes("@") ? g.contact : undefined,
                    allowed_quantity: g.allowedGuests || 1,
                  },
                }).unwrap()
              )
            )
          }
        }
      }

      // Step 4: Add custom questions (Registration Form & Version)
      if (questions.length > 0) {
        toast.dismiss()
        toast.loading("Setting up registration questions...")
        const formResult = await createRegistrationForm({
          eventId,
          form: { name: "Attendee Registration", active: true },
        }).unwrap()

        const formId = formResult.data?.id
        if (formId) {
          const mappedQuestions = questions.map((q, idx) => ({
            key: `question_${idx + 1}`,
            type: (q.type === "textarea"
              ? "long_text"
              : q.type === "number"
              ? "number"
              : q.type === "select"
              ? "single_choice"
              : q.type === "checkbox"
              ? "checkbox"
              : "short_text") as any,
            response_scope: "registration" as const,
            sensitivity: "standard" as const,
            label: q.label,
            help_text: q.placeholder || undefined,
            required: q.required,
            position: idx,
            options: q.options ? q.options.split(",").map((o) => o.trim()).filter(Boolean) : undefined,
          }))

          const versionResult = await createRegistrationFormVersion({
            eventId,
            formId,
            version: 1,
            questions: mappedQuestions,
          }).unwrap()

          const versionId = versionResult.data?.id
          if (versionId) {
            try {
              await publishRegistrationFormVersion({
                eventId,
                formId,
                versionId,
                idempotencyKey: `rf-pub-${formId}-${versionId}`,
              }).unwrap()
            } catch {
              // Form version publish can proceed
            }
          }
        }
      }

      // Step 4b: Add lineup / participants (optional)
      stepLabel = "create-event-participants"
      const finalParticipants = [...participants]
      if (newParticipant.name.trim()) {
        const flushedParticipant: ParticipantInput = {
          _id: crypto.randomUUID(),
          name: newParticipant.name.trim(),
          type: newParticipant.type || "performer",
          description: newParticipant.description.trim(),
          artistId: newParticipant.artistId,
        }
        finalParticipants.push(flushedParticipant)
        setParticipants(finalParticipants)
        setNewParticipant({ name: "", type: "performer", description: "", artistId: "" })
      }

      if (finalParticipants.length > 0) {
        toast.dismiss()
        toast.loading(`Adding ${finalParticipants.length} lineup participant${finalParticipants.length > 1 ? "s" : ""}...`)
        for (let pIdx = 0; pIdx < finalParticipants.length; pIdx++) {
          const p = finalParticipants[pIdx]
          if (p.name.trim()) {
            try {
              await createEventParticipant({
                eventId,
                participant: {
                  event_date_id: eventDateId,
                  name: p.name.trim(),
                  type: p.type || "performer",
                  artist_id: p.artistId || undefined,
                  description: p.description.trim() || undefined,
                  display_order: pIdx + 1,
                },
              }).unwrap()
            } catch (pErr: any) {
              console.warn("Failed to create participant:", pErr)
              const errMsg = pErr?.data?.message || pErr?.data?.errors?.name?.[0] || pErr?.data?.error || pErr?.message || "Server error"
              toast.error(`Lineup error for "${p.name}": ${errMsg}`)
            }
          }
        }
      }

      // Step 4c: Add collaborator organizations (optional)
      stepLabel = "create-event-collaborators"
      const finalCollaborators = [...collaborators]
      if (newCollaborator.organizationId) {
        const matchedOrg = organizations?.find((o) => o.id === newCollaborator.organizationId)
        const flushedCollab: CollaboratorInput = {
          _id: crypto.randomUUID(),
          organizationId: newCollaborator.organizationId,
          orgName: matchedOrg?.name || "Collaborator Org",
          type: newCollaborator.type || "co_organizer",
          role: newCollaborator.role || "collaborator",
        }
        finalCollaborators.push(flushedCollab)
        setCollaborators(finalCollaborators)
        setNewCollaborator({ organizationId: "", type: "co_organizer", role: "collaborator" })
      }

      if (finalCollaborators.length > 0) {
        for (const col of finalCollaborators) {
          if (col.organizationId) {
            try {
              await createEventOrganization({
                eventId,
                organization: {
                  organization_id: col.organizationId,
                  type: col.type || "co_organizer",
                  role: "collaborator",
                },
              }).unwrap()
            } catch (cErr) {
              console.warn("Failed to create collaborator org:", cErr)
            }
          }
        }
      }

      // Step 5: Publish if requested
      if (publish) {
        toast.dismiss()
        toast.loading("Publishing event...")
        await publishEvent({
          id: eventId,
          idempotencyKey: `event-publish-${eventId}-${Date.now()}`,
        }).unwrap()
      }

      // Success!
      toast.dismiss()
      toast.success(publish ? "Event published successfully!" : "Event saved as draft")
      
      if (onSuccess) {
        onSuccess()
      } else {
        router.push(`/organizer/events/${eventId}`)
      }
      
    } catch (err: any) {
      toast.dismiss()
      // The event itself may already exist at this point (publish runs last).
      // A 403 here almost always means the organization is not verified yet —
      // say so plainly instead of surfacing the raw "not authorized" error.
      const isPublishForbidden =
        createdEventId !== null &&
        (err?.status === 403 || err?.data?.code === "not_authorized" || err?.data?.code === "organization_not_verified")
      
      let errorMessage = "Failed to create event. Please try again."
      if (isPublishForbidden) {
        errorMessage = "Event saved as a draft — you cannot publish until your organization is verified. Submit your organization for verification, then publish again after approval."
      } else if (err?.data?.errors) {
        let hasDateError = false
        if (err.data.errors.doors_at) {
          const doorsMsg = Array.isArray(err.data.errors.doors_at) ? err.data.errors.doors_at[0] : String(err.data.errors.doors_at)
          setFieldErrors((p) => ({ ...p, doorsTime: doorsMsg }))
          hasDateError = true
        }
        if (err.data.errors.ends_at) {
          const endsMsg = Array.isArray(err.data.errors.ends_at) ? err.data.errors.ends_at[0] : String(err.data.errors.ends_at)
          setFieldErrors((p) => ({ ...p, endDate: endsMsg }))
          hasDateError = true
        }
        if (err.data.errors.starts_at) {
          const startsMsg = Array.isArray(err.data.errors.starts_at) ? err.data.errors.starts_at[0] : String(err.data.errors.starts_at)
          setFieldErrors((p) => ({ ...p, date: startsMsg }))
          hasDateError = true
        }

        const errorEntries = Object.entries(err.data.errors)
        errorMessage = errorEntries
          .map(([key, msgs]) => `${key.replace(/_/g, " ")}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`)
          .join(" | ") || "Validation failed"

        if (hasDateError) {
          setStep(1)
        }
      } else {
        errorMessage = err?.data?.error || err?.data?.message || err?.message || "Failed to create event. Please try again."
      }

      toast.error(errorMessage)
      setError(errorMessage)
      console.error("Event creation error:", err)
    } finally {
      setIsCreating(false)
    }
  }

  const isLoading = isCreating || isCreatingEvent || isPublishingEvent
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
      <div className="sticky top-0 z-10 bg-popover pb-3">
      {/* Step indicators */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className="flex items-center gap-2">
              {/* Circle with number or checkmark */}
              <div
                className={`size-8 rounded-full flex items-center justify-center transition-all ${
                  i < step 
                    ? `border-2 ${selectedEntryType.borderClass} ${selectedEntryType.bgClass}/10` 
                    : i === step 
                      ? `${selectedEntryType.bgClass} text-white shadow-sm`
                      : "border-2 border-border bg-background"
                }`}
              >
                {i < step ? (
                  <HugeiconsIcon icon={Tick02Icon} strokeWidth={3} className={`size-4 ${selectedEntryType.textClass}`} />
                ) : (
                  <span className={`text-sm font-bold ${i === step ? "text-white" : "text-muted-foreground"}`}>
                    {i + 1}
                  </span>
                )}
              </div>
              {/* Step label */}
              <span className={`text-sm font-medium hidden sm:inline ${i === step ? "text-foreground font-semibold" : i < step ? "text-foreground" : "text-muted-foreground"}`}>
                {s}
              </span>
            </div>
            {/* Connecting line */}
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 rounded-full transition-colors ${i < step ? selectedEntryType.bgClass : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden pr-1">
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-border/40">
              <div>
                <h2 className="font-bold text-lg mb-1">How do people get in?</h2>
                <p className="text-muted-foreground text-sm">Choose the entry model for your event</p>
              </div>
              {activeOrg && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-lime-500/10 border border-lime-500/20 text-xs self-start sm:self-auto">
                  <span className="text-muted-foreground">Hosting as:</span>
                  <span className="font-semibold text-foreground">{activeOrg.name}</span>
                  {activeOrg.verified && (
                    <span className="text-[10px] text-lime-600 dark:text-lime-400 font-medium">✓ Verified</span>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {ENTRY_TYPES.map((et) => (
                <button
                  key={et.value}
                  type="button"
                  onClick={() => handleEntryTypeSelect(et.value)}
                  className={`text-left p-4 rounded-2xl border-2 transition-all relative ${
                    entryType === et.value ? `${et.borderClass} ${et.bgClass}/10` : "border-border/40 hover:border-border bg-card/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={entryType === et.value ? et.textClass : "text-muted-foreground"}>
                      {et.icon}
                    </div>
                    {entryType === et.value && (
                      <span className={`size-5 rounded-full ${et.bgClass} text-white flex items-center justify-center shadow-xs`}>
                        <HugeiconsIcon icon={Tick02Icon} strokeWidth={3} className="size-3" />
                      </span>
                    )}
                  </div>
                  <div className="font-semibold text-sm">{et.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{et.desc}</div>
                  {et.value === "invite_only" && (
                    <div className="mt-2 text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md inline-block">
                      Forces private visibility
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-bold text-base">Who can discover this event?</h2>
                {entryType === "invite_only" && (
                  <Badge variant="outline" className="text-[10px] text-amber-600 dark:text-amber-400 border-amber-500/30">
                    Locked to Private for Invite Only
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-sm mb-3">Controls whether it appears in the browse page</p>
              <div className="space-y-2">
                {VISIBILITY_OPTIONS.map((v) => {
                  const isLocked = entryType === "invite_only" && v.value === "public"
                  const effectiveVisibility = entryType === "invite_only" ? "private" : visibility
                  const isSelected = effectiveVisibility === v.value
                  return (
                    <button
                      key={v.value}
                      type="button"
                      disabled={isLocked}
                      onClick={() => {
                        if (!isLocked) {
                          setVisibility(v.value)
                        }
                      }}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-all flex items-start gap-3 ${
                        isLocked
                          ? "opacity-40 cursor-not-allowed border-border/30 bg-muted/20"
                          : isSelected
                          ? `${selectedEntryType.borderClass} ${selectedEntryType.bgClass}/10`
                          : "border-border/40 hover:border-border bg-card/50"
                      }`}
                    >
                      <div className={`mt-0.5 ${isSelected ? selectedEntryType.textClass : "text-muted-foreground"}`}>
                        {v.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm flex items-center gap-2">
                          {v.label}
                          {isLocked && <span className="text-[10px] text-muted-foreground font-normal">(Unavailable for Invite Only)</span>}
                        </div>
                        <div className="text-xs text-muted-foreground">{v.desc}</div>
                      </div>
                      {isSelected && (
                        <div className={`ml-auto size-4 ${selectedEntryType.bgClass} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-2.5 text-white" />
                        </div>
                      )}
                    </button>
                  )
                })}
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
                variant={(entryType === "invite_only" ? "private" : visibility) === "public" ? "info" : "violet"} 
                className="text-xs gap-1.5 font-semibold"
              >
                {VISIBILITY_OPTIONS.find((v) => v.value === (entryType === "invite_only" ? "private" : visibility))?.icon}
                {entryType === "invite_only" ? "Private" : (visibility.charAt(0).toUpperCase() + visibility.slice(1))}
              </Badge>
            </div>

            {/* Organization Info / Active Workspace */}
            {activeOrg ? (
              <div className="flex items-center justify-between rounded-xl border border-lime-500/20 bg-lime-500/10 px-3.5 py-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">Hosting Organization:</span>
                  <span className="font-medium text-foreground">{activeOrg.name}</span>
                  {activeOrg.verified ? (
                    <span className="text-[10px] text-lime-600 dark:text-lime-400 font-medium">✓ Verified</span>
                  ) : (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">• Unverified Draft</span>
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground hidden sm:inline">
                  (Switch active workspace via sidebar)
                </span>
              </div>
            ) : !isLoadingOrgs && organizations.length === 0 ? (
              <div className="flex items-center justify-between rounded-xl border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
                <span>No organization found. Please complete organizer onboarding first.</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => router.push("/organizer/onboarding-org")}
                >
                  Set Up Organization
                </Button>
              </div>
            ) : null}

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
              <div className="flex items-center justify-between">
                <Label htmlFor="desc" className="text-sm font-semibold">Description</Label>
                <span className="text-[11px] text-muted-foreground">{description.length} characters</span>
              </div>
              <textarea
                id="desc"
                placeholder="Tell people what to expect at your event..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex min-h-[100px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              />
            </div>

            {/* Category Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">
                  Category <span className="text-destructive">*</span>
                </Label>
                <span className="text-xs text-muted-foreground">
                  {selectedCategories.length}/3 selected (up to 3)
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {categoriesData?.data && categoriesData.data.length > 0 ? (
                  <>
                    {(showAllCategories ? categoriesData.data : categoriesData.data.slice(0, 8)).map((cat) => {
                      const isSelected = selectedCategories.includes(cat.id)
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedCategories((prev) => prev.filter((id) => id !== cat.id))
                            } else {
                              if (selectedCategories.length >= 3) {
                                toast.error("You can select up to 3 categories")
                                return
                              }
                              setSelectedCategories((prev) => [...prev, cat.id])
                              setFieldErrors((prev) => {
                                const next = { ...prev }
                                delete next.category
                                return next
                              })
                            }
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                            isSelected
                              ? `${selectedEntryType.bgClass} text-white ${selectedEntryType.borderClass} shadow-xs font-semibold`
                              : "border-border/60 bg-card/60 hover:border-border text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {isSelected && <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.5} className="size-3 inline-block mr-1" />}
                          {cat.name}
                        </button>
                      )
                    })}
                    {categoriesData.data.length > 8 && (
                      <button
                        type="button"
                        onClick={() => setShowAllCategories((v) => !v)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium border border-dashed border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-all"
                      >
                        {showAllCategories ? "Show less" : `+${categoriesData.data.length - 8} more`}
                      </button>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">Loading categories...</p>
                )}
              </div>
              {fieldErrors.category && (
                <p className="text-xs text-destructive mt-1 font-medium">{fieldErrors.category}</p>
              )}
            </div>

            {/* Date & Schedule Grouped Card */}
            <div className="rounded-2xl border border-border/50 bg-card/40 p-4 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/30">
                <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className={`size-4 ${selectedEntryType.textClass}`} />
                <span className="font-semibold text-sm">Date & Schedule</span>
              </div>

              {/* Start Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Start Date <span className="text-destructive">*</span></Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => {
                      const v = e.target.value
                      setDate(v)
                      if (!endDate || endDate < v) {
                        setEndDate(v)
                      }
                      if (!endTime && time) {
                        const [h, m] = time.split(":").map(Number)
                        const nextH = h + 4
                        if (nextH >= 24) {
                          const d = new Date(v)
                          d.setDate(d.getDate() + 1)
                          setEndDate(d.toISOString().split("T")[0])
                        }
                        setEndTime(`${String(nextH % 24).padStart(2, "0")}:${String(m).padStart(2, "0")}`)
                      }
                      if (fieldErrors.date) setFieldErrors((p) => ({ ...p, date: undefined }))
                      if (fieldErrors.endDate) setFieldErrors((p) => ({ ...p, endDate: undefined }))
                    }}
                    className={`h-10 ${fieldErrors.date ? "border-destructive focus-visible:border-destructive" : ""}`}
                  />
                  {fieldErrors.date && <p className="text-destructive text-xs">{fieldErrors.date}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Start Time <span className="text-destructive">*</span></Label>
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => {
                      const v = e.target.value
                      setTime(v)
                      if (!endTime && v) {
                        const [h, m] = v.split(":").map(Number)
                        const nextH = h + 4
                        if (nextH >= 24 && date) {
                          const d = new Date(date)
                          d.setDate(d.getDate() + 1)
                          setEndDate(d.toISOString().split("T")[0])
                        }
                        setEndTime(`${String(nextH % 24).padStart(2, "0")}:${String(m).padStart(2, "0")}`)
                      }
                      if (doorsTime && v && isDoorsAfterStart(doorsTime, v)) {
                        setFieldErrors((p) => ({ ...p, doorsTime: `Doors open time must be before or at event start time (${v})` }))
                      } else if (doorsTime) {
                        setFieldErrors((p) => ({ ...p, doorsTime: undefined }))
                      }
                      if (fieldErrors.endDate) setFieldErrors((p) => ({ ...p, endDate: undefined }))
                    }}
                    className="h-10"
                  />
                </div>
              </div>

              {/* End Date & Time (required) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">End Date <span className="text-destructive">*</span></Label>
                  <Input
                    type="date"
                    value={endDate}
                    min={date || undefined}
                    onChange={(e) => {
                      setEndDate(e.target.value)
                      if (fieldErrors.endDate) setFieldErrors((p) => ({ ...p, endDate: undefined }))
                    }}
                    className={`h-10 ${fieldErrors.endDate ? "border-destructive focus-visible:border-destructive" : ""}`}
                  />
                  {fieldErrors.endDate && <p className="text-destructive text-xs">{fieldErrors.endDate}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">End Time <span className="text-destructive">*</span></Label>
                  <Input
                    type="time"
                    value={endTime}
                    min={endDate === date ? time : undefined}
                    onChange={(e) => {
                      setEndTime(e.target.value)
                      if (fieldErrors.endDate) setFieldErrors((p) => ({ ...p, endDate: undefined }))
                    }}
                    className={`h-10 ${fieldErrors.endDate ? "border-destructive focus-visible:border-destructive" : ""}`}
                  />
                </div>
              </div>

              {/* Doors Open Time (Optional) */}
              <div className="pt-2 border-t border-border/30">
                <div className="flex items-center justify-between mb-1.5">
                  <Label htmlFor="doorsTime" className="text-xs font-semibold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    Doors Open <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
                  </Label>
                  <span className="text-[11px] text-muted-foreground">When attendees can enter venue</span>
                </div>
                <Input
                  id="doorsTime"
                  type="time"
                  value={doorsTime}
                  max={time || undefined}
                  onChange={(e) => {
                    const v = e.target.value
                    setDoorsTime(v)
                    if (v && time && isDoorsAfterStart(v, time)) {
                      setFieldErrors((p) => ({ ...p, doorsTime: `Doors open time must be before or at event start time (${time})` }))
                    } else {
                      setFieldErrors((p) => ({ ...p, doorsTime: undefined }))
                    }
                  }}
                  className={`h-10 ${fieldErrors.doorsTime ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30" : ""}`}
                />
                {fieldErrors.doorsTime && (
                  <p className="text-destructive text-xs mt-1.5 flex items-center gap-1">
                    <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-3.5 shrink-0" />
                    <span>{fieldErrors.doorsTime}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-semibold">
                Venue / Location <span className="text-destructive">*</span>
              </Label>
              {isLoadingVenues ? (
                <p className="text-xs text-muted-foreground">Loading venues...</p>
              ) : venuesData?.data && venuesData.data.length > 0 ? (
                <Select
                  value={venueId}
                  onValueChange={(v) => { setVenueId(v); if (fieldErrors.location) setFieldErrors((p) => ({ ...p, location: undefined })) }}
                >
                  <SelectTrigger id="location" className={`h-11 w-full ${fieldErrors.location ? "border-destructive" : ""}`}>
                    <SelectValue placeholder="Select a venue..." />
                  </SelectTrigger>
                  <SelectContent>
                    {venuesData.data.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name}{v.city ? ` — ${v.city}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-xs text-muted-foreground">No venues available. Please ask an admin to create one first.</p>
              )}
              {fieldErrors.location && <p className="text-destructive text-xs">{fieldErrors.location}</p>}
            </div>

            {venueId && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="venueCapacity" className="text-xs font-medium text-muted-foreground">
                    Venue Max Capacity (Optional)
                  </Label>
                  <span className="text-[11px] text-muted-foreground">Overrides venue default for this event date</span>
                </div>
                <Input
                  id="venueCapacity"
                  type="number"
                  placeholder="e.g. 5000"
                  value={venueCapacity}
                  onChange={(e) => setVenueCapacity(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>
            )}

            {/* Optional: Online Link */}
            <div className={`rounded-2xl border transition-colors ${showOnlineLink ? `${selectedEntryType.borderClass} ${selectedEntryType.bgClass}/10` : "border-border/50 bg-card/50"}`}>
              <div
                role="button"
                tabIndex={0}
                className="w-full flex items-center gap-3 p-4 text-left cursor-pointer"
                onClick={() => setShowOnlineLink((v) => !v)}
                onKeyDown={(e) => e.key === "Enter" && setShowOnlineLink((v) => !v)}
              >
                <div className={`p-2 rounded-xl flex-shrink-0 transition-colors ${showOnlineLink ? `${selectedEntryType.bgClass}/15` : "bg-muted"}`}>
                  <HugeiconsIcon icon={Link01Icon} strokeWidth={2} className={`w-4 h-4 ${showOnlineLink ? selectedEntryType.textClass : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">Online Link</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Optional — add Zoom, Meet, or livestream URL</p>
                </div>
                <Switch 
                  checked={showOnlineLink} 
                  onCheckedChange={setShowOnlineLink} 
                  className="flex-shrink-0 data-checked:[&]:bg-[var(--event-color)]" 
                  style={{ "--event-color": `var(${selectedEntryType.color})` } as React.CSSProperties}
                  onClick={(e) => e.stopPropagation()} 
                />
              </div>
              <AnimatePresence initial={false}>
                {showOnlineLink && (
                  <motion.div
                    key="online-link-body"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3 border-t border-border/40 pt-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Event URL</Label>
                        <div className="relative">
                          <HugeiconsIcon
                            icon={Link01Icon}
                            strokeWidth={2}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                          />
                          <Input
                            id="onlineUrl"
                            placeholder="https://zoom.us/j/..."
                            value={onlineUrl}
                            onChange={(e) => setOnlineUrl(e.target.value)}
                            className="h-9 text-sm pl-10"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Required: Banner Image (uploaded file) */}
            <div className="rounded-2xl border border-border/50 bg-card/50">
              <div className="w-full flex items-center gap-3 p-4">
                <div className={`p-2 rounded-xl flex-shrink-0 bg-muted`}>
                  <HugeiconsIcon icon={ImageAddIcon} strokeWidth={2} className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">
                    Cover Image <span className="text-destructive">*</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Upload a cover image for the event</p>
                </div>
              </div>
              <div className="px-4 pb-4 space-y-3 border-t border-border/40 pt-3">
                <input
                  id="banner"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null
                    setBannerFile(file)
                    if (bannerPreview) URL.revokeObjectURL(bannerPreview)
                    setBannerPreview(file ? URL.createObjectURL(file) : "")
                    if (file && fieldErrors.banner) {
                      setFieldErrors((p) => ({ ...p, banner: undefined }))
                    }
                  }}
                />
                <Label
                  htmlFor="banner"
                  className="flex items-center justify-center gap-2 h-10 w-full rounded-xl border border-dashed border-border cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <HugeiconsIcon icon={Upload01Icon} strokeWidth={2} className="size-4" />
                  {bannerFile ? bannerFile.name : "Choose image to upload"}
                </Label>
                {bannerPreview && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium">Preview</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div></div>
                      <div className="relative group">
                        <div className="bg-card border border-border/60 rounded-xl overflow-hidden">
                          <img
                            src={bannerPreview}
                            alt="Banner preview"
                            className="w-full h-full object-cover aspect-[4/5] pointer-events-none"
                          />
                        </div>
                        <Input
                          placeholder="Caption..."
                          value={bannerCaption}
                          onChange={(e) => setBannerCaption(e.target.value)}
                          className="mt-1 h-6 text-[10px] px-1.5 bg-background/90"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            URL.revokeObjectURL(bannerPreview)
                            setBannerPreview("")
                            setBannerFile(null)
                            setBannerCaption("")
                          }}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove cover photo"
                        >
                          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-3" />
                        </button>
                      </div>
                      <div></div>
                    </div>
                  </div>
                )}
                {fieldErrors.banner && (
                  <p className="text-xs text-destructive">{fieldErrors.banner}</p>
                )}
              </div>
            </div>

            {/* Optional: Gallery Images */}
            <div className={`rounded-2xl border transition-colors ${showGallery ? `${selectedEntryType.borderClass} ${selectedEntryType.bgClass}/10` : "border-border/50 bg-card/50"}`}>
              <div
                role="button"
                tabIndex={0}
                className="w-full flex items-center gap-3 p-4 text-left cursor-pointer"
                onClick={() => toggleGallery(!showGallery)}
                onKeyDown={(e) => e.key === "Enter" && toggleGallery(!showGallery)}
              >
                <div className={`p-2 rounded-xl flex-shrink-0 transition-colors ${showGallery ? `${selectedEntryType.bgClass}/15` : "bg-muted"}`}>
                  <HugeiconsIcon icon={ImageAddIcon} strokeWidth={2} className={`w-4 h-4 ${showGallery ? selectedEntryType.textClass : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">Gallery Images</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Optional — add up to {MAX_GALLERY} images ({galleryFiles.length}/{MAX_GALLERY})
                  </p>
                </div>
                <Switch
                  checked={showGallery}
                  onCheckedChange={(v) => toggleGallery(v)}
                  className="flex-shrink-0 data-checked:[&]:bg-[var(--event-color)]"
                  style={{ "--event-color": `var(${selectedEntryType.color})` } as React.CSSProperties}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <AnimatePresence initial={false}>
                {showGallery && (
                  <motion.div
                    key="gallery-body"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3 border-t border-border/40 pt-3">
                      {galleryFiles.length > 0 && (
                        <>
                          <p className="text-xs text-muted-foreground">Drag images to reorder — position 1 uploads first.</p>
                          <Reorder.Group
                            axis="x"
                            values={galleryFiles}
                            onReorder={setGalleryFiles}
                            className="grid grid-cols-3 gap-2 list-none p-0 m-0"
                          >
                            {galleryFiles.map((item, idx) => (
                              <Reorder.Item
                                key={item.preview}
                                value={item}
                                className="relative group cursor-grab active:cursor-grabbing"
                                whileDrag={{ scale: 1.05, zIndex: 10 }}
                              >
                                <div className="bg-card border border-border/60 rounded-xl overflow-hidden">
                                  <img
                                    src={item.preview}
                                    alt={`Gallery ${idx + 1}`}
                                    className="w-full h-full object-cover aspect-[4/5] pointer-events-none"
                                  />
                                </div>
                                <Input
                                  placeholder="Caption..."
                                  value={item.caption || ""}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    setGalleryFiles((prev) => prev.map((g, i) => i === idx ? { ...g, caption: val } : g))
                                  }}
                                  className="mt-1 h-6 text-[10px] px-1.5 bg-background/90"
                                  onPointerDown={(e) => e.stopPropagation()}
                                />
                                <button
                                  type="button"
                                  onPointerDown={(e) => e.stopPropagation()}
                                  onClick={() => {
                                    URL.revokeObjectURL(item.preview)
                                    setGalleryFiles((prev) => prev.filter((g) => g.preview !== item.preview))
                                  }}
                                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-3" />
                                </button>
                                <span className="absolute bottom-8 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                  {idx + 1}
                                </span>
                              </Reorder.Item>
                            ))}
                          </Reorder.Group>
                        </>
                      )}
                      {galleryFiles.length < MAX_GALLERY && (
                        <>
                          <input
                            id="gallery"
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                              const files = Array.from(e.target.files ?? [])
                              const remaining = MAX_GALLERY - galleryFiles.length
                              const toAdd = files.slice(0, remaining)
                              const newItems = toAdd.map((file) => ({
                                file,
                                preview: URL.createObjectURL(file),
                                caption: "",
                              }))
                              setGalleryFiles((prev) => [...prev, ...newItems])
                              e.target.value = ""
                            }}
                          />
                          <Label
                            htmlFor="gallery"
                            className="flex items-center justify-center gap-2 h-10 w-full rounded-xl border border-dashed border-border cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                          >
                            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4" />
                            Add gallery images
                          </Label>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Optional: Video Links */}
            <div className={`rounded-2xl border transition-colors ${showVideoLinks ? `${selectedEntryType.borderClass} ${selectedEntryType.bgClass}/10` : "border-border/50 bg-card/50"}`}>
              <div
                role="button"
                tabIndex={0}
                className="w-full flex items-center gap-3 p-4 text-left cursor-pointer"
                onClick={() => setShowVideoLinks((v) => !v)}
                onKeyDown={(e) => e.key === "Enter" && setShowVideoLinks((v) => !v)}
              >
                <div className={`p-2 rounded-xl flex-shrink-0 transition-colors ${showVideoLinks ? `${selectedEntryType.bgClass}/15` : "bg-muted"}`}>
                  <HugeiconsIcon icon={PlayIcon} strokeWidth={2} className={`w-4 h-4 ${showVideoLinks ? selectedEntryType.textClass : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">Promo Videos</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Optional — embed YouTube promo or recap videos ({videoLinks.length} added)
                  </p>
                </div>
                <Switch
                  checked={showVideoLinks}
                  onCheckedChange={setShowVideoLinks}
                  className="flex-shrink-0 data-checked:[&]:bg-[var(--event-color)]"
                  style={{ "--event-color": `var(${selectedEntryType.color})` } as React.CSSProperties}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <AnimatePresence initial={false}>
                {showVideoLinks && (
                  <motion.div
                    key="video-links-body"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3 border-t border-border/40 pt-3">
                      {videoLinks.length > 0 && (
                        <div className="space-y-2">
                          {videoLinks.map((vl) => (
                            <div key={vl._id} className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-border/60 bg-background text-xs">
                              <div className="flex items-center gap-2 min-w-0">
                                <Badge variant="outline" className="text-[10px] capitalize font-mono shrink-0">
                                  {vl.provider}
                                </Badge>
                                <div className="truncate">
                                  <div className="font-semibold text-foreground truncate">{vl.title}</div>
                                  <div className="text-[11px] text-muted-foreground truncate">{vl.url}</div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-muted-foreground hover:text-destructive shrink-0"
                                onClick={() => setVideoLinks((prev) => prev.filter((v) => v._id !== vl._id))}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="space-y-2 rounded-xl border border-dashed border-border/80 p-3 bg-muted/20">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <Input
                            placeholder="Video Title (e.g. Official Teaser)"
                            value={newVideoLink.title}
                            onChange={(e) => setNewVideoLink((prev) => ({ ...prev, title: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault()
                                handleAddVideoLink()
                              }
                            }}
                            className="h-8 text-xs"
                          />
                          <div className="space-y-1">
                            <Input
                              placeholder="YouTube URL (youtube.com or youtu.be)"
                              value={newVideoLink.url}
                              onChange={(e) => handleVideoUrlChange(e.target.value)}
                              onBlur={handleVideoUrlBlur}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault()
                                  handleAddVideoLink()
                                }
                              }}
                              className={cn(
                                "h-8 text-xs",
                                videoUrlError && "border-destructive focus-visible:ring-destructive text-destructive"
                              )}
                            />
                            {videoUrlError ? (
                              <p className="text-[11px] text-destructive font-medium flex items-center gap-1">
                                <HugeiconsIcon icon={AlertCircleIcon} className="size-3 shrink-0" />
                                {videoUrlError}
                              </p>
                            ) : (
                              <p className="text-[10px] text-muted-foreground">
                                Supports YouTube watch, youtu.be, or shorts links
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full h-8 text-xs font-medium"
                          disabled={!newVideoLink.url.trim()}
                          onClick={handleAddVideoLink}
                        >
                          <Plus className="w-3.5 h-3.5 mr-1.5" />
                          Add Video Link
                        </Button>
                      </div>
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
                          {Number(t.price) > 0 && Number(t.quantity) > 0
                            ? `${(Number(t.price) * Number(t.quantity)).toLocaleString()} ETB`
                            : "—"}
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
                              <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Admissions per ticket (Unit capacity)</Label>
                                <Input
                                  type="number"
                                  placeholder="1 (Standard single pass)"
                                  value={t.admissionsPerUnit || ""}
                                  onChange={(e) => updateTicketType(i, "admissionsPerUnit", e.target.value)}
                                  className="h-9"
                                  min="1"
                                />
                                <p className="text-[10px] text-muted-foreground">1 for single admission, 2 for couples pass, 4+ for group packages</p>
                              </div>

                              <div className="flex items-center justify-between pt-1">
                                <div className="space-y-0.5">
                                  <Label className="text-xs font-medium">Pay What You Want (Custom Price)</Label>
                                  <p className="text-[10px] text-muted-foreground">Allows buyers to pay any amount equal to or above the price</p>
                                </div>
                                <Switch
                                  checked={Boolean(t.allowCustomPrice)}
                                  onCheckedChange={(checked) => updateTicketType(i, "allowCustomPrice", checked)}
                                />
                              </div>

                              <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Entry Validation Mode</Label>
                                <Select
                                  value={t.entryValidationMode || "qr"}
                                  onValueChange={(val) => updateTicketType(i, "entryValidationMode", val as "qr" | "manual")}
                                >
                                  <SelectTrigger className="h-9 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="qr">QR Code Scan (Automatic verification)</SelectItem>
                                    <SelectItem value="manual">Manual Guest List / PIN Verification</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {isRecurring && (
                                <div className="space-y-1.5">
                                  <Label className="text-xs text-muted-foreground">Date Access (Recurring Series)</Label>
                                  <Select
                                    value={t.dateSelection || "all_dates"}
                                    onValueChange={(val) => updateTicketType(i, "dateSelection", val as any)}
                                  >
                                    <SelectTrigger className="h-9 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="all_dates">Full Series Pass (Access to all sessions)</SelectItem>
                                      <SelectItem value="fixed">Single Specific Session</SelectItem>
                                      <SelectItem value="attendee_choice">Attendee Choice (Pick session upon booking)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
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
                        !usePaidTickets ? `${selectedEntryType.borderClass} ${selectedEntryType.bgClass}/10 ${selectedEntryType.textClass}` : "border-border/40 text-muted-foreground hover:border-border"
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
                                  <Button variant="ghost" size="icon" className="size-6 text-muted-foreground hover:text-destructive" onClick={() => removeTicketType(i)}>
                                    <HugeiconsIcon icon={Remove01Icon} strokeWidth={2} className="size-3" />
                                  </Button>
                                )}
                              </div>
                              <Input placeholder="e.g. VIP Access" value={t.name} onChange={(e) => updateTicketType(i, "name", e.target.value)} className="h-8 text-sm" />
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <Label className="text-[10px] text-muted-foreground mb-1 block">Price (ETB)</Label>
                                  <Input type="number" placeholder="500" value={t.price} onChange={(e) => updateTicketType(i, "price", e.target.value)} className="h-8 text-sm" min="0" />
                                </div>
                                <div>
                                  <Label className="text-[10px] text-muted-foreground mb-1 block">Quantity</Label>
                                  <Input type="number" placeholder="100" value={t.quantity} onChange={(e) => updateTicketType(i, "quantity", e.target.value)} className="h-8 text-sm" min="1" />
                                </div>
                                <div>
                                  <Label className="text-[10px] text-muted-foreground mb-1 block">Revenue</Label>
                                  <div className="h-8 flex items-center text-xs font-semibold text-primary">
                                    {Number(t.price) > 0 && Number(t.quantity) > 0
                                      ? `${(Number(t.price) * Number(t.quantity)).toLocaleString()} ETB`
                                      : "—"}
                                  </div>
                                </div>
                              </div>

                              {/* Advanced settings toggle */}
                              <div className="pt-1">
                                <button
                                  type="button"
                                  onClick={() => setShowTicketOptionalFields(prev => ({ ...prev, [i]: !prev[i] }))}
                                  className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  <HugeiconsIcon 
                                    icon={ArrowDown01Icon} 
                                    strokeWidth={2} 
                                    className={`size-3 transition-transform ${showTicketOptionalFields[i] ? 'rotate-180' : ''}`} 
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
                                      <div className="pt-2 space-y-2">
                                        <div className="space-y-1">
                                          <Label className="text-[11px] text-muted-foreground">Description</Label>
                                          <Input placeholder="What's included?" value={t.description} onChange={(e) => updateTicketType(i, "description", e.target.value)} className="h-8 text-xs" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                          <div className="space-y-1">
                                            <Label className="text-[11px] text-muted-foreground">Sales start</Label>
                                            <Input
                                              type="datetime-local"
                                              value={t.salesStart}
                                              onChange={(e) => updateTicketType(i, "salesStart", e.target.value)}
                                              className="h-8 text-xs"
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <Label className="text-[11px] text-muted-foreground">Sales end</Label>
                                            <Input
                                              type="datetime-local"
                                              value={t.salesEnd}
                                              onChange={(e) => updateTicketType(i, "salesEnd", e.target.value)}
                                              className="h-8 text-xs"
                                            />
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                          <div className="space-y-1">
                                            <Label className="text-[11px] text-muted-foreground">Max per person</Label>
                                            <Input
                                              type="number"
                                              placeholder="No limit"
                                              value={t.maxPerPerson}
                                              onChange={(e) => updateTicketType(i, "maxPerPerson", e.target.value)}
                                              className="h-8 text-xs"
                                              min="1"
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <Label className="text-[11px] text-muted-foreground">Admissions / ticket</Label>
                                            <Input
                                              type="number"
                                              placeholder="1"
                                              value={t.admissionsPerUnit || ""}
                                              onChange={(e) => updateTicketType(i, "admissionsPerUnit", e.target.value)}
                                              className="h-8 text-xs"
                                              min="1"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
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
                    <Switch 
                      checked={useCodesSection} 
                      onCheckedChange={setUseCodesSection} 
                      className="flex-shrink-0 data-checked:[&]:bg-[var(--event-color)]" 
                      style={{ "--event-color": `var(${selectedEntryType.color})` } as React.CSSProperties}
                      onClick={(e) => e.stopPropagation()} 
                    />
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
                              className="data-checked:[&]:bg-[var(--event-color)]"
                              style={{ "--event-color": `var(${selectedEntryType.color})` } as React.CSSProperties}
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
                <div className={`rounded-2xl border transition-colors ${useGuestSection ? `${selectedEntryType.borderClass} ${selectedEntryType.bgClass}/10` : "border-border/50 bg-card/50"}`}>
                  <div
                    role="button"
                    tabIndex={0}
                    className="w-full flex items-center gap-3 p-4 text-left cursor-pointer"
                    onClick={() => setUseGuestSection((v) => !v)}
                    onKeyDown={(e) => e.key === "Enter" && setUseGuestSection((v) => !v)}
                  >
                    <div className={`p-2 rounded-xl flex-shrink-0 transition-colors ${useGuestSection ? `${selectedEntryType.bgClass}/15` : "bg-muted"}`}>
                      <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className={`size-4 ${useGuestSection ? selectedEntryType.textClass : "text-muted-foreground"}`} />
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
                    <Switch 
                      checked={useGuestSection} 
                      onCheckedChange={setUseGuestSection} 
                      className="flex-shrink-0 data-checked:[&]:bg-[var(--event-color)]" 
                      style={{ "--event-color": `var(${selectedEntryType.color})` } as React.CSSProperties}
                      onClick={(e) => e.stopPropagation()} 
                    />
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
                          !requiresApproval 
                            ? `${ENTRY_TYPES.find(et => et.value === "rsvp")!.borderClass} ${ENTRY_TYPES.find(et => et.value === "rsvp")!.bgClass}/10 ${ENTRY_TYPES.find(et => et.value === "rsvp")!.textClass}` 
                            : "border-border/40 text-muted-foreground"
                        }`}
                      >
                        Auto-approve
                      </button>
                      <button
                        onClick={() => setRequiresApproval(true)}
                        className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                          requiresApproval 
                            ? `${ENTRY_TYPES.find(et => et.value === "rsvp")!.borderClass} ${ENTRY_TYPES.find(et => et.value === "rsvp")!.bgClass}/10 ${ENTRY_TYPES.find(et => et.value === "rsvp")!.textClass}` 
                            : "border-border/40 text-muted-foreground"
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

            {/* Custom Questions Section */}
            <div className={`rounded-2xl border transition-colors ${showCustomQuestions ? `${selectedEntryType.borderClass} ${selectedEntryType.bgClass}/10` : "border-border/50 bg-card/50"}`}>
              <div
                role="button"
                tabIndex={0}
                className="w-full flex items-center gap-3 p-4 text-left cursor-pointer"
                onClick={() => setShowCustomQuestions((v) => !v)}
                onKeyDown={(e) => e.key === "Enter" && setShowCustomQuestions((v) => !v)}
              >
                <div className={`p-2 rounded-xl flex-shrink-0 transition-colors ${showCustomQuestions ? `${selectedEntryType.bgClass}/15` : "bg-muted"}`}>
                  <HelpCircle className={`w-4 h-4 ${showCustomQuestions ? selectedEntryType.textClass : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">Custom Questions</p>
                    {questions.length > 0 && (
                      <Badge variant="outline" className="text-[10px] px-1.5 h-4">{questions.length} added</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Collect extra info from attendees at checkout</p>
                </div>
                <Switch 
                  checked={showCustomQuestions} 
                  onCheckedChange={setShowCustomQuestions} 
                  className="flex-shrink-0 data-checked:[&]:bg-[var(--event-color)]" 
                  style={{ "--event-color": `var(${selectedEntryType.color})` } as React.CSSProperties}
                  onClick={(e) => e.stopPropagation()} 
                />
              </div>
              <AnimatePresence initial={false}>
                {showCustomQuestions && (
                  <motion.div
                    key="questions-body"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3 border-t border-border/40 pt-3">
                      {/* Add Question Button */}
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant={showQForm ? "ghost" : "outline"}
                          onClick={showQForm ? () => { setShowQForm(false); setEditingQId(null); } : () => setShowQForm(true)}
                          className="h-8 text-xs gap-1.5"
                        >
                          {showQForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                          {showQForm ? "Cancel" : "Add question"}
                        </Button>
                      </div>
                {/* Add/Edit Question Form */}
                <AnimatePresence>
                  {showQForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`bg-background border ${selectedEntryType.borderClass}/20 rounded-xl p-4 space-y-3 overflow-hidden`}
                    >
                      <p className={`text-xs font-semibold ${selectedEntryType.textClass} uppercase tracking-wider`}>
                        {editingQId ? "Edit question" : "New question"}
                      </p>
                      
                      {/* Question Label */}
                      <div className="space-y-1.5">
                        <Label className="text-xs">Question label <span className="text-destructive">*</span></Label>
                        <Input
                          placeholder='e.g. "Dietary preference?" or "T-shirt size?"'
                          value={qForm.label}
                          onChange={(e) => setQForm((f) => ({ ...f, label: e.target.value }))}
                          className="h-9 text-sm"
                          autoFocus
                        />
                      </div>
                      
                      {/* Question Type Selector */}
                      <div className="space-y-1.5">
                        <Label className="text-xs">Answer type</Label>
                        <div className="grid grid-cols-5 gap-1.5">
                          {QUESTION_TYPES.map((t) => (
                            <button
                              key={t.value}
                              type="button"
                              onClick={() => setQForm((f) => ({ ...f, type: t.value }))}
                              className={`flex flex-col items-center gap-1 py-2 rounded-xl border text-[10px] font-semibold transition-all ${
                                qForm.type === t.value
                                  ? `${selectedEntryType.borderClass}/50 ${selectedEntryType.bgClass}/10 ${selectedEntryType.textClass}`
                                  : "border-border/40 text-muted-foreground hover:border-border"
                              }`}
                            >
                              {t.icon}
                              <span className="leading-tight text-center">{t.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Options for Select Type */}
                      {qForm.type === "select" && (
                        <div className="space-y-1.5">
                          <Label className="text-xs">Options <span className="text-muted-foreground">(comma-separated)</span></Label>
                          <Input
                            placeholder="Vegetarian, Vegan, Non-vegetarian"
                            value={qForm.options}
                            onChange={(e) => setQForm((f) => ({ ...f, options: e.target.value }))}
                            className="h-9 text-sm"
                          />
                        </div>
                      )}
                      
                      {/* Placeholder for Text Inputs */}
                      {qForm.type !== "checkbox" && qForm.type !== "select" && (
                        <div className="space-y-1.5">
                          <Label className="text-xs">Placeholder hint <span className="text-muted-foreground">(optional)</span></Label>
                          <Input
                            placeholder="e.g. Enter your company name"
                            value={qForm.placeholder}
                            onChange={(e) => setQForm((f) => ({ ...f, placeholder: e.target.value }))}
                            className="h-9 text-sm"
                          />
                        </div>
                      )}
                      
                      {/* Required Toggle */}
                      <div className="flex items-center justify-between py-1">
                        <div>
                          <p className="text-xs font-medium">Required field</p>
                          <p className="text-[10px] text-muted-foreground">Attendees must answer this question</p>
                        </div>
                        <Switch 
                          checked={qForm.required} 
                          onCheckedChange={(v) => setQForm((f) => ({ ...f, required: v }))}
                          className="data-checked:[&]:bg-[var(--event-color)]"
                          style={{ "--event-color": `var(${selectedEntryType.color})` } as React.CSSProperties}
                        />
                      </div>
                      
                      {/* Form Actions */}
                      <div className="flex gap-2 pt-1">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 h-8 text-xs" 
                          onClick={() => { setShowQForm(false); setEditingQId(null); }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          size="sm" 
                          className={`flex-1 h-8 text-xs font-semibold ${selectedEntryType.bgClass} hover:${selectedEntryType.bgClass}/90`}
                          onClick={handleSaveQuestion} 
                          disabled={!qForm.label.trim() || qSaving}
                        >
                          {qSaving ? <Clock className="w-3.5 h-3.5 animate-spin" /> : editingQId ? "Update question" : "Add question"}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Empty State */}
                {questions.length === 0 && !showQForm && (
                  <div className="text-center py-8">
                    <div className="w-14 h-14 rounded-full bg-muted/40 flex items-center justify-center mx-auto mb-3">
                      <HelpCircle className="w-7 h-7 text-muted-foreground/30" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">No custom questions yet</p>
                    <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs mx-auto">
                      Collect T-shirt sizes, meal preferences, job titles, emergency contacts — anything you need from attendees
                    </p>
                    <Button variant="outline" size="sm" className="mt-4 h-8 text-xs gap-1.5" onClick={openAddQuestion}>
                      <Plus className="w-3.5 h-3.5" />
                      Add your first question
                    </Button>
                  </div>
                )}

                {/* Questions List */}
                {questions.length > 0 && (
                  <div className="space-y-2">
                    {questions.map((q, idx) => {
                      const typeInfo = QUESTION_TYPES.find((t) => t.value === q.type) ?? QUESTION_TYPES[0];
                      return (
                        <div 
                          key={q.id} 
                          className="flex items-center gap-2.5 bg-card border border-border/50 rounded-xl px-3 py-2.5 group hover:border-border transition-colors"
                        >
                          {/* Reorder Controls */}
                          <div className="flex flex-col gap-0.5 flex-shrink-0">
                            <button
                              onClick={() => handleMoveQuestion(q, "up")}
                              disabled={idx === 0}
                              className="text-muted-foreground/40 hover:text-muted-foreground disabled:opacity-20 transition-colors p-0.5"
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleMoveQuestion(q, "down")}
                              disabled={idx === questions.length - 1}
                              className="text-muted-foreground/40 hover:text-muted-foreground disabled:opacity-20 transition-colors p-0.5"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          </div>
                          
                          {/* Type Icon */}
                          <div className="text-muted-foreground/60 flex-shrink-0">
                            {typeInfo.icon}
                          </div>
                          
                          {/* Question Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{q.label}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-muted-foreground">{typeInfo.label}</span>
                              {q.required && (
                                <span className={`text-[10px] font-bold ${selectedEntryType.bgClass}/10 ${selectedEntryType.textClass} px-1 rounded`}>Required</span>
                              )}
                              {q.type === "select" && q.options && (
                                <span className="text-[10px] text-muted-foreground/60 truncate max-w-[120px]">
                                  {q.options}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center gap-1 transition-opacity flex-shrink-0">
                            <button
                              onClick={() => openEditQuestion(q)}
                              className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-lg hover:bg-destructive/10"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>


            </div>

            {/* Optional: Lineup & Performers */}
            <div className={`rounded-2xl border transition-colors ${showLineup ? `${selectedEntryType.borderClass} ${selectedEntryType.bgClass}/10` : "border-border/50 bg-card/50"}`}>
              <div
                role="button"
                tabIndex={0}
                className="w-full flex items-center gap-3 p-4 text-left cursor-pointer"
                onClick={() => setShowLineup((v) => !v)}
                onKeyDown={(e) => e.key === "Enter" && setShowLineup((v) => !v)}
              >
                <div className={`p-2 rounded-xl flex-shrink-0 transition-colors ${showLineup ? `${selectedEntryType.bgClass}/15` : "bg-muted"}`}>
                  <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className={`w-4 h-4 ${showLineup ? selectedEntryType.textClass : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">Artists & Lineup</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Optional — add performers, DJs, speakers, or hosts ({participants.length} added)
                  </p>
                </div>
                <Switch
                  checked={showLineup}
                  onCheckedChange={setShowLineup}
                  className="flex-shrink-0 data-checked:[&]:bg-[var(--event-color)]"
                  style={{ "--event-color": `var(${selectedEntryType.color})` } as React.CSSProperties}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <AnimatePresence initial={false}>
                {showLineup && (
                  <motion.div
                    key="lineup-body"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3 border-t border-border/40 pt-3">
                      {participants.length > 0 && (
                        <div className="space-y-2">
                          {participants.map((p, idx) => (
                            <div key={p._id} className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-border/60 bg-background text-xs">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="size-5 rounded-full bg-muted flex items-center justify-center font-bold text-[10px] text-muted-foreground shrink-0">
                                  {idx + 1}
                                </span>
                                <div className="truncate">
                                  <div className="font-semibold text-foreground truncate">{p.name}</div>
                                  <div className="text-[11px] text-muted-foreground truncate">
                                    <span className="capitalize">{p.type}</span>{p.description ? ` • ${p.description}` : ""}
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-muted-foreground hover:text-destructive shrink-0"
                                onClick={() => setParticipants(prev => prev.filter(x => x._id !== p._id))}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="space-y-2 rounded-xl border border-dashed border-border/80 p-3 bg-muted/20">
                        {artistsData?.data && artistsData.data.length > 0 && (
                          <div className="pb-1">
                            <Select
                              value={newParticipant.artistId || ""}
                              onValueChange={(artistId) => {
                                const art = artistsData.data.find((a) => a.id === artistId)
                                if (art) {
                                  setNewParticipant((prev) => ({
                                    ...prev,
                                    artistId: art.id,
                                    name: art.name,
                                    type: "performer",
                                    description: art.genres?.join(", ") || prev.description,
                                  }))
                                }
                              }}
                            >
                              <SelectTrigger className="h-7 text-[11px] bg-background">
                                <SelectValue placeholder="Quick-fill from Artist Directory..." />
                              </SelectTrigger>
                              <SelectContent>
                                {artistsData.data.map((art) => (
                                  <SelectItem key={art.id} value={art.id} className="text-xs">
                                    {art.name}{art.genres?.length ? ` (${art.genres.join(", ")})` : ""}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="sm:col-span-1">
                            <Input
                              placeholder="Performer Name *"
                              value={newParticipant.name}
                              onChange={(e) => setNewParticipant(prev => ({ ...prev, name: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault()
                                  handleAddParticipant()
                                }
                              }}
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="sm:col-span-1">
                            <Select
                              value={newParticipant.type}
                              onValueChange={(v) => setNewParticipant(prev => ({ ...prev, type: v }))}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="performer">Performer / Artist / DJ</SelectItem>
                                <SelectItem value="speaker">Speaker / Keynote</SelectItem>
                                <SelectItem value="host">Host / MC</SelectItem>
                                <SelectItem value="panelist">Panelist</SelectItem>
                                <SelectItem value="instructor">Instructor / Trainer</SelectItem>
                                <SelectItem value="guest">Special Guest</SelectItem>
                                <SelectItem value="team">Crew / Staff</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="sm:col-span-1">
                            <Input
                              placeholder="Note (e.g. Headliner)"
                              value={newParticipant.description}
                              onChange={(e) => setNewParticipant(prev => ({ ...prev, description: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault()
                                  handleAddParticipant()
                                }
                              }}
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full h-8 text-xs font-medium"
                          disabled={!newParticipant.name.trim()}
                          onClick={handleAddParticipant}
                        >
                          <Plus className="w-3.5 h-3.5 mr-1.5" />
                          Add to Lineup
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Optional: Collaborator Organizations */}
            <div className={`rounded-2xl border transition-colors ${showCollaborators ? `${selectedEntryType.borderClass} ${selectedEntryType.bgClass}/10` : "border-border/50 bg-card/50"}`}>
              <div
                role="button"
                tabIndex={0}
                className="w-full flex items-center gap-3 p-4 text-left cursor-pointer"
                onClick={() => setShowCollaborators((v) => !v)}
                onKeyDown={(e) => e.key === "Enter" && setShowCollaborators((v) => !v)}
              >
                <div className={`p-2 rounded-xl flex-shrink-0 transition-colors ${showCollaborators ? `${selectedEntryType.bgClass}/15` : "bg-muted"}`}>
                  <HugeiconsIcon icon={Building02Icon} strokeWidth={2} className={`w-4 h-4 ${showCollaborators ? selectedEntryType.textClass : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">Collaborators & Partners</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Optional — add partner, sponsor, or vendor organizations ({collaborators.length} added)
                  </p>
                </div>
                <Switch
                  checked={showCollaborators}
                  onCheckedChange={setShowCollaborators}
                  className="flex-shrink-0 data-checked:[&]:bg-[var(--event-color)]"
                  style={{ "--event-color": `var(${selectedEntryType.color})` } as React.CSSProperties}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <AnimatePresence initial={false}>
                {showCollaborators && (
                  <motion.div
                    key="collaborators-body"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3 border-t border-border/40 pt-3">
                      {collaborators.length > 0 && (
                        <div className="space-y-2">
                          {collaborators.map((c) => (
                            <div key={c._id} className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-border/60 bg-background text-xs">
                              <div className="flex items-center gap-2 min-w-0">
                                <Badge variant="outline" className="text-[10px] capitalize font-mono shrink-0">
                                  {c.type.replace("_", " ")}
                                </Badge>
                                <span className="font-semibold text-foreground truncate">{c.orgName}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-muted-foreground hover:text-destructive shrink-0"
                                onClick={() => setCollaborators(prev => prev.filter(x => x._id !== c._id))}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="space-y-2 rounded-xl border border-dashed border-border/80 p-3 bg-muted/20">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <Select
                            value={newCollaborator.organizationId}
                            onValueChange={(v) => {
                              setNewCollaborator(prev => ({ ...prev, organizationId: v }))
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Select Organization" />
                            </SelectTrigger>
                            <SelectContent>
                              {organizations
                                ?.filter((o) => o.id !== (activeOrgId || activeOrg?.id))
                                ?.map((org) => (
                                  <SelectItem key={org.id} value={org.id}>
                                    {org.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={newCollaborator.type}
                            onValueChange={(v) => setNewCollaborator(prev => ({ ...prev, type: v }))}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Relationship Type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="co_organizer">Co-Organizer</SelectItem>
                              <SelectItem value="promoter">Promoter</SelectItem>
                              <SelectItem value="sponsor">Sponsor</SelectItem>
                              <SelectItem value="venue_partner">Venue Partner</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full h-8 text-xs font-medium"
                          disabled={!newCollaborator.organizationId}
                          onClick={handleAddCollaborator}
                        >
                          <Plus className="w-3.5 h-3.5 mr-1.5" />
                          Add Organization
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

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
                              value={customDateInput}
                              onChange={(e) => setCustomDateInput(e.target.value)}
                              className="h-9 text-sm flex-1"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 flex-shrink-0 gap-1"
                              type="button"
                              onClick={() => {
                                if (customDateInput && time) {
                                  const iso = new Date(`${customDateInput}T${time}:00`).toISOString()
                                  if (!customDates.includes(iso)) setCustomDates((d) => [...d, iso].sort())
                                  setCustomDateInput("")
                                } else if (customDateInput) {
                                  const iso = new Date(`${customDateInput}T00:00:00`).toISOString()
                                  if (!customDates.includes(iso)) setCustomDates((d) => [...d, iso].sort())
                                  setCustomDateInput("")
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

                      {!date && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400">
                          <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-4 shrink-0" />
                          <span>Set a start date in the &quot;Event Details&quot; step to preview your series schedule.</span>
                        </div>
                      )}

                      {generatedDates.length > 0 && (
                        <div className="space-y-2">
                          <Label className={`text-xs font-bold ${selectedEntryType.textClass} uppercase tracking-wider`}>
                            {generatedDates.length} {generatedDates.length === 1 ? "date" : "dates"} in this series
                          </Label>
                          <div className="max-h-44 overflow-y-auto space-y-1.5 pr-0.5">
                            {generatedDates.map((d, i) => (
                              <div
                                key={d}
                                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm ${
                                  i === 0 ? `${selectedEntryType.bgClass}/10 border ${selectedEntryType.borderClass}/20` : "bg-muted/40"
                                }`}
                              >
                                <span className={`size-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                                  i === 0 ? `${selectedEntryType.bgClass} text-white` : "bg-muted text-muted-foreground"
                                }`}>
                                  {i + 1}
                                </span>
                                <span className={`flex-1 ${i === 0 ? "font-medium" : "text-muted-foreground"}`}>
                                  {new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })} · {new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                                </span>
                                {i === 0 && (
                                  <span className={`text-[10px] ${selectedEntryType.textClass} font-semibold flex-shrink-0`}>First</span>
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
            {/* Event Preview Card - Two Column Layout */}
            <div className="grid md:grid-cols-[300px_1fr] gap-5">
              {/* Left: Event Banner */}
              <div className="bg-card border border-border/60 rounded-2xl overflow-hidden flex flex-col relative group shadow-sm">
                {bannerPreview ? (
                  <>
                    <div className="relative aspect-[3/4] w-full bg-muted overflow-hidden">
                      <img
                        src={bannerPreview}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      />
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-black/60 backdrop-blur-md text-white border-white/20 text-[10px] font-semibold gap-1.5 shadow-sm">
                          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Ready to Publish
                        </Badge>
                      </div>
                    </div>
                    {bannerCaption && (
                      <p className="text-[11px] text-muted-foreground p-2.5 text-center bg-muted/30 border-t border-border/40 italic">
                        {bannerCaption}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full min-h-[300px] bg-gradient-to-br from-primary/15 via-primary/5 to-muted/20 flex items-center justify-center p-8">
                    <div className="text-center">
                      <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3 border border-primary/20">
                        <HugeiconsIcon icon={Calendar03Icon} strokeWidth={1.5} className="size-8 text-primary" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">No banner image</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Upload in Event Details</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Event Details & Content */}
              <div className="bg-card border border-border/60 rounded-2xl p-5 space-y-4 shadow-sm">
                {/* Primary Badges: Entry Type, Visibility, Approval, and Vibrant Categories */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Entry Type Badge with Theme Color */}
                    <Badge 
                      className={cn(
                        "text-xs gap-1.5 font-bold shadow-2xs border h-6 px-2.5",
                        entryType === "ticketed" && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
                        entryType === "rsvp" && "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30",
                        entryType === "free" && "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
                        entryType === "invite_only" && "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                      )}
                    >
                      {selectedEntryType.icon}
                      <span>{selectedEntryType.label}</span>
                    </Badge>

                    {/* Visibility Badge */}
                    <Badge 
                      variant={(entryType === "invite_only" ? "private" : visibility) === "public" ? "info" : "violet"} 
                      className="text-xs gap-1.5 font-semibold shadow-2xs h-6 px-2.5"
                    >
                      {VISIBILITY_OPTIONS.find((v) => v.value === (entryType === "invite_only" ? "private" : visibility))?.icon}
                      <span>{entryType === "invite_only" ? "Private" : (visibility.charAt(0).toUpperCase() + visibility.slice(1))}</span>
                    </Badge>

                    {/* Approval Required Badge */}
                    {requiresApproval && (
                      <Badge variant="warning" className="text-xs gap-1.5 font-semibold shadow-2xs h-6 px-2.5 border border-amber-500/30">
                        <HugeiconsIcon icon={LockIcon} strokeWidth={2} className="size-3" />
                        <span>Approval Required</span>
                      </Badge>
                    )}

                    {/* Dynamic Vibrant Category Badges */}
                    {selectedCategories.length > 0 && categoriesData?.data && selectedCategories.slice(0, 3).map((catId) => {
                      const cat = categoriesData.data?.find((c: any) => c.id === catId)
                      return cat ? (
                        <CategoryBadge 
                          key={catId} 
                          category={cat.name} 
                          className="text-xs h-6 px-3 font-semibold shadow-2xs" 
                        />
                      ) : null
                    })}
                  </div>

                  {/* Highlights & Feature Counters Bar */}
                  {(participants.length > 0 || videoLinks.length > 0 || collaborators.length > 0 || inviteCodes.length > 0 || guests.length > 0) && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {participants.length > 0 && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-500/20 shadow-2xs">
                          <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className="size-3.5 text-violet-600 dark:text-violet-400" />
                          <span>{participants.length} {participants.length === 1 ? "Artist" : "Artists"}</span>
                        </span>
                      )}
                      {videoLinks.length > 0 && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 shadow-2xs">
                          <HugeiconsIcon icon={PlayIcon} strokeWidth={2} className="size-3.5 text-rose-600 dark:text-rose-400 fill-rose-600/30" />
                          <span>{videoLinks.length} Video{videoLinks.length !== 1 ? "s" : ""}</span>
                        </span>
                      )}
                      {collaborators.length > 0 && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20 shadow-2xs">
                          <HugeiconsIcon icon={Building02Icon} strokeWidth={2} className="size-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span>{collaborators.length} Partner{collaborators.length !== 1 ? "s" : ""}</span>
                        </span>
                      )}
                      {inviteCodes.length > 0 && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 shadow-2xs font-mono">
                          <HugeiconsIcon icon={Key01Icon} strokeWidth={2} className="size-3 text-amber-600 dark:text-amber-400" />
                          <span>{inviteCodes.length} Code{inviteCodes.length !== 1 ? "s" : ""}</span>
                        </span>
                      )}
                      {guests.length > 0 && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20 shadow-2xs">
                          <HugeiconsIcon icon={UserIcon} strokeWidth={2} className="size-3 text-teal-600 dark:text-teal-400" />
                          <span>{guests.length} Guest{guests.length !== 1 ? "s" : ""}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-2xl font-black leading-tight text-foreground tracking-tight">{title}</h3>

                {/* Date, Time & Location Specs Bar */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {date && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/40 border border-border/60 text-foreground font-medium shadow-2xs">
                      <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-3.5 text-primary shrink-0" />
                      <span>
                        {new Date(`${date}T${time || "00:00"}`).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      {time && (
                        <span className="font-semibold text-primary">· {time}</span>
                      )}
                    </div>
                  )}
                  {endDate && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/40 border border-border/60 text-foreground font-medium shadow-2xs">
                      <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-3.5 text-muted-foreground shrink-0" />
                      <span>
                        Ends:{" "}
                        {new Date(`${endDate}T${endTime || "00:00"}`).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      {endTime && <span className="font-semibold text-muted-foreground">· {endTime}</span>}
                    </div>
                  )}
                  {doorsTime && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/40 border border-border/60 text-muted-foreground font-medium shadow-2xs">
                      <Clock className="size-3 text-muted-foreground shrink-0" />
                      <span>Doors: <strong className="text-foreground">{doorsTime}</strong></span>
                    </div>
                  )}
                  {venueId && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/40 border border-border/60 text-foreground font-medium shadow-2xs">
                      <HugeiconsIcon icon={Location01Icon} strokeWidth={2} className="size-3.5 text-rose-500 shrink-0" />
                      <span>{venuesData?.data?.find((v) => v.id === venueId)?.name || "Selected venue"}</span>
                    </div>
                  )}
                  {onlineUrl && (
                    <a
                      href={onlineUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/15 transition-colors border border-sky-500/20 text-sky-700 dark:text-sky-300 font-medium truncate max-w-[260px] shadow-2xs"
                    >
                      <HugeiconsIcon icon={Link01Icon} strokeWidth={2} className="size-3.5 text-sky-500 shrink-0" />
                      <span className="truncate">{onlineUrl}</span>
                    </a>
                  )}
                </div>

                {/* Description */}
                {description && (
                  <p className="text-sm text-muted-foreground leading-relaxed bg-muted/20 p-3 rounded-xl border border-border/40">
                    {description}
                  </p>
                )}

                {/* Lineup / Artists Summary */}
                {participants.length > 0 && (
                  <div className="pt-3 border-t border-border/50 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="size-5 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                          <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className="size-3.5" />
                        </div>
                        <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                          Lineup & Participants
                        </p>
                      </div>
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        {participants.length} {participants.length === 1 ? "artist" : "artists"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {participants.map((p, idx) => {
                        const role = getParticipantRoleConfig(p.type)
                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-2.5 p-2 pr-3 rounded-xl bg-muted/20 hover:bg-muted/30 border border-border/60 hover:border-violet-500/30 transition-all shadow-2xs group"
                          >
                            {/* Monogram avatar with role gradient */}
                            <div className={cn("size-8 rounded-lg bg-gradient-to-br flex items-center justify-center text-white font-bold text-xs shadow-2xs shrink-0", role.avatarGradient)}>
                              {p.name.slice(0, 2).toUpperCase()}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-xs text-foreground truncate group-hover:text-primary transition-colors">
                                  {p.name}
                                </span>
                                <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-md border leading-none", role.badgeStyle)}>
                                  {role.label}
                                </span>
                              </div>
                              {p.description && (
                                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                                  {p.description}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Collaborators Summary */}
                {collaborators.length > 0 && (
                  <div className="pt-3 border-t border-border/50 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="size-5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                          <HugeiconsIcon icon={Building02Icon} strokeWidth={2} className="size-3.5" />
                        </div>
                        <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                          Partners & Collaborators
                        </p>
                      </div>
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        {collaborators.length} {collaborators.length === 1 ? "partner" : "partners"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {collaborators.map((c, idx) => {
                        const collab = getCollaboratorTypeConfig(c.type)
                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-2.5 p-2 pr-3 rounded-xl bg-muted/20 hover:bg-muted/30 border border-border/60 hover:border-indigo-500/30 transition-all shadow-2xs group"
                          >
                            <div className={cn("size-8 rounded-lg bg-gradient-to-br flex items-center justify-center text-white font-bold text-xs shadow-2xs shrink-0", collab.avatarGradient)}>
                              <HugeiconsIcon icon={Building02Icon} strokeWidth={2} className="size-4" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-xs text-foreground truncate group-hover:text-primary transition-colors">
                                  {c.orgName}
                                </span>
                                <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-md border leading-none capitalize", collab.badgeStyle)}>
                                  {collab.label}
                                </span>
                              </div>
                              {c.role && (
                                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                                  {c.role}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Promo Videos Summary */}
                {videoLinks.length > 0 && (
                  <div className="pt-3 border-t border-border/50 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="size-5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
                          <HugeiconsIcon icon={PlayIcon} strokeWidth={2} className="size-3.5 fill-red-600/20" />
                        </div>
                        <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                          Promo Videos
                        </p>
                      </div>
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        {videoLinks.length} {videoLinks.length === 1 ? "video" : "videos"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {videoLinks.map((v, idx) => {
                        const ytId = extractYoutubeId(v.url)
                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-2.5 p-2 pr-3 rounded-xl bg-muted/20 hover:bg-muted/30 border border-border/60 hover:border-red-500/30 transition-all shadow-2xs group"
                          >
                            {/* Thumbnail or Play Badge */}
                            {ytId ? (
                              <div className="relative w-14 h-9 rounded-lg overflow-hidden shrink-0 border border-border/60 bg-black/60">
                                <img
                                  src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                                  alt={v.title || "Video thumbnail"}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                                  <div className="size-4 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xs">
                                    <HugeiconsIcon icon={PlayIcon} strokeWidth={2.5} className="size-2 ml-0.5 fill-white" />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="size-9 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 text-white flex items-center justify-center shadow-2xs shrink-0">
                                <HugeiconsIcon icon={PlayIcon} strokeWidth={2} className="size-4 ml-0.5 fill-white" />
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-xs text-foreground truncate group-hover:text-primary transition-colors">
                                {v.title || "Featured Video"}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 leading-none">
                                  YouTube
                                </span>
                                <a
                                  href={v.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 truncate"
                                >
                                  <span className="truncate max-w-[140px]">{v.url}</span>
                                  <HugeiconsIcon icon={GlobeIcon} className="size-2.5 shrink-0" />
                                </a>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Gallery Summary */}
                {galleryFiles.length > 0 && (
                  <div className="pt-3 border-t border-border/50 space-y-2">
                    <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Gallery ({galleryFiles.length} images)
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                      {galleryFiles.slice(0, 6).map((item, idx) => (
                        <div key={idx} className="relative size-14 rounded-xl overflow-hidden border border-border/70 flex-shrink-0 group shadow-2xs">
                          <img src={item.preview} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                        </div>
                      ))}
                      {galleryFiles.length > 6 && (
                        <div className="size-14 rounded-xl bg-muted/60 border border-border/60 flex items-center justify-center flex-shrink-0 font-bold text-xs text-muted-foreground">
                          +{galleryFiles.length - 6}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Custom Questions Summary */}
                {questions.length > 0 && (
                  <div className="pt-3 border-t border-border/50 space-y-2">
                    <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Registration Questions ({questions.length})
                    </p>
                    <div className="space-y-1.5">
                      {questions.map((q, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-muted/20 border border-border/50 text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <span className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                              {idx + 1}
                            </span>
                            <span className="text-foreground font-medium truncate">{q.label}</span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono uppercase">
                              {q.type}
                            </span>
                            {q.required && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold border border-rose-500/20">
                                Required
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recurring/Series Summary */}
                {isRecurring && generatedDates.length > 1 && (
                  <div className="pt-3 border-t border-border/50 space-y-2">
                    <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Series Schedule ({generatedDates.length} dates)
                    </p>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {generatedDates.map((d, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-muted/20 border border-border/50 text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`size-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${idx === 0 ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                              {idx + 1}
                            </span>
                            <span className="text-foreground font-medium">
                              {new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                            </span>
                          </div>
                          <span className="text-primary font-semibold">
                            {new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ticket Types - Right Column Summary */}
                {(entryType === "ticketed" || (entryType === "invite_only" && usePaidTickets)) && ticketTypes.filter((t) => t.name).length > 0 && (
                  <div className="pt-3 border-t border-border/50 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                        Ticket Tiers ({ticketTypes.filter((t) => t.name).length})
                      </p>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {totalCapacity.toLocaleString()} total tickets
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {ticketTypes.filter((t) => t.name).map((t, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/20 border border-border/50">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="size-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                              <HugeiconsIcon icon={TicketIcon} strokeWidth={2} className="size-3.5" />
                            </div>
                            <div className="truncate">
                              <div className="font-bold text-xs text-foreground truncate">{t.name}</div>
                              <div className="text-[11px] text-muted-foreground">
                                {Number(t.quantity || 0).toLocaleString()} tickets available
                              </div>
                            </div>
                          </div>
                          <div className="text-right font-extrabold text-sm text-emerald-600 dark:text-emerald-400 shrink-0">
                            {Number(t.price || 0).toLocaleString()} ETB
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* RSVP Capacity */}
                {entryType === "rsvp" && rsvpCapacity && (
                  <div className="pt-3 border-t border-border/50">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/50 text-xs">
                      <span className="font-semibold text-foreground">Registration Capacity</span>
                      <span className="font-bold text-primary">{Number(rsvpCapacity).toLocaleString()} spots</span>
                    </div>
                    {requiresApproval && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-1.5 flex items-center gap-1">
                        <HugeiconsIcon icon={AlertCircleIcon} className="size-3" />
                        Registrations require organizer approval before confirmation.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* How attendees will enter - Full width section */}
            <div className="bg-card border border-border/60 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${selectedEntryType.bgClass}/15`}>
                  <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className={`size-5 ${selectedEntryType.textClass}`} />
                </div>
                <div>
                  <h4 className="font-bold text-base text-foreground">How attendees will enter</h4>
                  <Badge 
                    className={cn(
                      "text-xs mt-1 font-bold shadow-2xs border h-5 px-2",
                      entryType === "ticketed" && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
                      entryType === "rsvp" && "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30",
                      entryType === "free" && "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
                      entryType === "invite_only" && "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                    )}
                  >
                    {selectedEntryType.label}
                  </Badge>
                </div>
              </div>

              {/* Entry Type Description */}
              <p className="text-sm text-muted-foreground">
                {entryType === "ticketed" && "Attendees purchase a ticket online before the event. No ticket = no entry."}
                {entryType === "rsvp" && `Attendees register for free${requiresApproval ? " and wait for approval" : " with instant confirmation"}.`}
                {entryType === "free" && "No registration required. Anyone can walk in on the day."}
                {entryType === "invite_only" && `Access via ${useCodesSection ? "invite code" : ""}${useCodesSection && useGuestSection ? " or " : ""}${useGuestSection ? "guest list" : ""}.`}
              </p>

              {/* Detailed Ticket Type Cards */}
              {entryType === "ticketed" && ticketTypes.filter((t) => t.name).length > 0 && (
                <div className="space-y-3 pt-2">
                  {ticketTypes.filter((t) => t.name).map((t, i) => (
                    <div key={i} className="bg-background border border-border/60 hover:border-emerald-500/30 rounded-xl p-4 space-y-2 shadow-2xs transition-all">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-lg ${selectedEntryType.bgClass}/15 shrink-0`}>
                            <HugeiconsIcon icon={TicketIcon} strokeWidth={2} className={`size-4 ${selectedEntryType.textClass}`} />
                          </div>
                          <div>
                            <div className="font-bold text-sm text-foreground">{t.name}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {Number(t.quantity || 0).toLocaleString()} tickets available
                              {t.admissionsPerUnit && Number(t.admissionsPerUnit) > 1 ? ` • ${t.admissionsPerUnit} admissions/ticket` : ""}
                              {t.maxPerPerson && ` • Max ${t.maxPerPerson} per person`}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-black text-lg ${selectedEntryType.textClass}`}>{Number(t.price || 0).toLocaleString()} ETB</div>
                        </div>
                      </div>
                      {(t.salesStart || t.salesEnd) && (
                        <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 pt-1 border-t border-border/40">
                          {t.salesStart && (
                            <span>
                              Opens {new Date(t.salesStart).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                          {t.salesEnd && (
                            <span>
                              Closes {new Date(t.salesEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Total Capacity Bar */}
                  <div className={`${selectedEntryType.bgClass}/10 border ${selectedEntryType.borderClass}/30 rounded-xl p-3 flex items-center justify-between shadow-2xs`}>
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon icon={TicketIcon} strokeWidth={2} className={`size-4 ${selectedEntryType.textClass}`} />
                      <span className="font-semibold text-sm">Total capacity</span>
                    </div>
                    <span className={`font-bold ${selectedEntryType.textClass}`}>{totalCapacity.toLocaleString()} tickets</span>
                  </div>
                </div>
              )}

              {entryType === "rsvp" && (
                <div className="space-y-2 pt-2">
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
                </div>
              )}

              {entryType === "free" && (
                <div className="space-y-2 pt-2">
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
                <div className="space-y-2 pt-2">
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
                            {t.admissionsPerUnit && Number(t.admissionsPerUnit) > 1 && <span>{t.admissionsPerUnit} admissions/ticket</span>}
                            {t.maxPerPerson && <span>Max {t.maxPerPerson}/person</span>}
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
                const errors: { title?: string; date?: string; endDate?: string; doorsTime?: string; location?: string; banner?: string; category?: string } = {}
                if (!title) errors.title = "Event name is required"
                if (!date) errors.date = "Date is required"
                if (!endDate || !endTime) {
                  errors.endDate = "End date and time are required"
                } else if (date && time && endDate && endTime && isEndsBeforeOrEqualStarts(date, time, endDate, endTime)) {
                  errors.endDate = "End date and time must be after start date and time"
                }
                if (!venueId) errors.location = "Please select a venue"
                if (!bannerFile) errors.banner = "Banner image is required"
                if (doorsTime && time && isDoorsAfterStart(doorsTime, time)) {
                  errors.doorsTime = `Doors open time must be before or at event start time (${time})`
                }
                if (selectedCategories.length === 0) {
                  errors.category = "Please select at least 1 category for your event"
                } else if (selectedCategories.length > 3) {
                  errors.category = "You can select up to 3 categories"
                }
                setFieldErrors(errors)
                if (Object.keys(errors).length > 0) {
                  if (errors.category) {
                    toast.error(errors.category)
                  } else if (errors.endDate) {
                    toast.error(errors.endDate)
                  } else if (errors.doorsTime) {
                    toast.error(errors.doorsTime)
                  }
                  return
                }

                // Auto-flush pending video link if user entered one without clicking Add Video Link
                if (newVideoLink.url.trim()) {
                  const check = validateYoutubeUrl(newVideoLink.url.trim())
                  if (!check.valid) {
                    setVideoUrlError(check.error || "Please provide a valid YouTube video link")
                    toast.error(check.error || "Please provide a valid YouTube video link (youtube.com or youtu.be) or clear the field")
                    return
                  }
                  const cleanUrl = check.normalizedUrl || normalizeYoutubeUrl(newVideoLink.url.trim())
                  setVideoLinks((prev) => [
                    ...prev,
                    {
                      _id: crypto.randomUUID(),
                      title: newVideoLink.title.trim() || "YouTube Video",
                      url: cleanUrl,
                      provider: "youtube",
                    },
                  ])
                  setNewVideoLink({ title: "", url: "" })
                  setVideoUrlError("")
                }

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
            <Button
              className="flex-1 h-11 font-semibold"
              onClick={() => {
                if (newParticipant.name.trim()) {
                  handleAddParticipant()
                }
                if (newCollaborator.organizationId) {
                  handleAddCollaborator()
                }
                setError("")
                setStep(3)
              }}
            >
              Next: Recurring
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
          <div className="space-y-2">
            {activeOrg && !activeOrg.verified && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs leading-relaxed mb-3">
                <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Verification Required to Publish:</span> Your organization (<span className="font-medium">{activeOrg.name}</span>) is not verified yet. You can save this event as a <strong>Draft</strong>, but you cannot publish it until your organization is verified.
                </div>
              </div>
            )}
            <Button
              className={`w-full h-12 font-bold text-base ${selectedEntryType.bgClass} hover:opacity-90 text-white border-0`}
              onClick={() => handleCreate(true)}
              disabled={isLoading}
            >
              {isLoading ? (
                <HugeiconsIcon icon={Loading01Icon} strokeWidth={2} className="size-5 animate-spin" />
              ) : (
                <>
                  <HugeiconsIcon icon={Rocket01Icon} strokeWidth={2} className="size-5 mr-2" />
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
              <HugeiconsIcon icon={BookmarkIcon} strokeWidth={2} className="size-4 mr-2" />
              Save as Draft
            </Button>
            <Button
              variant="ghost"
              className="w-full h-10 text-muted-foreground"
              onClick={() => setStep(3)}
              disabled={isLoading}
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4 mr-2" />
              Back
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
