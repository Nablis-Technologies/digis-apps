"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { useCreateCreditAdjustmentMutation } from "@workspace/store/reducers/adminMessagingApi"
import { toastSuccess, toastError } from "@workspace/ui/lib/toast"

export function CreditAdjustmentDialog({
  open,
  onOpenChange,
  organizationId,
  organizationName,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  organizationName?: string
}) {
  const [amount, setAmount] = useState<string>("")
  const [reason, setReason] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [createAdjustment, { isLoading }] = useCreateCreditAdjustmentMutation()

  useEffect(() => {
    if (open) {
      setAmount("")
      setReason("")
      setNotes("")
      setErrorMsg(null)
    }
  }, [open])

  function isValid() {
    const num = Number(amount)
    return !isNaN(num) && num !== 0 && reason.trim().length > 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid() || !organizationId) return
    setErrorMsg(null)

    try {
      await createAdjustment({
        organizationId,
        credit_adjustment: {
          amount: Number(amount),
          reason: reason.trim(),
          notes: notes.trim() || undefined,
        },
      }).unwrap()
      onOpenChange(false)
      toastSuccess("Credit adjustment applied.")
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? (err as { data?: { message?: string } }).data?.message
          : undefined
      setErrorMsg(msg ?? "Failed to apply credit adjustment.")
      toastError(err, "Failed to apply credit adjustment.")
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!isLoading) onOpenChange(o)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Messaging Credits</DialogTitle>
          <DialogDescription>
            {organizationName
              ? `Manually add or deduct messaging credits for ${organizationName}.`
              : "Manually add or deduct messaging credits for this organization."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="amount">
              Credit Amount <span className="text-destructive">*</span>
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder="e.g. 500 (or -100 to deduct)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Positive values add credits, negative values deduct credits.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">
              Reason <span className="text-destructive">*</span>
            </Label>
            <Input
              id="reason"
              placeholder="e.g. Promotional grant, Refund, Correction"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              placeholder="Optional administrative notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isLoading}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={!isValid() || isLoading}
              className="bg-lime-500 text-white hover:bg-lime-600 disabled:bg-lime-500/50"
            >
              {isLoading ? "Applying..." : "Apply Adjustment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
