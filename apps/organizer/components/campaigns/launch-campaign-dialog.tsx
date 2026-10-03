"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Rocket01Icon,
  AlertCircleIcon,
  CheckmarkCircle01Icon,
  Loading03Icon,
  SmartPhone01Icon,
  Mail01Icon,
  Wallet01Icon,
  Shield01Icon,
} from "@hugeicons/core-free-icons"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ChannelBadge } from "@/components/ui/badge"
import { formatNumber } from "@/lib/utils"
import { cn } from "@workspace/ui/lib/utils"
import {
  useEstimateCampaignMutation,
  useAttestCampaignMutation,
  useLaunchCampaignMutation,
  type Campaign,
  type CampaignEstimate,
} from "@workspace/store/reducers/messagingApi"

interface LaunchCampaignDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  campaign: Campaign | null
  availableCredits: number
  onOpenTopUp?: () => void
  onSuccess?: () => void
}

export function LaunchCampaignDialog({
  open,
  onOpenChange,
  organizationId,
  campaign,
  availableCredits,
  onOpenTopUp,
  onSuccess,
}: LaunchCampaignDialogProps) {
  const [estimate, setEstimate] = useState<CampaignEstimate | null>(null)
  const [hasAttested, setHasAttested] = useState(false)

  const [getEstimate, { isLoading: isEstimating }] = useEstimateCampaignMutation()
  const [attestCampaign, { isLoading: isAttesting }] = useAttestCampaignMutation()
  const [launchCampaign, { isLoading: isLaunching }] = useLaunchCampaignMutation()

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null
    let active = true

    const fetchEstimate = async () => {
      if (!campaign || !organizationId) return
      try {
        const res = await getEstimate({ organizationId, campaignId: campaign.id }).unwrap()
        if (!active) return
        setEstimate(res.data)
        if (res.data?.status === "preparing") {
          timer = setTimeout(fetchEstimate, 1500)
        }
      } catch (err: any) {
        if (!active) return
        toast.error("Failed to estimate campaign audience", {
          description:
            err?.data?.message || err?.data?.error || err?.message || "Audience calculation failed",
        })
      }
    }

    if (open && campaign && organizationId) {
      setHasAttested(false)
      setEstimate(null)
      fetchEstimate()
    }

    return () => {
      active = false
      if (timer) clearTimeout(timer)
    }
  }, [open, campaign?.id, organizationId, getEstimate])

  if (!campaign) return null

  const requiredCredits = estimate?.quantity ?? 0
  const hasSufficientCredits = availableCredits >= requiredCredits
  const isActionLoading = isAttesting || isLaunching

  const handleConfirmLaunch = async () => {
    if (!hasAttested) {
      toast.error("Compliance attestation required", {
        description: "Please confirm subscriber consent before launching.",
      })
      return
    }

    try {
      // Step 1: Attest compliance
      await attestCampaign({
        organizationId,
        campaignId: campaign.id,
        confirmation: true,
        historical_basis: "attendee_optin",
      }).unwrap()

      // Step 2: Launch campaign broadcast
      await launchCampaign({
        organizationId,
        campaignId: campaign.id,
        quote_digest: estimate?.quote_digest,
        quoted_rate_version_id: estimate?.rate_version?.id,
        quoted_quantity: estimate?.quantity,
      }).unwrap()

      toast.success("Campaign launched successfully!", {
        description: `"${campaign.name}" is now broadcasting to ${formatNumber(requiredCredits)} recipients.`,
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (err: any) {
      toast.error("Failed to launch campaign", {
        description:
          err?.data?.message || err?.data?.error || err?.message || "An unexpected error occurred",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <HugeiconsIcon icon={Rocket01Icon} size={20} strokeWidth={2} />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">Launch Campaign</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Review audience quote and attest compliance to broadcast
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Campaign Overview Card */}
          <div className="rounded-xl border bg-muted/20 p-3 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground text-sm">{campaign.name}</span>
              <ChannelBadge channel={campaign.channel} />
            </div>
            {campaign.message_subject && (
              <p className="text-muted-foreground text-[11px]">
                <strong className="text-foreground">Subject:</strong> {campaign.message_subject}
              </p>
            )}
            <p className="text-muted-foreground text-[11px] line-clamp-2 font-mono bg-background/60 p-2 rounded-lg border">
              {campaign.message_body || "No message body specified"}
            </p>
          </div>

          {/* Quote & Estimate */}
          {isEstimating || !estimate || estimate.status === "preparing" ? (
            <div className="flex flex-col items-center justify-center py-6 gap-2 text-center rounded-xl border bg-muted/10 p-4">
              <HugeiconsIcon icon={Loading03Icon} size={24} className="animate-spin text-lime-600 dark:text-lime-400" />
              <p className="text-xs font-semibold text-foreground">
                {estimate?.status === "preparing"
                  ? "Preparing audience snapshot..."
                  : "Calculating audience recipients and rate..."}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {estimate?.status === "preparing"
                  ? "Deduplicating contacts and validating active channels."
                  : "Checking subscriber records and credit balance."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border p-3">
                  <p className="text-[10px] text-muted-foreground">Target Recipients</p>
                  <p className="text-lg font-bold text-foreground mt-0.5">
                    {formatNumber(estimate.quantity)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Eligible contacts</p>
                </div>

                <div className="rounded-xl border p-3">
                  <p className="text-[10px] text-muted-foreground">Required Credits</p>
                  <p
                    className={cn(
                      "text-lg font-bold mt-0.5",
                      hasSufficientCredits ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
                    )}
                  >
                    {formatNumber(requiredCredits)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Available: {formatNumber(availableCredits)}
                  </p>
                </div>
              </div>

              {!hasSufficientCredits && (
                <div className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
                  <HugeiconsIcon icon={AlertCircleIcon} size={18} className="shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <p className="font-semibold">Insufficient Messaging Credits</p>
                    <p className="text-[11px] text-muted-foreground">
                      You need {formatNumber(requiredCredits - availableCredits)} additional{" "}
                      {campaign.channel.toUpperCase()} credits to launch this campaign.
                    </p>
                    {onOpenTopUp && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 h-7 text-xs gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          onOpenChange(false)
                          onOpenTopUp()
                        }}
                      >
                        <HugeiconsIcon icon={Wallet01Icon} size={14} />
                        Top Up Credits Now
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Compliance Attestation Checkbox */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
            <div className="flex items-center gap-2 text-primary font-semibold text-xs">
              <HugeiconsIcon icon={Shield01Icon} size={16} />
              <span>Compliance & Anti-Spam Attestation</span>
            </div>
            <label className="flex items-start gap-2.5 cursor-pointer text-[11px] text-muted-foreground leading-snug">
              <input
                type="checkbox"
                checked={hasAttested}
                onChange={(e) => setHasAttested(e.target.checked)}
                className="mt-0.5 size-4 rounded border-border/80 text-primary accent-lime-500 cursor-pointer"
              />
              <span>
                I confirm that all recipients in this audience have explicitly opted in to receive
                messages from our organization, and this campaign strictly complies with anti-spam
                regulations.
              </span>
            </label>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isActionLoading}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!hasAttested || !hasSufficientCredits || isActionLoading || isEstimating || estimate?.status !== "ready"}
            onClick={handleConfirmLaunch}
            className="gap-1.5 shadow-xs"
          >
            {isActionLoading ? (
              <>
                <HugeiconsIcon icon={Loading03Icon} size={14} className="animate-spin" />
                Broadcasting...
              </>
            ) : (
              <>
                <HugeiconsIcon icon={Rocket01Icon} size={14} strokeWidth={2} />
                Confirm & Launch
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
