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
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
} from "@workspace/store/reducers/categoriesApi"
import { toastSuccess, toastError } from "@workspace/ui/lib/toast"

type FormData = {
  name: string
  description: string
  active: boolean
  metadataIcon: string
  metadataColor: string
}

const empty: FormData = {
  name: "",
  description: "",
  active: true,
  metadataIcon: "",
  metadataColor: "#33B5FF",
}

export function CategoryDialog({
  open,
  onOpenChange,
  category,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: {
    id: string
    name: string
    description: string | null
    active: boolean
    metadata: { icon: string | null; color: string | null }
  } | null
}) {
  const isEdit = !!category
  const [form, setForm] = useState<FormData>(empty)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [createCategory, { isLoading: isCreating }] =
    useCreateCategoryMutation()
  const [updateCategory, { isLoading: isUpdating }] =
    useUpdateCategoryMutation()
  const submitting = isCreating || isUpdating

  useEffect(() => {
    if (open) {
      setForm(
        category
          ? {
              name: category.name,
              description: category.description ?? "",
              active: category.active,
              metadataIcon: category.metadata.icon ?? "",
              metadataColor: category.metadata.color ?? "#33B5FF",
            }
          : empty
      )
      setErrorMsg(null)
    }
  }, [open, category])

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((p) => ({ ...p, [key]: value }))
  }
  function isValid() {
    return form.name.trim()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid()) return
    setErrorMsg(null)

    try {
      if (isEdit && category) {
        await updateCategory({
          id: category.id,
          body: {
            category: {
              name: form.name,
              description: form.description || undefined,
              active: form.active,
              metadata: {
                icon: form.metadataIcon || null,
                color: form.metadataColor || null,
              },
            },
          },
        }).unwrap()
      } else {
        await createCategory({
          category: {
            name: form.name,
            description: form.description || undefined,
            active: form.active,
            metadata: {
              icon: form.metadataIcon || null,
              color: form.metadataColor || null,
            },
          },
        }).unwrap()
      }
      onOpenChange(false)
      toastSuccess(isEdit ? "Category updated." : "Category created.")
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? (err as { data?: { message?: string } }).data?.message
          : undefined
      setErrorMsg(msg ?? "Something went wrong. Please try again.")
      toastError(err, isEdit ? "Failed to update category." : "Failed to create category.")
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!submitting) onOpenChange(o)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Category" : "Create Category"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? `Update category "${category?.name}".`
              : "Add a new event category."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Music"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Input
              id="desc"
              placeholder="Concerts, festivals, live performances"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="metaIcon">Icon Name</Label>
              <Input
                id="metaIcon"
                placeholder="music-note"
                value={form.metadataIcon}
                onChange={(e) => update("metadataIcon", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="metaColor">Color</Label>
              <div className="flex items-center gap-2">
                <span
                  className="size-5 shrink-0 rounded-full ring-1 ring-border"
                  style={{ backgroundColor: form.metadataColor }}
                />
                <Input
                  id="metaColor"
                  value={form.metadataColor}
                  onChange={(e) => update("metadataColor", e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={form.active}
              onChange={(e) => update("active", e.target.checked)}
              className="size-4 rounded border-border"
            />
            <Label htmlFor="active" className="cursor-pointer">
              Active
            </Label>
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
              className="bg-lime-500 text-white hover:bg-lime-600 disabled:bg-lime-500/50"
            >
              {submitting ? "Saving..." : isEdit ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
