"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  Delete01Icon,
  Edit01Icon,
  UploadIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { toastSuccess, toastError } from "@/lib/toast"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { LegalDocumentDialog } from "@/components/forms/legal-document-dialog"
import { ConfirmDialog } from "@/components/forms/confirm-dialog"
import {
  useGetLegalDocumentQuery,
  useDeleteLegalDocumentMutation,
  usePublishLegalDocumentMutation,
  useActivateLegalDocumentMutation,
  useDeactivateLegalDocumentMutation,
} from "@/store/reducers/legalApi"

export default function LegalDocumentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data, isLoading: loading } = useGetLegalDocumentQuery(id)
  const [deleteDoc, { isLoading: deleting }] = useDeleteLegalDocumentMutation()
  const [publishVersion] = usePublishLegalDocumentMutation()
  const [activateDoc] = useActivateLegalDocumentMutation()
  const [deactivateDoc] = useDeactivateLegalDocumentMutation()

  const document = data?.data

  const [editOpen, setEditOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  async function handleDelete() {
    if (!document) return
    try {
      await deleteDoc(document.id).unwrap()
      toastSuccess("Legal document deleted.")
      router.replace("/admin/legal-documents")
    } catch (err) {
      toastError(err, "Failed to delete legal document.")
      // stay open to retry
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (!document) {
    return (
      <div className="space-y-6">
        <Link href="/admin/legal-documents" className="flex size-9 items-center justify-center rounded-lg border border-border/50 bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" />
        </Link>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium">Document not found</p>
          <p className="text-sm text-muted-foreground">The legal document you&apos;re looking for doesn&apos;t exist or has been deleted.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Link href="/admin/legal-documents" className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition-colors mt-1">
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight">{document.internal_name}</h1>
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", document.active ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-zinc-50 text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-500")}>
              {document.active ? "Active" : "Inactive"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {document.document_type} · {document.jurisdiction_code} · {document.locale}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {document.active ? (
            <Button variant="outline" size="sm" onClick={async () => {
              try {
                await deactivateDoc(document.id).unwrap()
                toastSuccess("Document deactivated.")
              } catch (err) {
                toastError(err, "Failed to deactivate document.")
              }
            }}>
              <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-4" />Deactivate
            </Button>
          ) : (
            <Button size="sm" onClick={async () => {
              try {
                await activateDoc(document.id).unwrap()
                toastSuccess("Document activated.")
              } catch (err) {
                toastError(err, "Failed to activate document.")
              }
            }}>
              <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-4" />Activate
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} className="size-4" />Edit
          </Button>
          <Button variant="outline" size="sm" className="text-destructive" onClick={() => setConfirmOpen(true)}>
            <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} className="size-4" />
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Versions</h3>
        </div>
        <div className="space-y-3">
          {document.versions?.length ? (
            document.versions.map((v) => (
              <div key={v.id} className="rounded-lg border border-border/50 px-4 py-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">v{v.version} — {v.title}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", v.status === "published" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400")}>
                      {v.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {v.status !== "published" && (
                      <Button size="xs" variant="outline" onClick={async () => {
                        try {
                          await publishVersion(document.id).unwrap()
                          toastSuccess("Version published.")
                        } catch (err) {
                          toastError(err, "Failed to publish version.")
                        }
                      }}>
                        <HugeiconsIcon icon={UploadIcon} strokeWidth={2} className="size-3" />Publish
                      </Button>
                    )}
                  </div>
                </div>
                {v.body && <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{v.body}</p>}
                <p className="text-xs text-muted-foreground mt-2">
                  {v.commercial_policy_reference && `Ref: ${v.commercial_policy_reference} · `}
                  Updated {new Date(v.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No versions yet. Edit this document to create one.</p>
          )}
        </div>
      </div>

      <LegalDocumentDialog open={editOpen} onOpenChange={setEditOpen} document={document} />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(o) => { if (!deleting) setConfirmOpen(o) }}
        title="Delete Legal Document"
        description={`Delete legal document "${document.internal_name}"?`}
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        onConfirm={handleDelete}
      />
    </div>
  )
}
