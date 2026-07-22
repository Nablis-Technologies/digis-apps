"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-950 dark:to-emerald-950">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -left-4 top-20 size-72 rounded-full bg-gradient-to-r from-emerald-400 to-green-400 opacity-20 blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute right-10 top-40 size-96 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400 opacity-20 blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute bottom-20 left-1/3 size-80 rounded-full bg-gradient-to-r from-lime-400 to-emerald-400 opacity-20 blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      <div className="relative z-10 container mx-auto max-w-4xl px-4 py-8">
        {/* Header with Glassmorphic Effect */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/40 px-4 py-2 backdrop-blur-lg dark:bg-gray-800/40">
            <span className="text-sm font-medium text-emerald-900 dark:text-emerald-200">
              Organizer Registration
            </span>
          </div>
          <h1 className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-4xl font-bold tracking-tight text-transparent dark:from-emerald-400 dark:via-green-400 dark:to-teal-400">
            Welcome to DEGES
          </h1>
          <p className="mt-2 text-lg text-gray-700 dark:text-gray-300">
            Let's get your organizer account set up in just a few steps
          </p>
        </motion.div>

        {/* Progress Bar with Glassmorphic Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8 rounded-2xl bg-white/60 p-6 backdrop-blur-xl dark:bg-gray-800/60"
        >
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              Step {currentStep + 1} of {totalSteps}
            </span>
            <span className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-1 text-xs font-bold text-white">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <Progress value={progress} className="h-3 bg-gray-200 dark:bg-gray-700" />
        </motion.div>

        {/* Stepper Navigation with Glassmorphic Style */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8 rounded-2xl bg-white/60 p-6 backdrop-blur-xl dark:bg-gray-800/60"
        >
          <nav aria-label="Progress">
            <ol className="flex items-center justify-between">
              {ONBOARDING_STEPS.map((step, index) => (
                <li
                  key={step.id}
                  className={`relative flex flex-1 flex-col items-center ${
                    index !== totalSteps - 1
                      ? "after:absolute after:left-1/2 after:top-5 after:h-0.5 after:w-full after:bg-gradient-to-r after:from-gray-300 after:to-gray-200 after:content-[''] dark:after:from-gray-600 dark:after:to-gray-700"
                      : ""
                  }`}
                >
                  <div className="relative z-10 flex flex-col items-center">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className={`flex size-10 items-center justify-center rounded-full border-2 shadow-lg transition-all ${
                        index < currentStep
                          ? "border-emerald-500 bg-gradient-to-br from-emerald-400 to-teal-500 text-white"
                          : index === currentStep
                            ? "border-green-500 bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-green-500/50"
                            : "border-gray-300 bg-white text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {index < currentStep ? (
                        <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.5} className="size-5" />
                      ) : (
                        <span className="text-sm font-bold">{index + 1}</span>
                      )}
                    </motion.div>
                    <span
                      className={`mt-2 hidden text-xs font-medium sm:block ${
                        index <= currentStep
                          ? "text-gray-900 dark:text-gray-100"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </nav>
        </motion.div>

        {/* Step Content with Enhanced Glassmorphic Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <div className="overflow-hidden rounded-3xl border border-white/20 bg-white/70 shadow-2xl backdrop-blur-2xl dark:border-gray-700/50 dark:bg-gray-800/70">
              <div className="bg-gradient-to-r from-emerald-500/10 via-green-500/10 to-teal-500/10 p-6 dark:from-emerald-500/20 dark:via-green-500/20 dark:to-teal-500/20">
                <h2 className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-2xl font-bold text-transparent dark:from-emerald-400 dark:to-teal-400">
                  {ONBOARDING_STEPS[currentStep].title}
                </h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {ONBOARDING_STEPS[currentStep].description}
                </p>
              </div>
              <div className="p-6">{stepComponents[currentStep]}</div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons with Glassmorphic Background */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between rounded-2xl bg-white/60 p-4 backdrop-blur-xl dark:bg-gray-800/60"
        >
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0 || isSubmitting}
            className="gap-2 border-gray-300 bg-white/50 backdrop-blur-sm hover:bg-white/80 dark:border-gray-600 dark:bg-gray-700/50 dark:hover:bg-gray-700/80"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" />
            Back
          </Button>

          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span className="hidden sm:inline">
              {currentStep === totalSteps - 1
                ? "✨ Ready to complete your registration"
                : "Continue to unlock the next step"}
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
