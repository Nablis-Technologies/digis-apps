"use client"

import { cn } from "@/lib/utils"

export function NavSecondary({
  items,
  className,
}: {
  items: {
    title: string
    url: string
    icon: React.ReactNode
  }[]
  className?: string
}) {
  return (
    <div className={cn("px-3 py-1", className)}>
      <p className="mb-1.5 px-3 text-[11px] font-medium uppercase tracking-[0.08em] text-sidebar-foreground/35">
        Help
      </p>
      <nav className="flex flex-col gap-0.5">
        {items.map((item) => (
          <a
            key={item.title}
            href={item.url}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/60 transition-all duration-150 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          >
            <span className="flex size-4 shrink-0 items-center justify-center">
              {item.icon}
            </span>
            <span>{item.title}</span>
          </a>
        ))}
      </nav>
    </div>
  )
}
