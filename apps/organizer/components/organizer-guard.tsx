"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { isOnboardingComplete, getOrganizerAccount } from "@/lib/utils"

export function OrganizerGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkOnboarding = () => {
      // Skip check if already on onboarding page
      if (pathname === "/onboarding") {
        setIsChecking(false)
        return
      }

      const account = getOrganizerAccount()
      const isComplete = isOnboardingComplete()

      // If no account or onboarding not complete, redirect to onboarding
      if (!account || !isComplete) {
        router.replace("/onboarding")
        return
      }

      setIsChecking(false)
    }

    checkOnboarding()
  }, [pathname, router])

  if (isChecking) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-sm text-muted-foreground">Checking account status...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
