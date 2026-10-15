"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import {
  LockIcon,
  RefreshIcon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import {
  useListCampaignVolumePoliciesQuery,
  type CampaignVolumePolicy,
} from "@workspace/store/reducers/adminMessagingApi"

export default function VolumePoliciesPage() {
  const { data, isLoading, refetch } = useListCampaignVolumePoliciesQuery()
  const policies: CampaignVolumePolicy[] = data?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Campaign Volume Policies</h1>
          <p className="text-sm text-muted-foreground">
            Rate limits, hourly/daily throughput throttles, and quiet hour boundaries
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <HugeiconsIcon icon={RefreshIcon} className="mr-1.5 size-4" />
          Refresh
        </Button>
      </div>

      <div className="rounded-xl border border-border/50 bg-card shadow-xs">
        <div className="p-4">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Loading volume policies...
            </div>
          ) : policies.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No volume policies found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-xs font-medium text-muted-foreground">
                    <th className="pb-3 font-medium">Channel</th>
                    <th className="pb-3 font-medium">Max Hourly Rate</th>
                    <th className="pb-3 font-medium">Max Daily Rate</th>
                    <th className="pb-3 font-medium">Quiet Hours</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/25">
                  {policies.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/30">
                      <td className="py-3 font-medium capitalize">{p.channel}</td>
                      <td className="py-3 tabular-nums">{p.max_hourly_rate?.toLocaleString()} msgs/hr</td>
                      <td className="py-3 tabular-nums">{p.max_daily_rate?.toLocaleString()} msgs/day</td>
                      <td className="py-3 text-xs text-muted-foreground">
                        {p.quiet_hours_start && p.quiet_hours_end
                          ? `${p.quiet_hours_start} - ${p.quiet_hours_end}`
                          : "None"}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            p.active
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                              : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                          }`}
                        >
                          {p.active ? "Active" : "Disabled"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
