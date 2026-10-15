import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@workspace/ui/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  SmartPhone01Icon,
  Mail01Icon,
  CheckmarkCircle01Icon,
  AlertCircleIcon,
  GlobeIcon,
  EyeOffIcon,
  LockKeyIcon,
} from "@hugeicons/core-free-icons"

const badgeVariants = cva(
  "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:bg-red-100 aria-invalid:text-red-700 dark:aria-invalid:bg-red-900/30 dark:aria-invalid:text-red-400 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "bg-primary/15 text-primary [a]:hover:bg-primary/25",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 [a]:hover:bg-red-200/70 dark:[a]:hover:bg-red-900/40",
        success:
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 [a]:hover:bg-emerald-200/70 dark:[a]:hover:bg-emerald-900/40",
        warning:
          "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 [a]:hover:bg-amber-200/70 dark:[a]:hover:bg-amber-900/40",
        info:
          "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 [a]:hover:bg-sky-200/70 dark:[a]:hover:bg-sky-900/40",
        violet:
          "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 [a]:hover:bg-violet-200/70 dark:[a]:hover:bg-violet-900/40",
        pink:
          "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400 [a]:hover:bg-pink-200/70 dark:[a]:hover:bg-pink-900/40",
        orange:
          "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 [a]:hover:bg-orange-200/70 dark:[a]:hover:bg-orange-900/40",
        outline:
          "border border-border text-foreground bg-transparent [a]:hover:bg-muted/80",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

// ─── Category Badge Dictionary & Helper ──────────────────────────────────────

export const CATEGORY_BADGE_DICTIONARY: Record<string, BadgeVariant> = {
  // Entertainment & Music
  music: "violet",
  concert: "violet",
  nightlife: "violet",
  party: "violet",
  festival: "violet",

  // Arts & Culture
  "arts & culture": "pink",
  art: "pink",
  arts: "pink",
  culture: "pink",
  theatre: "pink",
  comedy: "pink",
  film: "pink",

  // Education & Workshops
  workshop: "info",
  education: "info",
  training: "info",
  seminar: "info",
  webinar: "info",
  classes: "info",

  // Tech & Business
  technology: "orange",
  tech: "orange",
  business: "orange",
  conference: "orange",
  startup: "orange",
  networking: "orange",

  // Sports & Wellness
  sports: "success",
  fitness: "success",
  health: "success",
  wellness: "success",
  yoga: "success",
  outdoor: "success",

  // Food & Community
  "food & drink": "warning",
  food: "warning",
  dining: "warning",
  cooking: "warning",
  charity: "success",
  community: "pink",
}

export function getCategoryBadgeVariant(category: string): BadgeVariant {
  const normalized = category.toLowerCase().trim()
  if (CATEGORY_BADGE_DICTIONARY[normalized]) {
    return CATEGORY_BADGE_DICTIONARY[normalized]
  }
  const fallbackPalette: BadgeVariant[] = [
    "violet",
    "pink",
    "orange",
    "info",
    "success",
    "warning",
    "default",
  ]
  const hash = normalized.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return fallbackPalette[hash % fallbackPalette.length]
}

export interface CategoryBadgeProps extends React.ComponentProps<typeof Badge> {
  category: string
}

export function CategoryBadge({
  category,
  className,
  variant,
  ...props
}: CategoryBadgeProps) {
  const resolvedVariant = variant || getCategoryBadgeVariant(category)

  return (
    <Badge
      variant={resolvedVariant}
      className={cn("border-0 shadow-none text-[11px] h-5 px-2.5 font-medium", className)}
      {...props}
    >
      {category}
    </Badge>
  )
}

// ─── Status Badge Dictionary & Helper ────────────────────────────────────────

export interface StatusBadgeConfig {
  variant: BadgeVariant
  dotClass: string
  label?: string
}

export const STATUS_BADGE_DICTIONARY: Record<string, StatusBadgeConfig> = {
  live: {
    variant: "success",
    dotClass: "bg-emerald-500 animate-pulse",
    label: "Live",
  },
  published: {
    variant: "info",
    dotClass: "bg-sky-500",
    label: "Published",
  },
  draft: {
    variant: "warning",
    dotClass: "bg-amber-500",
    label: "Draft",
  },
  scheduled: {
    variant: "info",
    dotClass: "bg-sky-500",
    label: "Scheduled",
  },
  completed: {
    variant: "success",
    dotClass: "bg-emerald-500",
    label: "Completed",
  },
  sending: {
    variant: "info",
    dotClass: "bg-sky-500 animate-pulse",
    label: "Sending",
  },
  paused: {
    variant: "warning",
    dotClass: "bg-amber-500",
    label: "Paused",
  },
  canceled: {
    variant: "destructive",
    dotClass: "bg-red-500",
    label: "Canceled",
  },
  cancelled: {
    variant: "destructive",
    dotClass: "bg-red-500",
    label: "Cancelled",
  },
  failed: {
    variant: "destructive",
    dotClass: "bg-red-500",
    label: "Failed",
  },
  archived: {
    variant: "outline",
    dotClass: "bg-muted-foreground",
    label: "Archived",
  },
  suspended: {
    variant: "destructive",
    dotClass: "bg-red-500",
    label: "Suspended",
  },
  revoked: {
    variant: "destructive",
    dotClass: "bg-red-500",
    label: "Revoked",
  },
  expired: {
    variant: "destructive",
    dotClass: "bg-red-500",
    label: "Expired",
  },
  rejected: {
    variant: "destructive",
    dotClass: "bg-red-500",
    label: "Rejected",
  },
  removed: {
    variant: "destructive",
    dotClass: "bg-red-500",
    label: "Removed",
  },
  active: {
    variant: "success",
    dotClass: "bg-emerald-500",
    label: "Active",
  },
  inactive: {
    variant: "secondary",
    dotClass: "bg-muted-foreground",
    label: "Inactive",
  },
  pending: {
    variant: "warning",
    dotClass: "bg-amber-500",
    label: "Pending",
  },
}

export function getStatusBadgeConfig(status?: string): StatusBadgeConfig {
  const normalized = (status || "").toLowerCase().trim()
  if (STATUS_BADGE_DICTIONARY[normalized]) {
    return STATUS_BADGE_DICTIONARY[normalized]
  }
  return {
    variant: "secondary",
    dotClass: "bg-muted-foreground",
    label: status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown",
  }
}

export interface StatusBadgeProps extends Omit<React.ComponentProps<typeof Badge>, "children"> {
  status?: string
  showDot?: boolean
  label?: string
}

export function StatusBadge({
  status = "draft",
  showDot = true,
  label,
  className,
  variant,
  ...props
}: StatusBadgeProps) {
  const config = getStatusBadgeConfig(status)
  const resolvedVariant = variant || config.variant
  const displayLabel = label || config.label || status

  return (
    <Badge
      variant={resolvedVariant}
      className={cn(
        "border-0 shadow-none text-[11px] font-semibold h-6 px-2.5 gap-1.5 capitalize",
        className
      )}
      {...props}
    >
      {showDot && <span className={cn("size-1.5 rounded-full shrink-0", config.dotClass)} />}
      <span>{displayLabel}</span>
    </Badge>
  )
}

// ─── Channel Badge Component & Helper ────────────────────────────────────────

export interface ChannelBadgeProps extends React.ComponentProps<typeof Badge> {
  channel?: "sms" | "email" | string
}

export function ChannelBadge({
  channel,
  className,
  ...props
}: ChannelBadgeProps) {
  const isSms = (channel || "").toLowerCase() === "sms"

  if (isSms) {
    return (
      <Badge
        variant="success"
        className={cn(
          "border border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 dark:bg-emerald-500/20 text-[11px] font-semibold h-5 px-2 gap-1 tracking-wide uppercase shadow-2xs",
          className
        )}
        {...props}
      >
        <HugeiconsIcon icon={SmartPhone01Icon} size={11} strokeWidth={2} />
        <span>SMS</span>
      </Badge>
    )
  }

  return (
    <Badge
      variant="info"
      className={cn(
        "border border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-400 dark:bg-sky-500/20 text-[11px] font-semibold h-5 px-2 gap-1 tracking-wide capitalize shadow-2xs",
        className
      )}
      {...props}
    >
      <HugeiconsIcon icon={Mail01Icon} size={11} strokeWidth={2} />
      <span>Email</span>
    </Badge>
  )
}

// ─── Role Badge Component & Helper ───────────────────────────────────────────

export function getRoleBadgeClass(role?: string | null): string {
  const r = (role || "").toLowerCase().trim()
  switch (r) {
    case "owner":
      return "border border-purple-500/35 bg-purple-500/15 text-purple-700 dark:text-purple-300 dark:bg-purple-500/25 dark:border-purple-500/40"
    case "admin":
      return "border border-sky-500/35 bg-sky-500/15 text-sky-700 dark:text-sky-300 dark:bg-sky-500/25 dark:border-sky-500/40"
    case "manager":
    case "coordinator":
      return "border border-blue-500/35 bg-blue-500/15 text-blue-700 dark:text-blue-300 dark:bg-blue-500/25 dark:border-blue-500/40"
    case "staff":
    case "scanner":
      return "border border-teal-500/35 bg-teal-500/15 text-teal-700 dark:text-teal-300 dark:bg-teal-500/25 dark:border-teal-500/40"
    default:
      return "border border-zinc-500/30 bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 dark:bg-zinc-500/25 dark:border-zinc-500/40"
  }
}

export interface RoleBadgeProps extends Omit<React.ComponentProps<typeof Badge>, "role"> {
  role?: string | null
}

export function RoleBadge({ role, className, ...props }: RoleBadgeProps) {
  if (!role) return null
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-4 px-1.5 text-[9px] font-semibold capitalize tracking-wide shadow-2xs",
        getRoleBadgeClass(role),
        className
      )}
      {...props}
    >
      {role}
    </Badge>
  )
}

