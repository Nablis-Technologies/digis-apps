"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  SmartPhone01Icon,
  RefreshIcon,
  CheckmarkCircle01Icon,
  Copy01Icon,
  AlertCircleIcon,
  RadioIcon,
  InformationCircleIcon,
  Add01Icon,
  QrCodeIcon,
  Shield01Icon,
  Clock01Icon,
  Share01Icon,
  Location01Icon,
  Tick02Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons"
import QRCode from "qrcode"
import { Button } from "@/components/ui/button"
import { Badge, type BadgeVariant } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { formatDate, formatDateTime, formatApiErrorMessage } from "@/lib/utils"
import { PhoneInput, normalizeEthiopianPhone } from "@/components/ui/phone-input"
import {
  useGetScannerRosterQuery,
  useCreateScannerInvitationMutation,
  useResendScannerInvitationMutation,
  useResetScannerPairingMutation,
  useRevokeScannerInvitationMutation,
  useUpdateScannerAssignmentMutation,
  type ScannerRosterInvitation,
  type ScannerRosterAssignment,
  type PairingMaterial,
} from "@workspace/store/reducers/attendeesApi"
import { useListAccessZonesQuery, type AccessZone } from "@workspace/store/reducers/eventScheduleApi"

interface ScannersTabProps {
  eventId?: string
  organizationId?: string
}

