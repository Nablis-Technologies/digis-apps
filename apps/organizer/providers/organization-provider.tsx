"use client"

import * as React from "react"
import {
  useListOwnerOrganizationsQuery,
  type Organization,
} from "@workspace/store/reducers/organizationsApi"

export function canEnterWorkspace(org?: Organization | null): boolean {
  if (!org) return false
  if (org.archived === true) return false
  if (org.status === "suspended" || org.status === "removed") return false
  if (org.membership_status === "suspended" || org.membership_status === "removed") return false

  const role = org.membership_role?.toLowerCase()
  if (!role || !["owner", "admin", "staff"].includes(role)) return false

  return true
}

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

interface OrganizationContextValue {
  activeOrg: Organization | null
  activeOrgId: string | null
  setActiveOrgId: (id: string) => void
  organizations: Organization[]
  accessibleOrgs: Organization[]
  inaccessibleOrgs: Organization[]
  recentOrgs: Organization[]
  isLoading: boolean
  isError: boolean
  hasOrganizations: boolean
  hasAccessibleWorkspaces: boolean
  refetchOrganizations: () => void

  // Derived role and capability flags based on caller's active workspace membership
  membershipRole: "owner" | "admin" | "staff" | string | null
  membershipStatus: "active" | "suspended" | "removed" | string | null
  isOwner: boolean
  isAdmin: boolean
  isStaff: boolean
  isOwnerOrAdmin: boolean
  canExportAttendees: boolean
  canExportContactInfo: boolean
  canEnterWorkspace: (org?: Organization | null) => boolean
}

const OrganizationContext = React.createContext<OrganizationContextValue | null>(null)

const STORAGE_ACTIVE_ORG_KEY = "digis_active_org_id"
const STORAGE_RECENT_ORGS_KEY = "digis_recent_org_ids"

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading, isError, refetch } = useListOwnerOrganizationsQuery({ per_page: 50 })

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

  // Strictly use server-returned organizations for the authenticated user from GET /organizations/owner
  const organizations = React.useMemo(() => data?.data ?? [], [data?.data])

  // Determine accessible workspaces based on membership_role, membership_status, and archived status
  const accessibleOrgs = React.useMemo(() => {
    return organizations.filter(canEnterWorkspace)
  }, [organizations])

  const inaccessibleOrgs = React.useMemo(() => {
    return organizations.filter((org) => !canEnterWorkspace(org))
  }, [organizations])

  const activeOrg = React.useMemo(() => {
    // 1. Try to find activeOrgId in accessible workspaces first
    if (activeOrgId) {
      const accessibleMatch = accessibleOrgs.find((org) => org.id === activeOrgId)
      if (accessibleMatch) return accessibleMatch
    }
    // 2. Default to first accessible workspace if available
    if (accessibleOrgs.length > 0) {
      return accessibleOrgs[0]
    }
    // 3. Fallback to activeOrgId in all orgs or first org
    if (activeOrgId) {
      const anyMatch = organizations.find((org) => org.id === activeOrgId)
      if (anyMatch) return anyMatch
    }
    return organizations[0] ?? null
  }, [activeOrgId, accessibleOrgs, organizations])

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

  // Derived role flags from the caller's preloaded membership in activeOrg
  const rawRole = activeOrg?.membership_role?.toLowerCase() ?? null
  const isOwner = rawRole === "owner"
  const isAdmin = rawRole === "admin"
  const isStaff = rawRole === "staff"
  const isOwnerOrAdmin = isOwner || isAdmin

  // Permissions derived from workspace membership
  const canExportAttendees = isOwnerOrAdmin
  const canExportContactInfo = isOwnerOrAdmin

  const value = React.useMemo<OrganizationContextValue>(
    () => ({
      activeOrg,
      activeOrgId: activeOrg?.id ?? null,
      setActiveOrgId,
      organizations,
      accessibleOrgs,
      inaccessibleOrgs,
      recentOrgs,
      isLoading,
      isError,
      hasOrganizations: organizations.length > 0,
      hasAccessibleWorkspaces: accessibleOrgs.length > 0,
      refetchOrganizations: refetch,

      membershipRole: activeOrg?.membership_role ?? null,
      membershipStatus: activeOrg?.membership_status ?? null,
      isOwner,
      isAdmin,
      isStaff,
      isOwnerOrAdmin,
      canExportAttendees,
      canExportContactInfo,
      canEnterWorkspace,
    }),
    [
      activeOrg,
      setActiveOrgId,
      organizations,
      accessibleOrgs,
      inaccessibleOrgs,
      recentOrgs,
      isLoading,
      isError,
      refetch,
      isOwner,
      isAdmin,
      isStaff,
      isOwnerOrAdmin,
      canExportAttendees,
      canExportContactInfo,
    ]
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
