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
import { SearchableSelect } from "@workspace/ui/components/searchable-select"
import {
  useCreateEventMutation,
  useUpdateEventMutation,
  type Event,
} from "@workspace/store/reducers/eventsApi"
import { useListOrganizationsQuery } from "@workspace/store/reducers/organizationsApi"
import { useListCategoriesQuery } from "@workspace/store/reducers/categoriesApi"
import { toastSuccess, toastError } from "@workspace/ui/lib/toast"

const visibilityOptions = ["public", "unlisted", "private"] as const

type FormData = {
  title: string
  description: string
  visibility: string
  timezone: string
  currency: string
  organizationId: string
  categoryIds: string[]
}

const empty: FormData = {
  title: "",
  description: "",
  visibility: "public",
  timezone: "Africa/Addis_Ababa",
  currency: "ETB",
  organizationId: "",
  categoryIds: [],
}

export function EventDialog({
  open,
  onOpenChange,
  event,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  event?: Event | null
}) {
  const isEdit = !!event
  const [form, setForm] = useState<FormData>(empty)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [createEvent, { isLoading: isCreating }] = useCreateEventMutation()
  const [updateEvent, { isLoading: isUpdating }] = useUpdateEventMutation()
  const { data: orgsData, isLoading: orgsLoading } = useListOrganizationsQuery(
    { per_page: 100 },
    { skip: !open || isEdit }
  )
  const { data: catsData, isLoading: catsLoading } = useListCategoriesQuery(
    { per_page: 100 },
    { skip: !open }
  )
  const submitting = isCreating || isUpdating
  const organizations = orgsData?.data ?? []
  const categories = catsData?.data ?? []

  const orgOptions = organizations.map((o) => ({
    value: o.id,
    label: o.name,
    description: o.city ? `${o.city}, ${o.country ?? ""}` : undefined,
  }))

  const catOptions = categories.map((c) => ({
    value: c.id,
    label: c.name,
  }))

  useEffect(() => {
    if (open) {
      setForm(
        event
          ? {
              title: event.title,
              description: event.description ?? "",
              visibility: event.visibility,
              timezone: event.timezone,
              currency: event.currency,
              organizationId: event.organization?.id ?? "",
              categoryIds: event.categories?.map((c) => c.id) ?? [],
            }
          : empty
      )
      setErrorMsg(null)
    }
  }, [open, event])

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((p) => ({ ...p, [key]: value }))
  }


  function isValid() {
    return form.title.trim() && (isEdit || !!form.organizationId)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid()) return
    setErrorMsg(null)

    const payload = {
      event: {
        title: form.title,
        description: form.description || undefined,
        visibility: form.visibility,
        timezone: form.timezone,
        currency: form.currency,
        organization_id: form.organizationId,
        category_ids: form.categoryIds.slice(0, 3),
      },
    }

    try {
      if (isEdit && event) {
        await updateEvent({ id: event.id, body: payload }).unwrap()
      } else {
        await createEvent(payload).unwrap()
      }
      onOpenChange(false)
      toastSuccess(isEdit ? "Event updated." : "Event created.")
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? (err as { data?: { message?: string } }).data?.message
          : undefined
      setErrorMsg(msg ?? "Something went wrong. Please try again.")
      toastError(err, isEdit ? "Failed to update event." : "Failed to create event.")
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
          <DialogTitle>{isEdit ? "Edit Event" : "Create Event"}</DialogTitle>
          <DialogDescription>
            {isEdit ? `Update "${event?.title}".` : "Create a new platform event."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="New Year Concert"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Input
              id="desc"
              placeholder="Event description"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </div>

          {!isEdit && (
            <div className="space-y-2">
              <Label>
                Organization <span className="text-destructive">*</span>
              </Label>
              <SearchableSelect
                options={orgOptions}
                value={form.organizationId}
                onChange={(val) => update("organizationId", val)}
                placeholder="Select organizer..."
                searchPlaceholder="Search organizations..."
                loading={orgsLoading}
                emptyMessage="No organizations found."
              />
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Visibility</Label>
              <select
                value={form.visibility}
                onChange={(e) => update("visibility", e.target.value)}
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
              >
                {visibilityOptions.map((v) => (
                  <option key={v} value={v} className="capitalize">
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                value={form.timezone}
                onChange={(e) => update("timezone", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={form.currency}
                onChange={(e) => update("currency", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Categories</Label>
            <SearchableSelect
              options={catOptions}
              value={form.categoryIds}
              onChange={(val) => update("categoryIds", val)}
              placeholder="Select categories..."
              searchPlaceholder="Search categories..."
              loading={catsLoading}
              multiple
              emptyMessage="No categories found."
            />
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
