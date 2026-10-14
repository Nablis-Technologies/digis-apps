"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { getAccessToken, clearTokens } from "@workspace/store/api"
import { useGetMeQuery } from "@workspace/store/reducers/authApi"
import {
  usePreviewStaffInvitationMutation,
  useClaimStaffInvitationMutation,
  type StaffInvitationPreview,
} from "@workspace/store/reducers/eventScheduleApi"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  UserGroupIcon,
  CheckmarkCircle01Icon,
  AlertCircleIcon,
  Loading01Icon,
  SecurityCheckIcon,
  SmartPhone01Icon,
  ArrowRight01Icon,
  Logout01Icon,
  Calendar03Icon,
} from "@hugeicons/core-free-icons"

export default function ClaimStaffInvitationPage() {
  const router = useRouter()
  const { data: meData, isLoading: isMeLoading } = useGetMeQuery()
  const currentUser = meData?.data?.user

  const [token, setToken] = React.useState<string | null>(null)
  const [tokenChecked, setTokenChecked] = React.useState(false)

  const [previewInvitation, { isLoading: isPreviewLoading }] = usePreviewStaffInvitationMutation()
  const [claimInvitation, { isLoading: isClaiming }] = useClaimStaffInvitationMutation()

  const [previewData, setPreviewData] = React.useState<StaffInvitationPreview | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [errorCode, setErrorCode] = React.useState<string | null>(null)
  const [claimedSuccess, setClaimedSuccess] = React.useState(false)

  // 1. Extract token from URL fragment (hash) safely on mount
  React.useEffect(() => {
    if (typeof window === "undefined") return

    let extractedToken: string | null = null

    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      extractedToken = hashParams.get("token")
      if (extractedToken) {
        window.history.replaceState(null, "", window.location.pathname)
        sessionStorage.setItem("pending_event_staff_claim_token", extractedToken)
      }
    }

    if (!extractedToken) {
      extractedToken = sessionStorage.getItem("pending_event_staff_claim_token")
    }

    setToken(extractedToken)
    setTokenChecked(true)
  }, [])

  const isAuthenticated = Boolean(getAccessToken())

  // 2. Fetch invitation preview once token and user session are ready
  const loadPreview = React.useCallback(async (claimToken: string) => {
    setErrorMessage(null)
    setErrorCode(null)
    try {
      const res = await previewInvitation({ token: claimToken }).unwrap()
      if (res?.data) {
        setPreviewData(res.data)
      }
    } catch (err: any) {
      const code = err?.data?.code || err?.data?.error || "claim_error"
      const message =
        err?.data?.message ||
        (typeof err?.data?.error === "string" ? err.data.error : null) ||
        "This invitation link is invalid or has expired."
      setErrorCode(code)
      setErrorMessage(message)
    }
  }, [previewInvitation])

  React.useEffect(() => {
    if (tokenChecked && token && isAuthenticated && !isMeLoading && !previewData && !errorMessage) {
      loadPreview(token)
    }
  }, [tokenChecked, token, isAuthenticated, isMeLoading, previewData, errorMessage, loadPreview])

  // 3. Claim action
  const handleClaim = async () => {
    if (!token) return
    setErrorMessage(null)
    setErrorCode(null)

    try {
      const res = await claimInvitation({ token }).unwrap()
      sessionStorage.removeItem("pending_event_staff_claim_token")
      setClaimedSuccess(true)
      toast.success("Welcome to the event crew!", {
        description: res?.data?.already_assigned
          ? `You are already assigned to ${previewData?.event?.title || "this event"}.`
          : `You are now on the staff roster for ${previewData?.event?.title || "the event"}.`,
      })
    } catch (err: any) {
      const code = err?.data?.code || "claim_error"
      const message =
        err?.data?.message ||
        (typeof err?.data?.error === "string" ? err.data.error : null) ||
        "Failed to accept invitation. Please try again."
      setErrorCode(code)
      setErrorMessage(message)
      toast.error("Could not accept invitation", { description: message })
    }
  }

  const handleSwitchAccount = () => {
    clearTokens()
    router.replace(`/?redirectTo=${encodeURIComponent("/events/staff-invitations/claim")}`)
  }

  if (tokenChecked && !token) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-muted/20">
        <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-6 shadow-sm text-center space-y-4">
          <div className="mx-auto size-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
            <HugeiconsIcon icon={AlertCircleIcon} className="size-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-foreground">No Invitation Token Found</h2>
            <p className="text-xs text-muted-foreground">
              This link is missing an event staff invitation token. Please check the link you received.
            </p>
          </div>
          <Button onClick={() => router.push("/")} variant="outline" className="w-full text-xs">
            Return to Login
          </Button>
        </div>
      </div>
    )
  }

  if (tokenChecked && token && !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-muted/20">
        <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-8 shadow-sm text-center space-y-5">
          <div className="mx-auto size-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <HugeiconsIcon icon={Calendar03Icon} className="size-7" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Event Staff Invitation
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You have been invited to join an event operational crew. Please sign in or register with your verified mobile phone number to preview and accept.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-border/60 bg-muted/30 text-xs text-muted-foreground space-y-1 text-left">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <HugeiconsIcon icon={SmartPhone01Icon} className="size-4 text-primary" />
              <span>Phone Verification Required</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Invitations are matched directly to your phone number. You must log in with the phone number where you received this invitation.
            </p>
          </div>

          <Button
            onClick={() => router.push(`/?redirectTo=${encodeURIComponent("/events/staff-invitations/claim")}`)}
            className="w-full gap-2 font-semibold text-xs shadow-xs"
          >
            Sign In / Register with Phone
            <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" />
          </Button>
        </div>
      </div>
    )
  }

  if (claimedSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-muted/20">
        <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-8 shadow-sm text-center space-y-5">
          <div className="mx-auto size-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              You&apos;re On the Team!
            </h2>
            <p className="text-xs text-muted-foreground">
              You have joined the operational staff for{" "}
              <strong className="text-foreground">{previewData?.event?.title}</strong>.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs text-emerald-800 dark:text-emerald-300">
            <p className="font-semibold capitalize">Assigned Role: {previewData?.role}</p>
            <p className="text-[11px] opacity-90 mt-0.5">
              Your credentials are active. You can now access event schedules and scanner tools.
            </p>
          </div>

          <Button
            onClick={() => router.push("/organizer")}
            className="w-full gap-2 font-semibold text-xs shadow-xs"
          >
            Go to Organizer Workspace
            <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" />
          </Button>
        </div>
      </div>
    )
  }

  if (isPreviewLoading || isMeLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-muted/20">
        <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-10 shadow-sm text-center space-y-3">
          <HugeiconsIcon icon={Loading01Icon} className="size-8 animate-spin mx-auto text-primary" />
          <p className="text-sm font-semibold text-foreground">Validating Event Invitation...</p>
          <p className="text-xs text-muted-foreground">Verifying staff credential and contact matching.</p>
        </div>
      </div>
    )
  }

  if (errorMessage) {
    const isContactMismatch = errorCode === "invitation_contact_mismatch"

    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-muted/20">
        <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-8 shadow-sm text-center space-y-5">
          <div className="mx-auto size-14 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
            <HugeiconsIcon icon={AlertCircleIcon} className="size-7" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-foreground">
              {isContactMismatch ? "Phone Number Mismatch" : "Invalid Staff Invitation"}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">{errorMessage}</p>
          </div>

          {isContactMismatch && currentUser?.phone && (
            <div className="p-3.5 rounded-xl border border-border/70 bg-muted/30 text-xs text-left space-y-1">
              <span className="text-[11px] text-muted-foreground">Currently logged in as:</span>
              <p className="font-mono font-semibold text-foreground">{currentUser.phone}</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Please switch to the account with the invited phone number to accept.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2">
            {isContactMismatch ? (
              <Button onClick={handleSwitchAccount} variant="outline" className="w-full gap-2 text-xs">
                <HugeiconsIcon icon={Logout01Icon} className="size-3.5" />
                Switch Account
              </Button>
            ) : (
              <Button onClick={() => router.push("/")} variant="outline" className="w-full text-xs">
                Return to Login
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/20">
      <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto size-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <HugeiconsIcon icon={Calendar03Icon} className="size-7" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Join Event Crew</h2>
          <p className="text-xs text-muted-foreground">
            You have been invited to join the staff for <strong className="text-foreground">{previewData?.event?.title}</strong>.
          </p>
        </div>

        <div className="rounded-xl border border-border/70 bg-muted/30 p-4 space-y-3.5 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <span className="text-muted-foreground">Event</span>
            <span className="font-bold text-foreground">{previewData?.event?.title}</span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <span className="text-muted-foreground">Role</span>
            <Badge className="capitalize text-[10px] font-bold">
              {previewData?.role}
            </Badge>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <span className="text-muted-foreground">Invited Contact</span>
            <span className="font-mono text-foreground font-medium">{previewData?.masked_contact}</span>
          </div>

          {previewData?.assignment_expires_at && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Assignment Expiry</span>
              <span className="text-muted-foreground">
                {new Date(previewData.assignment_expires_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-2 pt-2">
          <Button
            onClick={handleClaim}
            disabled={isClaiming}
            className="w-full gap-2 font-semibold text-xs h-10 shadow-xs"
          >
            {isClaiming ? (
              <HugeiconsIcon icon={Loading01Icon} className="size-4 animate-spin" />
            ) : (
              <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-4" />
            )}
            {isClaiming ? "Accepting Staff Role..." : "Accept Staff Role"}
          </Button>

          <Button
            variant="ghost"
            onClick={() => router.push("/organizer")}
            className="w-full text-xs text-muted-foreground"
          >
            Decline or Skip for Now
          </Button>
        </div>
      </div>
    </div>
  )
}
