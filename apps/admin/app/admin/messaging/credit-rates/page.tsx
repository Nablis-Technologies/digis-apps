"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  RefreshIcon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  useListCreditRatesQuery,
  useCreateCreditRateMutation,
  useActivateCreditRateMutation,
  useRetireCreditRateMutation,
  type CreditRate,
} from "@workspace/store/reducers/adminMessagingApi"

const channelOptions = ["sms", "email", "whatsapp"] as const

export default function CreditRatesPage() {
  const { data, isLoading, refetch } = useListCreditRatesQuery()
  const [createRate, { isLoading: isCreating }] = useCreateCreditRateMutation()
  const [activateRate] = useActivateCreditRateMutation()
  const [retireRate] = useRetireCreditRateMutation()

  const [openCreate, setOpenCreate] = useState(false)
  const [currency, setCurrency] = useState("ETB")
  const [channel, setChannel] = useState<"sms" | "email" | "whatsapp">("sms")
  const [rateMinor, setRateMinor] = useState(100)

  const rates: CreditRate[] = data?.data ?? []

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await createRate({
      credit_rate_version: {
        currency,
        channel,
        unit_price_minor: Number(rateMinor),
        status: "draft",
      },
    }).unwrap()
    setOpenCreate(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Messaging Credit Rates</h1>
          <p className="text-sm text-muted-foreground">
            Configure currency conversion rates for messaging credits
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <HugeiconsIcon icon={RefreshIcon} className="mr-1.5 size-4" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setOpenCreate(true)}
          >
            <HugeiconsIcon icon={Add01Icon} className="mr-1.5 size-4" />
            New Rate
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card shadow-xs">
        <div className="p-4">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Loading credit rates...
            </div>
          ) : rates.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No messaging credit rates configured.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-xs font-medium text-muted-foreground">
                    <th className="pb-3 font-medium">Channel</th>
                    <th className="pb-3 font-medium">Currency</th>
                    <th className="pb-3 font-medium">Rate per Credit (Minor)</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Effective Date</th>
                    <th className="pb-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/25">
                  {rates.map((r) => {
                    const price = r.unit_price_minor ?? r.rate_per_unit_minor ?? 0
                    return (
                      <tr key={r.id} className="hover:bg-muted/30">
                        <td className="py-3 font-medium uppercase text-xs tracking-wider">{r.channel ?? "sms"}</td>
                        <td className="py-3 font-medium">{r.currency}</td>
                        <td className="py-3 tabular-nums">{price} ({ (price / 100).toFixed(2) } {r.currency})</td>
                        <td className="py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              r.status === "active"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                                : r.status === "retired"
                                ? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3 text-xs text-muted-foreground">
                          {r.effective_from ? new Date(r.effective_from).toLocaleDateString() : r.effective_at ? new Date(r.effective_at).toLocaleDateString() : "Immediate"}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex justify-end gap-1">
                            {r.status !== "active" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-emerald-600 hover:text-emerald-700"
                                onClick={() => activateRate(r.id)}
                              >
                                <HugeiconsIcon icon={CheckmarkCircle01Icon} className="mr-1 size-3.5" />
                                Activate
                              </Button>
                            )}
                            {r.status !== "retired" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-destructive hover:text-destructive"
                                onClick={() => retireRate(r.id)}
                              >
                                <HugeiconsIcon icon={Cancel01Icon} className="mr-1 size-3.5" />
                                Retire
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Create Messaging Credit Rate</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Channel</Label>
                <div className="flex gap-2">
                  {channelOptions.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setChannel(c)}
                      className={`flex-1 rounded-md border px-3 py-1.5 text-xs font-medium uppercase transition-colors ${
                        channel === c
                          ? "border-lime-500 bg-lime-50 text-lime-700 dark:bg-lime-950/20 dark:text-lime-400"
                          : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency Code</Label>
                <Input
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                  placeholder="e.g. ETB, USD"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rateMinor">Unit Price (Minor Units / Cents)</Label>
                <Input
                  id="rateMinor"
                  type="number"
                  value={rateMinor}
                  onChange={(e) => setRateMinor(Number(e.target.value))}
                  required
                  min={1}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenCreate(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Rate"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
