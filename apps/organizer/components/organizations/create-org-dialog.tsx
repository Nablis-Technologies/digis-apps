"use client"

import * as React from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PhoneInput } from "@/components/ui/phone-input"
import { Label } from "@/components/ui/label"
import {
  useCreateOwnerOrganizationMutation,
  useUploadOwnerOrganizationDocumentsMutation,
  useSubmitVerificationMutation,
} from "@workspace/store/reducers/organizationsApi"
import { useActiveOrganization } from "../../providers/organization-provider"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Building02Icon,
  Upload01Icon,
  Loading01Icon,
  CheckmarkCircle01Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  Tick02Icon,
  PresentationPodiumIcon,
  PencilEdit01Icon,
  FootballIcon,
  TheaterIcon,
  SmileIcon,
  Store01Icon,
  FileValidationIcon,
  MusicNote01Icon,
  PartyIcon,
  ColorsIcon,
  SecurityCheckIcon,
} from "@hugeicons/core-free-icons"

interface CreateOrgDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (orgId: string) => void
}

const ORGANIZER_TYPES = [
  {
    value: "company",
    label: "Company / Registered Business",
    desc: "LLC, Corporation, or registered enterprise",
  },
  {
    value: "individual",
    label: "Individual / Independent Creator",
    desc: "Solo promoter, artist, or independent organizer",
  },
  {
    value: "ngo",
    label: "NGO / Non-Profit",
    desc: "Charity, foundation, or non-profit",
  },
  {
    value: "government",
    label: "Government / Educational",
    desc: "Public institution or university",
  },
  {
    value: "collective",
    label: "Creative Collective",
    desc: "Artistic crew, music label, or community club",
  },
]

const CATEGORIES = [
  { value: "music", label: "Music", icon: MusicNote01Icon },
  { value: "sports", label: "Sports", icon: FootballIcon },
  { value: "conference", label: "Conference", icon: PresentationPodiumIcon },
  { value: "comedy", label: "Comedy", icon: SmileIcon },
  { value: "theater", label: "Theater", icon: TheaterIcon },
  { value: "festival", label: "Festival", icon: PartyIcon },
  { value: "workshop", label: "Workshop", icon: PencilEdit01Icon },
  { value: "exhibition", label: "Exhibition", icon: ColorsIcon },
  { value: "other", label: "Other", icon: Store01Icon },
]

const AUDIENCE_TIERS = [
  {
    value: "under_100",
    label: "Small (Under 100)",
    desc: "Intimate gigs, meetups & workshops",
    instant: true,
  },
  {
    value: "100_500",
    label: "Medium (100 – 500)",
    desc: "Club nights, seminars & mid-size concerts",
    instant: true,
  },
  {
    value: "500_1000",
    label: "Large (500 – 1,000)",
    desc: "Conferences, festivals & major halls",
    instant: false,
  },
  {
    value: "1000_5000",
    label: "Very Large (1,000 – 5,000)",
    desc: "Expos, arena events & festivals",
    instant: false,
  },
  {
    value: "5000_plus",
    label: "Massive (5,000+)",
    desc: "Stadium shows & mass gatherings",
    instant: false,
  },
]

const STEPS = [
  "Category & Scale",
  "Organization Info",
  "Contact & Location",
  "Verification",
]

