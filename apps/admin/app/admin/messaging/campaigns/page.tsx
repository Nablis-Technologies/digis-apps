"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import {
  Mail01Icon,
  RefreshIcon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import {
  useListAdminCampaignsQuery,
  type AdminCampaign,
} from "@workspace/store/reducers/adminMessagingApi"

export default function AdminCampaignsPage() {
  const { data, isLoading, refetch } = useListAdminCampaignsQuery()
  const campaigns: AdminCampaign[] = data?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Organization Broadcast Campaigns</h1>
          <p className="text-sm text-muted-foreground">
            Monitor SMS, Email, and WhatsApp campaigns created across all organizations
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
              Loading broadcast campaigns...
            </div>
          ) : campaigns.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No broadcast campaigns found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-xs font-medium text-muted-foreground">
                    <th className="pb-3 font-medium">Campaign Name</th>
                    <th className="pb-3 font-medium">Channel</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Recipients</th>
                    <th className="pb-3 font-medium">Estimated Credits</th>
                    <th className="pb-3 font-medium">Actual Credits</th>
                    <th className="pb-3 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/25">
                  {campaigns.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/30">
                      <td className="py-3 font-medium">{c.name}</td>
                      <td className="py-3">
                        <span className="capitalize">{c.channel}</span>
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            c.status === "completed"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                              : c.status === "running"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                              : c.status === "paused"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                              : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 tabular-nums">{c.recipient_count?.toLocaleString() ?? 0}</td>
                      <td className="py-3 tabular-nums">{c.cost_estimate_credits?.toLocaleString() ?? "—"}</td>
                      <td className="py-3 tabular-nums">{c.actual_credits_used?.toLocaleString() ?? "—"}</td>
                      <td className="py-3 text-xs text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString()}
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
