"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  BankIcon,
  MoneyReceive01Icon,
  Clock01Icon,
  LockIcon,
  BookmarkIcon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  PlayIcon,
  RefreshIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { toastSuccess, toastError } from "@/lib/toast"
import { useListOrganizationsQuery } from "@/store/reducers/organizationsApi"
import {
  useGetBalanceQuery,
  useListPayoutsQuery,
  useListPayoutAccountsQuery,
  useListLedgerEntriesQuery,
  useDispatchPayoutMutation,
  useReconcilePayoutMutation,
  useVerifyPayoutAccountMutation,
  useSuspendPayoutAccountMutation,
} from "@/store/reducers/financeApi"

type Tab = "balance" | "accounts" | "payouts" | "ledger"

function fmtMinor(amountMinor: number | undefined, currency?: string) {
  if (amountMinor == null) return "—"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency ?? "ETB",
    maximumFractionDigits: 2,
  }).format(amountMinor / 100)
}

function StatusPill({ status }: { status: string }) {
  const lower = String(status ?? "").toLowerCase()
  const ok = lower.includes("paid") || lower.includes("active") || lower.includes("verified") || lower.includes("complete")
  const pending = lower.includes("pend") || lower.includes("request") || lower.includes("draft") || lower.includes("process")
  const bad = lower.includes("suspend") || lower.includes("close") || lower.includes("fail") || lower.includes("cancel")
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
        ok
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
          : pending
            ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
            : bad
              ? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
              : "bg-zinc-50 text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-500"
      )}
    >
      {status}
    </span>
  )
}

