"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar01Icon,
  PlusSignCircleIcon,
  Edit01Icon,
  Delete01Icon,
  RefreshIcon,
  UserGroupIcon,
  Building01Icon,
  LockKeyIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import { ConfirmDialog } from "@workspace/ui/components/admin/forms/confirm-dialog"
import { toastSuccess, toastError } from "@workspace/ui/lib/toast"
import {
  useListEventDatesQuery,
  useDeleteEventDateMutation,
  useListEventOrganizationsQuery,
  useDeleteEventOrganizationMutation,
  useActivateEventOrganizationMutation,
  useRevokeEventOrganizationMutation,
  useListStaffAssignmentsQuery,
  useDeleteStaffAssignmentMutation,
  useSuspendStaffAssignmentMutation,
  useActivateStaffAssignmentMutation,
  useRevokeStaffAssignmentMutation,
  useListAccessZonesQuery,
  useDeleteAccessZoneMutation,
  type EventDate,
  type AccessZone,
  type EventOrganization,
  type EventStaffAssignment,
} from "@workspace/store/reducers/eventScheduleApi"
import { EventDateDialog } from "@workspace/ui/components/admin/forms/event-date-dialog"
import { EventOrgDialog } from "@workspace/ui/components/admin/forms/event-org-dialog"
import { StaffAssignmentDialog } from "@workspace/ui/components/admin/forms/staff-assignment-dialog"
import { AccessZoneDialog } from "@workspace/ui/components/admin/forms/access-zone-dialog"

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

const statusBadge = (status: string) => (
  <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", status === "active" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" : status === "suspended" || status === "revoked" ? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400" : "bg-zinc-50 text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-500")}>
    {status}
  </span>
)

