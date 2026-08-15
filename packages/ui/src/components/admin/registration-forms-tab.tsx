"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  File01Icon,
  PlusSignCircleIcon,
  Edit01Icon,
  Delete01Icon,
  RefreshIcon,
  UploadIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import { ConfirmDialog } from "@workspace/ui/components/admin/forms/confirm-dialog"
import { toastSuccess, toastError } from "@workspace/ui/lib/toast"
import {
  useListRegistrationFormsQuery,
  useDeleteRegistrationFormMutation,
  useListFormVersionsQuery,
  usePublishFormVersionMutation,
  type RegistrationForm,
  type RegistrationFormVersion,
} from "@workspace/store/reducers/registrationApi"
import { RegistrationFormDialog } from "@workspace/ui/components/admin/forms/registration-form-dialog"
import { RegistrationFormVersionDialog } from "@workspace/ui/components/admin/forms/registration-form-version-dialog"

export function RegistrationFormsTab({ eventId }: { eventId: string }) {
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [editingForm, setEditingForm] = useState<RegistrationForm | null>(null)
  const [versionDialogForm, setVersionDialogForm] = useState<RegistrationForm | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [confirmItem, setConfirmItem] = useState<RegistrationForm | null>(null)

  const { data, isLoading, isFetching, refetch } = useListRegistrationFormsQuery({
    eventId,
    params: { page: 1, per_page: 50 },
  })
  const forms = data?.data ?? []
  const [deleteForm] = useDeleteRegistrationFormMutation()

  async function handleDelete() {
    if (!confirmItem) return
    try {
      await deleteForm({ eventId, id: confirmItem.id }).unwrap()
      toastSuccess("Registration form deleted.")
      setConfirmItem(null)
      if (expandedId === confirmItem.id) setExpandedId(null)
    } catch (err) {
      toastError(err, "Failed to delete registration form.")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={File01Icon} strokeWidth={2} className="size-4 text-muted-foreground" />
          <h3 className="font-semibold">Registration Forms</h3>
          <span className="text-xs text-muted-foreground">{forms.length} forms</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className="size-4" />Refresh
          </Button>
          <Button size="sm" className="bg-lime-500 text-white hover:bg-lime-600" onClick={() => { setEditingForm(null); setFormDialogOpen(true) }}>
            <HugeiconsIcon icon={PlusSignCircleIcon} strokeWidth={2} className="size-4" />Create Form
          </Button>
        </div>
      </div>

      {isLoading || isFetching ? (
        <p className="text-sm text-muted-foreground">Loading forms...</p>
      ) : forms.length === 0 ? (
        <p className="text-sm text-muted-foreground">No registration forms for this event.</p>
      ) : (
        <div className="space-y-2">
          {forms.map((f) => (
            <div key={f.id}>
              <div
                className="flex cursor-pointer items-center justify-between rounded-lg border border-border/50 px-4 py-3 hover:bg-accent/40 transition-colors"
                onClick={() => setExpandedId(expandedId === f.id ? null : f.id)}
              >
                <div>
                  <p className="text-sm font-medium">{f.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {f.active ? "Active" : "Inactive"} · {f.versions?.length ?? 0} versions
                  </p>
                </div>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button type="button" onClick={() => { setEditingForm(f); setFormDialogOpen(true) }} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground">
                    <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} className="size-3.5" />
                  </button>
                  <button type="button" onClick={() => { setVersionDialogForm(f); }} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground" title="New version">
                    <HugeiconsIcon icon={PlusSignCircleIcon} strokeWidth={2} className="size-3.5" />
                  </button>
                  <button type="button" onClick={() => setConfirmItem(f)} className="flex size-7 items-center justify-center rounded-md text-destructive hover:bg-destructive/10">
                    <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} className="size-3.5" />
                  </button>
                </div>
              </div>
              {expandedId === f.id && <FormVersionsList eventId={eventId} form={f} />}
            </div>
          ))}
        </div>
      )}

      <RegistrationFormDialog open={formDialogOpen} onOpenChange={setFormDialogOpen} eventId={eventId} form={editingForm} />
      {versionDialogForm && (
        <RegistrationFormVersionDialog
          open={!!versionDialogForm}
          onOpenChange={(o) => { if (!o) setVersionDialogForm(null) }}
          eventId={eventId}
          formId={versionDialogForm.id}
          nextVersion={(versionDialogForm.versions?.length ?? 0) + 1}
        />
      )}
      <ConfirmDialog
        open={!!confirmItem}
        onOpenChange={(o) => { if (!o) setConfirmItem(null) }}
        title="Delete Registration Form"
        description={`Delete registration form "${confirmItem?.name}"?`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  )
}

function FormVersionsList({ eventId, form }: { eventId: string; form: RegistrationForm }) {
  const { data, isLoading } = useListFormVersionsQuery({ eventId, formId: form.id })
  const [publishVersion] = usePublishFormVersionMutation()
  const versions = data?.data ?? []

  async function handlePublish(v: RegistrationFormVersion) {
    try {
      await publishVersion({ eventId, formId: form.id, versionId: v.id }).unwrap()
      toastSuccess("Form version published.")
    } catch (err) {
      toastError(err, "Failed to publish form version.")
    }
  }

  return (
    <div className="rounded-b-lg border-x border-b border-border/50 bg-muted/30 px-4 py-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Versions</p>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading versions...</p>
      ) : versions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No versions yet.</p>
      ) : (
        <div className="space-y-1.5">
          {versions.map((v) => (
            <div key={v.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-card px-3 py-2">
              <div>
                <p className="text-sm font-medium">v{v.version}</p>
                <p className="text-xs text-muted-foreground">{v.questions?.length ?? 0} questions · {v.status}</p>
              </div>
              {v.status !== "published" && (
                <Button size="xs" variant="outline" onClick={() => handlePublish(v)}>
                  <HugeiconsIcon icon={UploadIcon} strokeWidth={2} className="size-3" />Publish
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
