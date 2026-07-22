"use client"

import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Checkbox } from "@/components/ui/checkbox"
import { agreementSchema, type AgreementFormData } from "@/lib/schemas"
import { HugeiconsIcon } from "@hugeicons/react"
import { Tick02Icon } from "@hugeicons/core-free-icons"
import { SERVICE_FEE_PERCENTAGE, PLATFORM_FEE_PERCENTAGE } from "@/lib/constants"

interface AgreementStepProps {
  onNext: (data: AgreementFormData) => void
  initialData?: Partial<AgreementFormData>
  isSubmitting?: boolean
}

export function AgreementStep({ onNext, initialData, isSubmitting }: AgreementStepProps) {
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
    <form onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup>
        {/* Service Information */}
        <div className="rounded-lg border bg-muted/50 p-4">
          <h3 className="mb-2 font-semibold">Service Fees</h3>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>• Platform Fee: {PLATFORM_FEE_PERCENTAGE}% per ticket sold</p>
            <p>• Service Fee: {SERVICE_FEE_PERCENTAGE}% per transaction</p>
            <p>• Payment processing fees may apply</p>
          </div>
        </div>

        {/* Terms and Conditions */}
        <Field>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Controller
                name="agreedToTerms"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="agreedToTerms"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="mt-0.5"
                  />
                )}
              />
              <div className="flex-1">
                <label
                  htmlFor="agreedToTerms"
                  className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I agree to the Terms and Conditions
                </label>
                <p className="mt-1 text-xs text-muted-foreground">
                  By checking this box, you agree to our{" "}
                  <a href="#" className="underline hover:text-foreground">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="underline hover:text-foreground">
                    Privacy Policy
                  </a>
                </p>
              </div>
            </div>
            {errors.agreedToTerms && (
              <p className="text-sm text-destructive">{errors.agreedToTerms.message}</p>
            )}

            <div className="flex items-start space-x-3">
              <Controller
                name="agreedToFees"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="agreedToFees"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="mt-0.5"
                  />
                )}
              />
              <div className="flex-1">
                <label
                  htmlFor="agreedToFees"
                  className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I acknowledge the service fees
                </label>
                <p className="mt-1 text-xs text-muted-foreground">
                  You understand and agree to the platform and service fees listed above
                </p>
              </div>
            </div>
            {errors.agreedToFees && (
              <p className="text-sm text-destructive">{errors.agreedToFees.message}</p>
            )}

            <div className="flex items-start space-x-3">
              <Controller
                name="agreedToDataAccuracy"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="agreedToDataAccuracy"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="mt-0.5"
                  />
                )}
              />
              <div className="flex-1">
                <label
                  htmlFor="agreedToDataAccuracy"
                  className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I confirm the accuracy of my information
                </label>
                <p className="mt-1 text-xs text-muted-foreground">
                  All information provided is accurate and up to date
                </p>
              </div>
            </div>
            {errors.agreedToDataAccuracy && (
              <p className="text-sm text-destructive">
                {errors.agreedToDataAccuracy.message}
              </p>
            )}
          </div>
        </Field>

        <Field>
          <Button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="w-full gap-2"
            size="lg"
          >
            {isSubmitting ? (
              "Completing Registration..."
            ) : (
              <>
                <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="size-5" />
                Complete Registration
              </>
            )}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
