"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Megaphone01Icon,
  SmartPhone01Icon,
  Mail01Icon,
  Add01Icon,
  Search01Icon,
  Rocket01Icon,
  PauseIcon,
  PlayIcon,
  Cancel01Icon,
  ChartBarLineIcon,
  Wallet01Icon,
  UserGroupIcon,
  FileUploadIcon,
  InformationCircleIcon,
  Copy01Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge, StatusBadge, ChannelBadge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TabsContent } from "@/components/ui/tabs"
import { PageTabs } from "@/components/page-tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate, formatNumber } from "@/lib/utils"
import { cn } from "@workspace/ui/lib/utils"
import { useActiveOrganization } from "../../../providers/organization-provider"
import {
  useListCreditsQuery,
  useListCreditRatesQuery,
  useListCampaignsQuery,
  usePauseCampaignMutation,
  useResumeCampaignMutation,
  useCancelCampaignMutation,
  useAbortCampaignMutation,
  useListContactListsQuery,
  useListCampaignTemplatesQuery,
  type Campaign,
  type CampaignContactList,
} from "@workspace/store/reducers/messagingApi"
import { CreateCampaignDialog } from "../../../components/campaigns/create-campaign-dialog"
import { LaunchCampaignDialog } from "../../../components/campaigns/launch-campaign-dialog"
import { CampaignAnalyticsDialog } from "../../../components/campaigns/campaign-analytics-dialog"
import { TopUpCreditsDialog } from "../../../components/campaigns/top-up-credits-dialog"
import { CreateContactListDialog } from "../../../components/campaigns/create-contact-list-dialog"
import { ImportCsvDialog } from "../../../components/campaigns/import-csv-dialog"

