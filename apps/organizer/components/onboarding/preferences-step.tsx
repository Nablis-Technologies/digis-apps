"use client"

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { preferencesSchema, type PreferencesFormData } from "@/lib/schemas"
import { PAYOUT_METHODS, SUPPORT_OPTIONS } from "@/lib/constants"

interface PreferencesStepProps {
  onNext: (data: PreferencesFormData) => void
  initialData?: Partial<PreferencesFormData>
}

export function PreferencesStep({ onNext, initialData }: PreferencesStepProps) {
  const [selectedSupport, setSelectedSupport] = useState<string[]>(
    initialData?.supportOptions || []
  )

  const {
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema as any),
    mode: "onChange",
    defaultValues: {
      ...initialData,
      useQRScanner: initialData?.useQRScanner ?? false,
    },
  })

  useEffect(() => {
    setValue("supportOptions", selectedSupport, { shouldValidate: true })
  }, [selectedSupport, setValue])

  const onSubmit = (data: PreferencesFormData) => {
    onNext(data)
  }

  const toggleSupport = (value: string) => {
    setSelectedSupport((prev) =>
      prev.includes(value)
        ? prev.filter((opt) => opt !== value)
        : [...prev, value]
    )
  }

  return (
    <form id="onboarding-form" onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="payoutMethod">Preferred Payout Method</FieldLabel>
          <Controller
            name="payoutMethod"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger id="payoutMethod" className="bg-background">
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
            <p className="text-sm text-destructive">{errors.payoutMethod.message}</p>
          )}
        </Field>

        <Field>
          <FieldLabel>How would you like to receive support?</FieldLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            {SUPPORT_OPTIONS.map((option) => (
              <div
                key={option.value}
                className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-accent"
              >
                <Checkbox
                  id={option.value}
                  checked={selectedSupport.includes(option.value)}
                  onCheckedChange={() => toggleSupport(option.value)}
                />
                <label
                  htmlFor={option.value}
                  className="flex-1 cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
          {errors.supportOptions && (
            <p className="text-sm text-destructive">{errors.supportOptions.message}</p>
          )}
        </Field>

        <Field>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FieldLabel htmlFor="useQRScanner" className="text-base">
                Use QR Scanner
              </FieldLabel>
              <p className="text-sm text-muted-foreground">
                Enable mobile QR code scanning for ticket validation
              </p>
            </div>
            <Controller
              name="useQRScanner"
              control={control}
              render={({ field }) => (
                <Switch
                  id="useQRScanner"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>
        </Field>

      </FieldGroup>
    </form>
  )
}