export function CreateOrgDialog({ open, onOpenChange, onCreated }: CreateOrgDialogProps) {
  const [createOrg, { isLoading: isCreating }] = useCreateOwnerOrganizationMutation()
  const [uploadDocs, { isLoading: isUploading }] = useUploadOwnerOrganizationDocumentsMutation()
  const [submitVerification, { isLoading: isSubmittingVerification }] = useSubmitVerificationMutation()
  const { setActiveOrgId, refetchOrganizations } = useActiveOrganization()

  const [step, setStep] = React.useState(0)
  const [error, setError] = React.useState("")

  // Form State
  const [name, setName] = React.useState("")
  const [organizerType, setOrganizerType] = React.useState("company")
  const [selectedCategory, setSelectedCategory] = React.useState("music")
  const [estimatedAudience, setEstimatedAudience] = React.useState("100_500")
  const [contactPhone, setContactPhone] = React.useState("")
  const [contactEmail, setContactEmail] = React.useState("")
  const [city, setCity] = React.useState("")
  const [region, setRegion] = React.useState("")
  const [tinNumber, setTinNumber] = React.useState("")
  const [description, setDescription] = React.useState("")

  // Files State & Previews
  const [profileFile, setProfileFile] = React.useState<File | null>(null)
  const [profilePreview, setProfilePreview] = React.useState("")
  const [bannerFile, setBannerFile] = React.useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = React.useState("")
  const [licenseFile, setLicenseFile] = React.useState<File | null>(null)
  const [tinFile, setTinFile] = React.useState<File | null>(null)

  const isSubmitting = isCreating || isUploading || isSubmittingVerification
  const isAutoApproveEligible = estimatedAudience === "under_100" || estimatedAudience === "100_500"

  const resetForm = () => {
    setName("")
    setOrganizerType("company")
    setSelectedCategory("music")
    setEstimatedAudience("100_500")
    setContactPhone("")
    setContactEmail("")
    setCity("")
    setRegion("")
    setTinNumber("")
    setDescription("")
    if (profilePreview) URL.revokeObjectURL(profilePreview)
    if (bannerPreview) URL.revokeObjectURL(bannerPreview)
    setProfileFile(null)
    setProfilePreview("")
    setBannerFile(null)
    setBannerPreview("")
    setLicenseFile(null)
    setTinFile(null)
    setStep(0)
    setError("")
  }

  const handleCreate = async (skipDocs = false) => {
    if (!name.trim()) {
      setError("Organization name is required")
      toast.error("Organization name is required")
      setStep(1)
      return
    }

    try {
      let formattedPhone = contactPhone.trim()
      if (formattedPhone) {
        const digits = formattedPhone.replace(/\D/g, "")
        if (digits.startsWith("0")) {
          formattedPhone = "+251" + digits.slice(1)
        } else if (digits.startsWith("251")) {
          formattedPhone = "+" + digits
        } else {
          formattedPhone = "+251" + digits
        }
      }

      toast.loading("Creating organization...")
      const res = await createOrg({
        organization: {
          name: name.trim(),
          organizer_type: organizerType as any,
          category: selectedCategory,
          estimated_audience: estimatedAudience,
          contact_phone: formattedPhone || undefined,
          contact_email: contactEmail.trim() || undefined,
          city: city.trim() || undefined,
          region: region.trim() || undefined,
          tin_number: tinNumber.trim() || undefined,
          description: description.trim() || undefined,
        },
      }).unwrap()

      const newOrgId = res.data.id
      toast.dismiss()
      toast.success("Organization created successfully!")

      // If user provided files and didn't skip, upload and submit verification
      const hasAnyDocs = Boolean(profileFile || bannerFile || licenseFile || tinFile)
      if (!skipDocs && hasAnyDocs) {
        try {
          toast.loading("Uploading organization documents...")
          const formData = new FormData()
          if (profileFile) formData.append("profile", profileFile)
          if (bannerFile) formData.append("banner", bannerFile)
          if (licenseFile) formData.append("business_license", licenseFile)
          if (tinFile) formData.append("tin_certificate", tinFile)

          await uploadDocs({ id: newOrgId, formData }).unwrap()
          toast.dismiss()

          // Backend requires all 4 attachments for submitVerification to pass submission_ready?
          const hasAllFourDocs = Boolean(profileFile && bannerFile && licenseFile && tinFile)
          if (hasAllFourDocs) {
            toast.loading("Submitting for verification...")
            const verifyRes = await submitVerification(newOrgId).unwrap()
            toast.dismiss()

            const isApproved =
              verifyRes.data?.verification_status === "approved" || verifyRes.data?.verified === true

            if (isApproved) {
              toast.success("✨ Organization auto-approved!", {
                description: "Your organization is verified. You can now publish ticketed events immediately.",
              })
            } else {
              toast.success("Organization submitted for review!", {
                description: "Our compliance team will review your verification documents.",
              })
            }
          } else if (licenseFile || tinFile) {
            toast.info("Documents uploaded!", {
              description:
                "To complete verification, please ensure a Logo and Banner are also provided in Organization Settings.",
            })
          }
        } catch (docErr: any) {
          toast.dismiss()
          toast.warning("Organization created, but document upload encountered an issue.", {
            description: docErr?.data?.message || docErr?.message || "You can upload documents in Settings.",
          })
        }
      }

      // Activate new organization
      refetchOrganizations()
      setActiveOrgId(newOrgId)
      onCreated?.(newOrgId)
      resetForm()
      onOpenChange(false)
    } catch (err: any) {
      toast.dismiss()
      const errorMsg =
        err?.data?.message ||
        err?.data?.error ||
        "Failed to create organization. Please check details."
      toast.error("Error creating organization", { description: errorMsg })
      setError(errorMsg)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm()
        onOpenChange(v)
      }}
    >
      <DialogContent className="sm:max-w-[660px] max-h-[88vh] h-[88vh] flex flex-col p-0 overflow-hidden gap-0 rounded-3xl">
        {/* Pinned Header Section */}
        <div className="p-5 pb-3 border-b border-border/50 shrink-0 bg-background pr-12">
          <DialogHeader className="pb-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <HugeiconsIcon icon={Building02Icon} strokeWidth={2} className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg">Create New Organization</DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Set up a new organization workspace to manage events and ticket sales
                </p>
              </div>
            </div>
          </DialogHeader>

          {/* Step indicators */}
          <div className="flex items-center gap-1.5 pt-3">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-1.5 flex-1">
                <div className="flex items-center gap-1.5">
                  <div
                    className={`size-6 rounded-full flex items-center justify-center shrink-0 transition-all ${
                      i < step
                        ? "border-2 border-primary bg-primary/15 text-primary font-bold"
                        : i === step
                          ? "bg-primary text-primary-foreground shadow-xs font-bold"
                          : "border border-border bg-background text-muted-foreground"
                    }`}
                  >
                    {i < step ? (
                      <HugeiconsIcon
                        icon={Tick02Icon}
                        strokeWidth={3}
                        className="size-3 text-primary"
                      />
                    ) : (
                      <span className="text-[10px] font-bold">
                        {i + 1}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[11px] font-medium hidden sm:inline ${
                      i === step
                        ? "text-foreground font-semibold"
                        : i < step
                          ? "text-foreground"
                          : "text-muted-foreground"
                    }`}
                  >
                    {s}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 rounded-full transition-colors ${
                      i < step ? "bg-primary" : "bg-border"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable Step Body */}
        <div className="flex-1 overflow-y-auto min-h-0 p-5 space-y-4">
          <AnimatePresence mode="wait">
            {/* ─── Step 0: Category, Type & Scale ──────────────────────────── */}
            {step === 0 && (
              <motion.div
                key="dialog-step-0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Event Category */}
                <div>
                  <h3 className="text-sm font-bold">Primary Event Category</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Select the main category for your organization&apos;s events
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map((cat) => {
                    const isSelected = selectedCategory === cat.value
                    return (
                      <div
                        key={cat.value}
                        onClick={() => !isSubmitting && setSelectedCategory(cat.value)}
                        className={`flex items-center space-x-2 rounded-xl border-2 p-2.5 cursor-pointer transition-all hover:bg-accent/50 ${
                          isSelected
                            ? "border-primary bg-primary/10 shadow-xs"
                            : "border-border/60"
                        } ${isSubmitting ? "opacity-60 cursor-not-allowed" : ""}`}
                      >
                        <div
                          className={`p-1 rounded-md shrink-0 transition-colors ${
                            isSelected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <HugeiconsIcon icon={cat.icon} strokeWidth={2} className="size-4" />
                        </div>
                        <span
                          className={`text-xs font-medium leading-tight truncate flex-1 ${
                            isSelected ? "text-foreground font-semibold" : "text-muted-foreground"
                          }`}
                        >
                          {cat.label}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Expected Audience & Auto-Approval notice */}
                <div className="space-y-2.5 pt-3 border-t border-border/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold">Expected Audience Size</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Typical attendee count per event
                      </p>
                    </div>
                    {isAutoApproveEligible && (
                      <span className="text-[11px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <HugeiconsIcon icon={SecurityCheckIcon} strokeWidth={2} className="size-3" />
                        Fast-Track Eligible
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {AUDIENCE_TIERS.map((tier) => {
                      const isSelected = estimatedAudience === tier.value
                      return (
                        <button
                          key={tier.value}
                          type="button"
                          onClick={() => setEstimatedAudience(tier.value)}
                          className={`text-left p-2.5 rounded-xl border-2 transition-all flex items-start gap-2.5 cursor-pointer ${
                            isSelected
                              ? "border-primary bg-primary/10 shadow-xs"
                              : "border-border/60 hover:border-border bg-card"
                          }`}
                        >
                          <div
                            className={`size-3.5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-muted-foreground/50"
                            }`}
                          >
                            {isSelected && <div className="size-1 rounded-full bg-primary-foreground" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-semibold">{tier.label}</span>
                              {tier.instant ? (
                                <span className="text-[10px] text-primary font-medium">Auto-Approve</span>
                              ) : (
                                <span className="text-[10px] text-muted-foreground">Admin Review</span>
                              )}
                            </div>
                            <div className="text-[11px] text-muted-foreground truncate">{tier.desc}</div>
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {/* Informational banner about auto-approval threshold */}
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 text-xs text-muted-foreground flex items-start gap-2.5">
                    <HugeiconsIcon icon={SecurityCheckIcon} strokeWidth={2} className="size-4 text-primary shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      Organizations planning events for <strong className="text-foreground">under 500 attendees</strong> qualify for instant verification upon document submission, enabling immediate ticket publication.
                    </p>
                  </div>
                </div>

                {/* Organizer Structure */}
                <div className="space-y-2.5 pt-3 border-t border-border/40">
                  <div>
                    <h3 className="text-sm font-bold">Organizer Structure</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Legal entity or organizational structure
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-2">
                    {ORGANIZER_TYPES.map((t) => {
                      const isSelected = organizerType === t.value
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setOrganizerType(t.value)}
                          className={`text-left p-2.5 rounded-xl border-2 transition-all flex items-start gap-2.5 cursor-pointer ${
                            isSelected
                              ? "border-primary bg-primary/10 shadow-xs"
                              : "border-border/60 hover:border-border bg-card"
                          }`}
                        >
                          <div
                            className={`size-3.5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-muted-foreground/50"
                            }`}
                          >
                            {isSelected && <div className="size-1 rounded-full bg-primary-foreground" />}
                          </div>
                          <div>
                            <div className="text-xs font-semibold">{t.label}</div>
                            <div className="text-[11px] text-muted-foreground">{t.desc}</div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─── Step 1: Organization Info ────────────────────────────────── */}
            {step === 1 && (
              <motion.div
                key="dialog-step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-base font-bold">Organization Profile</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Name, description, and visual brand assets
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="dlg-name" className="text-sm font-medium">
                    Organization Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="dlg-name"
                    placeholder="e.g. Starlight Entertainment, Addis Music Collective"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      if (error) setError("")
                    }}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="dlg-desc" className="text-sm font-medium">
                    About / Description
                  </Label>
                  <textarea
                    id="dlg-desc"
                    rows={2}
                    placeholder="Briefly describe what your organization does..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isSubmitting}
                    className="flex min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                {/* Brand Assets */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Logo */}
                  <div className="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold uppercase text-muted-foreground">
                        Logo (Profile)
                      </Label>
                      {profilePreview && (
                        <button
                          type="button"
                          onClick={() => {
                            URL.revokeObjectURL(profilePreview)
                            setProfilePreview("")
                            setProfileFile(null)
                          }}
                          className="text-[11px] text-destructive hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2.5">
                      {profilePreview ? (
                        <div className="size-10 rounded-full overflow-hidden border border-border bg-card shrink-0 relative">
                          <Image
                            src={profilePreview}
                            alt="Logo preview"
                            width={40}
                            height={40}
                            unoptimized
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="size-10 rounded-full border-2 border-dashed border-border flex items-center justify-center bg-card text-muted-foreground shrink-0">
                          <HugeiconsIcon icon={Building02Icon} strokeWidth={1.5} className="size-5" />
                        </div>
                      )}
                      <div className="flex-1">
                        <input
                          id="dlg-profile"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0] ?? null
                            setProfileFile(file)
                            if (profilePreview) URL.revokeObjectURL(profilePreview)
                            setProfilePreview(file ? URL.createObjectURL(file) : "")
                          }}
                        />
                        <Label
                          htmlFor="dlg-profile"
                          className="flex items-center justify-center gap-1.5 h-8 px-2.5 rounded-md border border-border cursor-pointer text-xs font-medium hover:bg-muted transition-colors w-full"
                        >
                          <HugeiconsIcon icon={Upload01Icon} strokeWidth={2} className="size-3" />
                          {profileFile ? "Change Logo" : "Choose Logo"}
                        </Label>
                      </div>
                    </div>
                  </div>

                  {/* Banner */}
                  <div className="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold uppercase text-muted-foreground">
                        Banner Cover
                      </Label>
                      {bannerPreview && (
                        <button
                          type="button"
                          onClick={() => {
                            URL.revokeObjectURL(bannerPreview)
                            setBannerPreview("")
                            setBannerFile(null)
                          }}
                          className="text-[11px] text-destructive hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2.5">
                      {bannerPreview ? (
                        <div className="h-10 w-16 rounded-md overflow-hidden border border-border bg-card shrink-0 relative">
                          <Image
                            src={bannerPreview}
                            alt="Banner preview"
                            width={64}
                            height={40}
                            unoptimized
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-10 w-16 rounded-md border-2 border-dashed border-border flex items-center justify-center bg-card text-muted-foreground shrink-0">
                          <HugeiconsIcon icon={Upload01Icon} strokeWidth={1.5} className="size-4" />
                        </div>
                      )}
                      <div className="flex-1">
                        <input
                          id="dlg-banner"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0] ?? null
                            setBannerFile(file)
                            if (bannerPreview) URL.revokeObjectURL(bannerPreview)
                            setBannerPreview(file ? URL.createObjectURL(file) : "")
                          }}
                        />
                        <Label
                          htmlFor="dlg-banner"
                          className="flex items-center justify-center gap-1.5 h-8 px-2.5 rounded-md border border-border cursor-pointer text-xs font-medium hover:bg-muted transition-colors w-full"
                        >
                          <HugeiconsIcon icon={Upload01Icon} strokeWidth={2} className="size-3" />
                          {bannerFile ? "Change Banner" : "Choose Banner"}
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─── Step 2: Contact & Location ───────────────────────────────── */}
            {step === 2 && (
              <motion.div
                key="dialog-step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-base font-bold">Contact & Location</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Official contact channels and jurisdiction
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="dlg-phone" className="text-sm font-medium">
                      Official Phone
                    </Label>
                    <PhoneInput
                      id="dlg-phone"
                      placeholder="91 123 4567"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="dlg-email" className="text-sm font-medium">
                      Official Email
                    </Label>
                    <Input
                      id="dlg-email"
                      type="email"
                      placeholder="contact@example.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="dlg-city" className="text-sm font-medium">
                      City
                    </Label>
                    <Input
                      id="dlg-city"
                      placeholder="Addis Ababa"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="dlg-region" className="text-sm font-medium">
                      Region / State
                    </Label>
                    <Input
                      id="dlg-region"
                      placeholder="Addis Ababa"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-1 border-t border-border/40">
                  <Label htmlFor="dlg-tin" className="text-sm font-medium">
                    TIN Number
                  </Label>
                  <Input
                    id="dlg-tin"
                    placeholder="10-digit TIN"
                    value={tinNumber}
                    onChange={(e) => setTinNumber(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-muted-foreground">
                    Required for tax invoicing and bank payouts in Ethiopia.
                  </p>
                </div>
              </motion.div>
            )}

            {/* ─── Step 3: Verification ─────────────────────────────────────── */}
            {step === 3 && (
              <motion.div
                key="dialog-step-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-base font-bold">Verification Documents (Optional)</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Upload documents now or complete later in organization settings
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs text-foreground flex items-start gap-2.5">
                  <HugeiconsIcon icon={SecurityCheckIcon} strokeWidth={2} className="size-4 text-primary shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    {isAutoApproveEligible ? (
                      <>
                        <strong className="font-semibold text-primary">⚡ Fast-Track Instant Verification:</strong> Since your event scale is under 500 attendees, providing your Business License, TIN Certificate, Logo, and Banner will verify your organization <strong>immediately</strong> upon submission.
                      </>
                    ) : (
                      <>
                        <strong className="font-semibold text-primary">Priority Compliance Review:</strong> For organizations with 500+ attendees, documents are submitted for priority compliance review. You can create draft events while review is in progress.
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2 p-3 rounded-xl border border-border/60 bg-muted/20">
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon icon={FileValidationIcon} strokeWidth={2} className="size-4 text-primary" />
                      <Label className="text-xs font-semibold uppercase text-muted-foreground">
                        Business License
                      </Label>
                    </div>
                    <input
                      id="dlg-license"
                      type="file"
                      accept=".pdf,image/*"
                      className="hidden"
                      onChange={(e) => setLicenseFile(e.target.files?.[0] ?? null)}
                    />
                    <Label
                      htmlFor="dlg-license"
                      className="flex items-center justify-center gap-1.5 h-9 w-full rounded-lg border border-dashed border-border cursor-pointer text-xs font-medium hover:bg-muted transition-colors"
                    >
                      <HugeiconsIcon icon={Upload01Icon} strokeWidth={2} className="size-3.5" />
                      {licenseFile ? licenseFile.name : "Upload PDF or Image"}
                    </Label>
                    {licenseFile && (
                      <p className="text-xs text-primary truncate">✓ Ready: {licenseFile.name}</p>
                    )}
                  </div>

                  <div className="space-y-2 p-3 rounded-xl border border-border/60 bg-muted/20">
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon icon={FileValidationIcon} strokeWidth={2} className="size-4 text-primary" />
                      <Label className="text-xs font-semibold uppercase text-muted-foreground">
                        TIN Certificate
                      </Label>
                    </div>
                    <input
                      id="dlg-tincert"
                      type="file"
                      accept=".pdf,image/*"
                      className="hidden"
                      onChange={(e) => setTinFile(e.target.files?.[0] ?? null)}
                    />
                    <Label
                      htmlFor="dlg-tincert"
                      className="flex items-center justify-center gap-1.5 h-9 w-full rounded-lg border border-dashed border-border cursor-pointer text-xs font-medium hover:bg-muted transition-colors"
                    >
                      <HugeiconsIcon icon={Upload01Icon} strokeWidth={2} className="size-3.5" />
                      {tinFile ? tinFile.name : "Upload PDF or Image"}
                    </Label>
                    {tinFile && (
                      <p className="text-xs text-primary truncate">✓ Ready: {tinFile.name}</p>
                    )}
                  </div>
                </div>

                {(!profileFile || !bannerFile) && (licenseFile || tinFile) && (
                  <p className="text-[11px] text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border/40 leading-relaxed">
                    💡 <em>Tip:</em> For instant verification upon creation, ensure you have also chosen a Logo and Banner in Step 2. Otherwise, you can upload them anytime in Settings.
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Pinned Footer Navigation */}
        <div className="p-4 border-t border-border/60 bg-background shrink-0">
          {error && <p className="text-destructive text-xs font-medium mb-2">{error}</p>}

          {step === 0 && (
            <Button
              className="w-full gap-2 shadow-xs cursor-pointer h-10"
              onClick={() => {
                setError("")
                setStep(1)
              }}
            >
              Next: Organization Info
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4" />
            </Button>
          )}

          {step === 1 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-1.5 cursor-pointer h-10"
                onClick={() => {
                  setError("")
                  setStep(0)
                }}
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" /> Back
              </Button>
              <Button
                className="flex-1 gap-2 shadow-xs cursor-pointer h-10"
                onClick={() => {
                  if (!name.trim()) {
                    setError("Organization name is required")
                    return
                  }
                  setError("")
                  setStep(2)
                }}
              >
                Next: Contact & Location
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-1.5 cursor-pointer h-10"
                onClick={() => {
                  setError("")
                  setStep(1)
                }}
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" /> Back
              </Button>
              <Button
                className="flex-1 gap-2 shadow-xs cursor-pointer h-10"
                onClick={() => {
                  setError("")
                  setStep(3)
                }}
              >
                Next: Verification
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4" />
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-1.5 cursor-pointer h-10"
                  onClick={() => {
                    setError("")
                    setStep(2)
                  }}
                  disabled={isSubmitting}
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" /> Back
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 cursor-pointer h-10"
                  onClick={() => handleCreate(true)}
                  disabled={isSubmitting}
                >
                  Skip Docs & Create
                </Button>
              </div>
              <Button
                className="w-full gap-2 shadow-xs cursor-pointer h-10"
                onClick={() => handleCreate(false)}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <HugeiconsIcon icon={Loading01Icon} strokeWidth={2} className="size-4 animate-spin" />
                    Creating Organization...
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-4" />
                    {licenseFile && tinFile && profileFile && bannerFile
                      ? (isAutoApproveEligible ? "Create & Verify Instantly" : "Create & Submit for Review")
                      : "Create Organization"}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
