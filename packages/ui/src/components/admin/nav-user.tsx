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

export function NavUser({
  user,
}: {
  user: {
    phone: string
    email: string
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

  const initials = user.email
    ? user.email
        .split("@")[0]
        .split(".")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (user.email?.charAt(0).toUpperCase() ?? "?")

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarFallback className="rounded-lg text-xs font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{user.email}</span>
            <span className="truncate text-xs">
              {user.phone ? user.phone : ""}
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            <HugeiconsIcon
              icon={LogoutIcon}
              strokeWidth={2}
              className="size-4"
            />
          </button>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
