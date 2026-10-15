"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { Label } from "@workspace/ui/components/label"
import { SearchableSelect } from "@workspace/ui/components/searchable-select"
import { useTransferOrganizationMutation } from "@workspace/store/reducers/organizationsApi"
import { useListUsersQuery } from "@workspace/store/reducers/usersApi"
import { toastSuccess, toastError } from "@workspace/ui/lib/toast"

export function TransferOwnershipDialog({
  open,
  onOpenChange,
  orgId,
  orgName,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  orgId?: string
  orgName?: string
}) {
  const [newOwnerId, setNewOwnerId] = useState("")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [transferOrg, { isLoading: transferring }] =
    useTransferOrganizationMutation()

  const { data: usersData, isLoading: isUsersLoading } = useListUsersQuery(
    { per_page: 100 },
    { skip: !open }
  )

  const userOptions = (usersData?.data ?? []).map((u) => ({
    value: u.id,
    label: u.email,
    description: u.phone ? `Phone: ${u.phone}` : `ID: ${u.id.slice(0, 8)}...`,
  }))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!newOwnerId.trim() || !orgId) return
    setErrorMsg(null)

    transferOrg({ id: orgId, new_owner_id: newOwnerId.trim() })
      .unwrap()
      .then(() => {
        onOpenChange(false)
        toastSuccess("Ownership transferred.")
        setNewOwnerId("")
      })
      .catch((err: unknown) => {
        const msg =
          err && typeof err === "object" && "data" in err
            ? (err as { data?: { message?: string } }).data?.message
            : undefined
        setErrorMsg(msg ?? "Something went wrong. Please try again.")
        toastError(err, "Failed to transfer ownership.")
      })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!transferring) {
          onOpenChange(o)
          if (!o) setNewOwnerId("")
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer Ownership</DialogTitle>
          <DialogDescription>
            {orgName ? (
              <>
                Transfer ownership of <strong>{orgName}</strong> to another
                user.
              </>
            ) : (
              "Transfer ownership to another user."
            )}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label>
              New Owner User <span className="text-destructive">*</span>
            </Label>
            <SearchableSelect
              options={userOptions}
              value={newOwnerId}
              onChange={setNewOwnerId}
              placeholder="Select user to transfer to..."
              searchPlaceholder="Search by email..."
              loading={isUsersLoading}
              emptyMessage="No users found."
            />
          </div>
          {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={transferring}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={!newOwnerId.trim() || !orgId || transferring}
              className="bg-lime-500 text-white hover:bg-lime-600 disabled:bg-lime-500/50"
            >
              {transferring ? "Transferring..." : "Transfer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
