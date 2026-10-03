"use client"

import { CreateCampaignForm } from "../../../../components/campaigns/create-campaign-form"

export default function NewCampaignPage() {
  return (
    <div className="flex flex-col flex-1 gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <CreateCampaignForm />
    </div>
  )
}
