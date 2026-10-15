"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  WalletIcon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  Clock01Icon,
  CreditCardIcon,
  Calendar03Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { useGetRefundQuery } from "@/store/reducers/refundsApi"

function fmtCurrency(amountMinor: number | undefined, currency?: string) {
  if (amountMinor == null) return "—"
  const amount = amountMinor / 100
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency ?? "ETB",
  }).format(amount)
}

function StatusBadge({ status }: { status: string }) {
  const lower = String(status ?? "").toLowerCase()
  const approved = lower.includes("approv") || lower === "succeeded" || lower === "completed"
  const pending = lower.includes("pend") || lower.includes("process") || lower.includes("request")
  const rejected = lower.includes("reject") || lower.includes("fail") || lower.includes("cancel")
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        approved
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
          : pending
            ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
            : rejected
              ? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
              : "bg-zinc-50 text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-500"
      )}
    >
      <HugeiconsIcon
        icon={
          approved
            ? CheckmarkCircle01Icon
            : pending
              ? Clock01Icon
              : rejected
                ? Cancel01Icon
                : WalletIcon
        }
        strokeWidth={2}
        className="size-3.5"
      />
      {status}
    </span>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm">{children}</dd>
    </div>
  )
}

export default function RefundDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading } = useGetRefundQuery(id)

  const refund = data?.data

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (!refund) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-10 text-center">
        <p className="text-muted-foreground">Refund not found.</p>
      </div>
    )
  }

  const event = refund.payment?.order?.event

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/refunds"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" />
          Back to Refunds
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            {fmtCurrency(refund.amount_minor, refund.currency)}
          </h1>
          <StatusBadge status={refund.status} />
        </div>
        <p className="mt-1 font-mono text-sm text-muted-foreground">#{id}</p>
      </div>

      <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs">
        <h3 className="mb-4 font-semibold">Refund Details</h3>
        <dl className="grid gap-6 sm:grid-cols-2">
          <Field label="Status">{refund.status}</Field>
          <Field label="Amount">
            {fmtCurrency(refund.amount_minor, refund.currency)}
          </Field>
          <Field label="Reason">
            {refund.reason ?? <span className="text-muted-foreground/50">&mdash;</span>}
          </Field>
          <Field label="Requested At">
            {refund.created_at
              ? new Date(refund.created_at).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })
              : "—"}
          </Field>
          <Field label="Payment">
            {refund.payment ? (
              <span className="inline-flex items-center gap-1.5">
                <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} className="size-4 text-muted-foreground" />
                {refund.payment.id}
              </span>
            ) : (
              <span className="text-muted-foreground/50">&mdash;</span>
            )}
          </Field>
          <Field label="Order">
            {refund.payment?.order ? (
              <span className="font-mono">{refund.payment.order.id}</span>
            ) : (
              <span className="text-muted-foreground/50">&mdash;</span>
            )}
          </Field>
        </dl>
      </div>

      {event && (
        <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs">
          <h3 className="mb-4 flex items-center gap-2 font-semibold">
            <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-4 text-muted-foreground" />
            Event
          </h3>
          <dl className="grid gap-6 sm:grid-cols-2">
            <Field label="Title">{event.title ?? "—"}</Field>
            <Field label="Slug">
              {event.slug ? (
                <Link
                  href={`/admin/events/${event.id}`}
                  className="text-lime-600 hover:underline"
                >
                  /{event.slug}
                </Link>
              ) : (
                "—"
              )}
            </Field>
          </dl>
        </div>
      )}
    </div>
  )
}
