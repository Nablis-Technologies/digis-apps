"use client"

import * as React from "react"
import { useActiveOrganization } from "../../../providers/organization-provider"
import { useGetMeQuery } from "@workspace/store/reducers/authApi"
import {
  useListOwnerMembershipsQuery,
  useCreateOwnerMembershipMutation,
  useUpdateOwnerMembershipMutation,
  useDeleteOwnerMembershipMutation,
  useSuspendOwnerMembershipMutation,
  useActivateOwnerMembershipMutation,
  type Membership,
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  HelpCircleIcon,
  UserCircleIcon,
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

  const {
    data: membersData,
    isLoading: isMembersLoading,
    refetch: refetchMembers,
  } = useListOwnerMembershipsQuery(
    { organizationId: activeOrgId || "" },
    { skip: !activeOrgId }
  )

  const [createMember, { isLoading: isCreating }] = useCreateOwnerMembershipMutation()
  const [updateMember, { isLoading: isUpdating }] = useUpdateOwnerMembershipMutation()
  const [deleteMember, { isLoading: isDeleting }] = useDeleteOwnerMembershipMutation()
  const [suspendMember, { isLoading: isSuspending }] = useSuspendOwnerMembershipMutation()
  const [activateMember, { isLoading: isActivating }] = useActivateOwnerMembershipMutation()

  // Modal states
  const [addDialogOpen, setAddDialogOpen] = React.useState(false)
  const [userIdInput, setUserIdInput] = React.useState("")
  const [roleInput, setRoleInput] = React.useState<"admin" | "staff">("staff")

  // Delete confirm dialog
  const [deleteTarget, setDeleteTarget] = React.useState<Membership | null>(null)

  const members = membersData?.data ?? []

  // Determine current user's membership and permissions in this organization
  const currentMembership = members.find(
    (m) => (m.user_id || m.user?.id) === currentUserId
  )
  const currentUserRole = currentMembership?.role ?? "staff"
  const isCurrentUserOwner = currentUserRole === "owner"
  const isCurrentUserAdmin = currentUserRole === "admin"
  const canAddMembers = isCurrentUserOwner || isCurrentUserAdmin

  const canManageMember = (targetMember: Membership) => {
    // Cannot manage self
    const targetUserId = targetMember.user_id || targetMember.user?.id
    if (targetUserId && targetUserId === currentUserId) return false

    // Cannot manage an owner
    if (targetMember.role === "owner") return false

    // Must outrank target member
    const actorWeight = ROLE_WEIGHT[currentUserRole] ?? 0
    const targetWeight = ROLE_WEIGHT[targetMember.role] ?? 0
    return actorWeight > targetWeight
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedId = userIdInput.trim()
    if (!trimmedId) {
      toast.error("User ID (UUID) is required")
      return
    }

    if (!activeOrgId) return

    try {
      await createMember({
        organizationId: activeOrgId,
        body: {
          membership: {
            user_id: trimmedId,
            role: roleInput,
          },
        },
      }).unwrap()

      toast.success("Team member added successfully")
      setUserIdInput("")
      setRoleInput("staff")
      setAddDialogOpen(false)
      refetchMembers()
    } catch (err: any) {
      toast.error("Failed to add team member", {
        description:
          err?.data?.message ||
          err?.data?.error ||
          "Please verify the User UUID is correct and exists in Digis.",
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

      toast.success(`Role updated to ${newRole}`)
      refetchMembers()
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
      refetchMembers()
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
      refetchMembers()
    } catch (err: any) {
      toast.error("Failed to remove member", {
        description: err?.data?.message || err?.data?.error || "An error occurred",
      })
    }
  }

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

  const activeCount = members.filter((m) => m.status !== "suspended" && !m.suspended).length
  const suspendedCount = members.length - activeCount

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Team Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage organization members, assign roles, and configure event access for {activeOrg?.name || "your workspace"}.
          </p>
        </div>

        {canAddMembers && (
          <Button
            onClick={() => setAddDialogOpen(true)}
            className="gap-2 shadow-xs"
          >
            <HugeiconsIcon icon={PlusSignIcon} className="size-4" strokeWidth={2.5} />
            Add Team Member
          </Button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Total Team Size</span>
          <p className="text-2xl font-bold text-foreground">{members.length}</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Active Members</span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{activeCount}</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Suspended</span>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{suspendedCount}</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Admins & Staff</span>
          <p className="text-2xl font-bold text-foreground">
            {members.filter((m) => m.role !== "owner").length}
          </p>
        </div>
      </div>

      {/* Team Members List */}
      <div className="rounded-2xl border border-border/70 bg-card shadow-xs overflow-hidden">
        <div className="p-5 border-b border-border/60 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">Organization Members</h3>
            <p className="text-xs text-muted-foreground">
              Members with granted roles in this organization.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchMembers()}
            className="text-xs"
          >
            Refresh
          </Button>
        </div>

        {isMembersLoading ? (
          <div className="flex h-48 items-center justify-center">
            <HugeiconsIcon icon={Loading01Icon} className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : members.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="mx-auto size-12 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground">
              <HugeiconsIcon icon={UserGroupIcon} className="size-6" />
            </div>
            <p className="text-sm font-medium">No team members yet</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Add collaborators, event coordinators, and scanning staff to help run your events.
            </p>
            {canAddMembers && (
              <Button
                size="sm"
                onClick={() => setAddDialogOpen(true)}
                className="shadow-xs"
              >
                Add First Member
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {members.map((member) => {
              const isOwner = member.role === "owner"
              const isSuspended = member.status === "suspended" || member.suspended
              const isCurrentMember = (member.user_id || member.user?.id) === currentUserId
              const canManage = canManageMember(member)

              return (
                <div
                  key={member.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-muted/10 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="size-10 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-bold text-foreground shrink-0">
                      {isOwner ? (
                        <HugeiconsIcon icon={Shield01Icon} className="size-5 text-amber-500" />
                      ) : (
                        <HugeiconsIcon icon={UserCircleIcon} className="size-5 text-muted-foreground" />
                      )}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground truncate">
                          {member.user?.email || `User: ${member.user_id?.slice(0, 8)}...`}
                        </span>

                        {/* You Badge */}
                        {isCurrentMember && (
                          <Badge variant="outline" className="text-[10px] border-primary/40 bg-primary/5 text-primary font-semibold">
                            You
                          </Badge>
                        )}

                        {/* Role Badge */}
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

                        {/* Status Badge */}
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

                      <p className="text-xs text-muted-foreground font-mono truncate">
                        ID: {member.user_id || member.id}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {canManage ? (
                      <>
                        {isCurrentUserOwner && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleRole(member)}
                            disabled={isUpdating}
                            className="text-xs gap-1.5 h-8"
                            title="Toggle between Admin and Staff"
                          >
                            <HugeiconsIcon icon={Exchange01Icon} className="size-3 text-muted-foreground" />
                            Role: {member.role === "admin" ? "Staff" : "Admin"}
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(member)}
                          disabled={isSuspending || isActivating}
                          className={`text-xs h-8 ${
                            isSuspended
                              ? "text-emerald-600 hover:text-emerald-700"
                              : "text-amber-600 hover:text-amber-700"
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
                      <span className="text-xs text-muted-foreground italic px-2">
                        Primary Owner
                      </span>
                    ) : isCurrentMember ? (
                      <span className="text-xs text-muted-foreground italic px-2">
                        You ({member.role})
                      </span>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>


      {/* Role Explainer Card */}
      <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs space-y-4">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <HugeiconsIcon icon={SecurityCheckIcon} className="size-4.5 text-primary" />
          Roles & Permissions Explainer
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-1.5">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Owner
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Full administrative authority. Can manage billing, request payouts, modify organization compliance, and transfer ownership. Cannot be demoted or removed.
            </p>
          </div>

          <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-1.5">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Admin
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Can create and manage events, configure tickets and promo codes, invite team members, and view financial analytics.
            </p>
          </div>

          <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-1.5">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Staff
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Operational event access. Can use ticket scanner devices, perform attendee check-ins, and inspect attendee lists.
            </p>
          </div>
        </div>
      </div>

      {/* Add Member Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Add Team Member</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Invite a collaborator to your organization workspace.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddMember} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="add-user-id" className="text-sm font-medium">
                User ID (UUID) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="add-user-id"
                value={userIdInput}
                onChange={(e) => setUserIdInput(e.target.value)}
                placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
                required
                className="font-mono text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                Ask the team member for their User UUID from their <strong>Profile</strong> page.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="add-role" className="text-sm font-medium">
                Role
              </Label>
              <select
                id="add-role"
                value={roleInput}
                onChange={(e) => setRoleInput(e.target.value as "admin" | "staff")}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="staff" className="bg-card text-foreground">
                  Staff (Check-ins & Event operations)
                </option>
                <option value="admin" className="bg-card text-foreground">
                  Admin (Manage events & team)
                </option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/50">
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
                disabled={isCreating}
                className="font-semibold text-xs gap-1.5 shadow-xs"
              >
                {isCreating ? (
                  <HugeiconsIcon icon={Loading01Icon} className="size-3.5 animate-spin" />
                ) : (
                  <HugeiconsIcon icon={PlusSignIcon} className="size-3.5" />
                )}
                Add Member
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Member Confirmation Dialog */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-destructive flex items-center gap-2">
              <HugeiconsIcon icon={AlertCircleIcon} className="size-5" />
              Remove Team Member
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to remove this member from {activeOrg?.name}? They will immediately lose access to manage events and scan tickets.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 rounded-xl border border-border/60 bg-muted/20 text-xs space-y-1">
            <p className="font-mono text-foreground font-semibold">
              {deleteTarget?.user?.email || `User: ${deleteTarget?.user_id || deleteTarget?.id}`}
            </p>
            <p className="text-muted-foreground capitalize">Role: {deleteTarget?.role}</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              className="text-xs"
            >
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
