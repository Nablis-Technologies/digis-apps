import { formatDateTime } from "./utils"
import {
  loadImage,
  drawCover,
  drawNeonQrCard,
  drawEventInfoGlassCard,
  drawWrappedText,
  createSvgIcon,
  getDigisLogoSvg,
} from "./canvas-utils"
import { hexToRgba, BRAND_EMERALD, DEFAULT_DARK_ATMOSPHERE } from "./color-extractor"

export type ShareCardOrientation = "story" | "portrait" | "landscape"

export interface RenderConfig {
  canvas: HTMLCanvasElement
  eventName: string
  venue: string
  city: string
  startAt: string
  bannerUrl: string
  qrCodeUrl: string
  baseColor?: string
  palette?: {
    vibrant?: string
    deepAtmosphere?: string
    edgeColor?: string
    secondary?: string
    brand?: string
  }
  orientation: ShareCardOrientation
  showQrCode?: boolean
  category?: string
  organizationName?: string
}

// Crisp Vector SVGs for Canvas Icons
const CALENDAR_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="3"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/><circle cx="8" cy="14" r="1.2" fill="#ffffff"/><circle cx="12" cy="14" r="1.2" fill="#ffffff"/><circle cx="16" cy="14" r="1.2" fill="#ffffff"/></svg>`
const LOCATION_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="#ffffff"/></svg>`

interface InternalRenderPayload extends RenderConfig {
  size: { width: number; height: number }
  banner: HTMLImageElement
  qr: HTMLImageElement
  calendarIcon: HTMLImageElement
  locationIcon: HTMLImageElement
  digisLogoSvgImg: HTMLImageElement
  palette: {
    vibrant: string
    deepAtmosphere: string
    edgeColor: string
    secondary: string
    brand: string
  }
  dateTimeText: string
  venueText: string
}

export async function renderShareCard(config: RenderConfig) {
  const { canvas, orientation, showQrCode = true } = config
  const ctx = canvas.getContext("2d", { alpha: false })
  if (!ctx) throw new Error("Canvas context not available")

  // Resolve palette tokens first
  const baseColor = config.baseColor || BRAND_EMERALD
  const vibrant = config.palette?.vibrant || baseColor
  const deepAtmosphere = config.palette?.deepAtmosphere || DEFAULT_DARK_ATMOSPHERE
  const edgeColor = config.palette?.edgeColor || deepAtmosphere
  const secondary = config.palette?.secondary || vibrant

  // Load vector icons and Digis logo (tinted with vibrant color)
  const digisLogoSvg = getDigisLogoSvg(vibrant)

  const [
    calendarIconUrl,
    locationIconUrl,
    digisLogoSvgUrl,
  ] = await Promise.all([
    createSvgIcon(CALENDAR_ICON_SVG),
    createSvgIcon(LOCATION_ICON_SVG),
    createSvgIcon(digisLogoSvg),
  ])

  // Cache-busting on banner
  const delimiter = config.bannerUrl.includes("?") ? "&" : "?"
  const bannerUrlWithCacheBuster = `${config.bannerUrl}${delimiter}cb=${Date.now()}`

  const [
    banner,
    qr,
    calendarIcon,
    locationIcon,
    digisLogoSvgImg,
  ] = await Promise.all([
    loadImage(bannerUrlWithCacheBuster),
    loadImage(config.qrCodeUrl),
    loadImage(calendarIconUrl),
    loadImage(locationIconUrl),
    loadImage(digisLogoSvgUrl),
  ])

  // Revoke blob URLs
  URL.revokeObjectURL(calendarIconUrl)
  URL.revokeObjectURL(locationIconUrl)
  URL.revokeObjectURL(digisLogoSvgUrl)

  // Standard Social Aspect Ratios:
  // - Story: 1080 x 1920 (9:16)
  // - Portrait (Feed): 1080 x 1350 (4:5)
  // - Landscape: 1200 x 630 (1.91:1)
  const size =
    orientation === "story"
      ? { width: 1080, height: 1920 }
      : orientation === "portrait"
      ? { width: 1080, height: 1350 }
      : { width: 1200, height: 630 }

  canvas.width = size.width
  canvas.height = size.height

  // Format Date & Time: "Jun 18, 2026 · 1:32 PM"
  const rawDateTime = formatDateTime(config.startAt)
  const dateTimeText = rawDateTime.replace(/, (?=\d{1,2}:\d{2})/, " · ")
  const venueText = config.city ? `${config.venue}, ${config.city}` : config.venue

  const renderPayload: InternalRenderPayload = {
    ...config,
    size,
    banner,
    qr,
    calendarIcon,
    locationIcon,
    digisLogoSvgImg,
    palette: {
      vibrant,
      deepAtmosphere,
      edgeColor,
      secondary,
      brand: BRAND_EMERALD,
    },
    dateTimeText,
    venueText,
    showQrCode,
  }

  if (orientation === "story") {
    await renderStory(ctx, renderPayload)
  } else if (orientation === "portrait") {
    await renderPortrait(ctx, renderPayload)
  } else {
    await renderLandscape(ctx, renderPayload)
  }
}

