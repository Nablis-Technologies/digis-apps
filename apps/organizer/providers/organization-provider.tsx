"use client"

import * as React from "react"
import {
  useListOwnerOrganizationsQuery,
  type Organization,
} from "@workspace/store/reducers/organizationsApi"

interface OrganizationContextValue {
  activeOrg: Organization | null
  activeOrgId: string | null
  setActiveOrgId: (id: string) => void
  organizations: Organization[]
  recentOrgs: Organization[]
  isLoading: boolean
  hasOrganizations: boolean
  refetchOrganizations: () => void
}

const OrganizationContext = React.createContext<OrganizationContextValue | null>(null)

const STORAGE_ACTIVE_ORG_KEY = "digis_active_org_id"
const STORAGE_RECENT_ORGS_KEY = "digis_recent_org_ids"

export function isOrgSuspendedOrRemoved(org?: Organization | null): boolean {
  if (!org) return false
  return (
    org.membership_status === "suspended" ||
    org.membership_status === "removed" ||
    org.status === "suspended" ||
    org.status === "removed" ||
    org.archived === true
  )
}

export const isOrgSuspended = isOrgSuspendedOrRemoved

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading, refetch } = useListOwnerOrganizationsQuery({ per_page: 50 })

  // Initialize from localStorage safely once on mount via lazy initializers
  const [activeOrgId, setActiveOrgIdState] = React.useState<string | null>(() => {
    if (typeof window === "undefined") return null
    try {
      return localStorage.getItem(STORAGE_ACTIVE_ORG_KEY)
    } catch {
      return null
    }
  })

  const [recentOrgIds, setRecentOrgIds] = React.useState<string[]>(() => {
    if (typeof window === "undefined") return []
    try {
      return JSON.parse(localStorage.getItem(STORAGE_RECENT_ORGS_KEY) || "[]")
    } catch {
      return []
    }
  })

  // Clean up any legacy cached orgs from prior sessions to prevent cross-account pollution
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("digis_cached_orgs_meta")
      } catch {
        // ignore
      }
    }
  }, [])

  // Strictly use server-returned organizations for the authenticated user
  const organizations = React.useMemo(() => data?.data ?? [], [data?.data])

  const activeOrg = React.useMemo(() => {
    if (activeOrgId) {
      const match = organizations.find((org) => org.id === activeOrgId)
      if (match) return match
    }
    const firstActive = organizations.find((org) => !isOrgSuspendedOrRemoved(org))
    return firstActive ?? organizations[0] ?? null
  }, [activeOrgId, organizations])

  const recentOrgs = React.useMemo(() => {
    return recentOrgIds
      .map((id) => organizations.find((org) => org.id === id))
      .filter((org): org is Organization => org !== undefined)
  }, [recentOrgIds, organizations])

  const setActiveOrgId = React.useCallback((id: string) => {
    setActiveOrgIdState(id)
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_ACTIVE_ORG_KEY, id)
        document.cookie = `active_org_id=${id}; path=/; max-age=31536000; SameSite=Lax`

        // Update recents
        setRecentOrgIds((prev) => {
          const next = [id, ...prev.filter((item) => item !== id)].slice(0, 5)
          if (next.length === prev.length && next.every((val, idx) => val === prev[idx])) {
            return prev
          }
          localStorage.setItem(STORAGE_RECENT_ORGS_KEY, JSON.stringify(next))
          return next
        })
      } catch (e) {
        console.error("Failed to persist active org", e)
      }
    }
  }, [])

  // Synchronize active organization cookie and localStorage with the derived activeOrg
  React.useEffect(() => {
    if (!activeOrg?.id || typeof window === "undefined") return
    try {
      if (localStorage.getItem(STORAGE_ACTIVE_ORG_KEY) !== activeOrg.id) {
        localStorage.setItem(STORAGE_ACTIVE_ORG_KEY, activeOrg.id)
      }
      document.cookie = `active_org_id=${activeOrg.id}; path=/; max-age=31536000; SameSite=Lax`
    } catch {
      // ignore
    }
  }, [activeOrg?.id])

  // Sync across tabs
  React.useEffect(() => {
    if (typeof window === "undefined") return

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_ACTIVE_ORG_KEY && e.newValue) {
        setActiveOrgIdState(e.newValue)
      }
      if (e.key === STORAGE_RECENT_ORGS_KEY && e.newValue) {
        try {
          const next = JSON.parse(e.newValue)
          if (Array.isArray(next)) {
            setRecentOrgIds((prev) => {
              if (next.length === prev.length && next.every((val, idx) => val === prev[idx])) {
                return prev
              }
              return next
            })
          }
        } catch {
          // ignore
        }
      }
    }

    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [])

  const value = React.useMemo<OrganizationContextValue>(
    () => ({
      activeOrg,
      activeOrgId: activeOrg?.id ?? null,
      setActiveOrgId,
      organizations,
      recentOrgs,
      isLoading,
      hasOrganizations: organizations.length > 0,
      refetchOrganizations: refetch,
    }),
    [activeOrg, setActiveOrgId, organizations, recentOrgs, isLoading, refetch]
  )

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  )
}

export function useActiveOrganization(): OrganizationContextValue {
  const context = React.useContext(OrganizationContext)
  if (!context) {
    throw new Error("useActiveOrganization must be used within an OrganizationProvider")
  }
  return context
}