// ─── Verification Badge Component & Helper ────────────────────────────────────

export function getVerificationBadgeClass(verified: boolean): string {
  return verified
    ? "border border-emerald-500/35 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 dark:bg-emerald-500/25 dark:border-emerald-500/40"
    : "border border-amber-500/35 bg-amber-500/15 text-amber-700 dark:text-amber-300 dark:bg-amber-500/25 dark:border-amber-500/40"
}

export interface VerificationBadgeProps extends React.ComponentProps<typeof Badge> {
  verified?: boolean
  unverifiedLabel?: string
  verifiedLabel?: string
  showIcon?: boolean
}

export function VerificationBadge({
  verified = false,
  unverifiedLabel = "Not Verified",
  verifiedLabel = "Verified",
  showIcon = true,
  className,
  ...props
}: VerificationBadgeProps) {
  if (verified) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "h-4 px-1.5 text-[10px] font-semibold gap-1 shadow-2xs",
          getVerificationBadgeClass(true),
          className
        )}
        {...props}
      >
        {showIcon && (
          <HugeiconsIcon
            icon={CheckmarkCircle01Icon}
            strokeWidth={2.5}
            className="size-2.5 text-emerald-600 dark:text-emerald-400 shrink-0"
          />
        )}
        <span>{verifiedLabel}</span>
      </Badge>
    )
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "h-4 px-1.5 text-[10px] font-semibold gap-1 shadow-2xs",
        getVerificationBadgeClass(false),
        className
      )}
      {...props}
    >
      {showIcon && (
        <HugeiconsIcon
          icon={AlertCircleIcon}
          strokeWidth={2.5}
          className="size-2.5 text-amber-600 dark:text-amber-400 shrink-0"
        />
      )}
      <span>{unverifiedLabel}</span>
    </Badge>
  )
}

