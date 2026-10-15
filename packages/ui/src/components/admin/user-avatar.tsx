"use client"

import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "../avatar"
import { BASE_URL, getAccessToken } from "@workspace/store/api"
import { cn } from "../../lib/utils"

export interface UserAvatarProps extends React.ComponentProps<typeof Avatar> {
  user?: {
    email?: string
    phone?: string
    name?: string
    profile?: {
      first_name?: string
      last_name?: string
      full_name?: string
      avatar_url?: string | null
    } | null
    [key: string]: unknown
  } | null
  avatarUrl?: string | null
  fallback?: string
  alt?: string
}

// Global in-memory cache for avatar blobs to avoid redundant network requests
const avatarBlobCache = new Map<string, { blobUrl: string; etag: string | null }>()

export function useAuthenticatedAvatar(avatarPath?: string | null) {
  const [blobUrl, setBlobUrl] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [hasError, setHasError] = React.useState(false)

  React.useEffect(() => {
    if (!avatarPath) {
      setBlobUrl(null)
      setIsLoading(false)
      setHasError(false)
      return
    }

    const token = getAccessToken()
    if (!token) {
      setBlobUrl(null)
      setIsLoading(false)
      return
    }

    const resolvedUrl = avatarPath.startsWith("http")
      ? avatarPath
      : `${BASE_URL}${avatarPath.startsWith("/") ? "" : "/"}${avatarPath}`

    // Check memory cache
    const cached = avatarBlobCache.get(resolvedUrl)
    if (cached) {
      setBlobUrl(cached.blobUrl)
    }

    let isCancelled = false
    setIsLoading(true)
    setHasError(false)

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    }
    if (cached?.etag) {
      headers["If-None-Match"] = cached.etag
    }

    fetch(resolvedUrl, { credentials: "omit", headers })
      .then(async (res) => {
        if (isCancelled) return

        if (res.status === 304 && cached) {
          // Cached image is still fresh
          setBlobUrl(cached.blobUrl)
          setIsLoading(false)
          return
        }

        if (res.ok) {
          const etag = res.headers.get("ETag")
          const blob = await res.blob()
          if (isCancelled) return

          // Revoke prior blob URL for this path if we replace it
          if (cached?.blobUrl && cached.blobUrl !== blobUrl) {
            URL.revokeObjectURL(cached.blobUrl)
          }

          const newBlobUrl = URL.createObjectURL(blob)
          avatarBlobCache.set(resolvedUrl, { blobUrl: newBlobUrl, etag })
          setBlobUrl(newBlobUrl)
          setIsLoading(false)
        } else {
          setHasError(true)
          setBlobUrl(null)
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setHasError(true)
          setBlobUrl(null)
          setIsLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [avatarPath])

  return { blobUrl, isLoading, hasError }
}

export function getInitials(user?: UserAvatarProps["user"], fallbackText?: string): string {
  const profile = user?.profile
  if (profile?.first_name || profile?.last_name) {
    const first = profile.first_name ? profile.first_name.trim().charAt(0) : ""
    const last = profile.last_name ? profile.last_name.trim().charAt(0) : ""
    const combined = `${first}${last}`.trim()
    if (combined) return combined.toUpperCase()
  }

  if (profile?.full_name) {
    const parts = profile.full_name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return `${parts[0]?.charAt(0) ?? ""}${parts[parts.length - 1]?.charAt(0) ?? ""}`.toUpperCase()
    }
    return profile.full_name.slice(0, 2).toUpperCase()
  }

  if (user?.name) {
    const parts = user.name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return `${parts[0]?.charAt(0) ?? ""}${parts[parts.length - 1]?.charAt(0) ?? ""}`.toUpperCase()
    }
    return user.name.slice(0, 2).toUpperCase()
  }

  if (user?.email) {
    return user.email.split("@")[0]?.slice(0, 2).toUpperCase() || "ME"
  }

  return fallbackText || "U"
}

export function UserAvatar({
  user,
  avatarUrl,
  fallback,
  alt,
  className,
  ...props
}: UserAvatarProps) {
  const targetAvatarPath = avatarUrl ?? user?.profile?.avatar_url
  const { blobUrl } = useAuthenticatedAvatar(targetAvatarPath)
  const initials = getInitials(user, fallback)
  const displayName = user?.profile?.full_name || user?.name || user?.email || alt || "User avatar"

  return (
    <Avatar className={cn("size-8 rounded-full", className)} {...props}>
      {blobUrl && (
        <AvatarImage
          src={blobUrl}
          alt={displayName}
          className="size-full object-cover"
        />
      )}
      <AvatarFallback className="rounded-full text-xs font-semibold bg-muted text-muted-foreground uppercase">
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}
