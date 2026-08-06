"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Download01Icon,
  Copy01Icon,
  Share01Icon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"
import type { Event } from "@/lib/types"
import { useColorPalette, type PaletteKey } from "@/lib/use-color-palette"
import { generateQRCode } from "@/lib/qr-code"
import { renderShareCard } from "@/lib/share-card-renderer"

interface ShareCardGeneratorProps {
  event: Event
}

const PALETTE_LABELS: Record<PaletteKey, string> = {
  vibrant: "Vibrant",
  darkVibrant: "Dark",
  muted: "Muted",
  brand: "Brand",
}

export function ShareCardGenerator({ event }: ShareCardGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [orientation, setOrientation] = useState<"landscape" | "portrait">("landscape")
  const [selectedPalette, setSelectedPalette] = useState<PaletteKey>("vibrant")
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("")
  const [isRendering, setIsRendering] = useState(false)
  const [renderError, setRenderError] = useState<string | null>(null)
  
  // Debug: Log when component mounts/updates
  useEffect(() => {
    console.log("📸 ShareCardGenerator: Event changed to", event.id, "banner:", event.bannerUrl)
  }, [event.id, event.bannerUrl])

  const { palette, loading: paletteLoading } = useColorPalette(event.bannerUrl)

  // Debug: Log palette changes
  useEffect(() => {
    console.log("🎨 Palette updated:", palette)
  }, [palette])

  // Generate QR code
  useEffect(() => {
    const publicLink = `${window.location.origin}/event/${event.id}`
    generateQRCode(publicLink)
      .then(setQrCodeUrl)
      .catch((error) => {
        console.error("Failed to generate QR code:", error)
        toast.error("Failed to generate QR code")
      })
  }, [event.id])

  // Render canvas whenever config changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || paletteLoading || !qrCodeUrl) return

    setIsRendering(true)
    setRenderError(null)

    const baseColor = palette[selectedPalette]

    renderShareCard({
      canvas,
      eventName: event.name,
      venue: event.venue,
      city: event.city,
      startAt: event.startAt,
      bannerUrl: event.bannerUrl,
      qrCodeUrl,
      baseColor,
      orientation,
    })
      .then(() => {
        setIsRendering(false)
      })
      .catch((error) => {
        console.error("Failed to render share card:", error)
        setRenderError(error.message)
        setIsRendering(false)
        toast.error("Failed to generate share card")
      })
  }, [
    event,
    qrCodeUrl,
    orientation,
    selectedPalette,
    palette,
    paletteLoading,
  ])

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement("a")
    link.download = `${event.name.toLowerCase().replace(/\s+/g, "-")}-share-card.png`
    link.href = canvas.toDataURL("image/png")
    link.click()

    toast.success("Share card downloaded")
  }

  const handleCopyLink = async () => {
    const publicLink = `${window.location.origin}/event/${event.id}`
    try {
      await navigator.clipboard.writeText(publicLink)
      toast.success("Event link copied to clipboard")
    } catch (error) {
      toast.error("Failed to copy link")
    }
  }

  const handleShare = async () => {
    const publicLink = `${window.location.origin}/event/${event.id}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.name,
          text: `Check out ${event.name}!`,
          url: publicLink,
        })
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      await handleCopyLink()
    }
  }

  const dimensions =
    orientation === "landscape"
      ? { width: 1200, height: 630 }
      : { width: 800, height: 1200 }

  const previewMaxWidth = orientation === "landscape" ? 720 : 420

  return (
    <div className="space-y-6">
        {/* Orientation Toggle */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Orientation</span>
          <div className="flex gap-1 rounded-lg border p-1">
            <Button
              onClick={() => setOrientation("landscape")}
              variant={orientation === "landscape" ? "default" : "ghost"}
              size="sm"
              className="h-8"
            >
              Landscape
            </Button>
            <Button
              onClick={() => setOrientation("portrait")}
              variant={orientation === "portrait" ? "default" : "ghost"}
              size="sm"
              className="h-8"
            >
              Portrait
            </Button>
          </div>
        </div>

        {/* Color Palette Selector */}
        {!paletteLoading && (
          <div className="space-y-3">
            <label className="text-sm font-medium">Extracted palette</label>
            <div className="flex items-center gap-3">
              {(Object.keys(palette) as PaletteKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setSelectedPalette(key)}
                  className="group relative size-10 rounded-full transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                  disabled={isRendering}
                  title={PALETTE_LABELS[key]}
                >
                  {/* Color swatch with border */}
                  <div
                    className="size-full rounded-full border-2 border-border/20 transition-all group-hover:border-border/40"
                    style={{ backgroundColor: palette[key] }}
                  />
                  
                  {/* Checkmark for selected state - Spotify style */}
                  {selectedPalette === key && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg
                        className="size-4 drop-shadow-lg"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          fill="currentColor"
                          className="text-white drop-shadow-md"
                          strokeWidth="0.5"
                          stroke="rgba(0,0,0,0.2)"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error Display */}
        {renderError && (
          <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
            <p className="text-sm font-medium">Failed to render share card</p>
            <p className="mt-1 text-xs">{renderError}</p>
          </div>
        )}

        {/* Canvas Preview */}
        <div className="space-y-4">
          <div className="relative rounded-xl border bg-gradient-to-br from-slate-50 to-slate-100 p-6 dark:from-slate-900 dark:to-slate-800">
            {isRendering && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/50 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="text-sm">Generating...</span>
                </div>
              </div>
            )}
            <div
              className="mx-auto overflow-hidden rounded-2xl shadow-2xl"
              style={{ maxWidth: previewMaxWidth }}
            >
              <canvas
                ref={canvasRef}
                className="block size-full"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              {dimensions.width} × {dimensions.height}px
            </Badge>
            <div className="flex gap-2">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button variant="outline" size="sm" onClick={handleCopyLink}>
                  <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} className="mr-2 size-4" />
                  Copy Link
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <HugeiconsIcon icon={Share01Icon} strokeWidth={2} className="mr-2 size-4" />
                  Share
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button size="sm" onClick={handleDownload} disabled={isRendering}>
                  <HugeiconsIcon icon={Download01Icon} strokeWidth={2} className="mr-2 size-4" />
                  Download PNG
                </Button>
              </motion.div>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Perfect for Instagram, Facebook, Twitter, and LinkedIn. Choose your preferred color
          from the extracted palette.
        </p>
    </div>
  )
}
