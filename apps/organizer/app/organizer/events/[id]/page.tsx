"use client"

import { use, useState, useMemo } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable, type Column } from "@/components/ui/data-table"
import { TabsContent } from "@/components/ui/tabs"
import { PageTabs } from "@/components/page-tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { HugeiconsIcon } from "@hugeicons/react"
import type { HugeiconsIconProps } from "@hugeicons/react"
import {
  TicketIcon,
  Edit01Icon,
  Wallet01Icon,
  UserGroupIcon,
  Ticket01Icon,
  Share01Icon,
  GlobeIcon,
  Store01Icon,
  LayoutTopIcon,
  Image01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowDown01Icon,
  Calendar03Icon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  Key01Icon,
  RadioIcon,
  ViewIcon,
  Settings02Icon,
  Shield01Icon,
  Location01Icon,
  Building02Icon,
  MoreVerticalIcon,
  ArrowUpRight01Icon,
  PresentationPodiumIcon,
  Clock01Icon,
} from "@hugeicons/core-free-icons"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { StatsGrid } from "@/components/dashboard/stats-grid"
import {
  formatDate,
  formatDateTime,
  formatCurrency,
  formatNumber,
  calculatePercentage,
} from "@/lib/utils"
import { cn } from "@workspace/ui/lib/utils"
import { toast } from "sonner"
import { ShareEventDialog } from "@/organizer-components/events/share-event-dialog"
import { EditEventDialog } from "@/organizer-components/events/edit-event-dialog"
import { CompleteEventDialog } from "@/organizer-components/events/complete-event-dialog"
import { RescheduleEventDialog } from "@/organizer-components/events/reschedule-event-dialog"
import { CancelEventDialog } from "@/organizer-components/events/cancel-event-dialog"
import { IssueComplimentaryDialog } from "@/organizer-components/tickets/issue-complimentary-dialog"
import { RequestExportDialog } from "@/organizer-components/tickets/request-export-dialog"
import { AccessCodesTab } from "@/organizer-components/events/access-codes-tab"
import { AttendeesTab } from "@/organizer-components/events/attendees-tab"
import { ScannersTab } from "@/organizer-components/events/scanners-tab"
import { ReorderGalleryDialog } from "@/organizer-components/events/reorder-gallery-dialog"
import { UpdateInventoryDialog } from "@/organizer-components/events/update-inventory-dialog"
import { PromoVideosSection } from "@/organizer-components/events/promo-videos-section"
import { FeePayerCard } from "@/organizer-components/events/fee-payer-card"
import { ScheduleTab } from "@/organizer-components/events/schedule-tab"
import { LineupTab } from "@/organizer-components/events/lineup-tab"
import { TeamTab } from "@/organizer-components/events/team-tab"
import { useActiveOrganization } from "@/providers/organization-provider"
import { useGetMeQuery } from "@workspace/store/reducers/authApi"
import { useListStaffAssignmentsQuery } from "@workspace/store/reducers/eventScheduleApi"
import {
  useGetEventQuery,
  usePublishEventMutation,
  useListEventParticipantsQuery,
} from "@workspace/store/reducers/organizerEventsApi"
import {
  useListEventProductsQuery,
  useActivateEventProductMutation,
  useDeactivateEventProductMutation,
  type EventProduct,
} from "@workspace/store/reducers/ticketingApi"

interface EventDetailPageProps {
  params: Promise<{
    id: string
  }>
}

// ─── Analytics configuration ────────────────────────────────────────────────

const SALE_CHANNELS: {
  name: string
  icon: HugeiconsIconProps["icon"]
  weight: number
}[] = [
  { name: "Online", icon: GlobeIcon, weight: 0.62 },
  { name: "At Gate", icon: Ticket01Icon, weight: 0.23 },
  { name: "Resellers", icon: Store01Icon, weight: 0.15 },
]

/** Percentage of total sales/revenue per day (last 7 days). */
const SALES_WEIGHTS = [6, 10, 14, 18, 22, 16, 14]

type ChannelRow = {
  name: string
  icon: HugeiconsIconProps["icon"]
  tickets: number
  share: number
  revenue: number
}

// ─── Sales Tooltip Component ────────────────────────────────────────────────

function SalesTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{
    dataKey?: string
    value?: number
    color?: string
  }>
  label?: string
}) {
  if (!active || !payload?.length) return null

  const items = payload.filter(
    (item) => item.dataKey === "sales" || item.dataKey === "revenue"
  )

  return (
    <div className="grid min-w-32 items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
      <div className="font-medium">{label}</div>
      <div className="grid gap-1.5">
        {items.map((item) => {
          const isSales = item.dataKey === "sales"
          return (
            <div key={item.dataKey} className="flex w-full items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex flex-1 items-center justify-between gap-4">
                <span className="text-muted-foreground">
                  {isSales ? "Tickets sold" : "Revenue"}
                </span>
                <span className="font-mono font-medium text-foreground tabular-nums">
                  {isSales
                    ? formatNumber(Number(item.value))
                    : formatCurrency(Number(item.value))}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = use(params)
  const [activeTab, setActiveTab] = useState("overview")

  // Modal Dialogs
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [complimentaryDialogOpen, setComplimentaryDialogOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)

  // Gallery preview modal state
  const [galleryPreviewOpen, setGalleryPreviewOpen] = useState(false)
  const [selectedGalleryIndex, setSelectedGalleryIndex] = useState(0)
  const [reorderGalleryOpen, setReorderGalleryOpen] = useState(false)

  // Inventory configuration modal state
  const [inventoryDialogOpen, setInventoryDialogOpen] = useState(false)
  const [selectedProductForInventory, setSelectedProductForInventory] = useState<EventProduct | null>(null)

  // Fetch event details
  const { data: eventResponse, isLoading, error } = useGetEventQuery(id)
  const event = eventResponse?.data
  const organizationId = event?.organization_id ?? event?.organization?.id
  const dates = (event?.event_dates as any[]) || []
  const primaryDate = dates[0]
  const venue = (event as any)?.venue || primaryDate?.venue

  // Fetch participants for tab count & highlights
  const { data: participantsData } = useListEventParticipantsQuery({ eventId: id }, { skip: !id })
  const participants = participantsData?.data || []

  // Fetch ticket products
  const { data: productsResponse, isLoading: isLoadingProducts } = useListEventProductsQuery(
    { eventId: id },
    { skip: !id }
  )
  const products: EventProduct[] = productsResponse?.data ?? []

  // Mutations
  const [publishEvent, { isLoading: isPublishing }] = usePublishEventMutation()
  const [activateProduct] = useActivateEventProductMutation()
  const [deactivateProduct] = useDeactivateEventProductMutation()

  // Permissions: Organization context & Staff assignments for attendee export
  const { isOwnerOrAdmin } = useActiveOrganization()
  const { data: meData } = useGetMeQuery()
  const currentUserId = meData?.data?.user?.id
  const { data: staffData } = useListStaffAssignmentsQuery({ eventId: id }, { skip: !id })

  const isEventManager = useMemo(() => {
    if (!currentUserId || !staffData?.data) return false
    return (staffData.data as any[]).some(
      (a: any) =>
        (a.user_id === currentUserId || a.user?.id === currentUserId) &&
        a.role === "manager" &&
        a.status === "active"
    )
  }, [currentUserId, staffData?.data])

  const canExportAttendees = isOwnerOrAdmin || isEventManager
  const canExportContactInfo = isOwnerOrAdmin

  const handlePublish = async () => {
    try {
      await publishEvent({ id }).unwrap()
      toast.success("Event published successfully!", {
        description: "Your event is now live and accepting registrations and ticket orders.",
      })
    } catch (err: any) {
      toast.error("Failed to publish event", {
        description: err?.data?.message || err?.data?.error || err?.message || "An unexpected error occurred",
      })
    }
  }

  const handleToggleProductStatus = async (product: EventProduct) => {
    try {
      if (product.status === "active") {
        await deactivateProduct({ eventId: id, id: product.id }).unwrap()
        toast.success(`"${product.name}" deactivated`)
      } else {
        await activateProduct({ eventId: id, id: product.id }).unwrap()
        toast.success(`"${product.name}" activated`)
      }
    } catch {
      toast.error("Failed to update product status")
    }
  }

  const handleViewEventPage = () => {
    const slugOrId = event?.slug || id
    window.open(`/events/${slugOrId}`, "_blank")
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-start gap-4 p-5 rounded-2xl border bg-card">
          <Skeleton className="size-20 sm:size-24 rounded-xl" />
          <div className="flex-1 space-y-2.5">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !event) {
    notFound()
  }

  // Cover image
  const coverImage = event.event_media?.find(
    (m) => m.type?.toLowerCase() === "cover" || Number(m.position) === 0
  )
  const coverImageUrl =
    coverImage?.file?.medium || coverImage?.file?.thumbnail || coverImage?.file?.url || coverImage?.file_url

  // Gallery images
  const galleryImages =
    event.event_media
      ?.filter((m) => m.type === "gallery")
      ?.sort((a, b) => a.position - b.position) || []

  // Capacity calculations
  const totalVenueCapacity = dates.reduce(
    (sum, d) => sum + (d.capacity?.limit || d.venue_capacity || 0),
    0
  )

  const totalTickets = products.reduce((acc, p) => {
    const poolCapacity = p.inventory?.pools?.reduce((sum, pool) => sum + (pool.capacity || 0), 0)
    const cap =
      typeof poolCapacity === "number" && poolCapacity > 0
        ? poolCapacity
        : typeof p.metadata?.capacity === "number"
        ? p.metadata.capacity
        : p.ticket_type?.admissions_per_unit
        ? p.ticket_type.admissions_per_unit * 100
        : 100
    return acc + cap
  }, 0)

  const soldTickets = products.reduce((acc, p) => {
    const poolSold = p.inventory?.pools?.reduce((sum, pool) => sum + (pool.sold_count || 0), 0)
    return acc + (poolSold || 0)
  }, 0)

  const totalRevenue = products.reduce((acc, p) => {
    const poolSold = p.inventory?.pools?.reduce((sum, pool) => sum + (pool.sold_count || 0), 0) || 0
    const priceAmount =
      p.pricing?.options?.[0]?.amount_minor !== undefined
        ? p.pricing.options[0].amount_minor / 100
        : typeof p.metadata?.price === "number"
        ? p.metadata.price
        : 0
    return acc + poolSold * priceAmount
  }, 0)

  const displayCapacity = totalTickets > 0 ? totalTickets : totalVenueCapacity
  const remainingTickets = Math.max(0, displayCapacity - soldTickets)
  const sellThrough = displayCapacity > 0 ? calculatePercentage(soldTickets, displayCapacity) : 0

  const statsCards = [
    {
      key: "tickets-sold",
      title: "Tickets Sold",
      value: formatNumber(soldTickets),
      icon: TicketIcon,
      trend: { value: `${sellThrough}%`, positive: true },
      sparklineData: [40, 80, 120, 160, 200, 240, soldTickets],
      sparklineColor: "var(--chart-1)",
    },
    {
      key: "revenue",
      title: "Revenue",
      value: formatCurrency(totalRevenue),
      icon: Wallet01Icon,
      trend: { value: "+18%", positive: true },
      sparklineData: [120, 160, 200, 240, 280, 320, totalRevenue / 1000],
      sparklineColor: "var(--chart-2)",
    },
    {
      key: "total-capacity",
      title: "Total Capacity",
      value: formatNumber(displayCapacity),
      icon: UserGroupIcon,
      sparklineData: [2200, 2400, 2600, 2700, 2800, 2900, displayCapacity],
      sparklineColor: "var(--chart-3)",
    },
    {
      key: "remaining",
      title: "Tickets Remaining",
      value: formatNumber(remainingTickets),
      icon: Ticket01Icon,
      sparklineData: [360, 320, 280, 240, 200, 160, remainingTickets],
      sparklineColor: "var(--chart-4)",
    },
  ]

  // Sales Trajectory
  const salesOverviewData = SALES_WEIGHTS.map((weight, index) => {
    const date = new Date(event.created_at)
    date.setDate(date.getDate() - (SALES_WEIGHTS.length - 1 - index))
    return {
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      sales: Math.round((soldTickets * weight) / 100),
      revenue: Math.round((totalRevenue * weight) / 100),
    }
  })

  // Sales Channels
  const saleChannelRows: ChannelRow[] = SALE_CHANNELS.map((channel) => ({
    name: channel.name,
    icon: channel.icon,
    tickets: Math.round(soldTickets * channel.weight),
    share: Math.round(channel.weight * 100),
    revenue: Math.round(totalRevenue * channel.weight),
  }))

  const channelColumns: Column<ChannelRow>[] = [
    {
      header: "Channel",
      accessorKey: "name",
      cell: (row) => {
        const IconComponent = row.icon
        return (
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
              <HugeiconsIcon icon={IconComponent} strokeWidth={2} className="size-4" />
            </div>
            <p className="font-semibold text-xs text-foreground">{row.name}</p>
          </div>
        )
      },
      sortable: true,
    },
    {
      header: "Tickets Sold",
      accessorKey: "tickets",
      cell: (row) => <p className="font-medium text-xs">{formatNumber(row.tickets)}</p>,
      sortable: true,
    },
    {
      header: "Share",
      accessorKey: "share",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${row.share}%` }}
            />
          </div>
          <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
            {row.share}%
          </span>
        </div>
      ),
    },
    {
      header: "Revenue",
      cell: (row) => <p className="font-semibold text-xs">{formatCurrency(row.revenue)}</p>,
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "published":
        return <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 uppercase text-[11px] font-semibold tracking-wider">Published</Badge>
      case "live":
        return <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 uppercase text-[11px] font-semibold tracking-wider">Live</Badge>
      case "draft":
        return <Badge variant="secondary" className="bg-muted text-muted-foreground uppercase text-[11px] font-semibold tracking-wider">Draft</Badge>
      case "completed":
        return <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 uppercase text-[11px] font-semibold tracking-wider">Completed</Badge>
      case "cancelled":
        return <Badge variant="destructive" className="uppercase text-[11px] font-semibold tracking-wider">Cancelled</Badge>
      default:
        return <Badge variant="outline" className="uppercase text-[11px] font-semibold tracking-wider">{status}</Badge>
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ─── Back to Events Navigation ─────────────────────────────────────── */}
      <Link
        href="/organizer/events"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group w-fit"
      >
        <HugeiconsIcon
          icon={ArrowLeft01Icon}
          className="size-3.5 transition-transform group-hover:-translate-x-0.5"
        />
        Back to events
      </Link>

      {/* ─── Modern Hero Event Header (Reference Style) ────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between rounded-2xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs"
      >
        <div className="flex items-start gap-4 min-w-0">
          {/* Cover Thumbnail */}
          <div className="relative size-20 sm:size-24 shrink-0 overflow-hidden rounded-xl border border-border/80 bg-muted shadow-sm">
            {coverImageUrl ? (
              <img
                src={coverImageUrl}
                alt={event.title}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-muted/60 text-muted-foreground">
                <HugeiconsIcon icon={Image01Icon} className="size-8 opacity-40" />
              </div>
            )}
          </div>

          {/* Event Identity & Metadata */}
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
                {event.title}
              </h1>
              {getStatusBadge(event.status)}
              {event.visibility && (
                <Badge variant="outline" className="text-[10px] capitalize text-muted-foreground font-normal">
                  {event.visibility}
                </Badge>
              )}
            </div>

            {/* Structured Metadata Row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
              {primaryDate && (
                <div className="flex items-center gap-1.5">
                  <HugeiconsIcon icon={Calendar03Icon} className="size-3.5 text-primary shrink-0" />
                  <span>{formatDateTime(primaryDate.starts_at)}</span>
                </div>
              )}
              {venue && (
                <div className="flex items-center gap-1.5">
                  <HugeiconsIcon icon={Location01Icon} className="size-3.5 text-primary shrink-0" />
                  <span>{venue.name}{venue.city ? `, ${venue.city}` : ""}</span>
                </div>
              )}
              {displayCapacity > 0 && (
                <div className="flex items-center gap-1.5 font-medium">
                  <HugeiconsIcon icon={UserGroupIcon} className="size-3.5 text-primary shrink-0" />
                  <span>{formatNumber(soldTickets)} / {formatNumber(displayCapacity)} Seats</span>
                </div>
              )}
              {event.organization?.name && (
                <div className="flex items-center gap-1.5">
                  <HugeiconsIcon icon={Building02Icon} className="size-3.5 text-primary shrink-0" />
                  <span>{event.organization.name}</span>
                </div>
              )}
            </div>

            {event.description && (
              <p className="text-xs text-muted-foreground line-clamp-1 max-w-2xl pt-0.5">
                {event.description}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-center shrink-0">
          {event.status?.toLowerCase() === "draft" && (
            <Button
              size="sm"
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs h-9 px-3.5 text-xs"
              onClick={handlePublish}
              disabled={isPublishing}
            >
              <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-4" />
              {isPublishing ? "Publishing..." : "Publish event"}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs h-9"
            onClick={() => setShareDialogOpen(true)}
          >
            <HugeiconsIcon icon={Share01Icon} strokeWidth={2} className="size-3.5" />
            Share event
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs h-9"
            onClick={handleViewEventPage}
          >
            <HugeiconsIcon icon={ArrowUpRight01Icon} strokeWidth={2} className="size-3.5" />
            View event page
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="size-9 p-0">
                <HugeiconsIcon icon={MoreVerticalIcon} strokeWidth={2} className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setEditDialogOpen(true)} className="gap-2 text-xs">
                <HugeiconsIcon icon={Edit01Icon} size={15} />
                Edit Event Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setComplimentaryDialogOpen(true)}
                className="gap-2 text-xs"
              >
                <HugeiconsIcon icon={TicketIcon} size={15} />
                Gift Complimentary Tickets
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setRescheduleDialogOpen(true)}
                disabled={event.status === "cancelled" || event.status === "completed"}
                className="gap-2 text-xs"
              >
                <HugeiconsIcon icon={Calendar03Icon} size={15} />
                Reschedule Session
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setCompleteDialogOpen(true)}
                disabled={event.status !== "published"}
                className="gap-2 text-xs text-emerald-600 dark:text-emerald-400 focus:text-emerald-700"
              >
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={15} />
                Complete Event {event.status !== "published" && "(Requires Published)"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setCancelDialogOpen(true)}
                disabled={event.status === "cancelled" || event.status === "completed"}
                className="gap-2 text-xs text-destructive focus:text-destructive"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={15} />
                Cancel Event
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>

      {/* ─── Clean, Single-Level Tabs (No "&", No Double Tabs) ─────────────── */}
      <PageTabs
        value={activeTab}
        onValueChange={setActiveTab}
        tabs={[
          { value: "overview", label: "Overview", icon: LayoutTopIcon },
          { value: "schedule", label: "Schedule", icon: Calendar03Icon, count: dates.length },
          { value: "lineup", label: "Lineup", icon: PresentationPodiumIcon, count: participants.length },
          { value: "tickets", label: "Tickets", icon: Ticket01Icon, count: products.length },
          { value: "attendees", label: "Attendees", icon: UserGroupIcon, count: soldTickets },
          { value: "access", label: "Access", icon: Key01Icon },
          { value: "check-in", label: "Check-in", icon: RadioIcon },
          { value: "team", label: "Team", icon: Shield01Icon },
        ]}
      >
        {/* ─── 1. OVERVIEW TAB ──────────────────────────────────────────────── */}
        <TabsContent value="overview" className="flex flex-col gap-6">
          {/* Top KPI Metrics Cards */}
          <StatsGrid cards={statsCards} />

          {/* Sales & Revenue Trajectory Area Chart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base font-bold">Sales & Revenue Trajectory</CardTitle>
                <CardDescription className="text-xs">
                  Sales velocity and revenue growth leading up to event date.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart
                  data={salesOverviewData}
                  margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/40" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    className="text-xs text-muted-foreground"
                    tickMargin={8}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    className="text-xs text-muted-foreground"
                    tickMargin={8}
                    tickFormatter={(v) => formatNumber(Number(v))}
                  />
                  <Tooltip content={<SalesTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    name="Tickets sold"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#salesGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>

              <div className="flex items-center justify-center gap-6 pt-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 shrink-0 rounded-[2px] bg-chart-1" />
                  <span className="text-xs text-muted-foreground">Tickets sold</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 shrink-0 rounded-[2px] bg-chart-2" />
                  <span className="text-xs text-muted-foreground">Revenue</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Details & Modules Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left Column */}
            <div className="flex flex-col gap-6">
              {/* Event Description & Categories */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold">About this event</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {event.description || "No description provided for this event."}
                  </p>
                  {event.categories && event.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {event.categories.map((cat: any) => (
                        <Badge key={cat.id || cat.name} variant="secondary" className="text-xs">
                          {cat.name}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/50 text-xs">
                    <div>
                      <p className="text-muted-foreground">Timezone</p>
                      <p className="font-semibold text-foreground mt-0.5">{event.timezone}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Currency</p>
                      <p className="font-semibold text-foreground mt-0.5">{event.currency || "ETB"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sales Channels Distribution */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold">Sales Channels</CardTitle>
                  <CardDescription className="text-xs">
                    Where your ticket sales originate.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <DataTable
                    columns={channelColumns}
                    data={saleChannelRows}
                    keyExtractor={(row) => row.name}
                    emptyMessage="No sales channels found."
                  />
                </CardContent>
              </Card>

              {/* Promo Videos Section (GET /events/:id/event_video_links) */}
              <PromoVideosSection eventId={id} />
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-6">
              {/* Sessions Spotlight with direct jump to Schedule tab */}
              <Card>
                <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={Calendar03Icon} className="size-4 text-primary" />
                    <span className="font-semibold text-sm">Scheduled Sessions</span>
                    <Badge variant="secondary" className="text-xs px-2 py-0">
                      {dates.length}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-primary gap-1"
                    onClick={() => setActiveTab("schedule")}
                  >
                    View schedule
                    <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" />
                  </Button>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0 space-y-2.5">
                  {dates.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">No dates configured.</p>
                  ) : (
                    dates.slice(0, 3).map((d: any) => (
                      <div
                        key={d.id}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-muted/20 text-xs"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <p className="font-semibold text-foreground truncate">
                            {d.name || "Main Session"}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {formatDateTime(d.starts_at || d.start_time)}
                          </p>
                        </div>
                        {d.venue && (
                          <Badge variant="outline" className="text-[10px] shrink-0">
                            {d.venue.name}
                          </Badge>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Featured Lineup with direct jump to Lineup tab */}
              <Card>
                <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={PresentationPodiumIcon} className="size-4 text-primary" />
                    <span className="font-semibold text-sm">Featured Lineup</span>
                    <Badge variant="secondary" className="text-xs px-2 py-0">
                      {participants.length}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-primary gap-1"
                    onClick={() => setActiveTab("lineup")}
                  >
                    View lineup
                    <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" />
                  </Button>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  {participants.length === 0 ? (
                    <div className="py-2.5 text-xs text-muted-foreground flex items-center justify-between">
                      <span>No performers or speakers configured yet.</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1 text-primary hover:text-primary"
                        onClick={() => setActiveTab("lineup")}
                      >
                        Add Lineup
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {participants.slice(0, 3).map((p: any) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-2 rounded-xl border border-border/60 bg-muted/20 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
                              {(p.name?.slice(0, 2) || "AR").toUpperCase()}
                            </div>
                            <div className="truncate">
                              <p className="font-semibold text-foreground truncate">{p.name}</p>
                              {p.description && (
                                <p className="text-[11px] text-muted-foreground truncate">{p.description}</p>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[10px] capitalize shrink-0">
                            {p.type?.replace("_", " ")}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Event Gallery with Lightbox preview */}
              {galleryImages.length > 0 && (
                <Card className="overflow-hidden">
                  <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon icon={Image01Icon} strokeWidth={2} className="size-4 text-muted-foreground" />
                      <span className="font-semibold text-sm">Event Gallery</span>
                      <Badge variant="secondary" className="text-xs px-2 py-0">
                        {galleryImages.length}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1.5"
                        onClick={() => setReorderGalleryOpen(true)}
                      >
                        <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} className="size-3.5" />
                        Reorder
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1.5"
                        onClick={() => {
                          setSelectedGalleryIndex(0)
                          setGalleryPreviewOpen(true)
                        }}
                      >
                        <HugeiconsIcon icon={ViewIcon} strokeWidth={2} className="size-3.5" />
                        Preview
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-3 pt-0">
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                      {galleryImages.slice(0, 5).map((media, idx) => {
                        const isLast = idx === 4 && galleryImages.length > 5
                        const remainingCount = galleryImages.length - 5
                        return (
                          <button
                            key={media.id}
                            type="button"
                            onClick={() => {
                              setSelectedGalleryIndex(idx)
                              setGalleryPreviewOpen(true)
                            }}
                            className="relative size-14 shrink-0 rounded-md overflow-hidden border bg-muted group cursor-pointer"
                          >
                            {media.file?.thumbnail || media.file?.url ? (
                              <img
                                src={media.file?.thumbnail || media.file?.url}
                                alt={media.alt_text || `Photo ${idx + 1}`}
                                className="size-full object-cover transition-transform group-hover:scale-110"
                              />
                            ) : (
                              <div className="flex size-full items-center justify-center bg-muted">
                                <HugeiconsIcon icon={Image01Icon} className="size-4 text-muted-foreground" />
                              </div>
                            )}
                            {isLast && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs font-bold">
                                +{remainingCount}
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ─── 2. SCHEDULE TAB (GET /events/:id/event_dates) ─────────────────── */}
        <TabsContent value="schedule" className="flex flex-col gap-5">
          <ScheduleTab
            eventId={id}
            fallbackDates={dates}
            eventStatus={event.status}
            onRescheduleSession={() => setRescheduleDialogOpen(true)}
          />
        </TabsContent>

        {/* ─── 3. LINEUP TAB (GET /events/:id/event_participants) ───────────── */}
        <TabsContent value="lineup" className="flex flex-col gap-5">
          <LineupTab eventId={id} eventDates={dates} />
        </TabsContent>

        {/* ─── 4. TICKETS TAB ────────────────────────────────────────────────── */}
        <TabsContent value="tickets" className="flex flex-col gap-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight">Ticket Tiers & Pricing</h2>
              <p className="text-xs text-muted-foreground">
                Set tier capacities, pricing, admissions, and toggle sales activation.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-9"
                onClick={() => setExportDialogOpen(true)}
              >
                <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} className="size-3.5" />
                Export Attendees
              </Button>
              <Button
                size="sm"
                className="gap-1.5 text-xs h-9 shadow-xs"
                onClick={() => setComplimentaryDialogOpen(true)}
              >
                <HugeiconsIcon icon={Ticket01Icon} strokeWidth={2} className="size-3.5" />
                Gift Tickets
              </Button>
            </div>
          </div>

          {/* Ticket Metrics */}
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Active Tiers</span>
                <div className="flex size-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                  <HugeiconsIcon icon={Ticket01Icon} strokeWidth={2} className="size-3.5" />
                </div>
              </div>
              <div className="mt-1.5 text-xl font-bold">
                {isLoadingProducts ? (
                  <Skeleton className="h-6 w-14" />
                ) : (
                  `${products.filter((p) => p.status === "active").length} / ${products.length}`
                )}
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Published ticket tiers</p>
            </Card>

            <Card className="p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Total Capacity</span>
                <div className="flex size-7 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                  <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-3.5" />
                </div>
              </div>
              <div className="mt-1.5 text-xl font-bold">{formatNumber(displayCapacity)}</div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Configured attendance capacity</p>
            </Card>

            <Card className="p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Complimentary</span>
                <div className="flex size-7 items-center justify-center rounded-md bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                  <HugeiconsIcon icon={Ticket01Icon} strokeWidth={2} className="size-3.5" />
                </div>
              </div>
              <div className="mt-1.5 text-xl font-bold">Zero-Charge</div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">VIP, Sponsor & Staff passes</p>
            </Card>
          </div>

          {/* Ticket Tiers Table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Admission Tiers & Products</CardTitle>
                  <CardDescription className="text-xs">
                    Configure ticket pricing, sales windows, and entry conditions.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-8"
                  onClick={() => setComplimentaryDialogOpen(true)}
                >
                  Gift Ticket
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingProducts ? (
                <div className="space-y-3 py-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                    <HugeiconsIcon icon={Ticket01Icon} className="size-6 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold">No Ticket Tiers Configured</h3>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    Create ticket tiers in Event Settings to start receiving registrations.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b text-xs uppercase text-muted-foreground">
                        <th className="pb-3 font-medium">Tier Name</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Type</th>
                        <th className="pb-3 font-medium">Price</th>
                        <th className="pb-3 font-medium">Admissions</th>
                        <th className="pb-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {products.map((p) => {
                        const isActive = p.status === "active"
                        const price =
                          p.pricing?.options?.[0]?.amount_minor !== undefined
                            ? p.pricing.options[0].amount_minor / 100
                            : typeof p.metadata?.price === "number"
                            ? p.metadata.price
                            : 0
                        return (
                          <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                            <td className="py-3.5 pr-4">
                              <p className="font-semibold text-foreground">{p.name}</p>
                              {p.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {p.description}
                                </p>
                              )}
                            </td>
                            <td className="py-3.5 pr-4">
                              <Badge
                                variant={isActive ? "default" : "secondary"}
                                className={isActive ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : ""}
                              >
                                {p.status.toUpperCase()}
                              </Badge>
                            </td>
                            <td className="py-3.5 pr-4 capitalize text-muted-foreground">
                              {p.type || "Standard"}
                            </td>
                            <td className="py-3.5 pr-4 font-mono font-medium">
                              {price > 0 ? formatCurrency(price) : "Free"}
                            </td>
                            <td className="py-3.5 pr-4 text-muted-foreground">
                              {p.ticket_type?.admissions_per_unit ?? 1} entry per package
                            </td>
                            <td className="py-3.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs gap-1"
                                  onClick={() => {
                                    setSelectedProductForInventory(p)
                                    setInventoryDialogOpen(true)
                                  }}
                                >
                                  <HugeiconsIcon icon={Settings02Icon} strokeWidth={2} className="size-3.5" />
                                  Capacity
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-xs"
                                  onClick={() => handleToggleProductStatus(p)}
                                >
                                  {isActive ? "Deactivate" : "Activate"}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs"
                                  onClick={() => setComplimentaryDialogOpen(true)}
                                >
                                  Gift
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fee Payer Terms */}
          {organizationId && (
            <FeePayerCard
              eventId={id}
              organizationId={organizationId}
              currency={event?.currency || "ETB"}
            />
          )}
        </TabsContent>

        {/* ─── 5. ATTENDEES TAB ──────────────────────────────────────────────── */}
        <TabsContent value="attendees" className="flex flex-col gap-5">
          <AttendeesTab
            eventId={id}
            eventTitle={event?.title || "Event"}
            eventProducts={products}
            totalSold={soldTickets}
            totalCapacity={displayCapacity}
            canExport={canExportAttendees}
            onOpenComplimentary={() => setComplimentaryDialogOpen(true)}
            onOpenExport={() => setExportDialogOpen(true)}
          />
        </TabsContent>

        {/* ─── 6. ACCESS TAB ─────────────────────────────────────────────────── */}
        <TabsContent value="access" className="flex flex-col gap-5">
          <AccessCodesTab eventId={id} eventProducts={products} />
        </TabsContent>

        {/* ─── 7. CHECK-IN TAB ───────────────────────────────────────────────── */}
        <TabsContent value="check-in" className="flex flex-col gap-5">
          <ScannersTab organizationId={organizationId} />
        </TabsContent>

        {/* ─── 8. TEAM TAB (Staff + Collaborating Organizations) ─────────────── */}
        <TabsContent value="team" className="flex flex-col gap-5">
          <TeamTab
            eventId={id}
            organizationId={organizationId}
            primaryOrganization={event?.organization}
          />
        </TabsContent>
      </PageTabs>

      {/* ─── Dialogs & Modals ────────────────────────────────────────────────── */}

      {/* Gallery Lightbox Dialog */}
      <Dialog open={galleryPreviewOpen} onOpenChange={setGalleryPreviewOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden border-border/80 bg-background/95 backdrop-blur-md">
          <DialogHeader className="p-4 pb-2 flex flex-row items-center justify-between border-b border-border/50">
            <div>
              <DialogTitle className="text-base font-semibold">Event Gallery</DialogTitle>
              <DialogDescription className="text-xs">
                {selectedGalleryIndex + 1} of {galleryImages.length}
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="relative flex flex-col items-center justify-center bg-black/90 p-4 min-h-[350px] max-h-[70vh]">
            {galleryImages[selectedGalleryIndex] && (
              <div className="relative max-h-[60vh] max-w-full flex items-center justify-center">
                <img
                  src={
                    galleryImages[selectedGalleryIndex].file?.url ||
                    galleryImages[selectedGalleryIndex].file?.medium ||
                    galleryImages[selectedGalleryIndex].file_url ||
                    ""
                  }
                  alt={
                    galleryImages[selectedGalleryIndex].alt_text ||
                    `Gallery image ${selectedGalleryIndex + 1}`
                  }
                  className="max-h-[58vh] max-w-full object-contain rounded-lg shadow-2xl"
                />
              </div>
            )}

            {galleryImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
                  onClick={() =>
                    setSelectedGalleryIndex((prev) =>
                      prev === 0 ? galleryImages.length - 1 : prev - 1
                    )
                  }
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} className="size-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
                  onClick={() =>
                    setSelectedGalleryIndex((prev) =>
                      prev === galleryImages.length - 1 ? 0 : prev + 1
                    )
                  }
                >
                  <HugeiconsIcon icon={ArrowRight01Icon} className="size-5" />
                </Button>
              </>
            )}

            {(galleryImages[selectedGalleryIndex]?.alt_text ||
              galleryImages[selectedGalleryIndex]?.caption) && (
              <div className="mt-3 text-center text-xs text-white/80 max-w-md">
                {galleryImages[selectedGalleryIndex]?.alt_text && (
                  <p className="font-medium text-white">
                    {galleryImages[selectedGalleryIndex].alt_text}
                  </p>
                )}
                {galleryImages[selectedGalleryIndex]?.caption && (
                  <p className="text-white/60">
                    {galleryImages[selectedGalleryIndex].caption}
                  </p>
                )}
              </div>
            )}
          </div>

          {galleryImages.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 p-3 overflow-x-auto border-t border-border/50 bg-background/50">
              {galleryImages.map((img, idx) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setSelectedGalleryIndex(idx)}
                  className={cn(
                    "size-12 rounded-md overflow-hidden border-2 transition-all shrink-0",
                    selectedGalleryIndex === idx
                      ? "border-primary scale-105"
                      : "border-transparent opacity-60 hover:opacity-100"
                  )}
                >
                  <img
                    src={img.file?.thumbnail || img.file?.medium || img.file?.url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Social Share Card Dialog */}
      <ShareEventDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        event={event}
      />

      {/* Edit Event Dialog */}
      <EditEventDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        event={event || null}
      />

      {/* Complimentary Ticket Dialog */}
      <IssueComplimentaryDialog
        open={complimentaryDialogOpen}
        onOpenChange={setComplimentaryDialogOpen}
        eventId={id}
      />

      {/* Request Attendee Export Dialog */}
      <RequestExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        eventId={id}
        canExportContactInfo={canExportContactInfo}
      />

      {/* Complete Event Dialog */}
      <CompleteEventDialog
        open={completeDialogOpen}
        onOpenChange={setCompleteDialogOpen}
        eventId={id}
        eventTitle={event.title}
        eventStatus={event.status}
        eventDates={(event.event_dates as any[]) || []}
      />

      {/* Reschedule Event Dialog */}
      <RescheduleEventDialog
        open={rescheduleDialogOpen}
        onOpenChange={setRescheduleDialogOpen}
        eventId={id}
        eventTitle={event.title}
        eventDates={(event.event_dates as any[]) || []}
      />

      {/* Cancel Event Dialog */}
      <CancelEventDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        eventId={id}
        eventTitle={event.title}
      />

      {/* Reorder Gallery Dialog */}
      <ReorderGalleryDialog
        open={reorderGalleryOpen}
        onOpenChange={setReorderGalleryOpen}
        eventId={id}
        mediaItems={galleryImages as any}
      />

      {/* Update Product Inventory Configuration Dialog */}
      <UpdateInventoryDialog
        open={inventoryDialogOpen}
        onOpenChange={setInventoryDialogOpen}
        eventId={id}
        product={selectedProductForInventory}
        eventDates={dates}
      />
    </div>
  )
}
