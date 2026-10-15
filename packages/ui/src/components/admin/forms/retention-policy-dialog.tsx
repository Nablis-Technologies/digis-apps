"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  useCreateRetentionPolicyMutation,
  useUpdateRetentionPolicyMutation,
  type DataRetentionPolicy,
} from "@workspace/store/reducers/dataRetentionApi"
import { toastSuccess, toastError } from "@workspace/ui/lib/toast"

const categoryOptions = ["registration_free_text", "registration_structured", "consent_evidence", "security_audit", "financial_record"] as const
const actionOptions = ["erase_payload", "retain"] as const
const statusOptions = ["draft", "active", "retired"] as const

type FormData = {
  category: string
  jurisdiction_code: string
  version: string
  retention_days: string
  action: string
  status: string
  effective_at: string
}

const empty: FormData = {
  category: "registration_free_text",
  jurisdiction_code: "GLOBAL",
  version: "1",
  retention_days: "",
  action: "erase_payload",
  status: "draft",
  effective_at: "",
}

export function RetentionPolicyDialog({
  open,
  onOpenChange,
  policy,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  policy?: DataRetentionPolicy | null
}) {
  const isEdit = !!policy
  const [form, setForm] = useState<FormData>(empty)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [createPolicy, { isLoading: isCreating }] = useCreateRetentionPolicyMutation()
  const [updatePolicy, { isLoading: isUpdating }] = useUpdateRetentionPolicyMutation()
  const submitting = isCreating || isUpdating

  useEffect(() => {
    if (open) {
      setForm(
        policy
          ? {
              category: policy.category,
              jurisdiction_code: policy.jurisdiction_code ?? "",
              version: String(policy.version),
              retention_days: policy.retention_days ? String(policy.retention_days) : "",
              action: policy.action,
              status: policy.status,
              effective_at: policy.effective_at ?? "",
            }
          : empty
      )
      setErrorMsg(null)
    }
  }, [open, policy])

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((p) => ({ ...p, [key]: value }))
  }
  function isValid() {
    return form.category && form.jurisdiction_code.trim() && Number(form.version) > 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid()) return
    setErrorMsg(null)

    const payload = {
      data_retention_policy: {
        category: form.category,
        jurisdiction_code: form.jurisdiction_code.trim().toUpperCase(),
        version: Number(form.version),
        retention_days: form.retention_days ? Number(form.retention_days) : undefined,
        action: form.action as "erase_payload" | "retain",
        status: form.status as "draft" | "active" | "retired",
        effective_at: form.effective_at || undefined,
      },
    }

    try {
      if (isEdit && policy) {
        await updatePolicy({ id: policy.id, body: payload }).unwrap()
      } else {
        await createPolicy(payload).unwrap()
      }
      onOpenChange(false)
      toastSuccess(isEdit ? "Retention policy updated." : "Retention policy created.")
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? (err as { data?: { message?: string } }).data?.message
          : undefined
      setErrorMsg(msg ?? "Something went wrong. Please try again.")
      toastError(err, isEdit ? "Failed to update retention policy." : "Failed to create retention policy.")
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!submitting) onOpenChange(o)
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Retention Policy" : "Create Retention Policy"}</DialogTitle>
          <DialogDescription>
            {isEdit ? `Update policy for ${policy?.category}.` : "Create a new data retention policy."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label>Category</Label>
            <select
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
            >
              {categoryOptions.map((c) => (
                <option key={c} value={c} className="font-mono">
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jurisdiction">Jurisdiction</Label>
              <Input id="jurisdiction" value={form.jurisdiction_code} onChange={(e) => update("jurisdiction_code", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="version">Version</Label>
              <Input id="version" type="number" min={1} value={form.version} onChange={(e) => update("version", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="retention_days">Retention Days</Label>
              <Input id="retention_days" type="number" min={1} placeholder="30" value={form.retention_days} onChange={(e) => update("retention_days", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Action</Label>
              <select
                value={form.action}
                onChange={(e) => update("action", e.target.value)}
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
              >
                {actionOptions.map((a) => (
                  <option key={a} value={a}>
                    {a.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                value={form.status}
                onChange={(e) => update("status", e.target.value)}
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s} className="capitalize">
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="effective_at">Effective At</Label>
            <Input id="effective_at" type="datetime-local" value={form.effective_at} onChange={(e) => update("effective_at", e.target.value)} />
          </div>
          {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={submitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={!isValid() || submitting}
            >
              {submitting ? "Saving..." : isEdit ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
