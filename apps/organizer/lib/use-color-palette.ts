"use client"

import { useEffect, useState, useRef } from "react"
import {
  extractColorPalette,
  getProceduralPalette,
  type ExtractedPalette,
} from "./color-extractor"

export type PaletteKey = "vibrant" | "deepAtmosphere" | "secondary" | "brand" | "edgeColor"

export interface ColorPalette extends ExtractedPalette {
  darkVibrant: string // Backward compatibility alias for deepAtmosphere
  muted: string       // Backward compatibility alias for secondary
}

const getDefaultPalette = (seed: string = "event"): ColorPalette => {
  const p = getProceduralPalette(seed)
  return {
    ...p,
    darkVibrant: p.deepAtmosphere,
    muted: p.secondary,
  }
}

export function useColorPalette(imageUrl: string, eventSeed: string = "event") {
  const [palette, setPalette] = useState<ColorPalette>(() => getDefaultPalette(eventSeed))
  const [loading, setLoading] = useState(false)
  
  const currentImageRef = useRef<string>(imageUrl)
  const extractionIdRef = useRef<number>(0)

  useEffect(() => {
    if (!imageUrl) return

    let active = true
    const extractionId = ++extractionIdRef.current
    currentImageRef.current = imageUrl

    const runExtraction = async () => {
      try {
        const extracted = await extractColorPalette(imageUrl, eventSeed)
        if (!active || extractionId !== extractionIdRef.current) return

        setPalette({
          ...extracted,
          darkVibrant: extracted.deepAtmosphere,
          muted: extracted.secondary,
        })
      } catch {
        if (!active || extractionId !== extractionIdRef.current) return
        setPalette(getDefaultPalette(eventSeed))
      } finally {
        if (active && extractionId === extractionIdRef.current) {
          setLoading(false)
        }
      }
    }

    runExtraction()

    return () => {
      active = false
    }
  }, [imageUrl, eventSeed])

  return { palette, loading }
}
