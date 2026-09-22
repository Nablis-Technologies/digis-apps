import { AppSidebar } from "@/components/app-sidebar"
import { AuthGuard } from "@/components/auth-guard"
import { OrganizerGuard } from "../../components/organizer-guard"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  DashboardSquare01Icon,
  Calendar03Icon,
  Wallet01Icon,
  Settings05Icon,
  HelpCircleIcon,
  Mail01Icon,
  Building02Icon,
  UserGroupIcon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons"
import type { NavSection, NavSecondaryItem } from "@workspace/ui/components/admin/app-sidebar"

const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        url: "/organizer",
        icon: <HugeiconsIcon icon={DashboardSquare01Icon} strokeWidth={2} />,
      },
      {
        title: "Events",
        url: "/organizer/events",
        icon: <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} />,
      },
    ],
  },
  {
    title: "Management",
    items: [
      {
        title: "Organization",
        url: "/organizer/organization",
        icon: <HugeiconsIcon icon={Building02Icon} strokeWidth={2} />,
      },
      {
        title: "Team",
        url: "/organizer/team",
        icon: <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} />,
      },
      {
        title: "Payouts",
        url: "/organizer/payouts",
        icon: <HugeiconsIcon icon={Wallet01Icon} strokeWidth={2} />,
      },
    ],
  },
  {
    title: "Marketing",
    items: [
      {
        title: "Campaigns",
        url: "/organizer/campaigns",
        icon: <HugeiconsIcon icon={Mail01Icon} strokeWidth={2} />,
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        title: "Profile",
        url: "/organizer/profile",
        icon: <HugeiconsIcon icon={UserCircleIcon} strokeWidth={2} />,
      },
      {
        title: "Settings",
        url: "/organizer/settings",
        icon: <HugeiconsIcon icon={Settings05Icon} strokeWidth={2} />,
      },
    ],
  },
]

const navSecondary: NavSecondaryItem[] = [
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
]

import { OrganizationProvider } from "../../providers/organization-provider"
import { OrgSidebarSwitcher } from "../../components/layout/org-sidebar-switcher"

export default function OrganizerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <OrganizationProvider>
        <OrganizerGuard>
          <div className="pt-(--header-height) [--header-height:calc(--spacing(14))]">
            <SidebarProvider className="flex flex-col">
              <SiteHeader />
              <div className="flex flex-1">
                <AppSidebar
                  header={<OrgSidebarSwitcher />}
                  sections={navSections}
                  secondaryItems={navSecondary}
                />
                <SidebarInset className="flex min-w-0 flex-1 flex-col gap-4 p-4">
                  {children}
                </SidebarInset>
              </div>
            </SidebarProvider>
          </div>
        </OrganizerGuard>
      </OrganizationProvider>
    </AuthGuard>
  )
}
