"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { businessSchema, type BusinessFormData } from "@/lib/schemas"
import { ETHIOPIAN_BANKS } from "@/lib/constants"
import { HugeiconsIcon } from "@hugeicons/react"
import { Upload02Icon, FileAttachmentIcon, IdIcon, BankIcon, Location01Icon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"

interface BusinessStepProps {
  onNext: (data: BusinessFormData) => void
  initialData?: Partial<BusinessFormData>
}

export function BusinessStep({ onNext, initialData }: BusinessStepProps) {
  const [fileName, setFileName] = useState<string>("")
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<BusinessFormData>({
    resolver: zodResolver(businessSchema as any),
    mode: "onChange",
    defaultValues: initialData,
  })

  const onSubmit = (data: BusinessFormData) => {
    onNext(data)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File too large", {
          description: "Please upload a file smaller than 10MB",
        })
        return
      }
      setFileName(file.name)
      setValue("licenseFile", file, { shouldValidate: true })
    }
  }

  return (
    <form id="onboarding-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="licenseFile" className="text-sm font-semibold">
            Business License <span className="text-muted-foreground font-normal">(Optional)</span>
          </FieldLabel>
          <div className="flex flex-col gap-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => document.getElementById("licenseFile")?.click()}
              className="w-full h-24 border-2 border-dashed border-border/60 hover:border-primary/50 hover:bg-accent/30 transition-all"
            >
              <div className="flex flex-col items-center gap-2">
                <HugeiconsIcon icon={fileName ? FileAttachmentIcon : Upload02Icon} strokeWidth={2} className="size-8 text-muted-foreground" />
                <div>
                  <p className="font-semibold text-sm">{fileName || "Choose File"}</p>
                  <p className="text-xs text-muted-foreground">PDF, JPG, or PNG (max 10MB)</p>
                </div>
              </div>
            </Button>
            {fileName && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <HugeiconsIcon icon={FileAttachmentIcon} strokeWidth={2} className="size-4 text-primary" />
                <span className="text-sm font-medium text-foreground flex-1">{fileName}</span>
              </div>
            )}
          </div>
          <input
            id="licenseFile"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={handleFileChange}
          />
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
            <Select
              onValueChange={(value) => setValue("bankName", value, { shouldValidate: true })}
              defaultValue={initialData?.bankName}
            >
              <SelectTrigger id="bankName" className="h-12 bg-background/50 border-border/60 focus:border-primary transition-colors">
                <SelectValue placeholder="Select your bank" />
              </SelectTrigger>
              <SelectContent>
                {ETHIOPIAN_BANKS.map((bank) => (
                  <SelectItem key={bank.value} value={bank.value}>
                    {bank.label}
                  </SelectItem>
                ))}
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
              placeholder="Street, City, Region"
              {...register("address")}
              className="pl-10 h-12 bg-background/50 border-border/60 focus:border-primary transition-colors"
            />
          </div>
          {errors.address && (
            <p className="text-sm text-destructive mt-1.5">{errors.address.message}</p>
          )}
        </Field>

      </FieldGroup>
    </form>
  )
}