export default function PayoutsPage() {
  const [organizationId, setOrganizationId] = useState<string>("")
  const [tab, setTab] = useState<Tab>("balance")

  const { data: orgData, isLoading: orgLoading } = useListOrganizationsQuery({ per_page: 100 })
  const organizations = orgData?.data ?? []

  const orgOptions = organizations.map((o) => ({
    value: o.id,
    label: o.name,
    description: o.city ? `${o.city}, ${o.country ?? ""}` : undefined,
  }))

  const { data: balanceData, isLoading: balanceLoading } = useGetBalanceQuery(
    organizationId ? { organizationId, currency: "ETB" } : { organizationId: "", currency: "ETB" },
    { skip: !organizationId }
  )
  const { data: accountsData, isLoading: accountsLoading } = useListPayoutAccountsQuery(
    organizationId ? { organizationId } : { organizationId: "" },
    { skip: !organizationId }
  )
  const { data: payoutsData, isLoading: payoutsLoading } = useListPayoutsQuery(
    organizationId ? { organizationId } : { organizationId: "" },
    { skip: !organizationId }
  )
  const { data: ledgerData, isLoading: ledgerLoading } = useListLedgerEntriesQuery(
    organizationId ? { organizationId } : { organizationId: "" },
    { skip: !organizationId }
  )

  const [dispatchPayout] = useDispatchPayoutMutation()
  const [reconcilePayout] = useReconcilePayoutMutation()
  const [verifyAccount] = useVerifyPayoutAccountMutation()
  const [suspendAccount] = useSuspendPayoutAccountMutation()

  const handleDispatch = async (payoutId: string) => {
    try {
      await dispatchPayout({ organizationId, id: payoutId }).unwrap()
      toastSuccess("Payout dispatched.")
    } catch (err) {
      toastError(err, "Failed to dispatch payout.")
    }
  }

  const handleReconcile = async (payoutId: string) => {
    try {
      await reconcilePayout({ organizationId, id: payoutId }).unwrap()
      toastSuccess("Payout reconciled.")
    } catch (err) {
      toastError(err, "Failed to reconcile payout.")
    }
  }

  const handleVerifyAccount = async (accountId: string) => {
    try {
      await verifyAccount({
        organizationId,
        id: accountId,
        body: { reason: "Admin verified", evidence_reference: "Admin review" },
      }).unwrap()
      toastSuccess("Payout account verified.")
    } catch (err) {
      toastError(err, "Failed to verify payout account.")
    }
  }

  const handleSuspendAccount = async (accountId: string) => {
    try {
      await suspendAccount({
        organizationId,
        id: accountId,
        body: { reason: "Admin suspended" },
      }).unwrap()
      toastSuccess("Payout account suspended.")
    } catch (err) {
      toastError(err, "Failed to suspend payout account.")
    }
  }

  const balance = Array.isArray(balanceData?.data) ? balanceData.data[0] : balanceData?.data

  const tabs: { key: Tab; label: string }[] = [
    { key: "balance", label: "Balance" },
    { key: "accounts", label: "Payout Accounts" },
    { key: "payouts", label: "Payouts" },
    { key: "ledger", label: "Ledger" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Payouts</h1>
          <p className="text-sm text-muted-foreground">
            Organization treasury, balance, and payout destinations
          </p>
        </div>
        <div className="w-72">
          <SearchableSelect
            options={orgOptions}
            value={organizationId}
            onChange={setOrganizationId}
            placeholder="Select an organization..."
            searchPlaceholder="Search organizations..."
            loading={orgLoading}
            emptyMessage="No organizations found."
          />
        </div>
      </div>

      {orgLoading ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : !organizationId ? (
        <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
          <HugeiconsIcon icon={BankIcon} strokeWidth={2} className="mx-auto mb-3 size-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Select an organization to view its finance details
          </p>
        </div>
      ) : (
        <>
          <div className="flex gap-1 border-b border-border/50">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "-mb-px flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                  tab === t.key
                    ? "border-lime-500 text-lime-600"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "balance" && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {balanceLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 rounded-xl" />
                ))
              ) : (
                <>
                  <BalanceCard
                    title="Available"
                    icon={MoneyReceive01Icon}
                    value={fmtMinor(balance?.available_minor, balance?.currency)}
                    className="text-emerald-600"
                  />
                  <BalanceCard
                    title="Pending"
                    icon={Clock01Icon}
                    value={fmtMinor(balance?.pending_minor, balance?.currency)}
                    className="text-amber-600"
                  />
                  <BalanceCard
                    title="Reserved"
                    icon={LockIcon}
                    value={fmtMinor(balance?.reserved_minor, balance?.currency)}
                    className="text-zinc-600"
                  />
                  <BalanceCard
                    title="Total"
                    icon={BookmarkIcon}
                    value={fmtMinor(balance?.total_minor, balance?.currency)}
                  />
                </>
              )}
            </div>
          )}

          {tab === "accounts" && (
            <div className="rounded-xl border border-border/50 bg-card shadow-xs">
              {accountsLoading ? (
                <Skeleton className="h-40 rounded-xl" />
              ) : (accountsData?.data ?? []).length === 0 ? (
                <EmptyState icon={BankIcon} text="No payout accounts configured" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        <th className="px-6 py-3">Account</th>
                        <th className="px-6 py-3">Provider</th>
                        <th className="px-6 py-3">Type</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Created</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(accountsData?.data ?? []).map((a) => (
                        <tr key={a.id} className="border-b border-border/50 last:border-b-0">
                          <td className="px-6 py-3 font-medium">
                            {a.account_label ?? a.account_name ?? a.id.slice(0, 8)}
                          </td>
                          <td className="px-6 py-3">{a.provider}</td>
                          <td className="px-6 py-3 capitalize">{a.type}</td>
                          <td className="px-6 py-3">
                            <StatusPill status={a.status} />
                          </td>
                          <td className="px-6 py-3 text-muted-foreground">
                            {a.created_at ? new Date(a.created_at).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-6 py-3 text-right">
                            <div className="flex justify-end gap-1">
                              {a.status !== "verified" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs text-emerald-600 hover:text-emerald-700"
                                  onClick={() => handleVerifyAccount(a.id)}
                                >
                                  <HugeiconsIcon icon={CheckmarkCircle01Icon} className="mr-1 size-3.5" />
                                  Verify
                                </Button>
                              )}
                              {a.status !== "suspended" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs text-destructive hover:text-destructive"
                                  onClick={() => handleSuspendAccount(a.id)}
                                >
                                  <HugeiconsIcon icon={Cancel01Icon} className="mr-1 size-3.5" />
                                  Suspend
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
          )}

          {tab === "payouts" && (
            <div className="rounded-xl border border-border/50 bg-card shadow-xs">
              {payoutsLoading ? (
                <Skeleton className="h-40 rounded-xl" />
              ) : (payoutsData?.data ?? []).length === 0 ? (
                <EmptyState icon={MoneyReceive01Icon} text="No payouts yet" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        <th className="px-6 py-3">Amount</th>
                        <th className="px-6 py-3">Currency</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Provider</th>
                        <th className="px-6 py-3">Requested</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(payoutsData?.data ?? []).map((p) => (
                        <tr key={p.id} className="border-b border-border/50 last:border-b-0">
                          <td className="px-6 py-3 font-medium">
                            {fmtMinor(p.amount_minor, p.currency)}
                          </td>
                          <td className="px-6 py-3">{p.currency}</td>
                          <td className="px-6 py-3">
                            <StatusPill status={p.status} />
                          </td>
                          <td className="px-6 py-3">{p.provider ?? "—"}</td>
                          <td className="px-6 py-3 text-muted-foreground">
                            {p.requested_at ? new Date(p.requested_at).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-6 py-3 text-right">
                            <div className="flex justify-end gap-1">
                              {p.status === "pending" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs text-primary hover:text-primary/80"
                                  onClick={() => handleDispatch(p.id)}
                                >
                                  <HugeiconsIcon icon={PlayIcon} className="mr-1 size-3.5" />
                                  Dispatch
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-muted-foreground hover:text-foreground"
                                onClick={() => handleReconcile(p.id)}
                              >
                                <HugeiconsIcon icon={RefreshIcon} className="mr-1 size-3.5" />
                                Reconcile
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === "ledger" && (
            <div className="rounded-xl border border-border/50 bg-card shadow-xs">
              {ledgerLoading ? (
                <Skeleton className="h-40 rounded-xl" />
              ) : (ledgerData?.data ?? []).length === 0 ? (
                <EmptyState icon={BookmarkIcon} text="No ledger entries" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        <th className="px-6 py-3">Description</th>
                        <th className="px-6 py-3">Type</th>
                        <th className="px-6 py-3">Amount</th>
                        <th className="px-6 py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(ledgerData?.data ?? []).map((l) => (
                        <tr key={l.id} className="border-b border-border/50 last:border-b-0">
                          <td className="px-6 py-3 font-medium">
                            {l.description ?? l.entry_type}
                          </td>
                          <td className="px-6 py-3 capitalize">{l.entry_type}</td>
                          <td className="px-6 py-3">{fmtMinor(l.amount_minor, l.currency)}</td>
                          <td className="px-6 py-3 text-muted-foreground">
                            {l.created_at ? new Date(l.created_at).toLocaleDateString() : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function BalanceCard({
  title,
  icon,
  value,
  className,
}: {
  title: string
  icon: typeof BankIcon
  value: string
  className?: string
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <HugeiconsIcon icon={icon} strokeWidth={2} className="size-4.5" />
        </div>
      </div>
      <p className={cn("mt-3 text-2xl font-semibold tracking-tight", className)}>{value}</p>
    </div>
  )
}

function EmptyState({ icon, text }: { icon: typeof BankIcon; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <HugeiconsIcon icon={icon} strokeWidth={2} className="mb-3 size-10 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  )
}
