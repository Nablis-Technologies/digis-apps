import { formatDate } from "./utils"
import {
  loadImage,
  drawCover,
  drawRoundedRect,
  fillRoundedRect,
  drawWrappedText,
  darkenHex,
  createSvgIcon,
} from "./canvas-utils"

export interface RenderConfig {
  canvas: HTMLCanvasElement
  eventName: string
  venue: string
  city: string
  startAt: string
  bannerUrl: string
  qrCodeUrl: string
  baseColor: string
  orientation: "landscape" | "portrait"
}

// Calendar icon SVG
const CALENDAR_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.95)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>`

// Location pin icon SVG
const LOCATION_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`

export async function renderShareCard(config: RenderConfig) {
  const { canvas, orientation } = config
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas context not available")

  // Load all assets
  const [calendarUrl, locationUrl] = await Promise.all([
    createSvgIcon(CALENDAR_ICON),
    createSvgIcon(LOCATION_ICON),
  ])

  // ✅ Add cache-busting to banner URL to ensure fresh image load
  const bannerUrlWithCacheBuster = `${config.bannerUrl}?v=${Date.now()}`

  const [banner, qr, calendarIcon, locationIcon] = await Promise.all([
    loadImage(bannerUrlWithCacheBuster),
    loadImage(config.qrCodeUrl),
    loadImage(calendarUrl),
    loadImage(locationUrl),
  ])

  // Cleanup blob URLs
  URL.revokeObjectURL(calendarUrl)
  URL.revokeObjectURL(locationUrl)

  // Set canvas size
  const size =
    orientation === "landscape"
      ? { width: 1200, height: 630 }
      : { width: 800, height: 1200 }

  canvas.width = size.width
  canvas.height = size.height

  // Render
  if (orientation === "portrait") {
    await renderPortrait(ctx, {
      ...config,
      banner,
      qr,
      calendarIcon,
      locationIcon,
      size,
    })
  } else {
    await renderLandscape(ctx, {
      ...config,
      banner,
      qr,
      calendarIcon,
      locationIcon,
      size,
    })
  }
}