// ─── 1. STORY / STATUS FORMAT (1080 × 1920, 9:16) ─────────────────────────────
async function renderStory(ctx: CanvasRenderingContext2D, config: InternalRenderPayload) {
  const {
    size,
    banner,
    qr,
    calendarIcon,
    locationIcon,
    digisLogoSvgImg,
    palette,
    dateTimeText,
    venueText,
    showQrCode,
  } = config

  const padding = 64

  // 1. Deep Chromatic Base & Full-Bleed Artwork
  ctx.fillStyle = palette.deepAtmosphere
  ctx.fillRect(0, 0, size.width, size.height)

  // Full-bleed artwork in background (covers canvas with cover fit)
  drawCover(ctx, banner, 0, 0, size.width, size.height)

  // Top Dark Vignette (ensures "Digis presents" & Giant Title pop with 100% legibility)
  const topVignette = ctx.createLinearGradient(0, 0, 0, 680)
  topVignette.addColorStop(0, "rgba(0, 0, 0, 0.90)")
  topVignette.addColorStop(0.45, "rgba(0, 0, 0, 0.70)")
  topVignette.addColorStop(0.75, "rgba(0, 0, 0, 0.30)")
  topVignette.addColorStop(1, "rgba(0, 0, 0, 0.0)")
  ctx.fillStyle = topVignette
  ctx.fillRect(0, 0, size.width, 680)

  // Bottom Atmospheric Transition (blends into deep dark base for glass card & glowing QR)
  const bottomGradient = ctx.createLinearGradient(0, 780, 0, size.height)
  bottomGradient.addColorStop(0, "rgba(0, 0, 0, 0.0)")
  bottomGradient.addColorStop(0.35, hexToRgba(palette.deepAtmosphere, 0.75))
  bottomGradient.addColorStop(0.65, hexToRgba(palette.deepAtmosphere, 0.96))
  bottomGradient.addColorStop(1, palette.deepAtmosphere)
  ctx.fillStyle = bottomGradient
  ctx.fillRect(0, 780, size.width, size.height - 780)

  // Subtle Radiant Color Bloom behind QR area
  const qrBloom = ctx.createRadialGradient(
    size.width / 2,
    1550,
    0,
    size.width / 2,
    1550,
    460
  )
  qrBloom.addColorStop(0, hexToRgba(palette.vibrant, 0.26))
  qrBloom.addColorStop(0.6, hexToRgba(palette.vibrant, 0.06))
  qrBloom.addColorStop(1, "rgba(0, 0, 0, 0)")
  ctx.fillStyle = qrBloom
  ctx.fillRect(0, 1100, size.width, size.height - 1100)

  // 2. Header: "Digis presents" + Official Digis Logo Mark
  const headerY = 74
  ctx.save()
  ctx.font = "700 28px system-ui, -apple-system, sans-serif"
  ctx.textBaseline = "middle"
  ctx.textAlign = "left"

  // "Digis" in vibrant tone
  ctx.fillStyle = palette.vibrant
  ctx.fillText("Digis", padding, headerY)
  const digisWidth = ctx.measureText("Digis").width

  // "presents" in soft white
  ctx.fillStyle = "rgba(255, 255, 255, 0.72)"
  ctx.font = "500 28px system-ui, -apple-system, sans-serif"
  ctx.fillText(" presents", padding + digisWidth, headerY)

  // Official Digis Logo at top right
  const logoSize = 48
  const logoX = size.width - padding - logoSize
  const logoY = headerY - logoSize / 2
  ctx.drawImage(digisLogoSvgImg, logoX, logoY, logoSize, logoSize)
  ctx.restore()

  // 3. Huge Event Title (Stacked, Bold, Clean)
  ctx.save()
  ctx.fillStyle = "#ffffff"
  ctx.font = "900 84px system-ui, -apple-system, sans-serif"
  ctx.shadowColor = "rgba(0, 0, 0, 0.65)"
  ctx.shadowBlur = 20
  ctx.shadowOffsetY = 4

  drawWrappedText({
    ctx,
    text: config.eventName,
    x: padding,
    y: 135,
    maxWidth: size.width - padding * 2,
    lineHeight: 96,
    maxLines: 3,
  })
  ctx.restore()

  // 4. Glassmorphic Event Info Card (Date/Time & Venue)
  const cardWidth = size.width - padding * 2
  const cardHeight = 200
  const cardX = padding
  const cardY = showQrCode ? 1170 : size.height - padding - cardHeight - 80

  drawEventInfoGlassCard({
    ctx,
    x: cardX,
    y: cardY,
    width: cardWidth,
    height: cardHeight,
    dateTimeText,
    venueText,
    calendarIcon,
    locationIcon,
    vibrantColor: palette.vibrant,
  })

  // 5. Glowing Neon QR Code Unit
  if (showQrCode) {
    const qrBoxSize = 310
    const qrY = 1420

    drawNeonQrCard({
      ctx,
      qr,
      centerX: size.width / 2,
      y: qrY,
      boxSize: qrBoxSize,
      vibrantColor: palette.vibrant,
      scanLabel: "✦ Scan to claim ✦",
    })
  }
}

