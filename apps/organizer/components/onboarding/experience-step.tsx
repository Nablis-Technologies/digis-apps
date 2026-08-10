"use client"

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { experienceSchema, type ExperienceFormData } from "@/lib/schemas"
import { EVENT_TYPES, AUDIENCE_SIZES, EVENT_FREQUENCIES } from "@/lib/constants"

interface ExperienceStepProps {
  onNext: (data: ExperienceFormData) => void
  initialData?: Partial<ExperienceFormData>
}

export function ExperienceStep({ onNext, initialData }: ExperienceStepProps) {
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>(
    initialData?.eventTypes || []
  )

  const {
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<ExperienceFormData>({
    resolver: zodResolver(experienceSchema as any),
    mode: "onChange",
    defaultValues: initialData,
  })

  useEffect(() => {
    setValue("eventTypes", selectedEventTypes, { shouldValidate: true })
  }, [selectedEventTypes, setValue])

  const onSubmit = (data: ExperienceFormData) => {
    onNext(data)
  }

  const toggleEventType = (value: string) => {
    setSelectedEventTypes((prev) =>
      prev.includes(value)
        ? prev.filter((type) => type !== value)
        : [...prev, value]
    )
  }

  return (
    <form id="onboarding-form" onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup>
        <Field>
          <FieldLabel>What types of events do you organize?</FieldLabel>
          <div className="grid gap-3 sm:grid-cols-2">
            {EVENT_TYPES.map((type) => (
              <div
                key={type.value}
                className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-accent"
              >
                <Checkbox
                  id={type.value}
                  checked={selectedEventTypes.includes(type.value)}
                  onCheckedChange={() => toggleEventType(type.value)}
                />
                <label
                  htmlFor={type.value}
                  className="flex-1 cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {type.label}
                </label>
              </div>
            ))}
          </div>
          {errors.eventTypes && (
            <p className="text-sm text-destructive">{errors.eventTypes.message}</p>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="audienceSize">Typical Audience Size</FieldLabel>
          <Controller
            name="audienceSize"
            control={control}
            render={({ field }) => (
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <SelectTrigger id="audienceSize" className="bg-background">
                  <SelectValue placeholder="Select audience size" />
                </SelectTrigger>
                <SelectContent>
                  {AUDIENCE_SIZES.map((size) => (
                    <SelectItem key={size.value} value={size.value}>
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.audienceSize && (
            <p className="text-sm text-destructive">{errors.audienceSize.message}</p>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="eventFrequency">How often do you organize events?</FieldLabel>
          <Controller
            name="eventFrequency"
            control={control}
            render={({ field }) => (
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <SelectTrigger id="eventFrequency" className="bg-background">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_FREQUENCIES.map((freq) => (
                    <SelectItem key={freq.value} value={freq.value}>
                      {freq.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.eventFrequency && (
            <p className="text-sm text-destructive">{errors.eventFrequency.message}</p>
          )}
        </Field>

      </FieldGroup>
    </form>
  )
}
