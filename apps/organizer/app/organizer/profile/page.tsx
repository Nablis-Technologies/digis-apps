"use client"

import * as React from "react"
import {
  useGetMeQuery,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
  useRemoveAvatarMutation,
  useLogoutMutation,
  type AuthUser,
} from "@workspace/store/reducers/authApi"
import { useListOwnerOrganizationsQuery } from "@workspace/store/reducers/organizationsApi"
import { useActiveOrganization } from "../../../providers/organization-provider"
import { CreateOrgDialog } from "../../../components/organizations/create-org-dialog"
import { Button } from "@/components/ui/button"
import { Badge, RoleBadge, VerificationBadge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { UserAvatar } from "@workspace/ui/components/admin/user-avatar"
import { generateIdempotencyKey } from "@workspace/store/api"
import { toast } from "sonner"
import { cn } from "@workspace/ui/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  UserCircleIcon,
  Copy01Icon,
  CheckmarkCircle01Icon,
  Building02Icon,
  Shield01Icon,
  Logout01Icon,
  PlusSignIcon,
  Mail01Icon,
  SmartPhone01Icon,
  Calendar03Icon,
  Loading01Icon,
  ArrowRight01Icon,
  Key01Icon,
  RefreshIcon,
  Exchange01Icon,
  AlertCircleIcon,
  Camera01Icon,
  Delete02Icon,
  UserIcon,
} from "@hugeicons/core-free-icons"
import Link from "next/link"

