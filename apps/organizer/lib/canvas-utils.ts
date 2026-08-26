/**
 * Canvas utility functions for share card generation
 */

/**
 * Load an image with CORS support
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
  fillStyle: string
) {
  ctx.save()
  ctx.fillStyle = fillStyle
  drawRoundedRect(ctx, x, y, width, height, radius)
  ctx.fill()
  ctx.restore()
}

/**
 * Draw text with automatic word wrapping
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
  const words = text.split(" ")
  const lines: string[] = []
  let currentLine = ""

  // Build lines
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

  // Handle max lines with ellipsis
  if (maxLines && lines.length > maxLines) {
    const trimmed = lines.slice(0, maxLines)
    let lastLine = trimmed[maxLines - 1]
    while (ctx.measureText(`${lastLine}...`).width > maxWidth && lastLine) {
      lastLine = lastLine.slice(0, -1)
    }
    trimmed[maxLines - 1] = `${lastLine.trim()}...`
    trimmed.forEach((line, index) => {
      ctx.fillText(line, x, y + index * lineHeight)
    })
    return y + trimmed.length * lineHeight
  }

  // Draw all lines
  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight)
  })
  return y + lines.length * lineHeight
}

/**
 * Darken a hex color by percentage
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

/**
 * Create SVG icon as blob URL for canvas
 */
export function createSvgIcon(svg: string): Promise<string> {
  const blob = new Blob([svg], { type: "image/svg+xml" })
  return Promise.resolve(URL.createObjectURL(blob))
}
