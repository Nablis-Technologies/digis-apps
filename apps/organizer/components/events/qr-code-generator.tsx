"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { HugeiconsIcon } from "@hugeicons/react"
import { Copy01Icon, Share01Icon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"
import { generateQRCode } from "@/lib/qr-code"

interface QRCodeGeneratorProps {
  eventId: string
  eventName: string
}

export function QRCodeGenerator({ eventId, eventName }: QRCodeGeneratorProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("")
  const publicLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/events/${eventId}`

  useEffect(() => {
    generateQRCode(publicLink)
      .then(setQrCodeUrl)
      .catch((error) => {
        console.error("Failed to generate QR code:", error)
        toast.error("Failed to generate QR code")
      })
  }, [publicLink])

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicLink)
      toast.success("Event link copied to clipboard")
    } catch (error) {
      toast.error("Failed to copy link")
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: eventName,
          text: `Check out ${eventName}!`,
          url: publicLink,
        })
      } catch (error) {
        // User cancelled
      }
    } else {
      await handleCopyLink()
    }
  }

  const handleDownloadQR = () => {
    if (!qrCodeUrl) return
    const link = document.createElement("a")
    link.download = `qr-code-${eventId}.png`
    link.href = qrCodeUrl
    link.click()
    toast.success("QR code downloaded")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Smart link & QR</CardTitle>
        <p className="text-sm text-muted-foreground">Share your public event link anywhere.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Public Event Link */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Public event link</Label>
          <div className="flex gap-2">
            <Input
              value={publicLink}
              readOnly
              className="font-mono text-sm"
            />
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
              >
                <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} className="size-4" />
              </Button>
            </motion.div>
          </div>
        </div>

        {/* QR Code Display */}
        <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border-2 border-dashed bg-muted/30 p-8">
          {qrCodeUrl ? (
            <img
              src={qrCodeUrl}
              alt={`QR code for ${eventName}`}
              className="size-48 rounded-lg"
            />
          ) : (
            <div className="flex size-48 items-center justify-center">
              <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleShare}
            >
              <HugeiconsIcon icon={Share01Icon} strokeWidth={2} className="size-4" />
              Share
            </Button>
          </motion.div>
          <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              className="w-full gap-2"
              onClick={handleDownloadQR}
              disabled={!qrCodeUrl}
            >
              Download QR
            </Button>
          </motion.div>
        </div>

        {/* Recent Stats */}
        <div className="space-y-2 rounded-lg bg-muted/50 p-4">
          <p className="text-sm font-medium">Recent clicks</p>
          <p className="text-xs text-muted-foreground">1,203 link opens this week</p>
          <p className="text-xs text-muted-foreground">Average 18% conversion to ticket purchase</p>
        </div>
      </CardContent>
    </Card>
  )
}
