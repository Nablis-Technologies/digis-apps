"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Key01Icon,
  Mail01Icon,
  Add01Icon,
  Copy01Icon,
  Delete02Icon,
  CheckmarkCircle01Icon,
  Loading03Icon,
  Ticket01Icon,
  AlertCircleIcon,
  Calendar03Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Badge, StatusBadge } from "@/components/ui/badge"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/lib/utils"
import {
  useListAccessCodesQuery,
  useCreateAccessCodeMutation,
  useDeleteAccessCodeMutation,
  useListInvitationsQuery,
  useCreateInvitationMutation,
  useDeleteInvitationMutation,
  type EventProduct,
  type AccessCode,
  type Invitation,
} from "@workspace/store/reducers/ticketingApi"

interface AccessCodesTabProps {
  eventId: string
  eventProducts: EventProduct[]
}

export function AccessCodesTab({ eventId, eventProducts }: AccessCodesTabProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>(
    eventProducts[0]?.id || ""
  )
  const activeProduct = eventProducts.find((p) => p.id === selectedProductId) || eventProducts[0]

  // Modals state
  const [createCodeOpen, setCreateCodeOpen] = useState(false)
  const [createInviteOpen, setCreateInviteOpen] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Form states for Access Code
  const [codeLabel, setCodeLabel] = useState("")
  const [codeText, setCodeText] = useState("")
  const [codeMaxUses, setCodeMaxUses] = useState<string>("")
  const [codeMaxPerOrder, setCodeMaxPerOrder] = useState<string>("1")
  const [codeExpiresAt, setCodeExpiresAt] = useState("")

  // Form states for Invitation
  const [inviteName, setInviteName] = useState("")
  const [invitePhone, setInvitePhone] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteQuantity, setInviteQuantity] = useState<string>("1")
  const [inviteExpiresAt, setInviteExpiresAt] = useState("")

  // RTK Queries & Mutations for Access Codes
  const {
    data: accessCodesData,
    isLoading: isLoadingCodes,
    isFetching: isFetchingCodes,
  } = useListAccessCodesQuery(
    { eventId, productId: selectedProductId },
    { skip: !selectedProductId }
  )
  const [createAccessCode, { isLoading: isCreatingCode }] = useCreateAccessCodeMutation()
  const [deleteAccessCode, { isLoading: isDeletingCode }] = useDeleteAccessCodeMutation()

  // RTK Queries & Mutations for Invitations
  const {
    data: invitationsData,
    isLoading: isLoadingInvites,
    isFetching: isFetchingInvites,
  } = useListInvitationsQuery(
    { eventId, productId: selectedProductId },
    { skip: !selectedProductId }
  )
  const [createInvitation, { isLoading: isCreatingInvite }] = useCreateInvitationMutation()
  const [deleteInvitation, { isLoading: isDeletingInvite }] = useDeleteInvitationMutation()

  const accessCodes = (accessCodesData?.data as AccessCode[]) || []
  const invitations = (invitationsData?.data as Invitation[]) || []

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedCode(id)
      toast.success("Copied to clipboard")
      setTimeout(() => setCopiedCode(null), 2000)
    } catch {
      toast.error("Failed to copy")
    }
  }

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProductId) return
    try {
      await createAccessCode({
        eventId,
        productId: selectedProductId,
        body: {
          label: codeLabel.trim() || undefined,
          code: codeText.trim().toUpperCase() || undefined,
          max_uses: codeMaxUses ? parseInt(codeMaxUses, 10) : undefined,
          max_quantity_per_use: codeMaxPerOrder ? parseInt(codeMaxPerOrder, 10) : 1,
          expires_at: codeExpiresAt ? new Date(codeExpiresAt).toISOString() : undefined,
          active: true,
        },
      }).unwrap()

      toast.success("Access code created successfully", {
        description: `Code ${codeText.toUpperCase()} is now live for checkout redemption.`,
      })
      setCreateCodeOpen(false)
      setCodeLabel("")
      setCodeText("")
      setCodeMaxUses("")
      setCodeMaxPerOrder("1")
      setCodeExpiresAt("")
    } catch (err: any) {
      toast.error("Failed to create access code", {
        description: err?.data?.error || err?.data?.message || err?.message || "Invalid payload",
      })
    }
  }

  const handleDeleteCode = async (id: string, label: string) => {
    if (!confirm(`Are you sure you want to delete access code "${label}"?`)) return
    try {
      await deleteAccessCode({ eventId, productId: selectedProductId, id }).unwrap()
      toast.success("Access code deleted")
    } catch (err: any) {
      toast.error("Failed to delete access code", {
        description: err?.data?.error || err?.data?.message || err?.message || "Operation failed",
      })
    }
  }

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProductId) return
    try {
      await createInvitation({
        eventId,
        productId: selectedProductId,
        body: {
          name: inviteName.trim(),
          phone: invitePhone.trim() || undefined,
          email: inviteEmail.trim() || undefined,
          allowed_quantity: inviteQuantity ? parseInt(inviteQuantity, 10) : 1,
          expires_at: inviteExpiresAt ? new Date(inviteExpiresAt).toISOString() : undefined,
        },
      }).unwrap()

      toast.success("Guest invitation created successfully", {
        description: `Invitation generated for ${inviteName}.`,
      })
      setCreateInviteOpen(false)
      setInviteName("")
      setInvitePhone("")
      setInviteEmail("")
      setInviteQuantity("1")
      setInviteExpiresAt("")
    } catch (err: any) {
      toast.error("Failed to create invitation", {
        description: err?.data?.error || err?.data?.message || err?.message || "Invalid payload",
      })
    }
  }

  const handleDeleteInvite = async (id: string, name: string) => {
    if (!confirm(`Revoke invitation for "${name}"?`)) return
    try {
      await deleteInvitation({ eventId, productId: selectedProductId, id }).unwrap()
      toast.success("Invitation revoked")
    } catch (err: any) {
      toast.error("Failed to revoke invitation", {
        description: err?.data?.error || err?.data?.message || err?.message || "Operation failed",
      })
    }
  }

  if (eventProducts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <HugeiconsIcon icon={Ticket01Icon} className="size-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-base font-semibold">No Ticket Tiers Created</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Please create at least one ticket tier in the Tickets & Pricing tab before configuring private access codes or guest invitations.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top tier selector bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border bg-card p-4 shadow-xs">
        <div>
          <h3 className="text-sm font-semibold">Configuring Ticket Tier</h3>
          <p className="text-xs text-muted-foreground">
            Select the ticket tier to manage secret presale codes and VIP guest passes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedProductId} onValueChange={setSelectedProductId}>
            <SelectTrigger className="w-56 h-9 text-xs">
              <SelectValue placeholder="Select ticket tier" />
            </SelectTrigger>
            <SelectContent>
              {eventProducts.map((p) => (
                <SelectItem key={p.id} value={p.id} className="text-xs">
                  {p.name} ({p.status.toUpperCase()})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ─── 1. ACCESS CODES (Presale & Discount Passcodes) ────────────────── */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-lime-500/15 text-lime-600 dark:bg-lime-500/20 dark:text-lime-400">
                  <HugeiconsIcon icon={Key01Icon} size={16} strokeWidth={2} />
                </div>
                <CardTitle className="text-base">Access Codes</CardTitle>
              </div>
              <CardDescription className="text-xs mt-1">
                Presale and unlock codes for {activeProduct?.name || "this tier"}.
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setCreateCodeOpen(true)}
              className="h-8 gap-1.5 text-xs bg-lime-500 hover:bg-lime-600 text-zinc-950 font-bold dark:bg-lime-500 dark:text-zinc-950 dark:hover:bg-lime-400 border-0 shadow-xs"
            >
              <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2} />
              New Code
            </Button>
          </CardHeader>
          <CardContent className="flex-1">
            {isLoadingCodes ? (
              <div className="space-y-3 py-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : accessCodes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center border rounded-lg border-dashed">
                <HugeiconsIcon icon={Key01Icon} className="size-8 text-muted-foreground/60" />
                <p className="mt-2 text-sm font-semibold">No Access Codes Yet</p>
                <p className="text-xs text-muted-foreground max-w-xs mt-0.5">
                  Create secret codes (e.g. &quot;EARLYBIRD&quot;) to allow private early access or locked purchases.
                </p>
              </div>
            ) : (
              <div className="divide-y rounded-lg border">
                {accessCodes.map((code) => {
                  const isMaxedOut = code.max_uses !== null && code.used_count >= code.max_uses
                  return (
                    <div
                      key={code.id}
                      className="flex items-center justify-between p-3.5 hover:bg-muted/30 transition-colors"
                    >
                      <div className="space-y-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm tracking-wider text-foreground">
                            {code.label}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(code.label, code.id)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            title="Copy code"
                          >
                            <HugeiconsIcon
                              icon={copiedCode === code.id ? CheckmarkCircle01Icon : Copy01Icon}
                              size={14}
                              className={copiedCode === code.id ? "text-lime-600 dark:text-lime-400" : ""}
                            />
                          </button>
                          {isMaxedOut ? (
                            <Badge variant="destructive" className="text-[10px] h-5 px-1.5">
                              Exhausted
                            </Badge>
                          ) : code.active ? (
                            <Badge className="bg-chart-2/10 text-chart-2 dark:bg-chart-2/20 dark:text-chart-2 border-0 text-[10px] h-5 px-1.5">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {code.used_count} / {code.max_uses ?? "∞"} redeemed
                          {code.expires_at && ` · Expires ${formatDate(code.expires_at)}`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCode(code.id, code.label)}
                        disabled={isDeletingCode}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Delete code"
                      >
                        <HugeiconsIcon icon={Delete02Icon} size={15} />
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── 2. GUEST INVITATIONS (VIP / RSVP Passes) ──────────────────────── */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-lime-500/15 text-lime-600 dark:bg-lime-500/20 dark:text-lime-400">
                  <HugeiconsIcon icon={Mail01Icon} size={16} strokeWidth={2} />
                </div>
                <CardTitle className="text-base">Guest Invitations</CardTitle>
              </div>
              <CardDescription className="text-xs mt-1">
                Direct RSVP invitations for sponsors, partners, and VIPs.
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setCreateInviteOpen(true)}
              className="h-8 gap-1.5 text-xs bg-lime-500 hover:bg-lime-600 text-zinc-950 font-bold dark:bg-lime-500 dark:text-zinc-950 dark:hover:bg-lime-400 border-0 shadow-xs"
            >
              <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2} />
              Send Invite
            </Button>
          </CardHeader>
          <CardContent className="flex-1">
            {isLoadingInvites ? (
              <div className="space-y-3 py-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : invitations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center border rounded-lg border-dashed">
                <HugeiconsIcon icon={Mail01Icon} className="size-8 text-muted-foreground/60" />
                <p className="mt-2 text-sm font-semibold">No Invitations Sent</p>
                <p className="text-xs text-muted-foreground max-w-xs mt-0.5">
                  Send direct guest invitations with guaranteed ticket allocations to partners and attendees.
                </p>
              </div>
            ) : (
              <div className="divide-y rounded-lg border">
                {invitations.map((invite) => {
                  const isRevoked = invite.status?.toLowerCase() === "revoked"
                  return (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between p-3.5 hover:bg-muted/30 transition-colors"
                    >
                      <div className="space-y-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground">
                            {invite.name}
                          </span>
                          <StatusBadge status={invite.status} className="h-5 text-[10px]" />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {invite.allowed_quantity} {invite.allowed_quantity === 1 ? "ticket" : "tickets"}
                          {invite.expires_at && ` · Expires ${formatDate(invite.expires_at)}`}
                        </p>
                      </div>
                      {!isRevoked && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteInvite(invite.id, invite.name)}
                          disabled={isDeletingInvite}
                          className="h-8 text-xs text-destructive hover:bg-destructive/10"
                        >
                          Revoke
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── CREATE ACCESS CODE DIALOG ───────────────────────────────────────── */}
      <Dialog open={createCodeOpen} onOpenChange={setCreateCodeOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateCode}>
            <DialogHeader>
              <div className="flex items-center gap-2 text-foreground">
                <div className="flex size-8 items-center justify-center rounded-lg bg-lime-500/15 text-lime-600 dark:bg-lime-500/20 dark:text-lime-400">
                  <HugeiconsIcon icon={Key01Icon} size={18} strokeWidth={2} />
                </div>
                <div>
                  <DialogTitle className="text-base">Create Access Code</DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Unlock code for {activeProduct?.name}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-3.5 py-4 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="code-text">Passcode / Secret String *</Label>
                <Input
                  id="code-text"
                  placeholder="e.g. VIP2026 or EARLYBIRD"
                  value={codeText}
                  onChange={(e) => setCodeText(e.target.value.toUpperCase())}
                  required
                  className="font-mono font-bold tracking-wider"
                />
                <p className="text-[11px] text-muted-foreground">
                  Attendees will type this exact code to unlock this tier at checkout.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="code-label">Internal Label / Description</Label>
                <Input
                  id="code-label"
                  placeholder="e.g. Sponsor VIP Passcode"
                  value={codeLabel}
                  onChange={(e) => setCodeLabel(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="code-max-uses">Total Uses Limit</Label>
                  <Input
                    id="code-max-uses"
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    value={codeMaxUses}
                    onChange={(e) => setCodeMaxUses(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="code-max-order">Max Per Order</Label>
                  <Input
                    id="code-max-order"
                    type="number"
                    min="1"
                    value={codeMaxPerOrder}
                    onChange={(e) => setCodeMaxPerOrder(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="code-expires">Expiration Date (Optional)</Label>
                <Input
                  id="code-expires"
                  type="datetime-local"
                  value={codeExpiresAt}
                  onChange={(e) => setCodeExpiresAt(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCreateCodeOpen(false)}
                disabled={isCreatingCode}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreatingCode || !codeText.trim()}
                className="gap-2 bg-lime-500 hover:bg-lime-600 text-zinc-950 font-bold dark:bg-lime-500 dark:text-zinc-950 dark:hover:bg-lime-400 border-0 shadow-xs"
              >
                {isCreatingCode ? (
                  <>
                    <HugeiconsIcon icon={Loading03Icon} size={15} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Code"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── CREATE INVITATION DIALOG ────────────────────────────────────────── */}
      <Dialog open={createInviteOpen} onOpenChange={setCreateInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateInvite}>
            <DialogHeader>
              <div className="flex items-center gap-2 text-foreground">
                <div className="flex size-8 items-center justify-center rounded-lg bg-lime-500/15 text-lime-600 dark:bg-lime-500/20 dark:text-lime-400">
                  <HugeiconsIcon icon={Mail01Icon} size={18} strokeWidth={2} />
                </div>
                <div>
                  <DialogTitle className="text-base">Send Guest Invitation</DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Issue personalized invitation for {activeProduct?.name}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-3.5 py-4 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="invite-name">Guest Full Name *</Label>
                <Input
                  id="invite-name"
                  placeholder="e.g. Dr. Abebe Bikila"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="invite-phone">Phone Number</Label>
                  <Input
                    id="invite-phone"
                    placeholder="+251 91 123 4567"
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="invite-email">Email Address</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="guest@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="invite-qty">Allowed Tickets</Label>
                  <Input
                    id="invite-qty"
                    type="number"
                    min="1"
                    max="10"
                    value={inviteQuantity}
                    onChange={(e) => setInviteQuantity(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="invite-expires">RSVP Deadline</Label>
                  <Input
                    id="invite-expires"
                    type="datetime-local"
                    value={inviteExpiresAt}
                    onChange={(e) => setInviteExpiresAt(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCreateInviteOpen(false)}
                disabled={isCreatingInvite}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreatingInvite || !inviteName.trim()}
                className="gap-2 bg-lime-500 hover:bg-lime-600 text-zinc-950 font-bold dark:bg-lime-500 dark:text-zinc-950 dark:hover:bg-lime-400 border-0 shadow-xs"
              >
                {isCreatingInvite ? (
                  <>
                    <HugeiconsIcon icon={Loading03Icon} size={15} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Generate Invitation"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
