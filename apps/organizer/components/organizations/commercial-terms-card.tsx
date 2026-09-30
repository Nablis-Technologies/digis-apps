"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Coins01Icon,
  CheckmarkBadge01Icon,
  InformationCircleIcon,
  Shield01Icon,
  Calendar03Icon,
} from "@hugeicons/core-free-icons"
import { useGetOrganizationTermsQuery } from "@workspace/store/reducers/commercialApi"
import { formatDate } from "@/lib/utils"

interface CommercialTermsCardProps {
  organizationId: string
}

export function CommercialTermsCard({ organizationId }: CommercialTermsCardProps) {
  const { data: termsResponse, isLoading, error } = useGetOrganizationTermsQuery(
    { organizationId },
    { skip: !organizationId }
  )

  const terms = termsResponse?.data
  const currentTerms = terms?.current_terms
  const scheduledTerms = terms?.scheduled_terms
  const components = currentTerms?.components || []

  if (isLoading) {
    return (
      <Card className="rounded-2xl border border-border/70 p-6 shadow-xs space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72" />
        <div className="grid gap-3 pt-2">
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </Card>
    )
  }

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Coins01Icon} strokeWidth={2} className="size-5 text-primary" />
            <h3 className="text-base font-semibold text-foreground">Commercial Agreement & Fee Schedule</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Applicable platform fee rates and terms governing your event ticketing payouts.
          </p>
        </div>
        {currentTerms && (
          <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1 font-semibold w-fit">
            <HugeiconsIcon icon={CheckmarkBadge01Icon} className="size-3.5" />
            Active Agreement
          </Badge>
        )}
      </div>

      {components.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/70 p-6 text-center text-xs text-muted-foreground">
          <HugeiconsIcon icon={Shield01Icon} className="size-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="font-medium text-foreground">Standard Platform Agreement Active</p>
          <p className="mt-1">
            Standard baseline rates apply (2.50% platform fee per ticket transaction). Custom commercial terms will appear here if negotiated.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {components.map((comp, idx) => {
              const ratePct = (comp.rate_bps / 100).toFixed(2)
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">{comp.label || "Platform Ticketing Fee"}</h4>
                      <p className="text-[11px] text-muted-foreground capitalize mt-0.5">
                        {comp.component_type.replace(/_/g, " ")} • {comp.calculation_type}
                      </p>
                    </div>
                    <Badge variant="secondary" className="font-mono text-xs font-semibold">
                      {ratePct}%
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border/40">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Default Payer</span>
                      <span className="font-medium capitalize text-foreground">
                        {comp.charged_to || "buyer"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Refund Policy</span>
                      <span className="font-medium capitalize text-foreground">
                        {comp.refund_policy?.replace(/_/g, " ") || "Non-refundable"}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {currentTerms?.effective_from && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
              <HugeiconsIcon icon={Calendar03Icon} className="size-3.5" />
              <span>
                Effective since {formatDate(currentTerms.effective_from)}
                {currentTerms.effective_until ? ` until ${formatDate(currentTerms.effective_until)}` : " (Ongoing)"}
              </span>
            </div>
          )}
        </div>
      )}

      {scheduledTerms && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400">
            <HugeiconsIcon icon={InformationCircleIcon} className="size-4" />
            <span>Scheduled Terms Update</span>
          </div>
          <p className="text-muted-foreground">
            A revised fee schedule is scheduled to take effect on {formatDate(scheduledTerms.effective_from || "")}.
          </p>
        </div>
      )}
    </div>
  )
}
