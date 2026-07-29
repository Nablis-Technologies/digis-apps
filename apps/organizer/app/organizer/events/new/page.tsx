"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { CreateEventForm } from "../../../../components/events/create-event-form"

export default function CreateEvent() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground mb-4">
          <Link href="/organizer/events">
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4 mr-1.5" />
            Events
          </Link>
        </Button>
        <h1 className="text-3xl font-black tracking-tight">Create Event</h1>
        <p className="text-muted-foreground mt-1">You're minutes away from reaching your audience</p>
      </div>
      <CreateEventForm />
    </div>
  )
}
