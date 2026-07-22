"use client"

import { useEffect, useRef, useState } from "react"
import { useInView } from "framer-motion"

interface AnimatedCounterProps {
  value: number | string
  duration?: number
  className?: string
}

export function AnimatedCounter({
  value,
  duration = 2000,
  className = "",
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.5 })

  // Parse numeric value from string (e.g., "645.2K ETB" -> 645200)
  const numericValue =
    typeof value === "number"
      ? value
      : parseFloat(value.toString().replace(/[^0-9.]/g, "")) || 0

  const isLargeNumber = value.toString().includes("K")
  const suffix = isLargeNumber ? "K" : ""
  const hasETB = value.toString().includes("ETB")
  const currency = hasETB ? " ETB" : ""

  useEffect(() => {
    if (!isInView) return

    let startTime: number | null = null
    const startValue = 0
    const endValue = isLargeNumber ? numericValue : numericValue

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const current = startValue + (endValue - startValue) * easeOutQuart

      setDisplayValue(current)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [isInView, numericValue, duration, isLargeNumber])

  const formattedValue = isLargeNumber
    ? displayValue.toFixed(1)
    : Math.round(displayValue).toLocaleString()

  return (
    <span ref={ref} className={className}>
      {formattedValue}
      {suffix}
      {currency}
    </span>
  )
}
