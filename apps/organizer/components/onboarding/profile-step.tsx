"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { profileSchema, type ProfileFormData } from "@/lib/schemas"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"

interface ProfileStepProps {
  onNext: (data: ProfileFormData) => void
  initialData?: Partial<ProfileFormData>
}

export function ProfileStep({ onNext, initialData }: ProfileStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema as any),
    mode: "onChange",
    defaultValues: initialData,
  })

  const onSubmit = (data: ProfileFormData) => {
    onNext(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="fullName">Full Name</FieldLabel>
          <Input
            id="fullName"
            placeholder="John Doe"
            {...register("fullName")}
            className="bg-background"
          />
          {errors.fullName && (
            <p className="text-sm text-destructive">{errors.fullName.message}</p>
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
            <Input
              id="phone"
              type="tel"
              placeholder="+251912345678"
              {...register("phone")}
              className="bg-background"
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="nationalId">National ID</FieldLabel>
            <Input
              id="nationalId"
              placeholder="ID Number"
              {...register("nationalId")}
              className="bg-background"
            />
            {errors.nationalId && (
              <p className="text-sm text-destructive">{errors.nationalId.message}</p>
            )}
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="email">Email Address</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            {...register("email")}
            className="bg-background"
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register("password")}
              className="bg-background"
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              {...register("confirmPassword")}
              className="bg-background"
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </Field>
        </div>

        <Field>
          <Button type="submit" disabled={!isValid} className="w-full gap-2">
            Continue
            <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4" />
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
