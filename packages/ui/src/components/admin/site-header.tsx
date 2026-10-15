"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import { useSidebar } from "@workspace/ui/components/sidebar"
import { NotificationsPopover } from "@workspace/ui/components/admin/notifications-popover"
import { useTheme } from "next-themes"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  SidebarLeftIcon,
  Moon02Icon,
  Sun02Icon,
} from "@hugeicons/core-free-icons"

const labelMap: Record<string, string> = {
  admin: "Admin",
  organizer: "Organizer",
  events: "Events",
  payouts: "Payouts",
  team: "Team",
  campaigns: "Campaigns",
  organization: "Organization",
  profile: "Profile",
  tickets: "Tickets",
  users: "Users",
  roles: "Roles",
  permissions: "Permissions",
  categories: "Categories",
  venues: "Venues",
  artists: "Artists",
  organizations: "Organizations",
  verification: "Verification",
  memberships: "Memberships",
  settings: "Settings",
  general: "General",
}

const isUuid = (val: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(val) || (val.length >= 20 && val.includes("-"))

export function SiteHeader() {
  const { toggleSidebar } = useSidebar()
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  const segments = pathname
    .split("/")
    .filter(Boolean)
    .map((s, i, arr) => ({
      label: labelMap[s] ?? (isUuid(s) ? "Details" : s.charAt(0).toUpperCase() + s.slice(1)),
      href: "/" + arr.slice(0, i + 1).join("/"),
      isLast: i === arr.length - 1,
    }))

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex w-full items-center border-b bg-background">
      <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
        <Button
          className="h-8 w-8"
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
        >
          <HugeiconsIcon icon={SidebarLeftIcon} strokeWidth={2} />
        </Button>
        <Separator
          orientation="vertical"
          className="mr-2 data-vertical:h-4 data-vertical:self-auto"
        />
        <Breadcrumb className="hidden flex-1 sm:block">
          <BreadcrumbList>
            {segments.flatMap((seg, i) => {
              const nodes: React.ReactNode[] = [
                <BreadcrumbItem key={seg.href}>
                  {seg.isLast ? (
                    <BreadcrumbPage>{seg.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={seg.href}>{seg.label}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>,
              ]
              if (!seg.isLast) {
                nodes.push(<BreadcrumbSeparator key={`sep-${seg.href}`} />)
              }
              return nodes
            })}
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex items-center gap-1">
          <NotificationsPopover />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setTheme(isDark ? "light" : "dark")}
          >
            <HugeiconsIcon
              icon={isDark ? Sun02Icon : Moon02Icon}
              strokeWidth={2}
            />
          </Button>
        </div>
      </div>
    </header>
  )
}
