"use client"

import { cn } from "@workspace/ui/lib/utils"
import { StatsCard, type StatsCardProps } from "./stats-card"

export type StatsGridCard = StatsCardProps & {
  key?: string
}

export function StatsGrid({
  cards,
  className,
  cardClassName,
}: {
  cards: StatsGridCard[]
  className?: string
  cardClassName?: string
}) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
      {cards.map((card) => (
        <StatsCard
          key={card.key ?? card.title}
          title={card.title}
          value={card.value}
          icon={card.icon}
          trend={card.trend}
          sparklineData={card.sparklineData}
          sparklineColor={card.sparklineColor}
          className={cn(card.className, cardClassName)}
        />
      ))}
    </div>
  )
}