async function renderPortrait(ctx: CanvasRenderingContext2D, config: any) {
  const { size, baseColor, banner, qr, calendarIcon, locationIcon } = config

  const layout = {
    padding: 40,
    radius: 40,
    imageHeight: 520,
    fadeHeight: 200,
    titleSize: 72,
    metaSize: 32,
    locationSize: 28,
    labelSize: 28,
    qrBox: 160,
    qrPadding: 12,
    qrRadius: 20,
    textGap: 14,
  }

  // Clear and clip canvas
  ctx.clearRect(0, 0, size.width, size.height)
  ctx.save()
  drawRoundedRect(ctx, 0, 0, size.width, size.height, layout.radius)
  ctx.clip()

  // Draw banner image (top portion)
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, size.width, layout.imageHeight)
  ctx.clip()
  drawCover(ctx, banner, 0, 0, size.width, layout.imageHeight)
  ctx.restore()

  // Create gradient fade from image to solid color
  const fadeGradient = ctx.createLinearGradient(
    0,
    layout.imageHeight - layout.fadeHeight,
    0,
    layout.imageHeight
  )
  fadeGradient.addColorStop(0, "rgba(0, 0, 0, 0)")
  fadeGradient.addColorStop(0.2, darkenHex(baseColor, 12) + "40")
  fadeGradient.addColorStop(0.4, darkenHex(baseColor, 18) + "90")
  fadeGradient.addColorStop(0.6, darkenHex(baseColor, 22) + "D0")
  fadeGradient.addColorStop(0.8, darkenHex(baseColor, 28) + "F0")
  fadeGradient.addColorStop(1, darkenHex(baseColor, 35))
  ctx.fillStyle = fadeGradient
  ctx.fillRect(
    0,
    layout.imageHeight - layout.fadeHeight,
    size.width,
    layout.fadeHeight
  )

  // Fill bottom with solid color
  ctx.fillStyle = darkenHex(baseColor, 35)
  ctx.fillRect(0, layout.imageHeight, size.width, size.height - layout.imageHeight)

  // Add subtle glow
  const glow = ctx.createRadialGradient(
    size.width * 0.5,
    size.height * 0.7,
    0,
    size.width * 0.5,
    size.height * 0.7,
    size.width * 0.6
  )
  glow.addColorStop(0, "rgba(255, 255, 255, 0.08)")
  glow.addColorStop(1, "rgba(255, 255, 255, 0)")
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, size.width, size.height)

  // Draw content
  const leftMargin = layout.padding
  let cursorY = layout.imageHeight + 40

  // Draw "DEGES presents"
  ctx.textAlign = "left"
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)"
  ctx.font = `600 ${layout.labelSize}px system-ui, -apple-system, sans-serif`
  ctx.fillText("✖ DEGES", leftMargin, cursorY)
  ctx.fillStyle = "rgba(255, 255, 255, 0.75)"
  ctx.fillText("presents", leftMargin + 115, cursorY)
  cursorY += layout.labelSize + layout.textGap + 28

  // Draw event name
  ctx.fillStyle = "#ffffff"
  ctx.font = `900 ${layout.titleSize}px system-ui, -apple-system, sans-serif`
  cursorY = drawWrappedText({
    ctx,
    text: config.eventName.toUpperCase(),
    x: leftMargin,
    y: cursorY,
    maxWidth: size.width - layout.padding * 2,
    lineHeight: layout.titleSize + 10,
    maxLines: 3,
  })
  cursorY += layout.textGap + 20

  // Format date/time
  const timeLabel = formatDate(config.startAt)

  // Draw calendar icon and date
  const iconSize = 32
  ctx.drawImage(calendarIcon, leftMargin, cursorY - iconSize + 8, iconSize, iconSize)
  ctx.fillStyle = "rgba(255, 255, 255, 0.95)"
  ctx.font = `600 ${layout.metaSize}px system-ui, -apple-system, sans-serif`
  ctx.fillText(timeLabel, leftMargin + iconSize + 12, cursorY)
  cursorY += layout.metaSize + layout.textGap + 12

  // Draw location icon and venue
  ctx.drawImage(locationIcon, leftMargin, cursorY - iconSize + 8, iconSize, iconSize)
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)"
  ctx.font = `500 ${layout.locationSize}px system-ui, -apple-system, sans-serif`
  ctx.fillText(`${config.venue}, ${config.city}`, leftMargin + iconSize + 12, cursorY)

  // Draw QR code section at bottom
  const qrSectionHeight = layout.qrBox + layout.qrPadding * 2
  const qrBoxY = size.height - layout.padding - qrSectionHeight
  const qrSectionY = qrBoxY - layout.qrPadding
  const qrSectionX = layout.padding
  const qrSectionWidth = size.width - layout.padding * 2

  // Draw bordered container
  ctx.strokeStyle = "rgba(255, 255, 255, 0.25)"
  ctx.lineWidth = 2.5
  ctx.save()
  drawRoundedRect(
    ctx,
    qrSectionX,
    qrSectionY,
    qrSectionWidth,
    qrSectionHeight,
    layout.qrRadius
  )
  ctx.stroke()
  ctx.restore()

  // Draw QR code background
  const qrBoxX = layout.padding + layout.qrPadding
  ctx.save()
  ctx.shadowColor = "rgba(0, 0, 0, 0.25)"
  ctx.shadowBlur = 14
  ctx.shadowOffsetY = 4
  fillRoundedRect(ctx, qrBoxX, qrBoxY, layout.qrBox, layout.qrBox, 16, "#ffffff")
  ctx.restore()

  // Draw QR code
  ctx.drawImage(
    qr,
    qrBoxX + layout.qrPadding,
    qrBoxY + layout.qrPadding,
    layout.qrBox - layout.qrPadding * 2,
    layout.qrBox - layout.qrPadding * 2
  )

  // Draw "Scan to claim" text
  const textX = qrBoxX + layout.qrBox + 30
  const textY = qrBoxY + layout.qrBox / 2 + 6
  ctx.fillStyle = "rgba(255, 255, 255, 0.95)"
  ctx.font = `700 ${layout.metaSize - 4}px system-ui, -apple-system, sans-serif`
  ctx.fillText("✖ Scan to claim", textX, textY)

  // DEGES branding at very bottom
  ctx.font = "500 18px system-ui, -apple-system, sans-serif"
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)"
  ctx.textAlign = "center"
  ctx.fillText("Powered by DEGES", size.width / 2, size.height - 20)

  ctx.restore()
}

