# ui-patterns
- Detail pages (e.g., organizations, artists, venues) should follow the same layout pattern: back-link header with name + badges, stats cards row, tab navigation, then tab content. Confidence: 0.70
- New admin list modules follow the established page recipe: header with title/subtitle + refresh and create buttons, a row of StatsCards, a DataTable with sortable columns/pagination/row actions, ConfirmDialog for deletes, and a dialog form for create/edit. Confidence: 0.65
- Tabs and action buttons should include Hugeicons icons for visual clarity. Confidence: 0.70
- Icon-only row actions must be visually distinct across states — near-identical icons (e.g., EyeIcon vs EyeClosedIcon for activate/deactivate) read as the same action and the user reports missing actions that actually exist; prefers clearly distinguishable affordances or text labels. Confidence: 0.5
- Wants user-visible feedback for every operation — success and error messages on every mutation (create/update/delete/publish/auth flows), not silent `.unwrap()` catches or inline-only errors. Confidence: 0.85
- Prefers a shadcn-standard toast system (sonner) with a globally mounted `<Toaster>` in app layouts, and a shared helper that surfaces the backend's error message with sensible fallbacks, over inline-only error text. Confidence: 0.7
