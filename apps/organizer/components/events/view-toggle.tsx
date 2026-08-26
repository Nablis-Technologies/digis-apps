"use client"

import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { GridIcon, ListViewIcon } from "@hugeicons/core-free-icons"

export type ViewMode = "grid" | "list"

interface ViewToggleProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
}

export function ViewToggle({ viewMode, onViewModeChange }: ViewToggleProps) {
  return (
    <div className="flex gap-2">
      <Button
        variant={viewMode === "grid" ? "default" : "outline"}
        size="icon"
        onClick={() => onViewModeChange("grid")}
        aria-label="Grid view"
      >
        <HugeiconsIcon icon={GridIcon} strokeWidth={2} className="size-4" />
      </Button>
      <Button
        variant={viewMode === "list" ? "default" : "outline"}
        size="icon"
        onClick={() => onViewModeChange("list")}
        aria-label="List view"
      >
        <HugeiconsIcon icon={ListViewIcon} strokeWidth={2} className="size-4" />
      </Button>
    </div>
  )
}
