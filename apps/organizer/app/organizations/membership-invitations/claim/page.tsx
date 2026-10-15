"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { getAccessToken, clearTokens } from "@workspace/store/api"
import { useGetMeQuery } from "@workspace/store/reducers/authApi"
import {
  usePreviewMembershipInvitationMutation,
  useClaimMembershipInvitationMutation,
  type MembershipInvitationPreview,
} from "@workspace/store/reducers/membershipsApi"
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
  Shield01Icon,
  SmartPhone01Icon,
  ArrowRight01Icon,
  Logout01Icon,
} from "@hugeicons/core-free-icons"

export default function ClaimMembershipInvitationPage() {
  const router = useRouter()
  const { data: meData, isLoading: isMeLoading } = useGetMeQuery()
  const currentUser = meData?.data?.user

  const [token, setToken] = React.useState<string | null>(null)
  const [tokenChecked, setTokenChecked] = React.useState(false)

  const [previewInvitation, { isLoading: isPreviewLoading }] = usePreviewMembershipInvitationMutation()
  const [claimInvitation, { isLoading: isClaiming }] = useClaimMembershipInvitationMutation()

  const [previewData, setPreviewData] = React.useState<MembershipInvitationPreview | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [errorCode, setErrorCode] = React.useState<string | null>(null)
  const [claimedSuccess, setClaimedSuccess] = React.useState(false)

  // 1. Extract token from URL fragment (hash) safely on mount
  React.useEffect(() => {
    if (typeof window === "undefined") return

    let extractedToken: string | null = null

    // Read from window.location.hash
    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      extractedToken = hashParams.get("token")
      if (extractedToken) {
        // Strip the hash from browser history immediately
        window.history.replaceState(null, "", window.location.pathname)
        // Store in sessionStorage in case user needs to log in
        sessionStorage.setItem("pending_membership_claim_token", extractedToken)
      }
    }

    // Fallback to sessionStorage if page was reloaded or redirected after login
    if (!extractedToken) {
      extractedToken = sessionStorage.getItem("pending_membership_claim_token")
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
      sessionStorage.removeItem("pending_membership_claim_token")
      setClaimedSuccess(true)
      toast.success("Welcome to the team!", {
        description: res?.data?.already_member
          ? `You are already an active member of ${previewData?.organization?.name || "this organization"}.`
          : `You have joined ${previewData?.organization?.name || "the organization"}.`,
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
    router.replace(`/?redirectTo=${encodeURIComponent("/organizations/membership-invitations/claim")}`)
  }

  // State: Token not found
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
              This link is missing a valid invitation token. Please check the link you received or request a new invitation.
            </p>
          </div>
          <Button onClick={() => router.push("/")} variant="outline" className="w-full text-xs">
            Return to Login
          </Button>
        </div>
      </div>
    )
  }

  // State: User not authenticated
  if (tokenChecked && token && !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-muted/20">
        <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-8 shadow-sm text-center space-y-5">
          <div className="mx-auto size-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <HugeiconsIcon icon={UserGroupIcon} className="size-7" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Organization Team Invitation
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You have been invited to join an organization on Digis. Please sign in or register with your verified mobile phone number to preview and accept.
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
            onClick={() => router.push(`/?redirectTo=${encodeURIComponent("/organizations/membership-invitations/claim")}`)}
            className="w-full gap-2 font-semibold text-xs shadow-xs"
          >
            Sign In / Register with Phone
            <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" />
          </Button>
        </div>
      </div>
    )
  }

  // State: Successfully claimed
  if (claimedSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-muted/20">
        <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-8 shadow-sm text-center space-y-5">
          <div className="mx-auto size-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Welcome to the Team!
            </h2>
            <p className="text-xs text-muted-foreground">
              You are now an active team member of{" "}
              <strong className="text-foreground">{previewData?.organization?.name}</strong>.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs text-emerald-800 dark:text-emerald-300">
            <p className="font-semibold capitalize">Assigned Role: {previewData?.role}</p>
            <p className="text-[11px] opacity-90 mt-0.5">
              Your permissions are active immediately. You can now access workspace events and management tools.
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

  // State: Loading preview
  if (isPreviewLoading || isMeLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-muted/20">
        <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-10 shadow-sm text-center space-y-3">
          <HugeiconsIcon icon={Loading01Icon} className="size-8 animate-spin mx-auto text-primary" />
          <p className="text-sm font-semibold text-foreground">Validating Invitation...</p>
          <p className="text-xs text-muted-foreground">Retrieving organization details and verifying phone identity.</p>
        </div>
      </div>
    )
  }

  // State: Error during preview or claim
  if (errorMessage) {
    const isContactMismatch = errorCode === "invitation_contact_mismatch"
    const isInvalidClaim = errorCode?.includes("claim_invalid") || errorCode === "401"

    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-muted/20">
        <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-8 shadow-sm text-center space-y-5">
          <div className="mx-auto size-14 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
            <HugeiconsIcon icon={AlertCircleIcon} className="size-7" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-foreground">
              {isContactMismatch ? "Phone Number Mismatch" : "Invalid Invitation"}
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

  // State: Ready to preview & accept
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/20">
      <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto size-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <HugeiconsIcon icon={UserGroupIcon} className="size-7" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Join Organization</h2>
          <p className="text-xs text-muted-foreground">
            You have been invited to join <strong className="text-foreground">{previewData?.organization?.name}</strong>.
          </p>
        </div>

        {/* Invitation Breakdown Card */}
        <div className="rounded-xl border border-border/70 bg-muted/30 p-4 space-y-3.5 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <span className="text-muted-foreground">Organization</span>
            <span className="font-bold text-foreground">{previewData?.organization?.name}</span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <span className="text-muted-foreground">Invited Role</span>
            {previewData?.role === "admin" ? (
              <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 text-[10px] font-bold">
                Admin
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px] font-bold">
                Staff
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <span className="text-muted-foreground">Invited Contact</span>
            <span className="font-mono text-foreground font-medium">{previewData?.masked_contact}</span>
          </div>

          {previewData?.expires_at && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Link Expiration</span>
              <span className="text-muted-foreground">
                {new Date(previewData.expires_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          )}
        </div>

        {/* Role Privileges Notice */}
        <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 text-xs text-foreground space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-primary">
            <HugeiconsIcon icon={SecurityCheckIcon} className="size-4" />
            <span>Role Permissions</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {previewData?.role === "admin"
              ? "As an Admin, you will be able to manage events, ticket tiers, lineups, promo codes, and invite other team members."
              : "As Staff, you will be able to scan tickets, operate mobile gate devices, and check in attendees."}
          </p>
        </div>

        {/* Claim Actions */}
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
            {isClaiming ? "Accepting Invitation..." : "Accept Invitation"}
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