export function ScheduleTab({ eventId }: { eventId: string }) {
  const [dateDialogOpen, setDateDialogOpen] = useState(false)
  const [editingDate, setEditingDate] = useState<EventDate | null>(null)
  const [zoneDialogOpen, setZoneDialogOpen] = useState(false)
  const [editingZone, setEditingZone] = useState<AccessZone | null>(null)
  const [confirmDate, setConfirmDate] = useState<EventDate | null>(null)
  const [confirmZone, setConfirmZone] = useState<AccessZone | null>(null)

  const { data: datesData, isLoading: datesLoading, isFetching: datesFetching, refetch: refetchDates } = useListEventDatesQuery({ eventId, params: { page: 1, per_page: 50 } })
  const { data: zonesData, isLoading: zonesLoading, isFetching: zonesFetching, refetch: refetchZones } = useListAccessZonesQuery({ eventId, params: { page: 1, per_page: 50 } })
  const [deleteDate] = useDeleteEventDateMutation()
  const [deleteZone] = useDeleteAccessZoneMutation()

  const dates = datesData?.data ?? []
  const zones = zonesData?.data ?? []

  async function handleDeleteDate() {
    if (!confirmDate) return
    try {
      await deleteDate({ eventId, id: confirmDate.id }).unwrap()
      toastSuccess("Event date deleted.")
      setConfirmDate(null)
    } catch (err) {
      toastError(err, "Failed to delete event date.")
    }
  }

  async function handleDeleteZone() {
    if (!confirmZone) return
    try {
      await deleteZone({ eventId, id: confirmZone.id }).unwrap()
      toastSuccess("Access zone deleted.")
      setConfirmZone(null)
    } catch (err) {
      toastError(err, "Failed to delete access zone.")
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Calendar01Icon} strokeWidth={2} className="size-4 text-muted-foreground" />
            <h3 className="font-semibold">Event Dates</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetchDates()}>
              <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className="size-4" />Refresh
            </Button>
            <Button size="sm" onClick={() => { setEditingDate(null); setDateDialogOpen(true) }}>
              <HugeiconsIcon icon={PlusSignCircleIcon} strokeWidth={2} className="size-4" />Add Date
            </Button>
          </div>
        </div>
        {datesLoading || datesFetching ? (
          <p className="text-sm text-muted-foreground">Loading dates...</p>
        ) : dates.length === 0 ? (
          <p className="text-sm text-muted-foreground">No dates scheduled for this event.</p>
        ) : (
          <div className="space-y-2">
            {dates.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{d.name || "Unnamed date"}</p>
                  <p className="text-xs text-muted-foreground">
                    {fmt(d.starts_at)} — {fmt(d.ends_at)} · {d.venue ? `${d.venue.name}${d.venue.city ? `, ${d.venue.city}` : ""} · ` : ""}{statusBadge(d.status)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => { setEditingDate(d); setDateDialogOpen(true) }} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground">
                    <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} className="size-3.5" />
                  </button>
                  <button type="button" onClick={() => setConfirmDate(d)} className="flex size-7 items-center justify-center rounded-md text-destructive hover:bg-destructive/10">
                    <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={LockKeyIcon} strokeWidth={2} className="size-4 text-muted-foreground" />
            <h3 className="font-semibold">Access Zones</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetchZones()}>
              <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className="size-4" />Refresh
            </Button>
            <Button size="sm" onClick={() => { setEditingZone(null); setZoneDialogOpen(true) }}>
              <HugeiconsIcon icon={PlusSignCircleIcon} strokeWidth={2} className="size-4" />Add Zone
            </Button>
          </div>
        </div>
        {zonesLoading || zonesFetching ? (
          <p className="text-sm text-muted-foreground">Loading zones...</p>
        ) : zones.length === 0 ? (
          <p className="text-sm text-muted-foreground">No access zones defined.</p>
        ) : (
          <div className="space-y-2">
            {zones.map((z) => (
              <div key={z.id} className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{z.name} <span className="ml-1 font-mono text-xs text-muted-foreground">/{z.code}</span></p>
                  <p className="text-xs text-muted-foreground capitalize">{z.type} · {z.active ? "Active" : "Inactive"}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => { setEditingZone(z); setZoneDialogOpen(true) }} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground">
                    <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} className="size-3.5" />
                  </button>
                  <button type="button" onClick={() => setConfirmZone(z)} className="flex size-7 items-center justify-center rounded-md text-destructive hover:bg-destructive/10">
                    <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <EventDateDialog open={dateDialogOpen} onOpenChange={setDateDialogOpen} eventId={eventId} eventDate={editingDate} />
      <AccessZoneDialog open={zoneDialogOpen} onOpenChange={setZoneDialogOpen} eventId={eventId} zone={editingZone} />
      <ConfirmDialog
        open={!!confirmDate}
        onOpenChange={(o) => { if (!o) setConfirmDate(null) }}
        title="Delete Event Date"
        description={`Delete this event date?`}
        confirmLabel="Delete"
        onConfirm={handleDeleteDate}
      />
      <ConfirmDialog
        open={!!confirmZone}
        onOpenChange={(o) => { if (!o) setConfirmZone(null) }}
        title="Delete Access Zone"
        description={`Delete this access zone?`}
        confirmLabel="Delete"
        onConfirm={handleDeleteZone}
      />
    </div>
  )
}

export function TeamTab({ eventId }: { eventId: string }) {
  const [orgDialogOpen, setOrgDialogOpen] = useState(false)
  const [editingOrg, setEditingOrg] = useState<EventOrganization | null>(null)
  const [staffDialogOpen, setStaffDialogOpen] = useState(false)

  const { data: orgsData, isLoading: orgsLoading, isFetching: orgsFetching, refetch: refetchOrgs } = useListEventOrganizationsQuery({ eventId, params: { page: 1, per_page: 50 } })
  const { data: staffData, isLoading: staffLoading, isFetching: staffFetching, refetch: refetchStaff } = useListStaffAssignmentsQuery({ eventId, params: { page: 1, per_page: 50 } })
  const [deleteOrg] = useDeleteEventOrganizationMutation()
  const [activateOrg] = useActivateEventOrganizationMutation()
  const [revokeOrg] = useRevokeEventOrganizationMutation()
  const [deleteStaff] = useDeleteStaffAssignmentMutation()
  const [suspendStaff] = useSuspendStaffAssignmentMutation()
  const [activateStaff] = useActivateStaffAssignmentMutation()
  const [revokeStaff] = useRevokeStaffAssignmentMutation()

  const orgs = orgsData?.data ?? []
  const staff = staffData?.data ?? []

  async function toggleOrg(p: EventOrganization) {
    try {
      if (p.status === "active") {
        await revokeOrg({ eventId, id: p.id }).unwrap()
        toastSuccess("Event organization revoked.")
      } else {
        await activateOrg({ eventId, id: p.id }).unwrap()
        toastSuccess("Event organization activated.")
      }
    } catch (err) {
      toastError(err, "Failed to update organization status.")
    }
  }

  async function toggleStaff(s: EventStaffAssignment) {
    try {
      if (s.status === "suspended") {
        await activateStaff({ eventId, id: s.id }).unwrap()
        toastSuccess("Staff assignment activated.")
      } else if (s.status === "active") {
        await suspendStaff({ eventId, id: s.id }).unwrap()
        toastSuccess("Staff assignment suspended.")
      } else {
        await activateStaff({ eventId, id: s.id }).unwrap()
        toastSuccess("Staff assignment activated.")
      }
    } catch (err) {
      toastError(err, "Failed to update staff assignment.")
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Building01Icon} strokeWidth={2} className="size-4 text-muted-foreground" />
            <h3 className="font-semibold">Organizations</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetchOrgs()}>
              <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className="size-4" />Refresh
            </Button>
            <Button size="sm" onClick={() => { setEditingOrg(null); setOrgDialogOpen(true) }}>
              <HugeiconsIcon icon={PlusSignCircleIcon} strokeWidth={2} className="size-4" />Add Org
            </Button>
          </div>
        </div>
        {orgsLoading || orgsFetching ? (
          <p className="text-sm text-muted-foreground">Loading organizations...</p>
        ) : orgs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No linked organizations.</p>
        ) : (
          <div className="space-y-2">
            {orgs.map((o) => (
              <div key={o.id} className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{o.organization_id.slice(0, 8)}</p>
                  <p className="text-xs text-muted-foreground capitalize">{o.type} · {o.role.replace(/_/g, " ")} · {statusBadge(o.status)}</p>
                </div>
                <div className="flex items-center gap-1">
                  {o.type !== "owner" && (
                    <button type="button" onClick={() => toggleOrg(o)} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground" title={o.status === "active" ? "Revoke" : "Activate"}>
                      <HugeiconsIcon icon={o.status === "active" ? Delete01Icon : RefreshIcon} strokeWidth={2} className="size-3.5" />
                    </button>
                  )}
                  {o.type !== "owner" && (
                    <button type="button" onClick={() => { setEditingOrg(o); setOrgDialogOpen(true) }} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground">
                      <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} className="size-3.5" />
                    </button>
                  )}
                  {o.type !== "owner" && (
                    <button type="button" onClick={() => deleteOrg({ eventId, id: o.id }).unwrap().then(() => toastSuccess("Event organization removed.")).catch((err) => toastError(err, "Failed to remove organization."))} className="flex size-7 items-center justify-center rounded-md text-destructive hover:bg-destructive/10">
                      <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className="size-4 text-muted-foreground" />
            <h3 className="font-semibold">Staff</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetchStaff()}>
              <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className="size-4" />Refresh
            </Button>
            <Button size="sm" onClick={() => setStaffDialogOpen(true)}>
              <HugeiconsIcon icon={PlusSignCircleIcon} strokeWidth={2} className="size-4" />Assign Staff
            </Button>
          </div>
        </div>
        {staffLoading || staffFetching ? (
          <p className="text-sm text-muted-foreground">Loading staff...</p>
        ) : staff.length === 0 ? (
          <p className="text-sm text-muted-foreground">No staff assigned.</p>
        ) : (
          <div className="space-y-2">
            {staff.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium font-mono">{s.user_id.slice(0, 8)}</p>
                  <p className="text-xs text-muted-foreground capitalize">{s.role} · {statusBadge(s.status)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => toggleStaff(s)} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground" title={s.status === "active" ? "Suspend" : "Activate"}>
                    <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className="size-3.5" />
                  </button>
                  <button type="button" onClick={() => deleteStaff({ eventId, id: s.id }).unwrap().then(() => toastSuccess("Staff assignment removed.")).catch((err) => toastError(err, "Failed to remove staff assignment."))} className="flex size-7 items-center justify-center rounded-md text-destructive hover:bg-destructive/10">
                    <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <EventOrgDialog open={orgDialogOpen} onOpenChange={setOrgDialogOpen} eventId={eventId} org={editingOrg} />
      <StaffAssignmentDialog open={staffDialogOpen} onOpenChange={setStaffDialogOpen} eventId={eventId} />
    </div>
  )
}
