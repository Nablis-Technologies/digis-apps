"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
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
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Ticket01Icon,
  Calendar03Icon,
  CheckmarkCircle01Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons"
import {
  useUpdateInventoryConfigurationMutation,
  type EventProduct,
} from "@workspace/store/reducers/ticketingApi"
import { formatDate } from "@/lib/utils"

interface UpdateInventoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  product: EventProduct | null
  eventDates: Array<{ id: string; name?: string | null; starts_at: string; ends_at?: string | null }>
}

export function UpdateInventoryDialog({
  open,
  onOpenChange,
  eventId,
  product,
  eventDates,
}: UpdateInventoryDialogProps) {
  const [capacities, setCapacities] = useState<{ [dateId: string]: string }>({})
  const [sharedCapacity, setSharedCapacity] = useState<string>("")
  const [updateInventory, { isLoading }] = useUpdateInventoryConfigurationMutation()

  const isShared = product?.inventory?.mode === "shared"

  useEffect(() => {
    if (open && product) {
      if (product.inventory?.pools && product.inventory.pools.length > 0) {
        const initialCaps: { [dateId: string]: string } = {}
        for (const pool of product.inventory.pools) {
          if (pool.event_date_id) {
            initialCaps[pool.event_date_id] = String(pool.capacity || 0)
          }
        }
        setCapacities(initialCaps)
        const total = product.inventory.pools.reduce((s, p) => s + (p.capacity || 0), 0)
        setSharedCapacity(String(total || 100))
      } else {
        const defaultCap = String(product.metadata?.capacity || 100)
        setSharedCapacity(defaultCap)
        const initialCaps: { [dateId: string]: string } = {}
        eventDates.forEach((d) => {
          initialCaps[d.id] = defaultCap
        })
        setCapacities(initialCaps)
      }
    }
  }, [open, product, eventDates])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return

    try {
      if (isShared) {
        const capNum = parseInt(sharedCapacity, 10)
        if (isNaN(capNum) || capNum < 0) {
          toast.error("Please enter a valid capacity number")
          return
        }
        await updateInventory({
          eventId,
          productId: product.id,
          body: {
            inventory_configuration: {
              mode: "shared",
              capacity: capNum,
            },
          },
        }).unwrap()
      } else {
        const datesPayload = eventDates.map((d) => ({
          event_date_id: d.id,
          capacity: parseInt(capacities[d.id] || "0", 10) || 100,
        }))
        await updateInventory({
          eventId,
          productId: product.id,
          body: {
            inventory_configuration: {
              mode: "per_date",
              dates: datesPayload,
            },
          },
        }).unwrap()
      }

      toast.success("Ticket tier capacity updated successfully")
      onOpenChange(false)
    } catch (err: any) {
      const msg = err?.data?.message || err?.data?.error || "Failed to update inventory configuration"
      toast.error(msg)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSave} className="space-y-4">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <HugeiconsIcon icon={Ticket01Icon} strokeWidth={2} className="size-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">Update Inventory Capacity</DialogTitle>
                <DialogDescription className="text-xs">
                  {product?.name ? `Adjust ticket capacity for "${product.name}"` : "Adjust ticket capacity"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 pt-1">
            {isShared || eventDates.length <= 1 ? (
              <div className="space-y-1.5">
                <Label htmlFor="sharedCap" className="text-xs font-semibold">
                  Total Capacity
                </Label>
                <Input
                  id="sharedCap"
                  type="number"
                  min="0"
                  value={sharedCapacity}
                  onChange={(e) => setSharedCapacity(e.target.value)}
                  className="h-10 text-sm"
                  placeholder="e.g. 500"
                />
                <p className="text-[11px] text-muted-foreground">
                  The maximum number of tickets that can be sold for this tier.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                <p className="text-xs text-muted-foreground">
                  Per-session attendance limits for this ticket tier:
                </p>
                {eventDates.map((date) => (
                  <div
                    key={date.id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-border/60 bg-muted/20 text-xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5 font-medium text-foreground">
                        <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-3.5 text-muted-foreground" />
                        <span className="truncate">{date.name || "Session"}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{formatDate(date.starts_at)}</p>
                    </div>
                    <div className="w-24 shrink-0">
                      <Input
                        type="number"
                        min="0"
                        value={capacities[date.id] || ""}
                        onChange={(e) =>
                          setCapacities((prev) => ({
                            ...prev,
                            [date.id]: e.target.value,
                          }))
                        }
                        className="h-8 text-xs font-mono"
                        placeholder="Qty"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isLoading} className="gap-1.5">
              {isLoading ? (
                <>
                  <HugeiconsIcon icon={Loading03Icon} className="size-3.5 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-3.5" />
                  Save Capacity
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
