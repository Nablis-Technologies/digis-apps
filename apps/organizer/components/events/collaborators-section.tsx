"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Building02Icon,
  Add01Icon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons"
import {
  useListEventOrganizationsQuery,
  useCreateEventOrganizationMutation,
  useActivateEventOrganizationMutation,
  useRevokeEventOrganizationMutation,
} from "@workspace/store/reducers/eventScheduleApi"
import { useActiveOrganization } from "../../providers/organization-provider"

interface CollaboratorsSectionProps {
  eventId: string
}

export function CollaboratorsSection({ eventId }: CollaboratorsSectionProps) {
  const { data: orgsData, isLoading } = useListEventOrganizationsQuery({ eventId })
  const { organizations, activeOrgId, activeOrg } = useActiveOrganization()

  const [createOrg, { isLoading: isCreating }] = useCreateEventOrganizationMutation()
  const [activateOrg] = useActivateEventOrganizationMutation()
  const [revokeOrg] = useRevokeEventOrganizationMutation()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedOrgId, setSelectedOrgId] = useState("")
  const [type, setType] = useState("co_organizer")
  const collaborators: any[] = Array.isArray((orgsData as any)?.data?.collaborators)
    ? (orgsData as any).data.collaborators
    : Array.isArray(orgsData?.data)
    ? (orgsData.data as any[])
    : []
  const primaryOrg = (orgsData as any)?.data?.primary_organization || null

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrgId) {
      toast.error("Please select an organization to attach")
      return
    }

    try {
      await createOrg({
        eventId,
        body: {
          event_organization: {
            organization_id: selectedOrgId,
            type,
            role: "collaborator",
          },
        },
      }).unwrap()

      toast.success("Collaborator organization attached")
      setSelectedOrgId("")
      setType("co_organizer")
      setDialogOpen(false)
    } catch (err: any) {
      toast.error(err?.data?.message || err?.data?.error || "Failed to attach collaborator")
    }
  }

  const handleActivate = async (id: string) => {
    try {
      await activateOrg({ eventId, id }).unwrap()
      toast.success("Collaborator activated")
    } catch (err: any) {
      toast.error(err?.data?.message || err?.data?.error || "Failed to activate collaborator")
    }
  }

  const handleRevoke = async (id: string) => {
    try {
      await revokeOrg({ eventId, id }).unwrap()
      toast.success("Collaborator access revoked")
    } catch (err: any) {
      toast.error(err?.data?.message || err?.data?.error || "Failed to revoke collaborator")
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Building02Icon} strokeWidth={2} className="size-4 text-muted-foreground" />
            <span className="font-semibold text-sm">Partners & Collaborators</span>
            <Badge variant="secondary" className="text-xs px-2 py-0">
              {collaborators.length}
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => setDialogOpen(true)}
          >
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-3.5" />
            Add Partner
          </Button>
        </CardHeader>
        <CardContent className="px-4 pb-3 pt-0">
          {isLoading ? (
            <p className="text-xs text-muted-foreground py-2">Loading partners...</p>
          ) : collaborators.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">
              No collaborator organizations attached. Co-organizers, promoters, or sponsors will appear here.
            </p>
          ) : (
            <div className="space-y-2">
              {collaborators.map((c: any) => {
                const orgName = c.organization?.name || organizations?.find((o) => o.id === c.organization_id)?.name || "Partner Organization"
                const isActive = c.status === "active"
                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-3 p-2 rounded-xl border border-border/60 bg-muted/20 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant="outline" className="text-[10px] capitalize shrink-0">
                        {c.type?.replace("_", " ")}
                      </Badge>
                      <span className="font-semibold text-foreground truncate">{orgName}</span>
                      <Badge
                        variant={isActive ? "default" : "secondary"}
                        className={`text-[10px] ${isActive ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : ""}`}
                      >
                        {c.status || "active"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isActive ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[11px] text-muted-foreground hover:text-destructive"
                          onClick={() => handleRevoke(c.id)}
                        >
                          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-3 mr-1" />
                          Revoke
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[11px] text-emerald-600"
                          onClick={() => handleActivate(c.id)}
                        >
                          <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-3 mr-1" />
                          Activate
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleAdd} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Add Collaborator Organization</DialogTitle>
              <DialogDescription className="text-xs">
                Attach a co-organizer, promoter, or sponsor organization to this event.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 pt-1">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Select Organization *</Label>
                <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Choose organization..." />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations
                      ?.filter((o) => o.id !== (activeOrgId || activeOrg?.id))
                      ?.map((org) => (
                        <SelectItem key={org.id} value={org.id} className="text-xs">
                          {org.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Relationship Type *</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="co_organizer">Co-Organizer</SelectItem>
                    <SelectItem value="promoter">Promoter</SelectItem>
                    <SelectItem value="sponsor">Sponsor</SelectItem>
                    <SelectItem value="venue_partner">Venue Partner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isCreating} className="gap-1.5">
                {isCreating ? (
                  <>
                    <HugeiconsIcon icon={Loading03Icon} className="size-3.5 animate-spin" />
                    Attaching...
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-3.5" />
                    Attach Partner
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
