import { AppSidebar } from "@/components/app-sidebar"
import { AuthGuard } from "@/components/auth-guard"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
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
  File01Icon,
  LockIcon,
  BankIcon,
  WalletIcon,
  ReceiptDollarIcon,
  RadarIcon,
} from "@hugeicons/core-free-icons"
import type { NavSection, NavSecondaryItem } from "@workspace/ui/components/admin/app-sidebar"

const navSections: NavSection[] = [
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
        url: "/admin/events",
        icon: <HugeiconsIcon icon={MusicNote01Icon} strokeWidth={2} />,
        items: [
          { title: "All Events", url: "/admin/events" },
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
    title: "Legal",
    items: [
      {
        title: "Legal Documents",
        url: "/admin/legal-documents",
        icon: <HugeiconsIcon icon={File01Icon} strokeWidth={2} />,
      },
      {
        title: "Data Retention",
        url: "/admin/data-retention",
        icon: <HugeiconsIcon icon={LockIcon} strokeWidth={2} />,
      },
    ],
  },
  {
    title: "Finance",
    items: [
      {
        title: "Payouts",
        url: "/admin/payouts",
        icon: <HugeiconsIcon icon={BankIcon} strokeWidth={2} />,
      },
      {
        title: "Refunds",
        url: "/admin/refunds",
        icon: <HugeiconsIcon icon={WalletIcon} strokeWidth={2} />,
      },
    ],
  },
  {
    title: "Commercial",
    items: [
      {
        title: "Fee Schedules & Programs",
        url: "/admin/commercial",
        icon: <HugeiconsIcon icon={ReceiptDollarIcon} strokeWidth={2} />,
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
      {
        title: "System Readiness",
        url: "/admin/system/readiness",
        icon: <HugeiconsIcon icon={RadarIcon} strokeWidth={2} />,
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

export const iframeHeight = "800px"

export const description = "A sidebar with a header and a search form."

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="pt-(--header-height) [--header-height:calc(--spacing(14))]">
        <SidebarProvider className="flex flex-col">
          <SiteHeader />
          <div className="flex flex-1">
            <AppSidebar sections={navSections} secondaryItems={navSecondary} />
            <SidebarInset className="flex min-w-0 flex-1 flex-col gap-4 p-4">
              {children}
            </SidebarInset>
          </div>
        </SidebarProvider>
      </div>
    </AuthGuard>
  )
}
