import { Button } from "@workspace/ui/components/button"

export default function OrganizerHome() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-bold">Welcome, Organizer</h1>
      <p className="text-sm text-muted-foreground">
        You are logged in. This is a placeholder for the organizer area.
      </p>
      <Button>Get started</Button>
    </div>
  )
}