// ─── Visibility Badge Component & Helper ──────────────────────────────────────

export function getVisibilityBadgeClass(visibility?: string | null): string {
  const v = (visibility || "").toLowerCase().trim()
  switch (v) {
    case "public":
      return "border border-sky-500/35 bg-sky-500/15 text-sky-700 dark:text-sky-300 dark:bg-sky-500/25 dark:border-sky-500/40"
    case "private":
      return "border border-violet-500/35 bg-violet-500/15 text-violet-700 dark:text-violet-300 dark:bg-violet-500/25 dark:border-violet-500/40"
    case "unlisted":
      return "border border-amber-500/35 bg-amber-500/15 text-amber-700 dark:text-amber-300 dark:bg-amber-500/25 dark:border-amber-500/40"
    default:
      return "border border-zinc-500/30 bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 dark:bg-zinc-500/25 dark:border-zinc-500/40"
  }
}

export interface VisibilityBadgeProps extends Omit<React.ComponentProps<typeof Badge>, "children"> {
  visibility?: "public" | "private" | "unlisted" | string | null
  showIcon?: boolean
  label?: string
  children?: React.ReactNode
}

export function VisibilityBadge({
  visibility = "public",
  showIcon = true,
  label,
  children,
  className,
  ...props
}: VisibilityBadgeProps) {
  if (!visibility) return null
  const normalized = (visibility || "").toLowerCase().trim()
  const displayLabel = label || children || (normalized.charAt(0).toUpperCase() + normalized.slice(1))

  const renderIcon = () => {
    if (!showIcon) return null
    switch (normalized) {
      case "public":
        return (
          <HugeiconsIcon
            icon={GlobeIcon}
            strokeWidth={2}
            className="size-3 text-sky-600 dark:text-sky-400 shrink-0"
          />
        )
      case "private":
        return (
          <HugeiconsIcon
            icon={EyeOffIcon}
            strokeWidth={2}
            className="size-3 text-violet-600 dark:text-violet-400 shrink-0"
          />
        )
      case "unlisted":
        return (
          <HugeiconsIcon
            icon={LockKeyIcon}
            strokeWidth={2}
            className="size-3 text-amber-600 dark:text-amber-400 shrink-0"
          />
        )
      default:
        return (
          <HugeiconsIcon
            icon={GlobeIcon}
            strokeWidth={2}
            className="size-3 shrink-0"
          />
        )
    }
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "h-6 px-2.5 text-[11px] font-semibold gap-1.5 capitalize rounded-full shadow-2xs",
        getVisibilityBadgeClass(visibility),
        className
      )}
      {...props}
    >
      {renderIcon()}
      <span>{displayLabel}</span>
    </Badge>
  )
}

export { Badge, badgeVariants }
