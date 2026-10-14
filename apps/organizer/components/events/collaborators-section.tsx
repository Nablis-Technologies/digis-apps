"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Building02Icon,
  Add01Icon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  Loading03Icon,
  Edit01Icon,
  Delete02Icon,
  AlertCircleIcon,
  MoreVerticalIcon,
} from "@hugeicons/core-free-icons"
import {
  useListEventOrganizationsQuery,
  useCreateEventOrganizationMutation,
  useUpdateEventOrganizationMutation,
  useDeleteEventOrganizationMutation,
  useActivateEventOrganizationMutation,
  useRevokeEventOrganizationMutation,
  type EventOrganization,
} from "@workspace/store/reducers/eventScheduleApi"
import { useActiveOrganization } from "../../providers/organization-provider"
import { formatApiErrorMessage } from "@/lib/utils"

interface CollaboratorsSectionProps {
  eventId: string
  hidePrimarySpotlight?: boolean
}

const COLLABORATOR_TYPES = [
  {
    value: "co_organizer",
    label: "Co-Organizer",
    desc: "Shared hosting & operational oversight",
    badgeClass: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30",
  },
  {
    value: "promoter",
    label: "Promoter",
    desc: "Marketing, distribution & campaign partner",
    badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  },
  {
    value: "sponsor",
    label: "Sponsor",
    desc: "Financial or in-kind commercial sponsor",
    badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  },
  {
    value: "venue_partner",
    label: "Venue Partner",
    desc: "Host venue management & facility support",
    badgeClass: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
  },
]

