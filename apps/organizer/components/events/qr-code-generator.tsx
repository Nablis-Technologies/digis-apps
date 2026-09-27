"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Copy01Icon,
  Download01Icon,
  Share01Icon,
  QrCodeIcon,
  CheckmarkCircle01Icon,
  Loading03Icon,
  ArrowUpRight01Icon,
  Globe02Icon,
  Ticket01Icon,
  SmartPhone01Icon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"
import { generateQRCode, generateQRCodeSvg } from "@/lib/qr-code"
import { cn } from "@workspace/ui/lib/utils"

interface QRCodeGeneratorProps {
  eventId: string
  eventName: string
}

interface ColorTheme {
  id: string
  name: string
  darkColor: string
  lightColor: string
  logoColor: string
  badgeBg: string
}

const QR_THEMES: ColorTheme[] = [
  {
    id: "digis-emerald",
    name: "Digis Emerald",
    darkColor: "#090d0b",
    lightColor: "#ffffff",
    logoColor: "#10b981",
    badgeBg: "#10b981",
  },
  {
    id: "deep-forest",
    name: "Deep Forest",
    darkColor: "#064e3b",
    lightColor: "#ffffff",
    logoColor: "#10b981",
    badgeBg: "#064e3b",
  },
  {
    id: "classic-monolith",
    name: "Monochrome",
    darkColor: "#000000",
    lightColor: "#ffffff",
    logoColor: "#000000",
    badgeBg: "#000000",
  },
  {
    id: "indigo-night",
    name: "Indigo",
    darkColor: "#1e1b4b",
    lightColor: "#ffffff",
    logoColor: "#6366f1",
    badgeBg: "#6366f1",
  },
]

