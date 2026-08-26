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
import { saveOrganizerAccount } from "@/lib/utils"
import { toast } from "sonner"

// Step components
import { ProfileStep } from "../../components/onboarding/profile-step"
import { BusinessStep } from "../../components/onboarding/business-step"
import { ExperienceStep } from "../../components/onboarding/experience-step"
import { PreferencesStep } from "../../components/onboarding/preferences-step"
import { AgreementStep } from "../../components/onboarding/agreement-step"

const STEP_ICONS = [
  UserIcon,
  Building02Icon,
  Award01Icon,
  Settings02Icon,
  FileValidationIcon,
]

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
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t border-border/40">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={handleBack}
              disabled={currentStep === 0 || isSubmitting}
              className="min-w-[120px] h-12 font-medium"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4 mr-2" />
              Back
            </Button>
            <Button
              type="submit"
              form="onboarding-form"
              size="lg"
              disabled={isSubmitting}
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
        </div>
      </div>
    </div>
  )
}
