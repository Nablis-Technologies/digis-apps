"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Download01Icon,
  Copy01Icon,
  SmartPhone01Icon,
  Image01Icon,
  Layout01Icon,
  CheckmarkCircle01Icon,
  Loading03Icon,
  QrCodeIcon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"
import type { Event } from "@/lib/types"
import { useColorPalette, type PaletteKey } from "@/lib/use-color-palette"
import { generateQRCode } from "@/lib/qr-code"
import { renderShareCard, type ShareCardOrientation } from "@/lib/share-card-renderer"
import { cn } from "@workspace/ui/lib/utils"

interface ShareCardGeneratorProps {
  event: Event
}

const FORMAT_OPTIONS: {
  key: ShareCardOrientation
  label: string
  ratio: string
  sublabel: string
  icon: any
}[] = [
  {
    key: "story",
    label: "Story / Status",
    ratio: "9:16",
    sublabel: "Instagram, TikTok, WhatsApp",
    icon: SmartPhone01Icon,
  },
  {
    key: "portrait",
    label: "Feed Post",
    ratio: "4:5",
    sublabel: "Instagram & Facebook Feed",
    icon: Image01Icon,
  },
  {
    key: "landscape",
    label: "Landscape",
    ratio: "1.91:1",
    sublabel: "X (Twitter), LinkedIn, Web",
    icon: Layout01Icon,
  },
]