export function CollaboratorsSection({ eventId, hidePrimarySpotlight = false }: CollaboratorsSectionProps) {
  const { data: orgsData, isLoading } = useListEventOrganizationsQuery({ eventId })
  const { organizations, activeOrgId, activeOrg } = useActiveOrganization()

  const [createOrg, { isLoading: isCreating }] = useCreateEventOrganizationMutation()
  const [updateOrg, { isLoading: isUpdating }] = useUpdateEventOrganizationMutation()
  const [deleteOrg, { isLoading: isDeleting }] = useDeleteEventOrganizationMutation()
  const [activateOrg] = useActivateEventOrganizationMutation()
  const [revokeOrg] = useRevokeEventOrganizationMutation()

  // Add Dialog State
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addMode, setAddMode] = useState<"my_orgs" | "custom_id">("my_orgs")
  const [selectedOrgId, setSelectedOrgId] = useState("")
  const [customOrgId, setCustomOrgId] = useState("")
  const [type, setType] = useState("co_organizer")
  const [role, setRole] = useState("collaborator")

  // Edit Dialog State
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingCollab, setEditingCollab] = useState<EventOrganization | null>(null)
  const [editType, setEditType] = useState("co_organizer")
  const [editRole, setEditRole] = useState("collaborator")

  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingCollab, setDeletingCollab] = useState<EventOrganization | null>(null)

  const collaborators: EventOrganization[] = Array.isArray((orgsData as any)?.data?.collaborators)
    ? (orgsData as any).data.collaborators
    : Array.isArray(orgsData?.data)
    ? (orgsData.data as any[])
    : []
  const primaryOrg = (orgsData as any)?.data?.primary_organization || null

  const getTypeConfig = (collabType?: string) => {
    const found = COLLABORATOR_TYPES.find((t) => t.value === collabType)
    if (found) return found
    return {
      value: collabType || "partner",
      label: collabType ? collabType.replace(/_/g, " ") : "Partner",
      desc: "",
      badgeClass: "bg-muted text-muted-foreground border-border",
    }
  }

  const getStatusBadge = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return (
          <Badge
            variant="outline"
            className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] gap-1"
          >
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Active
          </Badge>
        )
      case "revoked":
        return (
          <Badge
            variant="outline"
            className="bg-destructive/15 text-destructive border-destructive/30 text-[10px] gap-1"
          >
            <span className="size-1.5 rounded-full bg-destructive" />
            Revoked
          </Badge>
        )
      case "pending":
      default:
        return (
          <Badge
            variant="outline"
            className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] gap-1"
          >
            <span className="size-1.5 rounded-full bg-amber-500" />
            {status ? status.toUpperCase() : "PENDING"}
          </Badge>
        )
    }
  }

  const handleOpenAdd = () => {
    setSelectedOrgId("")
    setCustomOrgId("")
    setType("co_organizer")
    setRole("collaborator")
    setAddMode("my_orgs")
    setAddDialogOpen(true)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetOrgId = addMode === "custom_id" ? customOrgId.trim() : selectedOrgId
    if (!targetOrgId) {
      toast.error(addMode === "custom_id" ? "Please enter an organization ID" : "Please select an organization")
      return
    }

    try {
      await createOrg({
        eventId,
        body: {
          event_organization: {
            organization_id: targetOrgId,
            type,
            role: role.trim() || "collaborator",
          },
        },
      }).unwrap()

      toast.success("Collaborator organization attached")
      setAddDialogOpen(false)
    } catch (err: any) {
      toast.error(formatApiErrorMessage(err))
    }
  }

  const handleOpenEdit = (collab: EventOrganization) => {
    setEditingCollab(collab)
    setEditType(collab.type || "co_organizer")
    setEditRole(collab.role || "collaborator")
    setEditDialogOpen(true)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCollab) return

    try {
      await updateOrg({
        eventId,
        id: editingCollab.id,
        body: {
          event_organization: {
            type: editType,
            role: editRole.trim() || "collaborator",
          },
        },
      }).unwrap()

      toast.success("Collaborator relationship updated")
      setEditDialogOpen(false)
      setEditingCollab(null)
    } catch (err: any) {
      toast.error(formatApiErrorMessage(err))
    }
  }

  const handleOpenDelete = (collab: EventOrganization) => {
    setDeletingCollab(collab)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingCollab) return

    try {
      await deleteOrg({
        eventId,
        id: deletingCollab.id,
      }).unwrap()

      toast.success("Collaborator removed from event")
      setDeleteDialogOpen(false)
      setDeletingCollab(null)
    } catch (err: any) {
      toast.error(formatApiErrorMessage(err))
    }
  }

  const handleActivate = async (id: string) => {
    try {
      await activateOrg({ eventId, id }).unwrap()
      toast.success("Collaborator activated")
    } catch (err: any) {
      toast.error(formatApiErrorMessage(err))
    }
  }

  const handleRevoke = async (id: string) => {
    try {
      await revokeOrg({ eventId, id }).unwrap()
      toast.success("Collaborator access revoked")
    } catch (err: any) {
      toast.error(formatApiErrorMessage(err))
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
            onClick={handleOpenAdd}
          >
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-3.5" />
            Add Partner
          </Button>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          {/* Primary Host Organization Spotlight */}
          {!hidePrimarySpotlight && primaryOrg && (
            <div className="flex items-center justify-between p-3 rounded-xl border border-primary/20 bg-primary/5 text-xs mb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                  <HugeiconsIcon icon={Building02Icon} strokeWidth={2} className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-foreground truncate">{primaryOrg.name}</p>
                  <p className="text-[11px] text-muted-foreground">Primary Host & Event Owner</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-primary/15 text-primary border-primary/30 text-[10px] uppercase font-bold shrink-0">
                Primary Host
              </Badge>
            </div>
          )}

          {isLoading ? (
            <div className="py-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
              <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin text-primary" />
              Loading partners...
            </div>
          ) : collaborators.length === 0 ? (
            <div className="py-6 text-center space-y-2 border border-dashed border-border/70 rounded-xl bg-muted/10">
              <HugeiconsIcon icon={Building02Icon} className="size-8 mx-auto text-muted-foreground/60" />
              <p className="text-xs font-semibold text-foreground">No Collaborators Attached</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Attach co-organizers, promoters, venue partners, or sponsors to collaborate on event execution.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 mt-1"
                onClick={handleOpenAdd}
              >
                <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-3.5" />
                Attach First Partner
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {collaborators.map((c) => {
                const orgName =
                  c.organization?.name ||
                  organizations?.find((o) => o.id === c.organization_id)?.name ||
                  "Partner Organization"
                const isActive = c.status === "active"
                const typeCfg = getTypeConfig(c.type)

                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/30 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-card border border-border/80 text-foreground">
                        <HugeiconsIcon icon={Building02Icon} strokeWidth={2} className="size-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-foreground truncate">{orgName}</span>
                          <Badge variant="outline" className={`text-[10px] font-semibold ${typeCfg.badgeClass}`}>
                            {typeCfg.label}
                          </Badge>
                          {getStatusBadge(c.status)}
                        </div>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                          <span>Role: <strong className="text-foreground font-medium capitalize">{c.role || "collaborator"}</strong></span>
                          {c.created_at && (
                            <>
                              <span>·</span>
                              <span>Added {new Date(c.created_at).toLocaleDateString()}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
                            <HugeiconsIcon icon={MoreVerticalIcon} strokeWidth={2} className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 text-xs">
                          <DropdownMenuItem onClick={() => handleOpenEdit(c)} className="gap-2 cursor-pointer">
                            <HugeiconsIcon icon={Edit01Icon} className="size-3.5" />
                            Edit Relationship
                          </DropdownMenuItem>

                          {isActive ? (
                            <DropdownMenuItem
                              onClick={() => handleRevoke(c.id)}
                              className="gap-2 cursor-pointer text-amber-600 dark:text-amber-400 focus:text-amber-700"
                            >
                              <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
                              Revoke Access
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => handleActivate(c.id)}
                              className="gap-2 cursor-pointer text-emerald-600 dark:text-emerald-400 focus:text-emerald-700"
                            >
                              <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-3.5" />
                              Activate Access
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleOpenDelete(c)}
                            className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                          >
                            <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
                            Remove from Event
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Collaborator Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleAdd} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <HugeiconsIcon icon={Building02Icon} className="size-5 text-primary" />
                Add Collaborator Organization
              </DialogTitle>
              <DialogDescription className="text-xs">
                Attach a co-organizer, promoter, sponsor, or venue partner to this event.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 pt-1">
              {/* Organization Source Mode */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Organization Source *</Label>
                  <button
                    type="button"
                    onClick={() => setAddMode(addMode === "my_orgs" ? "custom_id" : "my_orgs")}
                    className="text-[11px] text-primary hover:underline font-medium"
                  >
                    {addMode === "my_orgs" ? "Enter Organization ID instead" : "Select from my organizations"}
                  </button>
                </div>

                {addMode === "my_orgs" ? (
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
                ) : (
                  <Input
                    placeholder="e.g. org_01HX..."
                    value={customOrgId}
                    onChange={(e) => setCustomOrgId(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                )}
              </div>

              {/* Relationship Type */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Relationship Type *</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLLABORATOR_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value} className="text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{t.label}</span>
                          <span className="text-[11px] text-muted-foreground">— {t.desc}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Operational Role */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Role Name</Label>
                <Input
                  placeholder="collaborator"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="h-9 text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  Default is &quot;collaborator&quot;. Cannot be &quot;primary_owner&quot;.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAddDialogOpen(false)}
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

      {/* Edit Collaborator Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleEdit} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <HugeiconsIcon icon={Edit01Icon} className="size-5 text-primary" />
                Edit Collaborator Relationship
              </DialogTitle>
              <DialogDescription className="text-xs">
                Update the role and partnership designation for {editingCollab?.organization?.name || "this collaborator"}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 pt-1">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Relationship Type *</Label>
                <Select value={editType} onValueChange={setEditType}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLLABORATOR_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value} className="text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{t.label}</span>
                          <span className="text-[11px] text-muted-foreground">— {t.desc}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Role Name</Label>
                <Input
                  placeholder="collaborator"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditDialogOpen(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isUpdating} className="gap-1.5">
                {isUpdating && <HugeiconsIcon icon={Loading03Icon} className="size-3.5 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <HugeiconsIcon icon={AlertCircleIcon} className="size-5" />
              Remove Collaborator
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove &quot;{deletingCollab?.organization?.name || "this organization"}&quot; from the event?
              They will no longer be listed as a partner or have collaboration access.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="gap-1.5"
            >
              {isDeleting && <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" />}
              Remove Partner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
