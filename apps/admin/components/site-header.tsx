"use client"

import { usePathname } from "next/navigation"
import { SearchForm } from "@/components/search-form"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useSidebar } from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import { SidebarLeftIcon } from "@hugeicons/core-free-icons"

const labelMap: Record<string, string> = {
  admin: "Admin",
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

export function SiteHeader() {
  const { toggleSidebar } = useSidebar()
  const pathname = usePathname()

  const segments = pathname
    .split("/")
    .filter(Boolean)
    .map((s, i, arr) => ({
      label: labelMap[s] ?? s.charAt(0).toUpperCase() + s.slice(1),
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
        <Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            {segments.map((seg) => (
              <BreadcrumbItem key={seg.href}>
                {seg.isLast ? (
                  <BreadcrumbPage>{seg.label}</BreadcrumbPage>
                ) : (
                  <>
                    <BreadcrumbLink href={seg.href}>{seg.label}</BreadcrumbLink>
                    <BreadcrumbSeparator />
                  </>
                )}
              </BreadcrumbItem>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
        <SearchForm className="w-full sm:ml-auto sm:w-auto" />
      </div>
    </header>
  )
}
