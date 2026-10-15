"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  UnfoldMoreIcon,
  Tick02Icon,
  Cancel01Icon,
  SearchIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"

export interface SearchableSelectOption {
  value: string
  label: string
  description?: string
  badge?: string
}

export interface SearchableSelectProps {
  options: SearchableSelectOption[]
  value?: string | string[]
  onChange?: (value: any) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  multiple?: boolean
  loading?: boolean
  clearable?: boolean
  className?: string
  triggerClassName?: string
}

export function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  disabled = false,
  multiple = false,
  loading = false,
  clearable = true,
  className,
  triggerClassName,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const selectedValues = React.useMemo(() => {
    if (multiple) {
      if (Array.isArray(value)) return value
      if (typeof value === "string" && value) return [value]
      return []
    }
    return typeof value === "string" && value ? [value] : []
  }, [value, multiple])

  const filteredOptions = React.useMemo(() => {
    if (!search.trim()) return options
    const query = search.toLowerCase()
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(query) ||
        opt.value.toLowerCase().includes(query) ||
        opt.description?.toLowerCase().includes(query) ||
        opt.badge?.toLowerCase().includes(query)
    )
  }, [options, search])

  const handleSelect = (val: string) => {
    if (multiple) {
      const next = selectedValues.includes(val)
        ? selectedValues.filter((v) => v !== val)
        : [...selectedValues, val]
      onChange?.(next)
    } else {
      onChange?.(val === value ? "" : val)
      setOpen(false)
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (multiple) {
      onChange?.([])
    } else {
      onChange?.("")
    }
  }

  const selectedLabels = React.useMemo(() => {
    return selectedValues
      .map((val) => options.find((opt) => opt.value === val)?.label ?? val)
      .filter(Boolean)
  }, [selectedValues, options])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal text-left h-auto min-h-9 px-3 py-1.5",
            !selectedValues.length && "text-muted-foreground",
            triggerClassName,
            className
          )}
        >
          <div className="flex flex-wrap items-center gap-1 overflow-hidden flex-1 mr-1">
            {selectedValues.length === 0 && (
              <span className="truncate">{placeholder}</span>
            )}

            {!multiple && selectedValues.length > 0 && (
              <span className="truncate text-foreground font-medium">
                {selectedLabels[0]}
              </span>
            )}

            {multiple &&
              selectedLabels.map((label, idx) => (
                <Badge
                  key={selectedValues[idx]}
                  variant="secondary"
                  className="text-xs px-1.5 py-0.5 max-w-[150px] truncate"
                >
                  <span className="truncate">{label}</span>
                </Badge>
              ))}
          </div>

          <div className="flex items-center gap-1 shrink-0 text-muted-foreground">
            {clearable && selectedValues.length > 0 && !disabled && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleClear(e as any)
                  }
                }}
                className="rounded-full p-0.5 hover:bg-muted cursor-pointer"
                title="Clear selection"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
              </span>
            )}
            <HugeiconsIcon icon={UnfoldMoreIcon} className="size-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-[240px] p-0 shadow-lg"
        align="start"
      >
        <div className="flex items-center border-b px-3 py-2">
          <HugeiconsIcon icon={SearchIcon} className="size-4 text-muted-foreground mr-2 shrink-0" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            autoFocus
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="text-muted-foreground hover:text-foreground text-xs ml-1"
            >
              Clear
            </button>
          )}
        </div>

        <div className="max-h-60 overflow-y-auto p-1 text-sm">
          {loading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Loading options...
            </div>
          ) : filteredOptions.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            filteredOptions.map((opt) => {
              const isSelected = selectedValues.includes(opt.value)
              return (
                <div
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className={cn(
                    "flex items-center justify-between px-2.5 py-2 rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors",
                    isSelected && "bg-accent/60 font-medium"
                  )}
                >
                  <div className="flex flex-col flex-1 min-w-0 mr-2">
                    <div className="flex items-center gap-2">
                      <span className="truncate">{opt.label}</span>
                      {opt.badge && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                          {opt.badge}
                        </Badge>
                      )}
                    </div>
                    {opt.description && (
                      <span className="text-xs text-muted-foreground truncate">
                        {opt.description}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <HugeiconsIcon
                      icon={Tick02Icon}
                      className="size-4 text-primary shrink-0"
                    />
                  )}
                </div>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
