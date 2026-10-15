"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Location01Icon,
  Building02Icon,
  Search01Icon,
  Tick02Icon,
  Cancel01Icon,
  ArrowDown01Icon,
  UserGroupIcon,
  AlertCircleIcon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import type { Venue } from "@workspace/store/reducers/venuesApi"

export interface VenueComboboxProps {
  venues?: Venue[]
  value?: string
  onChange: (venueId: string, venue?: Venue) => void
  onSelectVenue?: (venue: Venue) => void
  isLoading?: boolean
  placeholder?: string
  error?: string
  disabled?: boolean
  className?: string
  id?: string
  autoFocus?: boolean
  showSummaryCard?: boolean
}

export function VenueCombobox({
  venues = [],
  value = "",
  onChange,
  onSelectVenue,
  isLoading = false,
  placeholder = "Search venue by name, city, or address...",
  error,
  disabled = false,
  className,
  id = "venue-search-input",
  autoFocus = false,
  showSummaryCard = true,
}: VenueComboboxProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)

  const selectedVenue = React.useMemo(() => {
    if (!value) return undefined
    return venues.find((v) => v.id === value)
  }, [venues, value])

  const [isOpen, setIsOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState(selectedVenue?.name ?? "")
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1)
  const [isFocused, setIsFocused] = React.useState(false)

  // Sync searchQuery when value / selectedVenue changes from outside
  React.useEffect(() => {
    if (!isFocused) {
      setSearchQuery(selectedVenue?.name ?? "")
    }
  }, [selectedVenue, isFocused])

  // Filter venues based on search text
  const filteredVenues = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q || (selectedVenue && q === selectedVenue.name.toLowerCase().trim())) {
      return venues
    }
    return venues.filter((v) => {
      const name = (v.name || "").toLowerCase()
      const city = (v.city || "").toLowerCase()
      const address = (v.address || "").toLowerCase()
      const country = (v.country || "").toLowerCase()
      const desc = (v.description || "").toLowerCase()
      return (
        name.includes(q) ||
        city.includes(q) ||
        address.includes(q) ||
        country.includes(q) ||
        desc.includes(q)
      )
    })
  }, [venues, searchQuery, selectedVenue])

  // Scroll highlighted item into view
  React.useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll<HTMLDivElement>("[data-combobox-item]")
      const target = items[highlightedIndex]
      if (target) {
        target.scrollIntoView({ block: "nearest", behavior: "smooth" })
      }
    }
  }, [highlightedIndex])

  // Click outside listener
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setIsFocused(false)
        // Reset query text to selected venue name if closed without selecting
        if (selectedVenue) {
          setSearchQuery(selectedVenue.name)
        } else {
          setSearchQuery("")
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [selectedVenue])

  const handleSelect = (venue: Venue) => {
    onChange(venue.id, venue)
    onSelectVenue?.(venue)
    setSearchQuery(venue.name)
    setIsOpen(false)
    setHighlightedIndex(-1)
  }

  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    onChange("", undefined)
    setSearchQuery("")
    setHighlightedIndex(-1)
    setIsOpen(true)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
        setHighlightedIndex(0)
      } else {
        setHighlightedIndex((prev) =>
          prev < filteredVenues.length - 1 ? prev + 1 : 0
        )
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
        setHighlightedIndex(filteredVenues.length - 1)
      } else {
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredVenues.length - 1
        )
      }
    } else if (e.key === "Enter") {
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < filteredVenues.length) {
        e.preventDefault()
        const selected = filteredVenues[highlightedIndex]
        if (selected) {
          handleSelect(selected)
        }
      } else if (isOpen && filteredVenues.length === 1 && searchQuery.trim().length > 0) {
        e.preventDefault()
        const onlyOption = filteredVenues[0]
        if (onlyOption) {
          handleSelect(onlyOption)
        }
      }
    } else if (e.key === "Escape") {
      e.preventDefault()
      setIsOpen(false)
      if (selectedVenue) {
        setSearchQuery(selectedVenue.name)
      }
    }
  }

  return (
    <div ref={containerRef} className={cn("relative w-full space-y-2", className)}>
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        {/* Leading Location Icon */}
        <div className="absolute left-3.5 flex items-center justify-center text-muted-foreground pointer-events-none">
          <HugeiconsIcon
            icon={Location01Icon}
            strokeWidth={2}
            className={cn("size-4 transition-colors", isOpen && "text-primary")}
          />
        </div>

        {/* The Text Input */}
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls={`${id}-suggestions`}
          autoComplete="off"
          disabled={disabled}
          autoFocus={autoFocus}
          placeholder={placeholder}
          value={searchQuery}
          onFocus={() => {
            setIsFocused(true)
            setIsOpen(true)
            setHighlightedIndex(-1)
          }}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            if (!isOpen) setIsOpen(true)
            setHighlightedIndex(0)
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            "h-11 w-full rounded-xl border bg-background px-3.5 pl-10 pr-20 text-sm transition-all",
            "placeholder:text-muted-foreground/70",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary",
            error
              ? "border-destructive focus-visible:ring-destructive/30 focus-visible:border-destructive"
              : "border-input/80 hover:border-input",
            disabled && "cursor-not-allowed opacity-60 bg-muted/40"
          )}
        />

        {/* Trailing Controls: Clear & Chevron */}
        <div className="absolute right-2.5 flex items-center gap-1">
          {searchQuery && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear venue input"
              className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-3.5" />
            </button>
          )}

          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onClick={() => {
              if (isOpen) {
                setIsOpen(false)
              } else {
                setIsOpen(true)
                inputRef.current?.focus()
              }
            }}
            className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              strokeWidth={2}
              className={cn("size-3.5 transition-transform duration-200", isOpen && "rotate-180")}
            />
          </button>
        </div>
      </div>

      {/* Suggestion Dropdown Under Input */}
      {isOpen && (
        <div
          id={`${id}-suggestions`}
          role="listbox"
          ref={listRef}
          className={cn(
            "absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl border border-border/80 bg-popover/95 backdrop-blur-md shadow-2xl overflow-hidden",
            "animate-in fade-in-0 zoom-in-95 duration-150"
          )}
        >
          {/* Header count / instructions */}
          <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30 text-[11px] text-muted-foreground">
            <span className="font-semibold uppercase tracking-wider">
              {filteredVenues.length === 1
                ? "1 Venue Found"
                : `${filteredVenues.length} Venues Found`}
            </span>
            <span className="text-[10px]">Use ↑↓ to navigate, Enter to pick</span>
          </div>

          {/* List items */}
          <div className="max-h-72 overflow-y-auto p-1.5 space-y-1">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                <div className="size-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <span>Loading available venues...</span>
              </div>
            ) : filteredVenues.length === 0 ? (
              <div className="py-7 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-1.5 px-4">
                <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-5 text-muted-foreground/60" />
                <p className="font-semibold text-foreground">
                  No venues found matching &quot;{searchQuery}&quot;
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Check your spelling or search by city name (e.g. &quot;Addis Ababa&quot;)
                </p>
              </div>
            ) : (
              filteredVenues.map((v, index) => {
                const isSelected = v.id === value
                const isHighlighted = index === highlightedIndex

                return (
                  <div
                    key={v.id}
                    data-combobox-item
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(v)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={cn(
                      "flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left cursor-pointer transition-all",
                      isHighlighted
                        ? "bg-primary/10 text-foreground ring-1 ring-primary/20"
                        : "hover:bg-muted text-foreground",
                      isSelected && "bg-primary/15 font-medium"
                    )}
                  >
                    {/* Venue Icon & Details */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={cn(
                          "size-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted text-muted-foreground border-border/50"
                        )}
                      >
                        <HugeiconsIcon icon={Building02Icon} strokeWidth={2} className="size-4" />
                      </div>

                      <div className="grid flex-1 min-w-0 leading-tight">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm truncate text-foreground">
                            {v.name}
                          </span>
                          {v.verified && (
                            <Badge
                              variant="outline"
                              className="h-4 px-1 text-[9px] font-semibold border-emerald-500/35 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 gap-0.5 shrink-0"
                            >
                              <HugeiconsIcon
                                icon={CheckmarkCircle01Icon}
                                strokeWidth={2.5}
                                className="size-2 text-emerald-600 dark:text-emerald-400"
                              />
                              Verified
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground truncate">
                          <span className="truncate">
                            {v.city ? `${v.city}, ` : ""}
                            {v.country || "Ethiopia"}
                            {v.address ? ` • ${v.address}` : ""}
                          </span>

                          {v.capacity ? (
                            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground/80 shrink-0 bg-muted/50 px-1.5 py-0.2 rounded">
                              <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className="size-2.5" />
                              {v.capacity.toLocaleString()} cap
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Right Checkmark */}
                    {isSelected && (
                      <div className="flex items-center justify-center size-5 rounded-full bg-primary/20 text-primary shrink-0 ml-1">
                        <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.5} className="size-3.5" />
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Selected Venue Summary Card (Tactile confirmation below input) */}
      {showSummaryCard && selectedVenue && (
        <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 text-xs transition-all">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="size-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <HugeiconsIcon
                icon={Location01Icon}
                strokeWidth={2}
                className="size-4 text-emerald-600 dark:text-emerald-400"
              />
            </div>
            <div className="grid flex-1 min-w-0">
              <div className="flex items-center gap-1.5 font-semibold text-foreground truncate">
                <span>{selectedVenue.name}</span>
                {selectedVenue.verified && (
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    ✓ Verified Venue
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                {selectedVenue.address ? `${selectedVenue.address}, ` : ""}
                {selectedVenue.city}, {selectedVenue.country}
                {selectedVenue.capacity
                  ? ` • Default max capacity: ${selectedVenue.capacity.toLocaleString()}`
                  : ""}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={handleClear}
            className="text-muted-foreground hover:text-destructive shrink-0 h-7 px-2.5 text-xs"
          >
            Change
          </Button>
        </div>
      )}

      {/* Field Error Message */}
      {error && (
        <p className="text-destructive text-xs mt-1.5 flex items-center gap-1 font-medium">
          <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}
