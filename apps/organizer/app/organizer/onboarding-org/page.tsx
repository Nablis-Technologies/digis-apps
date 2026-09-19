"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  Loading01Icon,
  FileValidationIcon,
} from "@hugeicons/core-free-icons"

const ORGANIZER_TYPES = [
  { value: "company", label: "Company / Registered Business" },
  { value: "individual", label: "Individual / Independent Creator" },
  { value: "ngo", label: "NGO / Non-Profit Organization" },
  { value: "government", label: "Government / Educational Entity" },
  { value: "collective", label: "Artistic / Event Collective" },
]

const CATEGORIES = [
  { value: "music", label: "Music & Concerts" },
  { value: "sports", label: "Sports & Fitness" },
  { value: "conference", label: "Conferences & Seminars" },
  { value: "comedy", label: "Comedy & Entertainment" },
  { value: "theater", label: "Theater & Performing Arts" },
  { value: "festival", label: "Festivals & Cultural Gatherings" },
  { value: "workshop", label: "Workshops & Training" },
  { value: "exhibition", label: "Exhibitions & Fairs" },
  { value: "other", label: "Other" },
]

export default function OnboardingOrgPage() {
  const router = useRouter()
  const [createOrg, { isLoading: isCreating }] = useCreateOwnerOrganizationMutation()
  const [uploadDocs, { isLoading: isUploading }] = useUploadOwnerOrganizationDocumentsMutation()
  const [submitVerification, { isLoading: isSubmittingVerification }] = useSubmitVerificationMutation()
  const { setActiveOrgId, refetchOrganizations } = useActiveOrganization()

  const [step, setStep] = React.useState<"details" | "documents">("details")

  // Form State
  const [name, setName] = React.useState("")
  const [organizerType, setOrganizerType] = React.useState("company")
  const [category, setCategory] = React.useState("music")
  const [contactPhone, setContactPhone] = React.useState("")
  const [contactEmail, setContactEmail] = React.useState("")
  const [city, setCity] = React.useState("")
  const [region, setRegion] = React.useState("")
  const [tinNumber, setTinNumber] = React.useState("")
  const [description, setDescription] = React.useState("")

  // Files State
  const [profileFile, setProfileFile] = React.useState<File | null>(null)
  const [bannerFile, setBannerFile] = React.useState<File | null>(null)
  const [licenseFile, setLicenseFile] = React.useState<File | null>(null)
  const [tinFile, setTinFile] = React.useState<File | null>(null)

  const isSubmitting = isCreating || isUploading || isSubmittingVerification

  const handleSubmit = async (skipDocs = false) => {
    if (!name.trim()) {
      toast.error("Organization name is required")
      return
    }

    try {
      toast.loading("Creating your organization...")
      const res = await createOrg({
        organization: {
          name: name.trim(),
          organizer_type: organizerType as any,
          category,
          contact_phone: contactPhone.trim() || undefined,
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

      if (!skipDocs && profileFile && bannerFile && licenseFile && tinFile) {
        try {
          toast.loading("Uploading verification documents...")
          const formData = new FormData()
          formData.append("profile", profileFile)
          formData.append("banner", bannerFile)
          formData.append("business_license", licenseFile)
          formData.append("tin_certificate", tinFile)

          await uploadDocs({ id: newOrgId, formData }).unwrap()
          toast.dismiss()

          toast.loading("Submitting for verification...")
          await submitVerification(newOrgId).unwrap()
          toast.dismiss()
          toast.success("Submitted for verification review!")
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
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-2xl bg-card border border-border/70 shadow-2xl rounded-3xl p-6 sm:p-10 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-lime-500/10 text-lime-600 dark:text-lime-400 mb-2">
            <HugeiconsIcon icon={Building02Icon} strokeWidth={2} className="size-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome to DEGES Organizer
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            You don't have an organization workspace yet. Set up your organization to start publishing events and selling tickets.
          </p>
        </div>

        {/* Step Tabs Indicator */}
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setStep("details")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              step === "details"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            1. Organization Details
          </button>
          <div className="w-8 h-px bg-border" />
          <button
            type="button"
            onClick={() => {
              if (name.trim()) setStep("documents")
            }}
            disabled={!name.trim()}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              step === "documents"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground disabled:opacity-50"
            }`}
          >
            2. Verification Documents (Optional)
          </button>
        </div>

        {step === "details" ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="org-name" className="text-sm font-semibold">
                Organization Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="org-name"
                placeholder="e.g., Starlight Entertainment, Nexus Tech Conf"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
                className="h-11"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Organizer Type</Label>
                <Select value={organizerType} onValueChange={setOrganizerType} disabled={isSubmitting}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORGANIZER_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Primary Category</Label>
                <Select value={category} onValueChange={setCategory} disabled={isSubmitting}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="org-phone" className="text-sm font-semibold">
                  Official Phone
                </Label>
                <Input
                  id="org-phone"
                  placeholder="+251 9..."
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="org-region" className="text-sm font-semibold">
                  Region
                </Label>
                <Input
                  id="org-region"
                  placeholder="Addis Ababa"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="org-tin" className="text-sm font-semibold">
                  TIN Number
                </Label>
                <Input
                  id="org-tin"
                  placeholder="10-digit TIN"
                  value={tinNumber}
                  onChange={(e) => setTinNumber(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="org-desc" className="text-sm font-semibold">
                About the Organization
              </Label>
              <textarea
                id="org-desc"
                rows={3}
                placeholder="What kinds of events does your organization host?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="flex items-center justify-between pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSubmit(true)}
                disabled={!name.trim() || isSubmitting}
              >
                Create Now & Skip Documents
              </Button>
              <Button
                type="button"
                onClick={() => setStep("documents")}
                disabled={!name.trim() || isSubmitting}
                className="bg-lime-600 hover:bg-lime-700 text-white dark:bg-lime-500 dark:text-zinc-950 dark:hover:bg-lime-400 font-semibold h-11 px-6"
              >
                Continue to Documents
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4 ml-2" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-lime-500/10 border border-lime-500/20 text-xs text-lime-900 dark:text-lime-200">
              Uploading all 4 documents allows immediate automated or express verification review so you can publish paid events immediately.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 p-3 rounded-xl border border-border/60 bg-muted/20">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">
                  Profile Logo
                </Label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProfileFile(e.target.files?.[0] ?? null)}
                  className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground hover:file:cursor-pointer"
                />
                {profileFile && (
                  <p className="text-xs text-lime-600 dark:text-lime-400 truncate mt-1">✓ {profileFile.name}</p>
                )}
              </div>

              <div className="space-y-1.5 p-3 rounded-xl border border-border/60 bg-muted/20">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">
                  Banner Image
                </Label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setBannerFile(e.target.files?.[0] ?? null)}
                  className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground hover:file:cursor-pointer"
                />
                {bannerFile && (
                  <p className="text-xs text-lime-600 dark:text-lime-400 truncate mt-1">✓ {bannerFile.name}</p>
                )}
              </div>

              <div className="space-y-1.5 p-3 rounded-xl border border-border/60 bg-muted/20">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">
                  Business License
                </Label>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => setLicenseFile(e.target.files?.[0] ?? null)}
                  className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground hover:file:cursor-pointer"
                />
                {licenseFile && (
                  <p className="text-xs text-lime-600 dark:text-lime-400 truncate mt-1">✓ {licenseFile.name}</p>
                )}
              </div>

              <div className="space-y-1.5 p-3 rounded-xl border border-border/60 bg-muted/20">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">
                  TIN Certificate
                </Label>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => setTinFile(e.target.files?.[0] ?? null)}
                  className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground hover:file:cursor-pointer"
                />
                {tinFile && (
                  <p className="text-xs text-lime-600 dark:text-lime-400 truncate mt-1">✓ {tinFile.name}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep("details")}
                disabled={isSubmitting}
              >
                Back to Details
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSubmit(true)}
                  disabled={isSubmitting}
                >
                  Skip Documents for Now
                </Button>
                <Button
                  type="button"
                  onClick={() => handleSubmit(false)}
                  disabled={isSubmitting}
                  className="bg-lime-600 hover:bg-lime-700 text-white dark:bg-lime-500 dark:text-zinc-950 dark:hover:bg-lime-400 font-semibold h-11 px-6 min-w-[180px]"
                >
                  {isSubmitting ? (
                    <>
                      <HugeiconsIcon icon={Loading01Icon} strokeWidth={2} className="size-4 animate-spin mr-2" />
                      Setting Up...
                    </>
                  ) : (
                    <>
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-4 mr-2" />
                      Create & Enter Dashboard
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
