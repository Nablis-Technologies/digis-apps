"use client"

import { motion } from "framer-motion"
import { use } from "react"
import { notFound } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  TicketIcon,
  Edit01Icon,
} from "@hugeicons/core-free-icons"
import { sampleEvents } from "@/lib/sample-data"
import { formatDate, formatCurrency, formatNumber, calculatePercentage } from "@/lib/utils"
import { QRCodeGenerator } from "@/organizer-components/events/qr-code-generator"
import { ShareCardGenerator } from "@/organizer-components/events/share-card-generator"

interface EventDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = use(params)
  const event = sampleEvents.find((e) => e.id === id)

  if (!event) {
    notFound()
  }

  const totalTickets = event.tiers.reduce((sum, tier) => sum + tier.total, 0)
  const soldTickets = event.tiers.reduce((sum, tier) => sum + tier.sold, 0)
  const totalRevenue = event.tiers.reduce(
    (sum, tier) => sum + tier.sold * tier.price,
    0
  )

  const getStatusColor = (status: typeof event.status) => {
    switch (status) {
      case "Live":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
      case "Published":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
      case "Draft":
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-6"
    >
      {/* Header Section */}
      <div className="flex items-start gap-4">
        <div className="relative size-20 overflow-hidden rounded-lg">
          <Image
            src={event.bannerUrl}
            alt={event.name}
            fill
            className="object-cover object-top"
            placeholder="empty"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Badge className={getStatusColor(event.status)}>{event.status}</Badge>
            <span className="text-sm text-muted-foreground">{formatNumber(soldTickets)}/{formatNumber(totalTickets)} sold</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{event.name}</h1>
          <p className="text-sm text-muted-foreground">{formatDate(event.startAt)} · {event.venue}, {event.city}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <HugeiconsIcon icon={TicketIcon} strokeWidth={2} className="size-4" />
            Gift tickets
          </Button>
          <Button size="sm" className="gap-2">
            <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} className="size-4" />
            View event page
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Share Card Generator */}
        <motion.div
          key={event.id} // Force re-mount on event change
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <ShareCardGenerator event={event} />
        </motion.div>

        {/* Right Column - QR Code & Ticket Tiers */}
        <div className="space-y-6">
          {/* Smart Link & QR */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <QRCodeGenerator eventId={event.id} eventName={event.name} />
          </motion.div>

          {/* Ticket Tiers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Ticket tiers</CardTitle>
                <p className="text-sm text-muted-foreground">Inventory and pricing overview.</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {event.tiers.map((tier) => {
                    const tierPercentage = calculatePercentage(tier.sold, tier.total)
                    return (
                      <div key={tier.id} className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold">{tier.name}</p>
                            <div className="mt-1 flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {formatNumber(tier.sold)} sold
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {formatNumber(tier.total - tier.sold)} remaining
                              </Badge>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Sales window: May 12, 2026 - Jun 18, 2026
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">{formatCurrency(tier.price)}</p>
                          </div>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                            style={{ width: `${tierPercentage}%` }}
                          />
                        </div>
                        {tier !== event.tiers[event.tiers.length - 1] && <Separator />}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
