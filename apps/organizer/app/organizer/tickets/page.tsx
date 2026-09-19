"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  TicketIcon,
  Ticket01Icon,
  UserGroupIcon,
  Calendar03Icon,
  SearchIcon,
  ArrowDown01Icon,
  MoreVerticalIcon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils"
import { useListOwnerOrganizationsQuery } from "@workspace/store/reducers/organizationsApi"
import { useActiveOrganization } from "../../../providers/organization-provider"
import { useListEventsQuery } from "@workspace/store/reducers/organizerEventsApi"
import {
  useListEventProductsQuery,
  useActivateEventProductMutation,
  useDeactivateEventProductMutation,
  type EventProduct,
} from "@workspace/store/reducers/ticketingApi"
import {
  useListScannerDevicesQuery,
  useRotateScannerTokenMutation,
  useRevokeScannerDeviceMutation,
  type ScannerDevice,
} from "@workspace/store/reducers/attendeesApi"
import { IssueComplimentaryDialog } from "@/organizer-components/tickets/issue-complimentary-dialog"
import { RequestExportDialog } from "@/organizer-components/tickets/request-export-dialog"

export default function TicketsPage() {
  const [selectedEventId, setSelectedEventId] = useState<string>("all")
  const [activeTab, setActiveTab] = useState<string>("tiers")
  const [complimentaryDialogOpen, setComplimentaryDialogOpen] = useState<boolean>(false)
  const [exportDialogOpen, setExportDialogOpen] = useState<boolean>(false)

  // Scanner actions state
  const [tokenResult, setTokenResult] = useState<{ open: boolean; deviceName: string; token: string }>({
    open: false,
    deviceName: "",
    token: "",
  })
  const [revokeModal, setRevokeModal] = useState<{ open: boolean; deviceId: string; deviceName: string; reason: string }>({
    open: false,
    deviceId: "",
    deviceName: "",
    reason: "",
  })

  // 1. Active Organization from context
  const { activeOrg, activeOrgId, isLoading: isLoadingOrgs } = useActiveOrganization()
  const organizationId = activeOrgId || activeOrg?.id

  // 2. Fetch Events scoped to active organization
  const { data: eventsData, isLoading: isLoadingEvents } = useListEventsQuery({
    page: 1,
    per_page: 50,
  })
  const allEvents: any[] = (eventsData?.data as any[]) ?? []
  const events: any[] = useMemo(() => {
    if (!organizationId) return allEvents
    return allEvents.filter((e) => (e.organization_id ?? e.organization?.id) === organizationId)
  }, [allEvents, organizationId])

  // Current filtered event ID
  const effectiveEventId = selectedEventId === "all" ? events[0]?.id : selectedEventId

  // 3. Fetch Event Products for active event
  const {
    data: productsData,
    isLoading: isLoadingProducts,
  } = useListEventProductsQuery(
    { eventId: effectiveEventId ?? "" },
    { skip: !effectiveEventId }
  )
  const products: EventProduct[] = productsData?.data ?? []

  // 4. Fetch Scanner Devices for the organization
  const {
    data: scannersData,
    isLoading: isLoadingScanners,
  } = useListScannerDevicesQuery(organizationId ?? "", {
    skip: !organizationId,
  })
  const scannerDevices: ScannerDevice[] = Array.isArray(scannersData?.data) ? scannersData.data : []

  // Mutations
  const [activateProduct] = useActivateEventProductMutation()
  const [deactivateProduct] = useDeactivateEventProductMutation()
  const [rotateScannerToken, { isLoading: isRotatingToken }] = useRotateScannerTokenMutation()
  const [revokeDevice, { isLoading: isRevokingDevice }] = useRevokeScannerDeviceMutation()

  // Handler: Toggle Product Active State
  const handleToggleProductStatus = async (product: EventProduct) => {
    if (!effectiveEventId) return
    try {
      if (product.status === "active") {
        await deactivateProduct({ eventId: effectiveEventId, id: product.id }).unwrap()
        toast.success(`"${product.name}" deactivated`)
      } else {
        await activateProduct({ eventId: effectiveEventId, id: product.id }).unwrap()
        toast.success(`"${product.name}" activated`)
      }
    } catch {
      toast.error("Failed to update product status")
    }
  }

  // Handler: Rotate Scanner Token
  const handleRotateToken = async (device: ScannerDevice) => {
    try {
      const res = await rotateScannerToken({
        deviceId: device.id,
        organizationId,
      }).unwrap()
      const newToken = res.data?.token || "TOKEN_ROTATED"
      setTokenResult({
        open: true,
        deviceName: device.name || device.device_identifier,
        token: newToken,
      })
      toast.success("Scanner token rotated successfully")
    } catch {
      toast.error("Failed to rotate token for this scanner")
    }
  }

  // Handler: Revoke Scanner Device
  const handleConfirmRevoke = async () => {
    if (!revokeModal.deviceId || !revokeModal.reason.trim()) {
      toast.error("Please provide a reason for revoking access")
      return
    }
    try {
      await revokeDevice({
        deviceId: revokeModal.deviceId,
        reason: revokeModal.reason,
        organizationId,
      }).unwrap()
      toast.success(`Device "${revokeModal.deviceName}" revoked`)
      setRevokeModal({ open: false, deviceId: "", deviceName: "", reason: "" })
    } catch {
      toast.error("Failed to revoke device")
    }
  }

  // Computed metrics
  const activeTiersCount = products.filter((p) => p.status === "active").length
  const totalTiersCount = products.length
  const activeScannersCount = scannerDevices.filter((d) => d.status === "active").length

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page Header & Controls ────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tickets & Gate Operations</h1>
          <p className="text-sm text-muted-foreground">
            Admission tiers, complimentary gift passes, door scanner pairings, and attendee data.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Event Switcher */}
          {events.length > 0 && (
            <Select
              value={selectedEventId}
              onValueChange={(val) => setSelectedEventId(val)}
            >
              <SelectTrigger className="w-[190px] h-9">
                <SelectValue placeholder="Select event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">First Available Event</SelectItem>
                {events.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Action CTAs */}
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setExportDialogOpen(true)}
            disabled={!effectiveEventId}
          >
            <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} className="size-4" />
            Export Attendees
          </Button>

          <Button
            size="sm"
            className="gap-2"
            onClick={() => setComplimentaryDialogOpen(true)}
          >
            <HugeiconsIcon icon={Ticket01Icon} strokeWidth={2} className="size-4" />
            Gift Tickets
          </Button>
        </div>
      </div>

      {/* ── Top Metrics ────────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Active Tiers</span>
            <div className="flex size-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <HugeiconsIcon icon={Ticket01Icon} strokeWidth={2} className="size-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold">
            {isLoadingProducts ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              `${activeTiersCount} / ${totalTiersCount}`
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Published ticket types</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Gate Scanners</span>
            <div className="flex size-7 items-center justify-center rounded-md bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
              <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className="size-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold">
            {isLoadingScanners ? (
              <Skeleton className="h-7 w-12" />
            ) : (
              formatNumber(activeScannersCount)
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Active door devices paired</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Event Schedule</span>
            <div className="flex size-7 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
              <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold truncate">
            {isLoadingEvents ? (
              <Skeleton className="h-7 w-24" />
            ) : events.find((e) => e.id === effectiveEventId)?.status ? (
              <Badge variant="outline" className="text-xs font-normal capitalize">
                {events.find((e) => e.id === effectiveEventId)?.status}
              </Badge>
            ) : (
              "Live"
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground truncate">
            {events.find((e) => e.id === effectiveEventId)?.title ?? "Selected event"}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Zero-Charge Passes</span>
            <div className="flex size-7 items-center justify-center rounded-md bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
              <HugeiconsIcon icon={TicketIcon} strokeWidth={2} className="size-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold">Complimentary</div>
          <p className="mt-1 text-xs text-muted-foreground">VIP, Sponsor & Speaker allocation</p>
        </Card>
      </div>

      {/* ── Interactive Navigation Tabs ───────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full sm:w-auto">
          <TabsTrigger value="tiers">Ticket Tiers</TabsTrigger>
          <TabsTrigger value="complimentary">Complimentary</TabsTrigger>
          <TabsTrigger value="scanners">Gate Scanners</TabsTrigger>
          <TabsTrigger value="exports">Attendee Exports</TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: TICKET TIERS & PRODUCTS ──────────────────────────────── */}
        <TabsContent value="tiers" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Admission Tiers & Products</CardTitle>
                  <CardDescription>
                    Configure ticket pricing, sales windows, and entry conditions.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setComplimentaryDialogOpen(true)}
                >
                  Gift Ticket
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingProducts ? (
                <div className="space-y-3 py-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                    <HugeiconsIcon icon={Ticket01Icon} className="size-6 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold">No Ticket Tiers Configured</h3>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    Create ticket tiers in Event Settings or publish a tier to start receiving registrations.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b text-xs uppercase text-muted-foreground">
                        <th className="pb-3 font-medium">Tier Name</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Type</th>
                        <th className="pb-3 font-medium">Admissions</th>
                        <th className="pb-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {products.map((p) => {
                        const isActive = p.status === "active"
                        return (
                          <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                            <td className="py-3.5 pr-4">
                              <p className="font-semibold text-foreground">{p.name}</p>
                              {p.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {p.description}
                                </p>
                              )}
                            </td>
                            <td className="py-3.5 pr-4">
                              <Badge
                                variant={isActive ? "default" : "secondary"}
                                className={isActive ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : ""}
                              >
                                {p.status.toUpperCase()}
                              </Badge>
                            </td>
                            <td className="py-3.5 pr-4 capitalize text-muted-foreground">
                              {p.type || "Standard"}
                            </td>
                            <td className="py-3.5 pr-4 text-muted-foreground">
                              {p.ticket_type?.admissions_per_unit ?? 1} entry per package
                            </td>
                            <td className="py-3.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-xs"
                                  onClick={() => handleToggleProductStatus(p)}
                                >
                                  {isActive ? "Deactivate" : "Activate"}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs"
                                  onClick={() => {
                                    setComplimentaryDialogOpen(true)
                                  }}
                                >
                                  Gift
                                </Button>
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
        </TabsContent>

        {/* ─── TAB 2: COMPLIMENTARY TICKETS ────────────────────────────────── */}
        <TabsContent value="complimentary" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base">Complimentary Guest Passes</CardTitle>
                  <CardDescription>
                    Directly grant verified zero-cost tickets to VIPs, media partners, artists, and event staff.
                  </CardDescription>
                </div>
                <Button size="sm" onClick={() => setComplimentaryDialogOpen(true)}>
                  Issue New Guest Pass
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    VIP & Artists
                  </span>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Issue all-access or VIP wristband vouchers directly to artist managers and honored guests via SMS.
                  </p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Press & Media
                  </span>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Accredit journalists and content creators with zero checkout delay, ensuring accurate admission auditing.
                  </p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Sponsors & Staff
                  </span>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Fulfill contract allocation quotas with full traceability and instant gate scanner verification.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB 3: GATE SCANNERS & ACCESS CONTROL ───────────────────────── */}
        <TabsContent value="scanners" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base">Gate Check-in Devices</CardTitle>
                  <CardDescription>
                    Manage authorized volunteer and door staff smartphone scanners paired with your organization.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingScanners ? (
                <div className="space-y-3 py-4">
                  {[...Array(2)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : scannerDevices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                    <HugeiconsIcon icon={UserGroupIcon} className="size-6 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold">No Scanner Devices Paired Yet</h3>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    Door volunteers pair via the Digis Scanner Mobile App. Paired devices appear here with real-time audit control.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b text-xs uppercase text-muted-foreground">
                        <th className="pb-3 font-medium">Device Identifier</th>
                        <th className="pb-3 font-medium">Name</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Last Synced</th>
                        <th className="pb-3 font-medium text-right">Security Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {scannerDevices.map((device) => {
                        const isRevoked = device.status === "revoked"
                        return (
                          <tr key={device.id} className="hover:bg-muted/40 transition-colors">
                            <td className="py-3.5 pr-4 font-mono text-xs">
                              {device.device_identifier}
                            </td>
                            <td className="py-3.5 pr-4 font-medium">
                              {device.name || "Door Scanner"}
                            </td>
                            <td className="py-3.5 pr-4">
                              <Badge
                                variant={isRevoked ? "destructive" : "default"}
                                className={!isRevoked ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : ""}
                              >
                                {device.status.toUpperCase()}
                              </Badge>
                            </td>
                            <td className="py-3.5 pr-4 text-xs text-muted-foreground">
                              {device.last_seen_at ? formatDate(device.last_seen_at) : "Never"}
                            </td>
                            <td className="py-3.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {!isRevoked && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 text-xs"
                                      disabled={isRotatingToken}
                                      onClick={() => handleRotateToken(device)}
                                    >
                                      Rotate Token
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      className="h-8 text-xs"
                                      onClick={() =>
                                        setRevokeModal({
                                          open: true,
                                          deviceId: device.id,
                                          deviceName: device.name || device.device_identifier,
                                          reason: "",
                                        })
                                      }
                                    >
                                      Revoke
                                    </Button>
                                  </>
                                )}
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
        </TabsContent>

        {/* ─── TAB 4: ATTENDEE EXPORTS ─────────────────────────────────────── */}
        <TabsContent value="exports" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base">Attendee Data & CSV Exports</CardTitle>
                  <CardDescription>
                    Export complete attendee rosters, contact lists, and ticket package data for gate operations.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => setExportDialogOpen(true)}
                  disabled={!effectiveEventId}
                >
                  <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} className="size-4 mr-2" />
                  Request New Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-dashed border-border p-6 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 mx-auto">
                  <HugeiconsIcon icon={ArrowDown01Icon} className="size-6" />
                </div>
                <h3 className="mt-4 text-base font-semibold">Ready to generate your attendee roster</h3>
                <p className="mt-1 max-w-md mx-auto text-xs text-muted-foreground">
                  Attendee exports are generated asynchronously with cryptographic checksum verification to ensure compliance with privacy regulations.
                </p>
                <div className="mt-5 flex justify-center">
                  <Button
                    size="sm"
                    onClick={() => setExportDialogOpen(true)}
                    disabled={!effectiveEventId}
                  >
                    Configure & Request Export
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Rotate Token Result Dialog ────────────────────────────────────── */}
      <Dialog
        open={tokenResult.open}
        onOpenChange={(val) => setTokenResult((prev) => ({ ...prev, open: val }))}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Scanner Pairing Token</DialogTitle>
            <DialogDescription>
              Provide this token to the gate operator for <strong>{tokenResult.deviceName}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-3">
            <Label>Authentication Token</Label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={tokenResult.token}
                className="font-mono text-xs select-all bg-muted"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(tokenResult.token)
                  toast.success("Token copied to clipboard")
                }}
              >
                Copy
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Previous pairing credentials for this scanner device have been invalidated.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setTokenResult((prev) => ({ ...prev, open: false }))}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Revoke Scanner Dialog ─────────────────────────────────────────── */}
      <Dialog
        open={revokeModal.open}
        onOpenChange={(val) => setRevokeModal((prev) => ({ ...prev, open: val }))}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Revoke Scanner Device</DialogTitle>
            <DialogDescription>
              Permanently disable access for <strong>{revokeModal.deviceName}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-3">
            <Label htmlFor="revoke-reason">Reason for Revocation</Label>
            <Input
              id="revoke-reason"
              placeholder="e.g., lost phone, volunteer shifted, security check"
              value={revokeModal.reason}
              onChange={(e) =>
                setRevokeModal((prev) => ({ ...prev, reason: e.target.value }))
              }
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRevokeModal((prev) => ({ ...prev, open: false }))}
              disabled={isRevokingDevice}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmRevoke}
              disabled={isRevokingDevice}
            >
              {isRevokingDevice ? "Revoking..." : "Revoke Access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      <IssueComplimentaryDialog
        open={complimentaryDialogOpen}
        onOpenChange={setComplimentaryDialogOpen}
        eventId={effectiveEventId}
      />

      <RequestExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        eventId={effectiveEventId ?? ""}
      />
    </div>
  )
}
