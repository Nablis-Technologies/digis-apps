<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:digis-monorepo-agent-rules -->
# Digis Monorepo — Strict Agent Operating Guide

This repo (`digis-apps`) is a **Turborepo + Bun** workspace. Two apps share one
design system and one data layer. Breaking either shared package breaks BOTH apps.
These rules are **mandatory**. Treat every rule below as a hard gate.

## 1. Workspace map (do not reinvent)

```
apps/
  admin/        # Full admin dashboard (consumes the shared packages)
  organizer/    # Login page + shared auth; reuses LoginForm & store
packages/
  ui/           # @workspace/ui  — shared design system (primitives + admin components)
  store/        # @workspace/store — Redux Toolkit + RTK Query (all API integration)
  eslint-config/
  typescript-config/
Digis API_collection (2).json   # CANONICAL API contract (Postman v2.1) — single source of truth
```

Root scripts (run from repo root): `bun run dev | build | lint | typecheck | format`
(they delegate to `turbo`). Always run gates from the **repo root**.

## 2. The shared packages ARE the product

`apps/admin` and `apps/organizer` intentionally contain **almost no duplicated
logic**. Their local source only has route files (`app/**`), `assets/`, and config.
Everything reusable lives in the packages and is pulled in via `tsconfig` path
aliases. **Do not recreate local copies of shared code in an app.**

### `packages/ui` (`@workspace/ui`)
- `src/styles/globals.css` — **the one and only global stylesheet / theme**.
  Tailwind v4 CSS-first, olive palette, class-based dark mode. It contains
  `@source` directives that scan `apps/**`, `components/**`, and the package `src`.
  This is the single source of truth for design tokens, colors, radii, fonts.
- `src/lib/utils.ts` — `cn()` (the ONLY class-merge helper).
- `src/hooks/use-mobile.ts` — shared hook.
- `src/components/*.tsx` — Radix-based shadcn primitives (`radix-vega` style),
  Hugeicons icons, olive theme.
- `src/components/admin/*.tsx` — admin feature components reused by both apps
  (`app-sidebar`, `nav-*`, `site-header`, `search-form`, `login-form`,
  `auth-guard`, `store-provider`, `theme-provider`, `dashboard/stats-card`,
  `forms/*`).

Exports (use these exact specifiers):
`@workspace/ui/globals.css`, `@workspace/ui/postcss.config`,
`@workspace/ui/lib/*`, `@workspace/ui/components/*`,
`@workspace/ui/components/admin/*`, `@workspace/ui/hooks/*`.

### `packages/store` (`@workspace/store`)
- `src/index.ts` — `store`, `RootState`, `AppDispatch`.
- `src/api.ts` — base query, token storage (js-cookie), `baseQueryWithReauth`,
  `BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"`.
- `src/reducers/*.ts` — RTK Query API slices (auth, users, roles, permissions,
  categories, venues, artists, organizations).

Exports: `@workspace/store`, `@workspace/store/api`, `@workspace/store/reducers/*`.

### App path aliases (already wired in every app's `tsconfig.json`)
These MUST stay. Do not reintroduce local `components/`, `store/`, `lib/`,
`hooks/` folders in apps — they are virtualized to the packages:
```
@/components/ui/*  -> packages/ui/src/components/*
@/components/*      -> packages/ui/src/components/admin/*
@/lib/*            -> packages/ui/src/lib/*
@/hooks/*          -> packages/ui/src/hooks/*
@/store            -> packages/store/src/index.ts
@/store/*          -> packages/store/src/*
```

## 3. MANDATORY verification gates (run from repo root, before "done")

After ANY change to `packages/ui`, `packages/store`, or an app that consumes them:

1. `bun run typecheck` — must be **all green** (every package).
2. `bun run lint` — **0 errors** (warnings allowed; do not introduce new ones).
3. `bun run build` — **all apps build**. This also regenerates `next-env.d.ts`,
   which is REQUIRED for `@/assets/*` static image imports. If you see
   `Cannot find module '@/assets/...'` during typecheck, run build first.

Never report a task complete with a failing gate. Never commit with a failing gate.

## 4. Safeguards for `@workspace/ui` (components / styling)

**DO**
- Import shared primitives via `@workspace/ui/components/...` and admin components
  via `@workspace/ui/components/admin/...`.
- Use `cn()` from `@workspace/ui/lib/utils` for all className merges.
- Add new UI via `shadcn add` from an app whose `components.json` points at the
  shared css (`../../packages/ui/src/styles/globals.css`) and `radix-vega` +
  `hugeicons` aliases — never a different style/icon library.
