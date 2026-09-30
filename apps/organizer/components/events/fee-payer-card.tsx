"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Coins01Icon,
  Wallet01Icon,
  CheckmarkCircle01Icon,
  InformationCircleIcon,
  Loading03Icon,
} from "@hugeicons/core-free-icons"
import {
  useGetOrganizationTermsQuery,
  useListEventPayerSelectionsQuery,
  useSetEventPayerSelectionMutation,
} from "@workspace/store/reducers/commercialApi"
import { cn } from "@workspace/ui/lib/utils"

interface FeePayerCardProps {
  eventId: string
  organizationId: string
  currency?: string
}

export function FeePayerCard({ eventId, organizationId, currency = "ETB" }: FeePayerCardProps) {
  const { data: termsData, isLoading: isLoadingTerms } = useGetOrganizationTermsQuery(
    { organizationId },
    { skip: !organizationId }
  )

  const { data: selectionsData, isLoading: isLoadingSelections } = useListEventPayerSelectionsQuery(
    { eventId },
    { skip: !eventId }
  )

  const [setSelection, { isLoading: isSaving }] = useSetEventPayerSelectionMutation()

  const currentTerms = termsData?.data?.current_terms
  const feeComponent = currentTerms?.components?.[0]
  const currentSelection = selectionsData?.data?.[0]

  // Default to buyer or the current selection / term's default charged_to
  const effectivePayer = currentSelection?.charged_to || feeComponent?.charged_to || "buyer"
  const [selectedPayer, setSelectedPayer] = useState<"buyer" | "organizer">(effectivePayer)

  useEffect(() => {
    if (currentSelection?.charged_to) {
      setSelectedPayer(currentSelection.charged_to)
    } else if (feeComponent?.charged_to) {
      setSelectedPayer(feeComponent.charged_to)
    }
  }, [currentSelection, feeComponent])

  const ratePercentage = feeComponent?.rate_bps
    ? (feeComponent.rate_bps / 100).toFixed(2)
    : "2.50"

  const handleSave = async (payer: "buyer" | "organizer") => {
    setSelectedPayer(payer)

    if (!feeComponent?.id && !feeComponent?.fee_component_id) {
      // If backend mock/terms have no explicit component ID, we notify user
      toast.info("Fee payer preference updated locally", {
        description: "Organization default platform rate will be applied.",
      })
      return
    }

    try {
      const componentId = feeComponent.id || feeComponent.fee_component_id!
      await setSelection({
        eventId,
        selection: {
          fee_component_id: componentId,
          charged_to: payer,
        },
      }).unwrap()

      toast.success(
        payer === "buyer"
          ? "Platform fee passed to ticket buyers"
          : "Platform fee absorbed into ticket prices",
        {
          description: "New ticket checkouts will reflect this fee allocation immediately.",
        }
      )
    } catch (err: any) {
      toast.error(err?.data?.message || err?.data?.error || "Failed to update fee payer setting")
      // Revert on error
      if (currentSelection?.charged_to) {
        setSelectedPayer(currentSelection.charged_to)
      }
    }
  }

  if (isLoadingTerms || isLoadingSelections) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </CardContent>
      </Card>
    )
  }

  const sampleTicketPrice = 1000
  const sampleFee = (sampleTicketPrice * (Number(ratePercentage) / 100))

  return (
    <Card className="overflow-hidden border border-border/70 shadow-xs">
      <CardHeader className="pb-3 flex flex-row items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Coins01Icon} strokeWidth={2} className="size-4 text-primary" />
            <CardTitle className="text-base font-semibold">Ticketing Fee Allocation</CardTitle>
          </div>
          <CardDescription className="text-xs mt-1">
            Choose whether the standard platform fee ({ratePercentage}%) is passed to attendees or absorbed in ticket prices.
          </CardDescription>
        </div>
        <Badge variant="outline" className="text-xs font-mono">
          Platform Rate: {ratePercentage}%
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        <div className="grid gap-3 sm:grid-cols-2">
          {/* Option 1: Pass to Buyer */}
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSave("buyer")}
            className={cn(
              "text-left p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between relative",
              selectedPayer === "buyer"
                ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                : "border-border/60 hover:border-border hover:bg-muted/30"
            )}
          >
            {selectedPayer === "buyer" && (
              <div className="absolute top-3 right-3 text-primary">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2.5} className="size-4" />
              </div>
            )}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">Pass fees to Buyer</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Recommended</Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Attendee pays the ticket price plus the service fee at checkout. You receive 100% of your ticket face value.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-border/40 text-xs text-muted-foreground flex justify-between items-center">
              <span>Example on 1,000 {currency} ticket:</span>
              <span className="font-medium text-foreground">Buyer pays: 1,025 {currency}</span>
            </div>
          </button>

          {/* Option 2: Absorb in Ticket Price */}
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSave("organizer")}
            className={cn(
              "text-left p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between relative",
              selectedPayer === "organizer"
                ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                : "border-border/60 hover:border-border hover:bg-muted/30"
            )}
          >
            {selectedPayer === "organizer" && (
              <div className="absolute top-3 right-3 text-primary">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2.5} className="size-4" />
              </div>
            )}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">Absorb in Ticket Price</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Attendee pays the exact ticket price with zero added fees. Platform fee is deducted from your ticket payout.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-border/40 text-xs text-muted-foreground flex justify-between items-center">
              <span>Example on 1,000 {currency} ticket:</span>
              <span className="font-medium text-foreground">You receive: {(1000 - sampleFee).toFixed(0)} {currency}</span>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 p-3 rounded-lg">
          <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} className="size-4 text-muted-foreground shrink-0" />
          <span>
            Fee adjustments take effect immediately for all subsequent customer orders and do not affect tickets already sold.
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
