"use client"

import * as React from "react"
import Link from "next/link"
import { useActiveOrganization } from "../../../providers/organization-provider"
import { useGetMeQuery } from "@workspace/store/reducers/authApi"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Building02Icon,
  UserGroupIcon,
  UserCircleIcon,
  Wallet01Icon,
  ArrowRight01Icon,
  CheckmarkBadge01Icon,
  AlertCircleIcon,
  Settings05Icon,
} from "@hugeicons/core-free-icons"

export default function SettingsPage() {
  const { activeOrg } = useActiveOrganization()
  const { data: meData } = useGetMeQuery()
  const user = meData?.data?.user

  const settingsCards = [
    {
      title: "Organization Profile & Compliance",
      description: "Manage organization details, official addresses, brand logos, banners, and verification documents.",
      url: "/organizer/organization",
      icon: Building02Icon,
      badge: activeOrg?.verified ? (
        <Badge variant="outline" className="border-lime-500/30 text-lime-600 dark:text-lime-400 text-[10px]">
          Verified
        </Badge>
      ) : (
        <Badge variant="outline" className="border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px]">
          Unverified
        </Badge>
      ),
      highlight: activeOrg?.name || "Active Workspace",
    },
    {
      title: "Team Members & Permissions",
      description: "Invite coordinators and scanning staff, manage role permissions, and control team access.",
      url: "/organizer/team",
      icon: UserGroupIcon,
      badge: (
        <Badge variant="secondary" className="text-[10px]">
          Roles & Staff
        </Badge>
      ),
      highlight: "Admins & Staff",
    },
    {
      title: "Personal Profile & Security",
      description: "View your user UUID, manage contact channels, system permissions, and account sessions.",
      url: "/organizer/profile",
      icon: UserCircleIcon,
      badge: user?.verified_at ? (
        <Badge variant="outline" className="border-lime-500/30 text-lime-600 dark:text-lime-400 text-[10px]">
          Verified User
        </Badge>
      ) : null,
      highlight: user?.email || "Account Identity",
    },
    {
      title: "Payout Accounts & Finance",
      description: "Configure Telebirr, CBE Birr, or bank accounts to receive your ticket sales revenue.",
      url: "/organizer/payouts",
      icon: Wallet01Icon,
      badge: (
        <Badge variant="secondary" className="text-[10px]">
          Settlements
        </Badge>
      ),
      highlight: "Bank & Mobile Money",
    },
  ]

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Settings & Configuration</h1>
        <p className="text-sm text-muted-foreground">
          Centralized control hub for your organizer workspace, team access, and account preferences.
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {settingsCards.map((item, idx) => (
          <Link
            key={idx}
            href={item.url}
            className="group flex flex-col justify-between rounded-2xl border border-border/70 bg-card p-6 shadow-xs hover:border-lime-500/50 hover:bg-muted/10 transition-all"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="size-11 rounded-xl bg-lime-500/10 text-lime-600 dark:text-lime-400 flex items-center justify-center transition-transform group-hover:scale-105">
                  <HugeiconsIcon icon={item.icon} className="size-5.5" strokeWidth={2} />
                </div>
                {item.badge}
              </div>

              <div className="space-y-1.5">
                <h2 className="text-base font-bold text-foreground group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">
                  {item.title}
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-5 mt-4 border-t border-border/50 text-xs font-semibold text-muted-foreground group-hover:text-foreground">
              <span>{item.highlight}</span>
              <span className="flex items-center gap-1 text-lime-600 dark:text-lime-400">
                Configure <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
