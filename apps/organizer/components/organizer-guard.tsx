"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useListOwnerOrganizationsQuery } from "@workspace/store/reducers/organizationsApi"

export function OrganizerGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { data, isLoading, isError } = useListOwnerOrganizationsQuery({ per_page: 5 })

  const organizations = data?.data ?? []
  const hasOrganizations = organizations.length > 0
  const isOnboardingOrgRoute = pathname === "/organizer/onboarding-org" || pathname === "/onboarding"

  useEffect(() => {
    if (isLoading) return

    // If user has NO organizations and is not already on an onboarding route,
    // redirect them to the organization onboarding page
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
