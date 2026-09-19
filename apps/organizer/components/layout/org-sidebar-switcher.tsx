"use client"

import * as React from "react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useActiveOrganization } from "../../providers/organization-provider"
import {
  useListOwnerOrganizationsQuery,
  type Organization,
} from "@workspace/store/reducers/organizationsApi"
import { CreateOrgDialog } from "../organizations/create-org-dialog"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Building02Icon,
  Search01Icon,
  Tick02Icon,
  Add01Icon,
  UnfoldMoreIcon,
  CheckmarkCircle01Icon,
  Loading01Icon,
} from "@hugeicons/core-free-icons"

export function OrgSidebarSwitcher() {
  const {
    activeOrg,
    activeOrgId,
    setActiveOrgId,
    organizations,
    recentOrgs,
    isLoading: isLoadingContext,
  } = useActiveOrganization()

  const [open, setOpen] = React.useState(false)
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")

  // 250ms debounce for search query
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim())
    }, 250)
    return () => clearTimeout(handler)
  }, [searchQuery])

  // Server-side search query when user types
  const { data: searchResultsData, isFetching: isSearching } =
    useListOwnerOrganizationsQuery(
      { search: debouncedSearch, per_page: 20 },
      { skip: !debouncedSearch }
    )

  const searchResults = searchResultsData?.data ?? []

  // Items to display: if searching, show searchResults; otherwise show initial list
  const displayOrgs = debouncedSearch ? searchResults : organizations

  const handleSelectOrg = (org: Organization) => {
    setActiveOrgId(org.id)
    setOpen(false)
    setSearchQuery("")
  }

  // Get 2-letter initials
  const getInitials = (name?: string | null) => {
    if (!name) return "ORG"
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("")
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-sidebar-ring cursor-pointer group"
          >
            {/* Org Avatar */}
            <div className="flex aspect-square size-9 items-center justify-center rounded-lg bg-lime-500/15 text-lime-700 dark:bg-lime-500/20 dark:text-lime-300 font-bold text-xs shrink-0 border border-lime-500/20 shadow-xs">
              {activeOrg ? (
                getInitials(activeOrg.name)
              ) : (
                <HugeiconsIcon icon={Building02Icon} strokeWidth={2} className="size-4" />
              )}
            </div>

            {/* Org Info */}
            <div className="grid flex-1 min-w-0 text-left leading-tight">
              <span className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                {isLoadingContext ? "Loading..." : activeOrg?.name || "Select Organization"}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {activeOrg?.verified ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-lime-600 dark:text-lime-400">
                    <HugeiconsIcon
                      icon={CheckmarkCircle01Icon}
                      strokeWidth={2}
                      className="size-3"
                    />
                    Verified
                  </span>
                ) : (
                  <span className="text-[11px] text-muted-foreground truncate">
                    {activeOrg?.organizer_type
                      ? `${activeOrg.organizer_type.charAt(0).toUpperCase() + activeOrg.organizer_type.slice(1)} • Draft`
                      : "Workspace"}
                  </span>
                )}
              </div>
            </div>

            {/* Switcher Indicator */}
            <div className="text-muted-foreground/70 group-hover:text-foreground shrink-0 pr-1">
              <HugeiconsIcon icon={UnfoldMoreIcon} strokeWidth={2} className="size-4" />
            </div>
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          sideOffset={8}
          className="w-80 p-0 shadow-xl border-border/70 rounded-2xl overflow-hidden"
        >
          {/* Search Header */}
          <div className="p-2.5 border-b bg-muted/20">
            <div className="relative">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="size-4" />
              </div>
              <Input
                placeholder="Search organizations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-xs bg-background/80 focus-visible:ring-1"
                autoFocus
              />
              {isSearching && (
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin">
                  <HugeiconsIcon icon={Loading01Icon} strokeWidth={2} className="size-3.5" />
                </div>
              )}
            </div>
          </div>

          {/* Organizations List */}
          <div className="max-h-64 overflow-y-auto p-1.5 space-y-1 divide-y divide-border/20">
            {/* Recent Orgs Section (only shown if not searching and has recents > 1) */}
            {!debouncedSearch && recentOrgs.length > 1 && (
              <div className="pb-1.5">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Recent
                </div>
                {recentOrgs.map((org) => {
                  const isActive = org.id === activeOrgId
                  return (
                    <button
                      key={`recent-${org.id}`}
                      type="button"
                      onClick={() => handleSelectOrg(org)}
                      className={`flex w-full items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted text-foreground"
                      }`}
                    >
                      <div className="flex aspect-square size-6 items-center justify-center rounded-md bg-lime-500/15 text-lime-700 dark:bg-lime-500/20 dark:text-lime-300 font-bold text-[10px] shrink-0">
                        {getInitials(org.name)}
                      </div>
                      <span className="truncate flex-1">{org.name}</span>
                      {isActive && (
                        <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="size-4 text-primary shrink-0" />
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Main / Filtered List */}
            <div className="pt-1">
              {!debouncedSearch && (
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  All Organizations ({organizations.length})
                </div>
              )}
              {debouncedSearch && (
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Search Results ({displayOrgs.length})
                </div>
              )}

              {displayOrgs.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  {debouncedSearch
                    ? `No organization matching "${debouncedSearch}"`
                    : "No organizations found"}
                </div>
              ) : (
                displayOrgs.map((org) => {
                  const isActive = org.id === activeOrgId
                  return (
                    <button
                      key={org.id}
                      type="button"
                      onClick={() => handleSelectOrg(org)}
                      className={`flex w-full items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-colors text-left cursor-pointer group ${
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted text-foreground"
                      }`}
                    >
                      <div className="flex aspect-square size-7 items-center justify-center rounded-md bg-lime-500/15 text-lime-700 dark:bg-lime-500/20 dark:text-lime-300 font-bold text-[10px] shrink-0 border border-lime-500/10">
                        {getInitials(org.name)}
                      </div>
                      <div className="grid flex-1 min-w-0">
                        <span className="truncate font-medium">{org.name}</span>
                        <span className="text-[10px] text-muted-foreground truncate">
                          {org.city ? `${org.city} • ` : ""}
                          {org.verified ? "Verified" : "Pending review"}
                        </span>
                      </div>
                      {org.verified && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-lime-500/30 text-lime-600 dark:text-lime-400 shrink-0">
                          PRO
                        </Badge>
                      )}
                      {isActive && (
                        <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="size-4 text-primary shrink-0 ml-1" />
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Footer Action: + Create New Organization */}
          <div className="p-1.5 border-t bg-muted/10">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setOpen(false)
                setCreateDialogOpen(true)
              }}
              className="w-full justify-start gap-2 h-9 text-xs font-medium text-foreground hover:bg-muted cursor-pointer"
            >
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4 text-lime-600 dark:text-lime-400" />
              Create New Organization
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Reusable Create Org Dialog */}
      <CreateOrgDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </>
  )
}
