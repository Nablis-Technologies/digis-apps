"use client"

import * as React from "react"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@workspace/ui/components/tabs"
import { cn } from "@workspace/ui/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"

export interface PageTabItem {
  value: string
  label: React.ReactNode
  icon?: any
  count?: number | string
  badge?: React.ReactNode
  indicator?: boolean | React.ReactNode
  disabled?: boolean
  className?: string
}

export interface PageTabsProps extends React.ComponentProps<typeof Tabs> {
  tabs?: PageTabItem[]
  actions?: React.ReactNode
  listClassName?: string
  containerClassName?: string
  triggerClassName?: string
  children?: React.ReactNode
}

export interface PageTabsListProps
  extends React.ComponentProps<typeof TabsList> {
  actions?: React.ReactNode
  containerClassName?: string
}

export interface PageTabTriggerProps
  extends React.ComponentProps<typeof TabsTrigger> {
  icon?: any
  label?: React.ReactNode
  count?: number | string
  badge?: React.ReactNode
  indicator?: boolean | React.ReactNode
}

export function PageTabTrigger({
  value,
  icon,
  label,
  count,
  badge,
  indicator,
  className,
  children,
  ...props
}: PageTabTriggerProps) {
  return (
    <TabsTrigger
      value={value}
      className={cn(
        "group relative inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap border-b-2 border-transparent px-4 py-2 text-sm font-medium transition-all duration-150 outline-none select-none cursor-pointer",
        "text-muted-foreground hover:text-foreground hover:bg-muted/30",
        "focus-visible:ring-2 focus-visible:ring-ring/50",
        "disabled:pointer-events-none disabled:opacity-50",
        "data-[state=active]:border-foreground data-[state=active]:text-foreground data-[state=active]:font-semibold",
        className
      )}
      {...props}
    >
      {icon && (
        <HugeiconsIcon
          icon={icon}
          strokeWidth={2}
          className="size-4 shrink-0 transition-colors"
        />
      )}
      <span className="truncate">{children ?? label}</span>
      {count !== undefined && (
        <span className="ml-1 rounded-full bg-muted/80 px-2 py-0.5 text-xs font-mono font-medium text-muted-foreground transition-colors group-data-[state=active]:bg-foreground/10 group-data-[state=active]:text-foreground">
          {count}
        </span>
      )}
      {indicator === true ? (
        <span className="relative ml-0.5 flex size-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-amber-500" />
        </span>
      ) : (
        indicator
      )}
      {badge}
    </TabsTrigger>
  )
}

export function PageTabsList({
  actions,
  className,
  containerClassName,
  children,
  ...props
}: PageTabsListProps) {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-between gap-3 border-b border-border overflow-hidden",
        containerClassName
      )}
    >
      <TabsList
        className={cn(
          "flex h-10 w-full items-center justify-start gap-0 border-b-0 bg-transparent p-0 text-muted-foreground overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
          className
        )}
        {...props}
      >
        {children}
      </TabsList>
      {actions && (
        <div className="shrink-0 flex items-center gap-2 pb-1 sm:pb-0">
          {actions}
        </div>
      )}
    </div>
  )
}

export function PageTabs({
  tabs,
  actions,
  className,
  listClassName,
  containerClassName,
  triggerClassName,
  children,
  ...props
}: PageTabsProps) {
  return (
    <Tabs className={cn("flex flex-col gap-4", className)} {...props}>
      {tabs && tabs.length > 0 ? (
        <PageTabsList
          actions={actions}
          className={listClassName}
          containerClassName={containerClassName}
        >
          {tabs.map((tab) => (
            <PageTabTrigger
              key={tab.value}
              value={tab.value}
              icon={tab.icon}
              label={tab.label}
              count={tab.count}
              badge={tab.badge}
              indicator={tab.indicator}
              disabled={tab.disabled}
              className={cn(tab.className, triggerClassName)}
            />
          ))}
        </PageTabsList>
      ) : null}
      {children}
    </Tabs>
  )
}

export { TabsContent as PageTabsContent }
