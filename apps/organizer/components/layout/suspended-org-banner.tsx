"use client"

import * as React from "react"
import { useActiveOrganization, isOrgSuspendedOrRemoved } from "@/providers/organization-provider"
import { HugeiconsIcon } from "@hugeicons/react"
import { AlertCircleIcon, ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"

export function SuspendedOrgBanner() {
  const { activeOrg, organizations, setActiveOrgId } = useActiveOrganization()
  const isSuspended = isOrgSuspendedOrRemoved(activeOrg)

  if (!isSuspended || !activeOrg) return null

  // Find another organization where the user is NOT suspended, if any
  const alternateActiveOrg = organizations.find((org) => !isOrgSuspendedOrRemoved(org))

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-900 dark:text-red-200 shadow-2xs animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-start gap-3">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-red-500/20 text-red-600 dark:text-red-400 mt-0.5 sm:mt-0">
          <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2.5} className="size-4" />
        </div>
        <div className="text-xs">
          <p className="font-semibold text-red-700 dark:text-red-300">
            Account Access Suspended: <span className="font-bold">{activeOrg.name}</span>
          </p>
          <p className="text-red-700/80 dark:text-red-300/80 mt-0.5 leading-relaxed">
            Your membership in this organization is suspended. You have read-only access and cannot create events, update tickets, or manage payouts. Contact the organization owner to restore full access.
          </p>
        </div>
      </div>

      {alternateActiveOrg && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setActiveOrgId(alternateActiveOrg.id)}
          className="shrink-0 h-8 text-xs border-red-500/40 text-red-700 dark:text-red-300 hover:bg-red-500/20 hover:text-red-900 cursor-pointer gap-1.5 font-medium ml-auto sm:ml-0"
        >
          Switch to {alternateActiveOrg.name}
          <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-3" />
        </Button>
      )}
    </div>
  )
}
