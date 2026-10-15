"use client"

import * as React from "react"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import { toast } from "sonner"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge, RoleBadge, VerificationBadge } from "@/components/ui/badge"
import {
  useActiveOrganization,
  isOrgSuspendedOrRemoved,
  canEnterWorkspace,
} from "../../providers/organization-provider"
import { type Organization } from "@workspace/store/reducers/organizationsApi"
import { CreateOrgDialog } from "../organizations/create-org-dialog"
import { HugeiconsIcon } from "@hugeicons/react"
import { cn } from "@workspace/ui/lib/utils"
import {
  Building02Icon,
  Search01Icon,
  Tick02Icon,
  Add01Icon,
  ArrowDown01Icon,
  CheckmarkCircle01Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons"

function resolveImageUrl(path?: string | null): string | null {
  if (!path) return null
  if (path.startsWith("blob:") || path.startsWith("data:")) return path
  let url = path
  if (url.includes("://web:3000")) {
    url = url.replace("://web:3000", "://localhost:3000")
  }
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url
  }
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"
  return `${apiBase}${url.startsWith("/") ? "" : "/"}${url}`
}

function OrgAvatar({
  org,
  sizeClass = "size-9",
  textClass = "text-xs",
  className,
}: {
  org?: Organization | null
  sizeClass?: string
  textClass?: string
  className?: string
}) {
  const [hasError, setHasError] = React.useState(false)
  const isSuspended = isOrgSuspendedOrRemoved(org)
  const isArchived = org?.archived === true
  const resolvedUrl = React.useMemo(() => resolveImageUrl(org?.profile_url), [org?.profile_url])

  React.useEffect(() => {
    setHasError(false)
  }, [resolvedUrl])

  const initials = org?.name
    ? org.name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join("") || "ORG"
    : null

  return (
    <div
      className={cn(
        "flex aspect-square items-center justify-center rounded-lg font-bold shrink-0 border overflow-hidden select-none",
        sizeClass,
        textClass,
        isArchived
          ? "bg-muted text-muted-foreground border-border"
          : isSuspended
            ? "bg-destructive/15 text-destructive border-destructive/30"
            : "bg-primary/15 text-primary border-primary/20",
        className
      )}
    >
      {resolvedUrl && !hasError ? (
        <Image
          src={resolvedUrl}
          alt={org?.name || "Organization logo"}
          width={48}
          height={48}
          unoptimized
          onError={() => setHasError(true)}
          className="size-full object-cover"
        />
      ) : initials ? (
        initials
      ) : (
        <HugeiconsIcon icon={Building02Icon} strokeWidth={2} className="size-4" />
      )}
    </div>
  )
}

