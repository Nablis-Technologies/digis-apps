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
  useCreateArtistMutation,
  useUpdateArtistMutation,
} from "@workspace/store/reducers/artistsApi"
import { toastSuccess, toastError } from "@workspace/ui/lib/toast"

const genreOptions = [
  "pop",
  "jazz",
  "rock",
  "folk",
  "electronic",
  "dance",
  "r&b",
  "soul",
  "hip-hop",
  "traditional",
] as const

type FormData = {
  name: string
  description: string
  genres: string[]
  verified: boolean
  active: boolean
}

const empty: FormData = {
  name: "",
  description: "",
  genres: [],
  verified: false,
  active: true,
}

export function ArtistDialog({
  open,
  onOpenChange,
  artist,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  artist?: {
    id: string
    name: string
    description: string | null
    genres: string[]
    verified: boolean
    active: boolean
  } | null
}) {
  const isEdit = !!artist
  const [form, setForm] = useState<FormData>(empty)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [createArtist, { isLoading: isCreating }] = useCreateArtistMutation()
  const [updateArtist, { isLoading: isUpdating }] = useUpdateArtistMutation()
  const submitting = isCreating || isUpdating

  useEffect(() => {
    if (open) {
      setForm(
        artist
          ? {
              name: artist.name,
              description: artist.description ?? "",
              genres: artist.genres,
              verified: artist.verified,
              active: artist.active,
            }
          : empty
      )
      setErrorMsg(null)
    }
  }, [open, artist])

  function toggleGenre(g: string) {
    setForm((p) => ({
      ...p,
      genres: p.genres.includes(g)
        ? p.genres.filter((x) => x !== g)
        : [...p.genres, g],
    }))
  }

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

    const payload = {
      artist: {
        name: form.name,
        description: form.description || undefined,
        genres: form.genres,
        verified: form.verified,
        active: form.active,
      },
    }

    try {
      if (isEdit && artist) {
        await updateArtist({ id: artist.id, body: payload }).unwrap()
      } else {
        await createArtist(payload).unwrap()
      }
      onOpenChange(false)
      toastSuccess(isEdit ? "Artist updated." : "Artist created.")
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? (err as { data?: { message?: string } }).data?.message
          : undefined
      setErrorMsg(msg ?? "Something went wrong. Please try again.")
      toastError(err, isEdit ? "Failed to update artist." : "Failed to create artist.")
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
          <DialogTitle>{isEdit ? "Edit Artist" : "Create Artist"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? `Update artist "${artist?.name}".`
              : "Add a new artist or performer."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="New Artist"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Input
              id="desc"
              placeholder="An amazing musical artist"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Genres</Label>
            <div className="flex flex-wrap gap-2">
              {genreOptions.map((g) => {
                const selected = form.genres.includes(g)
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => toggleGenre(g)}
                    className={`rounded-md border px-2.5 py-1 text-xs font-medium capitalize transition-colors ${selected ? "border-lime-500 bg-lime-50 text-lime-700 dark:bg-lime-950/20 dark:text-lime-400" : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground"}`}
                  >
                    {g}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={form.verified}
                onChange={(e) => update("verified", e.target.checked)}
                className="size-4 rounded border-border"
              />
              <span className="text-sm">Verified</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => update("active", e.target.checked)}
                className="size-4 rounded border-border"
              />
              <span className="text-sm">Active</span>
            </label>
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
