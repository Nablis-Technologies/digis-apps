/**
 * Sample data for DEGES Organizer Platform development
 */

import type { Event, KPI, TopEvent, ChartDataPoint } from "./types"

export const sampleEvents: Event[] = [
  {
    id: "gize-concert",
    name: "Gize Concert Night",
    category: "Concert",
    bannerUrl: "/assets/banner 1.webp",
    venue: "Friendship Park",
    city: "Addis Ababa",
    startAt: "2026-06-12T19:00:00.000Z",
    status: "Published",
    tiers: [
      { id: "vip", name: "VIP", total: 200, sold: 140, price: 2000 },
      { id: "ga", name: "General", total: 1200, sold: 840, price: 600 },
    ],
  },
  {
    id: "tech-innovate",
    name: "Tech Innovate ETH",
    category: "Conference",
    bannerUrl: "/assets/banner 8.webp",
    venue: "Millennium Hall",
    city: "Addis Ababa",
    startAt: "2026-06-20T09:30:00.000Z",
    status: "Draft",
    tiers: [
      { id: "early", name: "Early Bird", total: 300, sold: 80, price: 1200 },
      { id: "standard", name: "Standard", total: 900, sold: 220, price: 1500 },
    ],
  },
  {
    id: "fashion-week",
    name: "Addis Fashion Week",
    category: "Fashion",
    bannerUrl: "/assets/banner 3.webp",
    venue: "Sheraton Hotel",
    city: "Addis Ababa",
    startAt: "2026-07-05T18:00:00.000Z",
    status: "Live",
    tiers: [
      { id: "vvip", name: "VVIP", total: 50, sold: 48, price: 5000 },
      { id: "vip", name: "VIP", total: 150, sold: 142, price: 3000 },
      { id: "regular", name: "Regular", total: 500, sold: 380, price: 1500 },
    ],
  },
  {
    id: "food-festival",
    name: "Ethiopian Food Festival",
    category: "Festival",
    bannerUrl: "/assets/banner 4.webp",
    venue: "Unity Park",
    city: "Addis Ababa",
    startAt: "2026-06-28T11:00:00.000Z",
    status: "Published",
    tiers: [
      { id: "family", name: "Family Pass", total: 200, sold: 156, price: 800 },
      { id: "single", name: "Single Entry", total: 800, sold: 620, price: 300 },
    ],
  },
  {
    id: "art-exhibition",
    name: "Contemporary Art Exhibition",
    category: "Art",
    bannerUrl: "/assets/banner 2.webp",
    venue: "National Museum",
    city: "Addis Ababa",
    startAt: "2026-07-15T10:00:00.000Z",
    status: "Draft",
    tiers: [
      { id: "guided", name: "Guided Tour", total: 100, sold: 32, price: 600 },
      { id: "general", name: "General Entry", total: 400, sold: 108, price: 200 },
    ],
  },
]

export const sampleKPIs: KPI[] = [
  { label: "Total Events", value: "24", change: 12, trend: "up" },
  { label: "Tickets Sold", value: "8,543", change: 18, trend: "up" },
  { label: "Total Revenue", value: "645.2K ETB", change: 25, trend: "up" },
  { label: "Total Attendees", value: "7,891", change: 8, trend: "up" },
]

export const sampleTopEvents: TopEvent[] = [
  {
    id: "gize-concert",
    name: "Gize Concert Night",
    revenue: 864000,
    ticketsSold: 980,
    bannerUrl: "/banner1.webp",
  },
  {
    id: "fashion-week",
    name: "Addis Fashion Week",
    revenue: 756000,
    ticketsSold: 570,
    bannerUrl: "/banner3.webp",
  },
  {
    id: "food-festival",
    name: "Ethiopian Food Festival",
    revenue: 421200,
    ticketsSold: 776,
    bannerUrl: "/banner4.webp",
  },
]

export const samplePerformanceData: ChartDataPoint[] = [
  { date: "Jan", value: 12000 },
  { date: "Feb", value: 19000 },
  { date: "Mar", value: 15000 },
  { date: "Apr", value: 28000 },
  { date: "May", value: 35000 },
  { date: "Jun", value: 42000 },
  { date: "Jul", value: 38000 },
]

export const eventCategories = [
  "Concert",
  "Conference",
  "Festival",
  "Workshop",
  "Seminar",
  "Exhibition",
  "Sports",
  "Theater",
  "Comedy",
  "Networking",
  "Charity",
  "Fashion",
  "Art",
  "Food & Drink",
]

export const ethiopianCities = [
  "Addis Ababa",
  "Dire Dawa",
  "Mekelle",
  "Gondar",
  "Awasa",
  "Bahir Dar",
  "Jimma",
  "Bishoftu",
  "Adama",
  "Harar",
]

export const venues = [
  "Friendship Park",
  "Millennium Hall",
  "Sheraton Hotel",
  "Unity Park",
  "Addis Arena",
  "National Museum",
  "Skylight Hotel",
  "Ethiopian National Theater",
  "Elilly International Hotel",
  "Nexus Hotel",
]
