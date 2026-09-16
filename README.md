# CalaTrace Admin Dashboard

A minimal Next.js dashboard for the admin role to view batch, sensor, and
transport analytics. Reads directly from the existing CalaTrace Supabase
project — no new backend, no changes to the mobile app.

## Setup

1. **Run the views.** Open Supabase Dashboard → SQL Editor, paste and run
   `sql/admin_views.sql`. This creates 7 read-only views (all `create or replace`,
   so re-running the file after an update is always safe); it does not touch any
   existing table, column, or RLS policy.

2. **Install dependencies** (Tailwind, shadcn/ui primitives, and lucide-react were added,
   so re-run this even if you installed before):
   ```
   npm install
   ```

3. **Configure environment.** Copy `.env.local.example` to `.env.local` and
   fill in your Supabase anon/public key (found in Project Settings → API).
   Do **not** use the service_role key here — this app relies on the logged
   -in admin's session plus RLS, same as the mobile app.

4. **Run locally:**
   ```
   npm run dev
   ```
   Visit `http://localhost:3000` — it redirects to `/login`.

5. **Sign in** with an existing admin account (the same accounts created via
   the `update profiles set role = 'admin' where id = '...'` SQL from the
   mobile app setup). Non-admin accounts are redirected back to login.

## How it works

- `middleware.ts` checks the session on every `/dashboard` request and
  confirms `profiles.role = 'admin'` before allowing access — this covers
  every route under `/dashboard/*` automatically, including the new pages.
- This is a real multi-page app, not a single anchored page:
  - `/dashboard` — overview (stat cards, trend chart, recent previews)
  - `/dashboard/batches` — full batch list with search (`?q=`), stage
    filter (`?stage=`), farmer filter (`?farmer=`), and pagination (`?page=`)
  - `/dashboard/batches/[id]` — one batch's full detail: farmer info,
    latest + historical sensor readings with a trend chart, every transport
    leg, and its alert/notification history
  - `/dashboard/sensors` — full alert trend chart (real Daily/Weekly/Monthly
    data, not a placeholder) plus the complete paginated alert list
  - `/dashboard/transport` — full paginated delivery list, filterable by
    transporter (`?transporter=`)
  - `/dashboard/people` — farmers and transporters, each linking into a
    filtered view of their batches/deliveries
- Every clickable element on every page does something real: nav links are
  actual routes (no anchor-scrolling), the search box filters real data, the
  bell links to the alerts page with a live unread count, stat cards link to
  their full page, and table rows navigate to batch detail. Nothing is a
  disabled or decorative placeholder.
- If a page loads but shows empty/partial data for an admin who should see
  everything, check RLS policies on the underlying tables (`batches`,
  `notifications`, `transport_records`, `profiles`, `sensor_readings`) —
  views inherit RLS from their base tables, so an admin-scoped policy may be
  needed there. See the note at the bottom of `sql/admin_views.sql`.

## Deploying

Deploy to Vercel (or any Next.js host): connect the repo, set the two
`NEXT_PUBLIC_SUPABASE_*` env vars in the project settings, and deploy.
No other configuration needed.

## Layout & theme

- **No sidebar.** Navigation is a single top bar (`components/Topbar.tsx`):
  logo, horizontal route links (active state follows the real URL via
  `usePathname`), a functional search box, a bell linking to `/dashboard/sensors`
  with a live unread count, theme toggle, and an avatar dropdown with sign-out.
- `lib/theme.ts` mirrors the mobile app's `constants/theme.ts` color tokens. If the
  app's palette changes, update it there first, then mirror the values here and in
  `app/globals.css`.
- Built entirely on Tailwind CSS + shadcn/ui. `components/ui/*` — Button, Input,
  Label, Card, Badge, Separator, Table, Avatar, Tooltip, DropdownMenu — hand-written
  to match shadcn's own generated output (same `class-variance-authority` variant
  pattern, same Radix primitives, same CSS-variable convention: `--background`,
  `--card`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`,
  `--border`, `--input`, `--ring`, `--radius`, defined once for light mode and again
  under `[data-theme="dark"]`). `components.json` is already configured, so
  `npx shadcn@latest add <component>` works normally for anything new. Brand colors
  (`--branding`, `--leaf`, `--primary-dark`) stay fixed across both themes and layer
  on top as extra tokens.
- Fonts: `--font-logo` (Fraunces, italic) for the "CalaTrace" wordmark only,
  `--font-heading` (Space Grotesk) for headings, `--font-body` (IBM Plex Sans) for
  everything else, `--font-mono` (IBM Plex Mono) for numeric/data figures.
- Icons come from `lucide-react`. Avatars are colored initials circles
  (`components/InitialsAvatar.tsx`, built on the real shadcn `Avatar` primitive)
  rather than photos, since there's no profile photo field in the schema.
- Clickable table rows (`BatchRow.tsx`, `TransportRow.tsx`) are small client
  components using `router.push` on row click, rather than nesting a `<Link>`
  inside a `<tr>` — an `<a>` can't legally wrap `<td>` elements.


## Extending

- **Loading states**: a single `app/dashboard/loading.tsx` covers every route under
  `/dashboard` — Next.js nests `loading.tsx` automatically, so you don't need one per
  page. It's shown as a Suspense fallback both on first load and during client-side
  navigation while a page's data is being fetched. If one specific page ever needs a
  loading skeleton shaped like its own content, add a `loading.tsx` back into just
  that folder — it overrides the shared one for that route only.
- **Charts**: built on `components/ui/chart.tsx` — shadcn/ui's own official chart
  wrapper around Recharts (`ChartContainer`, `ChartTooltipContent`, `ChartConfig`),
  not raw Recharts calls. This is the same approach `npx shadcn@latest add chart`
  installs; it gives consistent theming (colors driven by CSS variables per series),
  a consistently styled tooltip, and dark-mode support for free. `StageChart`,
  `AlertsChart`, and `SensorTrendChart` all use it — follow their pattern for any
  new chart.

To add a new metric: write a new view in Supabase, then query it from
`app/dashboard/page.tsx` and render it — the mobile app is untouched by
anything here.
