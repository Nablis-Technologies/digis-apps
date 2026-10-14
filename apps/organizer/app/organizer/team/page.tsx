"use client"

import * as React from "react"
import { useActiveOrganization } from "../../../providers/organization-provider"
import { useGetMeQuery } from "@workspace/store/reducers/authApi"
import {
  useGetOwnerTeamRosterQuery,
  useCreateOwnerMembershipInvitationMutation,
  useResendOwnerMembershipInvitationMutation,
  useRevokeOwnerMembershipInvitationMutation,
  useUpdateOwnerMembershipMutation,
  useDeleteOwnerMembershipMutation,
  useSuspendOwnerMembershipMutation,
  useActivateOwnerMembershipMutation,
  type Membership,
  type MembershipInvitation,
  type MembershipRole,
} from "@workspace/store/reducers/membershipsApi"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PhoneInput, normalizeEthiopianPhone } from "@/components/ui/phone-input"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  UserGroupIcon,
  PlusSignIcon,
  Loading01Icon,
  SecurityCheckIcon,
  Shield01Icon,
  Delete02Icon,
  AlertCircleIcon,
  CheckmarkCircle01Icon,
  Copy01Icon,
  Exchange01Icon,
  UserCircleIcon,
  SmartPhone01Icon,
  SearchIcon,
  Cancel01Icon,
  Tick02Icon,
  Clock01Icon,
  Mail01Icon,
  RefreshIcon,
  HelpCircleIcon,
} from "@hugeicons/core-free-icons"

const ROLE_WEIGHT: Record<string, number> = {
  owner: 3,
  admin: 2,
  staff: 1,
  member: 1,
}

