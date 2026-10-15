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
import { HugeiconsIcon } from "@hugeicons/react"
import { Delete01Icon } from "@hugeicons/core-free-icons"
import { toastSuccess, toastError } from "@workspace/ui/lib/toast"
import { useCreateFormVersionMutation } from "@workspace/store/reducers/registrationApi"

type QuestionRow = {
  key: string
  type: string
  label: string
  required: boolean
  position: number
}

const emptyQuestion = (position: number): QuestionRow => ({
  key: "",
  type: "short_text",
  label: "",
  required: true,
  position,
})

const questionTypes = ["short_text", "long_text", "single_select", "multiple_select", "email", "phone", "date"] as const

export function RegistrationFormVersionDialog({
  open,
  onOpenChange,
  eventId,
  formId,
  nextVersion,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  formId: string
  nextVersion: number
}) {
  const [version, setVersion] = useState(String(nextVersion))
  const [questions, setQuestions] = useState<QuestionRow[]>([emptyQuestion(0)])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [createVersion, { isLoading: isCreating }] = useCreateFormVersionMutation()

  useEffect(() => {
    if (open) {
      setVersion(String(nextVersion))
      setQuestions([emptyQuestion(0)])
      setErrorMsg(null)
    }
  }, [open, nextVersion])

  function updateQuestion(index: number, patch: Partial<QuestionRow>) {
    setQuestions((qs) => qs.map((q, i) => (i === index ? { ...q, ...patch } : q)))
  }

  function addQuestion() {
    setQuestions((qs) => [...qs, emptyQuestion(qs.length)])
  }

  function removeQuestion(index: number) {
    setQuestions((qs) => qs.filter((_, i) => i !== index))
  }

  function isValid() {
    return questions.every((q) => q.key.trim() && q.label.trim())
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid()) return
    setErrorMsg(null)

    try {
      await createVersion({
        eventId,
        formId,
        body: {
          version: Number(version),
          questions: questions.map((q, i) => ({
            key: q.key.trim(),
            type: q.type,
            response_scope: "registration",
            sensitivity: "standard",
            label: q.label.trim(),
            required: q.required,
            position: i,
          })),
        },
      }).unwrap()
      onOpenChange(false)
      toastSuccess("Form version created.")
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? (err as { data?: { message?: string } }).data?.message
          : undefined
      setErrorMsg(msg ?? "Something went wrong. Please try again.")
      toastError(err, "Failed to create form version.")
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!isCreating) onOpenChange(o)
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Form Version</DialogTitle>
          <DialogDescription>Author a new draft schema for this registration form.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="version">Version number</Label>
            <Input id="version" type="number" min={1} value={version} onChange={(e) => setVersion(e.target.value)} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Questions</Label>
              <Button type="button" variant="outline" size="xs" onClick={addQuestion}>
                Add Question
              </Button>
            </div>
            {questions.map((q, i) => (
              <div key={i} className="rounded-lg border border-border/50 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">Question {i + 1}</p>
                  {questions.length > 1 && (
                    <button type="button" onClick={() => removeQuestion(i)} className="flex size-6 items-center justify-center rounded-md text-destructive hover:bg-destructive/10">
                      <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} className="size-3.5" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-[1fr_auto] gap-3">
                  <div className="space-y-2">
                    <Label htmlFor={`q-key-${i}`}>Key</Label>
                    <Input id={`q-key-${i}`} placeholder="full_name" value={q.key} onChange={(e) => updateQuestion(i, { key: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <select
                      value={q.type}
                      onChange={(e) => updateQuestion(i, { type: e.target.value })}
                      className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
                    >
                      {questionTypes.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`q-label-${i}`}>Label</Label>
                  <Input id={`q-label-${i}`} placeholder="Full name" value={q.label} onChange={(e) => updateQuestion(i, { label: e.target.value })} />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={q.required} onChange={(e) => updateQuestion(i, { required: e.target.checked })} className="size-4 rounded border-border" />
                  Required
                </label>
              </div>
            ))}
          </div>

          {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isCreating}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={!isValid() || isCreating}
            >
              {isCreating ? "Creating..." : "Create Version"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
