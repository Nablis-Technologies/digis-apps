import { AppSidebar } from "@/components/app-sidebar"
import { AuthGuard } from "@/components/auth-guard"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export const iframeHeight = "800px"

export const description = "A sidebar with a header and a search form."

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="pt-(--header-height) [--header-height:calc(--spacing(14))]">
        <SidebarProvider className="flex flex-col">
          <SiteHeader />
          <div className="flex flex-1">
            <AppSidebar />
            <SidebarInset className="flex min-w-0 flex-1 flex-col gap-4 p-4">
              {children}
            </SidebarInset>
          </div>
        </SidebarProvider>
      </div>
    </AuthGuard>
  )
}
