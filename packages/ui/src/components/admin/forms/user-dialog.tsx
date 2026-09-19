"use client"

import { useState, useEffect } from "react"
import { cn } from "@workspace/ui/lib/utils"
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
import { PhoneInput, normalizeEthiopianPhone, stripCountryCode } from "@workspace/ui/components/phone-input"
import { Label } from "@workspace/ui/components/label"
import {
  useCreateUserMutation,
  useUpdateUserMutation,
} from "@workspace/store/reducers/usersApi"
import { toastSuccess, toastError } from "@workspace/ui/lib/toast"

type UserFormData = {
  email: string
  phone: string
  password: string
  passwordConfirmation: string
  verified: "verified" | "unverified"
}

const empty: UserFormData = {
  email: "",
  phone: "",
  password: "",
  passwordConfirmation: "",
  verified: "unverified",
}

export function UserDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: {
    id?: string
    email: string
    phone?: string | null
    verified_at?: string | null
  } | null
}) {
  const isEdit = !!user?.id
  const [form, setForm] = useState<UserFormData>(empty)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [createUser, { isLoading: isCreating }] = useCreateUserMutation()
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation()
  const submitting = isCreating || isUpdating

  useEffect(() => {
    if (open) {
      setForm(
        user
          ? {
              email: user.email,
              phone: stripCountryCode(user.phone) ?? "",
              password: "",
              passwordConfirmation: "",
              verified: user.verified_at ? "verified" : "unverified",
            }
          : empty
      )
      setErrorMsg(null)
    }
  }, [open, user])

  function update<K extends keyof UserFormData>(
    key: K,
    value: UserFormData[K]
  ) {
    setForm((p) => ({ ...p, [key]: value }))
  }

  function isValid() {
    if (isEdit) return form.email.trim()
    return (
      form.email.trim() &&
      form.password.length >= 8 &&
      form.password === form.passwordConfirmation
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid()) return
    setErrorMsg(null)

    const normalizedPhone = normalizeEthiopianPhone(form.phone) || undefined

    try {
      if (isEdit && user?.id) {
        await updateUser({
          id: user.id,
          body: {
            user: {
              email: form.email,
              phone: normalizedPhone,
              verified_at:
                form.verified === "verified" ? new Date().toISOString() : null,
            },
          },
        }).unwrap()
      } else {
        await createUser({
          user: {
            email: form.email,
            phone: normalizedPhone,
            password: form.password,
            verified_at:
              form.verified === "verified" ? new Date().toISOString() : null,
          },
        }).unwrap()
      }
      onOpenChange(false)
      toastSuccess(isEdit ? "User updated." : "User created.")
      setForm(empty)
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? (err as { data?: { message?: string } }).data?.message
          : undefined
      setErrorMsg(msg ?? "Something went wrong. Please try again.")
      toastError(err, isEdit ? "Failed to update user." : "Failed to create user.")
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!submitting) {
          onOpenChange(o)
          if (!o) setForm(empty)
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit User" : "Create User"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update user details."
              : "Add a new user to the platform."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <PhoneInput
              id="phone"
              placeholder="91 123 4567"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
          </div>
          {!isEdit && (
            <>
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  minLength={8}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">
                  Confirm Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder="Re-enter password"
                  value={form.passwordConfirmation}
                  onChange={(e) =>
                    update("passwordConfirmation", e.target.value)
                  }
                  minLength={8}
                  required
                />
                {form.passwordConfirmation &&
                  form.password !== form.passwordConfirmation && (
                    <p className="text-xs text-destructive">
                      Passwords do not match
                    </p>
                  )}
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label>Email Verification</Label>
            <div className="flex gap-3">
              {(["verified", "unverified"] as const).map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => update("verified", o)}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                    form.verified === o
                      ? "border-lime-500 bg-lime-50 text-lime-700 dark:bg-lime-950/20 dark:text-lime-400"
                      : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                  )}
                >
                  {o === "verified" ? "Verified" : "Unverified"}
                </button>
              ))}
            </div>
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
              {submitting
                ? "Saving..."
                : isEdit
                  ? "Update User"
                  : "Create User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
