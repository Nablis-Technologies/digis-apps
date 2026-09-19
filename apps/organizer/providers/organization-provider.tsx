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

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading, refetch } = useListOwnerOrganizationsQuery({ per_page: 50 })
  const organizations = React.useMemo(() => data?.data ?? [], [data?.data])
  const [activeOrgId, setActiveOrgIdState] = React.useState<string | null>(null)
  const [recentOrgIds, setRecentOrgIds] = React.useState<string[]>([])

  // Initialize from localStorage once organizations are loaded or on client mount
  React.useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const storedActiveId = localStorage.getItem(STORAGE_ACTIVE_ORG_KEY)
      const storedRecent = JSON.parse(
        localStorage.getItem(STORAGE_RECENT_ORGS_KEY) || "[]"
      ) as string[]
      setRecentOrgIds(storedRecent)

      if (organizations.length > 0) {
        const found = organizations.find((org) => org.id === storedActiveId)
        if (found) {
          setActiveOrgIdState(found.id)
        } else {
          // Default to the first organization if none stored or invalid
          const firstId = organizations[0]?.id ?? null
          setActiveOrgIdState(firstId)
          if (firstId) {
            localStorage.setItem(STORAGE_ACTIVE_ORG_KEY, firstId)
            document.cookie = `active_org_id=${firstId}; path=/; max-age=31536000; SameSite=Lax`
          }
        }
      }
    } catch (e) {
      console.error("Failed to read organization state from localStorage", e)
    }
  }, [organizations])

  // Sync across tabs
  React.useEffect(() => {
    if (typeof window === "undefined") return

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_ACTIVE_ORG_KEY && e.newValue) {
        setActiveOrgIdState(e.newValue)
      }
      if (e.key === STORAGE_RECENT_ORGS_KEY && e.newValue) {
        try {
          setRecentOrgIds(JSON.parse(e.newValue))
        } catch {
          // ignore
        }
      }
    }

    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [])

  const setActiveOrgId = React.useCallback(
    (id: string) => {
      setActiveOrgIdState(id)
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_ACTIVE_ORG_KEY, id)
          document.cookie = `active_org_id=${id}; path=/; max-age=31536000; SameSite=Lax`

          // Update recents
          const updatedRecents = [id, ...recentOrgIds.filter((item) => item !== id)].slice(0, 5)
          setRecentOrgIds(updatedRecents)
          localStorage.setItem(STORAGE_RECENT_ORGS_KEY, JSON.stringify(updatedRecents))
        } catch (e) {
          console.error("Failed to persist active org", e)
        }
      }
    },
    [recentOrgIds]
  )

  const activeOrg = React.useMemo(() => {
    if (!activeOrgId && organizations.length > 0) return organizations[0] ?? null
    return organizations.find((org) => org.id === activeOrgId) ?? organizations[0] ?? null
  }, [activeOrgId, organizations])

  const recentOrgs = React.useMemo(() => {
    return recentOrgIds
      .map((id) => organizations.find((org) => org.id === id))
      .filter((org): org is Organization => org !== undefined)
  }, [recentOrgIds, organizations])

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
