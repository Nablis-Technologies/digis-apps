"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import {
  ChartBarLineIcon,
  CheckmarkCircle01Icon,
  AlertCircleIcon,
  UserGroupIcon,
  ArrowUpRight01Icon,
  Cancel01Icon,
  Loading03Icon,
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
import { Badge, ChannelBadge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { formatNumber, formatDate } from "@/lib/utils"
import {
  useGetCampaignAnalyticsQuery,
  type Campaign,
  type CampaignAnalytics,
} from "@workspace/store/reducers/messagingApi"

interface CampaignAnalyticsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  campaign: Campaign | null
}

export function CampaignAnalyticsDialog({
  open,
  onOpenChange,
  organizationId,
  campaign,
}: CampaignAnalyticsDialogProps) {
  const { data: analyticsData, isLoading } = useGetCampaignAnalyticsQuery(
    { organizationId, campaignId: campaign?.id || "" },
    { skip: !open || !campaign || !organizationId }
  )

  const stats: CampaignAnalytics | null = analyticsData?.data ?? null

  if (!campaign) return null

  // Safely extract backend telemetry values
  const sent = stats?.sent ?? stats?.sent_count ?? campaign.quoted_quantity ?? 0
  const delivered =
    stats?.delivered ??
    stats?.delivered_count ??
    (campaign.status === "completed" ? sent : 0)
  const failed =
    (stats?.failed ?? stats?.failed_count ?? 0) + (stats?.unavailable ?? 0)
  const suppressed = stats?.suppressed ?? stats?.unsubscribed_count ?? 0
  const clicks = stats?.clicks ?? stats?.link_clicks_count ?? 0
  const consumedCredits = stats?.consumed ?? 0

  const totalRecipients =
    stats?.total_recipients ??
    (sent > 0 ? sent : campaign.quoted_quantity ?? 0)

  const deliveryRate =
    typeof stats?.delivery_rate_percentage === "number"
      ? stats.delivery_rate_percentage.toFixed(1)
      : sent > 0
      ? ((delivered / sent) * 100).toFixed(1)
      : "100.0"

  const ctrRate =
    typeof stats?.click_through_rate_percentage === "number"
      ? stats.click_through_rate_percentage.toFixed(1)
      : delivered > 0 && clicks > 0
      ? ((clicks / delivered) * 100).toFixed(1)
      : "0.0"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <HugeiconsIcon icon={ChartBarLineIcon} size={20} strokeWidth={2} />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">Campaign Delivery & Analytics</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Live performance data for &quot;{campaign.name}&quot;
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <HugeiconsIcon icon={Loading03Icon} size={24} className="animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Aggregating telemetry logs...</p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Top KPI Cards */}
            <div className="grid grid-cols-2 gap-2.5">
              <Card className="p-3">
                <p className="text-[10px] text-muted-foreground font-medium">Total Recipients</p>
                <p className="text-xl font-bold mt-1">
                  {formatNumber(totalRecipients)}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <ChannelBadge channel={campaign.channel} />
                  <span className="text-[10px] text-muted-foreground">Broadcast</span>
                </div>
              </Card>

              <Card className="p-3">
                <p className="text-[10px] text-muted-foreground font-medium">Delivered Rate</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {deliveryRate}%
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {formatNumber(delivered)} verified
                </p>
              </Card>
            </div>

            {/* Detailed Breakdown */}
            <div className="rounded-xl border divide-y text-xs">
              <div className="flex items-center justify-between p-2.5">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} className="text-emerald-600" />
                  Successfully Delivered
                </span>
                <span className="font-semibold font-mono text-emerald-600 dark:text-emerald-400">
                  {formatNumber(delivered)}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <HugeiconsIcon icon={AlertCircleIcon} size={14} className="text-destructive" />
                  Bounced / Failed
                </span>
                <span className="font-semibold font-mono text-muted-foreground">
                  {formatNumber(failed)}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <HugeiconsIcon icon={Cancel01Icon} size={14} className="text-muted-foreground" />
                  Suppressed / Unsubscribed
                </span>
                <span className="font-semibold font-mono text-muted-foreground">
                  {formatNumber(suppressed)}
                </span>
              </div>

              {clicks > 0 && (
                <div className="flex items-center justify-between p-2.5 bg-muted/20">
                  <span className="text-foreground font-medium flex items-center gap-1.5">
                    <HugeiconsIcon icon={ArrowUpRight01Icon} size={14} className="text-primary" />
                    Link Click-Through (CTR)
                  </span>
                  <span className="font-bold font-mono text-primary">
                    {formatNumber(clicks)} clicks ({ctrRate}%)
                  </span>
                </div>
              )}

              {consumedCredits > 0 && (
                <div className="flex items-center justify-between p-2.5 bg-muted/10">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    Credits Consumed
                  </span>
                  <span className="font-semibold font-mono">
                    {formatNumber(consumedCredits)} credits
                  </span>
                </div>
              )}
            </div>

            {/* Timestamps Card */}
            <div className="rounded-xl border bg-muted/20 p-3 text-[11px] text-muted-foreground space-y-1">
              {campaign.launched_at && (
                <p>
                  <strong>Launched:</strong> {formatDate(campaign.launched_at)}
                </p>
              )}
              {campaign.completed_at && (
                <p>
                  <strong>Completed:</strong> {formatDate(campaign.completed_at)}
                </p>
              )}
              <p>
                <strong>Timezone:</strong> {campaign.timezone || "Africa/Addis_Ababa"}
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="pt-2 border-t">
          <Button variant="outline" size="sm" className="w-full" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
