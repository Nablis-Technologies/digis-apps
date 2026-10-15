"use client"

import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import { LogoutIcon } from "@hugeicons/core-free-icons"
import { useLogoutMutation } from "@workspace/store/reducers/authApi"
import { toastSuccess } from "@workspace/ui/lib/toast"

import { UserAvatar } from "./user-avatar"

export function NavUser({
  user,
}: {
  user: {
    phone?: string
    email?: string
    name?: string
    profile?: {
      first_name?: string
      last_name?: string
      full_name?: string
      avatar_url?: string | null
    } | null
  }
}) {
  const router = useRouter()
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation()

  async function handleLogout() {
    try {
      await logout().unwrap()
      toastSuccess("Logged out.")
    } catch {
      // tokens cleared in onQueryStarted regardless
    } finally {
      router.replace("/")
    }
  }

  const primaryLabel = user.profile?.full_name || user.name || user.email || "Account"
  const secondaryLabel = user.profile?.full_name
    ? user.email || user.phone || ""
    : user.phone || ""

  return (
    <SidebarMenu>
      <SidebarMenuItem className="flex items-center gap-1">
        <SidebarMenuButton size="lg" className="flex-1 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
          <UserAvatar user={user} className="h-8 w-8 rounded-lg" />
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">
              {primaryLabel}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {secondaryLabel}
            </span>
          </div>
        </SidebarMenuButton>
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
        >
          <HugeiconsIcon icon={LogoutIcon} strokeWidth={2} className="size-4" />
        </button>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