export default function ProfilePage() {
  const { data: meData, isLoading: meLoading, refetch: refetchMe } = useGetMeQuery()
  const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateProfileMutation()
  const [uploadAvatar, { isLoading: isUploadingAvatar }] = useUploadAvatarMutation()
  const [removeAvatar, { isLoading: isRemovingAvatar }] = useRemoveAvatarMutation()
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation()

  const { activeOrg, activeOrgId, setActiveOrgId } = useActiveOrganization()
  const { data: orgsData, isLoading: orgsLoading } = useListOwnerOrganizationsQuery({ per_page: 50 })

  const [copiedId, setCopiedId] = React.useState(false)
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)

  // Profile names editing state
  const [firstName, setFirstName] = React.useState("")
  const [lastName, setLastName] = React.useState("")
  const [nameErrors, setNameErrors] = React.useState<{ first_name?: string; last_name?: string } | null>(null)

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const user: AuthUser | undefined = meData?.data?.user
  const organizations = orgsData?.data ?? []

  // Initialize form when user profile is loaded
  React.useEffect(() => {
    if (user?.profile) {
      setFirstName(user.profile.first_name || "")
      setLastName(user.profile.last_name || "")
    }
  }, [user?.profile?.first_name, user?.profile?.last_name])

  const hasCompletedProfile = Boolean(user?.profile?.first_name && user?.profile?.last_name)

  const handleCopyId = () => {
    if (!user?.id) return
    navigator.clipboard.writeText(user.id)
    setCopiedId(true)
    toast.success("User ID copied to clipboard", {
      description: "You can share this ID with other organizations to be invited as a team member.",
    })
    setTimeout(() => setCopiedId(false), 2000)
  }

  const handleSaveNames = async (e: React.FormEvent) => {
    e.preventDefault()
    setNameErrors(null)

    const trimmedFirst = firstName.trim()
    const trimmedLast = lastName.trim()

    const errors: { first_name?: string; last_name?: string } = {}
    if (!trimmedFirst) {
      errors.first_name = "First name is required (supports Unicode/Amharic)"
    } else if (trimmedFirst.length > 100) {
      errors.first_name = "First name must be 100 characters or fewer"
    }

    if (!trimmedLast) {
      errors.last_name = "Last name is required (supports Unicode/Amharic)"
    } else if (trimmedLast.length > 100) {
      errors.last_name = "Last name must be 100 characters or fewer"
    }

    if (Object.keys(errors).length > 0) {
      setNameErrors(errors)
      return
    }

    try {
      const res = await updateProfile({
        profile: {
          first_name: trimmedFirst,
          last_name: trimmedLast,
        },
        idempotencyKey: generateIdempotencyKey(),
      }).unwrap()

      toast.success("Profile names updated successfully", {
        description: res.data?.profile?.full_name
          ? `Display name updated to "${res.data.profile.full_name}"`
          : undefined,
      })
    } catch (err: any) {
      const errorMsg =
        err?.data?.message ||
        err?.data?.error ||
        "Failed to update profile names. Please check your connection."
      toast.error("Profile update failed", { description: errorMsg })
    }
  }

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Clear input so selecting the same file again triggers change
    e.target.value = ""

    if (!hasCompletedProfile) {
      toast.error("Profile required", {
        description: "Please complete your first and last name before uploading an avatar.",
      })
      return
    }

    // Validate size (max 5 MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Avatar file too large", {
        description: "Avatar image must be smaller than 5 MB.",
      })
      return
    }

    // Validate MIME type (JPEG, PNG, WebP)
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid avatar format", {
        description: "Supported formats are JPEG, PNG, or WebP.",
      })
      return
    }

    try {
      await uploadAvatar({
        file,
        idempotencyKey: generateIdempotencyKey(),
      }).unwrap()
      toast.success("Avatar updated successfully")
    } catch (err: any) {
      const errorMsg =
        err?.data?.message ||
        err?.data?.error ||
        "Failed to upload avatar image."
      toast.error("Avatar upload failed", { description: errorMsg })
    }
  }

  const handleRemoveAvatar = async () => {
    try {
      await removeAvatar({
        idempotencyKey: generateIdempotencyKey(),
      }).unwrap()
      toast.success("Avatar removed successfully")
    } catch (err: any) {
      const errorMsg =
        err?.data?.message ||
        err?.data?.error ||
        "Failed to remove avatar."
      toast.error("Avatar removal failed", { description: errorMsg })
    }
  }

  const handleLogout = async () => {
    try {
      await logout().unwrap()
      toast.success("Logged out successfully")
      window.location.href = "/"
    } catch {
      window.location.href = "/"
    }
  }

  if (meLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <HugeiconsIcon icon={Loading01Icon} className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const computedDisplayName =
    user?.profile?.full_name ||
    (firstName && lastName ? `${firstName} ${lastName}`.trim() : null) ||
    user?.name ||
    user?.email?.split("@")[0] ||
    "Organizer"

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Personal Profile</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account identity, security credentials, and organization workspaces.
        </p>
      </div>

      {/* Legacy / Incomplete Profile Warning Callout */}
      {!hasCompletedProfile && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="size-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={AlertCircleIcon} className="size-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-amber-700 dark:text-amber-300">
                Complete Your Profile
              </h2>
              <p className="text-xs text-amber-900/80 dark:text-amber-200/80 leading-relaxed max-w-2xl">
                Your account is missing a verified first and last name. Setting your names is required
                to personalize your event credentials and enable avatar uploads.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const input = document.getElementById("firstName")
              input?.focus()
            }}
            className="border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 text-xs shrink-0"
          >
            Complete Names Below
          </Button>
        </div>
      )}

      {/* User Identity Card */}
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs">
        <div className="h-28 bg-gradient-to-r from-lime-500/20 via-emerald-500/15 to-teal-500/20" />
        <div className="relative px-6 pb-6 pt-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between -mt-12">
            <div className="flex items-end gap-4">
              <div className="relative group">
                <UserAvatar
                  user={user}
                  className="size-24 shrink-0 rounded-2xl border-4 border-card bg-muted text-2xl font-bold text-foreground shadow-md"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar || !hasCompletedProfile}
                  title={hasCompletedProfile ? "Change Avatar" : "Complete profile names first to upload avatar"}
                  className="absolute inset-0 rounded-2xl bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
                >
                  <HugeiconsIcon icon={Camera01Icon} className="size-5" />
                  <span className="text-[10px] font-medium mt-0.5">Change</span>
                </button>
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold text-foreground">
                    {computedDisplayName}
                  </h2>
                  <VerificationBadge
                    verified={Boolean(user?.verified_at)}
                    unverifiedLabel="Unverified"
                    className="h-6 px-2.5 text-xs font-semibold gap-1.5"
                  />
                </div>
                <p className="text-xs text-muted-foreground font-mono">{user?.email}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyId}
                className="gap-1.5 text-xs h-9"
              >
                <HugeiconsIcon
                  icon={copiedId ? CheckmarkCircle01Icon : Copy01Icon}
                  strokeWidth={2}
                  className={cn("size-3.5", copiedId ? "text-emerald-500" : "text-muted-foreground")}
                />
                {copiedId ? "ID Copied" : "Copy User ID"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchMe()}
                disabled={meLoading}
                className="gap-1.5 text-xs h-9"
              >
                <HugeiconsIcon
                  icon={RefreshIcon}
                  strokeWidth={2}
                  className={cn("size-3.5", meLoading && "animate-spin")}
                />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Details, Profile Editing & Organizations */}
        <div className="space-y-6 lg:col-span-2">
          {/* Profile Name & Identity Editing (PATCH /user) */}
          <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <HugeiconsIcon icon={UserIcon} className="size-4.5 text-lime-600 dark:text-lime-400" />
                  Personal Information & Names
                </h3>
                <p className="text-xs text-muted-foreground">
                  Update your legal or organizer names. Full Unicode and Ethiopian Ge&apos;ez script (e.g. አበበ ቢቂላ) are supported.
                </p>
              </div>
              {user?.profile?.full_name && (
                <Badge variant="secondary" className="text-xs font-mono">
                  {user.profile.full_name}
                </Badge>
              )}
            </div>

            <form onSubmit={handleSaveNames} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="firstName" className="text-xs font-semibold text-foreground">
                    First Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value)
                      if (nameErrors?.first_name) setNameErrors((prev) => ({ ...prev, first_name: undefined }))
                    }}
                    placeholder="Abebe / አበበ"
                    maxLength={100}
                    className="h-10 bg-background"
                  />
                  {nameErrors?.first_name && (
                    <p className="text-xs text-destructive">{nameErrors.first_name}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="lastName" className="text-xs font-semibold text-foreground">
                    Last Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value)
                      if (nameErrors?.last_name) setNameErrors((prev) => ({ ...prev, last_name: undefined }))
                    }}
                    placeholder="Bikila / ቢቂላ"
                    maxLength={100}
                    className="h-10 bg-background"
                  />
                  {nameErrors?.last_name && (
                    <p className="text-xs text-destructive">{nameErrors.last_name}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/40">
                <span className="text-xs text-muted-foreground">
                  Computed display name:{" "}
                  <strong className="text-foreground">
                    {firstName || lastName ? `${firstName} ${lastName}`.trim() : "—"}
                  </strong>
                </span>

                <Button
                  type="submit"
                  size="sm"
                  disabled={isUpdatingProfile}
                  className="gap-2 shadow-xs"
                >
                  <HugeiconsIcon
                    icon={isUpdatingProfile ? Loading01Icon : CheckmarkCircle01Icon}
                    className={cn("size-4", isUpdatingProfile && "animate-spin")}
                  />
                  {isUpdatingProfile ? "Saving Names..." : "Save Names"}
                </Button>
              </div>
            </form>
          </div>

          {/* Dedicated Avatar Management Card */}
          <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <HugeiconsIcon icon={Camera01Icon} className="size-4.5 text-lime-600 dark:text-lime-400" />
                  Profile Avatar
                </h3>
                <p className="text-xs text-muted-foreground">
                  Upload a personal picture (JPEG, PNG, or WebP; up to 5 MB). Avatars are stored privately and delivered with authenticated access.
                </p>
              </div>
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarFileChange}
              className="hidden"
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/50 bg-muted/20">
              <div className="flex items-center gap-4">
                <UserAvatar user={user} className="size-16 rounded-xl border border-border/60 shadow-xs" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-foreground">
                    {user?.profile?.avatar_url ? "Custom Avatar Active" : "Default Initials"}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {user?.profile?.avatar_url
                      ? "Your photo is visible to team members across your organizations."
                      : hasCompletedProfile
                      ? "No avatar uploaded yet. Click upload to set one."
                      : "Complete your profile first to unlock avatar uploads."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isUploadingAvatar || !hasCompletedProfile}
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-1.5 text-xs h-9"
                >
                  <HugeiconsIcon
                    icon={isUploadingAvatar ? Loading01Icon : Camera01Icon}
                    className={cn("size-3.5", isUploadingAvatar && "animate-spin")}
                  />
                  {isUploadingAvatar ? "Uploading..." : user?.profile?.avatar_url ? "Replace Avatar" : "Upload Avatar"}
                </Button>

                {user?.profile?.avatar_url && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isRemovingAvatar}
                    onClick={handleRemoveAvatar}
                    className="gap-1.5 text-xs h-9 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <HugeiconsIcon
                      icon={isRemovingAvatar ? Loading01Icon : Delete02Icon}
                      className={cn("size-3.5", isRemovingAvatar && "animate-spin")}
                    />
                    {isRemovingAvatar ? "Removing..." : "Remove"}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs space-y-4">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <HugeiconsIcon icon={UserCircleIcon} className="size-4.5 text-lime-600 dark:text-lime-400" />
              Account Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border/50 bg-muted/20 p-3.5 space-y-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <HugeiconsIcon icon={Mail01Icon} className="size-3.5" /> Email Address
                </span>
                <p className="text-sm font-semibold text-foreground break-all">{user?.email || "—"}</p>
              </div>

              <div className="rounded-xl border border-border/50 bg-muted/20 p-3.5 space-y-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <HugeiconsIcon icon={SmartPhone01Icon} className="size-3.5" /> Phone Number
                </span>
                <p className="text-sm font-semibold text-foreground font-mono">
                  {user?.phone ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span>🇪🇹</span>
                      <span>{user.phone}</span>
                    </span>
                  ) : (
                    "—"
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-border/50 bg-muted/20 p-3.5 space-y-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <HugeiconsIcon icon={Key01Icon} className="size-3.5" /> User UUID
                </span>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-mono text-foreground truncate">{user?.id || "—"}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={handleCopyId}
                    className="size-6 text-muted-foreground hover:text-foreground shrink-0"
                    title="Copy UUID"
                  >
                    <HugeiconsIcon
                      icon={copiedId ? CheckmarkCircle01Icon : Copy01Icon}
                      strokeWidth={2}
                      className={cn("size-3.5", copiedId && "text-emerald-500")}
                    />
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-border/50 bg-muted/20 p-3.5 space-y-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <HugeiconsIcon icon={Calendar03Icon} className="size-3.5" /> Member Since
                </span>
                <p className="text-sm font-semibold text-foreground">
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Associated Organizations */}
          <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <HugeiconsIcon icon={Building02Icon} className="size-4.5 text-lime-600 dark:text-lime-400" />
                  My Organizations
                </h3>
                <p className="text-xs text-muted-foreground">
                  Organizations where you have an active ownership or team membership.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setCreateDialogOpen(true)}
                className="gap-2 shadow-xs"
              >
                <HugeiconsIcon icon={PlusSignIcon} className="size-4" strokeWidth={2} />
                New Organization
              </Button>
            </div>

            {orgsLoading ? (
              <div className="flex h-32 items-center justify-center">
                <HugeiconsIcon icon={Loading01Icon} className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : organizations.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/80 p-8 text-center space-y-3">
                <div className="mx-auto size-12 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground">
                  <HugeiconsIcon icon={Building02Icon} className="size-6" />
                </div>
                <p className="text-sm font-medium">No organizations linked yet</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Create a new organization to start hosting events or ask an organization owner to invite you using your phone number.
                </p>
                <Button
                  size="sm"
                  onClick={() => setCreateDialogOpen(true)}
                  className="gap-2 shadow-xs"
                >
                  <HugeiconsIcon icon={PlusSignIcon} className="size-4" strokeWidth={2} />
                  Create Organization
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {organizations.map((org) => {
                  const isActive = org.id === activeOrgId
                  return (
                    <div
                      key={org.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border transition-colors ${
                        isActive
                          ? "border-primary/40 bg-primary/5"
                          : "border-border/60 bg-muted/10 hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-10 rounded-lg bg-card border border-border/70 flex items-center justify-center font-bold text-sm text-foreground shrink-0 overflow-hidden">
                          {org.profile_url ? (
                            <img src={org.profile_url} alt={org.name} className="w-full h-full object-cover" />
                          ) : (
                            org.name.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm truncate">{org.name}</span>
                            {isActive && (
                              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/35 text-[10px] font-semibold px-2 py-0.5 shadow-2xs">
                                Active Workspace
                              </Badge>
                            )}
                            {org.membership_role && (
                              <RoleBadge role={org.membership_role} className="text-[10px] px-1.5 py-0 h-4" />
                            )}
                            {org.archived ? (
                              <Badge variant="outline" className="border border-zinc-500/35 bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 text-[10px] px-1.5 py-0 shadow-2xs">
                                Archived
                              </Badge>
                            ) : org.membership_status === "suspended" ? (
                              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 shadow-2xs">
                                Suspended
                              </Badge>
                            ) : (
                              <VerificationBadge verified={Boolean(org.verified)} className="text-[10px] px-1.5 py-0 h-4" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground capitalize">
                            {org.organizer_type} • {org.category || "General"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {!isActive ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={org.archived}
                            onClick={() => {
                              if (org.archived) {
                                toast.error("Archived organizations cannot be entered.")
                                return
                              }
                              setActiveOrgId(org.id)
                              if (org.membership_status === "suspended") {
                                toast.warning(`Switched to ${org.name} (Suspended membership)`)
                              } else {
                                toast.success(`Switched active workspace to ${org.name}`)
                              }
                            }}
                            className="h-8 gap-1.5 text-xs font-medium"
                          >
                            <HugeiconsIcon icon={Exchange01Icon} strokeWidth={2} className="size-3.5 text-muted-foreground" />
                            {org.archived ? "Archived" : "Switch Workspace"}
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            asChild
                            className="h-8 gap-1.5 text-xs font-medium"
                          >
                            <Link href="/organizer/organization">
                              Manage
                              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-3.5" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Roles & Security */}
        <div className="space-y-6">
          {/* Account & Workspace Roles */}
          <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs space-y-4">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <HugeiconsIcon icon={Shield01Icon} className="size-4.5 text-lime-600 dark:text-lime-400" />
              Workspace Roles
            </h3>

            <div className="space-y-3">
              <div>
                <span className="text-xs text-muted-foreground">Active Workspace Role</span>
                <div className="mt-1">
                  <div className="flex items-center gap-2">
                    <RoleBadge role={activeOrg?.membership_role || "Member"} className="text-xs px-2.5 py-1 h-auto font-semibold" />
                    <span className="text-xs text-muted-foreground">({activeOrg?.name || "Active Workspace"})</span>
                  </div>
                </div>
              </div>

              {user?.roles && user.roles.length > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground">System Roles</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {user.roles.map((r, i) => (
                      <Badge key={i} variant="secondary" className="text-xs font-mono">
                        {r.name || r.code}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Account Security */}
          <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs space-y-4">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <HugeiconsIcon icon={Key01Icon} className="size-4.5 text-lime-600 dark:text-lime-400" />
              Account Session
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your active session is secured with JWT tokens. You can log out from this device anytime.
            </p>

            <div className="pt-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full gap-2 shadow-xs"
              >
                <HugeiconsIcon
                  icon={isLoggingOut ? Loading01Icon : Logout01Icon}
                  strokeWidth={2}
                  className={cn("size-4", isLoggingOut && "animate-spin")}
                />
                {isLoggingOut ? "Signing out..." : "Sign Out of Account"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Organization Dialog */}
      <CreateOrgDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  )
}
