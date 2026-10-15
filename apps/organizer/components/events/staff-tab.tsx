"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { PhoneInput, normalizeEthiopianPhone } from "@/components/ui/phone-input"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  UserGroupIcon,
  Add01Icon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  Loading03Icon,
  Shield01Icon,
  MoreVerticalIcon,
  AlertCircleIcon,
  Edit01Icon,
  SmartPhone01Icon,
  Copy01Icon,
  Tick02Icon,
  RefreshIcon,
  Clock01Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons"
import {
  useGetEventStaffRosterQuery,
  useCreateStaffInvitationMutation,
  useResendStaffInvitationMutation,
  useRevokeStaffInvitationMutation,
  useSuspendStaffAssignmentMutation,
  useActivateStaffAssignmentMutation,
  useRevokeStaffAssignmentMutation,
  useChangeStaffRoleMutation,
  type EventStaffAssignment,
  type StaffInvitation,
} from "@workspace/store/reducers/eventScheduleApi"
import { formatDate, formatApiErrorMessage, normalizeClaimUrl } from "@/lib/utils"

interface StaffTabProps {
  eventId: string
  organizationId?: string
}

const ROLES = [
  { value: "manager", label: "Event Manager", description: "Full onsite event control & operational management", badge: "default" },
  { value: "staff", label: "Floor Staff", description: "General venue support, box office & information desk", badge: "outline" },
  { value: "contractor", label: "Contractor / Security", description: "Temporary security, sound or external production crew", badge: "secondary" },
]

