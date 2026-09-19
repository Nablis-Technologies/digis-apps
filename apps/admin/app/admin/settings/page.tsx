"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Settings05Icon,
  UserCircleIcon,
  LockPasswordIcon,
  BellIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PhoneInput, stripCountryCode } from "@workspace/ui/components/phone-input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

// ─── Types ──────────────────────────────────────────────────────────────────

type Section = "general" | "profile" | "password" | "notifications"

// ─── Page ───────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<Section>("general")

  const sections: { id: Section; label: string }[] = [
    { id: "general", label: "General" },
    { id: "profile", label: "Profile" },
    { id: "password", label: "Password" },
    { id: "notifications", label: "Notifications" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account and application preferences
        </p>
      </div>

      <div className="flex gap-1 border-b border-border/50">
        {(["general", "profile", "password", "notifications"] as Section[]).map(
          (s) => (
            <button
              key={s}
              onClick={() => setActiveSection(s)}
              className={cn(
                "-mb-px border-b-2 px-4 py-2.5 text-sm font-medium capitalize transition-colors",
                activeSection === s
                  ? "border-lime-500 text-lime-600"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {s}
            </button>
          )
        )}
      </div>

      {activeSection === "general" && <GeneralSection />}
      {activeSection === "profile" && <ProfileSection />}
      {activeSection === "password" && <PasswordSection />}
      {activeSection === "notifications" && <NotificationsSection />}
    </div>
  )
}

// ─── General Section ────────────────────────────────────────────────────────

function GeneralSection() {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    siteName: "Digis Events",
    timezone: "Africa/Addis_Ababa",
    language: "en",
    dateFormat: "DD/MM/YYYY",
  })

  return (
    <div className="p-2">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          setSaving(true)
          setTimeout(() => setSaving(false), 600)
        }}
        className="max-w-lg space-y-6"
      >
        <div className="space-y-2">
          <Label htmlFor="siteName">Site Name</Label>
          <Input
            id="siteName"
            value={form.siteName}
            onChange={(e) =>
              setForm((p) => ({ ...p, siteName: e.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <select
            id="timezone"
            value={form.timezone}
            onChange={(e) =>
              setForm((p) => ({ ...p, timezone: e.target.value }))
            }
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
          >
            <option value="Africa/Addis_Ababa">
              Africa/Addis Ababa (GMT+3)
            </option>
            <option value="Africa/Nairobi">Africa/Nairobi (GMT+3)</option>
            <option value="Europe/London">Europe/London (GMT+0)</option>
            <option value="America/New_York">America/New York (GMT-5)</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="language">Language</Label>
          <select
            id="language"
            value={form.language}
            onChange={(e) =>
              setForm((p) => ({ ...p, language: e.target.value }))
            }
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
          >
            <option value="en">English</option>
            <option value="am">አማርኛ</option>
            <option value="om">Afaan Oromoo</option>
            <option value="ti">ትግርኛ</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dateFormat">Date Format</Label>
          <select
            id="dateFormat"
            value={form.dateFormat}
            onChange={(e) =>
              setForm((p) => ({ ...p, dateFormat: e.target.value }))
            }
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={saving}
            className="bg-lime-500 text-white hover:bg-lime-600 disabled:bg-lime-500/50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  )
}

// ─── Profile Section ────────────────────────────────────────────────────────

function ProfileSection() {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: "Admin User",
    email: "admin@digis.events",
    phone: stripCountryCode("+251911123456"),
  })

  return (
    <div className="p-2">
      <div className="mb-6 flex items-center gap-4">
        <div className="flex size-16 items-center justify-center rounded-full bg-lime-500 text-2xl font-bold text-white">
          A
        </div>
        <div>
          <p className="font-medium">Admin User</p>
          <p className="text-sm text-muted-foreground">super_admin</p>
          <button
            type="button"
            className="mt-1 text-xs text-lime-600 hover:underline"
          >
            Change Avatar
          </button>
        </div>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          setSaving(true)
          setTimeout(() => setSaving(false), 600)
        }}
        className="max-w-lg space-y-6"
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((p) => ({ ...p, email: e.target.value }))
              }
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <PhoneInput
            id="phone"
            placeholder="91 123 4567"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
          />
        </div>
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={saving}
            className="bg-lime-500 text-white hover:bg-lime-600 disabled:bg-lime-500/50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  )
}

