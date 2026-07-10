"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { cn } from "@workspace/ui/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"

export function NavMain({
  sections,
}: {
  sections: {
    title: string
    items: {
      title: string
      url: string
      icon: React.ReactNode
      items?: {
        title: string
        url: string
      }[]
    }[]
  }[]
}) {
  return (
    <div className="flex flex-col gap-6 px-3 py-1">
      {sections.map((section) => (
        <div key={section.title}>
          <p className="mb-1.5 px-3 text-[11px] font-medium uppercase tracking-[0.08em] text-sidebar-foreground/35">
            {section.title}
          </p>
          <nav className="flex flex-col gap-0.5">
            {section.items.map((item) => (
              <NavItem key={item.title} item={item} />
            ))}
          </nav>
        </div>
      ))}
    </div>
  )
}

function NavItem({
  item,
}: {
  item: {
    title: string
    url: string
    icon: React.ReactNode
    items?: {
      title: string
      url: string
    }[]
  }
}) {
  const pathname = usePathname()
  const hasSubItems = item.items && item.items.length > 0

  // Determine if this item or any of its children is active
  const isActive = hasSubItems
    ? item.items!.some((sub) => pathname.startsWith(sub.url))
    : item.url === "/admin"
      ? pathname === item.url
      : pathname.startsWith(item.url)

  const [open, setOpen] = useState(isActive)

  // Leaf item — single link
  if (!hasSubItems) {
    return (
      <a
        href={item.url}
        data-active={isActive}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
          isActive
            ? "bg-lime-500 text-white shadow-xs"
            : "text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        )}
      >
        <span className="flex size-4 shrink-0 items-center justify-center">
          {item.icon}
        </span>
        <span>{item.title}</span>
      </a>
    )
  }

  // Expandable item — toggles sub-items
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        data-active={isActive}
        data-open={open}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
          isActive
            ? "bg-lime-500 text-white shadow-xs"
            : "text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        )}
      >
        <span className="flex size-4 shrink-0 items-center justify-center">
          {item.icon}
        </span>
        <span className="flex-1 text-left">{item.title}</span>
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          strokeWidth={2}
          className={cn(
            "size-3.5 text-sidebar-foreground/40 transition-transform duration-150",
            open && "rotate-90",
            isActive && "text-white/60"
          )}
        />
      </button>

      {/* Sub-items */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          open ? "mt-0.5 max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="ml-3 border-l border-sidebar-border/50 pl-3">
          {item.items!.map((sub) => {
            const isSubActive = pathname.startsWith(sub.url)
            return (
              <a
                key={sub.title}
                href={sub.url}
                data-active={isSubActive}
                className={cn(
                  "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                  isSubActive
                    ? "text-lime-600 dark:text-lime-400 font-semibold"
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                {sub.title}
              </a>
            )
          })}
        </div>
      </div>
    </div>
  )
}
