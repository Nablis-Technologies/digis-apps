"use client"

import { useEffect, useState, useRef } from "react"
import Vibrant from "node-vibrant"

export type PaletteKey = "vibrant" | "darkVibrant" | "muted" | "brand"

export interface ColorPalette {
  vibrant: string
  darkVibrant: string
  muted: string
  brand: string
}

const BRAND_COLOR = "#10b981" // Emerald brand color

// Default fallback (will be overwritten per image)
const getDefaultPalette = (): ColorPalette => ({
  vibrant: "#f97316", // Orange fallback
  darkVibrant: "#c2410c",
  muted: "#fb923c",
  brand: BRAND_COLOR,
})

// Helper to darken a color
function darkenHex(hex: string, percent: number): string {
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

export function useColorPalette(imageUrl: string) {
  const [palette, setPalette] = useState<ColorPalette>(getDefaultPalette)
  const [loading, setLoading] = useState(false)
  
  // ✅ Track which image we're currently showing colors for
  const currentImageRef = useRef<string>(imageUrl)
  
  // ✅ Track extraction ID to prevent race conditions
  const extractionIdRef = useRef<number>(0)

  useEffect(() => {
    // ✅ Increment extraction ID for this run
    const extractionId = ++extractionIdRef.current
    
    // ✅ Update current image reference
    currentImageRef.current = imageUrl
    
    setLoading(true)
    setPalette(getDefaultPalette()) // Reset palette on URL change

    // ✅ Add timestamp to prevent browser caching
    const urlWithCacheBuster = `${imageUrl}?v=${Date.now()}`
    
    console.log(`🎨 [${extractionId}] Starting extraction for:`, imageUrl)

    Vibrant.from(urlWithCacheBuster)
      .maxColorCount(128)
      .quality(5)
      .getPalette()
      .then((result) => {
        // ✅ CRITICAL: Check if this is still the current extraction
        if (extractionId !== extractionIdRef.current) {
          console.log(`⏭️ [${extractionId}] Skipping extraction (newer extraction started):`, imageUrl)
          return
        }
        
        // ✅ CRITICAL: Check if user changed image while we were extracting
        if (currentImageRef.current !== imageUrl) {
          console.log(`⏭️ [${extractionId}] Skipping extraction (image changed):`, imageUrl)
          return
        }

        console.log(`✅ [${extractionId}] Extraction complete for:`, imageUrl, {
          vibrant: result.Vibrant?.hex,
          darkVibrant: result.DarkVibrant?.hex,
          lightVibrant: result.LightVibrant?.hex,
          muted: result.Muted?.hex,
          darkMuted: result.DarkMuted?.hex,
          lightMuted: result.LightMuted?.hex,
        })

        // Try multiple swatches in order of preference
        const vibrant =
          result.Vibrant?.hex ||
          result.LightVibrant?.hex ||
          result.DarkVibrant?.hex ||
          "#f97316"

        const darkVibrant =
          result.DarkVibrant?.hex ||
          (result.Vibrant?.hex ? darkenHex(result.Vibrant.hex, 35) : null) ||
          "#c2410c"

        const muted =
          result.Muted?.hex ||
          result.DarkMuted?.hex ||
          result.LightMuted?.hex ||
          darkenHex(vibrant, 15)

        const finalPalette = {
          vibrant,
          darkVibrant,
          muted,
          brand: BRAND_COLOR,
        }

        // Check if extraction actually worked (not all the same)
        const uniqueColors = new Set([
          finalPalette.vibrant,
          finalPalette.darkVibrant,
          finalPalette.muted,
        ])

        if (uniqueColors.size < 2) {
          console.warn(`⚠️ [${extractionId}] Not enough color variety for`, imageUrl, "using defaults")
          setPalette(getDefaultPalette())
        } else {
          console.log(`✅ [${extractionId}] Setting palette for`, imageUrl, ":", finalPalette)
          setPalette(finalPalette)
        }

        setLoading(false)
      })
      .catch((error) => {
        // Only handle error if this is still the current extraction
        if (extractionId !== extractionIdRef.current) {
          console.log(`⏭️ [${extractionId}] Skipping error (newer extraction started):`, imageUrl)
          return
        }
        
        console.error(`❌ [${extractionId}] Extraction failed for`, imageUrl, ":", error)
        setPalette(getDefaultPalette())
        setLoading(false)
      })

    // Cleanup: Mark this extraction as stale if component unmounts or imageUrl changes
    return () => {
      if (extractionId === extractionIdRef.current) {
        console.log(`🧹 [${extractionId}] Cleanup for:`, imageUrl)
      }
    }
  }, [imageUrl]) // Re-run when imageUrl changes

  return { palette, loading }
}
