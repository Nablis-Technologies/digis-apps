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
import {
  useListNotificationsQuery,
  useMarkNotificationReadMutation,
} from "@workspace/store/reducers/notificationsApi"

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

const fallbackNotifications: NotificationItem[] = [
  {
    id: "fb-1",
    type: "users",
    title: "New attendee registration",
    description: "Attendee confirmed ticket reservation",
    time: "Just now",
    read: false,
    link: "/organizer/tickets",
  },
  {
    id: "fb-2",
    type: "organizations",
    title: "Verification status update",
    description: "KYC verification documents accepted",
    time: "15m ago",
    read: false,
    link: "/organizer/organization",
  },
  {
    id: "fb-3",
    type: "events",
    title: "Event published",
    description: "Your event is now live and accepting registrations",
    time: "1h ago",
    read: true,
    link: "/organizer/events",
  },
]

import { usePathname } from "next/navigation"

interface NotificationsPopoverProps {
  viewAllHref?: string
}

export function NotificationsPopover({ viewAllHref }: NotificationsPopoverProps) {
  const pathname = usePathname()
  const resolvedHref = viewAllHref ?? (pathname?.startsWith("/organizer") ? "/organizer/notifications" : "/admin/notifications")
  const { data: notificationsData } = useListNotificationsQuery({ per_page: 10 })
  const [markRead] = useMarkNotificationReadMutation()

  const apiNotifications = notificationsData?.data && notificationsData.data.length > 0
    ? notificationsData.data.map((n) => {
        const cat =
          n.category === "events" || n.category === "users" || n.category === "organizations"
            ? n.category
            : "system"
        const payload = (n.data || {}) as Record<string, any>
        return {
          id: n.id,
          type: cat as NotifType,
          title: String(payload?.title || payload?.subject || n.notification_type.replace(/_/g, " ")),
          description: String(payload?.message || payload?.body || payload?.description || n.category),
          time: new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          read: !!n.read_at,
          link: payload?.url || payload?.link,
        }
      })
    : fallbackNotifications

  const unread = apiNotifications.filter((n) => !n.read).length
  const recent = apiNotifications.slice(0, 5)

  const handleItemClick = (id: string, isRead: boolean) => {
    if (!isRead && !id.startsWith("fb-")) {
      markRead(id).catch(() => {})
    }
  }

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
            const cfg = typeConfig[n.type] || typeConfig.system
            return (
              <Link
                key={n.id}
                href={n.link ?? "#"}
                onClick={() => handleItemClick(n.id, n.read)}
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
                  <p className="text-sm leading-snug font-medium capitalize">{n.title}</p>
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
            href={resolvedHref}
            className="flex items-center justify-center gap-1 rounded-md py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            View All Notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