export function ShareCardGenerator({ event }: ShareCardGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [orientation, setOrientation] = useState<ShareCardOrientation>("story")
  const [selectedColorKey, setSelectedColorKey] = useState<PaletteKey>("vibrant")
  const [showQrCode, setShowQrCode] = useState(true)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("")
  const [isRendering, setIsRendering] = useState(false)
  const [renderError, setRenderError] = useState<string | null>(null)
  const [isCopyingImage, setIsCopyingImage] = useState(false)

  // Color extraction from banner
  const { palette, loading: paletteLoading } = useColorPalette(event.bannerUrl, event.name)

  // Generate high-res branded QR code
  useEffect(() => {
    const publicLink = `${window.location.origin}/events/${event.id}`
    generateQRCode(publicLink, {
      width: 600,
      darkColor: "#090d0b",
      lightColor: "#ffffff",
      includeLogo: true,
      logoColor: "#10b981",
    })
      .then(setQrCodeUrl)
      .catch((error) => {
        console.error("Failed to generate QR code:", error)
        toast.error("Failed to generate QR code")
      })
  }, [event.id])

  // Re-render canvas whenever options change
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || paletteLoading || !qrCodeUrl) return

    setIsRendering(true)
    setRenderError(null)

    const baseColor = palette[selectedColorKey] || palette.vibrant

    renderShareCard({
      canvas,
      eventName: event.name,
      venue: event.venue,
      city: event.city,
      startAt: event.startAt,
      bannerUrl: event.bannerUrl,
      qrCodeUrl,
      baseColor,
      palette: {
        ...palette,
        vibrant: baseColor,
      },
      orientation,
      showQrCode,
      category: event.category,
    })
      .then(() => {
        setIsRendering(false)
      })
      .catch((error) => {
        console.error("Failed to render share card:", error)
        setRenderError(error.message)
        setIsRendering(false)
      })
  }, [
    event,
    qrCodeUrl,
    orientation,
    selectedColorKey,
    palette,
    paletteLoading,
    showQrCode,
  ])

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement("a")
    link.download = `${event.name.toLowerCase().replace(/\s+/g, "-")}-${orientation}-card.png`
    link.href = canvas.toDataURL("image/png")
    link.click()

    toast.success("Share card downloaded in HD!")
  }

  const handleCopyImage = async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    setIsCopyingImage(true)
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error("Could not generate image blob")
          setIsCopyingImage(false)
          return
        }

        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              "image/png": blob,
            }),
          ])
          toast.success("Share card copied to clipboard!")
        } catch (clipErr) {
          console.warn("Direct clipboard copy failed, falling back to download:", clipErr)
          handleDownload()
        } finally {
          setIsCopyingImage(false)
        }
      }, "image/png")
    } catch (err) {
      toast.error("Clipboard copy not supported in this browser")
      setIsCopyingImage(false)
    }
  }

  const handleCopyLink = async () => {
    const publicLink = `${window.location.origin}/events/${event.id}`
    try {
      await navigator.clipboard.writeText(publicLink)
      toast.success("Event link copied to clipboard")
    } catch (error) {
      toast.error("Failed to copy link")
    }
  }

  // Preview sizing
  const previewMaxHeight = orientation === "story" ? 480 : orientation === "portrait" ? 440 : 320

  const paletteSwatches: { key: PaletteKey; label: string; color: string }[] = [
    { key: "vibrant", label: "Vibrant", color: palette.vibrant },
    { key: "deepAtmosphere", label: "Deep Atmosphere", color: palette.deepAtmosphere },
    { key: "edgeColor", label: "Poster Edge", color: palette.edgeColor },
    { key: "secondary", label: "Secondary", color: palette.secondary },
    { key: "brand", label: "Digis Emerald", color: palette.brand },
  ]

  return (
    <div className="space-y-6">
      {/* ─── Controls Header: Formats & Options ─────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Format Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            Social Format &amp; Aspect Ratio
          </label>
          <div className="grid grid-cols-3 gap-2">
            {FORMAT_OPTIONS.map((opt) => {
              const isSelected = orientation === opt.key
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setOrientation(opt.key)}
                  className={cn(
                    "flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer",
                    isSelected
                      ? "border-emerald-500/80 bg-emerald-500/10 text-foreground shadow-xs ring-1 ring-emerald-500/40"
                      : "border-border/60 hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <HugeiconsIcon
                    icon={opt.icon}
                    size={20}
                    className={cn("mb-1", isSelected ? "text-emerald-600 dark:text-emerald-400" : "")}
                  />
                  <span className="text-xs font-bold leading-tight">{opt.label}</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5 font-mono">{opt.ratio}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Color Palette & Toggles */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground">
              Extracted Color Harmony
            </label>
            <button
              type="button"
              onClick={() => setShowQrCode(!showQrCode)}
              className={cn(
                "inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md border transition-all cursor-pointer",
                showQrCode
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "border-border text-muted-foreground"
              )}
            >
              <HugeiconsIcon icon={QrCodeIcon} size={12} strokeWidth={2} />
              <span>{showQrCode ? "QR Ticket: ON" : "QR Ticket: OFF"}</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5 p-2 rounded-xl border bg-muted/20">
            {paletteLoading ? (
              <div className="flex items-center gap-2 py-1 text-xs text-muted-foreground">
                <HugeiconsIcon icon={Loading03Icon} size={14} className="animate-spin" />
                Extracting tones from artwork...
              </div>
            ) : (
              paletteSwatches.map((swatch) => (
                <button
                  key={swatch.key}
                  type="button"
                  onClick={() => setSelectedColorKey(swatch.key)}
                  className="group relative flex flex-col items-center gap-1 cursor-pointer transition-transform hover:scale-105"
                  title={`${swatch.label} (${swatch.color})`}
                >
                  <div
                    className={cn(
                      "size-8 rounded-full border-2 transition-all shadow-2xs relative flex items-center justify-center",
                      selectedColorKey === swatch.key
                        ? "border-primary ring-2 ring-primary/40 scale-105"
                        : "border-border/60 group-hover:border-border"
                    )}
                    style={{ backgroundColor: swatch.color }}
                  >
                    {selectedColorKey === swatch.key && (
                      <div className="size-2 rounded-full bg-white shadow-xs" />
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground truncate max-w-[50px] leading-tight">
                    {swatch.label}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ─── Live Canvas Viewport ────────────────────────────────────────── */}
      <div className="relative flex flex-col items-center justify-center py-2">
        {isRendering && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/60 backdrop-blur-xs gap-2 text-foreground">
            <HugeiconsIcon icon={Loading03Icon} size={28} className="animate-spin text-emerald-500" />
            <span className="text-xs font-semibold tracking-wide">Rendering high-res card...</span>
          </div>
        )}

        {renderError && (
          <div className="z-10 rounded-xl bg-destructive/15 border border-destructive/30 p-3 text-destructive text-xs max-w-md text-center mb-3">
            {renderError}
          </div>
        )}

        <div
          className="relative z-10 overflow-hidden rounded-xl shadow-xl transition-all"
          style={{ maxHeight: previewMaxHeight }}
        >
          <canvas
            ref={canvasRef}
            className="block max-h-full max-w-full w-auto h-auto object-contain rounded-xl"
            style={{ maxHeight: previewMaxHeight }}
          />
        </div>
      </div>

      {/* ─── Action Toolbar ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs text-muted-foreground">
            {orientation === "story" ? "1080 × 1920 (9:16)" : orientation === "portrait" ? "1080 × 1350 (4:5)" : "1200 × 630 (1.91:1)"}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Seamless ambient blending with Digis branding
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 flex-1 sm:flex-initial"
            onClick={handleCopyLink}
          >
            <HugeiconsIcon icon={Copy01Icon} size={15} strokeWidth={2} />
            Copy Link
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 flex-1 sm:flex-initial"
            onClick={handleCopyImage}
            disabled={isRendering || isCopyingImage}
          >
            {isCopyingImage ? (
              <HugeiconsIcon icon={Loading03Icon} size={15} className="animate-spin" />
            ) : (
              <HugeiconsIcon icon={Copy01Icon} size={15} />
            )}
            Copy Image
          </Button>

          <Button
            size="sm"
            className="gap-1.5 flex-1 sm:flex-initial shadow-xs"
            onClick={handleDownload}
            disabled={isRendering}
          >
            <HugeiconsIcon icon={Download01Icon} size={15} strokeWidth={2} />
            Download HD PNG
          </Button>
        </div>
      </div>
    </div>
  )
}
