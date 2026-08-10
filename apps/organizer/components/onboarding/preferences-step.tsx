"use client"

import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { preferencesSchema, type PreferencesFormData } from "@/lib/schemas"
import { PAYOUT_METHODS } from "@/lib/constants"

interface PreferencesStepProps {
  onNext: (data: PreferencesFormData) => void
  initialData?: Partial<PreferencesFormData>
}

export function PreferencesStep({ onNext, initialData }: PreferencesStepProps) {
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema as any),
    mode: "onChange",
    defaultValues: initialData,
  })

  const onSubmit = (data: PreferencesFormData) => {
    onNext(data)
  }

  return (
    <form id="onboarding-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="payoutMethod" className="text-sm font-semibold">
            Preferred Payout Method
          </FieldLabel>
          <Controller
            name="payoutMethod"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger id="payoutMethod" className="h-12 bg-background/50 border-border/60 focus:border-primary transition-colors">
                  <SelectValue placeholder="Select payout method" />
                </SelectTrigger>
                <SelectContent>
                  {PAYOUT_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.payoutMethod && (
            <p className="text-sm text-destructive mt-1.5">{errors.payoutMethod.message}</p>
          )}
          <p className="text-sm text-muted-foreground mt-2">
            Choose how you'd like to receive payments from ticket sales
          </p>
        </Field>
      </FieldGroup>
    </form>
  )
}
