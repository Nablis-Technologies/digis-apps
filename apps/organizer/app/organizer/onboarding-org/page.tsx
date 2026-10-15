"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PhoneInput } from "@/components/ui/phone-input"
import { Label } from "@/components/ui/label"
import {
  useCreateOwnerOrganizationMutation,
  useUploadOwnerOrganizationDocumentsMutation,
  useSubmitVerificationMutation,
} from "@workspace/store/reducers/organizationsApi"
import { useActiveOrganization } from "../../../providers/organization-provider"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Building02Icon,
  CheckmarkCircle01Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  Loading01Icon,
  Upload01Icon,
  Cancel01Icon,
  Tick02Icon,
  PresentationPodiumIcon,
  PencilEdit01Icon,
  FootballIcon,
  TheaterIcon,
  SmileIcon,
  Store01Icon,
  FileValidationIcon,
} from "@hugeicons/core-free-icons"
import { Music, PartyPopper, Palette, ShieldCheck } from "lucide-react"

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
    label: "NGO / Non-Profit Organization",
    desc: "Charity, foundation, or community non-profit",
  },
  {
    value: "government",
    label: "Government / Educational Entity",
    desc: "Public institution, university, or municipal department",
  },
  {
    value: "collective",
    label: "Artistic / Event Collective",
    desc: "Creative crew, music label, or collaborative group",
  },
]

const CATEGORIES = [
  { value: "music", label: "Music", icon: Music, iconType: "lucide" as const },
  { value: "sports", label: "Sports", icon: FootballIcon, iconType: "huge" as const },
  { value: "conference", label: "Conference", icon: PresentationPodiumIcon, iconType: "huge" as const },
  { value: "comedy", label: "Comedy", icon: SmileIcon, iconType: "huge" as const },
  { value: "theater", label: "Theater", icon: TheaterIcon, iconType: "huge" as const },
  { value: "festival", label: "Festival", icon: PartyPopper, iconType: "lucide" as const },
  { value: "workshop", label: "Workshop", icon: PencilEdit01Icon, iconType: "huge" as const },
  { value: "exhibition", label: "Exhibition", icon: Palette, iconType: "lucide" as const },
  { value: "other", label: "Other", icon: Store01Icon, iconType: "huge" as const },
]

const STEPS = [
  "Category & Type",
  "Organization Info",
  "Contact & Location",
  "Verification",
]