export function StaffTab({ eventId }: StaffTabProps) {
  const { data: rosterData, isLoading, refetch } = useGetEventStaffRosterQuery({ eventId })

  const assignments: EventStaffAssignment[] = rosterData?.data?.assignments?.data || []
  const invitations: StaffInvitation[] = rosterData?.data?.invitations?.data || []

  const [createInvitation, { isLoading: isCreating }] = useCreateStaffInvitationMutation()
  const [resendInvitation, { isLoading: isResending }] = useResendStaffInvitationMutation()
  const [revokeInvitation, { isLoading: isRevokingInvite }] = useRevokeStaffInvitationMutation()

  const [suspendStaff] = useSuspendStaffAssignmentMutation()
  const [activateStaff] = useActivateStaffAssignmentMutation()
  const [revokeStaff] = useRevokeStaffAssignmentMutation()
  const [changeStaffRole, { isLoading: isChangingRole }] = useChangeStaffRoleMutation()

  // Active view tab
  const [activeTab, setActiveTab] = useState<"assignments" | "invitations">("assignments")

  // Invite modal
  const [dialogOpen, setDialogOpen] = useState(false)
  const [phoneInput, setPhoneInput] = useState("")
  const [selectedRole, setSelectedRole] = useState<"manager" | "staff" | "contractor">("staff")
  const [expiresAtInput, setExpiresAtInput] = useState("")
  const [inviteError, setInviteError] = useState<string | null>(null)

  // One-time Claim URL display
  const [createdClaimUrl, setCreatedClaimUrl] = useState<string | null>(null)
  const [createdMaskedContact, setCreatedMaskedContact] = useState<string | null>(null)
  const [copiedUrl, setCopiedUrl] = useState(false)

  // Resend result modal
  const [resendResult, setResendResult] = useState<{ maskedContact: string; claimUrl?: string } | null>(null)
  const [copiedResendUrl, setCopiedResendUrl] = useState(false)

  // Role change dialog
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [selectedStaffForRole, setSelectedStaffForRole] = useState<EventStaffAssignment | null>(null)
  const [selectedNewRole, setSelectedNewRole] = useState("staff")

  // Revoke invitation confirm
  const [revokeTarget, setRevokeTarget] = useState<StaffInvitation | null>(null)

  const handleOpenInvite = () => {
    setPhoneInput("")
    setSelectedRole("staff")
    setExpiresAtInput("")
    setInviteError(null)
    setDialogOpen(true)
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
    toast.success("Staff claim link copied to clipboard")
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteError(null)

    const trimmed = phoneInput.trim()
    if (!trimmed) {
      setInviteError("Phone number is required.")
      return
    }

    if (trimmed.includes("@")) {
      setInviteError("Email invitations are coming in Phase 2; please use an Ethiopian phone number.")
      return
    }

    const normalized = normalizeEthiopianPhone(trimmed)
    if (!normalized || normalized.length < 9) {
      setInviteError("Please enter a valid Ethiopian mobile phone number (e.g. 091 123 4567 or 91 123 4567).")
      return
    }

    try {
      const res = await createInvitation({
        eventId,
        body: {
          staff_invitation: {
            phone: normalized,
            role: selectedRole,
            assignment_expires_at: expiresAtInput ? new Date(expiresAtInput).toISOString() : undefined,
          },
        },
      }).unwrap()

      const claimUrl = normalizeClaimUrl(res?.data?.claim_url)
      const masked = res?.data?.invitation?.masked_contact || normalized

      setDialogOpen(false)
      setCreatedClaimUrl(claimUrl || null)
      setCreatedMaskedContact(masked)
      refetch()
      toast.success("Staff invitation created", {
        description: `Invitation queued for ${masked}.`,
      })
    } catch (err: any) {
      const errorMsg =
        err?.data?.message ||
        err?.data?.error ||
        (err?.data?.errors ? Object.values(err.data.errors).flat().join(", ") : null) ||
        "Failed to send staff invitation"

      if (err?.data?.code === "invitation_already_pending") {
        setInviteError("An invitation is already pending for this phone number.")
      } else if (err?.data?.code === "phone_identity_invalid") {
        setInviteError("Invalid phone number format.")
      } else {
        setInviteError(errorMsg)
      }
    }
  }

  const handleResend = async (invitation: StaffInvitation) => {
    try {
      const res = await resendInvitation({
        eventId,
        id: invitation.id,
      }).unwrap()

      setResendResult({
        maskedContact: invitation.masked_contact,
        claimUrl: normalizeClaimUrl(res?.data?.claim_url),
      })
      refetch()
      toast.success("Staff invitation resent", {
        description: `Fresh one-time link issued for ${invitation.masked_contact}. Old link is expired.`,
      })
    } catch (err: any) {
      toast.error(err?.data?.message || err?.data?.error || "Failed to resend invitation")
    }
  }

  const handleRevokeInvitation = async () => {
    if (!revokeTarget) return
    try {
      await revokeInvitation({
        eventId,
        id: revokeTarget.id,
      }).unwrap()

      toast.success("Staff invitation revoked")
      setRevokeTarget(null)
      refetch()
    } catch (err: any) {
      toast.error(err?.data?.message || err?.data?.error || "Failed to revoke invitation")
    }
  }

  const handleChangeRole = async () => {
    if (!selectedStaffForRole) return
    try {
      await changeStaffRole({
        eventId,
        id: selectedStaffForRole.id,
        role: selectedNewRole,
      }).unwrap()
      toast.success("Staff role updated successfully")
      setRoleDialogOpen(false)
      setSelectedStaffForRole(null)
      refetch()
    } catch (err: any) {
      toast.error(formatApiErrorMessage(err, "Failed to update staff role"))
    }
  }

  const handleToggleSuspend = async (assignment: EventStaffAssignment) => {
    try {
      if (assignment.status === "suspended") {
        await activateStaff({ eventId, id: assignment.id }).unwrap()
        toast.success("Staff assignment reactivated")
      } else {
        await suspendStaff({ eventId, id: assignment.id }).unwrap()
        toast.success("Staff assignment suspended")
      }
      refetch()
    } catch (err: any) {
      toast.error(err?.data?.message || err?.data?.error || "Failed to update staff status")
    }
  }

  const handleRevokeAssignment = async (id: string) => {
    try {
      await revokeStaff({ eventId, id }).unwrap()
      toast.success("Staff assignment revoked")
      refetch()
    } catch (err: any) {
      toast.error(err?.data?.message || err?.data?.error || "Failed to revoke staff assignment")
    }
  }

  const pendingCount = invitations.filter((i) => i.status === "pending").length

  return (
    <div className="space-y-6">
      <Card className="border border-border/70 shadow-2xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 sm:p-6 border-b border-border/60">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <HugeiconsIcon icon={UserGroupIcon} className="size-4.5 text-primary" />
              Event Crew & Staff Roster
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Invite onsite managers and support staff using verified mobile numbers. Scanners continue to use dedicated device pairing.
            </CardDescription>
          </div>

          <Button onClick={handleOpenInvite} className="gap-2 text-xs shrink-0 shadow-xs">
            <HugeiconsIcon icon={Add01Icon} className="size-4" strokeWidth={2.5} />
            Invite Staff Member
          </Button>
        </CardHeader>

        {/* Tab Switcher */}
        <div className="px-5 pt-3 border-b border-border/60 flex items-center gap-2 bg-muted/10">
          <button
            onClick={() => setActiveTab("assignments")}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition-all ${
              activeTab === "assignments"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Active Staff ({assignments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("invitations")}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition-all ${
              activeTab === "invitations"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <HugeiconsIcon icon={Clock01Icon} className="size-3.5" />
            <span>Pending Invitations</span>
            {pendingCount > 0 && (
              <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-400 font-mono">
                {pendingCount}
              </Badge>
            )}
          </button>
        </div>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : activeTab === "assignments" ? (
            assignments.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="mx-auto size-12 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground">
                  <HugeiconsIcon icon={UserGroupIcon} className="size-6" />
                </div>
                <p className="text-sm font-semibold text-foreground">No staff members assigned yet</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Invite floor staff and managers using their phone number to assist with onsite operations.
                </p>
                <Button size="sm" onClick={handleOpenInvite} className="shadow-xs text-xs">
                  Invite First Staff Member
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {assignments.map((assignment) => {
                  const roleConfig = ROLES.find((r) => r.value === assignment.role)
                  return (
                    <div key={assignment.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="size-10 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-bold shrink-0">
                          <HugeiconsIcon icon={Shield01Icon} className="size-4.5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-foreground truncate">
                              {assignment.user?.phone || assignment.user?.email || `Staff: ${assignment.id.slice(0, 8)}`}
                            </span>
                            <Badge variant={roleConfig?.badge as any || "outline"} className="text-[10px] capitalize font-bold">
                              {roleConfig?.label || assignment.role}
                            </Badge>
                            {assignment.status === "active" ? (
                              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-amber-500/30 text-amber-600 text-[10px]">
                                {assignment.status}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Assigned {formatDate(assignment.created_at)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedStaffForRole(assignment)
                            setSelectedNewRole(assignment.role)
                            setRoleDialogOpen(true)
                          }}
                          className="text-xs h-8 gap-1.5"
                        >
                          <HugeiconsIcon icon={Edit01Icon} className="size-3" />
                          Change Role
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="size-8 p-0">
                              <HugeiconsIcon icon={MoreVerticalIcon} className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleToggleSuspend(assignment)}>
                              {assignment.status === "suspended" ? "Activate Staff" : "Suspend Staff"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleRevokeAssignment(assignment.id)} className="text-destructive font-medium">
                              Revoke Assignment
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          ) : (
            invitations.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="mx-auto size-12 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground">
                  <HugeiconsIcon icon={Clock01Icon} className="size-6" />
                </div>
                <p className="text-sm font-semibold text-foreground">No pending staff invitations</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  All invited crew members have claimed their assignments or no invitations are outstanding.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {invitations.map((invitation) => (
                  <div key={invitation.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="size-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shrink-0">
                        <HugeiconsIcon icon={SmartPhone01Icon} className="size-4.5" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm font-mono text-foreground">
                            {invitation.masked_contact}
                          </span>
                          <Badge className="text-[10px] capitalize font-bold">
                            {invitation.role}
                          </Badge>
                          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px]">
                            Pending Claim
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Expires: {invitation.expires_at ? formatDate(invitation.expires_at) : "7 days"}
                          {invitation.assignment_expires_at && ` • Assignment until ${formatDate(invitation.assignment_expires_at)}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResend(invitation)}
                        disabled={isResending}
                        className="text-xs h-8 gap-1.5"
                      >
                        <HugeiconsIcon icon={RefreshIcon} className="size-3" />
                        Resend Link
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRevokeTarget(invitation)}
                        className="size-8 p-0 text-destructive hover:bg-destructive/10"
                      >
                        <HugeiconsIcon icon={Delete02Icon} className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </CardContent>
      </Card>

      {/* Invite Staff Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <HugeiconsIcon icon={Add01Icon} className="size-5 text-primary" strokeWidth={2.5} />
              Invite Event Staff
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Invite a staff member or manager using their Ethiopian mobile number.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleInvite} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Mobile Phone Number *</Label>
              <PhoneInput
                value={phoneInput}
                onChange={(e) => {
                  setPhoneInput(e.target.value)
                  setInviteError(null)
                }}
                placeholder="91 123 4567"
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground">
                Phase 1 is phone-only. Recipient must claim with an account matching this number.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Operational Role *</Label>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as any)}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value} className="text-xs">
                      <div>
                        <span className="font-semibold">{role.label}</span>
                        <p className="text-[11px] text-muted-foreground">{role.description}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Assignment Expiry (Optional)</Label>
              <Input
                type="datetime-local"
                value={expiresAtInput}
                onChange={(e) => setExpiresAtInput(e.target.value)}
                className="text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                Leave empty for ongoing assignment until manually revoked.
              </p>
            </div>

            {inviteError && (
              <div className="p-3 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-start gap-2">
                <HugeiconsIcon icon={AlertCircleIcon} className="size-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{inviteError}</span>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating} className="text-xs font-semibold gap-1.5 shadow-xs">
                {isCreating ? <HugeiconsIcon icon={Loading03Icon} className="size-3.5 animate-spin" /> : null}
                {isCreating ? "Inviting..." : "Send Staff Invitation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Success Link Modal */}
      <Dialog open={Boolean(createdClaimUrl)} onOpenChange={(open) => !open && setCreatedClaimUrl(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-5 text-emerald-500" />
              Staff Invitation Created
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              An invitation was queued for <strong className="text-foreground">{createdMaskedContact}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div className="rounded-xl border border-border/70 bg-muted/30 p-3.5 space-y-2">
              <Label className="text-xs font-semibold flex items-center justify-between">
                <span>One-Time Staff Claim Link</span>
                <span className="text-[11px] text-amber-600 font-normal">Shown only once</span>
              </Label>
              <div className="flex items-center gap-2">
                <Input readOnly value={createdClaimUrl || ""} className="font-mono text-xs h-9 bg-card select-all" />
                <Button onClick={() => createdClaimUrl && handleCopyLink(createdClaimUrl)} className="shrink-0 gap-1.5 h-9 text-xs">
                  <HugeiconsIcon icon={copiedUrl ? Tick02Icon : Copy01Icon} className="size-3.5" />
                  {copiedUrl ? "Copied!" : "Copy Link"}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button onClick={() => setCreatedClaimUrl(null)} className="text-xs">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resend Link Modal */}
      <Dialog open={Boolean(resendResult)} onOpenChange={(open) => !open && setResendResult(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <HugeiconsIcon icon={RefreshIcon} className="size-5 text-primary" />
              Token Rotated & Resent
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              New claim link issued for <strong className="text-foreground">{resendResult?.maskedContact}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            {resendResult?.claimUrl && (
              <div className="rounded-xl border border-border/70 bg-muted/30 p-3.5 space-y-2">
                <Label className="text-xs font-semibold">New Claim Link</Label>
                <div className="flex items-center gap-2">
                  <Input readOnly value={resendResult.claimUrl} className="font-mono text-xs h-9 bg-card select-all" />
                  <Button onClick={() => handleCopyLink(resendResult.claimUrl!, true)} className="shrink-0 gap-1.5 h-9 text-xs">
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

      {/* Revoke Invitation Modal */}
      <Dialog open={Boolean(revokeTarget)} onOpenChange={(open) => !open && setRevokeTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
              <HugeiconsIcon icon={AlertCircleIcon} className="size-5" />
              Revoke Staff Invitation
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to revoke this invitation for <strong className="text-foreground">{revokeTarget?.masked_contact}</strong>?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setRevokeTarget(null)} className="text-xs">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRevokeInvitation} disabled={isRevokingInvite} className="text-xs font-semibold">
              {isRevokingInvite ? "Revoking..." : "Confirm Revoke"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Change Staff Role</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update operational role for {selectedStaffForRole?.user?.phone || selectedStaffForRole?.user?.email || "this staff member"}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Select Role</Label>
              <Select value={selectedNewRole} onValueChange={setSelectedNewRole}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value} className="text-xs">
                      <div>
                        <span className="font-semibold">{role.label}</span>
                        <p className="text-[11px] text-muted-foreground">{role.description}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button onClick={handleChangeRole} disabled={isChangingRole} className="text-xs font-semibold shadow-xs">
              {isChangingRole ? "Saving..." : "Save Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
