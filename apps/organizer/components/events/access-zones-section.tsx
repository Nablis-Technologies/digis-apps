"use client"

import { useState, useMemo } from "react"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Location01Icon,
  Building02Icon,
  Shield01Icon,
  Add01Icon,
  Edit01Icon,
  Delete02Icon,
  Search01Icon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  Loading03Icon,
  AlertCircleIcon,
  MoreVerticalIcon,
  Calendar03Icon,
  RadioIcon,
} from "@hugeicons/core-free-icons"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@workspace/ui/lib/utils"
import { formatDateTime, formatApiErrorMessage } from "@/lib/utils"
import {
  useListAccessZonesQuery,
  useCreateAccessZoneMutation,
  useUpdateAccessZoneMutation,
  useDeleteAccessZoneMutation,
  type AccessZone,
} from "@workspace/store/reducers/eventScheduleApi"
import type { EventDate } from "@workspace/store/reducers/organizerEventsApi"

interface AccessZonesSectionProps {
  eventId: string
  eventDates?: EventDate[]
}

const ZONE_PRESETS = [
  { name: "VIP Lounge", code: "VIP-LOUNGE", type: "venue", description: "Exclusive hospitality lounge with VIP check-in" },
  { name: "Main Stage Pit", code: "STAGE-PIT", type: "venue", description: "Front-of-stage secured standing area" },
  { name: "Backstage & Green Room", code: "BACKSTAGE", type: "venue", description: "Restricted performer, crew and artist area" },
  { name: "General Admission Floor", code: "GA-FLOOR", type: "venue", description: "General public audience and viewing area" },
  { name: "North Parking Lot", code: "PKG-NORTH", type: "parking", description: "Reserved attendee and vendor vehicle entrance" },
]

