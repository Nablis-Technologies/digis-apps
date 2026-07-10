"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  NotificationIcon,
  UserGroupIcon,
  Building01Icon,
  Calendar03Icon,
  AlertDiamondIcon,
  CheckmarkCircleIcon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import Link from "next/link"

type NotificationType = "all" | "users" | "organizations" | "events" | "system"

interface Notification {
  id: string
  type: Exclude<NotificationType, "all">
  title: string
  description: string
  time: string
  read: boolean
  link?: string
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "users",
    title: "New user registered",
    description: "Abebe Kebede created a new account",
    time: "2 minutes ago",
    read: false,
    link: "/admin/users",
  },
  {
    id: "2",
    type: "organizations",
    title: "Organization verification",
    description: "Ethio Events PLC submitted verification documents",
    time: "15 minutes ago",
    read: false,
    link: "/admin/organizations",
  },
  {
    id: "3",
    type: "events",
    title: "Event awaiting approval",
    description: "Great Ethiopian Run 2026 is pending review",
    time: "1 hour ago",
    read: false,
  },
  {
    id: "4",
    type: "system",
    title: "Backup completed",
    description: "Daily database backup finished successfully",
    time: "3 hours ago",
    read: true,
  },
  {
    id: "5",
    type: "users",
    title: "Account verification",
    description: "Meron Tadesse completed email verification",
    time: "5 hours ago",
    read: true,
    link: "/admin/users",
  },
  {
    id: "6",
    type: "organizations",
    title: "New organization created",
    description: "Nabis Entertainment registered as an organizer",
    time: "Yesterday at 4:30 PM",
    read: true,
    link: "/admin/organizations",
  },
  {
    id: "7",
    type: "events",
    title: "Event cancelled",
    description: "Addis Jazz Night has been cancelled by the organizer",
    time: "Yesterday at 2:15 PM",
    read: true,
  },
  {
    id: "8",
    type: "system",
    title: "SSL certificate expiring",
    description: "SSL certificate will expire in 14 days",
    time: "2 days ago",
    read: true,
  },
]

const typeConfig: Record<Exclude<NotificationType, "all">, { label: string; icon: typeof NotificationIcon; color: string }> = {
  users: {
    label: "Users",
    icon: UserGroupIcon,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  },
  organizations: {
    label: "Organizations",
    icon: Building01Icon,
    color: "bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400",
  },
  events: {
    label: "Events",
    icon: Calendar03Icon,
    color: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  },
  system: {
    label: "System",
    icon: AlertDiamondIcon,
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  },
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState<NotificationType>("all")
  const [notifications, setNotifications] = useState(mockNotifications)

  const filtered =
    filter === "all"
      ? notifications
      : notifications.filter((n) => n.type === filter)

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const markRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const filters: { key: NotificationType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "users", label: "Users" },
    { key: "organizations", label: "Organizations" },
    { key: "events", label: "Events" },
    { key: "system", label: "System" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-lime-600 transition-colors hover:bg-lime-50 dark:hover:bg-lime-950/20"
          >
            <HugeiconsIcon icon={CheckmarkCircleIcon} strokeWidth={2} className="size-4" />
            Mark all as read
          </button>
        )}
      </div>

      <div className="flex gap-1 border-b border-border/50">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              filter === f.key
                ? "border-lime-500 text-lime-600"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-0 rounded-xl border border-border/50 bg-card shadow-xs">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <HugeiconsIcon
              icon={NotificationIcon}
              strokeWidth={2}
              className="mb-3 size-10 text-muted-foreground/40"
            />
            <p className="text-sm text-muted-foreground">No notifications</p>
          </div>
        ) : (
          filtered.map((n, i) => {
            const config = typeConfig[n.type]
            const isLast = i === filtered.length - 1

            return (
              <div
                key={n.id}
                className={cn(
                  "group flex items-start gap-4 px-6 py-4 transition-colors hover:bg-muted/50",
                  !isLast && "border-b border-border/50",
                  !n.read && "bg-lime-50/50 dark:bg-lime-950/10"
                )}
              >
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full",
                    config.color
                  )}
                >
                  <HugeiconsIcon icon={config.icon} strokeWidth={2} className="size-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        !n.read && "text-lime-700 dark:text-lime-400"
                      )}
                    >
                      {n.title}
                    </p>
                    {!n.read && (
                      <span className="size-2 shrink-0 rounded-full bg-lime-500" />
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {n.description}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <time className="text-xs text-muted-foreground">
                    {n.time}
                  </time>
                  {n.link && (
                    <Link
                      href={n.link}
                      onClick={() => markRead(n.id)}
                      className="rounded-md p-1 opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
                    >
                      <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4 text-muted-foreground" />
                    </Link>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
