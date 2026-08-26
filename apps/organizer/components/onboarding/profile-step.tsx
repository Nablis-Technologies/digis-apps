"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { profileSchema, type ProfileFormData } from "@/lib/schemas"
import { HugeiconsIcon } from "@hugeicons/react"
import { UserIcon, SmartPhone01Icon, IdentificationIcon, Mail01Icon, LockPasswordIcon } from "@hugeicons/core-free-icons"

interface ProfileStepProps {
  onNext: (data: ProfileFormData) => void
  initialData?: Partial<ProfileFormData>
}

export function ProfileStep({ onNext, initialData }: ProfileStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema as any),
    mode: "onChange",
    defaultValues: initialData,
  })

  const onSubmit = (data: ProfileFormData) => {
    onNext(data)
  }

  return (
    <form id="onboarding-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="fullName" className="text-sm font-semibold">
            Full Name
          </FieldLabel>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <HugeiconsIcon icon={UserIcon} strokeWidth={2} className="size-4" />
            </div>
            <Input
              id="fullName"
              placeholder="John Doe"
              {...register("fullName")}
              className="pl-10 h-12 bg-background/50 border-border/60 focus:border-primary transition-colors"
            />
          </div>
          {errors.fullName && (
            <p className="text-sm text-destructive mt-1.5">{errors.fullName.message}</p>
          )}
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="phone" className="text-sm font-semibold">
              Phone Number
            </FieldLabel>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <HugeiconsIcon icon={SmartPhone01Icon} strokeWidth={2} className="size-4" />
              </div>
              <Input
                id="phone"
                type="tel"
                placeholder="+251912345678"
                {...register("phone")}
                className="pl-10 h-12 bg-background/50 border-border/60 focus:border-primary transition-colors"
              />
            </div>
            {errors.phone && (
              <p className="text-sm text-destructive mt-1.5">{errors.phone.message}</p>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="nationalId" className="text-sm font-semibold">
              National ID
            </FieldLabel>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <HugeiconsIcon icon={IdentificationIcon} strokeWidth={2} className="size-4" />
              </div>
              <Input
                id="nationalId"
                placeholder="ID Number"
                {...register("nationalId")}
                className="pl-10 h-12 bg-background/50 border-border/60 focus:border-primary transition-colors"
              />
            </div>
            {errors.nationalId && (
              <p className="text-sm text-destructive mt-1.5">{errors.nationalId.message}</p>
            )}
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="email" className="text-sm font-semibold">
            Email Address
          </FieldLabel>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <HugeiconsIcon icon={Mail01Icon} strokeWidth={2} className="size-4" />
            </div>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              {...register("email")}
              className="pl-10 h-12 bg-background/50 border-border/60 focus:border-primary transition-colors"
            />
          </div>
          {errors.email && (
            <p className="text-sm text-destructive mt-1.5">{errors.email.message}</p>
          )}
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="password" className="text-sm font-semibold">
              Password
            </FieldLabel>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <HugeiconsIcon icon={LockPasswordIcon} strokeWidth={2} className="size-4" />
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
                className="pl-10 h-12 bg-background/50 border-border/60 focus:border-primary transition-colors"
              />
            </div>
            {errors.password && (
              <p className="text-sm text-destructive mt-1.5">{errors.password.message}</p>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="confirmPassword" className="text-sm font-semibold">
              Confirm Password
            </FieldLabel>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <HugeiconsIcon icon={LockPasswordIcon} strokeWidth={2} className="size-4" />
              </div>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...register("confirmPassword")}
                className="pl-10 h-12 bg-background/50 border-border/60 focus:border-primary transition-colors"
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive mt-1.5">
                {errors.confirmPassword.message}
              </p>
            )}
          </Field>
        </div>

      </FieldGroup>
    </form>
  )
}
