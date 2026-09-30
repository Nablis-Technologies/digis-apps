"use client"

import * as React from "react"
import { useActiveOrganization } from "../../../providers/organization-provider"
import {
  useGetOwnerOrganizationQuery,
  useUpdateOwnerOrganizationMutation,
  useUploadOwnerOrganizationDocumentsMutation,
  useSubmitVerificationMutation,
  useResubmitVerificationMutation,
  type UpdateOrgPayload,
} from "@workspace/store/reducers/organizationsApi"
import { getAccessToken } from "@workspace/store/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PhoneInput, stripCountryCode, normalizeEthiopianPhone } from "@/components/ui/phone-input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { TabsContent } from "@/components/ui/tabs"
import { PageTabs } from "@/components/page-tabs"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Building02Icon,
  CheckmarkCircle01Icon,
  AlertCircleIcon,
  Upload01Icon,
  Download01Icon,
  File01Icon,
  Loading01Icon,
  Globe02Icon,
  Mail01Icon,
  Location01Icon,
  UserGroupIcon,
  Calendar03Icon,
  Clock01Icon,
  FileValidationIcon,
  FloppyDiskIcon,
  Cancel01Icon,
  CheckmarkBadge01Icon,
  Link01Icon,
  Image01Icon,
  Coins01Icon,
} from "@hugeicons/core-free-icons"
import { CommercialTermsCard } from "@/organizer-components/organizations/commercial-terms-card"

const CATEGORIES = [
  "conference",
  "concert",
  "festival",
  "sports",
  "exhibition",
  "workshop",
  "theater",
  "party",
  "community",
  "other",
]

const AUDIENCE_SIZES = [
  { value: "under_500", label: "Under 500 attendees" },
  { value: "500_to_2000", label: "500 – 2,000 attendees" },
  { value: "2000_to_10000", label: "2,000 – 10,000 attendees" },
  { value: "over_10000", label: "Over 10,000 attendees" },
]

const FREQUENCIES = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annually", label: "Annually" },
  { value: "occasional", label: "Occasionally / Ad-hoc" },
]

