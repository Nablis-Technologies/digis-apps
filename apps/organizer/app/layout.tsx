import { Geist_Mono, Space_Grotesk } from "next/font/google"
import type { Metadata } from "next"

import "@workspace/ui/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@workspace/ui/lib/utils"
import { StoreProvider } from "@/components/store-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "sonner"

export const metadata: Metadata = {
  title: "DEGES Organizer - Event Management Platform",
  description: "Create and manage exceptional events with DEGES - Ethiopia's premier event management platform",
}

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", spaceGrotesk.variable)}
    >
      <body>
        <StoreProvider>
          <ThemeProvider>
            <TooltipProvider>
              {children}
              <Toaster richColors position="top-right" />
            </TooltipProvider>
          </ThemeProvider>
        </StoreProvider>
      </body>
    </html>
  )
}