// ─── 2. PORTRAIT / FEED FORMAT (1080 × 1350, 4:5) ─────────────────────────────
async function renderPortrait(ctx: CanvasRenderingContext2D, config: InternalRenderPayload) {
  const {
    size,
    banner,
    qr,
    calendarIcon,
    locationIcon,
    digisLogoSvgImg,
    palette,
    dateTimeText,
    venueText,
    showQrCode,
  } = config

  const padding = 54

  // 1. Deep Chromatic Base & Full-Bleed Artwork
  ctx.fillStyle = palette.deepAtmosphere
  ctx.fillRect(0, 0, size.width, size.height)

  // Full-bleed artwork in background
  drawCover(ctx, banner, 0, 0, size.width, size.height)

  // Top Dark Vignette for Title
  const topVignette = ctx.createLinearGradient(0, 0, 0, 520)
  topVignette.addColorStop(0, "rgba(0, 0, 0, 0.90)")
  topVignette.addColorStop(0.45, "rgba(0, 0, 0, 0.68)")
  topVignette.addColorStop(0.75, "rgba(0, 0, 0, 0.28)")
  topVignette.addColorStop(1, "rgba(0, 0, 0, 0.0)")
  ctx.fillStyle = topVignette
  ctx.fillRect(0, 0, size.width, 520)

  // Bottom Atmospheric Transition into deep dark tone
  const bottomGradient = ctx.createLinearGradient(0, 540, 0, size.height)
  bottomGradient.addColorStop(0, "rgba(0, 0, 0, 0.0)")
  bottomGradient.addColorStop(0.35, hexToRgba(palette.deepAtmosphere, 0.75))
  bottomGradient.addColorStop(0.65, hexToRgba(palette.deepAtmosphere, 0.96))
  bottomGradient.addColorStop(1, palette.deepAtmosphere)
  ctx.fillStyle = bottomGradient
  ctx.fillRect(0, 540, size.width, size.height - 540)

  // Subtle Radiant Color Bloom behind QR area
  const qrBloom = ctx.createRadialGradient(
    size.width / 2,
    1100,
    0,
    size.width / 2,
    1100,
    380
  )
  qrBloom.addColorStop(0, hexToRgba(palette.vibrant, 0.28))
  qrBloom.addColorStop(0.6, hexToRgba(palette.vibrant, 0.06))
  qrBloom.addColorStop(1, "rgba(0, 0, 0, 0)")
  ctx.fillStyle = qrBloom
  ctx.fillRect(0, 800, size.width, size.height - 800)

  // 2. Header: "Digis presents" + Official Digis Logo Mark
  const headerY = 64
  ctx.save()
  ctx.font = "700 24px system-ui, -apple-system, sans-serif"
  ctx.textBaseline = "middle"
  ctx.textAlign = "left"

  ctx.fillStyle = palette.vibrant
  ctx.fillText("Digis", padding, headerY)
  const digisWidth = ctx.measureText("Digis").width

  ctx.fillStyle = "rgba(255, 255, 255, 0.72)"
  ctx.font = "500 24px system-ui, -apple-system, sans-serif"
  ctx.fillText(" presents", padding + digisWidth, headerY)

  const logoSize = 42
  const logoX = size.width - padding - logoSize
  const logoY = headerY - logoSize / 2
  ctx.drawImage(digisLogoSvgImg, logoX, logoY, logoSize, logoSize)
  ctx.restore()

  // 3. Huge Event Title
  ctx.save()
  ctx.fillStyle = "#ffffff"
  ctx.font = "900 68px system-ui, -apple-system, sans-serif"
  ctx.shadowColor = "rgba(0, 0, 0, 0.65)"
  ctx.shadowBlur = 18
  ctx.shadowOffsetY = 4

  drawWrappedText({
    ctx,
    text: config.eventName,
    x: padding,
    y: 114,
    maxWidth: size.width - padding * 2,
    lineHeight: 78,
    maxLines: 2,
  })
  ctx.restore()

  // 4. Glassmorphic Event Info Card (Date/Time & Venue)
  const cardWidth = size.width - padding * 2
  const cardHeight = 175
  const cardX = padding
  const cardY = showQrCode ? 770 : size.height - padding - cardHeight - 60

  drawEventInfoGlassCard({
    ctx,
    x: cardX,
    y: cardY,
    width: cardWidth,
    height: cardHeight,
    dateTimeText,
    venueText,
    calendarIcon,
    locationIcon,
    vibrantColor: palette.vibrant,
  })

  // 5. Glowing Neon QR Code Unit
  if (showQrCode) {
    const qrBoxSize = 250
    const qrY = 985

    drawNeonQrCard({
      ctx,
      qr,
      centerX: size.width / 2,
      y: qrY,
      boxSize: qrBoxSize,
      vibrantColor: palette.vibrant,
      scanLabel: "✦ Scan to claim ✦",
    })
  }
}