export function OrgSidebarSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
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

  // Filter within user's organizations (guarantees no cross-org pollution)
  const displayOrgs = React.useMemo(() => {
    if (!searchQuery.trim()) return organizations
    const q = searchQuery.toLowerCase().trim()
    return organizations.filter(
      (org) =>
        org.name.toLowerCase().includes(q) ||
        org.city?.toLowerCase().includes(q) ||
        org.category?.toLowerCase().includes(q)
    )
  }, [organizations, searchQuery])

  const handleSelectOrg = (org: Organization) => {
    if (org.archived) {
      toast.error(`Cannot enter ${org.name}`, {
        description: "This workspace has been archived and is inaccessible.",
      })
      return
    }

    const isSuspended =
      org.membership_status === "suspended" || org.status === "suspended"
    setActiveOrgId(org.id)
    setOpen(false)
    setSearchQuery("")

    // If currently on an event detail page, route back to the events list of the selected organization
    const isEventDetailsPage =
      pathname.startsWith("/organizer/events/") && pathname !== "/organizer/events/new"
    if (isEventDetailsPage) {
      router.push("/organizer/events")
    }

    if (isSuspended) {
      toast.warning(`Selected ${org.name} (Suspended)`, {
        description: "Your membership in this organization is suspended. Action permissions are restricted.",
      })
    }
  }

  const isActiveOrgSuspended = isOrgSuspendedOrRemoved(activeOrg)

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex w-full items-center gap-2.5 rounded-xl border border-border/70 bg-card/60 p-2 text-left shadow-2xs transition-all duration-200 outline-hidden hover:border-border hover:bg-muted/50 hover:shadow-xs focus-visible:ring-2 focus-visible:ring-sidebar-ring cursor-pointer group",
              open && "border-foreground/30 bg-muted/60 ring-1 ring-ring/30",
              isActiveOrgSuspended && "border-red-500/30 bg-red-500/5 hover:border-red-500/40"
            )}
          >
            {/* Org Avatar */}
            <OrgAvatar
              org={activeOrg}
              sizeClass="size-9"
              textClass="text-xs"
              className="shadow-xs"
            />

            {/* Org Info */}
            <div className="grid flex-1 min-w-0 text-left leading-tight">
              <span className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                {isLoadingContext ? "Loading..." : activeOrg?.name || "Select Organization"}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {activeOrg?.membership_role && !isActiveOrgSuspended && !activeOrg.archived && (
                  <RoleBadge role={activeOrg.membership_role} />
                )}
                {activeOrg?.archived ? (
                  <Badge
                    variant="outline"
                    className="h-4 px-1.5 text-[10px] font-semibold border-zinc-500/40 bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 gap-1 w-fit shadow-2xs"
                  >
                    Archived
                  </Badge>
                ) : isActiveOrgSuspended ? (
                  <Badge
                    variant="destructive"
                    className="h-4 px-1.5 text-[10px] font-semibold border-red-500/40 bg-red-500/15 text-red-600 dark:text-red-400 gap-1 w-fit shadow-2xs"
                  >
                    <HugeiconsIcon
                      icon={AlertCircleIcon}
                      strokeWidth={2.5}
                      className="size-2.5 text-red-600 dark:text-red-400"
                    />
                    Suspended
                  </Badge>
                ) : (
                  <VerificationBadge verified={Boolean(activeOrg?.verified)} />
                )}
              </div>
            </div>

            {/* Right-Side Dropdown Indicator */}
            <div
              className={cn(
                "flex size-6 items-center justify-center rounded-md border border-border/50 bg-background/50 text-muted-foreground transition-all duration-200 shrink-0",
                "group-hover:border-border group-hover:bg-muted group-hover:text-foreground",
                open && "rotate-180 border-foreground/30 bg-muted text-foreground shadow-2xs"
              )}
            >
              <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2.5} className="size-3.5" />
            </div>
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          sideOffset={6}
          className="w-(--radix-popover-trigger-width) min-w-[280px] p-0 shadow-xl border-border/70 rounded-2xl overflow-hidden"
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
            </div>
          </div>

          {/* Organizations List */}
          <div className="max-h-64 overflow-y-auto p-1.5 space-y-1 divide-y divide-border/20">
            {/* Recent Orgs Section */}
            {!searchQuery.trim() && recentOrgs.length > 1 && (
              <div className="pb-1.5 space-y-0.5">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Recent
                </div>
                {recentOrgs.map((org) => {
                  const isActive = org.id === activeOrgId
                  const isArchived = org.archived === true
                  const isSuspended =
                    org.membership_status === "suspended" || org.status === "suspended"
                  return (
                    <button
                      key={`recent-${org.id}`}
                      type="button"
                      onClick={() => handleSelectOrg(org)}
                      className={cn(
                        "flex w-full items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer",
                        isArchived
                          ? "opacity-60 bg-muted/30 hover:bg-muted/50 text-muted-foreground"
                          : isSuspended
                            ? "border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-foreground"
                            : isActive
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-muted text-foreground"
                      )}
                    >
                      <OrgAvatar
                        org={org}
                        sizeClass="size-6"
                        textClass="text-[10px]"
                      />
                      <span className="truncate flex-1 font-medium">
                        {org.name}
                      </span>
                      {isArchived ? (
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1.5 py-0 h-4 shrink-0 border border-zinc-500/40 text-zinc-600 dark:text-zinc-400 bg-zinc-500/10 shadow-2xs"
                        >
                          Archived
                        </Badge>
                      ) : isSuspended ? (
                        <Badge
                          variant="destructive"
                          className="text-[9px] px-1.5 py-0 h-4 shrink-0 font-semibold border border-red-500/40 bg-red-500/15 text-red-600 dark:text-red-400 gap-1 shadow-2xs"
                        >
                          <HugeiconsIcon
                            icon={AlertCircleIcon}
                            strokeWidth={2.5}
                            className="size-2.5 text-red-600 dark:text-red-400"
                          />
                          Suspended
                        </Badge>
                      ) : (
                        <div className="flex items-center gap-1 shrink-0">
                          {org.membership_role && (
                            <RoleBadge role={org.membership_role} />
                          )}
                          <VerificationBadge
                            verified={Boolean(org.verified)}
                            className="text-[9px] px-1 py-0 h-4"
                            showIcon={false}
                          />
                          {isActive && (
                            <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="size-4 text-primary shrink-0" />
                          )}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Main / Filtered List */}
            <div className="pt-1 space-y-0.5">
              {!searchQuery.trim() && (
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  All Organizations ({organizations.length})
                </div>
              )}
              {searchQuery.trim() && (
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Search Results ({displayOrgs.length})
                </div>
              )}

              {displayOrgs.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  {searchQuery.trim()
                    ? `No organization matching "${searchQuery}"`
                    : "No organizations found"}
                </div>
              ) : (
                displayOrgs.map((org) => {
                  const isActive = org.id === activeOrgId
                  const isArchived = org.archived === true
                  const isSuspended =
                    org.membership_status === "suspended" || org.status === "suspended"
                  return (
                    <button
                      key={org.id}
                      type="button"
                      onClick={() => handleSelectOrg(org)}
                      className={cn(
                        "flex w-full items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-colors text-left group cursor-pointer",
                        isArchived
                          ? "opacity-60 bg-muted/30 hover:bg-muted/50 text-muted-foreground"
                          : isSuspended
                            ? "border border-red-500/25 bg-red-500/5 hover:bg-red-500/10 text-foreground"
                            : isActive
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-muted text-foreground"
                      )}
                    >
                      <OrgAvatar
                        org={org}
                        sizeClass="size-7"
                        textClass="text-[10px]"
                      />
                      <div className="grid flex-1 min-w-0">
                        <span className="truncate font-medium text-foreground">
                          {org.name}
                        </span>
                        {isArchived ? (
                          <span className="text-[10px] text-muted-foreground truncate">
                            Workspace archived • Inaccessible
                          </span>
                        ) : isSuspended ? (
                          <span className="text-[10px] text-red-600 dark:text-red-400 font-medium flex items-center gap-1 truncate">
                            <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-2.5 shrink-0" />
                            Membership suspended • Actions restricted
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground truncate">
                            {(org.city ? `${org.city} • ` : "") + (org.verified ? "Verified" : "Not verified")}
                          </span>
                        )}
                      </div>
                      {isArchived ? (
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1.5 py-0 h-4 shrink-0 border border-zinc-500/40 text-zinc-600 dark:text-zinc-400 bg-zinc-500/10 shadow-2xs"
                        >
                          Archived
                        </Badge>
                      ) : isSuspended ? (
                        <Badge
                          variant="destructive"
                          className="text-[9px] px-1.5 py-0 h-4 shrink-0 font-semibold border border-red-500/40 bg-red-500/15 text-red-600 dark:text-red-400 gap-1 shadow-2xs"
                        >
                          <HugeiconsIcon
                            icon={AlertCircleIcon}
                            strokeWidth={2.5}
                            className="size-2.5 text-red-600 dark:text-red-400"
                          />
                          Suspended
                        </Badge>
                      ) : (
                        <div className="flex items-center gap-1.5 shrink-0">
                          {org.membership_role && (
                            <RoleBadge role={org.membership_role} />
                          )}
                          <VerificationBadge
                            verified={Boolean(org.verified)}
                            className="text-[9px] px-1.5 py-0 h-4"
                            showIcon={false}
                          />
                          {!isSuspended && isActive && (
                            <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="size-4 text-primary shrink-0 ml-0.5" />
                          )}
                        </div>
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
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4 text-primary" />
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
