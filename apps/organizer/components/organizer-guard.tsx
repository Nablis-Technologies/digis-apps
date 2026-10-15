"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useActiveOrganization } from "../providers/organization-provider"
import { useLogoutMutation } from "@workspace/store/reducers/authApi"
import { Button } from "@/components/ui/button"
import { Badge, RoleBadge } from "@/components/ui/badge"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AlertCircleIcon,
  Add01Icon,
  Logout01Icon,
  Building02Icon,
} from "@hugeicons/core-free-icons"

export function OrganizerGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const {
    organizations,
    hasOrganizations,
    hasAccessibleWorkspaces,
    isLoading,
    isError,
  } = useActiveOrganization()
  const [logout] = useLogoutMutation()

  const isOnboardingOrgRoute =
    pathname === "/organizer/onboarding-org" || pathname === "/onboarding"

  useEffect(() => {
    if (isLoading) return

    // If user has NO organizations and is not already on an onboarding route,
    // redirect them to the organization onboarding page to set up their first workspace
    if (!hasOrganizations && !isOnboardingOrgRoute) {
      router.replace("/organizer/onboarding-org")
    }
  }, [isLoading, hasOrganizations, isOnboardingOrgRoute, router])

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-sm text-muted-foreground">Checking organizer workspaces...</p>
        </div>
      </div>
    )
  }

  // If user has no organizations and is on onboarding route, render children (the onboarding page)
  if (!hasOrganizations && isOnboardingOrgRoute) {
    return <>{children}</>
  }

  // If user has organizations, but all of them are suspended or archived (no accessible workspaces)
  if (hasOrganizations && !hasAccessibleWorkspaces) {
    // If they navigated to onboarding route to create a new organization, allow it
    if (isOnboardingOrgRoute) {
      return <>{children}</>
    }

    // Otherwise, show a clear blocked workspace access screen explaining why
    return (
      <div className="flex min-h-svh items-center justify-center p-6 bg-muted/20">
        <div className="w-full max-w-lg rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-lg text-center space-y-6">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
            <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              No Accessible Workspaces Found
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your account belongs to organizations, but you currently do not have active access to enter any of them due to membership suspension or workspace archival.
            </p>
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-left space-y-2 max-h-56 overflow-y-auto">
            {organizations.map((org) => {
              const isSuspended =
                org.membership_status === "suspended" || org.status === "suspended"
              const isArchived = org.archived === true

              return (
                <div
                  key={org.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-background border border-border/50 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <HugeiconsIcon
                      icon={Building02Icon}
                      className="size-4 text-muted-foreground shrink-0"
                    />
                    <div className="truncate font-medium text-foreground">
                      {org.name}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {org.membership_role && (
                      <RoleBadge role={org.membership_role} />
                    )}
                    {isArchived ? (
                      <Badge variant="outline" className="text-[10px] border border-zinc-500/35 bg-zinc-500/15 text-zinc-600 dark:text-zinc-400">
                        Archived
                      </Badge>
                    ) : isSuspended ? (
                      <Badge variant="destructive" className="text-[10px] border border-red-500/35 bg-red-500/15 text-red-600 dark:text-red-400">
                        Suspended
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] border border-amber-500/35 bg-amber-500/15 text-amber-700 dark:text-amber-300">
                        Restricted
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              type="button"
              className="w-full sm:w-auto gap-2"
              onClick={() => router.push("/organizer/onboarding-org")}
            >
              <HugeiconsIcon icon={Add01Icon} className="size-4" />
              Create New Organization
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto gap-2"
              onClick={async () => {
                try {
                  await logout().unwrap()
                } catch {
                  // ignore
                }
                router.replace("/")
              }}
            >
              <HugeiconsIcon icon={Logout01Icon} className="size-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // If user has no organizations and not yet redirected, keep loading screen
  if (!hasOrganizations && !isError) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-sm text-muted-foreground">Preparing your workspace setup...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
