"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  NotificationIcon,
  Mail01Icon,
  SmartPhone01Icon,
  ComputerIcon,
  Shield01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  ArrowRight01Icon,
  RefreshIcon,
  FilterIcon,
  Settings05Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  useListNotificationsQuery,
  useMarkNotificationReadMutation,
  useGetNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
  NotificationPreference,
} from "@workspace/store/reducers/notificationsApi"

const CATEGORIES = [
  {
    key: "transactional",
    title: "Transactional Alerts",
    description: "Ticket orders, buyer cancellations, refunds, transfers, and attendee registrations.",
    icon: CheckmarkCircle02Icon,
  },
  {
    key: "security",
    title: "Security & Authentication",
    description: "Account sign-ins from new devices, password changes, and active session revocations.",
    icon: Shield01Icon,
  },
  {
    key: "credential",
    title: "Staff & Credential Updates",
    description: "Onsite scanner invitations, role permission changes, and access token assignments.",
    icon: Settings05Icon,
  },
  {
    key: "legal",
    title: "Compliance & Commercial",
    description: "Platform fee schedule changes, verification status updates, and terms notices.",
    icon: Clock01Icon,
  },
] as const

const CHANNELS = [
  { key: "in_app", label: "In-App Bell", icon: ComputerIcon },
  { key: "email", label: "Email", icon: Mail01Icon },
  { key: "sms", label: "SMS", icon: SmartPhone01Icon },
] as const

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = React.useState<"inbox" | "preferences">("inbox")
  const [filterUnreadOnly, setFilterUnreadOnly] = React.useState(false)

  // API Queries
  const {
    data: notifData,
    isLoading: isLoadingNotifs,
    refetch: refetchNotifs,
  } = useListNotificationsQuery({ per_page: 50 })

  const [markRead, { isLoading: isMarkingRead }] = useMarkNotificationReadMutation()

  const {
    data: prefData,
    isLoading: isLoadingPrefs,
  } = useGetNotificationPreferencesQuery()

  const [updatePrefs, { isLoading: isUpdatingPrefs }] = useUpdateNotificationPreferencesMutation()

  // Local state for preferences
  const [localPrefs, setLocalPrefs] = React.useState<Record<string, Record<string, boolean>>>({})

  React.useEffect(() => {
    if (prefData?.data) {
      const map: Record<string, Record<string, boolean>> = {}
      prefData.data.forEach((p) => {
        if (!map[p.category]) map[p.category] = {}
        map[p.category][p.channel] = p.enabled
      })
      setLocalPrefs(map)
    }
  }, [prefData])

  const notifications = notifData?.data || []
  const filteredNotifications = filterUnreadOnly
    ? notifications.filter((n) => !n.read_at)
    : notifications

  const unreadCount = notifications.filter((n) => !n.read_at).length

  const handleMarkAsRead = async (id: string) => {
    try {
      await markRead(id).unwrap()
      toast.success("Notification marked as read")
    } catch {
      toast.error("Failed to mark notification as read")
    }
  }

  const handleToggleChannel = async (category: string, channel: string, currentVal: boolean) => {
    const newVal = !currentVal

    // Optimistic UI update
    setLocalPrefs((prev) => ({
      ...prev,
      [category]: {
        ...(prev[category] || {}),
        [channel]: newVal,
      },
    }))

    // Build preference list to submit
    const currentList: NotificationPreference[] = []
    const updatedMap = {
      ...localPrefs,
      [category]: {
        ...(localPrefs[category] || {}),
        [channel]: newVal,
      },
    }

    Object.entries(updatedMap).forEach(([cat, channels]) => {
      Object.entries(channels).forEach(([chan, enabled]) => {
        currentList.push({
          category: cat,
          channel: chan as "in_app" | "email" | "sms",
          enabled,
        })
      })
    })

    try {
      await updatePrefs({ preferences: currentList }).unwrap()
      toast.success(`Updated ${category} notification via ${channel.replace("_", " ")}`)
    } catch (err: any) {
      toast.error("Failed to update notification preference", {
        description: err?.data?.message || "Please try again later.",
      })
      // Revert on error
      setLocalPrefs((prev) => ({
        ...prev,
        [category]: {
          ...(prev[category] || {}),
          [channel]: currentVal,
        },
      }))
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Notifications & Alerts</h1>
          <p className="text-sm text-muted-foreground">
            Activity stream, transactional receipts, and cross-channel delivery controls.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 rounded-xl bg-muted/60 p-1 border border-border/50 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("inbox")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 font-medium transition-all ${
              activeTab === "inbox"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <HugeiconsIcon icon={NotificationIcon} className="size-4" />
            <span>Inbox</span>
            {unreadCount > 0 && (
              <span className="flex size-4 items-center justify-center rounded-full bg-lime-500 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preferences")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 font-medium transition-all ${
              activeTab === "preferences"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <HugeiconsIcon icon={Settings05Icon} className="size-4" />
            <span>Delivery Channels</span>
          </button>
        </div>
      </div>

      {activeTab === "inbox" ? (
        /* --- Inbox Tab --- */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={filterUnreadOnly ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFilterUnreadOnly(!filterUnreadOnly)}
                className="h-8 gap-1.5 text-xs"
              >
                <HugeiconsIcon icon={FilterIcon} className="size-3.5" />
                {filterUnreadOnly ? "Showing Unread" : "All Notifications"}
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetchNotifs()}
              disabled={isLoadingNotifs}
              className="h-8 gap-1 text-xs text-muted-foreground"
            >
              <HugeiconsIcon icon={RefreshIcon} className={`size-3.5 ${isLoadingNotifs ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {isLoadingNotifs ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted/40 border border-border/50" />
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 py-16 text-center">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
                <HugeiconsIcon icon={NotificationIcon} className="size-6" />
              </div>
              <h3 className="text-sm font-semibold">No notifications found</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                {filterUnreadOnly
                  ? "You have caught up with all incoming alerts! Toggle off the filter to see past items."
                  : "Activity, registration updates, and announcements will appear here."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notif) => {
                const isRead = !!notif.read_at
                const payload = (notif.data || {}) as Record<string, any>
                const title = String(payload?.title || payload?.subject || notif.notification_type.replace(/_/g, " "))
                const message = String(payload?.message || payload?.body || payload?.description || notif.category)
                const targetUrl = payload?.url || payload?.link

                return (
                  <div
                    key={notif.id}
                    className={`group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border p-4 transition-all ${
                      isRead
                        ? "border-border/60 bg-card text-muted-foreground opacity-85"
                        : "border-lime-500/30 bg-card/80 shadow-xs ring-1 ring-lime-500/20"
                    }`}
                  >
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div
                        className={`size-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isRead
                            ? "bg-muted text-muted-foreground"
                            : "bg-lime-500/10 text-lime-600 dark:text-lime-400"
                        }`}
                      >
                        <HugeiconsIcon icon={NotificationIcon} className="size-4.5" />
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-sm font-semibold capitalize ${isRead ? "text-foreground/80" : "text-foreground"}`}>
                            {title}
                          </span>
                          <Badge variant="outline" className="text-[10px] uppercase tracking-wider py-0 px-1.5">
                            {notif.category}
                          </Badge>
                          {!isRead && (
                            <span className="size-2 rounded-full bg-lime-500 shrink-0" />
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {message}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-muted-foreground/70">
                          <span className="flex items-center gap-1">
                            <HugeiconsIcon icon={Clock01Icon} className="size-3" />
                            {new Date(notif.created_at).toLocaleString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>

                          {notif.deliveries && notif.deliveries.length > 0 && (
                            <div className="flex items-center gap-1.5">
                              {notif.deliveries.map((del) => (
                                <Badge
                                  key={del.id}
                                  variant="secondary"
                                  className="text-[9px] py-0 px-1 text-muted-foreground capitalize"
                                >
                                  {del.channel}: {del.status}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {targetUrl && (
                        <Link href={targetUrl}>
                          <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
                            <span>View</span>
                            <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" />
                          </Button>
                        </Link>
                      )}

                      {!isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notif.id)}
                          disabled={isMarkingRead}
                          className="h-8 text-xs text-muted-foreground hover:text-foreground"
                        >
                          Mark as read
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        /* --- Preferences Tab --- */
        <div className="space-y-6">
          <Card className="rounded-2xl border-border/70">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Communication Delivery Channels</CardTitle>
              <CardDescription className="text-xs">
                Choose how you want to be notified for each domain. You can disable intrusive SMS channels while retaining in-app activity logs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-2">
              {isLoadingPrefs ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-16 animate-pulse rounded-xl bg-muted/40" />
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {CATEGORIES.map((cat) => {
                    const channels = localPrefs[cat.key] || {}

                    return (
                      <div
                        key={cat.key}
                        className="py-5 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1 max-w-md">
                          <div className="flex items-center gap-2">
                            <div className="size-7 rounded-lg bg-lime-500/10 text-lime-600 dark:text-lime-400 flex items-center justify-center">
                              <HugeiconsIcon icon={cat.icon} className="size-4" />
                            </div>
                            <span className="text-sm font-semibold text-foreground">
                              {cat.title}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed pl-9">
                            {cat.description}
                          </p>
                        </div>

                        {/* Channel Toggles */}
                        <div className="flex items-center gap-6 pl-9 md:pl-0">
                          {CHANNELS.map((chan) => {
                            const isEnabled = channels[chan.key] ?? true

                            return (
                              <div key={chan.key} className="flex flex-col items-center gap-2">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <HugeiconsIcon icon={chan.icon} className="size-3.5" />
                                  <span>{chan.label}</span>
                                </div>
                                <Switch
                                  checked={isEnabled}
                                  onCheckedChange={() =>
                                    handleToggleChannel(cat.key, chan.key, isEnabled)
                                  }
                                  disabled={isUpdatingPrefs}
                                  aria-label={`${cat.title} ${chan.label}`}
                                />
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
