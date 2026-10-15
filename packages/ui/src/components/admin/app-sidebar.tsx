"use client"

import * as React from "react"
import Link from "next/link"

import { NavMain } from "@workspace/ui/components/admin/nav-main"
import { NavSecondary } from "@workspace/ui/components/admin/nav-secondary"
import { NavUser } from "@workspace/ui/components/admin/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import { CommandIcon } from "@hugeicons/core-free-icons"
import { useGetMeQuery } from "@workspace/store/reducers/authApi"

export type NavSection = {
  title: string
  items: {
    title: string
    url: string
    icon: React.ReactNode
    items?: {
      title: string
      url: string
    }[]
  }[]
}

export type NavSecondaryItem = {
  title: string
  url: string
  icon: React.ReactNode
}

export function AppSidebar({
  sections,
  secondaryItems,
  header,
  ...props
}: {
  sections: NavSection[]
  secondaryItems: NavSecondaryItem[]
  header?: React.ReactNode
} & React.ComponentProps<typeof Sidebar>) {
  const { data } = useGetMeQuery()
  const me = data?.data?.user

  return (
    <Sidebar
      {...props}
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
    >
      <SidebarHeader>
        {header ?? (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link href="/admin">
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
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarHeader>
      <SidebarContent>
        <NavMain sections={sections} />
        <NavSecondary items={secondaryItems} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            email: me?.email ?? "",
            phone: me?.phone ?? "",
            name: me?.name,
            profile: me?.profile,
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
