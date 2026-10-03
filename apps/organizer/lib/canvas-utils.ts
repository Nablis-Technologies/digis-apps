/**
 * Canvas utility functions for high-end share card generation
 */

import { hexToRgba } from "./color-extractor"

/**
 * Load an image with CORS support and cache-busting resilience
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    img.src = src
  })
}

/**
 * Draw image with cover fit (like CSS object-fit: cover)
 */
export function drawCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number
) {
  if (!image.width || !image.height) return
  const scale = Math.max(width / image.width, height / image.height)
  const scaledWidth = image.width * scale
  const scaledHeight = image.height * scale
  const offsetX = x + (width - scaledWidth) / 2
  const offsetY = y + (height - scaledHeight) / 2
  ctx.drawImage(image, offsetX, offsetY, scaledWidth, scaledHeight)
}

/**
 * Draw rounded rectangle path
 */
export function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + width, y, x + width, y + height, r)
  ctx.arcTo(x + width, y + height, x, y + height, r)
  ctx.arcTo(x, y + height, x, y, r)
  ctx.arcTo(x, y, x + width, y, r)
  ctx.closePath()
}

/**
 * Fill rounded rectangle with color
 */
export function fillRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillStyle: string | CanvasGradient
) {
  ctx.save()
  ctx.fillStyle = fillStyle
  drawRoundedRect(ctx, x, y, width, height, radius)
  ctx.fill()
  ctx.restore()
}

/**
 * Draw frosted glass container with subtle border and inner light
 */
export function drawGlassCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  options: {
    bgGradient?: CanvasGradient | string
    borderColor?: string
    borderWidth?: number
    shadowColor?: string
    shadowBlur?: number
  } = {}
) {
  const {
    bgGradient = "rgba(255, 255, 255, 0.08)",
    borderColor = "rgba(255, 255, 255, 0.16)",
    borderWidth = 1.5,
    shadowColor = "rgba(0, 0, 0, 0.35)",
    shadowBlur = 18,
  } = options

  ctx.save()
  if (shadowBlur > 0) {
    ctx.shadowColor = shadowColor
    ctx.shadowBlur = shadowBlur
    ctx.shadowOffsetY = 6
  }

  fillRoundedRect(ctx, x, y, width, height, radius, bgGradient)

  ctx.shadowColor = "transparent"
  ctx.strokeStyle = borderColor
  ctx.lineWidth = borderWidth
  drawRoundedRect(ctx, x, y, width, height, radius)
  ctx.stroke()
  ctx.restore()
}

/**
 * Draw ambient background with multi-stop radial blooms (safe, never leaks unblurred flyer text)
 */
export function drawAmbientBackdrop(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  palette: {
    deepAtmosphere: string
    vibrant: string
    secondary?: string
  }
) {
  // 1. Deep chromatic base
  ctx.fillStyle = palette.deepAtmosphere
  ctx.fillRect(0, 0, width, height)

  // 2. Vibrant radial glow (top bloom)
  ctx.save()
  const topGlow = ctx.createRadialGradient(
    width * 0.5,
    height * 0.2,
    0,
    width * 0.5,
    height * 0.2,
    Math.max(width, height) * 0.65
  )
  topGlow.addColorStop(0, hexToRgba(palette.vibrant, 0.22))
  topGlow.addColorStop(0.6, hexToRgba(palette.vibrant, 0.04))
  topGlow.addColorStop(1, "rgba(0, 0, 0, 0)")
  ctx.fillStyle = topGlow
  ctx.fillRect(0, 0, width, height)

  // 3. Secondary lower-third bloom (enhances QR code & bottom glow)
  const bottomGlowColor = palette.secondary || palette.vibrant
  const bottomGlow = ctx.createRadialGradient(
    width * 0.5,
    height * 0.82,
    0,
    width * 0.5,
    height * 0.82,
    Math.max(width, height) * 0.45
  )
  bottomGlow.addColorStop(0, hexToRgba(bottomGlowColor, 0.28))
  bottomGlow.addColorStop(0.5, hexToRgba(bottomGlowColor, 0.08))
  bottomGlow.addColorStop(1, "rgba(0, 0, 0, 0)")
  ctx.fillStyle = bottomGlow
  ctx.fillRect(0, 0, width, height)
  ctx.restore()
}

/**
 * Draw Glowing Neon QR Code Unit (matches the mockup reference)
 */
