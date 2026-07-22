"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function SkeletonCard() {
  return (
    <Card>
      <div className="relative aspect-video overflow-hidden">
        <Skeleton className="size-full" />
      </div>
      <CardContent className="p-4">
        <Skeleton className="mb-2 h-6 w-3/4" />
        <Skeleton className="mb-1 h-4 w-1/2" />
        <Skeleton className="mb-3 h-4 w-2/3" />
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-3 w-16" />
        </div>
      </CardContent>
    </Card>
  )
}

export function SkeletonStats() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="size-4 rounded-full" />
      </CardHeader>
      <CardContent>
        <Skeleton className="mb-2 h-8 w-20" />
        <Skeleton className="h-3 w-16" />
      </CardContent>
    </Card>
  )
}

export function SkeletonList() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Skeleton className="size-12 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      </CardContent>
    </Card>
  )
}
