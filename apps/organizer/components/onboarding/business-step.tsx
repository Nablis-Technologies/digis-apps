"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { businessSchema, ORGANIZER_TYPES, type BusinessFormData } from "@/lib/schemas"
import { ETHIOPIAN_BANKS } from "@/lib/constants"
import { HugeiconsIcon } from "@hugeicons/react"
import { BankIcon, Location01Icon, Building02Icon, IdIcon } from "@hugeicons/core-free-icons"
import Image from "next/image"

interface BusinessStepProps {
  onNext: (data: BusinessFormData) => void
  initialData?: Partial<BusinessFormData>
}

// Bank logos mapping to actual image files
const BANK_LOGOS: Record<string, string> = {
  cbe: "/assets/CBE.jpeg",
  awash: "/assets/AWASH.jpeg",
  dashen: "/assets/DASHEN.png",
  boa: "/assets/BOA.png",
  wegagen: "/assets/WEGAGEN.png",
  nib: "/assets/NIB.png",
  coop: "/assets/COOP.png",
  lion: "/assets/LION.jpeg",
  oib: "/assets/OROMIA.png",
  zemen: "/assets/ZEMEN.png",
  bunna: "/assets/BUNNA.jpeg",
}

export function BusinessStep({ onNext, initialData }: BusinessStepProps) {
  const [selectedBank, setSelectedBank] = useState<string>(initialData?.bankName || "")
  const [selectedOrgType, setSelectedOrgType] = useState<string>(initialData?.organizer_type || "individual")

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<BusinessFormData>({
    resolver: zodResolver(businessSchema as any),
    mode: "onChange",
    defaultValues: { organizer_type: "individual", ...initialData } as BusinessFormData,
  })

  const onSubmit = (data: BusinessFormData) => {
    onNext(data)
  }

  const handleBankSelect = (value: string) => {
    setSelectedBank(value)
    setValue("bankName", value, { shouldValidate: true })
  }

  const handleOrgTypeSelect = (value: string) => {
    setSelectedOrgType(value)
    setValue("organizer_type", value as BusinessFormData["organizer_type"], { shouldValidate: true })
  }

  return (
    <form id="onboarding-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="businessName" className="text-sm font-semibold">
            Organization Name <span className="text-destructive">*</span>
          </FieldLabel>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <HugeiconsIcon icon={Building02Icon} strokeWidth={2} className="size-4" />
            </div>
            <Input
              id="businessName"
              placeholder="e.g. Addis Music Fest"
              {...register("businessName")}
              className="pl-10 h-12 bg-background/50 border-border/60 focus:border-primary transition-colors"
            />
          </div>
          {errors.businessName && (
            <p className="text-sm text-destructive mt-1.5">{errors.businessName.message}</p>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="organizer_type" className="text-sm font-semibold">
            Organization Type <span className="text-destructive">*</span>
          </FieldLabel>
          <Select value={selectedOrgType} onValueChange={handleOrgTypeSelect}>
            <SelectTrigger
              id="organizer_type"
              className="w-full h-12 justify-between bg-background/50 border-border/60 hover:border-primary transition-colors"
            >
              <SelectValue placeholder="Select organization type" />
            </SelectTrigger>
            <SelectContent>
              {ORGANIZER_TYPES.map((type) => (
                <SelectItem key={type} value={type} className="capitalize">
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.organizer_type && (
            <p className="text-sm text-destructive mt-1.5">{errors.organizer_type.message}</p>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="tin" className="text-sm font-semibold">
            Tax Identification Number (TIN)
          </FieldLabel>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <HugeiconsIcon icon={IdIcon} strokeWidth={2} className="size-4" />
            </div>
            <Input
              id="tin"
              placeholder="1234567890"
              {...register("tin")}
              className="pl-10 h-12 bg-background/50 border-border/60 focus:border-primary transition-colors"
            />
          </div>
          {errors.tin && (
            <p className="text-sm text-destructive mt-1.5">{errors.tin.message}</p>
          )}
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="bankName" className="text-sm font-semibold">
              Bank Name
            </FieldLabel>
            <Select value={selectedBank} onValueChange={handleBankSelect}>
              <SelectTrigger
                id="bankName"
                className="w-full h-12 justify-between bg-background/50 border-border/60 hover:border-primary transition-colors"
              >
                <SelectValue placeholder="Select your bank" />
              </SelectTrigger>
              <SelectContent className="w-[--radix-select-trigger-width] min-w-72">
                <div className="grid grid-cols-3 gap-2 p-1">
                  {ETHIOPIAN_BANKS.map((bank) => (
                    <SelectItem
                      key={bank.value}
                      value={bank.value}
                      className="flex flex-col items-center justify-center gap-1.5 border border-border/60 rounded-lg p-2 cursor-pointer focus:bg-primary/5 data-[state=checked]:border-primary data-[state=checked]:bg-primary/5 [&>span:first-child]:hidden"
                    >
                      <div className="size-10 relative rounded-lg bg-white p-1 flex items-center justify-center overflow-hidden">
                        <Image
                          src={BANK_LOGOS[bank.value] || "/assets/CBE.jpeg"}
                          alt={bank.label}
                          fill
                          className="object-contain p-0.5"
                        />
                      </div>
                      <span className="text-[11px] font-medium text-center leading-tight">
                        {bank.label}
                      </span>
                    </SelectItem>
                  ))}
                </div>
              </SelectContent>
            </Select>
            {errors.bankName && (
              <p className="text-sm text-destructive mt-1.5">{errors.bankName.message}</p>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="accountNumber" className="text-sm font-semibold">
              Bank Account Number
            </FieldLabel>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <HugeiconsIcon icon={BankIcon} strokeWidth={2} className="size-4" />
              </div>
              <Input
                id="accountNumber"
                placeholder="1000123456789"
                {...register("accountNumber")}
                className="pl-10 h-12 bg-background/50 border-border/60 focus:border-primary transition-colors"
              />
            </div>
            {errors.accountNumber && (
              <p className="text-sm text-destructive mt-1.5">{errors.accountNumber.message}</p>
            )}
          </Field>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="address" className="text-sm font-semibold">
              Business Address
            </FieldLabel>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <HugeiconsIcon icon={Location01Icon} strokeWidth={2} className="size-4" />
              </div>
              <Input
                id="address"
                placeholder="Street address"
                {...register("address")}
                className="pl-10 h-12 bg-background/50 border-border/60 focus:border-primary transition-colors"
              />
            </div>
            {errors.address && (
              <p className="text-sm text-destructive mt-1.5">{errors.address.message}</p>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="city" className="text-sm font-semibold">
              City <span className="text-destructive">*</span>
            </FieldLabel>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <HugeiconsIcon icon={Location01Icon} strokeWidth={2} className="size-4" />
              </div>
              <Input
                id="city"
                placeholder="Addis Ababa"
                {...register("city")}
                className="pl-10 h-12 bg-background/50 border-border/60 focus:border-primary transition-colors"
              />
            </div>
            {errors.city && (
              <p className="text-sm text-destructive mt-1.5">{errors.city.message}</p>
            )}
          </Field>
        </div>

      </FieldGroup>
    </form>
  )
}
