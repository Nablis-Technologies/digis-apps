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
  useMarkNotificationAsReadMutation,
  type NotificationItem,
} from "@workspace/store/reducers/notificationsApi"

function formatRelativeTime(dateString: string) {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return "just now"
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  } catch {
    return dateString
  }
}

function getCategoryConfig(category?: string) {
  switch (category) {
    case "users":
      return { icon: UserGroupIcon, color: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400" }
    case "organizations":
      return { icon: Building01Icon, color: "bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400" }
    case "events":
      return { icon: Calendar03Icon, color: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" }
    default:
      return { icon: AlertDiamondIcon, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" }
  }
}

export function NotificationsPopover() {
  const { data, isLoading } = useListNotificationsQuery({ per_page: 5 })
  const [markAsRead] = useMarkNotificationAsReadMutation()

  const notifications: NotificationItem[] = data?.data ?? []
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <HugeiconsIcon icon={NotificationIcon} strokeWidth={2} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-lime-500 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <p className="text-sm font-semibold">Notifications</p>
          {unreadCount > 0 && (
            <span className="rounded-full bg-lime-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="max-h-[320px] overflow-y-auto">
          {isLoading ? (
            <div className="py-8 text-center text-xs text-muted-foreground">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">No notifications</div>
          ) : (
            notifications.map((n, i) => {
              const cfg = getCategoryConfig(n.category)
              return (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.read) {
                      markAsRead(n.id)
                    }
                  }}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50",
                    i < notifications.length - 1 && "border-b border-border/25",
                    !n.read && "bg-lime-50/50 dark:bg-lime-950/10"
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
                      {n.message}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground/60">
                      {formatRelativeTime(n.created_at)}
                    </p>
                  </div>
                  {!n.read && (
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-lime-500" />
                  )}
                </div>
              )
            })
          )}
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
