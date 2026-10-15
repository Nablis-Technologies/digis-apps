"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  File01Icon,
  Add01Icon,
  RefreshIcon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  useListAdminCampaignTemplatesQuery,
  useCreateAdminCampaignTemplateMutation,
  type AdminCampaignTemplate,
} from "@workspace/store/reducers/adminMessagingApi"

export default function AdminTemplatesPage() {
  const { data, isLoading, refetch } = useListAdminCampaignTemplatesQuery()
  const [createTemplate, { isLoading: isCreating }] = useCreateAdminCampaignTemplateMutation()

  const [openCreate, setOpenCreate] = useState(false)
  const [name, setName] = useState("")
  const [channel, setChannel] = useState<"sms" | "email" | "whatsapp">("sms")
  const [content, setContent] = useState("")
  const [subject, setSubject] = useState("")

  const templates: AdminCampaignTemplate[] = data?.data ?? []

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await createTemplate({
      campaign_template: {
        name,
        channel,
        status: "active",
        metadata: {
          content,
          subject: channel === "email" ? subject : undefined,
        },
      },
    }).unwrap()
    setOpenCreate(false)
    setName("")
    setContent("")
    setSubject("")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Campaign Templates</h1>
          <p className="text-sm text-muted-foreground">
            System templates for SMS, Email, and WhatsApp notifications
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <HugeiconsIcon icon={RefreshIcon} className="mr-1.5 size-4" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setOpenCreate(true)}
          >
            <HugeiconsIcon icon={Add01Icon} className="mr-1.5 size-4" />
            New Template
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card shadow-xs">
        <div className="p-4">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Loading templates...
            </div>
          ) : templates.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No campaign templates found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-xs font-medium text-muted-foreground">
                    <th className="pb-3 font-medium">Template Name</th>
                    <th className="pb-3 font-medium">Channel</th>
                    <th className="pb-3 font-medium">Preview</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/25">
                  {templates.map((t) => (
                    <tr key={t.id} className="hover:bg-muted/30">
                      <td className="py-3 font-medium">{t.name}</td>
                      <td className="py-3 capitalize">{t.channel}</td>
                      <td className="py-3 max-w-md truncate text-xs text-muted-foreground">
                        {t.content}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            t.active
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                              : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                          }`}
                        >
                          {t.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3 text-xs text-muted-foreground">
                        {new Date(t.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Create Campaign Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ticket Confirmation SMS"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="channel">Channel</Label>
                <select
                  id="channel"
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as "sms" | "email" | "whatsapp")}
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none"
                >
                  <option value="sms">SMS</option>
                  <option value="email">Email</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>
              {channel === "email" && (
                <div className="space-y-2">
                  <Label htmlFor="subject">Email Subject</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Your tickets for {{event_name}}"
                    required
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="content">Template Content (supports {"{{variable}}"})</Label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  className="w-full rounded-md border border-border bg-card p-3 text-sm outline-none focus:border-ring"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenCreate(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Saving..." : "Create Template"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
