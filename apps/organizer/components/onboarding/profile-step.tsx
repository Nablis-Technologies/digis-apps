"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion, AnimatePresence } from "framer-motion"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PhoneInput, normalizeEthiopianPhone, stripCountryCode } from "@/components/ui/phone-input"
import { profileSchema, type ProfileFormData } from "@/lib/schemas"
import {
  useRequestSignupOtpMutation,
  useVerifyPhoneMutation,
} from "@workspace/store/reducers/authApi"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  UserIcon,
  Mail01Icon,
  LockPasswordIcon,
  EyeIcon,
  EyeOffIcon,
  CheckmarkCircle01Icon,
  Tick02Icon,
  Loading01Icon,
  SmartPhone01Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons"

interface ProfileStepProps {
  onNext: (data: ProfileFormData) => void
  initialData?: Partial<ProfileFormData>
}

export function ProfileStep({ onNext, initialData }: ProfileStepProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Phone verification state
  const initialPhoneNormalized = initialData?.phone
    ? normalizeEthiopianPhone(initialData.phone)
    : null
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(
    initialData?.verification_token && initialPhoneNormalized ? initialPhoneNormalized : null
  )
  const [challengeId, setChallengeId] = useState<string | null>(null)
  const [isOtpOpen, setIsOtpOpen] = useState(false)
  const [otpCode, setOtpCode] = useState("")
  const [otpError, setOtpError] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)

  const [requestSignupOtp, { isLoading: isRequestingOtp }] = useRequestSignupOtpMutation()
  const [verifyPhone, { isLoading: isVerifyingOtp }] = useVerifyPhoneMutation()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema as any),
    mode: "onChange",
    defaultValues: {
      ...initialData,
      phone: initialData?.phone ? stripCountryCode(initialData.phone) : "",
      verification_token: initialData?.verification_token ?? "",
    },
  })

  const currentPhone = watch("phone") || ""
  const verificationToken = watch("verification_token")
  const isPhoneValid = /^[97]\d{8}$/.test(currentPhone.trim())
  const normalizedCurrentPhone = isPhoneValid ? normalizeEthiopianPhone(currentPhone) : ""
  const isVerified =
    Boolean(verificationToken) &&
    Boolean(verifiedPhone) &&
    normalizedCurrentPhone === verifiedPhone

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  // Reset verification when phone input changes
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, "").slice(0, 9)
    e.target.value = rawVal

    const newNormalized = rawVal.length === 9 ? normalizeEthiopianPhone(rawVal) : ""
    if (verifiedPhone && newNormalized !== verifiedPhone) {
      setVerifiedPhone(null)
      setValue("verification_token", "", { shouldValidate: true })
      setIsOtpOpen(false)
      setChallengeId(null)
    }
  }

  const handleSendOtp = async () => {
    if (!isPhoneValid) {
      setError("phone", {
        type: "manual",
        message: "Enter a valid 9-digit Ethiopian phone number starting with 9 or 7",
      })
      return
    }

    clearErrors("phone")
    clearErrors("verification_token")
    setOtpError(null)

    const phoneToVerify = normalizeEthiopianPhone(currentPhone)
    try {
      const result = await requestSignupOtp({ phone: phoneToVerify }).unwrap()
      setChallengeId(result.data.challenge_id)
      setIsOtpOpen(true)
      setOtpCode("")
      setResendCooldown(60)
      toast.success("Verification code sent!", {
        description: `6-digit code sent to ${phoneToVerify}. Check your SMS or preview log.`,
      })
    } catch (err: any) {
      console.error("Failed to request OTP:", err)
      const errorMsg =
        err?.data?.message ||
        err?.data?.error ||
        "Failed to send verification code. Please check your phone number and try again."
      setOtpError(errorMsg)
      toast.error("Could not send code", { description: errorMsg })
    }
  }

  const handleVerifyOtp = async () => {
    if (!challengeId) {
      setOtpError("Session expired. Please request a new code.")
      return
    }
    const trimmedCode = otpCode.trim()
    if (trimmedCode.length !== 6) {
      setOtpError("Please enter the complete 6-digit code.")
      return
    }

    setOtpError(null)
    try {
      const result = await verifyPhone({
        challengeId,
        code: trimmedCode,
      }).unwrap()

      const token = result.data.verification_token
      setValue("verification_token", token, { shouldValidate: true })
      setVerifiedPhone(normalizeEthiopianPhone(currentPhone))
      setIsOtpOpen(false)
      setOtpCode("")
      toast.success("Phone verified!", {
        description: "Your phone number has been verified successfully.",
      })
    } catch (err: any) {
      console.error("Failed to verify code:", err)
      const errorMsg =
        err?.data?.message ||
        err?.data?.error ||
        "Invalid or expired verification code. Please try again."
      setOtpError(errorMsg)
      toast.error("Verification failed", { description: errorMsg })
    }
  }

  const handleResetPhone = () => {
    setVerifiedPhone(null)
    setValue("verification_token", "", { shouldValidate: true })
    setIsOtpOpen(false)
    setChallengeId(null)
    setOtpCode("")
    setOtpError(null)
  }

  const onSubmit = (data: ProfileFormData) => {
    if (!data.verification_token) {
      setError("verification_token", {
        type: "manual",
        message: "Phone number verification is required before continuing.",
      })
      if (isPhoneValid && !isOtpOpen) {
        handleSendOtp()
      }
      return
    }

    onNext({
      ...data,
      phone: normalizeEthiopianPhone(data.phone),
    })
  }

  return (
    <form id="onboarding-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FieldGroup>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="first_name" className="text-sm font-semibold">
              First Name
            </FieldLabel>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <HugeiconsIcon icon={UserIcon} strokeWidth={2} className="size-4" />
              </div>
              <Input
                id="first_name"
                placeholder="Abebe / አበበ"
                maxLength={100}
                {...register("first_name")}
                className="pl-10 h-12 bg-background/50 border-border/60 focus:border-primary transition-colors"
              />
            </div>
            {errors.first_name && (
              <p className="text-sm text-destructive mt-1.5">{errors.first_name.message}</p>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="last_name" className="text-sm font-semibold">
              Last Name
            </FieldLabel>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <HugeiconsIcon icon={UserIcon} strokeWidth={2} className="size-4" />
              </div>
              <Input
                id="last_name"
                placeholder="Bikila / ቢቂላ"
                maxLength={100}
                {...register("last_name")}
                className="pl-10 h-12 bg-background/50 border-border/60 focus:border-primary transition-colors"
              />
            </div>
            {errors.last_name && (
              <p className="text-sm text-destructive mt-1.5">{errors.last_name.message}</p>
            )}
          </Field>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field>
            <div className="flex items-center justify-between mb-1">
              <FieldLabel htmlFor="phone" className="text-sm font-semibold">
                Phone Number
              </FieldLabel>
              {isVerified ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2.5} className="size-3" />
                  Verified
                </span>
              ) : (
                <span className="text-xs text-muted-foreground font-normal">
                  Verification required
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <PhoneInput
                id="phone"
                inputMode="numeric"
                maxLength={9}
                placeholder="912345678"
                disabled={isVerified}
                {...register("phone", {
                  onChange: handlePhoneChange,
                })}
                onKeyDown={(e) => {
                  if (
                    [
                      "Backspace",
                      "Delete",
                      "Tab",
                      "Escape",
                      "Enter",
                      "ArrowLeft",
                      "ArrowRight",
                      "ArrowUp",
                      "ArrowDown",
                    ].includes(e.key) ||
                    e.ctrlKey ||
                    e.metaKey
                  ) {
                    return
                  }
                  if (!/^\d$/.test(e.key)) {
                    e.preventDefault()
                  }
                }}
                containerClassName="h-12 flex-1 bg-background/50 border-border/60 focus-within:border-primary"
              />

              {isVerified ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetPhone}
                  className="h-12 px-3 text-xs text-muted-foreground hover:text-foreground shrink-0 border-border/60"
                  title="Change phone number"
                >
                  Change
                </Button>
              ) : (
                <Button
                  type="button"
                  variant={isPhoneValid ? "default" : "secondary"}
                  size="sm"
                  onClick={handleSendOtp}
                  disabled={!isPhoneValid || isRequestingOtp}
                  className="h-12 px-4 shrink-0 font-medium transition-all"
                >
                  {isRequestingOtp ? (
                    <>
                      <HugeiconsIcon icon={Loading01Icon} strokeWidth={2} className="size-4 animate-spin mr-1.5" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <HugeiconsIcon icon={SmartPhone01Icon} strokeWidth={2} className="size-4 mr-1.5" />
                      Verify
                    </>
                  )}
                </Button>
              )}
            </div>

            {errors.phone && (
              <p className="text-sm text-destructive mt-1.5">{errors.phone.message}</p>
            )}
            {errors.verification_token && !isVerified && (
              <p className="text-sm text-destructive mt-1.5">{errors.verification_token.message}</p>
            )}

            {/* Inline OTP Verification Panel */}
            <AnimatePresence>
              {isOtpOpen && !isVerified && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -6 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden mt-3"
                >
                  <div className="rounded-xl border border-primary/25 bg-gradient-to-br from-primary/10 via-background to-background p-4 sm:p-5 space-y-3.5 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                          <HugeiconsIcon icon={SmartPhone01Icon} strokeWidth={2} className="size-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-foreground">
                            Enter 6-Digit Code
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Sent to{" "}
                            <span className="font-mono font-medium text-foreground">
                              {normalizeEthiopianPhone(currentPhone)}
                            </span>
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsOtpOpen(false)}
                        className="text-muted-foreground hover:text-foreground text-xs px-2 py-1 rounded hover:bg-muted/50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>

                    {/* Development & Preview log notice */}
                    <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                      <HugeiconsIcon
                        icon={InformationCircleIcon}
                        strokeWidth={2}
                        className="size-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400"
                      />
                      <div className="space-y-0.5">
                        <span className="font-semibold">Local / Preview Testing:</span>
                        <p className="text-xs opacity-90">
                          SMS delivery is logged to the server console. Check your terminal for{" "}
                          <code className="font-mono bg-amber-500/20 px-1 py-0.5 rounded font-semibold">
                            [PREVIEW OTP] code=...
                          </code>
                        </p>
                      </div>
                    </div>

                    {/* OTP Code input */}
                    <div className="space-y-1.5">
                      <Input
                        id="otp-code-input"
                        inputMode="numeric"
                        maxLength={6}
                        autoFocus
                        placeholder="••••••"
                        value={otpCode}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 6)
                          setOtpCode(val)
                          if (otpError) setOtpError(null)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            if (otpCode.length === 6) handleVerifyOtp()
                          }
                        }}
                        className="h-12 text-center text-xl tracking-[0.4em] font-mono font-bold bg-background/90 border-border/70 focus:border-primary transition-all"
                      />
                      {otpError && (
                        <p className="text-xs text-destructive font-medium">{otpError}</p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleSendOtp}
                        disabled={resendCooldown > 0 || isRequestingOtp}
                        className="text-xs text-muted-foreground hover:text-foreground h-9"
                      >
                        {resendCooldown > 0 ? (
                          `Resend code in ${resendCooldown}s`
                        ) : (
                          "Resend code"
                        )}
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        onClick={handleVerifyOtp}
                        disabled={otpCode.length !== 6 || isVerifyingOtp}
                        className="min-w-[120px] h-9 font-semibold"
                      >
                        {isVerifyingOtp ? (
                          <>
                            <HugeiconsIcon icon={Loading01Icon} strokeWidth={2} className="size-4 animate-spin mr-1.5" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="size-4 mr-1.5" />
                            Verify Code
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Field>

          <Field>
            <div className="flex items-center justify-between mb-1">
              <FieldLabel htmlFor="email" className="text-sm font-semibold">
                Email Address
              </FieldLabel>
            </div>
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
        </div>

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
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register("password")}
                className="pl-10 pr-10 h-12 bg-background/50 border-border/60 focus:border-primary transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <HugeiconsIcon
                  icon={showPassword ? EyeOffIcon : EyeIcon}
                  strokeWidth={2}
                  className="size-4"
                />
              </button>
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
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register("confirmPassword")}
                className="pl-10 pr-10 h-12 bg-background/50 border-border/60 focus:border-primary transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <HugeiconsIcon
                  icon={showConfirmPassword ? EyeOffIcon : EyeIcon}
                  strokeWidth={2}
                  className="size-4"
                />
              </button>
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
