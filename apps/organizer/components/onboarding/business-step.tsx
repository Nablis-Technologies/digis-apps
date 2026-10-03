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
import { ETHIOPIAN_BANKS, BANK_LOGOS } from "@/lib/constants"
import { HugeiconsIcon } from "@hugeicons/react"
import { BankIcon, Location01Icon, Building02Icon, IdIcon } from "@hugeicons/core-free-icons"
import Image from "next/image"

interface BusinessStepProps {
  onNext: (data: BusinessFormData) => void
  initialData?: Partial<BusinessFormData>
}

export function BusinessStep({ onNext, initialData }: BusinessStepProps) {
  const [selectedBank, setSelectedBank] = useState<string>(initialData?.bankName || "")
  const [selectedOrgType, setSelectedOrgType] = useState<string>(initialData?.organizer_type || "individual")

  const selectedBankObj = ETHIOPIAN_BANKS.find(
    (b) => b.value.toLowerCase() === selectedBank?.toLowerCase()
  )

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
                <SelectValue placeholder="Select your bank">
                  {selectedBankObj ? (
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="size-6 relative rounded bg-white p-0.5 border border-border/40 shrink-0 overflow-hidden">
                        <Image
                          src={BANK_LOGOS[selectedBankObj.value] || "/assets/CBE.jpeg"}
                          alt={selectedBankObj.label}
                          fill
                          className="object-contain"
                        />
                      </div>
                      <span className="font-medium text-foreground truncate">{selectedBankObj.label}</span>
                    </div>
                  ) : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent
                className="z-[9999] w-[--radix-select-trigger-width] max-h-[340px] overflow-y-auto p-2"
                position="popper"
                align="start"
              >
                <div className="grid grid-cols-2 gap-2 p-1">
                  {ETHIOPIAN_BANKS.map((bank) => (
                    <SelectItem
                      key={bank.value}
                      value={bank.value}
                      title={bank.label}
                      className="relative flex items-center gap-2.5 py-2 px-2.5 rounded-lg border border-border/50 bg-card/40 hover:bg-muted/70 hover:border-primary/50 data-[state=checked]:border-primary data-[state=checked]:bg-primary/10 data-[state=checked]:ring-1 data-[state=checked]:ring-primary cursor-pointer transition-all duration-150 group pr-6 [&>span:first-child]:top-2 [&>span:first-child]:right-2 [&>span:first-child]:size-3.5 [&>span:first-child]:text-primary *:[span]:last:w-full *:[span]:last:min-w-0 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2.5"
                    >
                      <div className="size-8 relative rounded-md bg-white p-0.5 border border-border/40 shrink-0 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform overflow-hidden">
                        <Image
                          src={BANK_LOGOS[bank.value] || "/assets/CBE.jpeg"}
                          alt={bank.label}
                          fill
                          className="object-contain p-0.5"
                        />
                      </div>
                      <div className="flex flex-col min-w-0 text-left overflow-hidden">
                        <span className="text-xs font-semibold text-foreground truncate">
                          {bank.shortName || bank.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate leading-none mt-0.5">
                          {bank.label}
                        </span>
                      </div>
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
