"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import {
  BankIcon,
  RefreshIcon,
  CheckmarkCircle01Icon,
  SentIcon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import {
  useListAdminSellerPayoutsQuery,
  useDispatchAdminSellerPayoutMutation,
  useReconcileAdminSellerPayoutMutation,
  type AdminSellerPayout,
} from "@workspace/store/reducers/adminMarketplaceApi"

export default function SellerPayoutsPage() {
  const { data, isLoading, refetch } = useListAdminSellerPayoutsQuery()
  const [dispatchPayout] = useDispatchAdminSellerPayoutMutation()
  const [reconcilePayout] = useReconcileAdminSellerPayoutMutation()

  const payouts: AdminSellerPayout[] = data?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Marketplace Seller Payouts</h1>
          <p className="text-sm text-muted-foreground">
            Review, dispatch, and reconcile secondary ticket resale payouts to sellers
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
              Loading seller payouts...
            </div>
          ) : payouts.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No seller payouts found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-xs font-medium text-muted-foreground">
                    <th className="pb-3 font-medium">Payout ID</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Reference</th>
                    <th className="pb-3 font-medium">Created</th>
                    <th className="pb-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/25">
                  {payouts.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/30">
                      <td className="py-3 font-mono text-xs text-muted-foreground">
                        {p.id.slice(0, 8)}...
                      </td>
                      <td className="py-3 font-medium tabular-nums">
                        {(p.amount_minor / 100).toFixed(2)} {p.currency}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            p.status === "reconciled"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                              : p.status === "dispatched"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                              : p.status === "failed"
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 text-xs text-muted-foreground">
                        {p.provider_reference || "—"}
                      </td>
                      <td className="py-3 text-xs text-muted-foreground">
                        {new Date(p.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-1">
                          {p.status === "pending" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs text-blue-600 hover:text-blue-700"
                              onClick={() => dispatchPayout({ id: p.id })}
                            >
                              <HugeiconsIcon icon={SentIcon} className="mr-1 size-3.5" />
                              Dispatch
                            </Button>
                          )}
                          {p.status === "dispatched" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs text-emerald-600 hover:text-emerald-700"
                              onClick={() => reconcilePayout({ id: p.id })}
                            >
                              <HugeiconsIcon icon={CheckmarkCircle01Icon} className="mr-1 size-3.5" />
                              Reconcile
                            </Button>
                          )}
                        </div>
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
