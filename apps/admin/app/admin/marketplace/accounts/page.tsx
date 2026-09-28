"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import {
  WalletIcon,
  RefreshIcon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import {
  useListAdminSellerPayoutAccountsQuery,
  useVerifyAdminSellerPayoutAccountMutation,
  type AdminSellerPayoutAccount,
} from "@workspace/store/reducers/adminMarketplaceApi"

export default function SellerAccountsPage() {
  const { data, isLoading, refetch } = useListAdminSellerPayoutAccountsQuery()
  const [verifyAccount] = useVerifyAdminSellerPayoutAccountMutation()

  const accounts: AdminSellerPayoutAccount[] = data?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Marketplace Seller Accounts</h1>
          <p className="text-sm text-muted-foreground">
            Manage and verify bank / mobile money accounts registered by ticket sellers
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
              Loading seller accounts...
            </div>
          ) : accounts.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No seller accounts found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-xs font-medium text-muted-foreground">
                    <th className="pb-3 font-medium">Account Name</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Account Number</th>
                    <th className="pb-3 font-medium">Institution</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/25">
                  {accounts.map((a) => (
                    <tr key={a.id} className="hover:bg-muted/30">
                      <td className="py-3 font-medium">{a.account_name}</td>
                      <td className="py-3 capitalize">{a.account_type.replace(/_/g, " ")}</td>
                      <td className="py-3 font-mono text-xs">{a.account_number}</td>
                      <td className="py-3 text-xs text-muted-foreground">
                        {a.institution_name || a.institution_code}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            a.verified
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                          }`}
                        >
                          {a.verified ? "Verified" : "Pending Verification"}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {!a.verified && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-emerald-600 hover:text-emerald-700"
                            onClick={() => verifyAccount(a.id)}
                          >
                            <HugeiconsIcon icon={CheckmarkCircle01Icon} className="mr-1 size-3.5" />
                            Verify Account
                          </Button>
                        )}
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
