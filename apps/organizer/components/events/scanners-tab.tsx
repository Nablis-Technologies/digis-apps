"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  SmartPhone01Icon,
  RefreshIcon,
  CheckmarkCircle01Icon,
  Copy01Icon,
  UserGroupIcon,
  AlertCircleIcon,
  RadioIcon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { toast } from "sonner"
import { formatDate } from "@/lib/utils"
import { cn } from "@workspace/ui/lib/utils"
import {
  useListScannerDevicesQuery,
  useRotateScannerTokenMutation,
  useRevokeScannerDeviceMutation,
  type ScannerDevice,
} from "@workspace/store/reducers/attendeesApi"

interface ScannersTabProps {
  organizationId?: string
}

export function ScannersTab({ organizationId }: ScannersTabProps) {
  const { data: scannersData, isLoading: isLoadingScanners } = useListScannerDevicesQuery(
    organizationId || "",
    { skip: !organizationId }
  )
  const scannerDevices: ScannerDevice[] =
    (scannersData as any)?.data ?? (scannersData as any) ?? []

  const [rotateScannerToken, { isLoading: isRotatingToken }] = useRotateScannerTokenMutation()
  const [revokeScannerDevice, { isLoading: isRevokingDevice }] = useRevokeScannerDeviceMutation()

  // Token dialog
  const [tokenResult, setTokenResult] = useState<{ open: boolean; deviceName: string; token: string }>({
    open: false,
    deviceName: "",
    token: "",
  })
  const [copiedToken, setCopiedToken] = useState(false)

  // Revoke modal
  const [revokeModal, setRevokeModal] = useState<{
    open: boolean
    deviceId: string
    deviceName: string
    reason: string
  }>({
    open: false,
    deviceId: "",
    deviceName: "",
    reason: "",
  })

  const activeCount = scannerDevices.filter((d) => d.status !== "revoked").length
  const revokedCount = scannerDevices.filter((d) => d.status === "revoked").length

  const handleRotateToken = async (device: ScannerDevice) => {
    try {
      const res = await rotateScannerToken({ deviceId: device.id, organizationId }).unwrap()
      const newToken = (res as any)?.data?.token ?? (res as any)?.token ?? ""
      setTokenResult({
        open: true,
        deviceName: device.name || "Door Scanner",
        token: newToken,
      })
      toast.success("Security token rotated successfully")
    } catch (err: any) {
      toast.error("Failed to rotate token", {
        description: err?.data?.error || err?.data?.message || "Operation failed",
      })
    }
  }

  const handleCopyToken = async () => {
    try {
      await navigator.clipboard.writeText(tokenResult.token)
      setCopiedToken(true)
      toast.success("Token copied to clipboard")
      setTimeout(() => setCopiedToken(false), 2000)
    } catch {
      toast.error("Failed to copy")
    }
  }

  const handleConfirmRevoke = async () => {
    if (!revokeModal.deviceId) return
    try {
      await revokeScannerDevice({
        deviceId: revokeModal.deviceId,
        reason: revokeModal.reason || "Revoked by event organizer",
        organizationId,
      }).unwrap()
      toast.success(`Scanner "${revokeModal.deviceName}" revoked`)
      setRevokeModal({ open: false, deviceId: "", deviceName: "", reason: "" })
    } catch (err: any) {
      toast.error("Failed to revoke scanner", {
        description: err?.data?.error || err?.data?.message || "Operation failed",
      })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-lime-500/15 text-lime-600 dark:bg-lime-500/20 dark:text-lime-400">
            <HugeiconsIcon icon={RadioIcon} size={20} strokeWidth={2} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Active Gate Scanners</p>
            <p className="text-xl font-bold text-foreground">{activeCount}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <HugeiconsIcon icon={SmartPhone01Icon} size={20} strokeWidth={2} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Registered Devices</p>
            <p className="text-xl font-bold text-foreground">{scannerDevices.length}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <HugeiconsIcon icon={AlertCircleIcon} size={20} strokeWidth={2} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Revoked Devices</p>
            <p className="text-xl font-bold text-foreground">{revokedCount}</p>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Scanners List */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-base">Gate Check-in Scanners</CardTitle>
              <CardDescription className="text-xs">
                Manage authorized door volunteer smartphones paired for offline and online QR validation.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingScanners ? (
              <div className="space-y-3 py-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : scannerDevices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg border-dashed">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                  <HugeiconsIcon icon={UserGroupIcon} className="size-6 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-base font-semibold">No Scanner Devices Paired Yet</h3>
                <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                  Door volunteers pair using the Digis Scanner Mobile App. When they scan your event sync QR or enter a token, their device appears here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-xs uppercase text-muted-foreground">
                      <th className="pb-3 font-medium">Device Identifier</th>
                      <th className="pb-3 font-medium">Station Name</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Last Synced</th>
                      <th className="pb-3 font-medium text-right">Actions</th>
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
                              className={!isRevoked ? "bg-chart-2/10 text-chart-2 dark:bg-chart-2/20 dark:text-chart-2 border-0" : ""}
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
                                    className="h-8 text-xs gap-1.5"
                                    disabled={isRotatingToken}
                                    onClick={() => handleRotateToken(device)}
                                  >
                                    <HugeiconsIcon icon={RefreshIcon} size={14} className={isRotatingToken ? "animate-spin" : ""} />
                                    Rotate
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-xs text-destructive hover:bg-destructive/10"
                                    onClick={() =>
                                      setRevokeModal({
                                        open: true,
                                        deviceId: device.id,
                                        deviceName: device.name || "Door Scanner",
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

        {/* Gate Instructions Card */}
        <Card className="flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-lime-500/15 text-lime-600 dark:bg-lime-500/20 dark:text-lime-400">
                <HugeiconsIcon icon={InformationCircleIcon} size={16} strokeWidth={2} />
              </div>
              <CardTitle className="text-base">Door Staff Setup</CardTitle>
            </div>
            <CardDescription className="text-xs mt-1">
              How volunteers operate ticket scanning at the venue gates.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs text-muted-foreground">
            <div className="rounded-lg border p-3 bg-muted/30 space-y-2">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">1</span>
                Download App
              </p>
              <p>Staff install the Digis Scanner app on iOS or Android.</p>
            </div>

            <div className="rounded-lg border p-3 bg-muted/30 space-y-2">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">2</span>
                Pair Device
              </p>
              <p>Provide them the rotation token or have them scan the event QR code to authorize admissions.</p>
            </div>

            <div className="rounded-lg border p-3 bg-muted/30 space-y-2">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">3</span>
                Offline Ready
              </p>
              <p>The app synchronizes the attendee manifest, allowing fast, sub-second scanning even without internet connection.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── ROTATED TOKEN RESULT DIALOG ────────────────────────────────────── */}
      <Dialog
        open={tokenResult.open}
        onOpenChange={(open) => setTokenResult((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-lime-500/15 text-lime-600 dark:bg-lime-500/20 dark:text-lime-400">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} strokeWidth={2} />
              </div>
              <div>
                <DialogTitle className="text-base">Scanner Auth Token</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  One-time credential for {tokenResult.deviceName}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 py-3 text-xs">
            <p className="text-muted-foreground leading-relaxed">
              Enter this token on the volunteer&apos;s phone to authenticate their gate scanner session:
            </p>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-3 font-mono text-xs break-all">
              <span className="flex-1 select-all">{tokenResult.token}</span>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1 text-xs shrink-0"
                onClick={handleCopyToken}
              >
                <HugeiconsIcon icon={copiedToken ? CheckmarkCircle01Icon : Copy01Icon} size={14} />
                {copiedToken ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              className="w-full shadow-xs"
              onClick={() => setTokenResult((prev) => ({ ...prev, open: false }))}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── REVOKE CONFIRMATION MODAL ──────────────────────────────────────── */}
      <Dialog
        open={revokeModal.open}
        onOpenChange={(open) => setRevokeModal((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <div className="flex size-8 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <HugeiconsIcon icon={AlertCircleIcon} size={18} strokeWidth={2} />
              </div>
              <div>
                <DialogTitle className="text-base">Revoke Scanner Device</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Permanently disable check-ins from this device
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 py-3 text-xs">
            <p className="text-muted-foreground">
              Are you sure you want to revoke <strong>{revokeModal.deviceName}</strong>? This phone will immediately lose the ability to scan tickets at the gates.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="revoke-reason">Reason for Revocation</Label>
              <Input
                id="revoke-reason"
                placeholder="e.g. Volunteer shift ended or device lost"
                value={revokeModal.reason}
                onChange={(e) =>
                  setRevokeModal((prev) => ({ ...prev, reason: e.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              disabled={isRevokingDevice}
              onClick={() => setRevokeModal((prev) => ({ ...prev, open: false }))}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isRevokingDevice}
              onClick={handleConfirmRevoke}
            >
              {isRevokingDevice ? "Revoking..." : "Confirm Revoke"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