- Make `LoginForm` redirects configurable: it takes a `redirectTo` prop (default
  `"/admin"`). Pass it explicitly from each app; **never hardcode a cross-app
  redirect inside the shared component**.

**DO NOT**
- Duplicate a shared component locally in an app. If it's missing, add it to the
  package.
- Change the props/interface of an exported component in a **breaking** way.
  Additive, optional (defaulted) props only.
- Edit theme/tokens anywhere except `packages/ui/src/styles/globals.css`. No
  app-local global CSS, no new color systems.
- Switch the design system: keep **Radix + Hugeicons + olive**. Do not add
  `lucide-react`, Base UI, MUI, or other UI/icon libraries.
- Change `packages/ui` `tsconfig.json` back to the stricter monorepo defaults
  (`NodeNext`, `noUncheckedIndexedAccess: true`, `declaration: true`). The admin
  component/store source was authored for `moduleResolution: "bundler"` +
  `noUncheckedIndexedAccess: false` + `declaration: false`; reverting breaks it.

## 5. Safeguards for `@workspace/store` (API integration) — STRICTEST

The store is the **single source of truth for ALL backend communication**.
Apps must **never** call `fetch`/`axios`/RTK directly against the API; use the
exported RTK Query hooks (`useXQuery` / `useXMutation`).

**Every endpoint MUST match the canonical contract in
`Digis API_collection (2).json` (Postman v2.1).** Before adding or editing an
endpoint, open that file and confirm:
- HTTP method and full path (e.g. `POST /auth/login`, `GET /organizations/owner/:id`).
- Query params and request body shape (match the example `raw` bodies exactly).
- Response envelope: the API returns `{ success, message, data, ... }`, and list
  endpoints include a `pagination` object. Model TS types from these examples and
  keep them in sync.

**Auth contract (do not deviate):**
- `POST /auth/login` → `data.access_token` + `data.refresh_token`.
- Tokens are persisted via `js-cookie` under keys `accessToken` and `refreshToken`
  (see `src/api.ts`). Refresh is `POST /auth/refresh`.
- Never rename the cookie keys, the token fields, or the reauth flow without
  updating `src/api.ts` **and** every consumer (`auth-guard`, `login-form`,
  `store-provider`, `theme-provider`).
- `BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"`.
  Every app must provide `NEXT_PUBLIC_API_URL` (see `.env.example`).

**DO**
- Keep `reducerPath` and hook names stable. New endpoints: add with consistent
  `tagTypes` for cache invalidation and align with the collection.
- Before any change, `grep` the whole repo for the symbol you touch
  (`useXQuery`, `useXMutation`, exported type, cookie key, endpoint string).

**DO NOT**
- Add endpoints that are NOT in `Digis API_collection (2).json`. If the contract is
  missing an endpoint you need, **flag it** — do not invent paths or payloads.
- Change a `reducerPath`, hook name, or response type shape in a breaking way
  without updating all consumers in the same change.
- Introduce app-specific API logic outside the store package.

## 6. Dependency & build rules

- Shared packages must not leak app-only coupling. Prefer `@workspace/*`
  cross-package dependencies over duplicating deps.
- Add deps with `bun add` (keeps `bun.lock` valid). Do not hand-edit `package.json`
  in a way that desyncs the lockfile.
- Every app that imports `@workspace/ui` and/or `@workspace/store` MUST list both in
  `next.config.ts` `transpilePackages`: `transpilePackages: ["@workspace/ui", "@workspace/store"]`.
  If you add a new app, copy this exactly.

## 7. Change workflow (required for any shared-package edit)

1. **Locate consumers:** `grep -rn "<symbol>" apps packages` for the exported
   component prop, hook, store selector, cookie key, or endpoint you are changing.
2. **Stay backward compatible:** additive only; for breaking changes, update every
   consumer in the same diff and call it out explicitly in your summary.
3. **Edit in the package**, not in an app.
4. **Run the gates** (§3) from repo root; all must pass.
5. If a gate fails, fix it; do not bypass, disable, or relax rules to make it green.

## 8. Quick reference — common pitfalls

- `Cannot find module '@/assets/...'` during typecheck → run `bun run build`
  (regenerates `next-env.d.ts`).
- `router.replace("/admin")` style cross-app redirect → use the `redirectTo` prop
  on `LoginForm`; each app passes its own destination.
- Adding a component to an app instead of the package → it won't be shared and
  will drift; put it in `packages/ui`.
- Editing a store endpoint without checking `Digis API_collection (2).json` →
  silent runtime mismatch with the backend. The collection is the contract.
<!-- END:digis-monorepo-agent-rules -->
