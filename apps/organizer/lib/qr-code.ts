import QRCode from "qrcode"
import { getDigisLogoSvg, createSvgIcon, loadImage } from "./canvas-utils"

export interface QRCodeOptions {
  width?: number
  darkColor?: string
  lightColor?: string
  includeLogo?: boolean
  logoColor?: string
}

/**
 * Generate a high-resolution, branded QR code with optional embedded Digis logo
 */
export async function generateQRCode(
  data: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const {
    width = 800,
    darkColor = "#090d0b",
    lightColor = "#ffffff",
    includeLogo = true,
    logoColor = "#10b981",
  } = options

  try {
    // 1. Render base QR code onto offscreen canvas with Error Correction H
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = width

    await QRCode.toCanvas(canvas, data, {
      width,
      margin: 2,
      errorCorrectionLevel: "H", // 30% error correction allows seamless center logo
      color: {
        dark: darkColor,
        light: lightColor,
      },
    })

    const ctx = canvas.getContext("2d")
    if (!ctx || !includeLogo) {
      return canvas.toDataURL("image/png")
    }

    // 2. Draw centered brand badge for Digis logo
    const logoSize = Math.round(width * 0.22)
    const badgePadding = Math.round(width * 0.025)
    const badgeSize = logoSize + badgePadding * 2
    const centerX = width / 2
    const centerY = width / 2

    // Circular background badge with subtle shadow
    ctx.save()
    ctx.shadowColor = "rgba(0, 0, 0, 0.15)"
    ctx.shadowBlur = Math.round(width * 0.015)
    ctx.shadowOffsetY = Math.round(width * 0.005)

    ctx.fillStyle = lightColor
    ctx.beginPath()
    ctx.arc(centerX, centerY, badgeSize / 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    // Circular stroke border
    ctx.save()
    ctx.strokeStyle = "rgba(16, 185, 129, 0.3)"
    ctx.lineWidth = Math.max(2, Math.round(width * 0.005))
    ctx.beginPath()
    ctx.arc(centerX, centerY, badgeSize / 2, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()

    // 3. Load and draw the official Digis logo SVG
    const logoSvg = getDigisLogoSvg(logoColor)
    const logoBlobUrl = await createSvgIcon(logoSvg)
    const logoImg = await loadImage(logoBlobUrl)
    URL.revokeObjectURL(logoBlobUrl)

    const drawX = centerX - logoSize / 2
    const drawY = centerY - logoSize / 2
    ctx.drawImage(logoImg, drawX, drawY, logoSize, logoSize)

    return canvas.toDataURL("image/png")
  } catch (error) {
    console.error("Branded QR Code generation failed:", error)
    // Fallback to basic QR code
    return await QRCode.toDataURL(data, {
      width,
      margin: 2,
      errorCorrectionLevel: "M",
    })
  }
}

/**
 * Generate vector SVG QR code string for print and large signage with optional centered Digis logo
 */
export async function generateQRCodeSvg(
  data: string,
  options: {
    darkColor?: string
    lightColor?: string
    includeLogo?: boolean
    logoColor?: string
  } = {}
): Promise<string> {
  const {
    darkColor = "#000000",
    lightColor = "#ffffff",
    includeLogo = true,
    logoColor = "#10b981",
  } = options

  const svgString = await QRCode.toString(data, {
    type: "svg",
    margin: 2,
    errorCorrectionLevel: "H",
    color: {
      dark: darkColor,
      light: lightColor,
    },
  })

  if (!includeLogo) {
    return svgString
  }

  // Parse viewBox to find module width/height
  const viewBoxMatch = svgString.match(/viewBox="0 0 (\d+(\.\d+)?) (\d+(\.\d+)?)"/)
  if (!viewBoxMatch || !viewBoxMatch[1] || !viewBoxMatch[3]) return svgString

  const width = parseFloat(viewBoxMatch[1])
  const height = parseFloat(viewBoxMatch[3])
  const centerX = width / 2
  const centerY = height / 2

  const logoSize = width * 0.2
  const badgeRadius = width * 0.13
  const strokeWidth = Math.max(0.3, width * 0.008)

  const logoX = centerX - logoSize / 2
  const logoY = centerY - logoSize / 2
  const scale = logoSize / 1000

  const badgeSvg = `
  <circle cx="${centerX}" cy="${centerY}" r="${badgeRadius}" fill="${lightColor}" stroke="rgba(16, 185, 129, 0.4)" stroke-width="${strokeWidth}" />
  <g transform="translate(${logoX}, ${logoY}) scale(${scale})" fill="${logoColor}">
    <path d="M481.88,355.78v142.38c-46.95-6.63-89.03-20.18-126.27-40.59-43.22-23.76-78.63-55.56-106.26-95.49-7.6-10.97-14.62-22.59-21.08-34.81-19.52-37.09-32.65-79-39.35-125.65h161.2c4.05,22.52,10.15,42.5,18.25,60.06,16.46,35.55,40.87,61.77,73.22,78.58,7.03,3.65,14.4,6.9,22.15,9.71,5.83,2.16,11.89,4.1,18.15,5.81Z"/>
    <rect x="482.05" y="196.36" width="325.96" height="160.48"/>
    <path d="M801.18,817.1h-161.33c-4.02-21.15-9.93-40.07-17.6-56.71-16.46-35.58-40.87-61.8-73.22-78.6-32.38-16.76-72.3-25.18-119.72-25.18h-81.21v-137.52h89.73c15.1,0,29.79.6,44.04,1.79,9.41.77,18.64,1.81,27.68,3.13,46.63,6.65,88.44,20.18,125.48,40.49,55.09,30.26,97.52,73.71,127.32,130.27,19.07,36.22,32,76.96,38.83,122.32Z"/>
    <rect x="327.03" y="656.61" width="21.08" height=".02"/>
    <rect x="187.65" y="656.64" width="160.46" height="160.46"/>
  </g>
</svg>`

  return svgString.replace(/<\/svg>\s*$/, badgeSvg)
}

