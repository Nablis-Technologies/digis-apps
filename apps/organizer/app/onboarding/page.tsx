"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  CheckmarkCircle01Icon,
  Tick02Icon,
  Loading01Icon,
  UserIcon,
  Building02Icon,
  Award01Icon,
  Settings02Icon,
  FileValidationIcon,
} from "@hugeicons/core-free-icons"
import { ONBOARDING_STEPS } from "@/lib/constants"
import { toast } from "sonner"
import { useSignupMutation, useLoginMutation } from "@workspace/store/reducers/authApi"
import {
  useCreateOwnerOrganizationMutation,
  useUploadOwnerOrganizationDocumentsMutation,
  useSubmitVerificationMutation,
} from "@workspace/store/reducers/organizationsApi"

// Step components
import { ProfileStep } from "../../components/onboarding/profile-step"
import { BusinessStep } from "../../components/onboarding/business-step"
import { ExperienceStep } from "../../components/onboarding/experience-step"
import { PreferencesStep } from "../../components/onboarding/preferences-step"
import { AgreementStep } from "../../components/onboarding/agreement-step"
import { VerificationStep } from "../../components/onboarding/verification-step"

const STEP_ICONS = [
  UserIcon,
  Building02Icon,
  Award01Icon,
  Settings02Icon,
  FileValidationIcon,
  CheckmarkCircle01Icon,
]

type VerificationOutcome =
  | { status: "verified" | "pending" | "failed"; orgName: string; message?: string }

