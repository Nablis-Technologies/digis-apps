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
import { HugeiconsIcon } from "@hugeicons/react"
import {
  UserGroupIcon,
  Add01Icon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  Loading03Icon,
  Shield01Icon,
  QrCodeIcon,
  MoreVerticalIcon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons"
import {
  useListStaffAssignmentsQuery,
  useCreateStaffAssignmentMutation,
  useDeleteStaffAssignmentMutation,
  useSuspendStaffAssignmentMutation,
  useActivateStaffAssignmentMutation,
  useRevokeStaffAssignmentMutation,
  type EventStaffAssignment,
} from "@workspace/store/reducers/eventScheduleApi"
import { useListOwnerMembershipsQuery } from "@workspace/store/reducers/membershipsApi"
import { formatDate } from "@/lib/utils"

interface StaffTabProps {
  eventId: string
  organizationId?: string
}

const ROLES = [
  { value: "manager", label: "Event Manager", description: "Full onsite event control & credential overrides", badge: "default" },
  { value: "scanner", label: "Gate Scanner", description: "QR code check-in & gate access validation", badge: "secondary" },
  { value: "staff", label: "Floor Staff", description: "General venue support, box office & information", badge: "outline" },
  { value: "contractor", label: "Contractor / Security", description: "Temporary security or external production crew", badge: "secondary" },
]

export function StaffTab({ eventId, organizationId }: StaffTabProps) {
  const { data: staffData, isLoading, refetch } = useListStaffAssignmentsQuery({ eventId })
  const assignments: EventStaffAssignment[] = staffData?.data || []

  const { data: membershipsData } = useListOwnerMembershipsQuery(
    { organizationId: organizationId || "" },
    { skip: !organizationId }
  )
  const teamMembers = membershipsData?.data || []

  const [createStaff, { isLoading: isCreating }] = useCreateStaffAssignmentMutation()
  const [deleteStaff] = useDeleteStaffAssignmentMutation()
  const [suspendStaff] = useSuspendStaffAssignmentMutation()
  const [activateStaff] = useActivateStaffAssignmentMutation()
  const [revokeStaff] = useRevokeStaffAssignmentMutation()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState("")
  const [customUserId, setCustomUserId] = useState("")
  const [selectedRole, setSelectedRole] = useState("scanner")

  const handleAssign = async () => {
    const targetUserId = selectedUserId || customUserId.trim()
    if (!targetUserId) {
      toast.error("Please select a team member or enter a user ID")
      return
    }

    try {
      await createStaff({
        eventId,
        body: {
          event_staff_assignment: {
            user_id: targetUserId,
            role: selectedRole,
          },
        },
      }).unwrap()

      toast.success("Staff member assigned to event")
      setDialogOpen(false)
      setSelectedUserId("")
      setCustomUserId("")
      setSelectedRole("scanner")
    } catch (err: any) {
      toast.error(err?.data?.message || err?.data?.error || "Failed to assign staff member")
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
    } catch (err: any) {
      toast.error(err?.data?.message || err?.data?.error || "Failed to update staff status")
    }
  }

  const handleRevoke = async (id: string) => {
    try {
      await revokeStaff({ eventId, id }).unwrap()
      toast.success("Staff assignment revoked")
    } catch (err: any) {
      toast.error(err?.data?.message || err?.data?.error || "Failed to revoke staff assignment")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteStaff({ eventId, id }).unwrap()
      toast.success("Staff unassigned")
    } catch (err: any) {
      toast.error(err?.data?.message || err?.data?.error || "Failed to unassign staff")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">Active</Badge>
      case "suspended":
        return <Badge variant="outline" className="border-amber-500/30 text-amber-600 dark:text-amber-400">Suspended</Badge>
      case "revoked":
        return <Badge variant="destructive">Revoked</Badge>
      default:
        return <Badge variant="secondary" className="capitalize">{status}</Badge>
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "manager":
        return <HugeiconsIcon icon={Shield01Icon} className="size-3.5 text-primary" />
      case "scanner":
        return <HugeiconsIcon icon={QrCodeIcon} className="size-3.5 text-primary" />
      default:
        return <HugeiconsIcon icon={UserGroupIcon} className="size-3.5 text-muted-foreground" />
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Onsite Event Staff & Personnel</h2>
          <p className="text-xs text-muted-foreground">
            Assign and manage gate scanners, box office workers, and event coordinators for onsite operations.
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5 text-xs h-9 shadow-xs"
          onClick={() => setDialogOpen(true)}
        >
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-3.5" />
          Assign Staff Member
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Assigned Event Personnel</CardTitle>
          <CardDescription className="text-xs">
            Staff members authorized to operate scanner terminals or assist attendees at this event.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3 py-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : assignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <HugeiconsIcon icon={UserGroupIcon} className="size-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-base font-semibold">No Staff Assigned Yet</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Assign team members or scanners to grant them check-in access and operational roles for this event.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 gap-1.5 text-xs"
                onClick={() => setDialogOpen(true)}
              >
                <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-3.5" />
                Add First Staff Assignment
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase text-muted-foreground">
                    <th className="pb-3 font-medium">Staff Member</th>
                    <th className="pb-3 font-medium">Role</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Assigned</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {assignments.map((assignment) => {
                    const roleMeta = ROLES.find((r) => r.value === assignment.role)
                    const userIdentifier =
                      assignment.user?.email || assignment.user?.phone || `User (${assignment.user_id.slice(0, 8)}...)`

                    return (
                      <tr key={assignment.id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-3.5 pr-4">
                          <p className="font-semibold text-foreground">{userIdentifier}</p>
                          <p className="text-[11px] font-mono text-muted-foreground">
                            ID: {assignment.user_id}
                          </p>
                        </td>
                        <td className="py-3.5 pr-4">
                          <div className="flex items-center gap-1.5">
                            {getRoleIcon(assignment.role)}
                            <span className="font-medium text-xs capitalize">
                              {roleMeta?.label || assignment.role}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 pr-4">
                          {getStatusBadge(assignment.status)}
                        </td>
                        <td className="py-3.5 pr-4 text-xs text-muted-foreground">
                          {formatDate(assignment.created_at)}
                        </td>
                        <td className="py-3.5 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8">
                                <HugeiconsIcon icon={MoreVerticalIcon} className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleToggleSuspend(assignment)}
                              >
                                {assignment.status === "suspended" ? "Reactivate Staff" : "Suspend Staff"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleRevoke(assignment.id)}
                                className="text-amber-600 dark:text-amber-400"
                              >
                                Revoke Assignment
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(assignment.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                Delete Assignment
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign Staff Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Event Staff</DialogTitle>
            <DialogDescription className="text-xs">
              Grant a team member operational access for attendee check-in and onsite event management.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {teamMembers.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs">Choose From Organization Team</Label>
                <Select
                  value={selectedUserId}
                  onValueChange={(val) => {
                    setSelectedUserId(val)
                    if (val) setCustomUserId("")
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select team member..." />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((m: any) => (
                      <SelectItem key={m.id || m.user_id} value={m.user_id || m.id}>
                        {m.user?.email || m.user?.name || m.user_id} ({m.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="custom-user-id" className="text-xs">
                {teamMembers.length > 0 ? "Or Enter User ID Manually" : "User ID (UUID)"}
              </Label>
              <Input
                id="custom-user-id"
                placeholder="e.g. 018f3a5b-..."
                value={customUserId}
                onChange={(e) => {
                  setCustomUserId(e.target.value)
                  if (e.target.value) setSelectedUserId("")
                }}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Staff Operational Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      <div className="flex flex-col py-0.5">
                        <span className="font-semibold text-xs">{r.label}</span>
                        <span className="text-[11px] text-muted-foreground">{r.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleAssign} disabled={isCreating} className="gap-1.5">
              {isCreating ? (
                <HugeiconsIcon icon={Loading03Icon} className="size-3.5 animate-spin" />
              ) : (
                <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-3.5" />
              )}
              Assign Staff
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
