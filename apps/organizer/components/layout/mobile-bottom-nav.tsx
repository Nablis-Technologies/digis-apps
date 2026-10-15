"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  DashboardSquare01Icon,
  Calendar03Icon,
  Wallet01Icon,
  SmartPhone01Icon,
  Building02Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@workspace/ui/lib/utils"

const navItems = [
  {
    label: "Dashboard",
    href: "/organizer",
    icon: DashboardSquare01Icon,
    exact: true,
  },
  {
    label: "Events",
    href: "/organizer/events",
    icon: Calendar03Icon,
  },
  {
    label: "Scanner",
    href: "/pair",
    icon: SmartPhone01Icon,
  },
  {
    label: "Payouts",
    href: "/organizer/payouts",
    icon: Wallet01Icon,
  },
  {
    label: "Org",
    href: "/organizer/organization",
    icon: Building02Icon,
  },
]

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t border-border/80 bg-background/95 backdrop-blur-md px-2 py-1 md:hidden"
    >
      {navItems.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium transition-colors",
              isActive
                ? "text-primary font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div
              className={cn(
                "flex size-7 items-center justify-center rounded-lg transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground"
              )}
            >
              <HugeiconsIcon icon={item.icon} size={16} strokeWidth={2} />
            </div>
            <span className="truncate">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