function OutcomePanel({
  outcome,
  isSubmitting,
  onRetry,
  onDashboard,
}: {
  outcome: VerificationOutcome
  isSubmitting: boolean
  onRetry: () => void
  onDashboard: () => void
}) {
  return (
    <div className="flex flex-col items-center text-center gap-4 py-4">
      {outcome.status === "verified" && (
        <>
          <div className="size-16 rounded-full bg-chart-2/15 flex items-center justify-center">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-8 text-chart-2" />
          </div>
          <div>
            <h2 className="font-bold text-xl mb-1">You&apos;re verified!</h2>
            <p className="text-muted-foreground text-sm max-w-md">
              <span className="font-medium text-foreground">{outcome.orgName}</span> is verified.
              You can now create events and publish them right away.
            </p>
          </div>
          <Button size="lg" className="mt-2 min-w-[220px]" onClick={onDashboard}>
            Go to Dashboard
            <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-5 ml-2" />
          </Button>
        </>
      )}
      {outcome.status === "pending" && (
        <>
          <div className="size-16 rounded-full bg-amber-500/15 flex items-center justify-center">
            <HugeiconsIcon icon={FileValidationIcon} strokeWidth={2} className="size-8 text-amber-500" />
          </div>
          <div>
            <h2 className="font-bold text-xl mb-1">Submitted for review</h2>
            <p className="text-muted-foreground text-sm max-w-md">
              <span className="font-medium text-foreground">{outcome.orgName}</span> is awaiting
              admin approval. You can create draft events meanwhile — publishing unlocks as soon
              as you&apos;re verified.
            </p>
          </div>
          <Button size="lg" className="mt-2 min-w-[220px]" onClick={onDashboard}>
            Go to Dashboard
            <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-5 ml-2" />
          </Button>
        </>
      )}
      {outcome.status === "failed" && (
        <>
          <div className="size-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <HugeiconsIcon icon={FileValidationIcon} strokeWidth={2} className="size-8 text-destructive" />
          </div>
          <div>
            <h2 className="font-bold text-xl mb-1">Verification didn&apos;t go through</h2>
            <p className="text-muted-foreground text-sm max-w-md">
              {outcome.message || "Documents upload or submission failed."} Your account and
              organization were created — you can retry the verification step.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <Button size="lg" onClick={onRetry} disabled={isSubmitting} className="min-w-[220px]">
              {isSubmitting ? (
                <>
                  <HugeiconsIcon icon={Loading01Icon} strokeWidth={2} className="size-5 animate-spin mr-2" />
                  Retrying...
                </>
              ) : (
                <>
                  <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="size-5 mr-2" />
                  Retry Verification
                </>
              )}
            </Button>
            <Button size="lg" variant="outline" onClick={onDashboard} disabled={isSubmitting}>
              Go to Dashboard
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const [signup] = useSignupMutation()
  const [login] = useLoginMutation()
  const [createOrganization] = useCreateOwnerOrganizationMutation()
  const [uploadDocuments] = useUploadOwnerOrganizationDocumentsMutation()
  const [submitVerification] = useSubmitVerificationMutation()
  const [createdOrgId, setCreatedOrgId] = useState<string | null>(null)
  const [outcome, setOutcome] = useState<VerificationOutcome | null>(null)

  const totalSteps = ONBOARDING_STEPS.length
  const currentStepData = ONBOARDING_STEPS[currentStep]

  const handleNext = (stepData: any) => {
    setFormData((prev) => ({ ...prev, ...stepData }))

    if (currentStep === totalSteps - 1) {
      // Last step - submit and save
      handleSubmit({ ...formData, ...stepData })
    } else {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  // Uploads the four verification documents, then submits the organization
  // for verification. Returns true when the org ends up verified (either
  // instantly auto-approved for small audiences, or already approved).
  // Throws with a human-readable message otherwise.
  const runVerification = async (orgId: string, data: any): Promise<boolean> => {
    const docs = new FormData()
    docs.append("profile", data.profileFile)
    docs.append("banner", data.bannerFile)
    docs.append("business_license", data.businessLicenseFile)
    docs.append("tin_certificate", data.tinCertificateFile)

    console.log("Step 4: Uploading verification documents...")
    toast.loading("Uploading verification documents...")
    try {
      await uploadDocuments({ id: orgId, formData: docs }).unwrap()
    } catch (uploadError: any) {
      console.error("Document upload error:", uploadError)
      throw new Error(
        uploadError?.data?.message ||
          uploadError?.data?.error ||
          "Failed to upload verification documents. Please try again."
      )
    }
    toast.dismiss()

    console.log("Step 5: Submitting organization for verification...")
    toast.loading("Submitting for verification...")
    try {
      const submitResult = await submitVerification(orgId).unwrap()
      console.log("Verification submit result:", submitResult)
      return submitResult.data.verified === true
    } catch (submitError: any) {
      console.error("Verification submit error:", submitError)
      throw new Error(
        submitError?.data?.message ||
          submitError?.data?.error ||
          "Failed to submit for verification. You can retry below."
      )
    } finally {
      toast.dismiss()
    }
  }

  const retryVerification = async () => {
    if (!createdOrgId) return
    setIsSubmitting(true)
    setOutcome(null)
    try {
      const verified = await runVerification(createdOrgId, formData)
      const orgName =
        (formData as any).businessName || (formData as any).fullName || "My Organization"
      setOutcome({ status: verified ? "verified" : "pending", orgName })
      toast.success(
        verified ? "Organization verified!" : "Submitted for review!",
        {
          description: verified
            ? "You can now publish events."
            : "An admin will review your documents soon.",
        }
      )
    } catch (error: any) {
      const orgName =
        (formData as any).businessName ||
        `${(formData as any).first_name || ""} ${(formData as any).last_name || ""}`.trim() ||
        "My Organization"
      setOutcome({ status: "failed", orgName, message: error?.message })
      toast.error("Verification failed", { description: error?.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true)
    
    console.log("Onboarding form data:", data)
    
    try {
      // Step 1: Register user account
      if (data.email && data.password) {
        console.log("Step 1: Creating user account...")
        toast.loading("Creating your account...")
        
        try {
          const signupPayload = {
            user: {
              email: data.email,
              phone: data.phone || undefined,
              first_name: data.first_name,
              last_name: data.last_name,
              password: data.password,
              password_confirmation: data.password,
            },
            verification_token: data.verification_token,
          }
          
          console.log("Signup payload:", signupPayload)
          
          const signupResult = await signup(signupPayload).unwrap()
          
          console.log("Signup result:", signupResult)
          
          const createdUserId = signupResult.data.user.id
          setUserId(createdUserId)
          
          toast.dismiss()
          toast.success("Account created!")
          
          // Step 2: Login to get access token
          console.log("Step 2: Logging in...")
          toast.loading("Logging you in...")
          
          try {
            const loginResult = await login({
              identifier: data.email,
              password: data.password,
            }).unwrap()
            
            console.log("Login successful:", loginResult)
            
            toast.dismiss()
            toast.success("Logged in!")
            
            // Step 3: Create organization (now authenticated)
            console.log("Step 3: Creating organization...")
            toast.loading("Setting up your organization...")
            
            try {
              // Build organization payload according to API spec
              // (POST /organizations/owner — see Digis API_collection.json).
              // Field values come from steps whose option lists already match
              // the backend enums exactly (category, audience, frequency).
              const orgPayload = {
                organization: {
                  name:
                    data.businessName ||
                    `${data.first_name || ""} ${data.last_name || ""}`.trim() ||
                    "My Organization",
                  description: data.description || undefined,
                  organizer_type: (data.organizer_type || "individual") as
                    | "individual"
                    | "company"
                    | "ngo"
                    | "government"
                    | "collective",
                  // Use the first selected event type as category (required field)
                  category: Array.isArray(data.eventTypes) && data.eventTypes.length > 0 ? data.eventTypes[0] : "other",
                  contact_phone: data.phone || undefined,
                  contact_email: data.email || undefined,
                  tin_number: data.tin || undefined,
                  address_line1: data.address || undefined,
                  city: data.city || undefined,
                  estimated_audience: data.audienceSize || undefined,
                  event_frequency: data.eventFrequency || undefined,
                },
              }
              
              console.log("Organization payload:", orgPayload)
              
              const orgResult = await createOrganization(orgPayload).unwrap()
              const orgId = orgResult.data.id
              const orgName = orgResult.data.name
              setCreatedOrgId(orgId)
              
              console.log("Organization created:", orgResult)
              toast.dismiss()
              toast.success("Organization created!")

              // Steps 4-5: upload verification documents, then submit the
              // organization for verification. Until the org is verified,
              // events stay drafts and cannot be published — so onboarding
              // only completes once the org is submitted, not merely created.
              try {
                const verified = await runVerification(orgId, data)
                setFormData(data)
                setOutcome({ status: verified ? "verified" : "pending", orgName })
                toast.success(
                  verified ? "Organization verified!" : "Submitted for review!",
                  {
                    description: verified
                      ? "Welcome to DEGES. You can now create and publish events."
                      : "An admin will review your documents. You can create draft events meanwhile.",
                  }
                )
              } catch (verificationError: any) {
                setFormData(data)
                setOutcome({ status: "failed", orgName, message: verificationError?.message })
                toast.error("Verification step failed", {
                  description: verificationError?.message,
                })
              } finally {
                setIsSubmitting(false)
              }
            } catch (orgError: any) {
              toast.dismiss()
              console.error("Organization creation error details:", orgError)
              
              const errorMsg = orgError?.data?.message 
                || orgError?.data?.error
                || 'Failed to create organization'
              
              toast.error("Organization creation failed", {
                description: errorMsg,
              })
              setIsSubmitting(false)
            }
          } catch (loginError: any) {
            toast.dismiss()
            console.error("Login error after signup:", loginError)
            
            toast.error("Login failed", {
              description: "Please try logging in manually.",
            })
            setIsSubmitting(false)
            // Redirect to login
            setTimeout(() => {
              router.push("/organizer")
            }, 2000)
          }
        } catch (signupError: any) {
          toast.dismiss()
          console.error("Signup error details:", signupError)
          console.error("Signup error data:", signupError?.data)
          console.error("Signup error status:", signupError?.status)
          
          const errorMsg = signupError?.data?.message 
            || signupError?.data?.error
            || signupError?.data?.errors
            || (signupError?.status === 'FETCH_ERROR' ? 'Cannot connect to server. Please check if the backend is running at ' + (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000') : 'Failed to create account')
          
          // Show detailed validation errors if available
          let errorDescription = errorMsg
          if (signupError?.data?.errors && typeof signupError.data.errors === 'object') {
            errorDescription = Object.entries(signupError.data.errors)
              .map(([field, messages]: [string, any]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
              .join('\n')
          }
          
          toast.error("Account creation failed", {
            description: errorDescription,
          })
          setIsSubmitting(false)
          return
        }
      } else {
        toast.error("Missing required fields", {
          description: "Email and password are required.",
        })
        setIsSubmitting(false)
      }
    } catch (error: any) {
      console.error("Unexpected onboarding error:", error)
      toast.dismiss()
      toast.error("Something went wrong", {
        description: error?.message || "Please try again.",
      })
      setIsSubmitting(false)
    }
  }

  const stepComponents = [
    <ProfileStep key="profile" onNext={handleNext} initialData={formData} />,
    <BusinessStep key="business" onNext={handleNext} initialData={formData} />,
    <ExperienceStep key="experience" onNext={handleNext} initialData={formData} />,
    <PreferencesStep key="preferences" onNext={handleNext} initialData={formData} />,
    <AgreementStep key="agreement" onNext={handleNext} initialData={formData} />,
    <VerificationStep key="verification" onNext={handleNext} initialData={formData} />,
  ]

  const progressPercentage = ((currentStep + 1) / totalSteps) * 100

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-background via-background to-muted/20">
      {/* Fixed Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/40">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {/* Logo/Brand */}
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="text-lg font-bold text-foreground">DEGES</h1>
              <p className="text-xs text-muted-foreground">Organizer Registration</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">Step {currentStep + 1} of {totalSteps}</p>
              <p className="text-xs text-muted-foreground">{Math.round(progressPercentage)}% Complete</p>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="relative pb-6">
            {/* Progress Bar Background */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-muted/50 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-chart-2"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>

            {/* Step Indicators */}
            <div className="flex items-center justify-between pt-6">
              {ONBOARDING_STEPS.map((step, index) => {
                const isCompleted = index < currentStep
                const isCurrent = index === currentStep
                const StepIcon = STEP_ICONS[index]

                return (
                  <div key={step.id} className="flex flex-col items-center gap-2 flex-1">
                    <motion.div
                      className={`relative size-10 sm:size-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isCompleted
                          ? "bg-chart-2 shadow-lg shadow-chart-2/30"
                          : isCurrent
                            ? "bg-primary shadow-lg shadow-primary/30 ring-4 ring-primary/20"
                            : "bg-muted/60 border-2 border-border/50"
                      }`}
                      animate={isCurrent ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                      transition={{ duration: 2, repeat: isCurrent ? Infinity : 0 }}
                    >
                      {isCompleted ? (
                        <HugeiconsIcon
                          icon={CheckmarkCircle01Icon}
                          strokeWidth={2.5}
                          className="size-5 sm:size-6 text-white"
                        />
                      ) : (
                        <HugeiconsIcon
                          icon={StepIcon}
                          strokeWidth={2}
                          className={`size-5 sm:size-6 ${
                            isCurrent ? "text-primary-foreground" : "text-muted-foreground"
                          }`}
                        />
                      )}
                    </motion.div>
                    <p
                      className={`text-xs font-medium text-center leading-tight hidden sm:block max-w-[80px] ${
                        isCurrent ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {step.title}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-[220px] sm:pt-[240px] pb-32 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {outcome ? (
            <motion.div
              key="outcome"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl shadow-xl shadow-black/5 p-6 sm:p-8 lg:p-10"
            >
              <OutcomePanel
                outcome={outcome}
                isSubmitting={isSubmitting}
                onRetry={retryVerification}
                onDashboard={() => router.push("/organizer")}
              />
            </motion.div>
          ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {/* Step Content Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl shadow-xl shadow-black/5 p-6 sm:p-8 lg:p-10"
              >
                {stepComponents[currentStep]}
              </motion.div>
            </motion.div>
          </AnimatePresence>
          )}
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t border-border/40">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-4">
          {outcome && outcome.status !== "failed" ? (
            <Button
              size="lg"
              onClick={() => router.push("/organizer")}
              className="w-full h-12 font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
            >
              Go to Dashboard
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-5 ml-2" />
            </Button>
          ) : (
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={handleBack}
              disabled={currentStep === 0 || isSubmitting || outcome !== null}
              className="min-w-[120px] h-12 font-medium"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4 mr-2" />
              Back
            </Button>
            <Button
              type="submit"
              form="onboarding-form"
              size="lg"
              disabled={isSubmitting || outcome !== null}
              className="flex-1 h-12 font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
            >
              {isSubmitting ? (
                <>
                  <HugeiconsIcon icon={Loading01Icon} strokeWidth={2} className="size-5 animate-spin mr-2" />
                  Completing Registration...
                </>
              ) : (
                <>
                  {currentStep === totalSteps - 1 ? "Complete Registration" : "Continue"}
                  <HugeiconsIcon
                    icon={currentStep === totalSteps - 1 ? Tick02Icon : ArrowRight01Icon}
                    strokeWidth={2}
                    className="size-5 ml-2"
                  />
                </>
              )}
            </Button>
          </div>
          )}
        </div>
      </div>
    </div>
  )
}
