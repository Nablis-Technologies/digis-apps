"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Search01Icon } from "@hugeicons/core-free-icons"
import { CreateEventDialog } from "../../../components/events/create-event-dialog"
import { sampleEvents } from "@/lib/sample-data"
import { EventCard } from "../../../components/events/event-card"
import { EventListItem } from "../../../components/events/event-list-item"
import { ViewToggle, type ViewMode } from "../../../components/events/view-toggle"
import { EmptyState } from "../../../components/events/empty-state"

export default function EventsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  // Filter events based on search and status
  const filteredEvents = sampleEvents.filter((event) => {
    const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || event.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const hasFilters = searchQuery !== "" || statusFilter !== "all"

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground">
            Create and manage your events
          </p>
        </div>
        <Button size="lg" className="gap-2" onClick={() => setCreateDialogOpen(true)}>
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-5" />
          Create Event
        </Button>
        <CreateEventDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <HugeiconsIcon
            icon={Search01Icon}
            strokeWidth={2}
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Published">Published</SelectItem>
            <SelectItem value="Live">Live</SelectItem>
          </SelectContent>
        </Select>

        <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
      </div>

      {/* Events Display */}
      {filteredEvents.length === 0 ? (
        <EmptyState hasFilters={hasFilters} />
      ) : viewMode === "grid" ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event, index) => (
            <EventCard key={event.id} event={event} index={index} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((event, index) => (
            <EventListItem key={event.id} event={event} index={index} />
          ))}
        </div>
      )}
    </div>
  )
}
