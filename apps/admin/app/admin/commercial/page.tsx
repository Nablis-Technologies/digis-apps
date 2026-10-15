"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ReceiptDollarIcon,
  Layers01Icon,
  GroupIcon,
  FolderOpenIcon,
  RefreshIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useListFeeSchedulesQuery,
  useListFeeScheduleVersionsQuery,
  useListProgramsQuery,
  useListAssignmentsQuery,
  useListSubsidyBudgetsQuery,
} from "@/store/reducers/commercialApi"

type Tab = "schedules" | "programs" | "assignments" | "budgets"

function pill(status?: string) {
  const s = String(status ?? "").toLowerCase()
  let cls =
    "bg-zinc-50 text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-500"
  if (["active", "approved", "activated", "published"].some((k) => s.includes(k))) {
    cls = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
  } else if (["draft", "pending", "submitted", "scheduled", "in_review", "in review"].some((k) => s.includes(k))) {
    cls = "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
  } else if (["inactive", "terminated", "rejected", "closed"].some((k) => s.includes(k))) {
    cls = "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
  }
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
        cls
      )}
    >
      {status ?? "—"}
    </span>
  )
}

export default function CommercialPage() {
  const [tab, setTab] = useState<Tab>("schedules")

  const schedules = useListFeeSchedulesQuery()
  const versions = useListFeeScheduleVersionsQuery()
  const programs = useListProgramsQuery()
  const assignments = useListAssignmentsQuery()
  const budgets = useListSubsidyBudgetsQuery()

  const tabs: { key: Tab; label: string }[] = [
    { key: "schedules", label: "Fee Schedules" },
    { key: "programs", label: "Programs" },
    { key: "assignments", label: "Assignments" },
    { key: "budgets", label: "Subsidy Budgets" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Commercial</h1>
          <p className="text-sm text-muted-foreground">
            Fee schedules, commercial programs, assignments, and subsidy budgets
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            schedules.refetch()
            versions.refetch()
            programs.refetch()
            assignments.refetch()
            budgets.refetch()
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-border/50 bg-card px-4 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-accent"
        >
          <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className="size-4" />
          Refresh
        </button>
      </div>

      <div className="flex gap-1 border-b border-border/50">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              tab === t.key
                ? "border-lime-500 text-lime-600"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "schedules" && (
        <div className="space-y-4">
          {schedules.isLoading ? (
            <Skeleton className="h-40 w-full rounded-xl" />
          ) : (schedules.data?.data ?? []).length === 0 ? (
            <EmptyState icon={ReceiptDollarIcon} text="No fee schedules yet" />
          ) : (
            (schedules.data?.data ?? []).map((s) => {
              const scheduleVersions =
                versions.data?.data?.filter((v) => v.fee_schedule_id === s.id) ?? s.fee_schedule_versions ?? []
              return (
                <div
                  key={s.id}
                  className="rounded-xl border border-border/50 bg-card p-6 shadow-xs"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <HugeiconsIcon icon={ReceiptDollarIcon} strokeWidth={2} className="size-4.5" />
                      </div>
                      <div>
                        <p className="font-medium">{s.name}</p>
                        <p className="font-mono text-xs text-muted-foreground">/{s.code}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-zinc-50 px-2.5 py-0.5 text-xs font-medium capitalize dark:bg-zinc-800/50">
                      {s.schedule_type}
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Versions ({scheduleVersions.length})
                    </p>
                    {scheduleVersions.length === 0 ? (
                      <p className="text-sm text-muted-foreground/50">No versions</p>
                    ) : (
                      <div className="overflow-hidden rounded-lg border border-border/50">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border/50 bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              <th className="px-4 py-2.5">Status</th>
                              <th className="px-4 py-2.5">Effective From</th>
                              <th className="px-4 py-2.5">Effective Until</th>
                              <th className="px-4 py-2.5">Components</th>
                            </tr>
                          </thead>
                          <tbody>
                            {scheduleVersions.map((v) => (
                              <tr
                                key={v.id}
                                className="border-b border-border/50 last:border-b-0"
                              >
                                <td className="px-4 py-2.5">{pill(v.status)}</td>
                                <td className="px-4 py-2.5 text-muted-foreground">
                                  {v.effective_from
                                    ? new Date(v.effective_from).toLocaleDateString()
                                    : "—"}
                                </td>
                                <td className="px-4 py-2.5 text-muted-foreground">
                                  {v.effective_until
                                    ? new Date(v.effective_until).toLocaleDateString()
                                    : "—"}
                                </td>
                                <td className="px-4 py-2.5">
                                  {v.fee_components?.length ?? 0}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {tab === "programs" && (
        <div className="rounded-xl border border-border/50 bg-card shadow-xs">
          {programs.isLoading ? (
            <Skeleton className="h-40 rounded-xl" />
          ) : (programs.data?.data ?? []).length === 0 ? (
            <EmptyState icon={Layers01Icon} text="No commercial programs" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <th className="px-6 py-3">Program</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Enrollment</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Starts</th>
                    <th className="px-6 py-3">Ends</th>
                  </tr>
                </thead>
                <tbody>
                  {(programs.data?.data ?? []).map((p) => (
                    <tr key={p.id} className="border-b border-border/50 last:border-b-0">
                      <td className="px-6 py-3 font-medium">{p.id.slice(0, 8)}</td>
                      <td className="px-6 py-3 capitalize">{p.program_type}</td>
                      <td className="px-6 py-3 capitalize">{p.enrollment_mode ?? "—"}</td>
                      <td className="px-6 py-3">{pill(p.active ? "active" : "inactive")}</td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {p.starts_at ? new Date(p.starts_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {p.ends_at ? new Date(p.ends_at).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "assignments" && (
        <div className="rounded-xl border border-border/50 bg-card shadow-xs">
          {assignments.isLoading ? (
            <Skeleton className="h-40 rounded-xl" />
          ) : (assignments.data?.data ?? []).length === 0 ? (
            <EmptyState icon={GroupIcon} text="No assignments" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <th className="px-6 py-3">Organization</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Effective From</th>
                    <th className="px-6 py-3">Effective Until</th>
                  </tr>
                </thead>
                <tbody>
                  {(assignments.data?.data ?? []).map((a) => (
                    <tr key={a.id} className="border-b border-border/50 last:border-b-0">
                      <td className="px-6 py-3 font-medium">{a.organization_id.slice(0, 8)}</td>
                      <td className="px-6 py-3 capitalize">{a.assignment_type}</td>
                      <td className="px-6 py-3">{pill(a.status)}</td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {a.effective_from ? new Date(a.effective_from).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {a.effective_until ? new Date(a.effective_until).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "budgets" && (
        <div className="rounded-xl border border-border/50 bg-card shadow-xs">
          {budgets.isLoading ? (
            <Skeleton className="h-40 rounded-xl" />
          ) : (budgets.data?.data ?? []).length === 0 ? (
            <EmptyState icon={FolderOpenIcon} text="No subsidy budgets" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <th className="px-6 py-3">Currency</th>
                    <th className="px-6 py-3">Limit</th>
                    <th className="px-6 py-3">Program</th>
                    <th className="px-6 py-3">Assignment</th>
                  </tr>
                </thead>
                <tbody>
                  {(budgets.data?.data ?? []).map((b) => (
                    <tr key={b.id} className="border-b border-border/50 last:border-b-0">
                      <td className="px-6 py-3 font-medium">{b.currency}</td>
                      <td className="px-6 py-3">{(b.limit_minor ?? 0) / 100}</td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {b.program_id ? b.program_id.slice(0, 8) : "—"}
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {b.assignment_id ? b.assignment_id.slice(0, 8) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function EmptyState({ icon, text }: { icon: typeof ReceiptDollarIcon; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <HugeiconsIcon icon={icon} strokeWidth={2} className="mb-3 size-10 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  )
}
