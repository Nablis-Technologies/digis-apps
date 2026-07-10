"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useTheme } from "next-themes"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Moon01Icon,
  Sun02Icon,
  UnfoldMoreIcon,
  NotificationIcon,
  LogoutIcon,
} from "@hugeicons/core-free-icons"
import { useLogoutMutation } from "@/store/reducers/authApi"

export function NavUser({
  user,
}: {
  user: {
    phone: string
    email: string
  }
}) {
  const { isMobile } = useSidebar()
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const router = useRouter()
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation()

  async function handleLogout() {
    try {
      await logout().unwrap()
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
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
                <span className="truncate font-medium">
                  {user.email}
                </span>
                <span className="truncate text-xs">
                  {user.phone ? user.phone : ""}
                </span>
              </div>
              <HugeiconsIcon
                icon={UnfoldMoreIcon}
                strokeWidth={2}
                className="ml-auto size-4"
              />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg text-xs font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {user.email}
                  </span>
                  <span className="truncate text-xs">
                    {user.phone ? user.phone : ""}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <Link href="/admin/notifications">
                <DropdownMenuItem className="justify-between">
                  <span className="flex items-center gap-2">
                    <HugeiconsIcon icon={NotificationIcon} strokeWidth={2} />
                    Notifications
                  </span>
                  <span className="flex size-5 items-center justify-center rounded-full bg-lime-500 text-[11px] font-semibold text-white">
                    3
                  </span>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem
                onSelect={() => setTheme(isDark ? "light" : "dark")}
              >
                <HugeiconsIcon
                  icon={isDark ? Sun02Icon : Moon01Icon}
                  strokeWidth={2}
                />
                {isDark ? "Light mode" : "Dark mode"}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout} disabled={isLoggingOut}>
              <HugeiconsIcon icon={LogoutIcon} strokeWidth={2} />
              {isLoggingOut ? "Logging out..." : "Log out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
