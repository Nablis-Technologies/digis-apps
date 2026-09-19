"use client"

import { use, useState } from "react"
import { motion } from "framer-motion"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { DataTable, type Column } from "@/components/ui/data-table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  ChartBarLineIcon,
  BarChartIcon,
  GlobeIcon,
  Store01Icon,
  LayoutTopIcon,
  Image01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowDown01Icon,
  Calendar03Icon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons"
import { Eye, Copy, Check, RefreshCw, ShieldAlert } from "lucide-react"
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
import { formatDate, formatCurrency, formatCurrencyShort, formatNumber, calculatePercentage } from "@/lib/utils"
import { cn } from "@workspace/ui/lib/utils"
import { toast } from "sonner"
import { ShareEventDialog } from "@/organizer-components/events/share-event-dialog"
import { EditEventDialog } from "@/organizer-components/events/edit-event-dialog"
import { IssueComplimentaryDialog } from "@/organizer-components/tickets/issue-complimentary-dialog"
import { RequestExportDialog } from "@/organizer-components/tickets/request-export-dialog"
import { useGetEventQuery } from "@workspace/store/reducers/organizerEventsApi"
import {
  useListEventProductsQuery,
  useActivateEventProductMutation,
  useDeactivateEventProductMutation,
  type EventProduct,
} from "@workspace/store/reducers/ticketingApi"
import {
  useListScannerDevicesQuery,
  useRotateScannerTokenMutation,
  useRevokeScannerDeviceMutation,
  type ScannerDevice,
} from "@workspace/store/reducers/attendeesApi"

interface EventDetailPageProps {
  params: Promise<{
    id: string
  }>
}

// ─── Analytics data config ──────────────────────────────────────────────────

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