export default function TeamPage() {
  const { activeOrgId, activeOrg } = useActiveOrganization()
  const { data: meData } = useGetMeQuery()
  const currentUserId = meData?.data?.user?.id

  // Team roster: provides memberships and invitations with separate lists
  const {
    data: rosterData,
    isLoading: isRosterLoading,
    refetch: refetchRoster,
  } = useGetOwnerTeamRosterQuery(
    { organizationId: activeOrgId || "" },
    { skip: !activeOrgId }
  )

  const [createInvitation, { isLoading: isCreatingInvite }] = useCreateOwnerMembershipInvitationMutation()
  const [resendInvitation, { isLoading: isResendingInvite }] = useResendOwnerMembershipInvitationMutation()
  const [revokeInvitation, { isLoading: isRevokingInvite }] = useRevokeOwnerMembershipInvitationMutation()
  const [updateMember, { isLoading: isUpdating }] = useUpdateOwnerMembershipMutation()
  const [deleteMember, { isLoading: isDeleting }] = useDeleteOwnerMembershipMutation()
  const [suspendMember, { isLoading: isSuspending }] = useSuspendOwnerMembershipMutation()
  const [activateMember, { isLoading: isActivating }] = useActivateOwnerMembershipMutation()

  // Active view tab: "members" vs "invitations"
  const [activeTab, setActiveTab] = React.useState<"members" | "invitations">("members")

  // Add Member Modal states
  const [addDialogOpen, setAddDialogOpen] = React.useState(false)
  const [phoneInput, setPhoneInput] = React.useState("")
  const [roleInput, setRoleInput] = React.useState<"admin" | "staff">("staff")
  const [addFormError, setAddFormError] = React.useState<string | null>(null)

  // Success Claim URL display modal
  const [createdClaimUrl, setCreatedClaimUrl] = React.useState<string | null>(null)
  const [createdMaskedContact, setCreatedMaskedContact] = React.useState<string | null>(null)
  const [copiedUrl, setCopiedUrl] = React.useState(false)

  // Resend Link display modal
  const [resendResult, setResendResult] = React.useState<{ maskedContact: string; claimUrl?: string } | null>(null)
  const [copiedResendUrl, setCopiedResendUrl] = React.useState(false)

  // Confirmation dialogs
  const [revokeTarget, setRevokeTarget] = React.useState<MembershipInvitation | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<Membership | null>(null)

  // Search and filters
  const [searchQuery, setSearchQuery] = React.useState("")
  const [roleFilter, setRoleFilter] = React.useState<"all" | MembershipRole>("all")

  // Roster arrays
  const memberships = rosterData?.data?.memberships?.data ?? []
  const invitations = rosterData?.data?.invitations?.data ?? []

  // Current user's role in this organization
  const currentMembership = memberships.find(
    (m) => (m.user_id || m.user?.id) === currentUserId
  )
  const currentUserRole = currentMembership?.role ?? "staff"
  const isCurrentUserOwner = currentUserRole === "owner"
  const isCurrentUserAdmin = currentUserRole === "admin"
  const canAddMembers = isCurrentUserOwner || isCurrentUserAdmin

  const canManageMember = (targetMember: Membership) => {
    const targetUserId = targetMember.user_id || targetMember.user?.id
    if (targetUserId && targetUserId === currentUserId) return false
    if (targetMember.role === "owner") return false
    const actorWeight = ROLE_WEIGHT[currentUserRole] ?? 0
    const targetWeight = ROLE_WEIGHT[targetMember.role] ?? 0
    return actorWeight > targetWeight
  }

  const handleOpenAddDialog = () => {
    setPhoneInput("")
    setRoleInput("staff")
    setAddFormError(null)
    setAddDialogOpen(true)
  }

  const handleCopyLink = (url: string, isResend = false) => {
    navigator.clipboard.writeText(url)
    if (isResend) {
      setCopiedResendUrl(true)
      setTimeout(() => setCopiedResendUrl(false), 2500)
    } else {
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2500)
    }
    toast.success("Claim link copied to clipboard")
  }

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddFormError(null)

    if (!activeOrgId) return

    const trimmed = phoneInput.trim()
    if (!trimmed) {
      setAddFormError("Phone number is required.")
      return
    }

    if (trimmed.includes("@")) {
      setAddFormError("Email invitations are coming in Phase 2; please use an Ethiopian phone number (+251...).")
      return
    }

    const normalized = normalizeEthiopianPhone(trimmed)
    if (!normalized || normalized.length < 9) {
      setAddFormError("Please enter a valid Ethiopian mobile phone number (e.g. 091 123 4567 or 91 123 4567).")
      return
    }

    try {
      const res = await createInvitation({
        organizationId: activeOrgId,
        body: {
          membership_invitation: {
            phone: normalized,
            role: roleInput,
          },
        },
      }).unwrap()

      const claimUrl = res?.data?.claim_url
      const masked = res?.data?.invitation?.masked_contact || normalized

      setAddDialogOpen(false)
      setCreatedClaimUrl(claimUrl || null)
      setCreatedMaskedContact(masked)
      refetchRoster()
      toast.success("Invitation created successfully", {
        description: `Invitation queued for ${masked}.`,
      })
    } catch (err: any) {
      const errorMsg =
        err?.data?.message ||
        err?.data?.error ||
        (err?.data?.errors ? Object.values(err.data.errors).flat().join(", ") : null) ||
        "Failed to send invitation"

      if (err?.data?.code === "invitation_already_pending") {
        setAddFormError("An invitation is already pending for this phone number.")
      } else if (err?.data?.code === "invitation_channel_not_enabled") {
        setAddFormError("Email invitations are coming in Phase 2; please use an Ethiopian phone number.")
      } else if (err?.data?.code === "phone_identity_invalid") {
        setAddFormError("Invalid phone number format. Please check the digits and try again.")
      } else {
        setAddFormError(errorMsg)
      }
    }
  }

  const handleResend = async (invitation: MembershipInvitation) => {
    if (!activeOrgId) return
    try {
      const res = await resendInvitation({
        organizationId: activeOrgId,
        id: invitation.id,
      }).unwrap()

      const newClaimUrl = res?.data?.claim_url
      setResendResult({
        maskedContact: invitation.masked_contact,
        claimUrl: newClaimUrl,
      })
      refetchRoster()
      toast.success("Invitation resent", {
        description: `New one-time link issued for ${invitation.masked_contact}. Old link is now expired.`,
      })
    } catch (err: any) {
      toast.error("Failed to resend invitation", {
        description: err?.data?.message || err?.data?.error || "An error occurred",
      })
    }
  }

  const handleRevoke = async () => {
    if (!activeOrgId || !revokeTarget) return
    try {
      await revokeInvitation({
        organizationId: activeOrgId,
        id: revokeTarget.id,
      }).unwrap()

      toast.success("Invitation revoked", {
        description: `Invitation for ${revokeTarget.masked_contact} was cancelled.`,
      })
      setRevokeTarget(null)
      refetchRoster()
    } catch (err: any) {
      toast.error("Failed to revoke invitation", {
        description: err?.data?.message || err?.data?.error || "An error occurred",
      })
    }
  }

  const handleToggleRole = async (member: Membership) => {
    if (!activeOrgId || member.role === "owner") return
    const newRole: "admin" | "staff" = member.role === "admin" ? "staff" : "admin"

    try {
      await updateMember({
        organizationId: activeOrgId,
        id: member.id,
        body: { membership: { role: newRole } },
      }).unwrap()

      toast.success(`Role updated to ${newRole.toUpperCase()}`)
      refetchRoster()
    } catch (err: any) {
      toast.error("Failed to change role", {
        description: err?.data?.message || err?.data?.error || "An error occurred",
      })
    }
  }

  const handleToggleStatus = async (member: Membership) => {
    if (!activeOrgId || member.role === "owner") return
    const isSuspended = member.status === "suspended" || member.suspended

    try {
      if (isSuspended) {
        await activateMember({ organizationId: activeOrgId, id: member.id }).unwrap()
        toast.success("Member activated")
      } else {
        await suspendMember({ organizationId: activeOrgId, id: member.id }).unwrap()
        toast.info("Member suspended")
      }
      refetchRoster()
    } catch (err: any) {
      toast.error("Failed to update status", {
        description: err?.data?.message || err?.data?.error || "An error occurred",
      })
    }
  }

  const handleConfirmDelete = async () => {
    if (!activeOrgId || !deleteTarget) return

    try {
      await deleteMember({ organizationId: activeOrgId, id: deleteTarget.id }).unwrap()
      toast.success("Member removed from organization")
      setDeleteTarget(null)
      refetchRoster()
    } catch (err: any) {
      toast.error("Failed to remove member", {
        description: err?.data?.message || err?.data?.error || "An error occurred",
      })
    }
  }

  // Filtered lists
  const filteredMembers = React.useMemo(() => {
    return memberships.filter((member) => {
      if (roleFilter !== "all" && member.role !== roleFilter) return false
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const email = member.user?.email?.toLowerCase() || ""
        const phone = member.user?.phone?.toLowerCase() || ""
        const name = (member.user?.name as string)?.toLowerCase() || ""
        const id = (member.user_id || member.id).toLowerCase()
        const role = member.role.toLowerCase()

        if (!email.includes(query) && !phone.includes(query) && !name.includes(query) && !id.includes(query) && !role.includes(query)) {
          return false
        }
      }
      return true
    })
  }, [memberships, roleFilter, searchQuery])

  const filteredInvitations = React.useMemo(() => {
    return invitations.filter((inv) => {
      if (roleFilter !== "all" && inv.role !== roleFilter) return false
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const contact = inv.masked_contact.toLowerCase()
        const role = inv.role.toLowerCase()
        const status = inv.status.toLowerCase()
        if (!contact.includes(query) && !role.includes(query) && !status.includes(query)) {
          return false
        }
      }
      return true
    })
  }, [invitations, roleFilter, searchQuery])

  if (!activeOrgId) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center space-y-2">
          <HugeiconsIcon icon={UserGroupIcon} className="size-10 mx-auto text-muted-foreground" />
          <p className="text-sm font-medium">No active organization</p>
          <p className="text-xs text-muted-foreground">Select an organization to manage team members.</p>
        </div>
      </div>
    )
  }

  const activeCount = memberships.filter((m) => m.status !== "suspended" && !m.suspended).length
  const pendingCount = invitations.filter((i) => i.status === "pending").length

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Team Management</h1>
          <p className="text-sm text-muted-foreground">
            Invite phone-verified collaborators, manage assigned roles, and inspect active access for{" "}
            <span className="font-semibold text-foreground">{activeOrg?.name || "your workspace"}</span>.
          </p>
        </div>

        {canAddMembers && (
          <Button onClick={handleOpenAddDialog} className="gap-2 shadow-xs shrink-0">
            <HugeiconsIcon icon={PlusSignIcon} className="size-4" strokeWidth={2.5} />
            Invite Team Member
          </Button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Active Team</span>
          <p className="text-2xl font-bold text-foreground">{activeCount}</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Pending Invitations</span>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{pendingCount}</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Admins</span>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {memberships.filter((m) => m.role === "admin").length}
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Staff Members</span>
          <p className="text-2xl font-bold text-foreground">
            {memberships.filter((m) => m.role === "staff").length}
          </p>
        </div>
      </div>

      {/* Roster Container with Dual Tabs */}
      <div className="rounded-2xl border border-border/70 bg-card shadow-xs overflow-hidden">
        {/* Tab Header & Search Controls */}
        <div className="p-4 border-b border-border/60 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/10">
          {/* Tab Switcher */}
          <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border border-border/60">
            <button
              onClick={() => setActiveTab("members")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "members"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <HugeiconsIcon icon={UserGroupIcon} className="size-3.5" />
              <span>Active Members</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-muted font-mono">
                {memberships.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("invitations")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "invitations"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <HugeiconsIcon icon={Clock01Icon} className="size-3.5" />
              <span>Pending Invitations</span>
              {pendingCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-400 font-mono font-bold">
                  {pendingCount}
                </span>
              )}
            </button>
          </div>

          {/* Search & Role Filters */}
          <div className="flex items-center gap-2.5 flex-1 max-w-md self-stretch md:self-auto">
            <div className="relative flex-1">
              <HugeiconsIcon
                icon={SearchIcon}
                className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
              />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeTab === "members" ? "Search members by phone, name, email..." : "Search invitations..."}
                className="pl-9 pr-8 text-xs h-9 bg-card"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/60 text-xs shrink-0">
              <button
                onClick={() => setRoleFilter("all")}
                className={`px-2.5 py-1 rounded-md transition-colors font-medium ${
                  roleFilter === "all" ? "bg-card text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setRoleFilter("admin")}
                className={`px-2.5 py-1 rounded-md transition-colors font-medium ${
                  roleFilter === "admin" ? "bg-card text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Admin
              </button>
              <button
                onClick={() => setRoleFilter("staff")}
                className={`px-2.5 py-1 rounded-md transition-colors font-medium ${
                  roleFilter === "staff" ? "bg-card text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Staff
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchRoster()}
              className="h-9 px-2.5 shrink-0"
              title="Refresh roster"
            >
              <HugeiconsIcon icon={RefreshIcon} className="size-3.5 text-muted-foreground" />
            </Button>
          </div>
        </div>

        {/* Tab 1: Active Members */}
        {activeTab === "members" && (
          <div>
            {isRosterLoading ? (
              <div className="flex h-48 items-center justify-center">
                <HugeiconsIcon icon={Loading01Icon} className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="mx-auto size-12 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground">
                  <HugeiconsIcon icon={UserGroupIcon} className="size-6" />
                </div>
                <p className="text-sm font-medium">No team members found</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {searchQuery ? "No members match your search criteria." : "Invite collaborators using their phone number to build your team."}
                </p>
                {canAddMembers && !searchQuery && (
                  <Button size="sm" onClick={handleOpenAddDialog} className="shadow-xs">
                    Invite First Member
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {filteredMembers.map((member) => {
                  const isOwner = member.role === "owner"
                  const isSuspended = member.status === "suspended" || member.suspended
                  const isCurrentMember = (member.user_id || member.user?.id) === currentUserId
                  const canManage = canManageMember(member)
                  const displayPhone = member.user?.phone
                  const displayEmail = member.user?.email
                  const displayName = (member.user?.name as string) || null

                  return (
                    <div
                      key={member.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-muted/10 transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="size-11 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-bold text-foreground shrink-0">
                          {isOwner ? (
                            <HugeiconsIcon icon={Shield01Icon} className="size-5 text-amber-500" />
                          ) : member.role === "admin" ? (
                            <HugeiconsIcon icon={SecurityCheckIcon} className="size-5 text-blue-500" />
                          ) : (
                            <HugeiconsIcon icon={UserCircleIcon} className="size-5 text-muted-foreground" />
                          )}
                        </div>

                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-foreground truncate">
                              {displayName || displayPhone || displayEmail || `Member: ${member.id.slice(0, 8)}`}
                            </span>

                            {isCurrentMember && (
                              <Badge variant="outline" className="text-[10px] border-primary/40 bg-primary/5 text-primary font-semibold">
                                You
                              </Badge>
                            )}

                            {isOwner ? (
                              <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] font-bold">
                                Owner
                              </Badge>
                            ) : member.role === "admin" ? (
                              <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 text-[10px] font-bold">
                                Admin
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px] font-bold">
                                Staff
                              </Badge>
                            )}

                            {isSuspended ? (
                              <Badge variant="destructive" className="text-[10px]">
                                Suspended
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px]">
                                Active
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                            {displayPhone && (
                              <span className="flex items-center gap-1 font-mono">
                                <HugeiconsIcon icon={SmartPhone01Icon} className="size-3" />
                                {displayPhone}
                              </span>
                            )}
                            {displayEmail && (
                              <span className="flex items-center gap-1">
                                <HugeiconsIcon icon={Mail01Icon} className="size-3" />
                                {displayEmail}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Management Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {canManage ? (
                          <>
                            {isCurrentUserOwner && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleRole(member)}
                                disabled={isUpdating}
                                className="text-xs gap-1.5 h-8"
                                title="Toggle role between Admin and Staff"
                              >
                                <HugeiconsIcon icon={Exchange01Icon} className="size-3 text-muted-foreground" />
                                Make {member.role === "admin" ? "Staff" : "Admin"}
                              </Button>
                            )}

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleStatus(member)}
                              disabled={isSuspending || isActivating}
                              className={`text-xs h-8 ${
                                isSuspended ? "text-emerald-600 hover:text-emerald-700" : "text-amber-600 hover:text-amber-700"
                              }`}
                            >
                              {isSuspended ? "Activate" : "Suspend"}
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteTarget(member)}
                              disabled={isDeleting}
                              className="text-xs text-destructive hover:bg-destructive/10 h-8 px-2"
                              title="Remove member"
                            >
                              <HugeiconsIcon icon={Delete02Icon} className="size-4" />
                            </Button>
                          </>
                        ) : isOwner ? (
                          <span className="text-xs text-muted-foreground italic px-2">Primary Workspace Owner</span>
                        ) : isCurrentMember ? (
                          <span className="text-xs text-muted-foreground italic px-2">Signed-in Account</span>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Pending Invitations */}
        {activeTab === "invitations" && (
          <div>
            {isRosterLoading ? (
              <div className="flex h-48 items-center justify-center">
                <HugeiconsIcon icon={Loading01Icon} className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredInvitations.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="mx-auto size-12 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground">
                  <HugeiconsIcon icon={Clock01Icon} className="size-6" />
                </div>
                <p className="text-sm font-medium">No pending invitations</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  All invited collaborators have either claimed their invitations or there are no outstanding invites.
                </p>
                {canAddMembers && (
                  <Button size="sm" onClick={handleOpenAddDialog} className="shadow-xs">
                    Send Invitation
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {filteredInvitations.map((invitation) => {
                  const isExpired = invitation.status === "expired" || (invitation.expires_at && new Date(invitation.expires_at) < new Date())
                  const isRevoked = invitation.status === "revoked"

                  return (
                    <div
                      key={invitation.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-muted/10 transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="size-11 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-600 shrink-0">
                          <HugeiconsIcon icon={SmartPhone01Icon} className="size-5 text-amber-600 dark:text-amber-400" />
                        </div>

                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm font-mono text-foreground">
                              {invitation.masked_contact}
                            </span>

                            {invitation.role === "admin" ? (
                              <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 text-[10px] font-bold">
                                Invited as Admin
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px] font-bold">
                                Invited as Staff
                              </Badge>
                            )}

                            {isRevoked ? (
                              <Badge variant="destructive" className="text-[10px]">
                                Revoked
                              </Badge>
                            ) : isExpired ? (
                              <Badge variant="outline" className="border-muted text-muted-foreground text-[10px]">
                                Expired
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px]">
                                Pending Claim
                              </Badge>
                            )}

                            {invitation.delivery_status && (
                              <Badge variant="outline" className="text-[10px] text-muted-foreground uppercase font-mono">
                                {invitation.delivery_status}
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                            <span>
                              Expires: {invitation.expires_at ? new Date(invitation.expires_at).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }) : "7 days"}
                            </span>
                            <span>•</span>
                            <span>Revision #{invitation.delivery_revision || 1}</span>
                          </div>
                        </div>
                      </div>

                      {/* Pending Actions */}
                      {canAddMembers && invitation.status === "pending" && !isExpired && (
                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResend(invitation)}
                            disabled={isResendingInvite}
                            className="text-xs gap-1.5 h-8"
                            title="Rotate one-time claim token and generate new link"
                          >
                            <HugeiconsIcon icon={RefreshIcon} className="size-3 text-muted-foreground" />
                            Resend & Rotate Link
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setRevokeTarget(invitation)}
                            disabled={isRevokingInvite}
                            className="text-xs text-destructive hover:bg-destructive/10 h-8 px-2"
                            title="Revoke invitation"
                          >
                            <HugeiconsIcon icon={Delete02Icon} className="size-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Roles & Permissions Matrix */}
      <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs space-y-4">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <HugeiconsIcon icon={SecurityCheckIcon} className="size-4.5 text-primary" />
          Roles & Permissions Explainer
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Owner
              </span>
              <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-600">
                Workspace Lead
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Full administrative authority. Manages bank payouts, compliance verification, and invites or promotes Admins and Staff. Cannot be removed.
            </p>
          </div>

          <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Admin
              </span>
              <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-600">
                Operations & Events
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Can create and manage events, ticket tiers, promo codes, guest invitations, and invite team members. Can view revenue analytics.
            </p>
          </div>

          <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Staff
              </span>
              <Badge variant="outline" className="text-[10px]">
                Gate & Check-in
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Operational gate access. Can link handheld scanner devices, perform attendee QR check-ins, and inspect live check-in logs.
            </p>
          </div>
        </div>
      </div>

      {/* Modal 1: Send Invitation Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <HugeiconsIcon icon={PlusSignIcon} className="size-5 text-primary" strokeWidth={2.5} />
              Invite Team Member
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Invite a collaborator to <strong className="text-foreground">{activeOrg?.name}</strong> using their verified mobile phone.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateInvitation} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="invite-phone" className="text-sm font-medium">
                Ethiopian Mobile Phone <span className="text-destructive">*</span>
              </Label>
              <PhoneInput
                id="invite-phone"
                value={phoneInput}
                onChange={(e) => {
                  setPhoneInput(e.target.value)
                  setAddFormError(null)
                }}
                placeholder="91 123 4567"
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground">
                Phase 1 is phone-only. The recipient must claim using an account matching this phone.
              </p>
            </div>

            {/* Role Picker Cards */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Assign Role</Label>
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setRoleInput("staff")}
                  className={`p-3 rounded-xl border cursor-pointer transition-all space-y-1 ${
                    roleInput === "staff"
                      ? "border-primary bg-primary/5 ring-1 ring-primary/40 shadow-xs"
                      : "border-border/70 bg-card hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-foreground">Staff</span>
                    <Badge variant="secondary" className="text-[10px]">
                      Default
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-snug">
                    Gate operations, ticket scanners & attendee check-ins.
                  </p>
                </div>

                <div
                  onClick={() => setRoleInput("admin")}
                  className={`p-3 rounded-xl border cursor-pointer transition-all space-y-1 ${
                    roleInput === "admin"
                      ? "border-primary bg-primary/5 ring-1 ring-primary/40 shadow-xs"
                      : "border-border/70 bg-card hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-foreground">Admin</span>
                    <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-600">
                      Manage
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-snug">
                    Manage events, tickets, lineups, promo codes & team.
                  </p>
                </div>
              </div>
            </div>

            {addFormError && (
              <div className="p-3 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-start gap-2">
                <HugeiconsIcon icon={AlertCircleIcon} className="size-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{addFormError}</span>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddDialogOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreatingInvite}
                className="font-semibold text-xs gap-1.5 shadow-xs"
              >
                {isCreatingInvite ? (
                  <HugeiconsIcon icon={Loading01Icon} className="size-3.5 animate-spin" />
                ) : (
                  <HugeiconsIcon icon={PlusSignIcon} className="size-3.5" strokeWidth={2.5} />
                )}
                {isCreatingInvite ? "Creating..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Success Share Dialog (One-time Claim URL) */}
      <Dialog open={Boolean(createdClaimUrl)} onOpenChange={(open) => !open && setCreatedClaimUrl(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-5 text-emerald-500" />
              Invitation Created
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              An invitation has been created for <strong className="text-foreground">{createdMaskedContact}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="rounded-xl border border-border/70 bg-muted/30 p-3.5 space-y-2">
              <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>One-Time Claim Link</span>
                <span className="text-[11px] text-amber-600 font-normal">Shown only once</span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={createdClaimUrl || ""}
                  className="font-mono text-xs h-9 bg-card select-all"
                />
                <Button
                  onClick={() => createdClaimUrl && handleCopyLink(createdClaimUrl)}
                  className="shrink-0 gap-1.5 h-9 text-xs"
                >
                  <HugeiconsIcon icon={copiedUrl ? Tick02Icon : Copy01Icon} className="size-3.5" />
                  {copiedUrl ? "Copied!" : "Copy Link"}
                </Button>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
              <HugeiconsIcon icon={AlertCircleIcon} className="size-4 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                For security, this link is not stored or visible in later roster views. You can copy and send it directly to the collaborator via SMS, Telegram, or WhatsApp.
              </p>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button onClick={() => setCreatedClaimUrl(null)} className="text-xs">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 3: Resend Result Dialog */}
      <Dialog open={Boolean(resendResult)} onOpenChange={(open) => !open && setResendResult(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <HugeiconsIcon icon={RefreshIcon} className="size-5 text-primary" />
              Invitation Token Rotated
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              A fresh token has been generated for <strong className="text-foreground">{resendResult?.maskedContact}</strong>. Any previous link has been invalidated.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {resendResult?.claimUrl && (
              <div className="rounded-xl border border-border/70 bg-muted/30 p-3.5 space-y-2">
                <Label className="text-xs font-semibold text-foreground">New Claim Link</Label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={resendResult.claimUrl}
                    className="font-mono text-xs h-9 bg-card select-all"
                  />
                  <Button
                    onClick={() => handleCopyLink(resendResult.claimUrl!, true)}
                    className="shrink-0 gap-1.5 h-9 text-xs"
                  >
                    <HugeiconsIcon icon={copiedResendUrl ? Tick02Icon : Copy01Icon} className="size-3.5" />
                    {copiedResendUrl ? "Copied!" : "Copy Link"}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button onClick={() => setResendResult(null)} className="text-xs">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 4: Revoke Invitation Confirm */}
      <Dialog open={Boolean(revokeTarget)} onOpenChange={(open) => !open && setRevokeTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-destructive flex items-center gap-2">
              <HugeiconsIcon icon={AlertCircleIcon} className="size-5" />
              Revoke Invitation
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to revoke this invitation for{" "}
              <strong className="text-foreground">{revokeTarget?.masked_contact}</strong>? Any claim attempt using their link will be rejected immediately.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setRevokeTarget(null)} className="text-xs">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevoke}
              disabled={isRevokingInvite}
              className="text-xs font-semibold"
            >
              {isRevokingInvite ? "Revoking..." : "Confirm Revoke"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 5: Delete Member Confirm */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-destructive flex items-center gap-2">
              <HugeiconsIcon icon={AlertCircleIcon} className="size-5" />
              Remove Team Member
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to remove this member from{" "}
              <strong className="text-foreground">{activeOrg?.name}</strong>? They will immediately lose access to manage events and scan tickets.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 text-xs space-y-1.5">
            <p className="font-semibold text-foreground">
              {deleteTarget?.user?.name || deleteTarget?.user?.phone || deleteTarget?.user?.email || `Member: ${deleteTarget?.id}`}
            </p>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="capitalize">Role: {deleteTarget?.role}</span>
              <span>•</span>
              <span className="font-mono text-[11px]">ID: {deleteTarget?.user_id || deleteTarget?.id}</span>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="text-xs">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="text-xs font-semibold"
            >
              {isDeleting ? "Removing..." : "Confirm Removal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