export function QRCodeGenerator({ eventId, eventName }: QRCodeGeneratorProps) {
  const [selectedTheme, setSelectedTheme] = useState<ColorTheme>(QR_THEMES[0]!)
  const [includeLogo, setIncludeLogo] = useState(true)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCopiedLink, setIsCopiedLink] = useState(false)
  const [isCopyingImage, setIsCopyingImage] = useState(false)

  const publicLink = typeof window !== "undefined"
    ? `${window.location.origin}/events/${eventId}`
    : `/events/${eventId}`

  // Generate high-resolution branded QR whenever options change
  useEffect(() => {
    let isCancelled = false
    setIsGenerating(true)

    generateQRCode(publicLink, {
      width: 1000,
      darkColor: selectedTheme.darkColor,
      lightColor: selectedTheme.lightColor,
      includeLogo,
      logoColor: selectedTheme.logoColor,
    })
      .then((url) => {
        if (!isCancelled) {
          setQrCodeUrl(url)
          setIsGenerating(false)
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          console.error("Failed to generate QR code:", error)
          toast.error("Failed to generate QR code")
          setIsGenerating(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [publicLink, selectedTheme, includeLogo])

  // Copy Public Link to Clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicLink)
      setIsCopiedLink(true)
      toast.success("Event link copied to clipboard!")
      setTimeout(() => setIsCopiedLink(false), 2200)
    } catch (error) {
      toast.error("Failed to copy link")
    }
  }

  // Open Public Event Page
  const handleOpenLink = () => {
    window.open(publicLink, "_blank", "noopener,noreferrer")
  }

  // Native Web Share or Link Copy
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: eventName,
          text: `Get your tickets for ${eventName} on Digis!`,
          url: publicLink,
        })
      } catch (error) {
        // User cancelled share
      }
    } else {
      await handleCopyLink()
    }
  }

  // Quick Social Share Links
  const handleSocialShare = (platform: "whatsapp" | "telegram" | "x" | "linkedin") => {
    let url = ""
    const shareMessage = `Join me at ${eventName}! Get instant tickets via Digis:`

    switch (platform) {
      case "whatsapp":
        url = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareMessage} ${publicLink}`)}`
        break
      case "telegram":
        url = `https://t.me/share/url?url=${encodeURIComponent(publicLink)}&text=${encodeURIComponent(shareMessage)}`
        break
      case "x":
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(publicLink)}`
        break
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicLink)}`
        break
    }

    window.open(url, "_blank", "noopener,noreferrer,width=600,height=550")
  }

  // Download High-Res PNG (1200x1200)
  const handleDownloadPNG = () => {
    if (!qrCodeUrl) return
    const link = document.createElement("a")
    link.download = `digis-qr-${eventName.toLowerCase().replace(/\s+/g, "-")}.png`
    link.href = qrCodeUrl
    link.click()
    toast.success("High-res QR Code PNG downloaded!")
  }

  // Download Vector SVG (for large print signage)
  const handleDownloadSVG = async () => {
    try {
      const svgString = await generateQRCodeSvg(publicLink, {
        darkColor: selectedTheme.darkColor,
        lightColor: selectedTheme.lightColor,
        includeLogo,
        logoColor: selectedTheme.logoColor,
      })

      const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" })
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.download = `digis-qr-${eventName.toLowerCase().replace(/\s+/g, "-")}.svg`
      link.href = blobUrl
      link.click()
      URL.revokeObjectURL(blobUrl)

      toast.success("Lossless vector SVG downloaded for print!")
    } catch (error) {
      console.error("Failed to generate SVG:", error)
      toast.error("Failed to download SVG QR code")
    }
  }

  // Copy QR Image directly to Clipboard
  const handleCopyImage = async () => {
    if (!qrCodeUrl) return
    setIsCopyingImage(true)

    try {
      const response = await fetch(qrCodeUrl)
      const blob = await response.blob()

      if (navigator.clipboard && navigator.clipboard.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob,
          }),
        ])
        toast.success("QR Code image copied to clipboard!")
      } else {
        handleDownloadPNG()
      }
    } catch (err) {
      console.warn("Direct QR clipboard copy error:", err)
      toast.error("Could not copy image directly — downloading PNG instead")
      handleDownloadPNG()
    } finally {
      setIsCopyingImage(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ─── 1. Smart Link & Quick Sharing Hub ─────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <Label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <HugeiconsIcon icon={Globe02Icon} size={16} className="text-emerald-500" />
              Public Smart Link
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Universal link with auto-detection for web ticket booking and mobile admission.
            </p>
          </div>
          <Badge variant="outline" className="w-fit text-[11px] gap-1 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live &amp; Resolving
          </Badge>
        </div>

        {/* Input with 1-click Copy & Open */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              value={publicLink}
              readOnly
              className="font-mono text-xs pr-10 bg-muted/30 border-muted-foreground/20 select-all"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="gap-1.5 shrink-0 min-w-[100px]"
          >
            <HugeiconsIcon
              icon={isCopiedLink ? CheckmarkCircle01Icon : Copy01Icon}
              size={15}
              className={isCopiedLink ? "text-emerald-500" : ""}
            />
            <span>{isCopiedLink ? "Copied!" : "Copy Link"}</span>
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={handleOpenLink}
            title="Open in new tab"
            className="shrink-0"
          >
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} />
          </Button>
        </div>

        {/* Instant Social Channels */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] font-medium text-muted-foreground">
            Instant share to audience channels:
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleSocialShare("whatsapp")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold transition-all cursor-pointer"
            >
              <span className="size-2 rounded-full bg-emerald-500" />
              WhatsApp
            </button>

            <button
              type="button"
              onClick={() => handleSocialShare("telegram")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-400 hover:bg-sky-500/20 text-xs font-semibold transition-all cursor-pointer"
            >
              <span className="size-2 rounded-full bg-sky-500" />
              Telegram
            </button>

            <button
              type="button"
              onClick={() => handleSocialShare("x")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/70 bg-muted/40 hover:bg-muted text-foreground text-xs font-semibold transition-all cursor-pointer"
            >
              <span className="text-xs font-bold">𝕏</span>
              Twitter / X
            </button>

            <button
              type="button"
              onClick={() => handleSocialShare("linkedin")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20 text-xs font-semibold transition-all cursor-pointer"
            >
              <span className="size-2 rounded-full bg-blue-600" />
              LinkedIn
            </button>

            <button
              type="button"
              onClick={handleNativeShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/70 bg-muted/40 hover:bg-muted text-foreground text-xs font-semibold transition-all cursor-pointer"
            >
              <HugeiconsIcon icon={Share01Icon} size={14} />
              More Options
            </button>
          </div>
        </div>
      </div>

      {/* ─── 2. Interactive Branded QR Studio ──────────────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-12 rounded-2xl border border-border/70 bg-muted/15 p-5">
        {/* QR Code Canvas Preview Container */}
        <div className="md:col-span-5 flex flex-col items-center justify-center">
          <div className="relative rounded-2xl border-2 border-dashed border-border/80 bg-background/90 p-5 shadow-xs flex flex-col items-center justify-center w-full max-w-[260px] aspect-square">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <HugeiconsIcon icon={Loading03Icon} size={28} className="animate-spin text-emerald-500" />
                <span className="text-xs">Building branded QR...</span>
              </div>
            ) : qrCodeUrl ? (
              <motion.div
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="relative flex items-center justify-center"
              >
                <img
                  src={qrCodeUrl}
                  alt={`Branded QR Code for ${eventName}`}
                  className="size-52 rounded-xl object-contain shadow-2xs"
                />
              </motion.div>
            ) : null}
          </div>

          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <HugeiconsIcon icon={QrCodeIcon} size={13} className="text-emerald-500" />
            <span>Official Digis Vector Seal • Level H (30% ECC)</span>
          </div>
        </div>

        {/* QR Controls & Export Studio */}
        <div className="md:col-span-7 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-semibold text-foreground">
                Branded QR Studio
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Engineered with high error correction so physical signage remains scannable even when worn or photographed from an angle.
              </p>
            </div>

            {/* Color Palette Switcher */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Color Preset
              </label>
              <div className="grid grid-cols-2 gap-2">
                {QR_THEMES.map((theme) => {
                  const isSelected = selectedTheme.id === theme.id
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setSelectedTheme(theme)}
                      className={cn(
                        "flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all cursor-pointer",
                        isSelected
                          ? "border-emerald-500 bg-emerald-500/10 shadow-2xs ring-1 ring-emerald-500/30"
                          : "border-border/60 hover:bg-muted/50"
                      )}
                    >
                      <div
                        className="size-5 rounded-full border border-white/20 shrink-0 shadow-2xs flex items-center justify-center"
                        style={{ backgroundColor: theme.darkColor }}
                      >
                        <div
                          className="size-2 rounded-full"
                          style={{ backgroundColor: theme.logoColor }}
                        />
                      </div>
                      <span className="text-xs font-medium text-foreground truncate">
                        {theme.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Digis Logo Toggle */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-xs font-medium text-foreground block">
                  Center Digis Emblem
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Official Digis vector seal from deges logo.svg
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIncludeLogo(!includeLogo)}
                className={cn(
                  "px-3 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer",
                  includeLogo
                    ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {includeLogo ? "Emblem: ON" : "Emblem: OFF"}
              </button>
            </div>
          </div>

          {/* Export Action Buttons */}
          <div className="pt-2 border-t border-border/50 flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={handleDownloadPNG}
              disabled={isGenerating || !qrCodeUrl}
              className="gap-1.5 flex-1 shadow-xs"
            >
              <HugeiconsIcon icon={Download01Icon} size={15} strokeWidth={2} />
              Download PNG
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadSVG}
              disabled={isGenerating || !qrCodeUrl}
              className="gap-1.5 flex-1"
              title="Download scalable vector SVG for print shops and signage"
            >
              <HugeiconsIcon icon={Download01Icon} size={15} strokeWidth={2} />
              Download SVG (Print)
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyImage}
              disabled={isGenerating || isCopyingImage || !qrCodeUrl}
              className="gap-1.5 shrink-0"
              title="Copy QR image to clipboard"
            >
              {isCopyingImage ? (
                <HugeiconsIcon icon={Loading03Icon} size={15} className="animate-spin" />
              ) : (
                <HugeiconsIcon icon={Copy01Icon} size={15} strokeWidth={2} />
              )}
              Copy Image
            </Button>
          </div>
        </div>
      </div>

      {/* ─── 3. Print & Placement Advisory ────────────────────────────────────── */}
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
          <HugeiconsIcon icon={Ticket01Icon} size={16} />
        </div>
        <div className="space-y-0.5 text-xs">
          <p className="font-semibold text-foreground">
            Print-Ready Venue Tip
          </p>
          <p className="text-muted-foreground leading-relaxed">
            For entry doors, roll-up banners, and table tents, use the <span className="font-medium text-foreground">SVG (Print)</span> download. Vector graphics scale infinitely without pixelation, guaranteeing ultra-fast check-in scanning on all smartphone cameras.
          </p>
        </div>
      </div>
    </div>
  )
}
