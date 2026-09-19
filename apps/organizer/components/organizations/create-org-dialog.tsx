"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { useActiveOrganization } from "../../providers/organization-provider"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Building02Icon,
  Upload04Icon,
  Loading01Icon,
  CheckmarkCircle01Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
} from "@hugeicons/core-free-icons"

interface CreateOrgDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (orgId: string) => void
}

const ORGANIZER_TYPES = [
  { value: "company", label: "Company / Corporate" },
  { value: "individual", label: "Individual / Freelancer" },
  { value: "ngo", label: "NGO / Non-Profit" },
  { value: "government", label: "Government Entity" },
  { value: "collective", label: "Creative Collective" },
]

const CATEGORIES = [
  { value: "music", label: "Music & Concerts" },
  { value: "sports", label: "Sports & Fitness" },
  { value: "conference", label: "Conferences & Seminars" },
  { value: "comedy", label: "Comedy & Entertainment" },
  { value: "theater", label: "Theater & Performing Arts" },
  { value: "festival", label: "Festivals & Cultural" },
  { value: "workshop", label: "Workshops & Training" },
  { value: "exhibition", label: "Exhibitions & Fairs" },
  { value: "other", label: "Other" },
]

export function CreateOrgDialog({ open, onOpenChange, onCreated }: CreateOrgDialogProps) {
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

  const resetForm = () => {
    setName("")
    setOrganizerType("company")
    setCategory("music")
    setContactPhone("")
    setContactEmail("")
    setCity("")
    setRegion("")
    setTinNumber("")
    setDescription("")
    setProfileFile(null)
    setBannerFile(null)
    setLicenseFile(null)
    setTinFile(null)
    setStep("details")
  }

  const handleCreate = async (skipDocs = false) => {
    if (!name.trim()) {
      toast.error("Organization name is required")
      return
    }

    try {
      toast.loading("Creating organization...")
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

      // If user provided files and didn't skip, upload and submit verification
      if (!skipDocs && (profileFile || bannerFile || licenseFile || tinFile)) {
        if (profileFile && bannerFile && licenseFile && tinFile) {
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
            toast.success("Organization submitted for verification review!")
          } catch (docErr: any) {
            toast.dismiss()
            toast.warning("Organization created, but document upload failed. You can upload them later.", {
              description: docErr?.data?.message || docErr?.message,
            })
          }
        } else {
          toast.info("Organization created as draft. Upload all 4 documents later to submit for verification.")
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
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-lg bg-lime-500/10 text-lime-600 dark:text-lime-400">
              <HugeiconsIcon icon={Building02Icon} strokeWidth={2} className="size-5" />
            </div>
            <DialogTitle>
              {step === "details" ? "Create New Organization" : "Verification Documents (Optional)"}
            </DialogTitle>
          </div>
          <DialogDescription>
            {step === "details"
              ? "Set up a workspace for your brand, team, or festival to host events and receive payouts."
              : "Upload documents to get verified and publish public ticket sales immediately."}
          </DialogDescription>
        </DialogHeader>

        {step === "details" ? (
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="org-name" className="text-sm font-medium">
                Organization Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="org-name"
                placeholder="e.g., Starlight Entertainment, Addis Nightlife"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Organizer Type</Label>
                <Select value={organizerType} onValueChange={setOrganizerType} disabled={isSubmitting}>
                  <SelectTrigger>
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
                <Label className="text-sm font-medium">Primary Category</Label>
                <Select value={category} onValueChange={setCategory} disabled={isSubmitting}>
                  <SelectTrigger>
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
                <Label htmlFor="org-phone" className="text-sm font-medium">
                  Contact Phone
                </Label>
                <Input
                  id="org-phone"
                  placeholder="+251 9..."
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="org-email" className="text-sm font-medium">
                  Contact Email
                </Label>
                <Input
                  id="org-email"
                  type="email"
                  placeholder="contact@example.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="org-city" className="text-sm font-medium">
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
                <Label htmlFor="org-region" className="text-sm font-medium">
                  Region / State
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
                <Label htmlFor="org-tin" className="text-sm font-medium">
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
              <Label htmlFor="org-desc" className="text-sm font-medium">
                Description / Bio
              </Label>
              <textarea
                id="org-desc"
                rows={3}
                placeholder="Briefly describe what your organization does..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleCreate(true)}
                  disabled={!name.trim() || isSubmitting}
                >
                  Create Organization Now
                </Button>
                <Button
                  type="button"
                  onClick={() => setStep("documents")}
                  disabled={!name.trim() || isSubmitting}
                  className="bg-lime-600 hover:bg-lime-700 text-white dark:bg-lime-500 dark:text-zinc-950 dark:hover:bg-lime-400"
                >
                  Next: Verification Docs
                  <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4 ml-1.5" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 p-3 rounded-lg border border-border/60 bg-muted/20">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">
                  Profile Logo (Square)
                </Label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProfileFile(e.target.files?.[0] ?? null)}
                  className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground hover:file:cursor-pointer"
                />
                {profileFile && (
                  <p className="text-xs text-lime-600 dark:text-lime-400 truncate mt-1">
                    ✓ {profileFile.name}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 p-3 rounded-lg border border-border/60 bg-muted/20">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">
                  Banner Image (Landscape)
                </Label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setBannerFile(e.target.files?.[0] ?? null)}
                  className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground hover:file:cursor-pointer"
                />
                {bannerFile && (
                  <p className="text-xs text-lime-600 dark:text-lime-400 truncate mt-1">
                    ✓ {bannerFile.name}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 p-3 rounded-lg border border-border/60 bg-muted/20">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">
                  Business License (PDF / Image)
                </Label>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => setLicenseFile(e.target.files?.[0] ?? null)}
                  className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground hover:file:cursor-pointer"
                />
                {licenseFile && (
                  <p className="text-xs text-lime-600 dark:text-lime-400 truncate mt-1">
                    ✓ {licenseFile.name}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 p-3 rounded-lg border border-border/60 bg-muted/20">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">
                  TIN Certificate (PDF / Image)
                </Label>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => setTinFile(e.target.files?.[0] ?? null)}
                  className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground hover:file:cursor-pointer"
                />
                {tinFile && (
                  <p className="text-xs text-lime-600 dark:text-lime-400 truncate mt-1">
                    ✓ {tinFile.name}
                  </p>
                )}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Tip: You can submit without documents now and upload them later from Organization Settings.
            </p>

            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep("details")}
                disabled={isSubmitting}
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4 mr-1.5" />
                Back to Details
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleCreate(true)}
                  disabled={isSubmitting}
                >
                  Skip Documents & Create
                </Button>
                <Button
                  type="button"
                  onClick={() => handleCreate(false)}
                  disabled={isSubmitting}
                  className="bg-lime-600 hover:bg-lime-700 text-white dark:bg-lime-500 dark:text-zinc-950 dark:hover:bg-lime-400 min-w-[160px]"
                >
                  {isSubmitting ? (
                    <>
                      <HugeiconsIcon icon={Loading01Icon} strokeWidth={2} className="size-4 animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-4 mr-1.5" />
                      Create & Submit
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
