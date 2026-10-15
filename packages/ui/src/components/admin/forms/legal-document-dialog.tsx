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
  useCreateLegalDocumentMutation,
  useUpdateLegalDocumentMutation,
  type LegalDocument,
} from "@workspace/store/reducers/legalApi"
import { toastSuccess, toastError } from "@workspace/ui/lib/toast"

type FormData = {
  document_type: string
  internal_name: string
  jurisdiction_code: string
  locale: string
  title: string
  body: string
  commercial_policy_reference: string
}

const empty: FormData = {
  document_type: "",
  internal_name: "",
  jurisdiction_code: "GLOBAL",
  locale: "en",
  title: "",
  body: "",
  commercial_policy_reference: "",
}

export function LegalDocumentDialog({
  open,
  onOpenChange,
  document,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  document?: LegalDocument | null
}) {
  const isEdit = !!document
  const [form, setForm] = useState<FormData>(empty)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [createDoc, { isLoading: isCreating }] =
    useCreateLegalDocumentMutation()
  const [updateDoc, { isLoading: isUpdating }] =
    useUpdateLegalDocumentMutation()
  const submitting = isCreating || isUpdating

  useEffect(() => {
    if (open) {
      setForm(
        document
          ? {
              document_type: document.document_type,
              internal_name: document.internal_name,
              jurisdiction_code: document.jurisdiction_code,
              locale: document.locale,
              title: "",
              body: "",
              commercial_policy_reference: "",
            }
          : empty
      )
      setErrorMsg(null)
    }
  }, [open, document])

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((p) => ({ ...p, [key]: value }))
  }
  function isValid() {
    return form.document_type.trim() && form.internal_name.trim()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid()) return
    setErrorMsg(null)

    try {
      if (isEdit && document) {
        await updateDoc({
          id: document.id,
          body: {
            legal_document: {
              document_type: form.document_type,
              internal_name: form.internal_name,
              jurisdiction_code: form.jurisdiction_code,
              locale: form.locale,
              title: form.title || undefined,
              body: form.body || undefined,
              commercial_policy_reference: form.commercial_policy_reference || undefined,
            },
          },
        }).unwrap()
      } else {
        await createDoc({
          legal_document: {
            document_type: form.document_type,
            internal_name: form.internal_name,
            jurisdiction_code: form.jurisdiction_code,
            locale: form.locale,
            title: form.title || undefined,
            body: form.body || undefined,
            commercial_policy_reference: form.commercial_policy_reference || undefined,
          },
        }).unwrap()
      }
      onOpenChange(false)
      toastSuccess(isEdit ? "Legal document updated." : "Legal document created.")
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? (err as { data?: { message?: string } }).data?.message
          : undefined
      setErrorMsg(msg ?? "Something went wrong. Please try again.")
      toastError(err, isEdit ? "Failed to update legal document." : "Failed to create legal document.")
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
          <DialogTitle>{isEdit ? "Edit Legal Document" : "Create Legal Document"}</DialogTitle>
          <DialogDescription>
            {isEdit ? `Update "${document?.internal_name}".` : "Create a new legal document."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="internal_name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input id="internal_name" placeholder="Privacy Policy" value={form.internal_name} onChange={(e) => update("internal_name", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="document_type">
                Document Type <span className="text-destructive">*</span>
              </Label>
              <Input id="document_type" placeholder="privacy_policy" value={form.document_type} onChange={(e) => update("document_type", e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jurisdiction">Jurisdiction</Label>
              <Input id="jurisdiction" value={form.jurisdiction_code} onChange={(e) => update("jurisdiction_code", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locale">Locale</Label>
              <Input id="locale" value={form.locale} onChange={(e) => update("locale", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Version Title</Label>
            <Input id="title" placeholder="Privacy Notice" value={form.title} onChange={(e) => update("title", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="body">Body</Label>
            <textarea
              id="body"
              rows={5}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50 resize-none"
              placeholder="Document body..."
              value={form.body}
              onChange={(e) => update("body", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="commercial_ref">Commercial Policy Reference</Label>
            <Input id="commercial_ref" placeholder="Optional reference" value={form.commercial_policy_reference} onChange={(e) => update("commercial_policy_reference", e.target.value)} />
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
