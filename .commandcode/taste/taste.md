# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/

# react
- Use Next.js Link component instead of native <a> tags for internal navigation to avoid full page refreshes. Confidence: 0.70
- Pass navigation data via props rather than hardcoding inside sidebar/layout components. Confidence: 0.70

# ui-patterns
See [ui-patterns/taste.md](ui-patterns/taste.md)
# data-handling
- When a backend field can legitimately be null, correct the TypeScript API type to match reality (e.g., `string | null`) and guard every usage — `?? ""` when seeding form state, `?? "—"` when rendering table cells — rather than assuming non-null values. Confidence: 0.5
- When the backend can return values outside the frontend's assumed enum/union (e.g., membership role `staff` missing from `roleConfig`), align the TypeScript type to the real backend enum (verified against backend source) and render defensively with a fallback (e.g., neutral badge for unknown roles) so unknown values can't crash the page. Confidence: 0.6

# workflow
See [workflow/taste.md](workflow/taste.md)
