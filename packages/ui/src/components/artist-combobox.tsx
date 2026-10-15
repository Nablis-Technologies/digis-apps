"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  Tick02Icon,
  Cancel01Icon,
  ArrowDown01Icon,
  UserGroupIcon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@workspace/ui/lib/utils"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import type { Artist } from "@workspace/store/reducers/artistsApi"

export interface ArtistComboboxProps {
  artists?: Artist[]
  value?: string
  artistId?: string
  onChange: (name: string, artist?: Artist) => void
  onDirectAdd?: (artist: { name: string; artistId?: string; description?: string }) => void
  isLoading?: boolean
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
  autoFocus?: boolean
  allowCustom?: boolean
}

export function ArtistCombobox({
  artists = [],
  value = "",
  artistId = "",
  onChange,
  onDirectAdd,
  isLoading = false,
  placeholder = "Search artist directory or type performer name...",
  disabled = false,
  className,
  id = "artist-search-input",
  autoFocus = false,
  allowCustom = true,
}: ArtistComboboxProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)

  const selectedArtist = React.useMemo(() => {
    if (artistId) return artists.find((a) => a.id === artistId)
    if (value) return artists.find((a) => a.name.toLowerCase() === value.toLowerCase().trim())
    return undefined
  }, [artists, artistId, value])

  const [isOpen, setIsOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState(value)
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1)
  const [isFocused, setIsFocused] = React.useState(false)

  // Sync searchQuery when value changes from outside
  React.useEffect(() => {
    if (!isFocused) {
      setSearchQuery(value)
    }
  }, [value, isFocused])

  // Filter artists based on search text
  const filteredArtists = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) {
      return artists.slice(0, 30)
    }
    return artists.filter((a) => {
      const name = (a.name || "").toLowerCase()
      const desc = (a.description || "").toLowerCase()
      const genres = (a.genres || []).map((g) => g.toLowerCase()).join(" ")
      return name.includes(q) || desc.includes(q) || genres.includes(q)
    })
  }, [artists, searchQuery])

  const trimmedQuery = searchQuery.trim()
  const isExactMatch = React.useMemo(() => {
    if (!trimmedQuery) return false
    return artists.some((a) => a.name.toLowerCase() === trimmedQuery.toLowerCase())
  }, [artists, trimmedQuery])

  const showCustomOption = allowCustom && trimmedQuery.length > 0 && !isExactMatch

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
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleSelectArtist = (artist: Artist) => {
    onChange(artist.name, artist)
    setSearchQuery(artist.name)
    setIsOpen(false)
    setHighlightedIndex(-1)
  }

  const handleSelectCustom = () => {
    if (!trimmedQuery) return
    onChange(trimmedQuery, undefined)
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

    const totalCount = filteredArtists.length + (showCustomOption ? 1 : 0)

    if (e.key === "ArrowDown") {
      e.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
        setHighlightedIndex(0)
      } else {
        setHighlightedIndex((prev) => (prev < totalCount - 1 ? prev + 1 : 0))
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
        setHighlightedIndex(totalCount - 1)
      } else {
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : totalCount - 1))
      }
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (isOpen && highlightedIndex >= 0) {
        if (showCustomOption && highlightedIndex === 0) {
          handleSelectCustom()
        } else {
          const artistIdx = showCustomOption ? highlightedIndex - 1 : highlightedIndex
          const item = filteredArtists[artistIdx]
          if (item) handleSelectArtist(item)
        }
      } else if (showCustomOption) {
        handleSelectCustom()
      } else if (filteredArtists.length > 0 && isOpen) {
        handleSelectArtist(filteredArtists[0])
      } else if (trimmedQuery) {
        onChange(trimmedQuery, undefined)
        setIsOpen(false)
      }
    } else if (e.key === "Escape") {
      setIsOpen(false)
      setHighlightedIndex(-1)
    }
  }

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Search Input Bar */}
      <div
        className={cn(
          "relative flex items-center rounded-xl border bg-background text-sm transition-all shadow-2xs",
          isFocused
            ? "border-primary ring-2 ring-primary/20"
            : "border-border/70 hover:border-border",
          disabled && "opacity-50 pointer-events-none bg-muted/40"
        )}
      >
        <div className="absolute left-3 flex items-center pointer-events-none text-muted-foreground">
          <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="size-4" />
        </div>

        <input
          ref={inputRef}
          id={id}
          type="text"
          value={searchQuery}
          disabled={disabled}
          autoFocus={autoFocus}
          placeholder={placeholder}
          autoComplete="off"
          onChange={(e) => {
            const val = e.target.value
            setSearchQuery(val)
            onChange(val, undefined)
            setIsOpen(true)
            setHighlightedIndex(-1)
          }}
          onFocus={() => {
            setIsFocused(true)
            setIsOpen(true)
          }}
          onKeyDown={handleKeyDown}
          className="w-full h-9 pl-9 pr-20 text-xs bg-transparent focus:outline-hidden placeholder:text-muted-foreground/70"
        />

        <div className="absolute right-2 flex items-center gap-1">
          {searchQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Clear input"
            >
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setIsOpen((prev) => !prev)
              inputRef.current?.focus()
            }}
            className="p-1 text-muted-foreground hover:text-foreground transition-transform"
            tabIndex={-1}
          >
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              strokeWidth={2}
              className={cn("size-3.5 transition-transform duration-200", isOpen && "rotate-180")}
            />
          </button>
        </div>
      </div>

      {/* Dropdown Suggestions */}
      {isOpen && (
        <div
          ref={listRef}
          className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border border-border/80 bg-popover/95 backdrop-blur-md shadow-lg overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
        >
          {/* Header indicator */}
          <div className="px-3 py-1.5 border-b border-border/40 bg-muted/30 flex items-center justify-between text-[10px] text-muted-foreground font-medium">
            <span>
              {filteredArtists.length > 0
                ? `${filteredArtists.length} Directory Artist${filteredArtists.length !== 1 ? "s" : ""}`
                : "Artist Directory"}
            </span>
            <span className="text-[10px] text-muted-foreground/70">
              Select or press Enter to add
            </span>
          </div>

          <div className="max-h-64 overflow-y-auto p-1.5 space-y-1">
            {/* Custom Performer Creation Item */}
            {showCustomOption && (
              <div
                data-combobox-item
                onClick={handleSelectCustom}
                onMouseEnter={() => setHighlightedIndex(0)}
                className={cn(
                  "flex items-center justify-between gap-2.5 p-2 rounded-lg cursor-pointer transition-colors text-xs border border-dashed border-primary/40 bg-primary/5",
                  highlightedIndex === 0
                    ? "bg-primary/15 text-primary border-primary"
                    : "hover:bg-primary/10 text-foreground"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="size-7 rounded-md bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">
                    +
                  </div>
                  <div className="truncate">
                    <div className="font-semibold truncate">
                      Add &ldquo;<span className="text-primary">{trimmedQuery}</span>&rdquo;
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Custom performer not currently in directory
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                  Enter ↵
                </Badge>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="p-4 text-center text-xs text-muted-foreground">
                Loading artists...
              </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredArtists.length === 0 && !showCustomOption && (
              <div className="p-4 text-center text-xs text-muted-foreground">
                <p>No matching artists found in directory</p>
                <p className="text-[11px] mt-0.5 text-muted-foreground/70">
                  Type a performer name to add them as custom
                </p>
              </div>
            )}

            {/* Directory Artists */}
            {filteredArtists.map((artist, idx) => {
              const actualIdx = showCustomOption ? idx + 1 : idx
              const isSelected = selectedArtist?.id === artist.id
              const isHighlighted = highlightedIndex === actualIdx

              return (
                <div
                  key={artist.id}
                  data-combobox-item
                  onClick={() => handleSelectArtist(artist)}
                  onMouseEnter={() => setHighlightedIndex(actualIdx)}
                  className={cn(
                    "flex items-center justify-between gap-2.5 p-2 rounded-lg cursor-pointer transition-colors text-xs",
                    isSelected && "bg-primary/10 text-primary font-semibold",
                    isHighlighted && !isSelected && "bg-muted text-foreground",
                    !isHighlighted && !isSelected && "hover:bg-muted/60 text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Avatar / Monogram */}
                    {artist.profile_url ? (
                      <img
                        src={artist.profile_url}
                        alt={artist.name}
                        className="size-7 rounded-md object-cover shrink-0 border border-border/60"
                      />
                    ) : (
                      <div className="size-7 rounded-md bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 shadow-2xs">
                        {artist.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0 truncate">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-semibold truncate">{artist.name}</span>
                        {artist.verified && (
                          <span title="Verified Artist" className="inline-flex shrink-0">
                            <HugeiconsIcon
                              icon={CheckmarkCircle01Icon}
                              strokeWidth={2}
                              className="size-3 text-sky-500"
                            />
                          </span>
                        )}
                      </div>
                      {artist.genres && artist.genres.length > 0 && (
                        <div className="text-[10px] text-muted-foreground truncate">
                          {artist.genres.slice(0, 3).join(", ")}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {artist.genres && artist.genres.length > 0 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground font-mono uppercase hidden sm:inline-block">
                        {artist.genres[0]}
                      </span>
                    )}
                    {isSelected && (
                      <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.5} className="size-3.5 text-primary" />
                    )}
                    {onDirectAdd && (
                      <Button
                        type="button"
                        size="xs"
                        variant="secondary"
                        className="h-6 px-2 text-[10px] font-medium"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDirectAdd({
                            name: artist.name,
                            artistId: artist.id,
                            description: artist.genres?.join(", ") || "",
                          })
                          setIsOpen(false)
                        }}
                      >
                        + Add
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
