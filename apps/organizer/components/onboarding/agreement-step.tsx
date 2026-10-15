"use client"

import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Checkbox } from "@/components/ui/checkbox"
import { agreementSchema, type AgreementFormData } from "@/lib/schemas"
import { SERVICE_FEE_PERCENTAGE, PLATFORM_FEE_PERCENTAGE } from "@/lib/constants"
import { HugeiconsIcon } from "@hugeicons/react"
import { Coins01Icon } from "@hugeicons/core-free-icons"

interface AgreementStepProps {
  onNext: (data: AgreementFormData) => void
  initialData?: Partial<AgreementFormData>
}

export function AgreementStep({ onNext, initialData }: AgreementStepProps) {
  const {
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<AgreementFormData>({
    resolver: zodResolver(agreementSchema as any),
    mode: "onChange",
    defaultValues: {
      agreedToTerms: initialData?.agreedToTerms ?? false,
      agreedToFees: initialData?.agreedToFees ?? false,
      agreedToDataAccuracy: initialData?.agreedToDataAccuracy ?? false,
    },
  })

  const watchedFields = watch()
  const isValid =
    watchedFields.agreedToTerms &&
    watchedFields.agreedToFees &&
    watchedFields.agreedToDataAccuracy

  const onSubmit = (data: AgreementFormData) => {
    if (isValid) {
      onNext(data)
    }
  }

  return (
    <form id="onboarding-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FieldGroup>
        {/* Service Information */}
        <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-lime-500/5 p-6">
          <h3 className="mb-3 text-lg font-bold text-foreground flex items-center gap-2">
            <span className="inline-flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary">
              <HugeiconsIcon icon={Coins01Icon} strokeWidth={2} className="size-4" />
            </span>
            Service Fees
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-background/50">
              <span className="text-muted-foreground">Platform Fee</span>
              <span className="font-semibold text-foreground">{PLATFORM_FEE_PERCENTAGE}% per ticket</span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-background/50">
              <span className="text-muted-foreground">Service Fee</span>
              <span className="font-semibold text-foreground">{SERVICE_FEE_PERCENTAGE}% per transaction</span>
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              Payment processing fees may apply based on the payment method
            </p>
          </div>
        </div>

        {/* Terms and Conditions */}
        <Field>
          <div className="space-y-5">
            <label
              htmlFor="agreedToTerms"
              className="flex items-start space-x-4 p-4 rounded-xl border-2 border-border/60 hover:border-primary/50 hover:bg-accent/30 cursor-pointer transition-all"
            >
              <Controller
                name="agreedToTerms"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="agreedToTerms"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="mt-1"
                  />
                )}
              />
              <div className="flex-1">
                <p className="text-sm font-semibold leading-snug mb-1">
                  I agree to the Terms and Conditions
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  By checking this box, you agree to our{" "}
                  <a href="#" className="underline hover:text-foreground font-medium">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="underline hover:text-foreground font-medium">
                    Privacy Policy
                  </a>
                </p>
              </div>
            </label>
            {errors.agreedToTerms && (
              <p className="text-sm text-destructive">{errors.agreedToTerms.message}</p>
            )}

            <label
              htmlFor="agreedToFees"
              className="flex items-start space-x-4 p-4 rounded-xl border-2 border-border/60 hover:border-primary/50 hover:bg-accent/30 cursor-pointer transition-all"
            >
              <Controller
                name="agreedToFees"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="agreedToFees"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="mt-1"
                  />
                )}
              />
              <div className="flex-1">
                <p className="text-sm font-semibold leading-snug mb-1">
                  I acknowledge the service fees
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  You understand and agree to the platform and service fees listed above
                </p>
              </div>
            </label>
            {errors.agreedToFees && (
              <p className="text-sm text-destructive">{errors.agreedToFees.message}</p>
            )}

            <label
              htmlFor="agreedToDataAccuracy"
              className="flex items-start space-x-4 p-4 rounded-xl border-2 border-border/60 hover:border-primary/50 hover:bg-accent/30 cursor-pointer transition-all"
            >
              <Controller
                name="agreedToDataAccuracy"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="agreedToDataAccuracy"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="mt-1"
                  />
                )}
              />
              <div className="flex-1">
                <p className="text-sm font-semibold leading-snug mb-1">
                  I confirm the accuracy of my information
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  All information provided is accurate and up to date
                </p>
              </div>
            </label>
            {errors.agreedToDataAccuracy && (
              <p className="text-sm text-destructive">
                {errors.agreedToDataAccuracy.message}
              </p>
            )}
          </div>
        </Field>

      </FieldGroup>
    </form>
  )
}
