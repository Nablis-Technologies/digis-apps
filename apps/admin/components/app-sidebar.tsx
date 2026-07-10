"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  DashboardSquare01Icon,
  UserGroupIcon,
  Shield01Icon,
  MusicNote01Icon,
  OfficeIcon,
  Settings05Icon,
  HelpCircleIcon,
  Mail01Icon,
  CommandIcon,
} from "@hugeicons/core-free-icons"
import { useGetMeQuery } from "@/store/reducers/authApi"

const navData = {
  navSections: [
    {
      title: "Overview",
      items: [
        {
          title: "Dashboard",
          url: "/admin",
          icon: <HugeiconsIcon icon={DashboardSquare01Icon} strokeWidth={2} />,
        },
      ],
    },
    {
      title: "Management",
      items: [
        {
          title: "Users",
          url: "/admin/users",
          icon: <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} />,
        },
        {
          title: "Roles & Permissions",
          url: "#",
          icon: <HugeiconsIcon icon={Shield01Icon} strokeWidth={2} />,
          items: [
            { title: "Roles", url: "/admin/roles" },
            { title: "Permissions", url: "/admin/permissions" },
          ],
        },
        {
          title: "Events",
          url: "#",
          icon: <HugeiconsIcon icon={MusicNote01Icon} strokeWidth={2} />,
          items: [
            { title: "Categories", url: "/admin/categories" },
            { title: "Venues", url: "/admin/venues" },
            { title: "Artists", url: "/admin/artists" },
          ],
        },
        {
          title: "Organizations",
          url: "/admin/organizations",
          icon: <HugeiconsIcon icon={OfficeIcon} strokeWidth={2} />,
        },
      ],
    },
    {
      title: "System",
      items: [
        {
          title: "Settings",
          url: "/admin/settings",
          icon: <HugeiconsIcon icon={Settings05Icon} strokeWidth={2} />,
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "#",
      icon: <HugeiconsIcon icon={HelpCircleIcon} strokeWidth={2} />,
    },
    {
      title: "Feedback",
      url: "#",
      icon: <HugeiconsIcon icon={Mail01Icon} strokeWidth={2} />,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data } = useGetMeQuery()
  const me = data?.data?.user

  return (
    <Sidebar
      {...props}
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-lime-500 text-sidebar-primary-foreground">
                  <HugeiconsIcon
                    icon={CommandIcon}
                    strokeWidth={2}
                    className="size-4"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Digis Events</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Admin Dashboard
                  </span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain sections={navData.navSections} />
        <NavSecondary items={navData.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            email: me?.email ?? "",
            phone: me?.phone ?? "",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
