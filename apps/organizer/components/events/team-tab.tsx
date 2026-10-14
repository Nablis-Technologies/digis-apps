"use client"

import { StaffTab } from "./staff-tab"
import { CollaboratorsSection } from "./collaborators-section"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { HugeiconsIcon } from "@hugeicons/react"
import { Building02Icon, Shield01Icon, UserGroupIcon } from "@hugeicons/core-free-icons"

interface TeamTabProps {
  eventId: string
  organizationId?: string
  primaryOrganization?: {
    id: string
    name: string
    slug?: string
  } | null
}

export function TeamTab({ eventId, organizationId, primaryOrganization }: TeamTabProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Primary Host Organization Spotlight */}
      {primaryOrganization && (
        <Card className="border border-border/70 bg-gradient-to-r from-card to-muted/20">
          <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-2xs">
                <HugeiconsIcon icon={Building02Icon} strokeWidth={2} className="size-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-foreground">{primaryOrganization.name}</h3>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] uppercase font-semibold">
                    Primary Host
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Principal organizer entity legally managing ticket sales, revenues, and event operations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Internal Event Staff Assignments */}
      <StaffTab eventId={eventId} organizationId={organizationId} />

      {/* External Collaborating Organizations */}
      <div className="pt-2">
        <CollaboratorsSection eventId={eventId} hidePrimarySpotlight={!!primaryOrganization} />
      </div>
    </div>
  )
}
