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
import { ArrowRight01Icon, Upload02Icon } from "@hugeicons/core-free-icons"
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
    formState: { errors, isValid },
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
    <form onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="licenseFile">Business License (Optional)</FieldLabel>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById("licenseFile")?.click()}
              className="gap-2"
            >
              <HugeiconsIcon icon={Upload02Icon} strokeWidth={2} className="size-4" />
              {fileName || "Choose File"}
            </Button>
            {fileName && (
              <span className="text-sm text-muted-foreground">{fileName}</span>
            )}
          </div>
          <input
            id="licenseFile"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={handleFileChange}
          />
          <p className="text-xs text-muted-foreground">
            PDF, JPG, or PNG (max 10MB)
          </p>
        </Field>

        <Field>
          <FieldLabel htmlFor="tin">Tax Identification Number (TIN)</FieldLabel>
          <Input
            id="tin"
            placeholder="1234567890"
            {...register("tin")}
            className="bg-background"
          />
          {errors.tin && (
            <p className="text-sm text-destructive">{errors.tin.message}</p>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="bankName">Bank Name</FieldLabel>
          <Select
            onValueChange={(value) => setValue("bankName", value, { shouldValidate: true })}
            defaultValue={initialData?.bankName}
          >
            <SelectTrigger id="bankName" className="bg-background">
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
            <p className="text-sm text-destructive">{errors.bankName.message}</p>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="accountNumber">Bank Account Number</FieldLabel>
          <Input
            id="accountNumber"
            placeholder="1000123456789"
            {...register("accountNumber")}
            className="bg-background"
          />
          {errors.accountNumber && (
            <p className="text-sm text-destructive">{errors.accountNumber.message}</p>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="address">Business Address</FieldLabel>
          <Input
            id="address"
            placeholder="Street, City, Region"
            {...register("address")}
            className="bg-background"
          />
          {errors.address && (
            <p className="text-sm text-destructive">{errors.address.message}</p>
          )}
        </Field>

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