export default function CampaignsPage() {
  const { activeOrgId } = useActiveOrganization()
  const organizationId = activeOrgId || ""

  // Filter States
  const [selectedChannel, setSelectedChannel] = useState<"all" | "sms" | "email">("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Modal States
  const [createCampaignOpen, setCreateCampaignOpen] = useState(false)
  const [topUpOpen, setTopUpOpen] = useState(false)
  const [topUpDefaultChannel, setTopUpDefaultChannel] = useState<"sms" | "email">("sms")
  const [launchModal, setLaunchModal] = useState<{ open: boolean; campaign: Campaign | null }>({
    open: false,
    campaign: null,
  })
  const [analyticsModal, setAnalyticsModal] = useState<{ open: boolean; campaign: Campaign | null }>({
    open: false,
    campaign: null,
  })
  const [createListOpen, setCreateListOpen] = useState(false)
  const [importCsvModal, setImportCsvModal] = useState<{
    open: boolean
    listId: string
    listName: string
  }>({
    open: false,
    listId: "",
    listName: "",
  })

  // Queries
  const { data: creditsData, isLoading: isLoadingCredits } = useListCreditsQuery(organizationId, {
    skip: !organizationId,
  })
  const credits = creditsData?.data ?? []
  const smsCredit = credits.find((c) => c.channel === "sms")
  const emailCredit = credits.find((c) => c.channel === "email")

  const { data: ratesData } = useListCreditRatesQuery(organizationId, { skip: !organizationId })
  const rates = ratesData?.data ?? []
  const smsRate = rates.find((r) => r.channel === "sms" && r.status === "active")
  const emailRate = rates.find((r) => r.channel === "email" && r.status === "active")

  const {
    data: campaignsData,
    isLoading: isLoadingCampaigns,
    refetch: refetchCampaigns,
  } = useListCampaignsQuery(
    { organizationId, page: 1, per_page: 50 },
    { skip: !organizationId }
  )
  const campaigns = campaignsData?.data ?? []

  const { data: contactListsData, isLoading: isLoadingLists, refetch: refetchLists } = useListContactListsQuery(
    { organizationId },
    { skip: !organizationId }
  )
  const contactLists = contactListsData?.data ?? []

  const { data: templatesData } = useListCampaignTemplatesQuery({ organizationId }, { skip: !organizationId })
  const templates = templatesData?.data ?? []

  // Operational Mutations
  const [pauseCampaign, { isLoading: isPausing }] = usePauseCampaignMutation()
  const [resumeCampaign, { isLoading: isResuming }] = useResumeCampaignMutation()
  const [cancelCampaign, { isLoading: isCanceling }] = useCancelCampaignMutation()
  const [abortCampaign, { isLoading: isAborting }] = useAbortCampaignMutation()

  const handlePause = async (campaign: Campaign) => {
    try {
      await pauseCampaign({ organizationId, campaignId: campaign.id }).unwrap()
      toast.success(`Campaign "${campaign.name}" paused`)
    } catch {
      toast.error("Failed to pause campaign")
    }
  }

  const handleResume = async (campaign: Campaign) => {
    try {
      await resumeCampaign({ organizationId, campaignId: campaign.id }).unwrap()
      toast.success(`Campaign "${campaign.name}" resumed`)
    } catch {
      toast.error("Failed to resume campaign")
    }
  }

  const handleCancel = async (campaign: Campaign) => {
    try {
      await cancelCampaign({ organizationId, campaignId: campaign.id }).unwrap()
      toast.success(`Campaign "${campaign.name}" canceled`)
    } catch {
      toast.error("Failed to cancel campaign")
    }
  }

  const handleAbort = async (campaign: Campaign) => {
    try {
      await abortCampaign({ organizationId, campaignId: campaign.id }).unwrap()
      toast.success(`Campaign "${campaign.name}" aborted immediately`)
    } catch {
      toast.error("Failed to abort campaign")
    }
  }

  // Filtered Campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      if (selectedChannel !== "all" && c.channel !== selectedChannel) return false
      if (selectedStatus !== "all" && c.status !== selectedStatus) return false
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchName = c.name?.toLowerCase().includes(query)
        const matchBody = c.message_body?.toLowerCase().includes(query)
        if (!matchName && !matchBody) return false
      }
      return true
    })
  }, [campaigns, selectedChannel, selectedStatus, searchQuery])

  const openTopUpForChannel = (ch: "sms" | "email") => {
    setTopUpDefaultChannel(ch)
    setTopUpOpen(true)
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* ─── Header & Top Actions ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <HugeiconsIcon icon={Megaphone01Icon} size={26} className="text-lime-600 dark:text-lime-400" />
            Marketing & Messaging
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Broadcast direct SMS alerts, invitations, and rich emails to your attendees and custom lists.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            className="gap-2 shadow-xs"
            onClick={() => openTopUpForChannel("sms")}
          >
            <HugeiconsIcon icon={Wallet01Icon} strokeWidth={2} className="size-4" />
            Top Up Credits
          </Button>
          <Button asChild className="gap-2 shadow-xs">
            <Link href="/organizer/campaigns/new">
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4" />
              New Campaign
            </Link>
          </Button>
        </div>
      </div>

      {/* ─── Credit Balance Cards ─────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* SMS Credits */}
        <Card className="p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                <HugeiconsIcon icon={SmartPhone01Icon} size={16} strokeWidth={2} />
              </div>
              <span className="text-xs font-semibold">SMS Credits</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 font-semibold"
              onClick={() => openTopUpForChannel("sms")}
            >
              + Top Up
            </Button>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono">
            {isLoadingCredits ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              formatNumber(smsCredit?.available ?? 0)
            )}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Reserved: {formatNumber(smsCredit?.reserved ?? 0)}</span>
            <span>Rate: {((smsRate?.unit_price_minor ?? 25) / 100).toFixed(2)} ETB/SMS</span>
          </div>
        </Card>

        {/* Email Credits */}
        <Card className="p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400">
                <HugeiconsIcon icon={Mail01Icon} size={16} strokeWidth={2} />
              </div>
              <span className="text-xs font-semibold">Email Credits</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] text-sky-700 dark:text-sky-400 hover:bg-sky-500/10 font-semibold"
              onClick={() => openTopUpForChannel("email")}
            >
              + Top Up
            </Button>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono">
            {isLoadingCredits ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              formatNumber(emailCredit?.available ?? 0)
            )}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Reserved: {formatNumber(emailCredit?.reserved ?? 0)}</span>
            <span>Rate: {((emailRate?.unit_price_minor ?? 10) / 100).toFixed(2)} ETB/Email</span>
          </div>
        </Card>

        {/* Broadcast Reach Summary */}
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
              <HugeiconsIcon icon={Megaphone01Icon} size={16} strokeWidth={2} />
            </div>
            <span className="text-xs font-semibold">Campaign Operations</span>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono">
            {isLoadingCampaigns ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              formatNumber(campaigns.length)
            )}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>
              {campaigns.filter((c) => c.status === "sending").length} Active Sending
            </span>
            <span>
              {campaigns.filter((c) => c.status === "completed").length} Completed
            </span>
          </div>
        </Card>
      </div>

      <PageTabs
        defaultValue="campaigns"
        tabs={[
          { value: "campaigns", label: `Campaigns (${campaigns.length})`, icon: Megaphone01Icon },
          { value: "contacts", label: `Contact Lists (${contactLists.length})`, icon: UserGroupIcon },
          { value: "templates", label: "Templates & Tags", icon: Copy01Icon },
        ]}
      >

        {/* ─── TAB 1: CAMPAIGNS ────────────────────────────────────────────────── */}
        <TabsContent value="campaigns" className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <div className="relative w-full">
                <HugeiconsIcon
                  icon={Search01Icon}
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 text-xs h-9 bg-background"
                />
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-2">
              {/* Channel Filter Buttons */}
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant={selectedChannel === "all" ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "h-9 px-3 text-xs font-semibold rounded-lg shadow-xs",
                    selectedChannel !== "all" && "bg-background/80 hover:bg-muted/70 text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setSelectedChannel("all")}
                >
                  All Channels
                </Button>
                <Button
                  type="button"
                  variant={selectedChannel === "sms" ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "h-9 px-3 text-xs font-semibold rounded-lg gap-1.5 shadow-xs transition-all",
                    selectedChannel === "sms"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400 border-emerald-600 dark:border-emerald-500"
                      : "bg-background/80 hover:bg-muted/70 text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setSelectedChannel("sms")}
                >
                  <HugeiconsIcon icon={SmartPhone01Icon} size={14} strokeWidth={2} />
                  SMS
                </Button>
                <Button
                  type="button"
                  variant={selectedChannel === "email" ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "h-9 px-3 text-xs font-semibold rounded-lg gap-1.5 shadow-xs transition-all",
                    selectedChannel === "email"
                      ? "bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:text-zinc-950 dark:hover:bg-sky-400 border-sky-600 dark:border-sky-500"
                      : "bg-background/80 hover:bg-muted/70 text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setSelectedChannel("email")}
                >
                  <HugeiconsIcon icon={Mail01Icon} size={14} strokeWidth={2} />
                  Email
                </Button>
              </div>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                aria-label="Filter campaigns by status"
                className="h-9 rounded-lg border border-input/60 bg-background/80 px-3 py-1 text-xs font-medium text-foreground shadow-xs hover:border-input focus:outline-hidden focus:ring-2 focus:ring-ring/20 transition-all cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="sending">Sending</option>
                <option value="completed">Completed</option>
                <option value="paused">Paused</option>
                <option value="canceled">Canceled</option>
              </select>
            </div>
          </div>

          {/* Campaigns Roster Table */}
          <Card>
            <CardContent className="p-0">
              {isLoadingCampaigns ? (
                <div className="space-y-3 p-6">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : filteredCampaigns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                    <HugeiconsIcon icon={Megaphone01Icon} size={24} className="text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-foreground">No campaigns found</h3>
                  <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                    {searchQuery || selectedChannel !== "all" || selectedStatus !== "all"
                      ? "Try adjusting your search or filters."
                      : "Create your first broadcast to engage your attendees and fans via SMS or Email."}
                  </p>
                  <Button
                    size="sm"
                    asChild
                    className="mt-4 gap-1.5 text-xs shadow-xs"
                  >
                    <Link href="/organizer/campaigns/new">
                      <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2} />
                      New Campaign
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/20">
                        <th className="py-3 px-4 font-semibold">Campaign Name</th>
                        <th className="py-3 px-4 font-semibold">Channel</th>
                        <th className="py-3 px-4 font-semibold">Status</th>
                        <th className="py-3 px-4 font-semibold">Audience</th>
                        <th className="py-3 px-4 font-semibold">Timeline</th>
                        <th className="py-3 px-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredCampaigns.map((campaign) => {
                        const isDraft = campaign.status === "draft"
                        const isSending = campaign.status === "sending"
                        const isPaused = campaign.status === "paused"
                        const isCompleted = campaign.status === "completed"

                        const availableForChannel =
                          campaign.channel === "sms"
                            ? smsCredit?.available ?? 0
                            : emailCredit?.available ?? 0

                        return (
                          <tr key={campaign.id} className="hover:bg-muted/30 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-foreground">{campaign.name}</div>
                              {campaign.message_subject ? (
                                <div className="text-[11px] text-muted-foreground truncate max-w-xs">
                                  {campaign.message_subject}
                                </div>
                              ) : (
                                <div className="text-[11px] text-muted-foreground font-mono truncate max-w-xs">
                                  {campaign.message_body}
                                </div>
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              <ChannelBadge channel={campaign.channel} />
                            </td>

                            <td className="py-3.5 px-4">
                              <StatusBadge status={campaign.status} />
                            </td>

                            <td className="py-3.5 px-4 font-mono text-muted-foreground">
                              {campaign.quoted_quantity
                                ? `${formatNumber(campaign.quoted_quantity)} contacts`
                                : "Pending estimate"}
                            </td>

                            <td className="py-3.5 px-4 text-muted-foreground text-[11px]">
                              {campaign.launched_at
                                ? formatDate(campaign.launched_at)
                                : campaign.send_at
                                ? formatDate(campaign.send_at)
                                : campaign.quoted_at
                                ? formatDate(campaign.quoted_at)
                                : "Not scheduled"}
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {isDraft && (
                                  <Button
                                    size="sm"
                                    className="h-7 text-xs gap-1.5 shadow-xs"
                                    onClick={() =>
                                      setLaunchModal({
                                        open: true,
                                        campaign,
                                      })
                                    }
                                  >
                                    <HugeiconsIcon icon={Rocket01Icon} size={13} strokeWidth={2} />
                                    Launch
                                  </Button>
                                )}

                                {isSending && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-[11px] gap-1"
                                      onClick={() => handlePause(campaign)}
                                      disabled={isPausing}
                                    >
                                      <HugeiconsIcon icon={PauseIcon} size={12} />
                                      Pause
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 text-[11px] text-destructive hover:bg-destructive/10"
                                      onClick={() => handleAbort(campaign)}
                                      disabled={isAborting}
                                    >
                                      Abort
                                    </Button>
                                  </>
                                )}

                                {isPaused && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-[11px] gap-1"
                                      onClick={() => handleResume(campaign)}
                                      disabled={isResuming}
                                    >
                                      <HugeiconsIcon icon={PlayIcon} size={12} />
                                      Resume
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 text-[11px] text-destructive hover:bg-destructive/10"
                                      onClick={() => handleCancel(campaign)}
                                      disabled={isCanceling}
                                    >
                                      Cancel
                                    </Button>
                                  </>
                                )}

                                {isCompleted && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-[11px] gap-1"
                                    onClick={() =>
                                      setAnalyticsModal({
                                        open: true,
                                        campaign,
                                      })
                                    }
                                  >
                                    <HugeiconsIcon icon={ChartBarLineIcon} size={13} />
                                    Analytics
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB 2: CONTACT LISTS ────────────────────────────────────────────── */}
        <TabsContent value="contacts" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Custom Audience Lists</h3>
              <p className="text-xs text-muted-foreground">
                Maintain reusable subscriber lists for targeted email and SMS broadcasts.
              </p>
            </div>
            <Button
              className="gap-2 shadow-xs"
              onClick={() => setCreateListOpen(true)}
            >
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4" />
              New Contact List
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {isLoadingLists ? (
                <div className="space-y-3 p-6">
                  {[...Array(2)].map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : contactLists.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                    <HugeiconsIcon icon={UserGroupIcon} size={24} className="text-muted-foreground" />
                  </div>
                  <h4 className="mt-3 text-sm font-semibold">No Audience Lists Yet</h4>
                  <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                    Create a list to import contacts from CSV or segment past attendees.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-4 text-xs"
                    onClick={() => setCreateListOpen(true)}
                  >
                    + Create First List
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/20">
                        <th className="py-3 px-4 font-semibold">List Name</th>
                        <th className="py-3 px-4 font-semibold">Subscribers</th>
                        <th className="py-3 px-4 font-semibold">Status</th>
                        <th className="py-3 px-4 font-semibold">Created</th>
                        <th className="py-3 px-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {contactLists.map((list) => (
                        <tr key={list.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-foreground">
                            {list.name}
                          </td>
                          <td className="py-3.5 px-4 font-mono">
                            {formatNumber(list.entries_count || 0)} contacts
                          </td>
                          <td className="py-3.5 px-4">
                            <StatusBadge status={list.status} />
                          </td>
                          <td className="py-3.5 px-4 text-muted-foreground">
                            {formatDate(list.created_at)}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1.5"
                              onClick={() =>
                                setImportCsvModal({
                                  open: true,
                                  listId: list.id,
                                  listName: list.name,
                                })
                              }
                            >
                              <HugeiconsIcon icon={FileUploadIcon} size={13} />
                              Import CSV
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB 3: TEMPLATES & GUIDE ────────────────────────────────────────── */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Merge Tags Documentation */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Personalization Variables</CardTitle>
                <CardDescription className="text-xs">
                  Include dynamic merge tags in your SMS and email bodies.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5 text-xs">
                <div className="rounded-lg border bg-muted/20 p-2.5">
                  <div className="flex items-center justify-between font-mono font-bold text-foreground">
                    <span>&#123;first_name&#125;</span>
                    <span className="text-[11px] font-normal text-muted-foreground">Recipient Name</span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Replaced with the attendee&apos;s registered first name or &quot;there&quot; if absent.
                  </p>
                </div>

                <div className="rounded-lg border bg-muted/20 p-2.5">
                  <div className="flex items-center justify-between font-mono font-bold text-foreground">
                    <span>&#123;event_title&#125;</span>
                    <span className="text-[11px] font-normal text-muted-foreground">Target Event</span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Automatically inserts the official event title.
                  </p>
                </div>

                <div className="rounded-lg border bg-muted/20 p-2.5">
                  <div className="flex items-center justify-between font-mono font-bold text-foreground">
                    <span>&#123;ticket_link&#125;</span>
                    <span className="text-[11px] font-normal text-muted-foreground">Short Link</span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Generates a branded <code className="text-[10px]">dig.is/...</code> link with live click tracking (CTR).
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Compliance & Anti-Spam Guide */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Carrier & Spam Guidelines</CardTitle>
                <CardDescription className="text-xs">
                  Ensure high delivery rates and prevent carrier blocking.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <HugeiconsIcon icon={InformationCircleIcon} size={16} className="text-lime-600 shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-foreground">Explicit Consent:</strong> Only message contacts who explicitly opted in during ticket checkout or subscriber sign-up.
                  </p>
                </div>

                <div className="flex items-start gap-2">
                  <HugeiconsIcon icon={InformationCircleIcon} size={16} className="text-lime-600 shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-foreground">GSM 7-bit Encoding:</strong> Standard SMS messages are billed as 1 credit per 160 characters. Adding emojis or unusual unicode symbols switches to 70 characters per credit.
                  </p>
                </div>

                <div className="flex items-start gap-2">
                  <HugeiconsIcon icon={InformationCircleIcon} size={16} className="text-lime-600 shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-foreground">Automated Opt-Out:</strong> Every broadcast includes automated STOP instructions for Ethiopian mobile carriers.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </PageTabs>

      {/* ─── Modals ───────────────────────────────────────────────────────────── */}
      <CreateCampaignDialog
        open={createCampaignOpen}
        onOpenChange={setCreateCampaignOpen}
        organizationId={organizationId}
        onSuccess={refetchCampaigns}
      />

      <LaunchCampaignDialog
        open={launchModal.open}
        onOpenChange={(open) => setLaunchModal((prev) => ({ ...prev, open }))}
        organizationId={organizationId}
        campaign={launchModal.campaign}
        availableCredits={
          launchModal.campaign?.channel === "sms"
            ? smsCredit?.available ?? 0
            : emailCredit?.available ?? 0
        }
        onOpenTopUp={() =>
          openTopUpForChannel(launchModal.campaign?.channel === "email" ? "email" : "sms")
        }
        onSuccess={refetchCampaigns}
      />

      <CampaignAnalyticsDialog
        open={analyticsModal.open}
        onOpenChange={(open) => setAnalyticsModal((prev) => ({ ...prev, open }))}
        organizationId={organizationId}
        campaign={analyticsModal.campaign}
      />

      <TopUpCreditsDialog
        open={topUpOpen}
        onOpenChange={setTopUpOpen}
        organizationId={organizationId}
        defaultChannel={topUpDefaultChannel}
      />

      <CreateContactListDialog
        open={createListOpen}
        onOpenChange={setCreateListOpen}
        organizationId={organizationId}
        onSuccess={refetchLists}
      />

      <ImportCsvDialog
        open={importCsvModal.open}
        onOpenChange={(open) => setImportCsvModal((prev) => ({ ...prev, open }))}
        organizationId={organizationId}
        contactListId={importCsvModal.listId}
        contactListName={importCsvModal.listName}
        onSuccess={refetchLists}
      />
    </div>
  )
}