export function drawNeonQrCard({
  ctx,
  qr,
  centerX,
  y,
  boxSize,
  vibrantColor,
  scanLabel = "✦ Scan to claim ✦",
}: {
  ctx: CanvasRenderingContext2D
  qr: HTMLImageElement
  centerX: number
  y: number
  boxSize: number
  vibrantColor: string
  scanLabel?: string
}) {
  const x = centerX - boxSize / 2
  const radius = Math.round(boxSize * 0.16)

  // 1. Outer Neon Radiant Glow Halo
  ctx.save()
  ctx.shadowColor = hexToRgba(vibrantColor, 0.85)
  ctx.shadowBlur = Math.round(boxSize * 0.22)
  ctx.shadowOffsetY = 0

  // Neon rounded border stroke
  ctx.strokeStyle = hexToRgba(vibrantColor, 0.95)
  ctx.lineWidth = Math.max(3, Math.round(boxSize * 0.022))
  drawRoundedRect(ctx, x, y, boxSize, boxSize, radius)
  ctx.stroke()
  ctx.restore()

  // 2. Inner White QR Surface with rounded corners
  const qrPadding = Math.round(boxSize * 0.07)
  const innerSize = boxSize - qrPadding * 2
  const innerX = x + qrPadding
  const innerY = y + qrPadding
  const innerRadius = Math.max(8, radius - qrPadding)

  ctx.save()
  fillRoundedRect(ctx, innerX, innerY, innerSize, innerSize, innerRadius, "#ffffff")
  drawRoundedRect(ctx, innerX, innerY, innerSize, innerSize, innerRadius)
  ctx.clip()
  ctx.drawImage(qr, innerX + 4, innerY + 4, innerSize - 8, innerSize - 8)
  ctx.restore()

  // 3. Scan CTA Sparkle Text below QR
  const ctaY = y + boxSize + Math.round(boxSize * 0.12)
  ctx.save()
  ctx.font = `600 ${Math.max(14, Math.round(boxSize * 0.10))}px system-ui, -apple-system, sans-serif`
  ctx.fillStyle = hexToRgba(vibrantColor, 0.95)
  ctx.textAlign = "center"
  ctx.textBaseline = "top"
  ctx.fillText(scanLabel, centerX, ctaY)
  ctx.restore()
}

/**
 * Draw Event Information Glass Card (matches the 2-row mockup reference)
 */
export function drawEventInfoGlassCard({
  ctx,
  x,
  y,
  width,
  height,
  dateTimeText,
  venueText,
  calendarIcon,
  locationIcon,
  vibrantColor,
}: {
  ctx: CanvasRenderingContext2D
  x: number
  y: number
  width: number
  height: number
  dateTimeText: string
  venueText: string
  calendarIcon: HTMLImageElement
  locationIcon: HTMLImageElement
  vibrantColor: string
}) {
  const radius = Math.round(height * 0.15)

  // 1. Frosted Glass Background
  drawGlassCard(ctx, x, y, width, height, radius, {
    bgGradient: "rgba(255, 255, 255, 0.07)",
    borderColor: "rgba(255, 255, 255, 0.16)",
    shadowBlur: 24,
  })

  const rowHeight = height / 2
  const iconBoxSize = Math.round(rowHeight * 0.62)
  const iconPadding = Math.round(iconBoxSize * 0.22)
  const iconInnerSize = iconBoxSize - iconPadding * 2
  const leftPadding = Math.round(width * 0.045)
  const textX = x + leftPadding + iconBoxSize + Math.round(width * 0.035)

  // ── Row 1: Date & Time ──
  const row1CenterY = y + rowHeight / 2
  const icon1X = x + leftPadding
  const icon1Y = row1CenterY - iconBoxSize / 2

  // Circular Icon Badge 1
  ctx.save()
  fillRoundedRect(ctx, icon1X, icon1Y, iconBoxSize, iconBoxSize, iconBoxSize / 2, "rgba(255, 255, 255, 0.10)")
  ctx.strokeStyle = "rgba(255, 255, 255, 0.22)"
  ctx.lineWidth = 1
  drawRoundedRect(ctx, icon1X, icon1Y, iconBoxSize, iconBoxSize, iconBoxSize / 2)
  ctx.stroke()
  ctx.drawImage(calendarIcon, icon1X + iconPadding, icon1Y + iconPadding, iconInnerSize, iconInnerSize)
  ctx.restore()

  // Row 1 Texts
  ctx.save()
  ctx.textBaseline = "top"
  ctx.fillStyle = "#ffffff"
  ctx.font = `700 ${Math.max(16, Math.round(height * 0.15))}px system-ui, -apple-system, sans-serif`
  ctx.fillText(dateTimeText, textX, row1CenterY - Math.round(height * 0.16))

  ctx.fillStyle = hexToRgba(vibrantColor, 0.85)
  ctx.font = `700 ${Math.max(10, Math.round(height * 0.08))}px system-ui, -apple-system, sans-serif`
  ctx.fillText("DATE & TIME", textX, row1CenterY + Math.round(height * 0.03))
  ctx.restore()

  // ── Divider Hairline ──
  const dividerY = y + rowHeight
  ctx.save()
  ctx.strokeStyle = "rgba(255, 255, 255, 0.10)"
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(textX, dividerY)
  ctx.lineTo(x + width - leftPadding, dividerY)
  ctx.stroke()

  // Connecting vertical line between icons
  ctx.strokeStyle = "rgba(255, 255, 255, 0.18)"
  ctx.setLineDash([3, 3])
  ctx.beginPath()
  ctx.moveTo(icon1X + iconBoxSize / 2, icon1Y + iconBoxSize + 4)
  ctx.lineTo(icon1X + iconBoxSize / 2, y + rowHeight + (rowHeight / 2 - iconBoxSize / 2) - 4)
  ctx.stroke()
  ctx.restore()

  // ── Row 2: Venue & Location ──
  const row2CenterY = y + rowHeight + rowHeight / 2
  const icon2X = x + leftPadding
  const icon2Y = row2CenterY - iconBoxSize / 2

  // Circular Icon Badge 2
  ctx.save()
  fillRoundedRect(ctx, icon2X, icon2Y, iconBoxSize, iconBoxSize, iconBoxSize / 2, "rgba(255, 255, 255, 0.10)")
  ctx.strokeStyle = "rgba(255, 255, 255, 0.22)"
  ctx.lineWidth = 1
  drawRoundedRect(ctx, icon2X, icon2Y, iconBoxSize, iconBoxSize, iconBoxSize / 2)
  ctx.stroke()
  ctx.drawImage(locationIcon, icon2X + iconPadding, icon2Y + iconPadding, iconInnerSize, iconInnerSize)
  ctx.restore()

  // Row 2 Texts
  ctx.save()
  ctx.textBaseline = "top"
  ctx.fillStyle = "#ffffff"
  ctx.font = `700 ${Math.max(15, Math.round(height * 0.14))}px system-ui, -apple-system, sans-serif`
  ctx.fillText(venueText, textX, row2CenterY - Math.round(height * 0.16))

  ctx.fillStyle = hexToRgba(vibrantColor, 0.85)
  ctx.font = `700 ${Math.max(10, Math.round(height * 0.08))}px system-ui, -apple-system, sans-serif`
  ctx.fillText("VENUE", textX, row2CenterY + Math.round(height * 0.03))
  ctx.restore()
}