// ─── Password Section ───────────────────────────────────────────────────────

function PasswordSection() {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ current: "", newPass: "", confirm: "" })
  const valid =
    form.current && form.newPass.length >= 8 && form.newPass === form.confirm

  return (
    <div className="p-2">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!valid) return
          setSaving(true)
          setTimeout(() => setSaving(false), 600)
        }}
        className="max-w-lg space-y-6"
      >
        <div className="space-y-2">
          <Label htmlFor="currentPw">Current Password</Label>
          <Input
            id="currentPw"
            type="password"
            value={form.current}
            onChange={(e) =>
              setForm((p) => ({ ...p, current: e.target.value }))
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="newPw">New Password</Label>
          <Input
            id="newPw"
            type="password"
            placeholder="Min. 8 characters"
            value={form.newPass}
            onChange={(e) =>
              setForm((p) => ({ ...p, newPass: e.target.value }))
            }
            required
            minLength={8}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPw">Confirm New Password</Label>
          <Input
            id="confirmPw"
            type="password"
            value={form.confirm}
            onChange={(e) =>
              setForm((p) => ({ ...p, confirm: e.target.value }))
            }
            required
          />
          {form.confirm && form.newPass !== form.confirm && (
            <p className="text-xs text-destructive">Passwords do not match</p>
          )}
        </div>
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!valid || saving}
            className="bg-lime-500 text-white hover:bg-lime-600 disabled:bg-lime-500/50"
          >
            {saving ? "Updating..." : "Change Password"}
          </Button>
        </div>
      </form>
    </div>
  )
}

// ─── Notifications Section ──────────────────────────────────────────────────

function NotificationsSection() {
  const [saving, setSaving] = useState(false)
  const [prefs, setPrefs] = useState({
    newUser: true,
    organizationVerification: true,
    eventPublished: false,
    systemAlerts: true,
    weeklyReport: true,
  })

  const toggles = [
    {
      key: "newUser",
      label: "New User Registrations",
      desc: "When a new user signs up",
    },
    {
      key: "organizationVerification",
      label: "Verification Requests",
      desc: "When an organization submits for verification",
    },
    {
      key: "eventPublished",
      label: "Event Published",
      desc: "When a new event goes live",
    },
    {
      key: "systemAlerts",
      label: "System Alerts",
      desc: "Critical system notifications and errors",
    },
    {
      key: "weeklyReport",
      label: "Weekly Report",
      desc: "Weekly summary of platform activity",
    },
  ] as const

  return (
    <div className="p-2">
      <div className="max-w-lg space-y-6">
        <div className="space-y-4">
          {toggles.map((t) => (
            <div
              key={t.key}
              className="flex items-center justify-between gap-4"
            >
              <div>
                <p className="text-sm font-medium">{t.label}</p>
                <p className="text-xs text-muted-foreground">{t.desc}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={prefs[t.key]}
                onClick={() => setPrefs((p) => ({ ...p, [t.key]: !p[t.key] }))}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                  prefs[t.key] ? "bg-lime-500" : "bg-muted"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block size-5 rounded-full bg-white shadow ring-0 transition-transform",
                    prefs[t.key] ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-2">
          <Button
            onClick={() => {
              setSaving(true)
              setTimeout(() => setSaving(false), 600)
            }}
            disabled={saving}
            className="bg-lime-500 text-white hover:bg-lime-600 disabled:bg-lime-500/50"
          >
            {saving ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </div>
    </div>
  )
}
