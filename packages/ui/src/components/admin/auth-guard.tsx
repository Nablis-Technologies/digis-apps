"use client"

import { useGetMeQuery } from "@workspace/store/reducers/authApi"
import { getAccessToken } from "@workspace/store/api"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const token = getAccessToken()
  const { isLoading, isError } = useGetMeQuery(undefined, { skip: !token })

  useEffect(() => {
    if (!token) {
      router.replace("/")
    }
  }, [token, router])

  useEffect(() => {
    if (isError) {
      router.replace("/")
    }
  }, [isError, router])

  if (!token || isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    )
  }

  return <>{children}</>
}
