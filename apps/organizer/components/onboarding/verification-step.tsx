"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { verificationSchema, type VerificationFormData } from "@/lib/schemas"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Upload02Icon,
  FileAttachmentIcon,
  ImageAddIcon,
  IdIcon,
  Building02Icon,
  CheckmarkCircle01Icon,
  Rocket01Icon,
} from "@hugeicons/core-free-icons"

interface VerificationStepProps {
  onNext: (data: VerificationFormData) => void
  initialData?: Partial<VerificationFormData>
}

type DocKey = keyof VerificationFormData

const DOCS: {
  key: DocKey
  label: string
  hint: string
  icon: typeof Upload02Icon
}[] = [
  {
    key: "profileFile",
    label: "Profile Logo",
    hint: "Your organizer logo (JPG/PNG)",
    icon: Building02Icon,
  },
  {
    key: "bannerFile",
    label: "Banner Image",
    hint: "Cover banner (JPG/PNG)",
    icon: ImageAddIcon,
  },
  {
    key: "businessLicenseFile",
    label: "Business License",
    hint: "Scanned license (PDF/JPG/PNG)",
    icon: FileAttachmentIcon,
  },
  {
    key: "tinCertificateFile",
    label: "TIN Certificate",
    hint: "Scanned certificate (PDF/JPG/PNG)",
    icon: IdIcon,
  },
]

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function VerificationStep({ onNext, initialData }: VerificationStepProps) {
  const [files, setFiles] = useState<Partial<Record<DocKey, File>>>({})

  const {
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema as any),
    mode: "onChange",
    defaultValues: initialData as VerificationFormData,
  })

  const onSubmit = (data: VerificationFormData) => {
    onNext(data)
  }

  const handleFileChange = (key: DocKey) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFiles((prev) => ({ ...prev, [key]: file }))
    setValue(key, file as VerificationFormData[DocKey], { shouldValidate: true })
  }

  return (
    <form id="onboarding-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FieldGroup>
        <div>
          <h2 className="font-bold text-lg mb-1">Verify your organization</h2>
          <p className="text-muted-foreground text-sm">
            All four documents are required. Without them your organization
            cannot be submitted for review — and your events will stay drafts
            until it is verified.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {DOCS.map((doc) => {
            const file = files[doc.key] ?? initialData?.[doc.key]
            const error = errors[doc.key]
            return (
              <Field key={doc.key}>
                <FieldLabel htmlFor={doc.key} className="text-sm font-semibold">
                  {doc.label} <span className="text-destructive">*</span>
                </FieldLabel>
                <button
                  type="button"
                  onClick={() => document.getElementById(doc.key)?.click()}
                  className={`w-full rounded-2xl border-2 border-dashed p-4 text-left transition-all hover:border-primary/50 hover:bg-accent/30 ${
                    error
                      ? "border-destructive/60"
                      : file
                        ? "border-primary/40 bg-primary/5"
                        : "border-border/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl flex-shrink-0 ${
                        file ? "bg-primary/10" : "bg-muted"
                      }`}
                    >
                      <HugeiconsIcon
                        icon={file ? CheckmarkCircle01Icon : doc.icon}
                        strokeWidth={2}
                        className={`size-5 ${file ? "text-primary" : "text-muted-foreground"}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      {file ? (
                        <>
                          <p className="font-medium text-sm truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatSize(file.size)} — tap to replace
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-medium text-sm flex items-center gap-1.5">
                            <HugeiconsIcon icon={Upload02Icon} strokeWidth={2} className="size-4" />
                            Choose file
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{doc.hint} · max 10MB</p>
                        </>
                      )}
                    </div>
                  </div>
                </button>
                <input
                  id={doc.key}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={handleFileChange(doc.key)}
                />
                {error && (
                  <p className="text-sm text-destructive mt-1.5">{error.message as string}</p>
                )}
              </Field>
            )
          })}
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <HugeiconsIcon icon={Rocket01Icon} strokeWidth={2} className="size-4 text-primary" />
            <p className="font-semibold text-sm">What happens after you continue</p>
          </div>
          <ol className="space-y-2.5 text-sm">
            <li className="flex gap-2.5">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">1</span>
              <span className="text-muted-foreground">
                <span className="font-medium text-foreground">We submit your organization</span> for
                verification automatically.
              </span>
            </li>
            <li className="flex gap-2.5">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">2</span>
              <span className="text-muted-foreground">
                <span className="font-medium text-foreground">Small audiences (under 500)</span> are
                approved instantly. Larger ones go to an admin for review.
              </span>
            </li>
            <li className="flex gap-2.5">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">3</span>
              <span className="text-muted-foreground">
                <span className="font-medium text-foreground">Once verified, publishing unlocks.</span>{" "}
                Until then your events stay drafts — create freely, publish when approved.
              </span>
            </li>
          </ol>
        </div>
      </FieldGroup>
    </form>
  )
}
