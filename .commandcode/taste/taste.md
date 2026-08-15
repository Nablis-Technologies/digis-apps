# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/

# react
- Use Next.js Link component instead of native <a> tags for internal navigation to avoid full page refreshes. Confidence: 0.70
- Pass navigation data via props rather than hardcoding inside sidebar/layout components. Confidence: 0.70

# ui-patterns
- Detail pages (e.g., organizations, artists, venues) should follow the same layout pattern: back-link header with name + badges, stats cards row, tab navigation, then tab content. Confidence: 0.70
- New admin list modules follow the established page recipe: header with title/subtitle + refresh and create buttons, a row of StatsCards, a DataTable with sortable columns/pagination/row actions, ConfirmDialog for deletes, and a dialog form for create/edit. Confidence: 0.65
- Tabs and action buttons should include Hugeicons icons for visual clarity. Confidence: 0.70
- Wants user-visible feedback for every operation — success and error messages on every mutation (create/update/delete/publish/auth flows), not silent `.unwrap()` catches or inline-only errors. Confidence: 0.85
- Prefers a shadcn-standard toast system (sonner) with a globally mounted `<Toaster>` in app layouts, and a shared helper that surfaces the backend's error message with sensible fallbacks, over inline-only error text. Confidence: 0.7

# data-handling
- When a backend field can legitimately be null, correct the TypeScript API type to match reality (e.g., `string | null`) and guard every usage — `?? ""` when seeding form state, `?? "—"` when rendering table cells — rather than assuming non-null values. Confidence: 0.5
- When the backend can return values outside the frontend's assumed enum/union (e.g., membership role `staff` missing from `roleConfig`), align the TypeScript type to the real backend enum (verified against backend source) and render defensively with a fallback (e.g., neutral badge for unknown roles) so unknown values can't crash the page. Confidence: 0.6

# workflow
See [workflow/taste.md](workflow/taste.md)
