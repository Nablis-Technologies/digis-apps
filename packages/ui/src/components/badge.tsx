import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@workspace/ui/lib/utils"

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
          "bg-muted text-muted-foreground [a]:hover:bg-muted/80",
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

export { Badge, badgeVariants }