export function AccessZonesSection({ eventId, eventDates = [] }: AccessZonesSectionProps) {
  const { data: zonesData, isLoading } = useListAccessZonesQuery({ eventId })
  const zones: AccessZone[] = (zonesData as any)?.data ?? []

  const [createZone, { isLoading: isCreating }] = useCreateAccessZoneMutation()
  const [updateZone, { isLoading: isUpdating }] = useUpdateAccessZoneMutation()
  const [deleteZone, { isLoading: isDeleting }] = useDeleteAccessZoneMutation()

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingZone, setEditingZone] = useState<AccessZone | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [zoneToDelete, setZoneToDelete] = useState<AccessZone | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    type: "venue" as "venue" | "parking",
    event_date_id: "all",
    sort_order: 0,
    active: true,
  })

  // Filtered zones
  const filteredZones = useMemo(() => {
    return zones.filter((zone) => {
      const matchesSearch =
        zone.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        zone.code.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = typeFilter === "all" || zone.type === typeFilter
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && zone.active) ||
        (statusFilter === "inactive" && !zone.active)

      return matchesSearch && matchesType && matchesStatus
    })
  }, [zones, searchQuery, typeFilter, statusFilter])

  // Metrics
  const totalCount = zones.length
  const venueCount = zones.filter((z) => z.type === "venue").length
  const parkingCount = zones.filter((z) => z.type === "parking").length
  const activeCount = zones.filter((z) => z.active).length

  // Open Create Dialog
  const handleOpenCreate = () => {
    setEditingZone(null)
    setFormData({
      name: "",
      code: "",
      type: "venue",
      event_date_id: "all",
      sort_order: zones.length * 10,
      active: true,
    })
    setDialogOpen(true)
  }

  // Open Edit Dialog
  const handleOpenEdit = (zone: AccessZone) => {
    setEditingZone(zone)
    setFormData({
      name: zone.name,
      code: zone.code,
      type: (zone.type === "parking" ? "parking" : "venue"),
      event_date_id: zone.event_date_id || "all",
      sort_order: zone.sort_order ?? 0,
      active: zone.active,
    })
    setDialogOpen(true)
  }

  // Apply Preset
  const handleApplyPreset = (preset: typeof ZONE_PRESETS[number]) => {
    setEditingZone(null)
    setFormData({
      name: preset.name,
      code: preset.code,
      type: preset.type as "venue" | "parking",
      event_date_id: "all",
      sort_order: zones.length * 10,
      active: true,
    })
    setDialogOpen(true)
  }

  // Submit Create or Edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = formData.name.trim()
    const trimmedCode = formData.code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "")

    if (!trimmedName) {
      toast.error("Zone name is required")
      return
    }
    if (!trimmedCode) {
      toast.error("Zone code is required (e.g. VIP-LOUNGE)")
      return
    }

    try {
      if (editingZone) {
        await updateZone({
          eventId,
          id: editingZone.id,
          body: {
            access_zone: {
              name: trimmedName,
              code: trimmedCode,
              type: formData.type,
              event_date_id: formData.event_date_id === "all" ? undefined : formData.event_date_id,
              sort_order: formData.sort_order,
              active: formData.active,
            },
          },
        }).unwrap()
        toast.success(`Access zone "${trimmedName}" updated`)
      } else {
        await createZone({
          eventId,
          body: {
            access_zone: {
              name: trimmedName,
              code: trimmedCode,
              type: formData.type,
              event_date_id: formData.event_date_id === "all" ? undefined : formData.event_date_id,
              sort_order: formData.sort_order,
              active: formData.active,
            },
          },
        }).unwrap()
        toast.success(`Access zone "${trimmedName}" created`)
      }
      setDialogOpen(false)
      setEditingZone(null)
    } catch (err: any) {
      toast.error(formatApiErrorMessage(err, "Failed to save access zone"))
    }
  }

  // Toggle Active
  const handleToggleActive = async (zone: AccessZone) => {
    try {
      await updateZone({
        eventId,
        id: zone.id,
        body: {
          access_zone: {
            active: !zone.active,
          },
        },
      }).unwrap()
      toast.success(zone.active ? `Zone "${zone.name}" deactivated` : `Zone "${zone.name}" activated`)
    } catch (err: any) {
      toast.error(formatApiErrorMessage(err, "Failed to toggle zone status"))
    }
  }

  // Delete
  const handleDelete = async () => {
    if (!zoneToDelete) return
    try {
      await deleteZone({ eventId, id: zoneToDelete.id }).unwrap()
      toast.success(`Access zone "${zoneToDelete.name}" deleted`)
      setDeleteDialogOpen(false)
      setZoneToDelete(null)
    } catch (err: any) {
      toast.error(formatApiErrorMessage(err, "Failed to delete access zone"))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ─── Top Header & Summary ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight">Venue & Credential Access Zones</h2>
            <Badge variant="secondary" className="text-xs px-2 py-0">
              {totalCount}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Define physical venue areas, gates, and parking perimeters for scanner devices and ticket access rules.
          </p>
        </div>
        <Button size="sm" onClick={handleOpenCreate} className="gap-1.5 text-xs h-9 shadow-xs">
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-3.5" />
          New Access Zone
        </Button>
      </div>

      {/* ─── Metrics Cards ─────────────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-4">
        <Card className="p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Zones</span>
            <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
              <HugeiconsIcon icon={Location01Icon} strokeWidth={2} className="size-3.5" />
            </div>
          </div>
          <div className="mt-1.5 text-xl font-bold">{totalCount}</div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Physical perimeter areas</p>
        </Card>

        <Card className="p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Venue Areas</span>
            <div className="flex size-7 items-center justify-center rounded-md bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
              <HugeiconsIcon icon={Building02Icon} strokeWidth={2} className="size-3.5" />
            </div>
          </div>
          <div className="mt-1.5 text-xl font-bold">{venueCount}</div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Stages, lounges & rooms</p>
        </Card>

        <Card className="p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Parking & Transit</span>
            <div className="flex size-7 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
              <HugeiconsIcon icon={RadioIcon} strokeWidth={2} className="size-3.5" />
            </div>
          </div>
          <div className="mt-1.5 text-xl font-bold">{parkingCount}</div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Vehicle gate checkpoints</p>
        </Card>

        <Card className="p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Active Policy</span>
            <div className="flex size-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <HugeiconsIcon icon={Shield01Icon} strokeWidth={2} className="size-3.5" />
            </div>
          </div>
          <div className="mt-1.5 text-xl font-bold">
            {activeCount} / {totalCount}
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Live scanner enforcement</p>
        </Card>
      </div>

      {/* ─── Search and Filter Bar ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <HugeiconsIcon
            icon={Search01Icon}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
          />
          <Input
            placeholder="Search zones by name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-9 w-36 text-xs">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="venue">Venue Areas</SelectItem>
              <SelectItem value="parking">Parking & Transit</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-32 text-xs">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ─── Main Zones Content ────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Configured Access Zones</CardTitle>
          <CardDescription className="text-xs">
            Gate scanners and credential tickets are validated against these physical boundaries.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3 py-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : zones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60 border border-border/60">
                <HugeiconsIcon icon={Location01Icon} className="size-7 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-base font-semibold">No Access Zones Created Yet</h3>
              <p className="mt-1.5 max-w-md text-xs text-muted-foreground">
                Access zones let you partition your event into secured areas (VIP lounge, backstage, pit, parking)
                for scanner authorization and credential tracking.
              </p>
              
              {/* Quick Presets */}
              <div className="mt-6 w-full max-w-xl">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Quick Create with Presets
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                  {ZONE_PRESETS.map((preset) => (
                    <button
                      key={preset.code}
                      onClick={() => handleApplyPreset(preset)}
                      className="flex items-start gap-2.5 p-2.5 rounded-xl border border-border/70 bg-card hover:bg-muted/40 hover:border-primary/40 transition-all text-xs group"
                    >
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                        {preset.type === "parking" ? (
                          <HugeiconsIcon icon={RadioIcon} className="size-3.5" />
                        ) : (
                          <HugeiconsIcon icon={Building02Icon} className="size-3.5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-foreground truncate">{preset.name}</span>
                          <span className="font-mono text-[10px] text-muted-foreground">({preset.code})</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{preset.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <Button size="sm" onClick={handleOpenCreate} className="mt-6 gap-1.5 text-xs">
                <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-3.5" />
                Create Custom Zone
              </Button>
            </div>
          ) : filteredZones.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              No access zones match your search or filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase text-muted-foreground">
                    <th className="pb-3 font-medium">Zone Name & Code</th>
                    <th className="pb-3 font-medium">Zone Type</th>
                    <th className="pb-3 font-medium">Session Scope</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Sort Order</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredZones.map((zone) => {
                    const linkedDate = eventDates.find((d) => d.id === zone.event_date_id)
                    const isVenue = zone.type === "venue"

                    return (
                      <tr key={zone.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 pr-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "flex size-8 shrink-0 items-center justify-center rounded-lg border",
                                isVenue
                                  ? "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border-blue-500/20"
                                  : "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border-amber-500/20"
                              )}
                            >
                              {isVenue ? (
                                <HugeiconsIcon icon={Building02Icon} className="size-4" />
                              ) : (
                                <HugeiconsIcon icon={RadioIcon} className="size-4" />
                              )}
                            </div>
                            <div className="space-y-0.5 min-w-0">
                              <p className="font-semibold text-foreground text-xs truncate">{zone.name}</p>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-semibold">
                                  {zone.code}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 pr-4">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] capitalize font-medium",
                              isVenue
                                ? "border-blue-500/30 text-blue-600 dark:text-blue-400"
                                : "border-amber-500/30 text-amber-600 dark:text-amber-400"
                            )}
                          >
                            {isVenue ? "Venue Area" : "Parking & Transit"}
                          </Badge>
                        </td>

                        <td className="py-3.5 pr-4 text-xs">
                          {linkedDate ? (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <HugeiconsIcon icon={Calendar03Icon} className="size-3.5 text-primary shrink-0" />
                              <span className="truncate max-w-[180px]">
                                {linkedDate.name || formatDateTime(linkedDate.starts_at)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-[11px]">Event-Wide (All Sessions)</span>
                          )}
                        </td>

                        <td className="py-3.5 pr-4">
                          <Badge
                            variant={zone.active ? "default" : "secondary"}
                            className={cn(
                              "text-[10px]",
                              zone.active
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                : "text-muted-foreground"
                            )}
                          >
                            {zone.active ? "Active" : "Inactive"}
                          </Badge>
                        </td>

                        <td className="py-3.5 pr-4 font-mono text-xs text-muted-foreground">
                          {zone.sort_order ?? 0}
                        </td>

                        <td className="py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {zone.active ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-3 text-xs font-medium border-border/80 bg-card hover:bg-muted/60 text-muted-foreground hover:text-foreground shadow-2xs gap-1.5 transition-all"
                                onClick={() => handleToggleActive(zone)}
                                disabled={isUpdating}
                              >
                                <HugeiconsIcon icon={Cancel01Icon} className="size-3.5 text-muted-foreground" />
                                Deactivate
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-3 text-xs font-medium gap-1.5 text-emerald-600 dark:text-emerald-400"
                                onClick={() => handleToggleActive(zone)}
                                disabled={isUpdating}
                              >
                                <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-3.5" />
                                Activate
                              </Button>
                            )}

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="size-8 border-border/80 bg-card shadow-2xs hover:bg-muted/60"
                                >
                                  <HugeiconsIcon icon={MoreVerticalIcon} className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleOpenEdit(zone)}>
                                  <HugeiconsIcon icon={Edit01Icon} className="size-3.5 mr-2" />
                                  Edit Zone
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleActive(zone)}>
                                  <HugeiconsIcon icon={Shield01Icon} className="size-3.5 mr-2" />
                                  {zone.active ? "Mark Inactive" : "Mark Active"}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setZoneToDelete(zone)
                                    setDeleteDialogOpen(true)
                                  }}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <HugeiconsIcon icon={Delete02Icon} className="size-3.5 mr-2" />
                                  Delete Zone
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
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

      {/* ─── Create & Edit Dialog ──────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingZone ? "Edit Access Zone" : "Create Access Zone"}</DialogTitle>
              <DialogDescription className="text-xs">
                {editingZone
                  ? `Update perimeter configuration for "${editingZone.name}".`
                  : "Create a secured area for attendee check-in and credential validation."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="zone-name">Zone Name *</Label>
                <Input
                  id="zone-name"
                  placeholder="e.g. VIP Lounge, Main Floor, Backstage Gate"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value
                    setFormData((prev) => ({
                      ...prev,
                      name,
                      // Auto-suggest code if creating new zone
                      code: !editingZone && !prev.code ? name.toUpperCase().replace(/\s+/g, "-") : prev.code,
                    }))
                  }}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="zone-code">Zone Code *</Label>
                  <Input
                    id="zone-code"
                    placeholder="e.g. VIP-LOUNGE"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""),
                      }))
                    }
                    className="font-mono uppercase"
                    required
                  />
                  <p className="text-[10px] text-muted-foreground">Unique identifier used by scanners</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="zone-type">Zone Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(val: "venue" | "parking") =>
                      setFormData((prev) => ({ ...prev, type: val }))
                    }
                  >
                    <SelectTrigger id="zone-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="venue">Venue / Indoor Area</SelectItem>
                      <SelectItem value="parking">Parking / Transport Gate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="zone-session">Event Session Association (Optional)</Label>
                <Select
                  value={formData.event_date_id}
                  onValueChange={(val) => setFormData((prev) => ({ ...prev, event_date_id: val }))}
                >
                  <SelectTrigger id="zone-session">
                    <SelectValue placeholder="Event-Wide (All Sessions)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Event-Wide (All Sessions)</SelectItem>
                    {eventDates.map((date) => (
                      <SelectItem key={date.id} value={date.id}>
                        {date.name || "Session"} — {formatDateTime(date.starts_at)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">
                  Leave as Event-Wide unless this zone only operates during a specific session.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="zone-order">Sort Order</Label>
                  <Input
                    id="zone-order"
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, sort_order: parseInt(e.target.value, 10) || 0 }))
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Zone Status</Label>
                  <Select
                    value={formData.active ? "active" : "inactive"}
                    onValueChange={(val) => setFormData((prev) => ({ ...prev, active: val === "active" }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active (Enforced)</SelectItem>
                      <SelectItem value="inactive">Inactive (Disabled)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isCreating || isUpdating} className="gap-1.5">
                {isCreating || isUpdating ? (
                  <HugeiconsIcon icon={Loading03Icon} className="size-3.5 animate-spin" />
                ) : (
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-3.5" />
                )}
                {editingZone ? "Save Changes" : "Create Zone"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ────────────────────────────────────── */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-2">
              <HugeiconsIcon icon={AlertCircleIcon} className="size-5" />
            </div>
            <DialogTitle>Delete Access Zone</DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to permanently delete access zone{" "}
              <strong className="text-foreground">&quot;{zoneToDelete?.name}&quot;</strong> ({zoneToDelete?.code})?
              Any scanner terminals or credential passes mapped to this zone will lose access.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setDeleteDialogOpen(false)
                setZoneToDelete(null)
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              onClick={handleDelete}
              className="gap-1.5"
            >
              {isDeleting ? (
                <HugeiconsIcon icon={Loading03Icon} className="size-3.5 animate-spin" />
              ) : (
                <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
              )}
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