async function renderLandscape(ctx: CanvasRenderingContext2D, config: any) {
  const { size, baseColor, banner, qr, calendarIcon, locationIcon } = config

  const layout = {
    padding: 50,
    radius: 40,
    imageWidth: 600,
    fadeWidth: 240,
    titleSize: 48,
    metaSize: 26,
    locationSize: 24,
    labelSize: 22,
    qrBox: 180,
    qrPadding: 14,
    qrRadius: 18,
    textGap: 12,
  }

  // Clear and clip
  ctx.clearRect(0, 0, size.width, size.height)
  ctx.save()
  drawRoundedRect(ctx, 0, 0, size.width, size.height, layout.radius)
  ctx.clip()

  // Draw banner (left side)
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, layout.imageWidth, size.height)
  ctx.clip()
  drawCover(ctx, banner, 0, 0, layout.imageWidth, size.height)
  ctx.restore()

  // Horizontal gradient fade
  const fadeGradient = ctx.createLinearGradient(
    layout.imageWidth - layout.fadeWidth,
    0,
    layout.imageWidth,
    0
  )
  fadeGradient.addColorStop(0, "rgba(0, 0, 0, 0)")
  fadeGradient.addColorStop(0.2, darkenHex(baseColor, 12) + "40")
  fadeGradient.addColorStop(0.4, darkenHex(baseColor, 18) + "90")
  fadeGradient.addColorStop(0.6, darkenHex(baseColor, 22) + "D0")
  fadeGradient.addColorStop(0.8, darkenHex(baseColor, 28) + "F0")
  fadeGradient.addColorStop(1, darkenHex(baseColor, 35))
  ctx.fillStyle = fadeGradient
  ctx.fillRect(
    layout.imageWidth - layout.fadeWidth,
    0,
    layout.fadeWidth,
    size.height
  )

  // Fill right side
  ctx.fillStyle = darkenHex(baseColor, 35)
  ctx.fillRect(layout.imageWidth, 0, size.width - layout.imageWidth, size.height)

  // Add glow
  const glow = ctx.createRadialGradient(
    size.width * 0.75,
    size.height * 0.5,
    0,
    size.width * 0.75,
    size.height * 0.5,
    size.width * 0.35
  )
  glow.addColorStop(0, "rgba(255, 255, 255, 0.08)")
  glow.addColorStop(1, "rgba(255, 255, 255, 0)")
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, size.width, size.height)

  // Draw content (right side)
  const rightX = layout.imageWidth + 40
  const rightWidth = size.width - rightX - layout.padding
  let cursorY = layout.padding + 20

  ctx.textAlign = "left"

  // "DEGES presents"
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)"
  ctx.font = `600 ${layout.labelSize}px system-ui, -apple-system, sans-serif`
  ctx.fillText("✖ DEGES", rightX, cursorY)
  ctx.fillStyle = "rgba(255, 255, 255, 0.75)"
  ctx.fillText("presents", rightX + 100, cursorY)
  cursorY += layout.labelSize + layout.textGap + 18

  // Event name
  ctx.fillStyle = "#ffffff"
  ctx.font = `900 ${layout.titleSize}px system-ui, -apple-system, sans-serif`
  cursorY = drawWrappedText({
    ctx,
    text: config.eventName.toUpperCase(),
    x: rightX,
    y: cursorY,
    maxWidth: rightWidth,
    lineHeight: layout.titleSize + 8,
    maxLines: 2,
  })
  cursorY += layout.textGap + 20

  // Date/time
  const timeLabel = formatDate(config.startAt)
  const iconSize = 28
  ctx.drawImage(calendarIcon, rightX, cursorY - iconSize + 6, iconSize, iconSize)
  ctx.fillStyle = "rgba(255, 255, 255, 0.95)"
  ctx.font = `600 ${layout.metaSize}px system-ui, -apple-system, sans-serif`
  ctx.fillText(timeLabel, rightX + iconSize + 10, cursorY)
  cursorY += layout.metaSize + layout.textGap + 12

  // Location
  ctx.drawImage(locationIcon, rightX, cursorY - iconSize + 6, iconSize, iconSize)
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)"
  ctx.font = `500 ${layout.locationSize}px system-ui, -apple-system, sans-serif`
  ctx.fillText(`${config.venue}, ${config.city}`, rightX + iconSize + 10, cursorY)

  // QR code at bottom
  const qrSectionHeight = layout.qrBox + layout.qrPadding * 2
  const qrBoxY = size.height - layout.padding - qrSectionHeight
  const qrSectionY = qrBoxY - layout.qrPadding
  const qrSectionX = rightX
  const qrSectionWidth = rightWidth

  // Bordered container
  ctx.strokeStyle = "rgba(255, 255, 255, 0.25)"
  ctx.lineWidth = 2.5
  ctx.save()
  drawRoundedRect(
    ctx,
    qrSectionX,
    qrSectionY,
    qrSectionWidth,
    qrSectionHeight,
    layout.qrRadius
  )
  ctx.stroke()
  ctx.restore()

  // QR background
  const qrBoxX = rightX + layout.qrPadding
  ctx.save()
  ctx.shadowColor = "rgba(0, 0, 0, 0.25)"
  ctx.shadowBlur = 12
  ctx.shadowOffsetY = 4
  fillRoundedRect(ctx, qrBoxX, qrBoxY, layout.qrBox, layout.qrBox, 14, "#ffffff")
  ctx.restore()

  // QR code
  ctx.drawImage(
    qr,
    qrBoxX + layout.qrPadding,
    qrBoxY + layout.qrPadding,
    layout.qrBox - layout.qrPadding * 2,
    layout.qrBox - layout.qrPadding * 2
  )

  // "Scan to claim"
  const textX = qrBoxX + layout.qrBox + 25
  const textY = qrBoxY + layout.qrBox / 2 + 4
  ctx.fillStyle = "rgba(255, 255, 255, 0.95)"
  ctx.font = `700 ${layout.metaSize - 2}px system-ui, -apple-system, sans-serif`
  ctx.fillText("✖ Scan to claim", textX, textY)

  ctx.restore()
}
