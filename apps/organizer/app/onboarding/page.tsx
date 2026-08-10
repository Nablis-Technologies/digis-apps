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
} from "@hugeicons/core-free-icons"
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
    <AgreementStep key="agreement" onNext={handleNext} initialData={formData} />,
  ]

  return (
    <div className="h-[100dvh] flex flex-col bg-background overflow-hidden">
      {/* Header (upper) */}
      <header className="flex-shrink-0 bg-background px-4 pt-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
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
        </div>

        {/* Step indicator circles */}
        <div className="mx-auto max-w-3xl mt-6 pb-3">
          <div className="flex items-center gap-2">
            {ONBOARDING_STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2 flex-1">
                <div className="flex items-center gap-2">
                  <div
                    className={`size-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      i < currentStep
                        ? "bg-lime-500 text-white"
                        : i === currentStep
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i < currentStep ? (
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-3.5" />
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${i === currentStep ? "text-foreground" : "text-muted-foreground"}`}>
                    {s.title}
                  </span>
                </div>
                {i < totalSteps - 1 && (
                  <div className={`flex-1 h-px ${i < currentStep ? "bg-lime-500" : "bg-border/50"}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Scrollable content */}
      <main className="flex-1 min-h-0 overflow-y-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="bg-card border border-border/60 rounded-2xl p-5 sm:p-6"
            >
              <p className="text-sm font-medium text-muted-foreground">
                Step {currentStep + 1} of {totalSteps}
              </p>
              <h2 className="mt-1 mb-5 text-xl font-bold text-foreground">
                {currentStepData.title}
              </h2>
              <p className="-mt-3 mb-5 text-sm text-muted-foreground">
                {currentStepData.description}
              </p>
              {stepComponents[currentStep]}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Footer (lower) */}
      <footer className="flex-shrink-0 border-t border-border/60 bg-background px-4 pt-3 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl pb-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 h-11"
              onClick={handleBack}
              disabled={currentStep === 0 || isSubmitting}
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4 mr-2" /> Back
            </Button>
            <Button
              type="submit"
              form="onboarding-form"
              className="flex-1 h-11 font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <HugeiconsIcon icon={Loading01Icon} strokeWidth={2} className="size-4 animate-spin mr-2" />
                  Completing Registration...
                </>
              ) : (
                <>
                  {currentStep === totalSteps - 1 ? "Complete Registration" : "Continue"}
                  {currentStep === totalSteps - 1 ? (
                    <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="size-4 ml-2" />
                  ) : (
                    <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4 ml-2" />
                  )}
                </>
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2 text-center">
            {currentStep === totalSteps - 1
              ? "Review the final confirmations and submit your registration."
              : "Each step helps us tailor the organizer workspace to your needs."}
          </p>
        </div>
      </footer>
    </div>
  )
}
