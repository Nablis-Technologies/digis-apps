"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { CreateEventForm } from "../../../../components/events/create-event-form"

export default function CreateEvent() {
  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      <header className="flex-shrink-0 border-b border-border/60 bg-background px-4 pt-6 pb-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground mb-4">
            <Link href="/organizer/events">
              <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4 mr-1.5" />
              Events
            </Link>
          </Button>
          <h1 className="text-3xl font-black tracking-tight">Create Event</h1>
          <p className="text-muted-foreground mt-1">You're minutes away from reaching your audience</p>
        </div>
      </header>
      <main className="flex-1 min-h-0 overflow-hidden px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto h-full flex flex-col">
          <CreateEventForm />
        </div>
      </main>
    </div>
  )
}
