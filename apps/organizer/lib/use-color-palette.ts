"use client"

import { useEffect, useState, useRef } from "react"
import { Vibrant } from "node-vibrant/browser"

export type PaletteKey = "vibrant" | "darkVibrant" | "muted" | "brand"

export interface ColorPalette {
  vibrant: string
  darkVibrant: string
  muted: string
  brand: string
}

// Define the palette type based on node-vibrant's API
type VibrantPalette = {
  Vibrant?: { hex: string } | null
  DarkVibrant?: { hex: string } | null
  Muted?: { hex: string } | null
  LightVibrant?: { hex: string } | null
  DarkMuted?: { hex: string } | null
  LightMuted?: { hex: string } | null
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
    let active = true
    
    // ✅ Increment extraction ID for this run
    const extractionId = ++extractionIdRef.current
    
    // ✅ Update current image reference
    currentImageRef.current = imageUrl
    
    setLoading(true)
    setPalette(getDefaultPalette()) // Reset palette on URL change
    
    console.log(`🎨 [${extractionId}] Starting extraction for:`, imageUrl)

    // ✅ Use the REAL node-vibrant with sophisticated color theory
    Vibrant.from(imageUrl)
      .maxColorCount(128) // Higher = more accurate
      .quality(5) // Lower = better quality (1-10)
      .getPalette()
      .then((result: VibrantPalette) => {
        if (!active) {
          console.log(`⏭️ [${extractionId}] Component unmounted, skipping:`, imageUrl)
          return
        }
        
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
          Vibrant: result.Vibrant?.hex,
          DarkVibrant: result.DarkVibrant?.hex,
          LightVibrant: result.LightVibrant?.hex,
          Muted: result.Muted?.hex,
          DarkMuted: result.DarkMuted?.hex,
          LightMuted: result.LightMuted?.hex,
        })

        // ✅ node-vibrant returns Swatch objects with .hex property
        // Try multiple swatches in order of preference
        const vibrant =
          result.Vibrant?.hex ||
          result.LightVibrant?.hex ||
          result.DarkVibrant?.hex ||
          "#f97316"

        const darkVibrant =
          result.DarkVibrant?.hex ||
          darkenHex(vibrant, 35)

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

        console.log(`✅ [${extractionId}] Setting palette for`, imageUrl, ":", finalPalette)
        setPalette(finalPalette)
        setLoading(false)
      })
      .catch((error) => {
        if (!active) return
        
        // Only handle error if this is still the current extraction
        if (extractionId !== extractionIdRef.current) {
          console.log(`⏭️ [${extractionId}] Skipping error (newer extraction started):`, imageUrl)
          return
        }
        
        console.error(`❌ [${extractionId}] Extraction failed for`, imageUrl, ":", error)
        
        // Fallback if extraction fails
        setPalette(getDefaultPalette())
        setLoading(false)
      })

    // Cleanup: Mark this extraction as stale if component unmounts or imageUrl changes
    return () => {
      active = false
      if (extractionId === extractionIdRef.current) {
        console.log(`🧹 [${extractionId}] Cleanup for:`, imageUrl)
      }
    }
  }, [imageUrl]) // Re-run when imageUrl changes

  return { palette, loading }
}