// ─── Sales & Revenue Chart Tooltip ───────────────────────────────────────────

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
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [complimentaryDialogOpen, setComplimentaryDialogOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)

  // Gallery preview modal state
  const [galleryPreviewOpen, setGalleryPreviewOpen] = useState(false)
  const [selectedGalleryIndex, setSelectedGalleryIndex] = useState(0)

  // Scanner actions state
  const [tokenResult, setTokenResult] = useState<{ open: boolean; deviceName: string; token: string }>({
    open: false,
    deviceName: "",
    token: "",
  })
  const [revokeModal, setRevokeModal] = useState<{ open: boolean; deviceId: string; deviceName: string; reason: string }>({
    open: false,
    deviceId: "",
    deviceName: "",
    reason: "",
  })
  const [copiedToken, setCopiedToken] = useState(false)

  // Fetch event from API
  const { data: eventResponse, isLoading, error } = useGetEventQuery(id)
  const event = eventResponse?.data
  const organizationId = event?.organization_id ?? event?.organization?.id

  // Fetch ticket products
  const { data: productsResponse, isLoading: isLoadingProducts } = useListEventProductsQuery(
    { eventId: id },
    { skip: !id }
  )
  const products: EventProduct[] = productsResponse?.data ?? []

  // Fetch Scanner Devices for the organization
  const { data: scannersData, isLoading: isLoadingScanners } = useListScannerDevicesQuery(
    organizationId ?? "",
    { skip: !organizationId }
  )
  const scannerDevices: ScannerDevice[] = Array.isArray(scannersData?.data) ? scannersData.data : []

  // Mutations
  const [activateProduct] = useActivateEventProductMutation()
  const [deactivateProduct] = useDeactivateEventProductMutation()
  const [rotateScannerToken, { isLoading: isRotatingToken }] = useRotateScannerTokenMutation()
  const [revokeDevice, { isLoading: isRevokingDevice }] = useRevokeScannerDeviceMutation()

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

  const handleRotateToken = async (device: ScannerDevice) => {
    try {
      const res = await rotateScannerToken({
        deviceId: device.id,
        organizationId,
      }).unwrap()
      setTokenResult({
        open: true,
        deviceName: device.name || "Door Scanner",
        token: res.data.token,
      })
      toast.success("Scanner token rotated successfully")
    } catch {
      toast.error("Failed to rotate scanner token")
    }
  }

  const handleConfirmRevoke = async () => {
    if (!revokeModal.deviceId) return
    try {
      await revokeDevice({
        deviceId: revokeModal.deviceId,
        reason: revokeModal.reason || "Revoked by event organizer",
      }).unwrap()
      toast.success(`Device "${revokeModal.deviceName}" revoked`)
      setRevokeModal({ open: false, deviceId: "", deviceName: "", reason: "" })
    } catch {
      toast.error("Failed to revoke scanner device")
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <Skeleton className="size-20 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !event) {
    notFound()
  }

  // Get cover image
  const coverImage = event.event_media?.find(
    (m) => m.type?.toLowerCase() === "cover" || Number(m.position) === 0
  )
  const coverImageUrl =
    coverImage?.file?.medium || coverImage?.file?.thumbnail || coverImage?.file?.url || coverImage?.file_url

  // Get gallery images
  const galleryImages =
    event.event_media
      ?.filter((m) => m.type === "gallery")
      ?.sort((a, b) => a.position - b.position) || []

  // Ticket metrics computation from backend serializer
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

  const remainingTickets = Math.max(0, totalTickets - soldTickets)
  const sellThrough = totalTickets > 0 ? calculatePercentage(soldTickets, totalTickets) : 0

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
      value: formatNumber(totalTickets),
      icon: UserGroupIcon,
      sparklineData: [2200, 2400, 2600, 2700, 2800, 2900, totalTickets],
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

  // Sales & revenue overview
  const salesOverviewData = SALES_WEIGHTS.map((weight, index) => {
    const date = new Date(event.created_at)
    date.setDate(date.getDate() - (SALES_WEIGHTS.length - 1 - index))
    return {
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      sales: Math.round((soldTickets * weight) / 100),
      revenue: Math.round((totalRevenue * weight) / 100),
    }
  })

  // Sale channel breakdown
  const saleChannelRows: ChannelRow[] = SALE_CHANNELS.map((channel) => ({
    name: channel.name,
    icon: channel.icon,
    tickets: Math.round(soldTickets * channel.weight),
    share: Math.round(channel.weight * 100),
    revenue: Math.round(totalRevenue * channel.weight),
  }))

  // Ticket tier rows for DataTable
  type TierRow = {
    id: string
    name: string
    price: number
    sold: number
    total: number
    remaining: number
    revenue: number
    sellThrough: number
  }

  const tierRows: TierRow[] = products.map((p) => {
    const priceAmount =
      p.pricing?.options?.[0]?.amount_minor !== undefined
        ? p.pricing.options[0].amount_minor / 100
        : typeof p.metadata?.price === "number"
        ? p.metadata.price
        : 0

    const poolCapacity = p.inventory?.pools?.reduce((sum, pool) => sum + (pool.capacity || 0), 0)
    const capacity =
      typeof poolCapacity === "number" && poolCapacity > 0
        ? poolCapacity
        : typeof p.metadata?.capacity === "number"
        ? p.metadata.capacity
        : (p.ticket_type?.admissions_per_unit ? p.ticket_type.admissions_per_unit * 100 : 100)

    const sold = p.inventory?.pools?.reduce((sum, pool) => sum + (pool.sold_count || 0), 0) || 0
    const remaining = Math.max(0, capacity - sold)
    const revenue = sold * priceAmount
    const sellThrough = capacity > 0 ? calculatePercentage(sold, capacity) : 0

    return {
      id: p.id,
      name: p.name,
      price: priceAmount,
      sold,
      total: capacity,
      remaining,
      revenue,
      sellThrough,
    }
  })

  const tierColumns: Column<TierRow>[] = [
    {
      header: "Tier",
      accessorKey: "name",
      cell: (row) => (
        <div>
          <p className="font-semibold">{row.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(row.price)} per ticket
          </p>
        </div>
      ),
      sortable: true,
    },
    {
      header: "Sold / Total",
      cell: (row) => (
        <div>
          <p className="font-medium">
            {formatNumber(row.sold)} / {formatNumber(row.total)}
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-chart-1"
                style={{ width: `${row.sellThrough}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{row.sellThrough}%</span>
          </div>
        </div>
      ),
    },
    {
      header: "Remaining",
      accessorKey: "remaining",
      cell: (row) => <p className="font-medium">{formatNumber(row.remaining)}</p>,
      sortable: true,
    },
    {
      header: "Revenue",
      accessorKey: "revenue",
      cell: (row) => <p className="font-semibold">{formatCurrency(row.revenue)}</p>,
      sortable: true,
    },
  ]

  const channelColumns: Column<ChannelRow>[] = [
    {
      header: "Channel",
      accessorKey: "name",
      cell: (row) => {
        const IconComponent = row.icon
        return (
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
              <HugeiconsIcon icon={IconComponent} strokeWidth={2} className="size-5" />
            </div>
            <p className="font-semibold">{row.name}</p>
          </div>
        )
      },
      sortable: true,
    },
    {
      header: "Tickets Sold",
      accessorKey: "tickets",
      cell: (row) => <p className="font-medium">{formatNumber(row.tickets)}</p>,
      sortable: true,
    },
    {
      header: "Share",
      accessorKey: "share",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-chart-1"
              style={{ width: `${row.share}%` }}
            />
          </div>
          <span className="text-xs font-medium tabular-nums text-muted-foreground">
            {row.share}%
          </span>
        </div>
      ),
    },
    {
      header: "Revenue",
      cell: (row) => <p className="font-semibold">{formatCurrency(row.revenue)}</p>,
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "live":
        return "bg-chart-1/10 text-chart-1 dark:bg-chart-1/20 dark:text-chart-1"
      case "published":
        return "bg-chart-2/10 text-chart-2 dark:bg-chart-2/20 dark:text-chart-2"
      case "draft":
        return "bg-muted text-muted-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-start gap-4"
      >
        {coverImageUrl ? (
          <div className="relative size-20 overflow-hidden rounded-lg">
            <img
              src={coverImageUrl}
              alt={event.title}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex size-20 items-center justify-center rounded-lg bg-gradient-to-br from-olive-100 to-olive-200 dark:from-olive-900 dark:to-olive-800">
            <HugeiconsIcon icon={Image01Icon} className="size-8 text-olive-500 dark:text-olive-400" />
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Badge className={getStatusColor(event.status)}>
              {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
            </Badge>
            {totalTickets > 0 && (
              <span className="text-sm text-muted-foreground">
                {formatNumber(soldTickets)}/{formatNumber(totalTickets)} sold
              </span>
            )}
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{event.title}</h1>
          <p className="text-sm text-muted-foreground">
            {formatDate(event.created_at)} · {event.timezone}
          </p>
          {event.description && (
            <p className="mt-2 text-sm text-muted-foreground">{event.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setComplimentaryDialogOpen(true)}
          >
            <HugeiconsIcon icon={TicketIcon} strokeWidth={2} className="size-4" />
            Gift tickets
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setShareDialogOpen(true)}>
            <HugeiconsIcon icon={Share01Icon} strokeWidth={2} className="size-4" />
            Share
          </Button>
          {event.status?.toLowerCase() === "draft" && (
            <Button size="sm" className="gap-2" onClick={() => setEditDialogOpen(true)}>
              <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} className="size-4" />
              Edit event
            </Button>
          )}
        </div>
      </motion.div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">
            <HugeiconsIcon icon={LayoutTopIcon} strokeWidth={2} className="size-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <HugeiconsIcon icon={ChartBarLineIcon} strokeWidth={2} className="size-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="tickets">
            <HugeiconsIcon icon={Ticket01Icon} strokeWidth={2} className="size-4" />
            Tickets
          </TabsTrigger>
          <TabsTrigger value="sales">
            <HugeiconsIcon icon={BarChartIcon} strokeWidth={2} className="size-4" />
            Sales
          </TabsTrigger>
        </TabsList>

        {/* ─── OVERVIEW TAB ──────────────────────────────────────────────────── */}
        <TabsContent value="overview" className="flex flex-col gap-4">
          {/* Top Analytics */}
          <StatsGrid cards={statsCards} />

          {/* Compact Event Gallery with Preview Lightbox */}
          {galleryImages.length > 0 && (
            <Card className="overflow-hidden">
              <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={Image01Icon} strokeWidth={2} className="size-4 text-muted-foreground" />
                  <span className="font-semibold text-sm">Event Gallery</span>
                  <Badge variant="secondary" className="text-xs px-2 py-0">
                    {galleryImages.length} {galleryImages.length === 1 ? "photo" : "photos"}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => {
                    setSelectedGalleryIndex(0)
                    setGalleryPreviewOpen(true)
                  }}
                >
                  <Eye className="size-3.5" />
                  Preview Gallery
                </Button>
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
                        className="group relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-muted hover:border-lime-500/50 transition-all focus:outline-none focus:ring-2 focus:ring-lime-500/40"
                      >
                        {media.file ? (
                          <img
                            src={media.file.thumbnail || media.file.medium || media.file.url}
                            alt={media.alt_text || `Gallery image ${idx + 1}`}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <HugeiconsIcon icon={Image01Icon} className="size-5 text-muted-foreground" />
                          </div>
                        )}
                        {isLast && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-xs">
                            +{remainingCount} more
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {/* Ticket Tiers */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="flex flex-col gap-2"
            >
              <div>
                <h3 className="font-semibold">Ticket tiers</h3>
                <p className="text-sm text-muted-foreground">Inventory and pricing overview.</p>
              </div>
              <DataTable
                columns={tierColumns}
                data={tierRows}
                keyExtractor={(row) => row.id}
                emptyMessage="No ticket tiers found."
              />
            </motion.div>

            {/* Quick Stats Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                  <p className="text-sm text-muted-foreground">Event performance at a glance.</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Revenue</span>
                      <span className="text-lg font-bold">{formatCurrency(totalRevenue)}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Sell-through Rate</span>
                      <span className="text-lg font-bold">{sellThrough}%</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Average Ticket Price</span>
                      <span className="text-lg font-bold">
                        {soldTickets > 0 ? formatCurrency(totalRevenue / soldTickets) : "N/A"}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Event Capacity</span>
                      <span className="text-lg font-bold">{formatNumber(totalTickets)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        {/* ─── ANALYTICS TAB ─────────────────────────────────────────────────── */}
        <TabsContent value="analytics" className="flex flex-col gap-4">
          <StatsGrid cards={statsCards} />

          {/* Sales & Revenue Overview - full row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-base">Sales & Revenue</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Performance in the 7 days leading up to the event.
                  </p>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart
                    data={salesOverviewData}
                    margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis
                      yAxisId="sales"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      tickFormatter={(value) => formatNumber(value)}
                    />
                    <YAxis
                      yAxisId="revenue"
                      orientation="right"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      tickFormatter={(value) => formatCurrencyShort(value)}
                    />
                    <Tooltip cursor={false} content={<SalesTooltip />} />
                    <Area
                      yAxisId="sales"
                      type="monotone"
                      dataKey="sales"
                      name="Tickets sold"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#salesGradient)"
                    />
                    <Area
                      yAxisId="revenue"
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

                {/* Legend */}
                <div className="flex items-center justify-center gap-4 pt-3">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 shrink-0 rounded-[2px] bg-chart-1" />
                    <span className="text-xs">Tickets sold</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 shrink-0 rounded-[2px] bg-chart-2" />
                    <span className="text-xs">Revenue</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ─── TICKETS TAB ───────────────────────────────────────────────────── */}
        <TabsContent value="tickets" className="flex flex-col gap-5">
          {/* Header Action Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight">Event Ticketing & Access</h2>
              <p className="text-xs text-muted-foreground">
                Manage ticket tiers, complimentary passes, and door scanners for this event.
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
                className="gap-1.5 text-xs h-9"
                onClick={() => setComplimentaryDialogOpen(true)}
              >
                <HugeiconsIcon icon={Ticket01Icon} strokeWidth={2} className="size-3.5" />
                Gift Tickets
              </Button>
            </div>
          </div>

          {/* Top Ticket Metrics */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                <span className="text-xs font-medium text-muted-foreground">Gate Scanners</span>
                <div className="flex size-7 items-center justify-center rounded-md bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                  <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className="size-3.5" />
                </div>
              </div>
              <div className="mt-1.5 text-xl font-bold">
                {isLoadingScanners ? (
                  <Skeleton className="h-6 w-10" />
                ) : (
                  scannerDevices.filter((d) => d.status === "active").length
                )}
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Active door devices paired</p>
            </Card>

            <Card className="p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Total Capacity</span>
                <div className="flex size-7 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                  <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-3.5" />
                </div>
              </div>
              <div className="mt-1.5 text-xl font-bold">{formatNumber(totalTickets)}</div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Configured attendance capacity</p>
            </Card>

            <Card className="p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Complimentary</span>
                <div className="flex size-7 items-center justify-center rounded-md bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                  <HugeiconsIcon icon={TicketIcon} strokeWidth={2} className="size-3.5" />
                </div>
              </div>
              <div className="mt-1.5 text-xl font-bold">Zero-Charge</div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">VIP, Sponsor & Staff passes</p>
            </Card>
          </div>

          {/* Ticket Tiers Section */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Admission Tiers & Products</CardTitle>
                  <CardDescription>
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
                    Create ticket tiers in Event Settings or publish a tier to start receiving registrations.
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

          {/* Gate Scanners Section */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base">Gate Check-in Scanners</CardTitle>
                  <CardDescription>
                    Manage authorized volunteer and door staff smartphone scanners paired with your organization.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingScanners ? (
                <div className="space-y-3 py-4">
                  {[...Array(2)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : scannerDevices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                    <HugeiconsIcon icon={UserGroupIcon} className="size-6 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold">No Scanner Devices Paired Yet</h3>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    Door volunteers pair via the Digis Scanner Mobile App. Paired devices appear here with real-time audit control.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b text-xs uppercase text-muted-foreground">
                        <th className="pb-3 font-medium">Device Identifier</th>
                        <th className="pb-3 font-medium">Name</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Last Synced</th>
                        <th className="pb-3 font-medium text-right">Security Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {scannerDevices.map((device) => {
                        const isRevoked = device.status === "revoked"
                        return (
                          <tr key={device.id} className="hover:bg-muted/40 transition-colors">
                            <td className="py-3.5 pr-4 font-mono text-xs">
                              {device.device_identifier}
                            </td>
                            <td className="py-3.5 pr-4 font-medium">
                              {device.name || "Door Scanner"}
                            </td>
                            <td className="py-3.5 pr-4">
                              <Badge
                                variant={isRevoked ? "destructive" : "default"}
                                className={!isRevoked ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : ""}
                              >
                                {device.status.toUpperCase()}
                              </Badge>
                            </td>
                            <td className="py-3.5 pr-4 text-xs text-muted-foreground">
                              {device.last_seen_at ? formatDate(device.last_seen_at) : "Never"}
                            </td>
                            <td className="py-3.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {!isRevoked && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 text-xs gap-1.5"
                                      disabled={isRotatingToken}
                                      onClick={() => handleRotateToken(device)}
                                    >
                                      <RefreshCw className={cn("size-3.5", isRotatingToken && "animate-spin")} />
                                      Rotate Token
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 text-xs text-destructive hover:bg-destructive/10"
                                      onClick={() =>
                                        setRevokeModal({
                                          open: true,
                                          deviceId: device.id,
                                          deviceName: device.name || "Door Scanner",
                                          reason: "",
                                        })
                                      }
                                    >
                                      Revoke
                                    </Button>
                                  </>
                                )}
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
        </TabsContent>

        {/* ─── SALES TAB ─────────────────────────────────────────────────────── */}
        <TabsContent value="sales" className="flex flex-col gap-4">
          <StatsGrid cards={statsCards} />

          {/* Sale Channel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="flex flex-col gap-2"
          >
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={BarChartIcon} strokeWidth={2} className="size-5" />
              <h3 className="font-semibold">Sale channel</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Where your tickets are being sold.
            </p>
            <DataTable
              columns={channelColumns}
              data={saleChannelRows}
              keyExtractor={(row) => row.name}
              emptyMessage="No sales channels found."
            />
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Gallery Lightbox Dialog */}
      <Dialog open={galleryPreviewOpen} onOpenChange={setGalleryPreviewOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden border-border/80 bg-background/95 backdrop-blur-md">
          <DialogHeader className="p-4 pb-2 flex flex-row items-center justify-between border-b border-border/50">
            <div>
              <DialogTitle className="text-base font-semibold">
                Event Gallery
              </DialogTitle>
              <DialogDescription className="text-xs">
                {selectedGalleryIndex + 1} of {galleryImages.length}
              </DialogDescription>
            </div>
          </DialogHeader>

          {/* Lightbox Body */}
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

            {/* Navigation arrows */}
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

            {/* Caption / Alt text */}
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

          {/* Thumbnail Strip at bottom of Lightbox */}
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
                      ? "border-lime-500 scale-105"
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

      {/* Scanner Token Result Dialog */}
      <Dialog
        open={tokenResult.open}
        onOpenChange={(open) => setTokenResult((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-5 text-emerald-600" />
              Scanner Token Rotated
            </DialogTitle>
            <DialogDescription>
              New access token for <strong>{tokenResult.deviceName}</strong>. Share this code with door staff immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground">New Scanner Token</Label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={tokenResult.token}
                className="font-mono text-xs bg-muted"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(tokenResult.token)
                  setCopiedToken(true)
                  setTimeout(() => setCopiedToken(false), 2000)
                  toast.success("Token copied to clipboard")
                }}
              >
                {copiedToken ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
              </Button>
            </div>
            <p className="text-[11px] text-amber-600 dark:text-amber-400">
              This token will not be shown again. The old token has been invalidated.
            </p>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setTokenResult({ open: false, deviceName: "", token: "" })}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Scanner Device Confirmation Dialog */}
      <Dialog
        open={revokeModal.open}
        onOpenChange={(open) => setRevokeModal((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="size-5" />
              Revoke Scanner Device
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke <strong>{revokeModal.deviceName}</strong>? This device will immediately lose access to scan tickets.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="revoke-reason" className="text-xs">Reason for Revocation</Label>
            <Input
              id="revoke-reason"
              placeholder="e.g. Device lost, staff reassigned"
              value={revokeModal.reason}
              onChange={(e) => setRevokeModal((prev) => ({ ...prev, reason: e.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRevokeModal({ open: false, deviceId: "", deviceName: "", reason: "" })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isRevokingDevice}
              onClick={handleConfirmRevoke}
            >
              {isRevokingDevice ? "Revoking..." : "Revoke Device"}
            </Button>
          </DialogFooter>
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
      />
    </div>
  )
}