export default function OrganizationPage() {
  const { activeOrgId, activeOrg, refetchOrganizations } = useActiveOrganization()

  const {
    data: fullOrgData,
    isLoading: isOrgLoading,
    refetch: refetchFullOrg,
  } = useGetOwnerOrganizationQuery(activeOrgId || "", {
    skip: !activeOrgId,
  })

  const [updateOrg, { isLoading: isUpdating }] = useUpdateOwnerOrganizationMutation()
  const [uploadDocs, { isLoading: isUploadingDocs }] = useUploadOwnerOrganizationDocumentsMutation()
  const [submitVerification, { isLoading: isSubmittingVerification }] = useSubmitVerificationMutation()
  const [resubmitVerification, { isLoading: isResubmittingVerification }] = useResubmitVerificationMutation()
  const [downloadingDoc, setDownloadingDoc] = React.useState<string | null>(null)

  const org = fullOrgData?.data ?? activeOrg

  // Form states - General
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [organizerType, setOrganizerType] = React.useState<string>("company")
  const [category, setCategory] = React.useState<string>("conference")
  const [contactPhone, setContactPhone] = React.useState("")
  const [contactEmail, setContactEmail] = React.useState("")
  const [websiteUrl, setWebsiteUrl] = React.useState("")

  // Form states - Location & Scale
  const [addressLine1, setAddressLine1] = React.useState("")
  const [addressLine2, setAddressLine2] = React.useState("")
  const [city, setCity] = React.useState("")
  const [region, setRegion] = React.useState("")
  const [estimatedAudience, setEstimatedAudience] = React.useState("")
  const [eventFrequency, setEventFrequency] = React.useState("")

  // Form states - Compliance
  const [tinNumber, setTinNumber] = React.useState("")

  // Form states - Social Links
  const [socialTwitter, setSocialTwitter] = React.useState("")
  const [socialInstagram, setSocialInstagram] = React.useState("")
  const [socialFacebook, setSocialFacebook] = React.useState("")
  const [socialTelegram, setSocialTelegram] = React.useState("")
  const [socialLinkedin, setSocialLinkedin] = React.useState("")

  // Media upload states
  const [profileFile, setProfileFile] = React.useState<File | null>(null)
  const [profilePreview, setProfilePreview] = React.useState<string>("")
  const [bannerFile, setBannerFile] = React.useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = React.useState<string>("")

  // Document upload states
  const [licenseFile, setLicenseFile] = React.useState<File | null>(null)
  const [tinFile, setTinFile] = React.useState<File | null>(null)

  // Sync state when org data loads
  React.useEffect(() => {
    if (org) {
      setName(org.name || "")
      setDescription(org.description || "")
      setOrganizerType(org.organizer_type || "company")
      setCategory(org.category || "conference")
      setContactPhone(stripCountryCode(org.contact_phone))
      setContactEmail(org.contact_email || "")
      setWebsiteUrl(org.website_url || "")

      setAddressLine1(org.address_line1 || "")
      setAddressLine2(org.address_line2 || "")
      setCity(org.city || "")
      setRegion(org.region || "")
      setEstimatedAudience(org.estimated_audience || "")
      setEventFrequency(org.event_frequency || "")

      setTinNumber(org.tin_number || "")

      const socials = org.social_links || {}
      setSocialTwitter(socials.twitter || socials.x || "")
      setSocialInstagram(socials.instagram || "")
      setSocialFacebook(socials.facebook || "")
      setSocialTelegram(socials.telegram || "")
      setSocialLinkedin(socials.linkedin || "")

      if (org.profile_url) setProfilePreview(org.profile_url)
      if (org.banner_url) setBannerPreview(org.banner_url)
    }
  }, [org])

  if (!activeOrgId) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center space-y-2">
          <HugeiconsIcon icon={Building02Icon} className="size-10 mx-auto text-muted-foreground" />
          <p className="text-sm font-medium">No active organization selected</p>
          <p className="text-xs text-muted-foreground">Select or create an organization to get started.</p>
        </div>
      </div>
    )
  }

  if (isOrgLoading && !org) {
    return (
      <div className="flex h-96 items-center justify-center">
        <HugeiconsIcon icon={Loading01Icon} className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Organization name cannot be empty")
      return
    }

    try {
      const payload: UpdateOrgPayload = {
        organization: {
          name: name.trim(),
          description: description.trim() || undefined,
          organizer_type: organizerType as any,
          category: category || undefined,
          contact_phone: contactPhone ? normalizeEthiopianPhone(contactPhone) : undefined,
          contact_email: contactEmail.trim() || undefined,
          website_url: websiteUrl.trim() || undefined,
        },
      }

      await updateOrg({ id: activeOrgId, body: payload }).unwrap()
      toast.success("General information updated successfully")
      refetchFullOrg()
      refetchOrganizations()
    } catch (err: any) {
      toast.error("Failed to update general information", {
        description: err?.data?.message || err?.data?.error || "An error occurred",
      })
    }
  }

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload: UpdateOrgPayload = {
        organization: {
          address_line1: addressLine1.trim() || undefined,
          address_line2: addressLine2.trim() || undefined,
          city: city.trim() || undefined,
          region: region.trim() || undefined,
          estimated_audience: estimatedAudience || undefined,
          event_frequency: eventFrequency || undefined,
        },
      }

      await updateOrg({ id: activeOrgId, body: payload }).unwrap()
      toast.success("Location and scale details updated")
      refetchFullOrg()
      refetchOrganizations()
    } catch (err: any) {
      toast.error("Failed to update location details", {
        description: err?.data?.message || err?.data?.error || "An error occurred",
      })
    }
  }

  const handleSaveSocials = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const social_links: Record<string, string> = {}
      if (socialTwitter.trim()) social_links.twitter = socialTwitter.trim()
      if (socialInstagram.trim()) social_links.instagram = socialInstagram.trim()
      if (socialFacebook.trim()) social_links.facebook = socialFacebook.trim()
      if (socialTelegram.trim()) social_links.telegram = socialTelegram.trim()
      if (socialLinkedin.trim()) social_links.linkedin = socialLinkedin.trim()

      await updateOrg({ id: activeOrgId, body: { organization: { social_links } } }).unwrap()
      toast.success("Social links updated")
      refetchFullOrg()
    } catch (err: any) {
      toast.error("Failed to update social links", {
        description: err?.data?.message || err?.data?.error || "An error occurred",
      })
    }
  }

  const handleSaveTin = async () => {
    if (!tinNumber.trim()) {
      toast.error("Please enter a valid TIN number")
      return
    }

    try {
      await updateOrg({
        id: activeOrgId,
        body: { organization: { tin_number: tinNumber.trim() } },
      }).unwrap()
      toast.success("TIN number saved")
      refetchFullOrg()
    } catch (err: any) {
      toast.error("Failed to save TIN number", {
        description: err?.data?.message || err?.data?.error || "An error occurred",
      })
    }
  }

  const handleUploadMedia = async () => {
    if (!profileFile && !bannerFile) {
      toast.info("Select a logo or banner image to upload")
      return
    }

    try {
      const formData = new FormData()
      if (profileFile) formData.append("profile", profileFile)
      if (bannerFile) formData.append("banner", bannerFile)

      await uploadDocs({ id: activeOrgId, formData }).unwrap()
      toast.success("Branding media uploaded successfully")
      setProfileFile(null)
      setBannerFile(null)
      refetchFullOrg()
      refetchOrganizations()
    } catch (err: any) {
      toast.error("Failed to upload brand media", {
        description: err?.data?.message || err?.data?.error || "An error occurred",
      })
    }
  }

  const handleUploadComplianceDocuments = async () => {
    if (!licenseFile && !tinFile) {
      toast.info("Select a business license or TIN certificate to upload")
      return
    }

    try {
      const formData = new FormData()
      if (licenseFile) formData.append("business_license", licenseFile)
      if (tinFile) formData.append("tin_certificate", tinFile)

      await uploadDocs({ id: activeOrgId, formData }).unwrap()
      toast.success("Compliance documents uploaded successfully")
      setLicenseFile(null)
      setTinFile(null)
      refetchFullOrg()
    } catch (err: any) {
      toast.error("Failed to upload compliance documents", {
        description: err?.data?.message || err?.data?.error || "An error occurred",
      })
    }
  }

  const handleSubmitVerification = async () => {
    try {
      await submitVerification(activeOrgId).unwrap()
      toast.success("Organization submitted for verification review!", {
        description: "Our compliance team will review your business documents within 24-48 hours.",
      })
      refetchFullOrg()
      refetchOrganizations()
    } catch (err: any) {
      toast.error("Verification submission failed", {
        description: err?.data?.message || err?.data?.error || "Ensure all required documents and TIN are provided.",
      })
    }
  }

  const handleResubmitVerification = async () => {
    try {
      await resubmitVerification(activeOrgId).unwrap()
      toast.success("Organization resubmitted for verification review!", {
        description: "Our compliance team will review your updated documents within 24-48 hours.",
      })
      refetchFullOrg()
      refetchOrganizations()
    } catch (err: any) {
      toast.error("Resubmission failed", {
        description: err?.data?.message || err?.data?.error || "Ensure all required documents and TIN are provided.",
      })
    }
  }

  const handleDownloadDocument = async (docType: string, docLabel: string) => {
    if (!activeOrgId) return
    setDownloadingDoc(docType)
    try {
      const token = getAccessToken()
      const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"
      const res = await fetch(`${baseUrl}/organizations/owner/${activeOrgId}/documents/${docType}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      if (!res.ok) {
        throw new Error(`Failed to download ${docLabel}. Document may not be uploaded yet.`)
      }
      const blob = await res.blob()
      const objectUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = objectUrl
      link.download = `${docType}.pdf`
      document.body.appendChild(link)
      link.click()
      window.URL.revokeObjectURL(objectUrl)
      document.body.removeChild(link)
      toast.success(`Downloaded ${docLabel}`)
    } catch (err: any) {
      toast.error(err.message || `Failed to download ${docLabel}`)
    } finally {
      setDownloadingDoc(null)
    }
  }

  // Verification Checklist calculation
  const hasName = Boolean(org?.name)
  const hasTin = Boolean(org?.tin_number)
  const hasContact = Boolean(org?.contact_email || org?.contact_phone)
  const isVerified = Boolean(org?.verified)

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 pb-12">
      {/* Organization Banner & Header Card */}
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs">
        <div className="relative h-40 sm:h-52 bg-muted/40 w-full overflow-hidden">
          {bannerPreview ? (
            <img
              src={bannerPreview}
              alt="Organization Banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-lime-500/20 via-emerald-500/10 to-teal-500/20" />
          )}
        </div>

        <div className="relative px-6 pb-6 pt-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between -mt-12 sm:-mt-16">
            <div className="flex items-end gap-4">
              <div className="size-24 sm:size-28 shrink-0 rounded-2xl border-4 border-card bg-card text-2xl font-bold text-foreground shadow-md overflow-hidden flex items-center justify-center">
                {profilePreview ? (
                  <img
                    src={profilePreview}
                    alt={org?.name || "Logo"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  org?.name?.slice(0, 2).toUpperCase() || "OR"
                )}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                    {org?.name || "Organization"}
                  </h1>
                  {isVerified ? (
                    <Badge variant="outline" className="border-lime-500/30 bg-lime-500/10 text-lime-600 dark:text-lime-400 gap-1 font-semibold">
                      <HugeiconsIcon icon={CheckmarkBadge01Icon} className="size-3.5" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1 font-semibold">
                      <HugeiconsIcon icon={AlertCircleIcon} className="size-3.5" />
                      Unverified
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground capitalize">
                  {org?.organizer_type || "organization"} • {org?.category || "general"}
                  {org?.city && ` • ${org.city}`}
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground border-t sm:border-t-0 pt-3 sm:pt-0">
              <div className="flex items-center gap-1.5">
                <HugeiconsIcon icon={Calendar03Icon} className="size-4 text-lime-600 dark:text-lime-400" />
                <span>
                  <strong className="text-foreground">{org?.events_count ?? 0}</strong> Events
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <HugeiconsIcon icon={UserGroupIcon} className="size-4 text-lime-600 dark:text-lime-400" />
                <span>
                  <strong className="text-foreground">{org?.follower_count ?? 0}</strong> Followers
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <PageTabs
        defaultValue="general"
        className="w-full space-y-6"
        tabs={[
          { value: "general", label: "General Info", icon: Building02Icon },
          { value: "location", label: "Location & Scale", icon: Location01Icon },
          { value: "branding", label: "Branding", icon: Image01Icon },
          {
            value: "verification",
            label: "Verification",
            icon: FileValidationIcon,
            indicator: !isVerified,
          },
          { value: "commercial", label: "Commercial Terms", icon: Coins01Icon },
          { value: "socials", label: "Social Links", icon: Link01Icon },
        ]}
      >

        {/* ─── TAB 1: GENERAL ─── */}
        <TabsContent value="general" className="space-y-6">
          <form onSubmit={handleSaveGeneral} className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs space-y-5">
            <div>
              <h3 className="text-base font-semibold text-foreground">General Information</h3>
              <p className="text-xs text-muted-foreground">
                Official profile details visible on tickets, receipts, and event pages.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="org-name" className="text-sm font-medium">
                  Organization Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="org-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Acme Productions"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="org-desc" className="text-sm font-medium">
                  Description / Bio
                </Label>
                <textarea
                  id="org-desc"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe what your organization does and what events you host..."
                  className="flex min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="org-type" className="text-sm font-medium">
                    Organizer Entity Type
                  </Label>
                  <select
                    id="org-type"
                    value={organizerType}
                    onChange={(e) => setOrganizerType(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="company" className="bg-card text-foreground">Company / Registered Business</option>
                    <option value="individual" className="bg-card text-foreground">Individual / Creator</option>
                    <option value="ngo" className="bg-card text-foreground">Non-Profit / NGO</option>
                    <option value="government" className="bg-card text-foreground">Government Entity</option>
                    <option value="collective" className="bg-card text-foreground">Collective / Association</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="org-category" className="text-sm font-medium">
                    Primary Event Category
                  </Label>
                  <select
                    id="org-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs capitalize focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="bg-card text-foreground capitalize">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="org-phone" className="text-sm font-medium">
                    Official Contact Phone
                  </Label>
                  <PhoneInput
                    id="org-phone"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="91 123 4567"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="org-email" className="text-sm font-medium">
                    Official Contact Email
                  </Label>
                  <Input
                    id="org-email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="contact@organization.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="org-website" className="text-sm font-medium">
                  Website URL
                </Label>
                <Input
                  id="org-website"
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://www.yourorganization.com"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border/50">
              <Button
                type="submit"
                disabled={isUpdating}
                className="gap-2 shadow-xs"
              >
                {isUpdating ? (
                  <HugeiconsIcon icon={Loading01Icon} className="size-4 animate-spin" />
                ) : (
                  <HugeiconsIcon icon={FloppyDiskIcon} className="size-4" />
                )}
                Save Changes
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* ─── TAB 2: LOCATION & SCALE ─── */}
        <TabsContent value="location" className="space-y-6">
          <form onSubmit={handleSaveLocation} className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs space-y-5">
            <div>
              <h3 className="text-base font-semibold text-foreground">Location & Scale</h3>
              <p className="text-xs text-muted-foreground">
                Your registered operational jurisdiction and expected event audience scale.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="org-city" className="text-sm font-medium">
                    City
                  </Label>
                  <Input
                    id="org-city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Addis Ababa"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="org-region" className="text-sm font-medium">
                    Region / State
                  </Label>
                  <Input
                    id="org-region"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="Addis Ababa / Oromia / Amhara..."
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="org-addr1" className="text-sm font-medium">
                  Address Line 1
                </Label>
                <Input
                  id="org-addr1"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="Street name, building, floor, office number"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="org-addr2" className="text-sm font-medium">
                  Address Line 2 (Optional)
                </Label>
                <Input
                  id="org-addr2"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  placeholder="Subcity, Woreda, Landmark"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="org-audience" className="text-sm font-medium">
                    Estimated Audience Size
                  </Label>
                  <select
                    id="org-audience"
                    value={estimatedAudience}
                    onChange={(e) => setEstimatedAudience(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="" className="bg-card text-foreground">Select audience size...</option>
                    {AUDIENCE_SIZES.map((aud) => (
                      <option key={aud.value} value={aud.value} className="bg-card text-foreground">
                        {aud.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="org-freq" className="text-sm font-medium">
                    Event Frequency
                  </Label>
                  <select
                    id="org-freq"
                    value={eventFrequency}
                    onChange={(e) => setEventFrequency(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="" className="bg-card text-foreground">Select frequency...</option>
                    {FREQUENCIES.map((freq) => (
                      <option key={freq.value} value={freq.value} className="bg-card text-foreground">
                        {freq.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border/50">
              <Button
                type="submit"
                disabled={isUpdating}
                className="gap-2 shadow-xs"
              >
                {isUpdating ? (
                  <HugeiconsIcon icon={Loading01Icon} className="size-4 animate-spin" />
                ) : (
                  <HugeiconsIcon icon={FloppyDiskIcon} className="size-4" />
                )}
                Save Location & Scale
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* ─── TAB 3: BRANDING ─── */}
        <TabsContent value="branding" className="space-y-6">
          <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-semibold text-foreground">Brand Assets</h3>
              <p className="text-xs text-muted-foreground">
                Upload your official logo and banner image. These will be displayed on all your public events.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Profile Logo Card */}
              <div className="rounded-xl border border-border/70 bg-muted/20 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">
                    Logo / Profile Avatar
                  </Label>
                  {profileFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setProfileFile(null)
                        setProfilePreview(org?.profile_url || "")
                      }}
                      className="text-xs text-destructive hover:underline flex items-center gap-1"
                    >
                      <HugeiconsIcon icon={Cancel01Icon} className="size-3" /> Reset
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="size-20 rounded-2xl border-2 border-border bg-card flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                    {profilePreview ? (
                      <img src={profilePreview} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <HugeiconsIcon icon={Building02Icon} className="size-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <input
                      id="upload-profile-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setProfileFile(file)
                          setProfilePreview(URL.createObjectURL(file))
                        }
                      }}
                    />
                    <Label
                      htmlFor="upload-profile-input"
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-input bg-card px-3 text-xs font-medium shadow-xs hover:bg-muted cursor-pointer transition-colors"
                    >
                      <HugeiconsIcon icon={Upload01Icon} className="size-3.5" />
                      {profileFile ? "Change File" : "Choose New Logo"}
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      PNG, JPG, or WebP. Square (min 400×400px).
                    </p>
                  </div>
                </div>
              </div>

              {/* Banner Card */}
              <div className="rounded-xl border border-border/70 bg-muted/20 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">
                    Cover Banner
                  </Label>
                  {bannerFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setBannerFile(null)
                        setBannerPreview(org?.banner_url || "")
                      }}
                      className="text-xs text-destructive hover:underline flex items-center gap-1"
                    >
                      <HugeiconsIcon icon={Cancel01Icon} className="size-3" /> Reset
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="h-20 w-full rounded-xl border-2 border-border bg-card flex items-center justify-center overflow-hidden shadow-xs">
                    {bannerPreview ? (
                      <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-muted-foreground">No banner set</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <input
                      id="upload-banner-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setBannerFile(file)
                          setBannerPreview(URL.createObjectURL(file))
                        }
                      }}
                    />
                    <Label
                      htmlFor="upload-banner-input"
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-input bg-card px-3 text-xs font-medium shadow-xs hover:bg-muted cursor-pointer transition-colors"
                    >
                      <HugeiconsIcon icon={Upload01Icon} className="size-3.5" />
                      {bannerFile ? "Change File" : "Choose New Banner"}
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Recommended: 1200×400px
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border/50">
              <Button
                onClick={handleUploadMedia}
                disabled={(!profileFile && !bannerFile) || isUploadingDocs}
                className="gap-2 shadow-xs"
              >
                {isUploadingDocs ? (
                  <HugeiconsIcon icon={Loading01Icon} className="size-4 animate-spin" />
                ) : (
                  <HugeiconsIcon icon={Upload01Icon} className="size-4" />
                )}
                Upload Branding Assets
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ─── TAB 4: VERIFICATION ─── */}
        <TabsContent value="verification" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Form & Documents */}
            <div className="space-y-6 lg:col-span-2">
              {/* TIN & Legal Info */}
              <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Tax Identification (TIN)</h3>
                  <p className="text-xs text-muted-foreground">
                    Required for legal compliance and event ticketing payouts in Ethiopia.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Input
                      id="org-tin"
                      value={tinNumber}
                      onChange={(e) => setTinNumber(e.target.value)}
                      placeholder="10-digit TIN Number (e.g. 0012345678)"
                      maxLength={15}
                      className="font-mono text-sm"
                    />
                  </div>
                  <Button
                    onClick={handleSaveTin}
                    disabled={isUpdating}
                    variant="outline"
                    className="text-xs font-semibold shrink-0"
                  >
                    Save TIN
                  </Button>
                </div>
              </div>

              {/* Compliance Documents Upload */}
              <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs space-y-5">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Compliance Documents</h3>
                  <p className="text-xs text-muted-foreground">
                    Upload official PDF or image documents for organization verification.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Business License */}
                  <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs font-semibold uppercase text-muted-foreground">
                          Business License / Registration
                        </Label>
                        {org?.has_business_license && (
                          <Badge variant="outline" className="border-lime-500/30 text-lime-600 dark:text-lime-400 text-[10px] gap-1 py-0">
                            <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-2.5" /> On File
                          </Badge>
                        )}
                      </div>
                      {licenseFile && (
                        <button
                          type="button"
                          onClick={() => setLicenseFile(null)}
                          className="text-xs text-destructive hover:underline"
                        >
                          Remove New
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="size-10 rounded-lg bg-card border border-border flex items-center justify-center text-muted-foreground shrink-0">
                          <HugeiconsIcon icon={File01Icon} className="size-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">
                            {licenseFile ? licenseFile.name : org?.has_business_license ? "business_license (active on file)" : "business_license.pdf / image"}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {licenseFile
                              ? `${(licenseFile.size / 1024).toFixed(1)} KB (ready to upload)`
                              : org?.has_business_license
                              ? "Valid commercial registration certificate uploaded"
                              : "Upload valid commercial registration certificate"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {org?.has_business_license && (
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={() => handleDownloadDocument("business_license", "Business License")}
                            disabled={downloadingDoc === "business_license"}
                            className="h-8 gap-1.5 text-xs font-medium"
                          >
                            <HugeiconsIcon
                              icon={downloadingDoc === "business_license" ? Loading01Icon : Download01Icon}
                              className={`size-3.5 ${downloadingDoc === "business_license" ? "animate-spin" : ""}`}
                            />
                            Download
                          </Button>
                        )}

                        <input
                          id="license-file-input"
                          type="file"
                          accept=".pdf,image/*"
                          className="hidden"
                          onChange={(e) => setLicenseFile(e.target.files?.[0] || null)}
                        />
                        <Label
                          htmlFor="license-file-input"
                          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-input bg-card px-3 text-xs font-medium shadow-xs hover:bg-muted cursor-pointer transition-colors"
                        >
                          <HugeiconsIcon icon={Upload01Icon} className="size-3" />
                          {licenseFile ? "Replace Selection" : org?.has_business_license ? "Upload Replacement" : "Select File"}
                        </Label>
                      </div>
                    </div>
                  </div>

                  {/* TIN Certificate */}
                  <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs font-semibold uppercase text-muted-foreground">
                          TIN Certificate
                        </Label>
                        {org?.has_tin_certificate && (
                          <Badge variant="outline" className="border-lime-500/30 text-lime-600 dark:text-lime-400 text-[10px] gap-1 py-0">
                            <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-2.5" /> On File
                          </Badge>
                        )}
                      </div>
                      {tinFile && (
                        <button
                          type="button"
                          onClick={() => setTinFile(null)}
                          className="text-xs text-destructive hover:underline"
                        >
                          Remove New
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="size-10 rounded-lg bg-card border border-border flex items-center justify-center text-muted-foreground shrink-0">
                          <HugeiconsIcon icon={File01Icon} className="size-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">
                            {tinFile ? tinFile.name : org?.has_tin_certificate ? "tin_certificate (active on file)" : "tin_certificate.pdf / image"}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {tinFile
                              ? `${(tinFile.size / 1024).toFixed(1)} KB (ready to upload)`
                              : org?.has_tin_certificate
                              ? "Ministry of Revenues TIN certificate uploaded"
                              : "Upload TIN registration document issued by Ministry of Revenues"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {org?.has_tin_certificate && (
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={() => handleDownloadDocument("tin_certificate", "TIN Certificate")}
                            disabled={downloadingDoc === "tin_certificate"}
                            className="h-8 gap-1.5 text-xs font-medium"
                          >
                            <HugeiconsIcon
                              icon={downloadingDoc === "tin_certificate" ? Loading01Icon : Download01Icon}
                              className={`size-3.5 ${downloadingDoc === "tin_certificate" ? "animate-spin" : ""}`}
                            />
                            Download
                          </Button>
                        )}

                        <input
                          id="tin-file-input"
                          type="file"
                          accept=".pdf,image/*"
                          className="hidden"
                          onChange={(e) => setTinFile(e.target.files?.[0] || null)}
                        />
                        <Label
                          htmlFor="tin-file-input"
                          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-input bg-card px-3 text-xs font-medium shadow-xs hover:bg-muted cursor-pointer transition-colors"
                        >
                          <HugeiconsIcon icon={Upload01Icon} className="size-3" />
                          {tinFile ? "Replace Selection" : org?.has_tin_certificate ? "Upload Replacement" : "Select File"}
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-border/50">
                  <Button
                    onClick={handleUploadComplianceDocuments}
                    disabled={(!licenseFile && !tinFile) || isUploadingDocs}
                    className="gap-2 text-xs shadow-xs"
                  >
                    {isUploadingDocs ? (
                      <HugeiconsIcon icon={Loading01Icon} className="size-4 animate-spin" />
                    ) : (
                      <HugeiconsIcon icon={Upload01Icon} className="size-4" />
                    )}
                    Upload Compliance Documents
                  </Button>
                </div>
              </div>
            </div>

            {/* Right 1 Col: Status & Submission Checklist */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs space-y-5">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <HugeiconsIcon icon={FileValidationIcon} className="size-4.5 text-lime-600 dark:text-lime-400" />
                    Verification Status
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Required to publish events and receive ticket sales payouts.
                  </p>
                </div>

                {/* Status Banners */}
                {(() => {
                  const vStatus = org?.verification_status || (org?.verified ? "approved" : "draft")
                  const vFeedback = org?.verification_feedback as Record<string, any> | null
                  const feedbackMsg = vFeedback?.message || vFeedback?.reason || vFeedback?.feedback || (typeof vFeedback === "string" ? vFeedback : null)

                  if (vStatus === "approved" || isVerified) {
                    return (
                      <div className="p-4 rounded-xl border border-lime-500/40 bg-lime-500/10 text-lime-700 dark:text-lime-300 space-y-1.5">
                        <div className="flex items-center gap-2 font-bold text-sm">
                          <HugeiconsIcon icon={CheckmarkBadge01Icon} className="size-4.5 shrink-0" />
                          <span>Verified Organization</span>
                        </div>
                        <p className="text-xs leading-relaxed opacity-90">
                          Your organization is verified and in full compliance. You can publish live events, process ticket sales, and request financial settlements.
                        </p>
                      </div>
                    )
                  }

                  if (vStatus === "pending") {
                    return (
                      <div className="p-4 rounded-xl border border-sky-500/40 bg-sky-500/10 text-sky-800 dark:text-sky-300 space-y-1.5">
                        <div className="flex items-center gap-2 font-bold text-sm">
                          <HugeiconsIcon icon={Clock01Icon} className="size-4.5 shrink-0" />
                          <span>Review In Progress</span>
                        </div>
                        <p className="text-xs leading-relaxed opacity-90">
                          Your verification submission is actively queued for review by our compliance team. Verification is typically completed within 24-48 business hours.
                        </p>
                      </div>
                    )
                  }

                  if (vStatus === "modify") {
                    return (
                      <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300 space-y-2">
                        <div className="flex items-center gap-2 font-bold text-sm">
                          <HugeiconsIcon icon={AlertCircleIcon} className="size-4.5 shrink-0" />
                          <span>Action Required: Modifications Requested</span>
                        </div>
                        <p className="text-xs leading-relaxed opacity-90">
                          Our compliance team reviewed your submission and requested adjustments before approval can be granted.
                        </p>
                        {feedbackMsg && (
                          <div className="rounded-lg bg-background/80 p-2.5 text-xs text-foreground font-medium border border-amber-500/30">
                            <strong>Compliance Note:</strong> {feedbackMsg}
                          </div>
                        )}
                      </div>
                    )
                  }

                  if (vStatus === "rejected") {
                    return (
                      <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-800 dark:text-rose-300 space-y-2">
                        <div className="flex items-center gap-2 font-bold text-sm">
                          <HugeiconsIcon icon={AlertCircleIcon} className="size-4.5 shrink-0" />
                          <span>Verification Rejected</span>
                        </div>
                        <p className="text-xs leading-relaxed opacity-90">
                          Your verification attempt was rejected. Please review the feedback, update your documents, and resubmit for reconsideration.
                        </p>
                        {feedbackMsg && (
                          <div className="rounded-lg bg-background/80 p-2.5 text-xs text-foreground font-medium border border-rose-500/30">
                            <strong>Reason:</strong> {feedbackMsg}
                          </div>
                        )}
                      </div>
                    )
                  }

                  return (
                    <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 space-y-1.5">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <HugeiconsIcon icon={AlertCircleIcon} className="size-4.5 shrink-0" />
                        <span>Unverified Organization</span>
                      </div>
                      <p className="text-xs leading-relaxed opacity-90">
                        Complete the checklist below and submit your documents for compliance review to unlock live event sales and payouts.
                      </p>
                    </div>
                  )
                })()}

                {/* Checklist */}
                <div className="space-y-2.5 pt-2">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">
                    Requirements Checklist
                  </span>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon
                        icon={hasName ? CheckmarkCircle01Icon : AlertCircleIcon}
                        className={`size-4 ${hasName ? "text-lime-600 dark:text-lime-400" : "text-muted-foreground"}`}
                      />
                      <span>Organization Name & Bio</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <HugeiconsIcon
                        icon={hasContact ? CheckmarkCircle01Icon : AlertCircleIcon}
                        className={`size-4 ${hasContact ? "text-lime-600 dark:text-lime-400" : "text-muted-foreground"}`}
                      />
                      <span>Official Contact Information</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <HugeiconsIcon
                        icon={hasTin ? CheckmarkCircle01Icon : AlertCircleIcon}
                        className={`size-4 ${hasTin ? "text-lime-600 dark:text-lime-400" : "text-muted-foreground"}`}
                      />
                      <span>Tax Identification (TIN)</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <HugeiconsIcon
                        icon={org?.profile_url ? CheckmarkCircle01Icon : AlertCircleIcon}
                        className={`size-4 ${org?.profile_url ? "text-lime-600 dark:text-lime-400" : "text-muted-foreground"}`}
                      />
                      <span>Profile Logo & Banner</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <HugeiconsIcon
                        icon={(org?.has_business_license || licenseFile) ? CheckmarkCircle01Icon : AlertCircleIcon}
                        className={`size-4 ${(org?.has_business_license || licenseFile) ? "text-lime-600 dark:text-lime-400" : "text-muted-foreground"}`}
                      />
                      <span>Business License Document</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <HugeiconsIcon
                        icon={(org?.has_tin_certificate || tinFile) ? CheckmarkCircle01Icon : AlertCircleIcon}
                        className={`size-4 ${(org?.has_tin_certificate || tinFile) ? "text-lime-600 dark:text-lime-400" : "text-muted-foreground"}`}
                      />
                      <span>TIN Certificate Document</span>
                    </div>
                  </div>
                </div>

                {!isVerified && (
                  <div className="pt-3">
                    {(() => {
                      const vStatus = org?.verification_status || "draft"
                      const isPending = vStatus === "pending"
                      const isResubmission = vStatus === "rejected" || vStatus === "modify"

                      if (isPending) {
                        return (
                          <Button disabled className="w-full gap-1.5 shadow-xs opacity-75">
                            <HugeiconsIcon icon={Clock01Icon} className="size-4" />
                            Submitted — Review Pending
                          </Button>
                        )
                      }

                      if (isResubmission) {
                        return (
                          <Button
                            onClick={handleResubmitVerification}
                            disabled={isResubmittingVerification}
                            className="w-full gap-1.5 shadow-xs bg-amber-600 hover:bg-amber-700 text-white"
                          >
                            {isResubmittingVerification ? (
                              <HugeiconsIcon icon={Loading01Icon} className="size-4 animate-spin" />
                            ) : (
                              <HugeiconsIcon icon={CheckmarkBadge01Icon} className="size-4" />
                            )}
                            Resubmit for Verification
                          </Button>
                        )
                      }

                      return (
                        <Button
                          onClick={handleSubmitVerification}
                          disabled={isSubmittingVerification}
                          className="w-full gap-1.5 shadow-xs"
                        >
                          {isSubmittingVerification ? (
                            <HugeiconsIcon icon={Loading01Icon} className="size-4 animate-spin" />
                          ) : (
                            <HugeiconsIcon icon={CheckmarkBadge01Icon} className="size-4" />
                          )}
                          Submit for Verification
                        </Button>
                      )
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ─── TAB 5: SOCIALS ─── */}
        <TabsContent value="socials" className="space-y-6">
          <form onSubmit={handleSaveSocials} className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs space-y-5">
            <div>
              <h3 className="text-base font-semibold text-foreground">Social & Community Links</h3>
              <p className="text-xs text-muted-foreground">
                Connect your social media handles and community channels.
              </p>
            </div>

            <div className="space-y-4 max-w-xl">
              <div className="space-y-1.5">
                <Label htmlFor="soc-twitter" className="text-sm font-medium flex items-center gap-2">
                  <HugeiconsIcon icon={Link01Icon} className="size-3.5 text-muted-foreground" />
                  Twitter / X
                </Label>
                <Input
                  id="soc-twitter"
                  value={socialTwitter}
                  onChange={(e) => setSocialTwitter(e.target.value)}
                  placeholder="https://x.com/yourhandle"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="soc-instagram" className="text-sm font-medium flex items-center gap-2">
                  <HugeiconsIcon icon={Link01Icon} className="size-3.5 text-muted-foreground" />
                  Instagram
                </Label>
                <Input
                  id="soc-instagram"
                  value={socialInstagram}
                  onChange={(e) => setSocialInstagram(e.target.value)}
                  placeholder="https://instagram.com/yourhandle"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="soc-facebook" className="text-sm font-medium flex items-center gap-2">
                  <HugeiconsIcon icon={Link01Icon} className="size-3.5 text-muted-foreground" />
                  Facebook
                </Label>
                <Input
                  id="soc-facebook"
                  value={socialFacebook}
                  onChange={(e) => setSocialFacebook(e.target.value)}
                  placeholder="https://facebook.com/yourpage"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="soc-telegram" className="text-sm font-medium flex items-center gap-2">
                  <HugeiconsIcon icon={Link01Icon} className="size-3.5 text-muted-foreground" />
                  Telegram Channel / Group
                </Label>
                <Input
                  id="soc-telegram"
                  value={socialTelegram}
                  onChange={(e) => setSocialTelegram(e.target.value)}
                  placeholder="https://t.me/yourchannel"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="soc-linkedin" className="text-sm font-medium flex items-center gap-2">
                  <HugeiconsIcon icon={Link01Icon} className="size-3.5 text-muted-foreground" />
                  LinkedIn
                </Label>
                <Input
                  id="soc-linkedin"
                  value={socialLinkedin}
                  onChange={(e) => setSocialLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/company/yourorg"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border/50">
              <Button
                type="submit"
                disabled={isUpdating}
                className="gap-2 bg-lime-500 text-zinc-950 hover:bg-lime-400 font-semibold"
              >
                {isUpdating ? (
                  <HugeiconsIcon icon={Loading01Icon} className="size-4 animate-spin" />
                ) : (
                  <HugeiconsIcon icon={FloppyDiskIcon} className="size-4" />
                )}
                Save Social Links
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* ─── TAB 6: COMMERCIAL TERMS ─── */}
        <TabsContent value="commercial" className="space-y-6">
          {activeOrgId && <CommercialTermsCard organizationId={activeOrgId} />}
        </TabsContent>
      </PageTabs>
    </div>
  )
}