export default function OnboardingOrgPage() {
  const router = useRouter()
  const [createOrg, { isLoading: isCreating }] = useCreateOwnerOrganizationMutation()
  const [uploadDocs, { isLoading: isUploading }] = useUploadOwnerOrganizationDocumentsMutation()
  const [submitVerification, { isLoading: isSubmittingVerification }] = useSubmitVerificationMutation()
  const { setActiveOrgId, refetchOrganizations } = useActiveOrganization()

  const [step, setStep] = React.useState(0)
  const [error, setError] = React.useState("")

  // Form State
  const [name, setName] = React.useState("")
  const [organizerType, setOrganizerType] = React.useState("company")
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>(["music"])
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

  const toggleCategory = (val: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(val)) {
        if (prev.length === 1) return prev // keep at least 1 category selected
        return prev.filter((c) => c !== val)
      }
      return [...prev, val]
    })
  }

  const handleSubmit = async (skipDocs = false) => {
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

      toast.loading("Creating your organization...")
      const res = await createOrg({
        organization: {
          name: name.trim(),
          organizer_type: organizerType as any,
          category: selectedCategories[0] || "music",
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

      if (!skipDocs && (profileFile || bannerFile || licenseFile || tinFile)) {
        try {
          toast.loading("Uploading verification documents...")
          const formData = new FormData()
          if (profileFile) formData.append("profile", profileFile)
          if (bannerFile) formData.append("banner", bannerFile)
          if (licenseFile) formData.append("business_license", licenseFile)
          if (tinFile) formData.append("tin_certificate", tinFile)

          await uploadDocs({ id: newOrgId, formData }).unwrap()
          toast.dismiss()

          if (licenseFile && tinFile) {
            toast.loading("Submitting for verification...")
            await submitVerification(newOrgId).unwrap()
            toast.dismiss()
            toast.success("Submitted for verification review!")
          } else {
            toast.info("Documents uploaded. Submit for verification review anytime in Settings.")
          }
        } catch (docErr: any) {
          toast.dismiss()
          toast.warning("Organization created! Documents can be completed later in settings.", {
            description: docErr?.data?.message || docErr?.message,
          })
        }
      }

      // Refresh organizations in context and activate
      refetchOrganizations()
      setActiveOrgId(newOrgId)
      router.replace("/organizer")
    } catch (err: any) {
      toast.dismiss()
      const errorMsg =
        err?.data?.message ||
        err?.data?.error ||
        "Failed to create organization. Please try again."
      toast.error("Error creating organization", { description: errorMsg })
      setError(errorMsg)
    }
  }

  return (
    <div className="min-h-[90vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-2xl bg-card border border-border/70 shadow-2xl rounded-3xl p-6 sm:p-10 space-y-8 flex flex-col">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-lime-500/10 text-lime-600 dark:text-lime-400 mb-1">
            <HugeiconsIcon icon={Building02Icon} strokeWidth={2} className="size-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome to Digis Organizer
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Set up your organization workspace to publish events, manage ticket sales, and track revenue.
          </p>
        </div>

        {/* Step indicators with theme lime-500 styling */}
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-2">
                {/* Circle with number or checkmark */}
                <div
                  className={`size-8 rounded-full flex items-center justify-center transition-all ${
                    i < step
                      ? "border-2 border-lime-500 bg-lime-500/15 text-lime-600 dark:text-lime-400 font-bold"
                      : i === step
                        ? "bg-lime-500 text-zinc-950 shadow-sm font-bold"
                        : "border-2 border-border bg-background text-muted-foreground"
                  }`}
                >
                  {i < step ? (
                    <HugeiconsIcon
                      icon={Tick02Icon}
                      strokeWidth={3}
                      className="size-4 text-lime-600 dark:text-lime-400"
                    />
                  ) : (
                    <span className="text-xs sm:text-sm font-bold">
                      {i + 1}
                    </span>
                  )}
                </div>
                {/* Step label */}
                <span
                  className={`text-xs sm:text-sm font-medium hidden md:inline ${
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
              {/* Connecting line */}
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 rounded-full transition-colors ${
                    i < step ? "bg-lime-500" : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="flex-1 min-h-[360px]">
          <AnimatePresence mode="wait">
            {/* ─── Step 0: Category & Type ──────────────────────────────────── */}
            {step === 0 && (
              <motion.div
                key="step-0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-lg font-bold">What types of events do you organize?</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    Select one or more categories that best match your events
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {CATEGORIES.map((cat) => {
                    const isSelected = selectedCategories.includes(cat.value)
                    return (
                      <div
                        key={cat.value}
                        onClick={() => !isSubmitting && toggleCategory(cat.value)}
                        className={`flex items-center space-x-3 rounded-xl border-2 p-3.5 cursor-pointer transition-all hover:bg-lime-500/5 ${
                          isSelected
                            ? "border-lime-500 bg-lime-500/10 shadow-sm"
                            : "border-border/60"
                        } ${isSubmitting ? "opacity-60 cursor-not-allowed" : ""}`}
                      >
                        <div
                          className={`size-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? "border-lime-500 bg-lime-500 text-zinc-950"
                              : "border-muted-foreground/40 bg-background"
                          }`}
                        >
                          {isSelected && (
                            <HugeiconsIcon icon={Tick02Icon} strokeWidth={3} className="size-3 text-zinc-950" />
                          )}
                        </div>
                        <div
                          className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                            isSelected ? "bg-lime-500/20 text-lime-700 dark:text-lime-300" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {cat.iconType === "huge" ? (
                            <HugeiconsIcon
                              icon={cat.icon as any}
                              strokeWidth={2}
                              className="size-5"
                            />
                          ) : (
                            <cat.icon className="size-5" strokeWidth={2} />
                          )}
                        </div>
                        <span
                          className={`text-sm font-medium leading-tight flex-1 ${
                            isSelected ? "text-foreground font-semibold" : "text-muted-foreground"
                          }`}
                        >
                          {cat.label}
                        </span>
                      </div>
                    )
                  })}
                </div>

                <div className="space-y-2 pt-2 border-t border-border/40">
                  <h2 className="text-base font-bold">Organizer Structure</h2>
                  <p className="text-xs text-muted-foreground mb-3">
                    Select how your organization is legally organized
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {ORGANIZER_TYPES.map((t) => {
                      const isSelected = organizerType === t.value
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setOrganizerType(t.value)}
                          className={`text-left p-3.5 rounded-xl border-2 transition-all flex items-start gap-3 ${
                            isSelected
                              ? "border-lime-500 bg-lime-500/10 shadow-sm"
                              : "border-border/60 hover:border-border bg-card"
                          }`}
                        >
                          <div
                            className={`size-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                              isSelected
                                ? "border-lime-500 bg-lime-500 text-zinc-950"
                                : "border-muted-foreground/50"
                            }`}
                          >
                            {isSelected && <div className="size-1.5 rounded-full bg-zinc-950" />}
                          </div>
                          <div>
                            <div className="text-sm font-semibold">{t.label}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{t.desc}</div>
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
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-lg font-bold">Organization Profile</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    Enter your organization's public name, description, and brand imagery
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="org-name" className="text-sm font-semibold">
                    Organization Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="org-name"
                    placeholder="e.g., Starlight Entertainment, Nexus Tech Conf"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      if (error) setError("")
                    }}
                    disabled={isSubmitting}
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    This name appears on all tickets, receipts, and public event pages.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="org-desc" className="text-sm font-semibold">
                    About the Organization
                  </Label>
                  <textarea
                    id="org-desc"
                    rows={3}
                    placeholder="Briefly describe what your organization does, the events you curate, and your community..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isSubmitting}
                    className="flex min-h-20 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                {/* Brand Imagery (Logo & Banner) */}
                <div className="space-y-3 pt-2 border-t border-border/40">
                  <h3 className="text-sm font-semibold">Brand Assets (Optional)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Profile / Logo */}
                    <div className="p-3.5 rounded-2xl border border-border/60 bg-muted/20 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold uppercase text-muted-foreground">
                          Logo / Profile Photo
                        </Label>
                        {profilePreview && (
                          <button
                            type="button"
                            onClick={() => {
                              URL.revokeObjectURL(profilePreview)
                              setProfilePreview("")
                              setProfileFile(null)
                            }}
                            className="text-xs text-destructive hover:underline flex items-center gap-1"
                          >
                            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-3" /> Remove
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {profilePreview ? (
                          <div className="size-14 rounded-full overflow-hidden border border-border bg-card shrink-0">
                            <img src={profilePreview} alt="Logo preview" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="size-14 rounded-full border-2 border-dashed border-border flex items-center justify-center bg-card text-muted-foreground shrink-0">
                            <HugeiconsIcon icon={Building02Icon} strokeWidth={1.5} className="size-6" />
                          </div>
                        )}
                        <div className="flex-1">
                          <input
                            id="profile-upload"
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
                            htmlFor="profile-upload"
                            className="flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg border border-border cursor-pointer text-xs font-medium hover:bg-muted transition-colors w-full"
                          >
                            <HugeiconsIcon icon={Upload01Icon} strokeWidth={2} className="size-3.5" />
                            {profileFile ? "Change Logo" : "Choose Logo"}
                          </Label>
                        </div>
                      </div>
                    </div>

                    {/* Banner / Cover */}
                    <div className="p-3.5 rounded-2xl border border-border/60 bg-muted/20 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold uppercase text-muted-foreground">
                          Cover Banner
                        </Label>
                        {bannerPreview && (
                          <button
                            type="button"
                            onClick={() => {
                              URL.revokeObjectURL(bannerPreview)
                              setBannerPreview("")
                              setBannerFile(null)
                            }}
                            className="text-xs text-destructive hover:underline flex items-center gap-1"
                          >
                            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-3" /> Remove
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {bannerPreview ? (
                          <div className="h-14 w-24 rounded-lg overflow-hidden border border-border bg-card shrink-0">
                            <img src={bannerPreview} alt="Banner preview" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="h-14 w-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-card text-muted-foreground shrink-0">
                            <HugeiconsIcon icon={Upload01Icon} strokeWidth={1.5} className="size-5" />
                          </div>
                        )}
                        <div className="flex-1">
                          <input
                            id="banner-upload"
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
                            htmlFor="banner-upload"
                            className="flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg border border-border cursor-pointer text-xs font-medium hover:bg-muted transition-colors w-full"
                          >
                            <HugeiconsIcon icon={Upload01Icon} strokeWidth={2} className="size-3.5" />
                            {bannerFile ? "Change Banner" : "Choose Banner"}
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─── Step 2: Contact & Location ───────────────────────────────── */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-lg font-bold">Contact & Location</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    Provide your public contact details and where your organization operates
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="org-phone" className="text-sm font-semibold">
                      Official Phone
                    </Label>
                    <PhoneInput
                      id="org-phone"
                      placeholder="91 123 4567"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      disabled={isSubmitting}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="org-email" className="text-sm font-semibold">
                      Official Email
                    </Label>
                    <Input
                      id="org-email"
                      type="email"
                      placeholder="contact@example.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      disabled={isSubmitting}
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="org-city" className="text-sm font-semibold">
                      City
                    </Label>
                    <Input
                      id="org-city"
                      placeholder="Addis Ababa"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      disabled={isSubmitting}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="org-region" className="text-sm font-semibold">
                      Region / State
                    </Label>
                    <Input
                      id="org-region"
                      placeholder="Addis Ababa"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      disabled={isSubmitting}
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-border/40">
                  <Label htmlFor="org-tin" className="text-sm font-semibold">
                    Tax Identification Number (TIN)
                  </Label>
                  <Input
                    id="org-tin"
                    placeholder="10-digit TIN number"
                    value={tinNumber}
                    onChange={(e) => setTinNumber(e.target.value)}
                    disabled={isSubmitting}
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    Required for tax invoicing and automated payout settlement in Ethiopia.
                  </p>
                </div>
              </motion.div>
            )}

            {/* ─── Step 3: Verification ─────────────────────────────────────── */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-lg font-bold">Verification Documents</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    Upload official documents for faster account verification and instant payouts
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-lime-500/10 border border-lime-500/20 text-xs text-lime-950 dark:text-lime-200 flex items-start gap-3">
                  <ShieldCheck className="size-5 text-lime-600 dark:text-lime-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Optional Verification:</span> You can upload your documents now to start selling tickets immediately upon review, or skip this step and complete it anytime in organization settings.
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Business License */}
                  <div className="space-y-2 p-4 rounded-2xl border border-border/60 bg-muted/20">
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon icon={FileValidationIcon} strokeWidth={2} className="size-4 text-lime-600 dark:text-lime-400" />
                      <Label className="text-xs font-semibold uppercase text-muted-foreground">
                        Business License
                      </Label>
                    </div>
                    <input
                      id="license-upload"
                      type="file"
                      accept=".pdf,image/*"
                      className="hidden"
                      onChange={(e) => setLicenseFile(e.target.files?.[0] ?? null)}
                    />
                    <Label
                      htmlFor="license-upload"
                      className="flex items-center justify-center gap-2 h-10 w-full rounded-xl border border-dashed border-border cursor-pointer text-xs font-medium hover:bg-muted transition-colors"
                    >
                      <HugeiconsIcon icon={Upload01Icon} strokeWidth={2} className="size-3.5" />
                      {licenseFile ? licenseFile.name : "Upload PDF or Image"}
                    </Label>
                    {licenseFile && (
                      <p className="text-xs text-lime-600 dark:text-lime-400 truncate">✓ Ready: {licenseFile.name}</p>
                    )}
                  </div>

                  {/* TIN Certificate */}
                  <div className="space-y-2 p-4 rounded-2xl border border-border/60 bg-muted/20">
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon icon={FileValidationIcon} strokeWidth={2} className="size-4 text-lime-600 dark:text-lime-400" />
                      <Label className="text-xs font-semibold uppercase text-muted-foreground">
                        TIN Certificate
                      </Label>
                    </div>
                    <input
                      id="tincert-upload"
                      type="file"
                      accept=".pdf,image/*"
                      className="hidden"
                      onChange={(e) => setTinFile(e.target.files?.[0] ?? null)}
                    />
                    <Label
                      htmlFor="tincert-upload"
                      className="flex items-center justify-center gap-2 h-10 w-full rounded-xl border border-dashed border-border cursor-pointer text-xs font-medium hover:bg-muted transition-colors"
                    >
                      <HugeiconsIcon icon={Upload01Icon} strokeWidth={2} className="size-3.5" />
                      {tinFile ? tinFile.name : "Upload PDF or Image"}
                    </Label>
                    {tinFile && (
                      <p className="text-xs text-lime-600 dark:text-lime-400 truncate">✓ Ready: {tinFile.name}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sticky bottom navigation referencing event creation */}
        <div className="pt-4 border-t border-border/60 space-y-3">
          {error && <p className="text-destructive text-sm font-medium">{error}</p>}

          {step === 0 && (
            <Button
              className="w-full h-11 font-bold bg-lime-500 hover:bg-lime-600 text-zinc-950 dark:bg-lime-500 dark:text-zinc-950 dark:hover:bg-lime-400 border-0"
              onClick={() => {
                setError("")
                setStep(1)
              }}
            >
              Next: Organization Info
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="ml-2 size-4" />
            </Button>
          )}

          {step === 1 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 h-11"
                onClick={() => {
                  setError("")
                  setStep(0)
                }}
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4 mr-2" /> Back
              </Button>
              <Button
                className="flex-1 h-11 font-bold bg-lime-500 hover:bg-lime-600 text-zinc-950 dark:bg-lime-500 dark:text-zinc-950 dark:hover:bg-lime-400 border-0"
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
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="ml-2 size-4" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 h-11"
                onClick={() => {
                  setError("")
                  setStep(1)
                }}
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4 mr-2" /> Back
              </Button>
              <Button
                className="flex-1 h-11 font-bold bg-lime-500 hover:bg-lime-600 text-zinc-950 dark:bg-lime-500 dark:text-zinc-950 dark:hover:bg-lime-400 border-0"
                onClick={() => {
                  setError("")
                  setStep(3)
                }}
              >
                Next: Verification
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="ml-2 size-4" />
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 h-11"
                  onClick={() => {
                    setError("")
                    setStep(2)
                  }}
                  disabled={isSubmitting}
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4 mr-2" /> Back
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 h-11"
                  onClick={() => handleSubmit(true)}
                  disabled={isSubmitting}
                >
                  Skip Documents & Finish
                </Button>
              </div>
              <Button
                className="w-full h-12 font-bold text-base bg-lime-500 hover:bg-lime-600 text-zinc-950 dark:bg-lime-500 dark:text-zinc-950 dark:hover:bg-lime-400 border-0"
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <HugeiconsIcon icon={Loading01Icon} strokeWidth={2} className="size-5 animate-spin mr-2" />
                    Setting Up Organization...
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-5 mr-2" />
                    {licenseFile && tinFile ? "Create & Submit for Verification" : "Create & Enter Dashboard"}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
