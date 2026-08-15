"use client"

import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  NotificationIcon,
  UserGroupIcon,
  Building01Icon,
  Calendar03Icon,
  AlertDiamondIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"

type NotifType = "users" | "organizations" | "events" | "system"

interface NotificationItem {
  id: string
  type: NotifType
  title: string
  description: string
  time: string
  read: boolean
  link?: string
}

const typeConfig: Record<
  NotifType,
  { icon: typeof NotificationIcon; color: string }
> = {
  users: { icon: UserGroupIcon, color: "bg-blue-100 text-blue-700" },
  organizations: {
    icon: Building01Icon,
    color: "bg-violet-100 text-violet-700",
  },
  events: { icon: Calendar03Icon, color: "bg-amber-100 text-amber-700" },
  system: { icon: AlertDiamondIcon, color: "bg-emerald-100 text-emerald-700" },
}

const mockNotifications: NotificationItem[] = [
  {
    id: "1",
    type: "users",
    title: "New user registered",
    description: "Abebe Kebede created a new account",
    time: "2m ago",
    read: false,
    link: "/admin/users",
  },
  {
    id: "2",
    type: "organizations",
    title: "Verification submitted",
    description: "Ethio Events PLC submitted documents",
    time: "15m ago",
    read: false,
    link: "/admin/organizations",
  },
  {
    id: "3",
    type: "events",
    title: "Event pending review",
    description: "Great Ethiopian Run 2026",
    time: "1h ago",
    read: false,
  },
  {
    id: "4",
    type: "system",
    title: "Backup completed",
    description: "Daily backup finished successfully",
    time: "3h ago",
    read: true,
  },
  {
    id: "5",
    type: "users",
    title: "Account verified",
    description: "Meron Tadesse completed verification",
    time: "5h ago",
    read: true,
    link: "/admin/users",
  },
]

export function NotificationsPopover() {
  const unread = mockNotifications.filter((n) => !n.read).length
  const recent = mockNotifications.slice(0, 5)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <HugeiconsIcon icon={NotificationIcon} strokeWidth={2} />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-lime-500 text-[10px] font-bold text-white">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <p className="text-sm font-semibold">Notifications</p>
          {unread > 0 && (
            <span className="rounded-full bg-lime-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {unread} new
            </span>
          )}
        </div>
        <div className="max-h-[320px] overflow-y-auto">
          {recent.map((n, i) => {
            const cfg = typeConfig[n.type]
            return (
              <Link
                key={n.id}
                href={n.link ?? "#"}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50",
                  i < recent.length - 1 && "border-b border-border/25"
                )}
              >
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full",
                    cfg.color
                  )}
                >
                  <HugeiconsIcon
                    icon={cfg.icon}
                    strokeWidth={2}
                    className="size-3.5"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug font-medium">{n.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {n.description}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground/60">
                    {n.time}
                  </p>
                </div>
                {!n.read && (
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-lime-500" />
                )}
              </Link>
            )
          })}
        </div>
        <div className="border-t border-border/25 px-4 py-2">
          <Link
            href="/admin/notifications"
            className="flex items-center justify-center gap-1 rounded-md py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            View All Notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
