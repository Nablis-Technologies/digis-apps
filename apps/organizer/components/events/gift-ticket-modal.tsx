"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { HugeiconsIcon } from "@hugeicons/react"
import { Mail01Icon, UserIcon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"
import type { TicketTier } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

interface GiftTicketModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tiers: TicketTier[]
}

export function GiftTicketModal({
  open,
  onOpenChange,
  tiers,
}: GiftTicketModalProps) {
  const [recipientName, setRecipientName] = useState("")
  const [recipientEmail, setRecipientEmail] = useState("")
  const [selectedTier, setSelectedTier] = useState<string>("")
  const [quantity, setQuantity] = useState("1")
  const [personalMessage, setPersonalMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!recipientName || !recipientEmail || !selectedTier) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    toast.success("Gift ticket sent successfully!")
    
    // Reset form
    setRecipientName("")
    setRecipientEmail("")
    setSelectedTier("")
    setQuantity("1")
    setPersonalMessage("")
    setIsSubmitting(false)
    onOpenChange(false)
  }

  const selectedTierData = tiers.find((t) => t.id === selectedTier)
  const totalPrice = selectedTierData
    ? selectedTierData.price * parseInt(quantity || "1")
    : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gift tickets</DialogTitle>
          <DialogDescription>
            Send complimentary tickets to someone special
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Recipient Name */}
          <div className="space-y-2">
            <Label htmlFor="recipient-name">
              Recipient name <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <HugeiconsIcon
                icon={UserIcon}
                strokeWidth={2}
                className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="recipient-name"
                placeholder="John Doe"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="pl-9"
                required
              />
            </div>
          </div>

          {/* Recipient Email */}
          <div className="space-y-2">
            <Label htmlFor="recipient-email">
              Recipient email <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <HugeiconsIcon
                icon={Mail01Icon}
                strokeWidth={2}
                className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="recipient-email"
                type="email"
                placeholder="john@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="pl-9"
                required
              />
            </div>
          </div>

          {/* Ticket Tier Selection */}
          <div className="space-y-2">
            <Label htmlFor="tier-select">
              Ticket tier <span className="text-destructive">*</span>
            </Label>
            <Select value={selectedTier} onValueChange={setSelectedTier}>
              <SelectTrigger id="tier-select">
                <SelectValue placeholder="Select a ticket tier" />
              </SelectTrigger>
              <SelectContent>
                {tiers.map((tier) => (
                  <SelectItem key={tier.id} value={tier.id}>
                    {tier.name} - {formatCurrency(tier.price)} ({tier.total - tier.sold} available)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max="10"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          {/* Personal Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Personal message (optional)</Label>
            <textarea
              id="message"
              placeholder="Add a personal message to your gift..."
              value={personalMessage}
              onChange={(e) => setPersonalMessage(e.target.value)}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">
              {personalMessage.length}/200 characters
            </p>
          </div>

          {/* Total Price Display */}
          {selectedTierData && (
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total value</span>
                <span className="text-lg font-bold">{formatCurrency(totalPrice)}</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-orange-500 to-pink-500"
            >
              {isSubmitting ? "Sending..." : "Send gift tickets"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
