"use client"

import * as React from "react"
import { useGetMeQuery, useLogoutMutation } from "@workspace/store/reducers/authApi"
import { useListOwnerOrganizationsQuery } from "@workspace/store/reducers/organizationsApi"
import { useActiveOrganization } from "../../../providers/organization-provider"
import { CreateOrgDialog } from "../../../components/organizations/create-org-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  UserCircleIcon,
  Copy01Icon,
  CheckmarkCircle01Icon,
  Building02Icon,
  Shield01Icon,
  Logout01Icon,
  PlusSignIcon,
  Mail01Icon,
  SmartPhone01Icon,
  Calendar03Icon,
  Loading01Icon,
  ArrowRight01Icon,
  Key01Icon,
} from "@hugeicons/core-free-icons"
import Link from "next/link"

export default function ProfilePage() {
  const { data: meData, isLoading: meLoading, refetch: refetchMe } = useGetMeQuery()
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation()
  const { activeOrgId, setActiveOrgId } = useActiveOrganization()
  const { data: orgsData, isLoading: orgsLoading } = useListOwnerOrganizationsQuery({ per_page: 50 })

  const [copiedId, setCopiedId] = React.useState(false)
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)

  const user = meData?.data?.user
  const organizations = orgsData?.data ?? []

  const handleCopyId = () => {
    if (!user?.id) return
    navigator.clipboard.writeText(user.id)
    setCopiedId(true)
    toast.success("User ID copied to clipboard", {
      description: "You can share this ID with other organizations to be invited as a team member.",
    })
    setTimeout(() => setCopiedId(false), 2000)
  }

  const handleLogout = async () => {
    try {
      await logout().unwrap()
      toast.success("Logged out successfully")
      window.location.href = "/"
    } catch {
      window.location.href = "/"
    }
  }

  if (meLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <HugeiconsIcon icon={Loading01Icon} className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "ME"

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Personal Profile</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account identity, security credentials, and organization workspaces.
        </p>
      </div>

      {/* User Identity Card */}
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs">
        <div className="h-28 bg-gradient-to-r from-lime-500/20 via-emerald-500/15 to-teal-500/20" />
        <div className="relative px-6 pb-6 pt-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between -mt-12">
            <div className="flex items-end gap-4">
              <div className="flex size-24 shrink-0 items-center justify-center rounded-2xl border-4 border-card bg-muted text-2xl font-bold text-foreground shadow-md">
                {initials}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold text-foreground">
                    {user?.name || user?.email?.split("@")[0] || "Organizer"}
                  </h2>
                  {user?.verified_at ? (
                    <Badge variant="outline" className="border-lime-500/30 bg-lime-500/10 text-lime-600 dark:text-lime-400 gap-1 font-medium">
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-3.5" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
                      Unverified
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-mono">{user?.email}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyId}
                className="gap-1.5 text-xs"
              >
                <HugeiconsIcon
                  icon={copiedId ? CheckmarkCircle01Icon : Copy01Icon}
                  className="size-3.5 text-muted-foreground"
                />
                {copiedId ? "ID Copied" : "Copy User ID"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchMe()}
                className="text-xs"
              >
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Details & Organizations */}
        <div className="space-y-6 lg:col-span-2">
          {/* Account Details */}
          <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs space-y-4">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <HugeiconsIcon icon={UserCircleIcon} className="size-4.5 text-lime-600 dark:text-lime-400" />
              Account Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border/50 bg-muted/20 p-3.5 space-y-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <HugeiconsIcon icon={Mail01Icon} className="size-3.5" /> Email Address
                </span>
                <p className="text-sm font-semibold text-foreground break-all">{user?.email || "—"}</p>
              </div>

              <div className="rounded-xl border border-border/50 bg-muted/20 p-3.5 space-y-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <HugeiconsIcon icon={SmartPhone01Icon} className="size-3.5" /> Phone Number
                </span>
                <p className="text-sm font-semibold text-foreground font-mono">
                  {user?.phone ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span>🇪🇹</span>
                      <span>{user.phone}</span>
                    </span>
                  ) : (
                    "—"
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-border/50 bg-muted/20 p-3.5 space-y-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <HugeiconsIcon icon={Key01Icon} className="size-3.5" /> User UUID
                </span>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-mono text-foreground truncate">{user?.id || "—"}</p>
                  <button
                    onClick={handleCopyId}
                    className="text-xs text-muted-foreground hover:text-foreground shrink-0"
                    title="Copy UUID"
                  >
                    <HugeiconsIcon icon={Copy01Icon} className="size-3.5" />
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-border/50 bg-muted/20 p-3.5 space-y-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <HugeiconsIcon icon={Calendar03Icon} className="size-3.5" /> Member Since
                </span>
                <p className="text-sm font-semibold text-foreground">
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                    : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Associated Organizations */}
          <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <HugeiconsIcon icon={Building02Icon} className="size-4.5 text-lime-600 dark:text-lime-400" />
                  My Organizations
                </h3>
                <p className="text-xs text-muted-foreground">
                  Organizations where you have an active ownership or team membership.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setCreateDialogOpen(true)}
                className="gap-1.5 bg-lime-500 text-zinc-950 hover:bg-lime-400 font-semibold"
              >
                <HugeiconsIcon icon={PlusSignIcon} className="size-4" strokeWidth={2.5} />
                New Org
              </Button>
            </div>

            {orgsLoading ? (
              <div className="flex h-32 items-center justify-center">
                <HugeiconsIcon icon={Loading01Icon} className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : organizations.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/80 p-8 text-center space-y-3">
                <div className="mx-auto size-12 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground">
                  <HugeiconsIcon icon={Building02Icon} className="size-6" />
                </div>
                <p className="text-sm font-medium">No organizations linked yet</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Create a new organization to start hosting events or ask an organization owner to invite you using your User ID.
                </p>
                <Button
                  size="sm"
                  onClick={() => setCreateDialogOpen(true)}
                  className="bg-lime-500 text-zinc-950 hover:bg-lime-400"
                >
                  Create Organization
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {organizations.map((org) => {
                  const isActive = org.id === activeOrgId
                  return (
                    <div
                      key={org.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border transition-colors ${isActive
                          ? "border-lime-500/50 bg-lime-500/5"
                          : "border-border/60 bg-muted/10 hover:bg-muted/30"
                        }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-10 rounded-lg bg-card border border-border/70 flex items-center justify-center font-bold text-sm text-foreground shrink-0 overflow-hidden">
                          {org.profile_url ? (
                            <img src={org.profile_url} alt={org.name} className="w-full h-full object-cover" />
                          ) : (
                            org.name.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm truncate">{org.name}</span>
                            {isActive && (
                              <Badge className="bg-lime-500 text-zinc-950 text-[10px] font-bold px-1.5 py-0">
                                Active Workspace
                              </Badge>
                            )}
                            {org.verified && (
                              <Badge variant="outline" className="border-lime-500/30 text-lime-600 dark:text-lime-400 text-[10px] px-1.5 py-0">
                                Verified
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground capitalize">
                            {org.organizer_type} • {org.category || "General"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {!isActive ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setActiveOrgId(org.id)
                              toast.success(`Switched active workspace to ${org.name}`)
                            }}
                            className="text-xs"
                          >
                            Switch Workspace
                          </Button>
                        ) : (
                          <Link href="/organizer/organization">
                            <Button variant="secondary" size="sm" className="text-xs gap-1">
                              Manage <HugeiconsIcon icon={ArrowRight01Icon} className="size-3" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Roles & Security */}
        <div className="space-y-6">
          {/* Account Roles */}
          <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs space-y-4">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <HugeiconsIcon icon={Shield01Icon} className="size-4.5 text-lime-600 dark:text-lime-400" />
              Account Roles
            </h3>

            <div>
              <span className="text-xs text-muted-foreground">Assigned System Roles</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {user?.roles && user.roles.length > 0 ? (
                  user.roles.map((r, i) => (
                    <Badge key={i} variant="secondary" className="text-xs font-mono">
                      {r.name || r.code}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="secondary" className="text-xs font-mono">
                    {user?.role || "ORGANIZER"}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Account Security */}
          <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs space-y-4">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <HugeiconsIcon icon={Key01Icon} className="size-4.5 text-lime-600 dark:text-lime-400" />
              Account Session
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your active session is secured with JWT tokens. You can log out from this device anytime.
            </p>

            <div className="pt-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full gap-1.5 text-xs font-semibold"
              >
                <HugeiconsIcon icon={Logout01Icon} className="size-4" />
                {isLoggingOut ? "Signing out..." : "Sign Out of Account"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Organization Dialog */}
      <CreateOrgDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  )
}
