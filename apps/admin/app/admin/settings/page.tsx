"use client"

import { useState, useEffect } from "react"
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
import { Label } from "@/components/ui/label"
import { useGetMeQuery } from "@workspace/store/reducers/authApi"
import {
  useGetNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
} from "@workspace/store/reducers/notificationsApi"
import { UserAvatar } from "@workspace/ui/components/admin/user-avatar"

type Section = "general" | "profile" | "password" | "notifications"

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<Section>("general")

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

function GeneralSection() {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    siteName: "Digis Admin",
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

function ProfileSection() {
  const { data: meData, isLoading } = useGetMeQuery()
  const user = meData?.data?.user

  const [form, setForm] = useState({
    email: "",
    phone: "",
    role: "",
  })

  useEffect(() => {
    if (user) {
      setForm({
        email: user.email ?? "",
        phone: user.phone ?? "",
        role: user.role ?? "Admin",
      })
    }
  }, [user])

  if (isLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading profile...</div>
  }

  const displayName = user?.profile?.full_name || form.email || "Administrator"

  return (
    <div className="p-2">
      <div className="mb-6 flex items-center gap-4">
        <UserAvatar user={user} className="size-16 rounded-full text-2xl font-bold" />
        <div>
          <p className="font-medium text-base">{displayName}</p>
          <p className="text-sm text-muted-foreground">{form.role}</p>
        </div>
      </div>
      <div className="max-w-lg space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={form.email} disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" type="tel" value={form.phone || "Not set"} disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Assigned Role</Label>
          <Input id="role" value={form.role} disabled />
        </div>
      </div>
    </div>
  )
}

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
          setTimeout(() => {
            setSaving(false)
            setForm({ current: "", newPass: "", confirm: "" })
          }, 600)
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

function NotificationsSection() {
  const { data: prefData, isLoading } = useGetNotificationPreferencesQuery()
  const [updatePrefs, { isLoading: isSaving }] = useUpdateNotificationPreferencesMutation()

  const [prefs, setPrefs] = useState({
    email_enabled: true,
    sms_enabled: true,
    push_enabled: true,
    marketing_emails: false,
    transactional_sms: true,
    security_alerts: true,
  })

  useEffect(() => {
    if (prefData?.data) {
      setPrefs({
        email_enabled: prefData.data.email_enabled ?? true,
        sms_enabled: prefData.data.sms_enabled ?? true,
        push_enabled: prefData.data.push_enabled ?? true,
        marketing_emails: prefData.data.marketing_emails ?? false,
        transactional_sms: prefData.data.transactional_sms ?? true,
        security_alerts: prefData.data.security_alerts ?? true,
      })
    }
  }, [prefData])

  const toggles: {
    key: keyof typeof prefs
    label: string
    desc: string
  }[] = [
    {
      key: "email_enabled",
      label: "Email Notifications",
      desc: "Receive operational and system emails",
    },
    {
      key: "sms_enabled",
      label: "SMS Notifications",
      desc: "Receive SMS for critical alerts",
    },
    {
      key: "push_enabled",
      label: "Push Notifications",
      desc: "Receive immediate browser push alerts",
    },
    {
      key: "security_alerts",
      label: "Security Alerts",
      desc: "Alerts on unauthorized access attempts or policy breaches",
    },
    {
      key: "transactional_sms",
      label: "Transactional SMS",
      desc: "Status updates for ticket and payment actions",
    },
  ]

  const handleSave = async () => {
    await updatePrefs(prefs).unwrap().catch(() => {})
  }

  if (isLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading preferences...</div>
  }

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
            onClick={handleSave}
            disabled={isSaving}
            className="bg-lime-500 text-white hover:bg-lime-600 disabled:bg-lime-500/50"
          >
            {isSaving ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </div>
    </div>
  )
}
