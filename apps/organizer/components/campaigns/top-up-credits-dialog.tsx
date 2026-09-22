"use client"

import { useState } from "react"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Wallet01Icon,
  SmartPhone01Icon,
  Mail01Icon,
  CheckmarkCircle01Icon,
  Loading03Icon,
  ArrowUpRight01Icon,
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { formatNumber } from "@/lib/utils"
import { cn } from "@workspace/ui/lib/utils"
import {
  useCreateCreditTopUpMutation,
  useListCreditRatesQuery,
  type CreditRateVersion,
} from "@workspace/store/reducers/messagingApi"

interface TopUpCreditsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  defaultChannel?: "sms" | "email"
}

const PRESET_PACKS = [1000, 2500, 5000, 10000]

export function TopUpCreditsDialog({
  open,
  onOpenChange,
  organizationId,
  defaultChannel = "sms",
}: TopUpCreditsDialogProps) {
  const [channel, setChannel] = useState<"sms" | "email">(defaultChannel)
  const [quantity, setQuantity] = useState<number>(1000)
  const [paymentMethod, setPaymentMethod] = useState<string>("telebirr")
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)

  const { data: ratesData, isLoading: isLoadingRates } = useListCreditRatesQuery(organizationId, {
    skip: !organizationId,
  })
  const rates: CreditRateVersion[] = ratesData?.data ?? []
  const currentRate = rates.find((r) => r.channel === channel && r.status === "active")

  // Rate unit price in minor units (cents). Default to 25 cents (0.25 ETB) for SMS, 10 cents for Email if not configured.
  const unitPriceMinor = currentRate?.unit_price_minor ?? (channel === "sms" ? 25 : 10)
  const totalAmountMinor = quantity * unitPriceMinor
  const totalAmountETB = (totalAmountMinor / 100).toFixed(2)

  const [createTopUp, { isLoading: isSubmitting }] = useCreateCreditTopUpMutation()

  const handleCreateTopUp = async () => {
    try {
      const res = await createTopUp({
        organizationId,
        top_up: {
          channel,
          quantity,
          currency: "ETB",
          provider: "chapa",
          payment_method: paymentMethod,
        },
      }).unwrap()

      toast.success("Top-up order created!", {
        description: `Order for ${formatNumber(quantity)} ${channel.toUpperCase()} credits initiated.`,
      })

      const paymentCheckoutUrl = res.data?.payment?.checkout_url
      if (paymentCheckoutUrl) {
        setCheckoutUrl(paymentCheckoutUrl)
      } else {
        onOpenChange(false)
      }
    } catch (err: any) {
      toast.error("Failed to initiate top-up", {
        description:
          err?.data?.message || err?.data?.error || err?.message || "An unexpected error occurred",
      })
    }
  }

  const handleReset = () => {
    setCheckoutUrl(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={checkoutUrl ? handleReset : onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-lime-500/10 text-lime-600 dark:bg-lime-500/20 dark:text-lime-400">
              <HugeiconsIcon icon={Wallet01Icon} size={20} strokeWidth={2} />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">Top Up Messaging Credits</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Purchase SMS or Email credits for attendee broadcasts
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {checkoutUrl ? (
          <div className="space-y-4 py-3">
            <div className="flex flex-col items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={28} strokeWidth={2} />
              </div>
              <h4 className="mt-3 font-semibold text-foreground">Top-Up Order Created</h4>
              <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                Your payment session is ready. Click below to complete payment via Telebirr / Chapa.
              </p>
              <div className="mt-4 flex items-center gap-2 rounded-lg border bg-background px-3 py-1.5 text-xs font-medium">
                <span>Total:</span>
                <span className="font-bold text-foreground">{totalAmountETB} ETB</span>
                <span className="text-muted-foreground">({formatNumber(quantity)} credits)</span>
              </div>
              <Button
                className="mt-5 w-full gap-2 bg-lime-500 hover:bg-lime-600 text-zinc-950 font-bold dark:bg-lime-500 dark:text-zinc-950 dark:hover:bg-lime-400 border-0 shadow-xs"
                onClick={() => window.open(checkoutUrl, "_blank")}
              >
                Proceed to Payment
                <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} strokeWidth={2} />
              </Button>
            </div>
            <DialogFooter>
              <Button variant="outline" className="w-full" onClick={handleReset}>
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Channel Choice */}
            <div className="space-y-2">
              <Label className="text-xs">Select Channel</Label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setChannel("sms")}
                  className={cn(
                    "flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-all",
                    channel === "sms"
                      ? "border-lime-500/60 bg-lime-500/5 dark:bg-lime-500/10"
                      : "border-border/60 hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon
                      icon={SmartPhone01Icon}
                      size={16}
                      className={channel === "sms" ? "text-lime-600 dark:text-lime-400" : "text-muted-foreground"}
                    />
                    <span className="text-xs font-semibold">SMS Credits</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">Instant door & urgent alerts</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChannel("email")}
                  className={cn(
                    "flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-all",
                    channel === "email"
                      ? "border-lime-500/60 bg-lime-500/5 dark:bg-lime-500/10"
                      : "border-border/60 hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon
                      icon={Mail01Icon}
                      size={16}
                      className={channel === "email" ? "text-lime-600 dark:text-lime-400" : "text-muted-foreground"}
                    />
                    <span className="text-xs font-semibold">Email Credits</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">Rich newsletters & reminders</span>
                </button>
              </div>
            </div>

            {/* Quantity Presets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Quantity</Label>
                <span className="text-[11px] text-muted-foreground">
                  Rate: {(unitPriceMinor / 100).toFixed(2)} ETB / credit
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {PRESET_PACKS.map((pack) => (
                  <button
                    key={pack}
                    type="button"
                    onClick={() => setQuantity(pack)}
                    className={cn(
                      "rounded-lg border py-2 text-xs font-semibold transition-all",
                      quantity === pack
                        ? "border-lime-500/60 bg-lime-500/10 text-lime-700 dark:text-lime-400 font-bold"
                        : "border-border/60 hover:bg-muted/50 text-foreground"
                    )}
                  >
                    {formatNumber(pack)}
                  </button>
                ))}
              </div>
              <Input
                type="number"
                min={100}
                step={100}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="mt-2 text-xs font-mono h-9"
                placeholder="Custom credit quantity"
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label className="text-xs">Payment Method</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("telebirr")}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-medium transition-all",
                    paymentMethod === "telebirr"
                      ? "border-primary/60 bg-primary/5 font-semibold text-foreground"
                      : "border-border/60 hover:bg-muted/50 text-muted-foreground"
                  )}
                >
                  Telebirr
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cbebirr")}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-medium transition-all",
                    paymentMethod === "cbebirr"
                      ? "border-primary/60 bg-primary/5 font-semibold text-foreground"
                      : "border-border/60 hover:bg-muted/50 text-muted-foreground"
                  )}
                >
                  CBE Birr / Card
                </button>
              </div>
            </div>

            {/* Total Summary */}
            <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-3 text-xs">
              <span className="text-muted-foreground">Total Price</span>
              <div className="text-right">
                <span className="text-base font-bold text-foreground">{totalAmountETB} ETB</span>
                <p className="text-[10px] text-muted-foreground">Instant credit grant upon settlement</p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="gap-1.5 bg-lime-500 hover:bg-lime-600 text-zinc-950 font-bold dark:bg-lime-500 dark:text-zinc-950 dark:hover:bg-lime-400 border-0 shadow-xs"
                disabled={isSubmitting || quantity <= 0}
                onClick={handleCreateTopUp}
              >
                {isSubmitting ? (
                  <>
                    <HugeiconsIcon icon={Loading03Icon} size={14} className="animate-spin" />
                    Generating Checkout...
                  </>
                ) : (
                  `Pay ${totalAmountETB} ETB`
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
