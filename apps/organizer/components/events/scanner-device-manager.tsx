"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { HugeiconsIcon } from "@hugeicons/react"
import { Copy01Icon, SmartPhone01Icon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"
import { motion } from "framer-motion"

interface ScannerDevice {
  id: string
  label: string
  phone: string
  inviteCode: string
  status: "active" | "invited" | "inactive"
}

interface ScannerDeviceManagerProps {
  eventId: string
}

export function ScannerDeviceManager({ eventId }: ScannerDeviceManagerProps) {
  const [devices, setDevices] = useState<ScannerDevice[]>([
    {
      id: "scanner-01",
      label: "Gate A",
      phone: "+251 911 123 456",
      inviteCode: "INV-9D2K",
      status: "active",
    },
    {
      id: "scanner-02",
      label: "VIP Lounge",
      phone: "+251 922 556 712",
      inviteCode: "INV-7Q8F",
      status: "invited",
    },
  ])

  const [deviceLabel, setDeviceLabel] = useState("")
  const [devicePhone, setDevicePhone] = useState("")

  const handleAddDevice = () => {
    if (!deviceLabel || !devicePhone) {
      toast.error("Please fill in all fields")
      return
    }

    const inviteCode = `INV-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

    const newDevice: ScannerDevice = {
      id: `scanner-${devices.length + 1}`,
      label: deviceLabel,
      phone: devicePhone,
      inviteCode,
      status: "invited",
    }

    setDevices([...devices, newDevice])
    setDeviceLabel("")
    setDevicePhone("")

    toast.success(`Scanner device "${deviceLabel}" added successfully`)
  }

  const handleCopyInviteCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      toast.success("Invite code copied to clipboard")
    } catch (error) {
      toast.error("Failed to copy invite code")
    }
  }

  const getStatusColor = (status: ScannerDevice["status"]) => {
    switch (status) {
      case "active":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
      case "invited":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
      case "inactive":
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={SmartPhone01Icon} strokeWidth={2} className="size-5" />
          <CardTitle>Gate scanner devices</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Invite staff scanners and monitor their status
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Device Form */}
        <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="device-label">Device label</Label>
              <Input
                id="device-label"
                placeholder="Main entrance"
                value={deviceLabel}
                onChange={(e) => setDeviceLabel(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="device-phone">Phone number</Label>
              <Input
                id="device-phone"
                placeholder="+251 900 000 000"
                value={devicePhone}
                onChange={(e) => setDevicePhone(e.target.value)}
              />
            </div>
          </div>
          <Button
            onClick={handleAddDevice}
            className="w-full bg-gradient-to-r from-orange-500 to-pink-500"
          >
            Add scanner device
          </Button>
        </div>

        {/* Devices Table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Invite code</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.map((device) => (
                <TableRow key={device.id}>
                  <TableCell className="font-semibold">{device.label}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {device.phone}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-muted px-2 py-1 text-sm">
                        {device.inviteCode}
                      </code>
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => handleCopyInviteCode(device.inviteCode)}
                        >
                          <HugeiconsIcon
                            icon={Copy01Icon}
                            strokeWidth={2}
                            className="size-3.5"
                          />
                        </Button>
                      </motion.div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(device.status)}>
                      {device.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Total devices</p>
            <p className="text-2xl font-bold">{devices.length}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-emerald-600">
              {devices.filter((d) => d.status === "active").length}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">
              {devices.filter((d) => d.status === "invited").length}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
