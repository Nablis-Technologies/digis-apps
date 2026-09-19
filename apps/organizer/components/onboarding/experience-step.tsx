"use client"

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { experienceSchema, type ExperienceFormData } from "@/lib/schemas"
import { EVENT_TYPES, AUDIENCE_SIZES, EVENT_FREQUENCIES } from "@/lib/constants"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  PresentationPodiumIcon,
  PencilEdit01Icon,
  BookOpenIcon,
  FootballIcon,
  TheaterIcon,
  SmileIcon,
  UserGroupIcon,
  FavouriteIcon,
  Store01Icon,
  Restaurant01Icon,
} from "@hugeicons/core-free-icons"
import { Music, PartyPopper, Palette, Shirt } from "lucide-react"

interface ExperienceStepProps {
  onNext: (data: ExperienceFormData) => void
  initialData?: Partial<ExperienceFormData>
}

// Map event types to icons (mix of Hugeicons and Lucide)
const EVENT_TYPE_ICONS: Record<string, { type: 'huge' | 'lucide', icon: any }> = {
  music: { type: 'lucide', icon: Music },
  sports: { type: 'huge', icon: FootballIcon },
  conference: { type: 'huge', icon: PresentationPodiumIcon },
  comedy: { type: 'huge', icon: SmileIcon },
  theater: { type: 'huge', icon: TheaterIcon },
  festival: { type: 'lucide', icon: PartyPopper },
  workshop: { type: 'huge', icon: PencilEdit01Icon },
  exhibition: { type: 'lucide', icon: Palette },
  other: { type: 'huge', icon: Store01Icon },
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
    <form id="onboarding-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FieldGroup>
        <Field>
          <FieldLabel className="text-sm font-semibold mb-3">
            What types of events do you organize?
          </FieldLabel>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {EVENT_TYPES.map((type) => {
              const iconConfig = EVENT_TYPE_ICONS[type.value]
              const isSelected = selectedEventTypes.includes(type.value)
              
              return (
                <label
                  key={type.value}
                  htmlFor={type.value}
                  className={`flex items-center space-x-3 rounded-xl border-2 p-4 cursor-pointer transition-all hover:bg-accent/50 ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border/60"
                  }`}
                >
                  <Checkbox
                    id={type.value}
                    checked={isSelected}
                    onCheckedChange={() => toggleEventType(type.value)}
                  />
                  {iconConfig && (
                    iconConfig.type === 'huge' ? (
                      <HugeiconsIcon
                        icon={iconConfig.icon}
                        strokeWidth={2}
                        className={`size-5 ${
                          isSelected ? "text-primary" : "text-muted-foreground"
                        }`}
                      />
                    ) : (
                      <iconConfig.icon
                        className={`size-5 ${
                          isSelected ? "text-primary" : "text-muted-foreground"
                        }`}
                        strokeWidth={2}
                      />
                    )
                  )}
                  <span className="text-sm font-medium leading-none flex-1">
                    {type.label}
                  </span>
                </label>
              )
            })}
          </div>
          {errors.eventTypes && (
            <p className="text-sm text-destructive mt-2">{errors.eventTypes.message}</p>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="audienceSize" className="text-sm font-semibold">
            Typical Audience Size
          </FieldLabel>
          <Controller
            name="audienceSize"
            control={control}
            render={({ field }) => (
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <SelectTrigger id="audienceSize" className="h-12 bg-background/50 border-border/60 focus:border-primary transition-colors">
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
            <p className="text-sm text-destructive mt-1.5">{errors.audienceSize.message}</p>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="eventFrequency" className="text-sm font-semibold">
            How often do you organize events?
          </FieldLabel>
          <Controller
            name="eventFrequency"
            control={control}
            render={({ field }) => (
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <SelectTrigger id="eventFrequency" className="h-12 bg-background/50 border-border/60 focus:border-primary transition-colors">
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
            <p className="text-sm text-destructive mt-1.5">{errors.eventFrequency.message}</p>
          )}
        </Field>

      </FieldGroup>
    </form>
  )
}
