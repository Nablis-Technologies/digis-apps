"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, Tick02Icon } from "@hugeicons/core-free-icons"
import { ONBOARDING_STEPS } from "@/lib/constants"
import { saveOrganizerAccount } from "@/lib/utils"
import { toast } from "sonner"

// Step components (will import these)
import { ProfileStep } from "../../components/onboarding/profile-step"
import { BusinessStep } from "../../components/onboarding/business-step"
import { ExperienceStep } from "../../components/onboarding/experience-step"
import { PreferencesStep } from "../../components/onboarding/preferences-step"
import { AgreementStep } from "../../components/onboarding/agreement-step"

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const totalSteps = ONBOARDING_STEPS.length
  const progress = ((currentStep + 1) / totalSteps) * 100
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

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true)
    try {
      // Save to localStorage
      const organizerAccount = {
        ...data,
        completedAt: new Date().toISOString(),
      }
      saveOrganizerAccount(organizerAccount)

      // Show success toast
      toast.success("Registration complete!", {
        description: "Welcome to DEGES. Let's create your first event.",
      })

      // Redirect to dashboard after short delay
      setTimeout(() => {
        router.push("/organizer")
      }, 1500)
    } catch (error) {
      toast.error("Something went wrong", {
        description: "Please try again.",
      })
      setIsSubmitting(false)
    }
  }

  const stepComponents = [
    <ProfileStep key="profile" onNext={handleNext} initialData={formData} />,
    <BusinessStep key="business" onNext={handleNext} initialData={formData} />,
    <ExperienceStep key="experience" onNext={handleNext} initialData={formData} />,
    <PreferencesStep key="preferences" onNext={handleNext} initialData={formData} />,
    <AgreementStep key="agreement" onNext={handleNext} initialData={formData} isSubmitting={isSubmitting} />,
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 border-b border-border/60 pb-6"
        >
          <p className="text-sm font-medium text-muted-foreground">
            Organizer Registration
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Create your organizer account
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground">
            Complete a few steps to configure your profile, business details, and
            operating preferences.
          </p>
        </motion.div>

        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <Card className="rounded-3xl border-border/60 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle className="text-lg">Registration Progress</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Complete each section to finish setting up your organizer
                      workspace.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <div className="rounded-full border border-border/60 px-3 py-1 font-medium text-foreground">
                      Step {currentStep + 1} of {totalSteps}
                    </div>
                    <div className="rounded-full border border-border/60 px-3 py-1 text-muted-foreground">
                      {Math.round(progress)}% complete
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-emerald-600 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-5">
                  {ONBOARDING_STEPS.map((step, index) => {
                    const isComplete = index < currentStep
                    const isCurrent = index === currentStep

                    return (
                      <div
                        key={step.id}
                        className={`rounded-3xl border px-4 py-3 transition-colors ${
                          isCurrent
                            ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/30"
                            : "border-border/60 bg-card"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
                              isComplete
                                ? "border-emerald-600 bg-emerald-600 text-white"
                                : isCurrent
                                  ? "border-emerald-600 text-emerald-700 dark:text-emerald-300"
                                  : "border-border text-muted-foreground"
                            }`}
                          >
                            {isComplete ? (
                              <HugeiconsIcon
                                icon={Tick02Icon}
                                strokeWidth={2.4}
                                className="size-4"
                              />
                            ) : (
                              index + 1
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground">{step.title}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="overflow-hidden rounded-3xl border-border/60 shadow-sm">
                <CardHeader className="gap-4 pb-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Current Step
                      </p>
                      <CardTitle className="mt-1 text-2xl">
                        {currentStepData.title}
                      </CardTitle>

                    </div>
                    <div className="rounded-full border border-border/60 px-3 py-1 text-sm font-medium text-muted-foreground">
                      {currentStep + 1}/{totalSteps}
                    </div>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="pt-6">{stepComponents[currentStep]}</CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="rounded-3xl border-border/60 shadow-sm">
              <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 0 || isSubmitting}
                  className="gap-2"
                >
                  <HugeiconsIcon
                    icon={ArrowLeft01Icon}
                    strokeWidth={2}
                    className="size-4"
                  />
                  Back
                </Button>

                <p className="text-sm text-muted-foreground">
                  {currentStep === totalSteps - 1
                    ? "Review the final confirmations and submit your registration."
                    : "Each step helps us tailor the organizer workspace to your needs."}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