/**
 * Draw text with automatic word wrapping and line limits (strictly top-down layout)
 */
export function drawWrappedText({
  ctx,
  text,
  x,
  y,
  maxWidth,
  lineHeight,
  maxLines,
}: {
  ctx: CanvasRenderingContext2D
  text: string
  x: number
  y: number
  maxWidth: number
  lineHeight: number
  maxLines?: number
}): number {
  ctx.save()
  ctx.textBaseline = "top"

  const words = text.split(" ")
  const lines: string[] = []
  let currentLine = ""

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }
  if (currentLine) lines.push(currentLine)

  const finalLines = maxLines && lines.length > maxLines
    ? (() => {
        const trimmed = lines.slice(0, maxLines)
        let lastLine = trimmed[maxLines - 1]!
        while (ctx.measureText(`${lastLine}...`).width > maxWidth && lastLine.length > 0) {
          lastLine = lastLine.slice(0, -1)
        }
        trimmed[maxLines - 1] = `${lastLine.trim()}...`
        return trimmed
      })()
    : lines

  finalLines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight)
  })
  ctx.restore()

  return y + finalLines.length * lineHeight
}

/**
 * Return official Digis vector SVG mark (canonical path from deges logo.svg)
 */
export function getDigisLogoSvg(color: string = "#ffffff"): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" fill="${color}">
    <path d="M481.88,355.78v142.38c-46.95-6.63-89.03-20.18-126.27-40.59-43.22-23.76-78.63-55.56-106.26-95.49-7.6-10.97-14.62-22.59-21.08-34.81-19.52-37.09-32.65-79-39.35-125.65h161.2c4.05,22.52,10.15,42.5,18.25,60.06,16.46,35.55,40.87,61.77,73.22,78.58,7.03,3.65,14.4,6.9,22.15,9.71,5.83,2.16,11.89,4.1,18.15,5.81Z"/>
    <rect x="482.05" y="196.36" width="325.96" height="160.48"/>
    <path d="M801.18,817.1h-161.33c-4.02-21.15-9.93-40.07-17.6-56.71-16.46-35.58-40.87-61.8-73.22-78.6-32.38-16.76-72.3-25.18-119.72-25.18h-81.21v-137.52h89.73c15.1,0,29.79.6,44.04,1.79,9.41.77,18.64,1.81,27.68,3.13,46.63,6.65,88.44,20.18,125.48,40.49,55.09,30.26,97.52,73.71,127.32,130.27,19.07,36.22,32,76.96,38.83,122.32Z"/>
    <rect x="327.03" y="656.61" width="21.08" height=".02"/>
    <rect x="187.65" y="656.64" width="160.46" height="160.46"/>
  </svg>`
}

/**
 * Create SVG icon as blob URL for canvas
 */
export function createSvgIcon(svg: string): Promise<string> {
  const blob = new Blob([svg], { type: "image/svg+xml" })
  return Promise.resolve(URL.createObjectURL(blob))
}

/**
 * Backward compatibility helper
 */
export function darkenHex(hex: string, percent: number): string {
  const normalized = hex.replace("#", "")
  if (normalized.length !== 6) return hex
  const num = parseInt(normalized, 16)
  if (isNaN(num)) return hex
  const amount = Math.round(2.55 * percent)
  const r = Math.max(0, (num >> 16) - amount)
  const g = Math.max(0, ((num >> 8) & 0x00ff) - amount)
  const b = Math.max(0, (num & 0x0000ff) - amount)
  return `#${(0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}
