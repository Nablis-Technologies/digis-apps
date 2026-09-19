import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"

export interface PhoneInputProps
  extends Omit<React.ComponentProps<"input">, "type"> {
  countryCode?: string
  countryFlag?: string
  containerClassName?: string
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      className,
      containerClassName,
      countryCode = "+251",
      countryFlag = "🇪🇹",
      placeholder = "91 123 4567",
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <div
        className={cn(
          "flex h-10 w-full min-w-0 items-center rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow]",
          "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
          "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
          disabled && "cursor-not-allowed opacity-50",
          "dark:bg-input/30",
          containerClassName
        )}
      >
        <div className="flex h-full select-none items-center gap-1.5 border-r border-input bg-muted/40 px-3 text-xs font-semibold text-foreground shrink-0 rounded-l-md">
          <span className="text-base leading-none" role="img" aria-label="Country flag">
            {countryFlag}
          </span>
          <span className="font-mono text-xs text-muted-foreground">{countryCode}</span>
        </div>
        <input
          ref={ref}
          type="tel"
          disabled={disabled}
          placeholder={placeholder}
          data-slot="input"
          className={cn(
            "flex-1 h-full min-w-0 bg-transparent px-3 py-1 text-sm outline-none font-mono",
            "placeholder:text-muted-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "disabled:pointer-events-none disabled:cursor-not-allowed",
            className
          )}
          {...props}
        />
      </div>
    )
  }
)

export function normalizeEthiopianPhone(phone: string | null | undefined): string {
  if (!phone) return ""
  const digits = phone.replace(/\D/g, "")
  if (digits.startsWith("0") && digits.length === 10) {
    return `+251${digits.slice(1)}`
  }
  if (!digits.startsWith("251") && digits.length === 9) {
    return `+251${digits}`
  }
  if (digits.startsWith("251")) {
    return `+${digits}`
  }
  return phone.trim()
}

export function stripCountryCode(phone: string | null | undefined, code = "+251"): string {
  if (!phone) return ""
  let val = phone.trim()
  const rawCode = code.replace("+", "")
  if (val.startsWith(code)) {
    val = val.slice(code.length).trim()
  } else if (val.startsWith(rawCode)) {
    val = val.slice(rawCode.length).trim()
  } else if (val.startsWith("0") && val.length === 10) {
    val = val.slice(1)
  }
  return val
}

PhoneInput.displayName = "PhoneInput"

export { PhoneInput }
