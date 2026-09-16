"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { DataTable, type Column } from "@/components/ui/data-table"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Wallet01Icon,
  CreditCardIcon,
  BankIcon,
  Invoice01Icon,
  Add01Icon,
  Clock01Icon,
  CheckmarkCircle01Icon,
  AlertCircleIcon,
  Building01Icon,
  ArrowUpRight01Icon,
  Search01Icon,
  SparklesIcon,
  StarIcon,
  Delete02Icon,
  SmartPhone01Icon,
} from "@hugeicons/core-free-icons"
import Image from "next/image"
import { useListOwnerOrganizationsQuery } from "@workspace/store/reducers/organizationsApi"
import {
  useGetOrganizerBalanceQuery,
  useListOrganizerPayoutAccountsQuery,
  useAddOrganizerPayoutAccountMutation,
  useSetDefaultOrganizerPayoutAccountMutation,
  useCloseOrganizerPayoutAccountMutation,
  useListOrganizerPayoutsQuery,
  useRequestOrganizerPayoutMutation,
  useListOrganizerLedgerEntriesQuery,
  type Payout,
  type PayoutAccount,
  type LedgerEntry,
} from "@workspace/store/reducers/financeApi"
import {
  formatCurrency,
  formatDateTime,
  formatNumber,
} from "@/lib/utils"
import {
  ETHIOPIAN_BANKS,
  BANK_LOGOS,
  ETHIOPIAN_MOBILE_WALLETS,
} from "@/lib/constants"

// ─── Ethiopian Banks & Mobile Money Providers ────────────────────────────────

function getDestinationDisplay(slug?: string | number | null, type?: string) {
  const strSlug = slug != null ? String(slug).trim() : ""
  const lowerSlug = strSlug.toLowerCase()

  const isMobile =
    type === "mobile_money" ||
    ["telebirr", "cbe_birr", "mpesa", "awash_birr"].includes(lowerSlug)

  if (isMobile) {
    const wallet = ETHIOPIAN_MOBILE_WALLETS.find(
      (w) => w.value.toLowerCase() === lowerSlug
    )
    return {
      isMobile: true,
      name: wallet ? wallet.label : strSlug ? strSlug.toUpperCase() : "Mobile Wallet",
      subtitle: wallet ? wallet.operator : "Mobile Money",
      typeBadge: "Mobile Wallet",
      logo: wallet?.logo || null,
      walletKey: wallet?.value || lowerSlug || "telebirr",
      color: wallet?.color || "#0072BC",
    }
  }

  const bank = ETHIOPIAN_BANKS.find(
    (b) => b.value.toLowerCase() === lowerSlug
  )
  return {
    isMobile: false,
    name: bank ? bank.label : strSlug ? strSlug.toUpperCase() : "Bank Account",
    subtitle: "Commercial Bank",
    typeBadge: "Bank Account",
    logo: BANK_LOGOS[lowerSlug] || null,
    walletKey: null,
    color: undefined as string | undefined,
  }
}

function getBankName(slug?: string | number | null, type?: string): string {
  if (slug == null || slug === "") return type === "mobile_money" ? "Mobile Wallet" : "Bank Account"
  return getDestinationDisplay(slug, type).name
}

function containerVariants(delay: number) {
  return {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.3 },
  }
}

// ─── Status Badge Helpers ───────────────────────────────────────────────────

type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "success"
  | "warning"
  | "info"
  | "outline"

function getPayoutStatusVariant(status: string): BadgeVariant {
  switch (status.toLowerCase()) {
    case "paid":
    case "completed":
      return "success"
    case "pending":
      return "warning"
    case "processing":
      return "info"
    case "failed":
    case "cancelled":
      return "destructive"
    default:
      return "outline"
  }
}

function getAccountStatusVariant(status: string): BadgeVariant {
  switch (status.toLowerCase()) {
    case "verified":
    case "active":
      return "success"
    case "pending":
      return "warning"
    case "suspended":
    case "closed":
      return "destructive"
    default:
      return "outline"
  }
}

function getLedgerTypeVariant(type: string): BadgeVariant {
  switch (type.toLowerCase()) {
    case "sale":
      return "success"
    case "payout":
      return "info"
    case "refund":
    case "fee":
      return "destructive"
    default:
      return "outline"
  }
}

// ─── Skeletons ──────────────────────────────────────────────────────────────

function PayoutsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-border/50 bg-card p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="size-8 rounded-lg" />
            </div>
            <Skeleton className="mt-4 h-8 w-36" />
            <Skeleton className="mt-2 h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function PayoutsPage() {
  const [selectedOrgId, setSelectedOrgId] = useState<string>("")
  const [activeTab, setActiveTab] = useState("payouts")
  const [searchLedger, setSearchLedger] = useState("")

  // Dialog states
  const [isRequestPayoutOpen, setIsRequestPayoutOpen] = useState(false)
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false)
  const [payoutAmount, setPayoutAmount] = useState("")
  const [selectedPayoutAccountId, setSelectedPayoutAccountId] = useState("")

  // Add Account form state
  const [accountType, setAccountType] = useState<"bank" | "mobile_money">("bank")
  const [accountBankSlug, setAccountBankSlug] = useState("")
  const [selectedWalletSlug, setSelectedWalletSlug] = useState("telebirr")
  const [accountNumber, setAccountNumber] = useState("")
  const [accountName, setAccountName] = useState("")
  const [accountLabel, setAccountLabel] = useState("")

  const selectedPayoutBank = ETHIOPIAN_BANKS.find(
    (b) => b.value.toLowerCase() === String(accountBankSlug || "").toLowerCase()
  )

  // Fetch Owner Organizations
  const { data: organizationsData, isLoading: isLoadingOrgs } = useListOwnerOrganizationsQuery()
  const organizations = organizationsData?.data ?? []

  // Resolve active organization
  const activeOrgId = selectedOrgId || organizations[0]?.id || ""
  const activeOrg = organizations.find((o) => o.id === activeOrgId) || organizations[0]

  // Finance Queries
  const {
    data: balanceData,
    isLoading: isLoadingBalance,
    refetch: refetchBalance,
  } = useGetOrganizerBalanceQuery(
    { organizationId: activeOrgId, currency: "ETB" },
    { skip: !activeOrgId }
  )

  const {
    data: accountsData,
    isLoading: isLoadingAccounts,
    refetch: refetchAccounts,
  } = useListOrganizerPayoutAccountsQuery(activeOrgId, { skip: !activeOrgId })

  const {
    data: payoutsData,
    isLoading: isLoadingPayouts,
    refetch: refetchPayouts,
  } = useListOrganizerPayoutsQuery(
    { organizationId: activeOrgId, page: 1, per_page: 50 },
    { skip: !activeOrgId }
  )

  const {
    data: ledgerData,
    isLoading: isLoadingLedger,
  } = useListOrganizerLedgerEntriesQuery(
    { organizationId: activeOrgId, currency: "ETB", page: 1, per_page: 50 },
    { skip: !activeOrgId }
  )

  // Mutations
  const [addAccount, { isLoading: isAddingAccount }] = useAddOrganizerPayoutAccountMutation()
  const [setDefaultAccount, { isLoading: isSettingDefault }] = useSetDefaultOrganizerPayoutAccountMutation()
  const [closeAccount, { isLoading: isClosingAccount }] = useCloseOrganizerPayoutAccountMutation()
  const [requestPayout, { isLoading: isSubmittingPayout }] = useRequestOrganizerPayoutMutation()

  // Balance extraction
  const balance = useMemo(() => {
    const raw = balanceData?.data
    if (Array.isArray(raw) && raw.length > 0) {
      return raw[0]
    }
    return {
      currency: "ETB",
      available_minor: 0,
      ledger_total_minor: 0,
      reserved_minor: 0,
      pending_maturity_minor: 0,
      next_available_at: null,
    }
  }, [balanceData])

  const availableAmount = balance.available_minor / 100
  const ledgerTotalAmount = balance.ledger_total_minor / 100
  const reservedAmount = balance.reserved_minor / 100
  const pendingAmount = balance.pending_maturity_minor / 100

  // Payout accounts
  const payoutAccounts: PayoutAccount[] = accountsData?.data ?? []
  const defaultAccount = payoutAccounts.find((a) => a.is_default) || payoutAccounts[0]

  // Payouts list
  const payoutsList: Payout[] = payoutsData?.data ?? []

  // Ledger entries
  const ledgerEntries: LedgerEntry[] = ledgerData?.data ?? []
  const filteredLedger = useMemo(() => {
    if (!searchLedger.trim()) return ledgerEntries
    const q = searchLedger.toLowerCase()
    return ledgerEntries.filter(
      (entry) =>
        entry.description?.toLowerCase().includes(q) ||
        entry.type.toLowerCase().includes(q) ||
        entry.event?.title?.toLowerCase().includes(q) ||
        entry.id.toLowerCase().includes(q)
    )
  }, [ledgerEntries, searchLedger])

  // Handlers
  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeOrgId) {
      toast.error("No active organization selected")
      return
    }
    if (accountType === "bank" && !accountBankSlug) {
      toast.error("Please select an Ethiopian bank")
      return
    }
    if (!accountNumber.trim() || !accountName.trim()) {
      toast.error(
        accountType === "bank"
          ? "Please enter both bank account number and account holder name"
          : "Please enter both mobile phone number and registered full name"
      )
      return
    }

    const isBank = accountType === "bank"
    const bankItem = ETHIOPIAN_BANKS.find((b) => b.value === accountBankSlug)
    const walletItem = ETHIOPIAN_MOBILE_WALLETS.find((w) => w.value === selectedWalletSlug)

    const slug = isBank ? accountBankSlug : selectedWalletSlug
    const fallbackLabel = isBank
      ? `${bankItem?.label || "Bank"} - ${accountNumber.slice(-4)}`
      : `${walletItem?.label || "Wallet"} - ${accountNumber.slice(-4)}`

    try {
      await addAccount({
        organizationId: activeOrgId,
        payout_account: {
          type: isBank ? "bank" : "mobile_money",
          provider: "chapa",
          bank_slug: slug,
          account_number: accountNumber.trim(),
          account_name: accountName.trim(),
          account_label: accountLabel.trim() || fallbackLabel,
        },
      }).unwrap()

      toast.success(
        isBank
          ? "Bank payout account connected successfully!"
          : "Mobile money wallet connected successfully!"
      )
      setIsAddAccountOpen(false)
      setAccountBankSlug("")
      setAccountNumber("")
      setAccountName("")
      setAccountLabel("")
      refetchAccounts()
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to add payout destination")
    }
  }

  const handleSetDefaultAccount = async (accountId: string) => {
    try {
      await setDefaultAccount({
        organizationId: activeOrgId,
        payoutAccountId: accountId,
      }).unwrap()
      toast.success("Default payout destination updated")
      refetchAccounts()
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to set default account")
    }
  }

  const handleCloseAccount = async (accountId: string) => {
    if (!confirm("Are you sure you want to remove this payout account?")) return
    try {
      await closeAccount({
        organizationId: activeOrgId,
        payoutAccountId: accountId,
        reason: "Removed by organizer",
      }).unwrap()
      toast.success("Payout account removed")
      refetchAccounts()
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to remove payout account")
    }
  }

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault()
    const amountNum = parseFloat(payoutAmount)

    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid payout amount")
      return
    }
    if (amountNum > availableAmount) {
      toast.error(`Maximum available amount for payout is ${formatCurrency(availableAmount)}`)
      return
    }
    if (payoutAccounts.length === 0) {
      toast.error("Please connect at least one payout account first")
      return
    }

    try {
      await requestPayout({
        organizationId: activeOrgId,
        payout: {
          currency: "ETB",
          amount_minor: Math.round(amountNum * 100),
        },
      }).unwrap()

      toast.success("Payout request submitted successfully!")
      setIsRequestPayoutOpen(false)
      setPayoutAmount("")
      refetchBalance()
      refetchPayouts()
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to submit payout request")
    }
  }

  // Payout columns
  const payoutColumns: Column<Payout>[] = [
    {
      header: "Reference",
      accessorKey: "id",
      cell: (row: Payout) => (
        <div>
          <span className="font-mono text-xs font-semibold text-foreground">
            {row.id.slice(0, 16)}...
          </span>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {formatDateTime(row.requested_at)}
          </p>
        </div>
      ),
    },
    {
      header: "Destination",
      cell: (row: Payout) => {
        const acc = row.payout_account
        const dest = getDestinationDisplay(acc?.bank_slug, acc?.type)
        return (
          <div className="flex items-center gap-2.5">
            {dest.logo ? (
              <div className="size-7 relative rounded-md bg-white p-0.5 border border-border/50 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
                <Image
                  src={dest.logo}
                  alt={dest.name}
                  fill
                  className="object-contain"
                />
              </div>
            ) : dest.isMobile ? (
              <div
                className="size-7 rounded-md flex items-center justify-center text-white shrink-0 text-[10px] font-bold shadow-2xs"
                style={{ backgroundColor: dest.color || undefined }}
              >
                <HugeiconsIcon icon={SmartPhone01Icon} strokeWidth={2} className="size-3.5" />
              </div>
            ) : (
              <div className="flex size-7 items-center justify-center rounded-md bg-muted text-muted-foreground shrink-0">
                <HugeiconsIcon icon={BankIcon} strokeWidth={2} className="size-3.5" />
              </div>
            )}
            <div>
              <p className="text-xs font-medium text-foreground">
                {acc?.account_label || dest.name}
              </p>
              {acc?.account_number && (
                <p className="text-[11px] font-mono text-muted-foreground">
                  {dest.isMobile ? acc.account_number : `****${acc.account_number.slice(-4)}`}
                </p>
              )}
            </div>
          </div>
        )
      },
    },
    {
      header: "Amount",
      cell: (row: Payout) => (
        <span className="text-sm font-bold text-foreground">
          {formatCurrency(row.amount_minor / 100)}
        </span>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row: Payout) => (
        <Badge variant={getPayoutStatusVariant(row.status)} className="capitalize">
          {row.status}
        </Badge>
      ),
    },
    {
      header: "Completed At",
      cell: (row: Payout) => (
        <span className="text-xs text-muted-foreground">
          {row.paid_at ? formatDateTime(row.paid_at) : "In Review"}
        </span>
      ),
    },
  ]

  // Ledger columns
  const ledgerColumns: Column<LedgerEntry>[] = [
    {
      header: "Entry",
      accessorKey: "id",
      cell: (row: LedgerEntry) => (
        <div>
          <Badge variant={getLedgerTypeVariant(row.type)} className="text-[10px] uppercase mb-1">
            {row.type}
          </Badge>
          <p className="text-xs font-semibold text-foreground truncate max-w-xs">
            {row.description || (row.type === "sale" ? "Ticket Purchase" : "Transaction")}
          </p>
          {row.event && (
            <p className="text-[11px] text-muted-foreground truncate">
              Event: {row.event.title}
            </p>
          )}
        </div>
      ),
    },
    {
      header: "Amount",
      cell: (row: LedgerEntry) => {
        const isCredit = row.type.toLowerCase() === "sale"
        const amount = row.amount_minor / 100
        return (
          <span
            className={`text-sm font-bold ${
              isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
            }`}
          >
            {isCredit ? "+" : "-"}{formatCurrency(amount)}
          </span>
        )
      },
    },
    {
      header: "Availability",
      cell: (row: LedgerEntry) => (
        <div>
          <p className="text-xs font-medium text-foreground">
            {row.available_at ? formatDateTime(row.available_at) : "Immediate"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Recorded: {formatDateTime(row.created_at)}
          </p>
        </div>
      ),
    },
  ]

  const isLoading = isLoadingOrgs || isLoadingBalance

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Organization Switcher */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payouts & Finance</h1>
          <p className="text-muted-foreground">
            Manage your settlement balances, payment accounts, and withdrawal requests
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {organizations.length > 1 && (
            <Select value={activeOrgId} onValueChange={(val) => setSelectedOrgId(val)}>
              <SelectTrigger className="h-10 w-52 rounded-xl">
                <SelectValue placeholder="Select organization" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button
            size="lg"
            className="gap-2 shadow-xs"
            onClick={() => {
              if (payoutAccounts.length === 0) {
                toast.info("Please connect a payout account first")
                setIsAddAccountOpen(true)
              } else {
                setSelectedPayoutAccountId(defaultAccount?.id || "")
                setIsRequestPayoutOpen(true)
              }
            }}
          >
            <HugeiconsIcon icon={ArrowUpRight01Icon} strokeWidth={2} className="size-4" />
            Request Payout
          </Button>
        </div>
      </div>

      {isLoading ? (
        <PayoutsSkeleton />
      ) : (
        <>
          {/* Financial KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Available for Payout */}
            <motion.div {...containerVariants(0)}>
              <div className="rounded-2xl border-2 border-chart-1/30 bg-card p-6 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Available for Payout</span>
                  <div className="flex size-9 items-center justify-center rounded-xl bg-chart-1/10 text-chart-1">
                    <HugeiconsIcon icon={Wallet01Icon} strokeWidth={2} className="size-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <h2 className="text-3xl font-black tracking-tight text-foreground">
                    {formatCurrency(availableAmount)}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-3.5 text-chart-1" />
                    Ready for immediate withdrawal
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Total Ledger Revenue */}
            <motion.div {...containerVariants(0.1)}>
              <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Total Revenue</span>
                  <div className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <HugeiconsIcon icon={Invoice01Icon} strokeWidth={2} className="size-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <h2 className="text-3xl font-black tracking-tight text-foreground">
                    {formatCurrency(ledgerTotalAmount)}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Lifetime ticket gross sales
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Pending Maturity */}
            <motion.div {...containerVariants(0.2)}>
              <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Pending Clearance</span>
                  <div className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <h2 className="text-3xl font-black tracking-tight text-foreground">
                    {formatCurrency(pendingAmount)}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Maturing for release
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Reserve Policy */}
            <motion.div {...containerVariants(0.3)}>
              <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Held in Reserve</span>
                  <div className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <h2 className="text-3xl font-black tracking-tight text-foreground">
                    {formatCurrency(reservedAmount)}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Security reserve policy
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Navigation Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="payouts">
                <HugeiconsIcon icon={Wallet01Icon} strokeWidth={2} className="size-4" />
                Payout History ({payoutsList.length})
              </TabsTrigger>
              <TabsTrigger value="accounts">
                <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} className="size-4" />
                Payout Accounts ({payoutAccounts.length})
              </TabsTrigger>
              <TabsTrigger value="ledger">
                <HugeiconsIcon icon={Invoice01Icon} strokeWidth={2} className="size-4" />
                Transaction Ledger
              </TabsTrigger>
            </TabsList>

            {/* ─── TAB 1: PAYOUTS ────────────────────────────────────────────── */}
            <TabsContent value="payouts" className="mt-4">
              {payoutsList.length === 0 ? (
                <motion.div {...containerVariants(0.1)}>
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-12 text-center bg-card/40">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-chart-1/10 text-chart-1 mb-4 shadow-xs">
                      <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="size-7" />
                    </div>
                    <h3 className="text-lg font-bold">No Payout Requests Yet</h3>
                    <p className="mt-1 max-w-md text-sm text-muted-foreground">
                      When your events generate ticket revenue, your available funds will appear here ready to be transferred to your Ethiopian bank account or Telebirr.
                    </p>
                    <Button
                      size="lg"
                      className="mt-6 gap-2"
                      onClick={() => {
                        if (payoutAccounts.length === 0) {
                          setIsAddAccountOpen(true)
                        } else {
                          setIsRequestPayoutOpen(true)
                        }
                      }}
                    >
                      <HugeiconsIcon icon={ArrowUpRight01Icon} strokeWidth={2} className="size-4" />
                      {payoutAccounts.length === 0 ? "Connect Payout Account" : "Request First Payout"}
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <DataTable
                  columns={payoutColumns}
                  data={payoutsList}
                  keyExtractor={(row: Payout) => row.id}
                  emptyMessage="No payout records found."
                />
              )}
            </TabsContent>

            {/* ─── TAB 2: PAYOUT ACCOUNTS ────────────────────────────────────── */}
            <TabsContent value="accounts" className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold">Connected Payout Destinations</h3>
                  <p className="text-xs text-muted-foreground">
                    Bank accounts and mobile money wallets where your ticket payouts are transferred
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setIsAddAccountOpen(true)}
                >
                  <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4" />
                  Add Payout Account
                </Button>
              </div>

              {payoutAccounts.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-12 text-center bg-card/40">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-4">
                    <HugeiconsIcon icon={BankIcon} strokeWidth={2} className="size-7" />
                  </div>
                  <h3 className="text-lg font-bold">No Payout Accounts Connected</h3>
                  <p className="mt-1 max-w-md text-sm text-muted-foreground">
                    Connect your Commercial Bank of Ethiopia (CBE), Awash, Dashen, or Telebirr account to receive settlements.
                  </p>
                  <Button
                    size="lg"
                    className="mt-6 gap-2"
                    onClick={() => setIsAddAccountOpen(true)}
                  >
                    <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4" />
                    Add Account Now
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {payoutAccounts.map((acc) => {
                    const dest = getDestinationDisplay(acc.bank_slug, acc.type)
                    return (
                      <div
                        key={acc.id}
                        className={`rounded-2xl border p-5 shadow-xs transition-all relative ${
                          acc.is_default ? "border-chart-1 bg-chart-1/5" : "border-border/60 bg-card"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          {dest.logo ? (
                            <div className="size-11 relative rounded-xl bg-white p-1 border border-border/50 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
                              <Image
                                src={dest.logo}
                                alt={dest.name}
                                fill
                                className="object-contain p-1"
                              />
                            </div>
                          ) : dest.isMobile ? (
                            <div
                              className="size-11 rounded-xl flex items-center justify-center font-black text-xs text-white shrink-0 shadow-2xs"
                              style={{ backgroundColor: dest.color || undefined }}
                            >
                              {dest.walletKey === "telebirr" ? (
                                <div className="flex flex-col items-center justify-center leading-none">
                                  <span className="text-[10px] font-black uppercase tracking-tight">tele</span>
                                  <span className="text-[9px] font-bold opacity-90">birr</span>
                                </div>
                              ) : dest.walletKey === "mpesa" ? (
                                <span className="text-[9px] font-black tracking-tight">M-PESA</span>
                              ) : (
                                <HugeiconsIcon icon={SmartPhone01Icon} strokeWidth={2} className="size-5 text-white" />
                              )}
                            </div>
                          ) : (
                            <div className="size-11 rounded-xl bg-muted border border-border/50 flex items-center justify-center text-foreground shrink-0 shadow-2xs">
                              <HugeiconsIcon icon={BankIcon} strokeWidth={2} className="size-6" />
                            </div>
                          )}

                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            <Badge variant="outline" className="text-[10px] gap-1 font-medium bg-background/60">
                              <HugeiconsIcon
                                icon={dest.isMobile ? SmartPhone01Icon : BankIcon}
                                strokeWidth={2}
                                className="size-3 text-muted-foreground"
                              />
                              {dest.typeBadge}
                            </Badge>
                            {acc.is_default && (
                              <Badge variant="default" className="text-[10px] gap-1 bg-chart-1">
                                <HugeiconsIcon icon={StarIcon} strokeWidth={2} className="size-3" />
                                Default
                              </Badge>
                            )}
                            <Badge variant={getAccountStatusVariant(acc.status)} className="capitalize text-[10px]">
                              {acc.status}
                            </Badge>
                          </div>
                        </div>

                        <div className="mt-4">
                          <h4 className="font-bold text-base text-foreground truncate">
                            {acc.account_label || dest.name}
                          </h4>
                          <p className="text-xs text-muted-foreground font-medium mt-0.5 flex items-center gap-1.5">
                            <span>{dest.name}</span>
                            <span className="size-1 rounded-full bg-muted-foreground/40" />
                            <span>{dest.subtitle}</span>
                          </p>
                          <p className="mt-3 font-mono text-sm tracking-wider text-foreground">
                            {acc.account_number
                              ? dest.isMobile
                                ? acc.account_number
                                : `**** **** ${acc.account_number.slice(-4)}`
                              : "Account linked"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            Holder: {acc.account_name || "Verified Organizer"}
                          </p>
                        </div>

                        <div className="mt-5 pt-3 border-t border-border/40 flex items-center justify-between">
                          {!acc.is_default ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs text-muted-foreground hover:text-foreground"
                              onClick={() => handleSetDefaultAccount(acc.id)}
                              disabled={isSettingDefault}
                            >
                              Set as Default
                            </Button>
                          ) : (
                            <span className="text-xs text-chart-1 font-medium flex items-center gap-1">
                              <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-3.5" />
                              Active Destination
                            </span>
                          )}

                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleCloseAccount(acc.id)}
                            disabled={isClosingAccount}
                          >
                            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            {/* ─── TAB 3: LEDGER ─────────────────────────────────────────────── */}
            <TabsContent value="ledger" className="mt-4 space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold">Accounting Ledger</h3>
                  <p className="text-xs text-muted-foreground">
                    Detailed record of gross ticket sales, platform fees, adjustments, and payouts
                  </p>
                </div>
                <div className="relative">
                  <HugeiconsIcon
                    icon={Search01Icon}
                    strokeWidth={2}
                    className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    placeholder="Search ledger entries..."
                    value={searchLedger}
                    onChange={(e) => setSearchLedger(e.target.value)}
                    className="h-9 w-64 pl-9 rounded-xl"
                  />
                </div>
              </div>

              <DataTable
                columns={ledgerColumns}
                data={filteredLedger}
                keyExtractor={(row: LedgerEntry) => row.id}
                emptyMessage={
                  ledgerEntries.length === 0
                    ? "No transaction entries recorded yet."
                    : "No ledger records match your search."
                }
              />
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* ─── MODAL: REQUEST PAYOUT ────────────────────────────────────────── */}
      <Dialog open={isRequestPayoutOpen} onOpenChange={setIsRequestPayoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Payout</DialogTitle>
            <DialogDescription>
              Transfer your available event revenue directly to your verified payout account.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRequestPayout} className="space-y-4 mt-2">
            <div className="rounded-xl border border-chart-1/30 bg-chart-1/5 p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground font-medium">Available Balance</span>
                <p className="text-2xl font-black text-chart-1">
                  {formatCurrency(availableAmount)}
                </p>
              </div>
              <Badge variant="outline" className="text-xs border-chart-1/40 text-chart-1 font-semibold">
                ETB
              </Badge>
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination-account" className="text-sm font-semibold">
                Destination Account
              </Label>
              {payoutAccounts.length > 0 ? (
                <Select
                  value={selectedPayoutAccountId || defaultAccount?.id || ""}
                  onValueChange={setSelectedPayoutAccountId}
                >
                  <SelectTrigger id="destination-account" className="h-11">
                    <SelectValue placeholder="Select payout account" />
                  </SelectTrigger>
                  <SelectContent className="z-[9999]">
                    {payoutAccounts.map((acc) => {
                      const dest = getDestinationDisplay(acc.bank_slug, acc.type)
                      const masked = acc.account_number
                        ? dest.isMobile
                          ? acc.account_number
                          : `****${acc.account_number.slice(-4)}`
                        : ""
                      return (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.account_label || dest.name} — {masked} ({dest.typeBadge})
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-xs text-destructive">
                  No payout accounts connected. Please add an account first.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="payout-amount" className="text-sm font-semibold">
                  Payout Amount (ETB)
                </Label>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px] px-2 text-chart-1 hover:text-chart-1/80 font-semibold"
                    onClick={() => setPayoutAmount((availableAmount * 0.5).toFixed(2))}
                  >
                    50%
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px] px-2 text-chart-1 hover:text-chart-1/80 font-semibold"
                    onClick={() => setPayoutAmount(availableAmount.toFixed(2))}
                  >
                    Max (100%)
                  </Button>
                </div>
              </div>
              <Input
                id="payout-amount"
                type="number"
                step="0.01"
                min="100"
                max={availableAmount}
                placeholder="e.g. 5000"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                className="h-11 text-base font-medium"
                required
              />
            </div>

            {parseFloat(payoutAmount) > 0 && parseFloat(payoutAmount) <= availableAmount && (
              <div className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground flex justify-between">
                <span>Remaining Balance:</span>
                <span className="font-bold text-foreground">
                  {formatCurrency(availableAmount - parseFloat(payoutAmount))}
                </span>
              </div>
            )}

            <DialogFooter className="mt-6 sm:justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRequestPayoutOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingPayout || availableAmount <= 0}
                className="gap-2"
              >
                {isSubmittingPayout ? "Submitting..." : "Confirm & Withdraw"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL: ADD PAYOUT ACCOUNT ────────────────────────────────────── */}
      <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Payout Destination</DialogTitle>
            <DialogDescription>
              Connect an Ethiopian bank account or mobile money wallet to receive automated settlements.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddAccount} className="space-y-4 mt-1">
            {/* Account Type Toggle */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Payout Method
              </Label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-muted/60 rounded-xl border border-border/50">
                <button
                  type="button"
                  onClick={() => setAccountType("bank")}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                    accountType === "bank"
                      ? "bg-background text-foreground shadow-xs border border-border/80"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <HugeiconsIcon icon={BankIcon} strokeWidth={2} className="size-4" />
                  <span>Bank Account</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType("mobile_money")}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                    accountType === "mobile_money"
                      ? "bg-background text-foreground shadow-xs border border-border/80"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <HugeiconsIcon icon={SmartPhone01Icon} strokeWidth={2} className="size-4" />
                  <span>Mobile Wallet</span>
                </button>
              </div>
            </div>

            {/* If Bank Account */}
            {accountType === "bank" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="bank-select" className="text-sm font-semibold">
                    Select Ethiopian Bank <span className="text-destructive">*</span>
                  </Label>
                  <Select value={accountBankSlug} onValueChange={setAccountBankSlug}>
                    <SelectTrigger
                      id="bank-select"
                      className="w-full h-12 justify-between bg-background/50 border-border/60 hover:border-primary transition-colors"
                    >
                      <SelectValue placeholder="Select your bank">
                        {selectedPayoutBank ? (
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <div className="size-6 relative rounded bg-white p-0.5 border border-border/40 shrink-0 overflow-hidden">
                              <Image
                                src={BANK_LOGOS[selectedPayoutBank.value] || "/assets/CBE.jpeg"}
                                alt={selectedPayoutBank.label}
                                fill
                                className="object-contain"
                              />
                            </div>
                            <span className="font-medium text-foreground truncate">{selectedPayoutBank.label}</span>
                          </div>
                        ) : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent
                      className="z-[9999] w-[--radix-select-trigger-width] max-h-[340px] overflow-y-auto p-2"
                      position="popper"
                      align="start"
                    >
                      <div className="grid grid-cols-2 gap-2 p-1">
                        {ETHIOPIAN_BANKS.map((bank) => (
                          <SelectItem
                            key={bank.value}
                            value={bank.value}
                            title={bank.label}
                            className="relative flex items-center gap-2.5 py-2 px-2.5 rounded-lg border border-border/50 bg-card/40 hover:bg-muted/70 hover:border-primary/50 data-[state=checked]:border-primary data-[state=checked]:bg-primary/10 data-[state=checked]:ring-1 data-[state=checked]:ring-primary cursor-pointer transition-all duration-150 group pr-6 [&>span:first-child]:top-2 [&>span:first-child]:right-2 [&>span:first-child]:size-3.5 [&>span:first-child]:text-primary *:[span]:last:w-full *:[span]:last:min-w-0 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2.5"
                          >
                            <div className="size-8 relative rounded-md bg-white p-0.5 border border-border/40 shrink-0 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform overflow-hidden">
                              <Image
                                src={BANK_LOGOS[bank.value] || "/assets/CBE.jpeg"}
                                alt={bank.label}
                                fill
                                className="object-contain p-0.5"
                              />
                            </div>
                            <div className="flex flex-col min-w-0 text-left overflow-hidden">
                              <span className="text-xs font-semibold text-foreground truncate">
                                {bank.shortName || bank.label}
                              </span>
                              <span className="text-[10px] text-muted-foreground truncate leading-none mt-0.5">
                                {bank.label}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </div>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="acc-number" className="text-sm font-semibold">
                    Bank Account Number <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <HugeiconsIcon icon={BankIcon} strokeWidth={2} className="size-4" />
                    </div>
                    <Input
                      id="acc-number"
                      placeholder="e.g. 100012345678"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="pl-10 h-11 bg-background/50 border-border/60 focus:border-primary transition-colors font-mono"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Enter your official 10 to 16 digit bank account number
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="acc-name" className="text-sm font-semibold">
                    Account Holder Legal Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="acc-name"
                    placeholder="e.g. Abebe Kebede Bikila"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="h-11 bg-background/50 border-border/60 focus:border-primary transition-colors"
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Must match the official name on your bank records exactly
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="acc-label" className="text-sm font-semibold">
                    Account Label <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                  </Label>
                  <Input
                    id="acc-label"
                    placeholder="e.g. CBE Primary Operations"
                    value={accountLabel}
                    onChange={(e) => setAccountLabel(e.target.value)}
                    className="h-11 bg-background/50 border-border/60 focus:border-primary transition-colors"
                  />
                </div>
              </>
            ) : (
              /* If Mobile Wallet */
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">
                    Select Mobile Wallet Provider <span className="text-destructive">*</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {ETHIOPIAN_MOBILE_WALLETS.map((wallet) => {
                      const isSelected = selectedWalletSlug === wallet.value
                      return (
                        <button
                          key={wallet.value}
                          type="button"
                          onClick={() => setSelectedWalletSlug(wallet.value)}
                          className={`flex items-center gap-3 p-3 rounded-xl border text-left cursor-pointer transition-all ${
                            isSelected
                              ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                              : "border-border/60 bg-background/50 hover:border-border hover:bg-muted/40"
                          }`}
                        >
                          {wallet.logo ? (
                            <div className="size-10 relative rounded-lg bg-white p-1 border border-border/40 overflow-hidden shrink-0 flex items-center justify-center">
                              <Image
                                src={wallet.logo}
                                alt={wallet.label}
                                fill
                                className="object-contain p-0.5"
                              />
                            </div>
                          ) : (
                            <div
                              className="size-10 rounded-lg flex items-center justify-center text-white shrink-0 font-bold text-xs shadow-2xs"
                              style={{ backgroundColor: wallet.color }}
                            >
                              {wallet.value === "telebirr" ? (
                                <div className="flex flex-col items-center leading-none">
                                  <span className="text-[10px] font-black uppercase">tele</span>
                                  <span className="text-[9px] font-semibold opacity-90">birr</span>
                                </div>
                              ) : wallet.value === "mpesa" ? (
                                <span className="text-[9px] font-black tracking-tight">M-PESA</span>
                              ) : (
                                <HugeiconsIcon icon={SmartPhone01Icon} strokeWidth={2} className="size-5 text-white" />
                              )}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-foreground leading-tight truncate">
                                {wallet.label}
                              </p>
                              {isSelected && (
                                <span className="size-2 rounded-full bg-primary shrink-0" />
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">
                              {wallet.operator}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wallet-number" className="text-sm font-semibold">
                    Registered Mobile / Phone Number <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <HugeiconsIcon icon={SmartPhone01Icon} strokeWidth={2} className="size-4" />
                    </div>
                    <Input
                      id="wallet-number"
                      placeholder="e.g. 0911234567 or 0711234567"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="pl-10 h-11 bg-background/50 border-border/60 focus:border-primary transition-colors font-mono"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Enter the phone number registered with your mobile wallet
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wallet-name" className="text-sm font-semibold">
                    Registered Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="wallet-name"
                    placeholder="e.g. Abebe Kebede"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="h-11 bg-background/50 border-border/60 focus:border-primary transition-colors"
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Must match the registered legal name on your wallet account
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wallet-label" className="text-sm font-semibold">
                    Wallet Label <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                  </Label>
                  <Input
                    id="wallet-label"
                    placeholder="e.g. Organizer Telebirr"
                    value={accountLabel}
                    onChange={(e) => setAccountLabel(e.target.value)}
                    className="h-11 bg-background/50 border-border/60 focus:border-primary transition-colors"
                  />
                </div>
              </>
            )}

            <DialogFooter className="mt-6 sm:justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddAccountOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isAddingAccount} className="gap-2">
                {isAddingAccount
                  ? "Saving Destination..."
                  : accountType === "bank"
                  ? "Connect Bank Account"
                  : "Connect Mobile Wallet"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