export function ScannersTab({ eventId, organizationId }: ScannersTabProps) {
  // ── 1. Data Fetching ──────────────────────────────────────────────────────
  const {
    data: rosterResponse,
    isLoading: isLoadingRoster,
    isFetching: isFetchingRoster,
    refetch: refetchRoster,
  } = useGetScannerRosterQuery(eventId || "", {
    skip: !eventId,
    pollingInterval: 10000, // Poll every 10 seconds for real-time live gate scan counts
  })

  const { data: zonesResponse } = useListAccessZonesQuery(
    { eventId: eventId || "" },
    { skip: !eventId }
  )

  const accessZones: AccessZone[] = useMemo(() => {
    return (zonesResponse as any)?.data ?? []
  }, [zonesResponse])

  const rosterData = rosterResponse?.data
  const activeAssignments: ScannerRosterAssignment[] = rosterData?.assignments ?? []
  const invitations: ScannerRosterInvitation[] = rosterData?.invitations ?? []

  // Split invitations into pending/active/revoked
  const pendingInvitations = useMemo(() => {
    return invitations.filter((inv) => inv.status === "pending" || inv.status === "pairing_reset")
  }, [invitations])

  const archivedInvitations = useMemo(() => {
    return invitations.filter((inv) => inv.status === "expired" || inv.status === "revoked")
  }, [invitations])

  const totalScans = useMemo(() => {
    return activeAssignments.reduce((acc, curr) => acc + (curr.scan_count || 0), 0)
  }, [activeAssignments])

  // ── 2. Mutations ──────────────────────────────────────────────────────────
  const [createScannerInvitation, { isLoading: isCreatingInvite }] = useCreateScannerInvitationMutation()
  const [resendScannerInvitation, { isLoading: isResendingInvite }] = useResendScannerInvitationMutation()
  const [resetScannerPairing, { isLoading: isResettingPairing }] = useResetScannerPairingMutation()
  const [revokeScannerInvitation, { isLoading: isRevokingInvite }] = useRevokeScannerInvitationMutation()
  const [updateScannerAssignment, { isLoading: isUpdatingAssignment }] = useUpdateScannerAssignmentMutation()

  // ── 3. Modal States ───────────────────────────────────────────────────────
  // Invite Modal
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [invitePhone, setInvitePhone] = useState("")
  const [inviteLabel, setInviteLabel] = useState("")
  const [inviteNote, setInviteNote] = useState("")
  const [inviteZoneMode, setInviteZoneMode] = useState<"all_current_zones" | "selected_zones">("all_current_zones")
  const [inviteSelectedZoneIds, setInviteSelectedZoneIds] = useState<string[]>([])

  // Pairing Success Modal
  const [pairingModalOpen, setPairingModalOpen] = useState(false)
  const [activePairingMaterial, setActivePairingMaterial] = useState<PairingMaterial | null>(null)
  const [pairingLabel, setPairingLabel] = useState<string>("")
  const [pairingPhone, setPairingPhone] = useState<string>("")
  const [qrDataUrl, setQrDataUrl] = useState<string>("")
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [countdownSeconds, setCountdownSeconds] = useState<number>(600)

  // Change Zones Modal
  const [changeZonesModalOpen, setChangeZonesModalOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<ScannerRosterAssignment | null>(null)
  const [editZoneMode, setEditZoneMode] = useState<"all_current_zones" | "selected_zones">("all_current_zones")
  const [editSelectedZoneIds, setEditSelectedZoneIds] = useState<string[]>([])

  // Revoke Modal
  const [revokeModalOpen, setRevokeModalOpen] = useState(false)
  const [revokingInvitationId, setRevokingInvitationId] = useState<string>("")
  const [revokingLabel, setRevokingLabel] = useState<string>("")

  // Generate QR code whenever active pairing material changes
  useEffect(() => {
    if (!activePairingMaterial?.pairing_url) {
      setQrDataUrl("")
      return
    }

    QRCode.toDataURL(activePairingMaterial.pairing_url, {
      width: 280,
      margin: 2,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => {
        console.error("QR Code generation error:", err)
      })

    // Calculate expiry countdown
    if (activePairingMaterial.pairing_code_expires_at) {
      const expiresAtMs = new Date(activePairingMaterial.pairing_code_expires_at).getTime()
      const diffSec = Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000))
      setCountdownSeconds(diffSec > 0 ? diffSec : 600)
    } else {
      setCountdownSeconds(600)
    }
  }, [activePairingMaterial])

  // Countdown timer effect
  useEffect(() => {
    if (!pairingModalOpen || countdownSeconds <= 0) return

    const timer = setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [pairingModalOpen, countdownSeconds])

  // ── 4. Handlers ───────────────────────────────────────────────────────────
  const handleOpenInviteModal = () => {
    setInvitePhone("")
    setInviteLabel("")
    setInviteNote("")
    setInviteZoneMode("all_current_zones")
    setInviteSelectedZoneIds([])
    setInviteModalOpen(true)
  }

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventId) {
      toast.error("Event ID is missing")
      return
    }

    const normalizedPhone = normalizeEthiopianPhone(invitePhone)
    if (!normalizedPhone || normalizedPhone.length < 10) {
      toast.error("Please enter a valid phone number (e.g. +251 9... or 09...)")
      return
    }

    if (inviteZoneMode === "selected_zones" && inviteSelectedZoneIds.length === 0) {
      toast.error("Please select at least one gate zone, or choose 'All Current Zones'")
      return
    }

    try {
      const response = await createScannerInvitation({
        eventId,
        payload: {
          phone: normalizedPhone,
          display_label: inviteLabel.trim() || undefined,
          note: inviteNote.trim() || undefined,
          zone_mode: inviteZoneMode,
          zone_ids: inviteZoneMode === "selected_zones" ? inviteSelectedZoneIds : [],
        },
      }).unwrap()

      toast.success("Scanner invitation created successfully")
      setInviteModalOpen(false)

      // Open Success Pairing Modal with QR code and 6-digit PIN!
      if (response?.data?.pairing_material) {
        setActivePairingMaterial(response.data.pairing_material)
        setPairingLabel(inviteLabel.trim() || "Gate Scanner")
        setPairingPhone(normalizedPhone)
        setPairingModalOpen(true)
      } else {
        toast.info("Invitation registered. Waiting for pairing.")
      }
    } catch (err: any) {
      toast.error("Failed to create scanner invitation", {
        description: formatApiErrorMessage(err, "Please verify your input and permissions."),
      })
    }
  }

  const handleResend = async (invitation: ScannerRosterInvitation) => {
    try {
      const response = await resendScannerInvitation({
        invitationId: invitation.id,
        eventId,
      }).unwrap()

      toast.success("Invitation refreshed and code rotated")

      if (response?.data?.pairing_material) {
        setActivePairingMaterial(response.data.pairing_material)
        setPairingLabel(invitation.display_label || "Gate Scanner")
        setPairingPhone(invitation.masked_phone)
        setPairingModalOpen(true)
      }
    } catch (err: any) {
      toast.error("Failed to resend invitation", {
        description: formatApiErrorMessage(err),
      })
    }
  }

  const handleResetPairing = async (invitationId: string, label?: string, phone?: string) => {
    try {
      const response = await resetScannerPairing({
        invitationId,
        eventId,
      }).unwrap()

      toast.success("Previous device invalidated; new pairing material generated")

      if (response?.data?.pairing_material) {
        setActivePairingMaterial(response.data.pairing_material)
        setPairingLabel(label || "Gate Scanner")
        setPairingPhone(phone || "")
        setPairingModalOpen(true)
      }
    } catch (err: any) {
      toast.error("Failed to reset scanner pairing", {
        description: formatApiErrorMessage(err),
      })
    }
  }

  const handleOpenRevokeModal = (invitationId: string, label: string) => {
    setRevokingInvitationId(invitationId)
    setRevokingLabel(label)
    setRevokeModalOpen(true)
  }

  const handleConfirmRevoke = async () => {
    if (!revokingInvitationId) return

    try {
      await revokeScannerInvitation({
        invitationId: revokingInvitationId,
        eventId,
      }).unwrap()

      toast.success("Scanner access revoked successfully")
      setRevokeModalOpen(false)
      setRevokingInvitationId("")
    } catch (err: any) {
      toast.error("Failed to revoke scanner invitation", {
        description: formatApiErrorMessage(err),
      })
    }
  }

  const handleOpenChangeZones = (assignment: ScannerRosterAssignment) => {
    setSelectedAssignment(assignment)
    setEditZoneMode(assignment.zones.length > 0 ? "selected_zones" : "all_current_zones")
    setEditSelectedZoneIds(assignment.zones.map((z) => z.id))
    setChangeZonesModalOpen(true)
  }

  const handleSaveChangeZones = async () => {
    if (!eventId || !selectedAssignment) return

    if (editZoneMode === "selected_zones" && editSelectedZoneIds.length === 0) {
      toast.error("Please select at least one zone or choose 'All Current Zones'")
      return
    }

    try {
      await updateScannerAssignment({
        eventId,
        assignmentId: selectedAssignment.id,
        payload: {
          zone_mode: editZoneMode,
          zone_ids: editZoneMode === "selected_zones" ? editSelectedZoneIds : [],
        },
      }).unwrap()

      toast.success("Scanner gate zone access updated successfully")
      setChangeZonesModalOpen(false)
      setSelectedAssignment(null)
    } catch (err: any) {
      toast.error("Failed to update scanner zones", {
        description: formatApiErrorMessage(err),
      })
    }
  }

  const handleCopyCode = async () => {
    if (!activePairingMaterial?.pairing_code) return
    try {
      await navigator.clipboard.writeText(activePairingMaterial.pairing_code)
      setCopiedCode(true)
      toast.success("6-digit code copied to clipboard")
      setTimeout(() => setCopiedCode(false), 2000)
    } catch {
      toast.error("Failed to copy code")
    }
  }

  const handleCopyLink = async () => {
    if (!activePairingMaterial?.pairing_url) return
    try {
      await navigator.clipboard.writeText(activePairingMaterial.pairing_url)
      setCopiedLink(true)
      toast.success("Pairing link copied to clipboard")
      setTimeout(() => setCopiedLink(false), 2000)
    } catch {
      toast.error("Failed to copy pairing link")
    }
  }

  // Helper formatters
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const formatShortCode = (code?: string) => {
    if (!code) return ""
    if (code.length === 6) {
      return `${code.slice(0, 3)} ${code.slice(3)}`
    }
    return code
  }

  const getStatusBadgeVariant = (status: string): BadgeVariant => {
    switch (status) {
      case "active":
        return "success"
      case "pending":
        return "warning"
      case "pairing_reset":
        return "orange"
      case "revoked":
      case "expired":
        return "destructive"
      default:
        return "secondary"
    }
  }

  // ── 5. Render ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      {/* ── Top Overview Summary ─────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 flex items-center justify-between border-border/60 bg-card/60 backdrop-blur-xs">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Active Gate Scanners</p>
            <p className="text-2xl font-bold tracking-tight text-foreground">{activeAssignments.length}</p>
          </div>
          <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
            <HugeiconsIcon icon={SmartPhone01Icon} size={22} strokeWidth={2} />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between border-border/60 bg-card/60 backdrop-blur-xs">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Live Gate Admissions</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold tracking-tight text-foreground">{totalScans}</p>
              <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" title="Live updates active" />
            </div>
          </div>
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <HugeiconsIcon icon={RadioIcon} size={22} strokeWidth={2} />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between border-border/60 bg-card/60 backdrop-blur-xs">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Pending Invitations</p>
            <p className="text-2xl font-bold tracking-tight text-foreground">{pendingInvitations.length}</p>
          </div>
          <div className="flex size-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
            <HugeiconsIcon icon={Clock01Icon} size={22} strokeWidth={2} />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between border-border/60 bg-card/60 backdrop-blur-xs">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Total Staff Rostered</p>
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {activeAssignments.length + pendingInvitations.length}
            </p>
          </div>
          <div className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <HugeiconsIcon icon={Shield01Icon} size={22} strokeWidth={2} />
          </div>
        </Card>
      </div>

      {/* ── Main Section: Action Header ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Staff & Gate Scanners</h2>
          <p className="text-xs text-muted-foreground">
            Instant device pairing without passwords or OTPs. Gate staff scan on-screen QR or enter a 6-digit code.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 text-xs"
            onClick={() => refetchRoster()}
            disabled={isFetchingRoster}
          >
            <HugeiconsIcon
              icon={RefreshIcon}
              size={14}
              className={isFetchingRoster ? "animate-spin" : ""}
            />
            Refresh Roster
          </Button>
          <Button
            size="sm"
            className="h-9 gap-1.5 text-xs shadow-xs"
            onClick={handleOpenInviteModal}
          >
            <HugeiconsIcon icon={Add01Icon} size={15} strokeWidth={2.2} />
            Invite Gate Scanner
          </Button>
        </div>
      </div>

      {/* ── Section A: Active Scanners ───────────────────────────────────── */}
      <Card className="border-border/60">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold">Active Scanners</CardTitle>
                <Badge variant="success" className="h-5 px-2 text-[10px]">
                  {activeAssignments.length} online / active
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Phones currently paired and scanning tickets at gate checkpoints.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoadingRoster ? (
            <div className="p-6 space-y-3">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : activeAssignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <HugeiconsIcon icon={SmartPhone01Icon} className="size-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-sm font-semibold">No Active Scanners Yet</h3>
              <p className="mt-1 max-w-md text-xs text-muted-foreground">
                Invite gate volunteers by phone number above. Once they scan your on-screen QR code or enter their 6-digit code, their device will immediately show up here.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 gap-1.5 text-xs"
                onClick={handleOpenInviteModal}
              >
                <HugeiconsIcon icon={Add01Icon} size={14} />
                Send First Invitation
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/10 text-xs font-medium text-muted-foreground">
                    <th className="py-3 px-4">Station / Staff Label</th>
                    <th className="py-3 px-4">Device & Phone</th>
                    <th className="py-3 px-4">Allowed Gate Zones</th>
                    <th className="py-3 px-4">Last Activity</th>
                    <th className="py-3 px-4 text-center">Scans Completed</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {activeAssignments.map((assignment) => {
                    // Find corresponding invitation id if present
                    const matchingInv = invitations.find(
                      (inv) => inv.masked_phone === assignment.masked_phone
                    )
                    const invId = matchingInv?.id

                    return (
                      <tr key={assignment.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground">
                              {assignment.display_label || assignment.scanner_name || "Gate Scanner"}
                            </span>
                            {assignment.display_label && assignment.scanner_name && (
                              <span className="text-[11px] text-muted-foreground font-mono">
                                {assignment.scanner_name}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 font-mono text-xs text-foreground">
                            <HugeiconsIcon icon={SmartPhone01Icon} size={14} className="text-muted-foreground shrink-0" />
                            <span>{assignment.masked_phone}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {assignment.zones.length === 0 ? (
                              <Badge variant="outline" className="text-[11px] font-normal">
                                All Current Zones
                              </Badge>
                            ) : (
                              assignment.zones.map((zone) => (
                                <Badge
                                  key={zone.id}
                                  variant="secondary"
                                  className="text-[10px] font-medium bg-muted/60"
                                >
                                  {zone.name}
                                </Badge>
                              ))
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-xs text-muted-foreground">
                          {assignment.last_seen_at ? (
                            <div className="flex items-center gap-1.5">
                              <span className="flex size-1.5 rounded-full bg-emerald-500" />
                              <span>{formatDateTime(assignment.last_seen_at)}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground/60">Not seen yet</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <Badge
                            variant="default"
                            className="bg-primary/10 text-primary font-mono text-xs font-bold px-2.5 py-0.5"
                          >
                            {assignment.scan_count} scans
                          </Badge>
                        </td>

                        <td className="py-3.5 px-4">
                          <Badge variant={getStatusBadgeVariant(assignment.status)} className="capitalize text-[11px]">
                            {assignment.status}
                          </Badge>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5 text-xs gap-1"
                              onClick={() => handleOpenChangeZones(assignment)}
                            >
                              <HugeiconsIcon icon={Location01Icon} size={13} />
                              Change Zones
                            </Button>

                            {invId && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2.5 text-xs gap-1 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                                disabled={isResettingPairing}
                                onClick={() =>
                                  handleResetPairing(
                                    invId,
                                    assignment.display_label || assignment.scanner_name,
                                    assignment.masked_phone
                                  )
                                }
                                title="Invalidates current phone and opens fresh QR code for replacement device"
                              >
                                <HugeiconsIcon icon={RefreshIcon} size={13} />
                                Reset Device
                              </Button>
                            )}

                            {invId && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10"
                                onClick={() =>
                                  handleOpenRevokeModal(
                                    invId,
                                    assignment.display_label || assignment.scanner_name
                                  )
                                }
                              >
                                Revoke
                              </Button>
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

      {/* ── Section B: Pending Invitations ───────────────────────────────── */}
      <Card className="border-border/60">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold">Pending Invitations</CardTitle>
                <Badge variant="warning" className="h-5 px-2 text-[10px]">
                  {pendingInvitations.length} awaiting pairing
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Invitations sent awaiting gate staff to scan on-screen QR code or enter 6-digit PIN.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoadingRoster ? (
            <div className="p-6 space-y-3">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : pendingInvitations.length === 0 ? (
            <div className="py-8 px-4 text-center">
              <p className="text-xs text-muted-foreground">
                No invitations awaiting pairing. All invited scanners have completed device enrollment.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/10 text-xs font-medium text-muted-foreground">
                    <th className="py-3 px-4">Staff Label / Note</th>
                    <th className="py-3 px-4">Masked Phone</th>
                    <th className="py-3 px-4">Allowed Zones</th>
                    <th className="py-3 px-4">Delivery Status</th>
                    <th className="py-3 px-4">Pairing Status</th>
                    <th className="py-3 px-4">Expiry</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {pendingInvitations.map((invitation) => (
                    <tr key={invitation.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">
                            {invitation.display_label || "Gate Volunteer"}
                          </span>
                          {invitation.note && (
                            <span className="text-[11px] text-muted-foreground">{invitation.note}</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-xs text-foreground">
                        {invitation.masked_phone}
                      </td>

                      <td className="py-3.5 px-4">
                        {invitation.zone_mode === "all_current_zones" ? (
                          <Badge variant="outline" className="text-[10px] font-normal">
                            All Current Zones
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {invitation.selected_zone_ids.length} specific zone(s)
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge variant="secondary" className="capitalize text-[10px]">
                          {invitation.delivery_status}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge variant={getStatusBadgeVariant(invitation.status)} className="capitalize text-[10px]">
                          {invitation.status.replace("_", " ")}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-muted-foreground">
                        {invitation.expires_at ? formatDate(invitation.expires_at) : "Standard"}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2.5 text-xs gap-1.5 shadow-2xs font-medium"
                            disabled={isResendingInvite}
                            onClick={() => handleResend(invitation)}
                            title="Regenerates on-screen QR code and 6-digit PIN"
                          >
                            <HugeiconsIcon icon={QrCodeIcon} size={14} />
                            Show QR / Resend
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10"
                            disabled={isRevokingInvite}
                            onClick={() =>
                              handleOpenRevokeModal(invitation.id, invitation.display_label || "Pending Volunteer")
                            }
                          >
                            Revoke
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Section C: Gate Guidance Callout ─────────────────────────────── */}
      <Card className="border-border/60 bg-gradient-to-r from-primary/5 via-card to-card">
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <HugeiconsIcon icon={InformationCircleIcon} size={20} strokeWidth={2} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Fastest On-Site Gate Pairing</p>
              <p className="text-xs text-muted-foreground">
                In crowded stadiums or festival gates, cell towers can experience SMS delays. Simply hold up your screen with the <strong>QR code</strong> or share the <strong>6-digit PIN</strong> for sub-2-second device pairing.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-xs shrink-0 gap-1.5"
            onClick={handleOpenInviteModal}
          >
            <HugeiconsIcon icon={Add01Icon} size={14} />
            Invite Scanner Now
          </Button>
        </CardContent>
      </Card>

      {/* ─── MODAL 1: INVITE SCANNER ───────────────────────────────────────── */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleCreateInvite}>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <HugeiconsIcon icon={SmartPhone01Icon} size={18} strokeWidth={2} />
                </div>
                <div>
                  <DialogTitle className="text-base">Invite Gate Scanner</DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Enroll a gate volunteer&apos;s phone without requiring user accounts or passwords.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-4 text-xs">
              {/* Phone input */}
              <div className="space-y-1.5">
                <Label htmlFor="scanner-phone" className="text-xs font-medium">
                  Staff Phone Number <span className="text-destructive">*</span>
                </Label>
                <PhoneInput
                  id="scanner-phone"
                  value={invitePhone}
                  onChange={(e) => setInvitePhone(e.target.value)}
                  placeholder="91 123 4567"
                  disabled={isCreatingInvite}
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  Ethiopian mobile phone (+251 9... or 09...). An SMS invite with instant pairing link will be dispatched.
                </p>
              </div>

              {/* Staff Label */}
              <div className="space-y-1.5">
                <Label htmlFor="scanner-label" className="text-xs font-medium">
                  Device / Staff Label
                </Label>
                <Input
                  id="scanner-label"
                  placeholder="e.g. East Gate #1 - Abebe"
                  value={inviteLabel}
                  onChange={(e) => setInviteLabel(e.target.value)}
                  disabled={isCreatingInvite}
                />
                <p className="text-[11px] text-muted-foreground">
                  Identifies the checkpoint station or staff member on the live roster.
                </p>
              </div>

              {/* Organizer Note */}
              <div className="space-y-1.5">
                <Label htmlFor="scanner-note" className="text-xs font-medium">
                  Internal Note (Optional)
                </Label>
                <Input
                  id="scanner-note"
                  placeholder="e.g. Main entrance turnstile #2 - Shift 1"
                  value={inviteNote}
                  onChange={(e) => setInviteNote(e.target.value)}
                  disabled={isCreatingInvite}
                />
              </div>

              {/* Zone Access Scope */}
              <div className="space-y-2 pt-1 border-t">
                <Label className="text-xs font-medium">Zone Access Scope</Label>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors">
                    <input
                      type="radio"
                      name="zoneMode"
                      checked={inviteZoneMode === "all_current_zones"}
                      onChange={() => setInviteZoneMode("all_current_zones")}
                      className="size-4 text-primary"
                    />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-foreground">All Current Zones (Default)</p>
                      <p className="text-[11px] text-muted-foreground">
                        Scanner can validate admission for all gate checkpoints currently configured.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors">
                    <input
                      type="radio"
                      name="zoneMode"
                      checked={inviteZoneMode === "selected_zones"}
                      onChange={() => setInviteZoneMode("selected_zones")}
                      className="size-4 text-primary"
                    />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-foreground">Select Specific Zones</p>
                      <p className="text-[11px] text-muted-foreground">
                        Restrict scanner to designated gates (e.g. VIP Gate only or Backstage only).
                      </p>
                    </div>
                  </label>
                </div>

                {/* Specific zones checkbox list */}
                {inviteZoneMode === "selected_zones" && (
                  <div className="p-3 rounded-lg border bg-muted/30 space-y-2 max-h-48 overflow-y-auto">
                    {accessZones.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground italic">
                        No specific access zones configured for this event yet. Create access zones in the Access Zones tab first.
                      </p>
                    ) : (
                      accessZones.map((zone) => (
                        <div key={zone.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`zone-${zone.id}`}
                            checked={inviteSelectedZoneIds.includes(zone.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setInviteSelectedZoneIds((prev) => [...prev, zone.id])
                              } else {
                                setInviteSelectedZoneIds((prev) => prev.filter((id) => id !== zone.id))
                              }
                            }}
                          />
                          <Label htmlFor={`zone-${zone.id}`} className="text-xs font-normal cursor-pointer flex-1">
                            <span className="font-medium text-foreground">{zone.name}</span>
                            <span className="text-muted-foreground ml-1 font-mono text-[10px]">({zone.code})</span>
                          </Label>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setInviteModalOpen(false)}
                disabled={isCreatingInvite}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreatingInvite} className="shadow-xs">
                {isCreatingInvite ? "Creating..." : "Create & Show Pairing Material"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL 2: PAIRING SUCCESS (CRUCIAL UX!) ─────────────────────────── */}
      <Dialog open={pairingModalOpen} onOpenChange={setPairingModalOpen}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader className="text-center sm:text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-2">
              <HugeiconsIcon icon={QrCodeIcon} size={26} strokeWidth={2.2} />
            </div>
            <DialogTitle className="text-lg font-bold">Ready for Gate Pairing</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {pairingLabel ? <span>Pairing for <strong>{pairingLabel}</strong> ({pairingPhone})</span> : "Hold up this screen for gate staff to pair in 2 seconds"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-2">
            {/* On-screen QR code container */}
            <div className="relative p-3 bg-white rounded-2xl border-2 border-primary/20 shadow-lg">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Scanner Pairing QR Code"
                  className="size-56 rounded-lg object-contain"
                />
              ) : (
                <div className="size-56 flex items-center justify-center text-xs text-muted-foreground">
                  <HugeiconsIcon icon={RefreshIcon} className="size-8 animate-spin text-primary" />
                </div>
              )}
            </div>

            {/* 6-Digit Short Code */}
            {activePairingMaterial?.pairing_code && (
              <div className="w-full space-y-1.5">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Or Enter 6-Digit Short Code
                </p>
                <div className="flex items-center justify-center gap-2">
                  <div className="px-4 py-2 rounded-xl bg-muted/60 border font-mono text-3xl font-black tracking-widest text-foreground select-all">
                    {formatShortCode(activePairingMaterial.pairing_code)}
                  </div>
                  <Button
                    size="icon"
                    variant="outline"
                    className="size-11 rounded-xl shrink-0"
                    onClick={handleCopyCode}
                    title="Copy 6-digit code"
                  >
                    <HugeiconsIcon
                      icon={copiedCode ? CheckmarkCircle01Icon : Copy01Icon}
                      size={18}
                      className={copiedCode ? "text-emerald-500" : ""}
                    />
                  </Button>
                </div>
              </div>
            )}

            {/* Active Countdown Timer */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 text-xs font-semibold">
              <HugeiconsIcon icon={Clock01Icon} size={14} />
              <span>Code expires in {formatCountdown(countdownSeconds)}</span>
            </div>

            {/* Context callout */}
            <div className="rounded-lg border bg-muted/30 p-2.5 text-[11px] text-muted-foreground leading-relaxed text-left w-full">
              💡 <strong>Instant On-Site Pairing:</strong> Gate staff can open the scanner camera to scan this QR code, or type the 6-digit code on their mobile client. No login or SMS required!
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="w-full sm:w-auto flex-1 text-xs gap-1.5"
              onClick={handleCopyLink}
            >
              <HugeiconsIcon icon={copiedLink ? CheckmarkCircle01Icon : Share01Icon} size={14} />
              {copiedLink ? "Link Copied" : "Copy Pairing Link"}
            </Button>
            <Button
              className="w-full sm:w-auto flex-1 text-xs shadow-xs"
              onClick={() => setPairingModalOpen(false)}
            >
              Done & Return to Roster
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL 3: CHANGE ZONES ─────────────────────────────────────────── */}
      <Dialog open={changeZonesModalOpen} onOpenChange={setChangeZonesModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <HugeiconsIcon icon={Location01Icon} size={18} strokeWidth={2} />
              </div>
              <div>
                <DialogTitle className="text-base">Change Gate Zone Access</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Update allowed gates for {selectedAssignment?.display_label || selectedAssignment?.scanner_name} without re-pairing.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs">
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors">
                <input
                  type="radio"
                  name="editZoneMode"
                  checked={editZoneMode === "all_current_zones"}
                  onChange={() => setEditZoneMode("all_current_zones")}
                  className="size-4 text-primary"
                />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-foreground">All Current Zones</p>
                  <p className="text-[11px] text-muted-foreground">
                    Device can scan tickets at all checkpoints for this event.
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors">
                <input
                  type="radio"
                  name="editZoneMode"
                  checked={editZoneMode === "selected_zones"}
                  onChange={() => setEditZoneMode("selected_zones")}
                  className="size-4 text-primary"
                />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-foreground">Select Specific Zones</p>
                  <p className="text-[11px] text-muted-foreground">
                    Assign checkpoint gates (e.g. VIP Gate only).
                  </p>
                </div>
              </label>
            </div>

            {editZoneMode === "selected_zones" && (
              <div className="p-3 rounded-lg border bg-muted/30 space-y-2 max-h-48 overflow-y-auto">
                {accessZones.map((zone) => (
                  <div key={zone.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`edit-zone-${zone.id}`}
                      checked={editSelectedZoneIds.includes(zone.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setEditSelectedZoneIds((prev) => [...prev, zone.id])
                        } else {
                          setEditSelectedZoneIds((prev) => prev.filter((id) => id !== zone.id))
                        }
                      }}
                    />
                    <Label htmlFor={`edit-zone-${zone.id}`} className="text-xs font-normal cursor-pointer flex-1">
                      <span className="font-medium text-foreground">{zone.name}</span>
                      <span className="text-muted-foreground ml-1 font-mono text-[10px]">({zone.code})</span>
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setChangeZonesModalOpen(false)}
              disabled={isUpdatingAssignment}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveChangeZones}
              disabled={isUpdatingAssignment}
              className="shadow-xs"
            >
              {isUpdatingAssignment ? "Updating..." : "Save Gate Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL 4: REVOKE CONFIRMATION ──────────────────────────────────── */}
      <Dialog open={revokeModalOpen} onOpenChange={setRevokeModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <div className="flex size-8 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <HugeiconsIcon icon={AlertCircleIcon} size={18} strokeWidth={2} />
              </div>
              <div>
                <DialogTitle className="text-base">Revoke Scanner Access</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Immediately terminate ticket check-in permissions
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-3 text-xs text-muted-foreground leading-relaxed">
            Are you sure you want to revoke <strong>{revokingLabel || "this scanner"}</strong>? The operator&apos;s phone session will be locked out immediately, preventing further ticket validations at the gates.
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setRevokeModalOpen(false)}
              disabled={isRevokingInvite}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmRevoke}
              disabled={isRevokingInvite}
            >
              {isRevokingInvite ? "Revoking..." : "Confirm Revoke"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
