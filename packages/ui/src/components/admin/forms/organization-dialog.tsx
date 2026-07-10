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
import { useCreateOrganizationMutation, useUpdateOrganizationMutation } from "@workspace/store/reducers/organizationsApi"

const typeOptions = ["individual", "company"] as const
const categoryOptions = ["conference", "music", "community", "sports", "arts"] as const

type FormData = {
  name: string
  description: string
  organizer_type: "individual" | "company"
  category: string
  contact_phone: string
  contact_email: string
  website_url: string
  city: string
  region: string
  country: string
}

const empty: FormData = { name: "", description: "", organizer_type: "individual", category: "conference", contact_phone: "", contact_email: "", website_url: "", city: "Addis Ababa", region: "", country: "Ethiopia" }

export function OrganizationDialog({
  open,
  onOpenChange,
  organization,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  organization?: { id: string; name: string; description: string | null; organizer_type: "individual" | "company"; category: string | null; contact_phone: string | null; contact_email: string | null; website_url: string | null; city: string | null; region: string | null; country: string | null } | null
}) {
  const isEdit = !!organization
  const [form, setForm] = useState<FormData>(empty)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [createOrg, { isLoading: isCreating }] = useCreateOrganizationMutation()
  const [updateOrg, { isLoading: isUpdating }] = useUpdateOrganizationMutation()
  const submitting = isCreating || isUpdating

  useEffect(() => {
    if (open) {
      setForm(organization ? { name: organization.name, description: organization.description ?? "", organizer_type: organization.organizer_type, category: organization.category ?? "conference", contact_phone: organization.contact_phone ?? "", contact_email: organization.contact_email ?? "", website_url: organization.website_url ?? "", city: organization.city ?? "", region: organization.region ?? "", country: organization.country ?? "" } : empty)
      setErrorMsg(null)
    }
  }, [open, organization])

  function update<K extends keyof FormData>(key: K, value: FormData[K]) { setForm((p) => ({ ...p, [key]: value })) }
  function isValid() { return form.name.trim() && form.city.trim() }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid()) return
    setErrorMsg(null)

    const payload = {
      organization: {
        name: form.name,
        description: form.description || undefined,
        organizer_type: form.organizer_type,
        category: form.category,
        contact_phone: form.contact_phone || undefined,
        contact_email: form.contact_email || undefined,
        website_url: form.website_url || undefined,
        city: form.city,
        region: form.region || undefined,
        country: form.country,
      },
    }

    try {
      if (isEdit && organization) {
        await updateOrg({ id: organization.id, body: payload }).unwrap()
      } else {
        await createOrg({ organization: { ...payload.organization, owner_id: "" } }).unwrap()
      }
      onOpenChange(false)
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "data" in err
        ? (err as { data?: { message?: string } }).data?.message
        : undefined
      setErrorMsg(msg ?? "Something went wrong. Please try again.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!submitting) onOpenChange(o) }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Organization" : "Create Organization"}</DialogTitle>
          <DialogDescription>{isEdit ? `Update "${organization?.name}".` : "Register a new event organizer."}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
            <Input id="name" placeholder="New Organization" value={form.name} onChange={(e) => update("name", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Input id="desc" placeholder="Organization description" value={form.description} onChange={(e) => update("description", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <div className="flex gap-2">
                {typeOptions.map((t) => (
                  <button key={t} type="button" onClick={() => update("organizer_type", t)} className={`flex-1 rounded-md border px-2.5 py-1.5 text-xs font-medium capitalize transition-colors ${form.organizer_type === t ? "border-lime-500 bg-lime-50 text-lime-700 dark:bg-lime-950/20 dark:text-lime-400" : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <select value={form.category} onChange={(e) => update("category", e.target.value)} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50">
                {categoryOptions.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2"><Label htmlFor="city">City <span className="text-destructive">*</span></Label><Input id="city" placeholder="Addis Ababa" value={form.city} onChange={(e) => update("city", e.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="region">Region</Label><Input id="region" placeholder="AA" value={form.region} onChange={(e) => update("region", e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="country">Country</Label><Input id="country" value={form.country} onChange={(e) => update("country", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="phone">Phone</Label><Input id="phone" placeholder="+251911123456" value={form.contact_phone} onChange={(e) => update("contact_phone", e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" placeholder="org@example.com" value={form.contact_email} onChange={(e) => update("contact_email", e.target.value)} /></div>
          </div>
          <div className="space-y-2"><Label htmlFor="website">Website</Label><Input id="website" type="url" placeholder="https://example.com" value={form.website_url} onChange={(e) => update("website_url", e.target.value)} /></div>
          {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <DialogClose asChild><Button type="button" variant="outline" disabled={submitting}>Cancel</Button></DialogClose>
            <Button type="submit" disabled={!isValid() || submitting} className="bg-lime-500 text-white hover:bg-lime-600 disabled:bg-lime-500/50">{submitting ? "Saving..." : isEdit ? "Update" : "Create"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