// ─── 3. LANDSCAPE FORMAT (1200 × 630, 1.91:1) ─────────────────────────────────
async function renderLandscape(ctx: CanvasRenderingContext2D, config: InternalRenderPayload) {
  const {
    size,
    banner,
    qr,
    calendarIcon,
    locationIcon,
    digisLogoSvgImg,
    palette,
    dateTimeText,
    venueText,
    showQrCode,
  } = config

  const padding = 44

  // 1. Base Dark Surface
  ctx.fillStyle = palette.deepAtmosphere
  ctx.fillRect(0, 0, size.width, size.height)

  // 2. Left Side: Hero Artwork (extending across left 65% of canvas)
  const artworkWidth = Math.round(size.width * 0.65) // 780px
  drawCover(ctx, banner, 0, 0, artworkWidth, size.height)

  // Subtle left-edge vignette to frame artwork
  const leftVignette = ctx.createLinearGradient(0, 0, 140, 0)
  leftVignette.addColorStop(0, "rgba(0, 0, 0, 0.40)")
  leftVignette.addColorStop(1, "rgba(0, 0, 0, 0.0)")
  ctx.fillStyle = leftVignette
  ctx.fillRect(0, 0, 140, size.height)

  // 3. Smooth Horizontal Gradient Fade: Artwork melts into deepAtmosphere
  // Wide gradient transition spanning from x=360 to x=640
  const fadeStartX = 360
  const fadeEndX = 640
  const horizFade = ctx.createLinearGradient(fadeStartX, 0, fadeEndX, 0)
  horizFade.addColorStop(0, "rgba(0, 0, 0, 0.0)")
  horizFade.addColorStop(0.35, hexToRgba(palette.deepAtmosphere, 0.40))
  horizFade.addColorStop(0.65, hexToRgba(palette.deepAtmosphere, 0.80))
  horizFade.addColorStop(0.88, hexToRgba(palette.deepAtmosphere, 0.96))
  horizFade.addColorStop(1, palette.deepAtmosphere)

  ctx.fillStyle = horizFade
  ctx.fillRect(fadeStartX, 0, fadeEndX - fadeStartX, size.height)

  // Fill solid deepAtmosphere from fadeEndX all the way to right edge
  ctx.fillStyle = palette.deepAtmosphere
  ctx.fillRect(fadeEndX, 0, size.width - fadeEndX, size.height)

  // Radial color bloom on right side for ambient illumination
  ctx.save()
  const rightBloom = ctx.createRadialGradient(
    size.width * 0.82,
    size.height * 0.50,
    0,
    size.width * 0.82,
    size.height * 0.50,
    440
  )
  rightBloom.addColorStop(0, hexToRgba(palette.vibrant, 0.24))
  rightBloom.addColorStop(0.55, hexToRgba(palette.vibrant, 0.05))
  rightBloom.addColorStop(1, "rgba(0, 0, 0, 0)")
  ctx.fillStyle = rightBloom
  ctx.fillRect(fadeStartX, 0, size.width - fadeStartX, size.height)
  ctx.restore()

  // 4. Right Content Column (starts safely at x = 640, where background is 100% dark)
  const rightX = 640
  const rightW = size.width - rightX - padding

  // Header: "Digis presents" + Official Digis Logo Mark
  const headerY = 44
  ctx.save()
  ctx.font = "700 20px system-ui, -apple-system, sans-serif"
  ctx.textBaseline = "middle"
  ctx.textAlign = "left"

  ctx.fillStyle = palette.vibrant
  ctx.fillText("Digis", rightX, headerY)
  const digisWidth = ctx.measureText("Digis").width

  ctx.fillStyle = "rgba(255, 255, 255, 0.70)"
  ctx.font = "500 20px system-ui, -apple-system, sans-serif"
  ctx.fillText(" presents", rightX + digisWidth, headerY)

  // Official Digis Logo Mark on right edge
  const logoSize = 36
  const logoX = size.width - padding - logoSize
  const logoY = headerY - logoSize / 2
  ctx.drawImage(digisLogoSvgImg, logoX, logoY, logoSize, logoSize)
  ctx.restore()

  // Event Title (Bold, Clean, Stacked)
  const titleY = 78
  ctx.save()
  ctx.fillStyle = "#ffffff"
  ctx.font = "900 42px system-ui, -apple-system, sans-serif"
  ctx.shadowColor = "rgba(0, 0, 0, 0.6)"
  ctx.shadowBlur = 14
  ctx.shadowOffsetY = 3

  const titleEndY = drawWrappedText({
    ctx,
    text: config.eventName,
    x: rightX,
    y: titleY,
    maxWidth: rightW,
    lineHeight: 48,
    maxLines: 2,
  })
  ctx.restore()

  // 5. Date & Venue Card and QR spacing
  // Check if title is single-line to dynamically balance vertical gaps and absorb space under QR
  const isSingleLineTitle = titleEndY <= titleY + 54

  const gapTitleToCard = showQrCode ? (isSingleLineTitle ? 38 : 28) : 48
  const infoCardH = showQrCode ? (isSingleLineTitle ? 116 : 112) : 138
  const infoCardY = titleEndY + gapTitleToCard
  const infoCardW = rightW

  drawEventInfoGlassCard({
    ctx,
    x: rightX,
    y: infoCardY,
    width: infoCardW,
    height: infoCardH,
    dateTimeText,
    venueText,
    calendarIcon,
    locationIcon,
    vibrantColor: palette.vibrant,
  })

  // 6. Glowing Neon QR Unit (comfortably spaced from info card, absorbing excess space below)
  if (showQrCode) {
    const gapCardToQr = isSingleLineTitle ? 40 : 34
    const qrY = infoCardY + infoCardH + gapCardToQr
    const qrBoxSize = isSingleLineTitle ? 186 : 178
    const qrCenterX = rightX + rightW / 2

    drawNeonQrCard({
      ctx,
      qr,
      centerX: qrCenterX,
      y: qrY,
      boxSize: qrBoxSize,
      vibrantColor: palette.vibrant,
      scanLabel: "✦ Scan to claim ✦",
    })
  }
}
