# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo structure

NX monorepo with npm workspaces:
- `apps/web/` — Next.js web app + REST API (desktop-focused, but should remain usable on mobile)
- `apps/mobile/` — Expo/React Native mobile app (primary mobile experience)
- `libs/shared/` — shared TypeScript types and utilities (`@recipe-app/shared`)

**Always prefer `@recipe-app/shared` for types and utilities used by more than one app.** When adding new shared types or constants, add them to `libs/shared/src/` and import from `@recipe-app/shared`.

## Stack

- **Next.js 16** (App Router, `src/` dir, TypeScript, Turbopack) — `apps/web/`
- **Expo SDK 55** + **Expo Router** (file-based nav) — `apps/mobile/`
- **Tailwind CSS v4** (web) / **NativeWind v4** (mobile) — keep design tokens in sync between apps
- **ShadCN UI v4** (web) — components in `apps/web/src/components/ui/`; uses `@base-ui/react` (not Radix), no `asChild` prop; use `render={<Link />}` for polymorphic buttons
- **Clerk** — auth for both apps (`@clerk/nextjs` on web, `@clerk/expo` on mobile)
- **Supabase** — PostgreSQL via service role key (no Supabase auth); `user_id` = Clerk `userId` stored as `text`
- **TanStack Query v5** — data fetching on mobile against web's `/api/*` routes
- **next-pwa** — PWA manifest at `apps/web/public/manifest.json`, disabled in development

## Design system

Both apps share a pastel theme — keep styling consistent across platforms:
- **Background**: cream (`#faf7f0` / `bg-background`)
- **Primary**: dusty rose (`#b06060`)
- **Secondary**: sage (`#d9eadc`)
- **Accent**: lavender (`#d5cee6`)
- **Font**: Nunito (rounded)
- **Radius**: rounder than defaults — use `rounded-2xl` / `rounded-3xl` for cards and buttons

Web: theme defined as CSS variables in `apps/web/src/app/globals.css`.
Mobile: color tokens in `apps/mobile/tailwind.config.js`.

## Web architecture (`apps/web/`)

### Route groups
- `src/app/(app)/` — authenticated shell with bottom nav + `max-w-lg` centered layout
- `src/app/(auth)/` — Clerk sign-in/sign-up pages
- `src/app/api/` — REST API consumed by mobile (and web client components)

### Auth pattern
Clerk proxy in `src/proxy.ts` (Next.js 16 renamed `middleware.ts` → `proxy.ts`) protects all routes. Server pages use `auth()` from `@clerk/nextjs/server`. API routes also call `auth()`.

### Database pattern
All DB access goes through **service role key** in server-only code (`src/lib/db/`). Never call Supabase from client components directly.

## Mobile architecture (`apps/mobile/`)

- Expo Router file-based routing mirroring web's route groups: `(app)/` (auth-gated tabs), `(auth)/`
- `lib/api.ts` — generic fetch wrapper hitting web's API; uses `EXPO_PUBLIC_API_BASE_URL`
- `lib/query-client.ts` — TanStack Query client config
- Auth guard in `app/_layout.tsx` redirects based on `useAuth().isSignedIn`


## Database schema

Run `apps/web/supabase/schema.sql` in the Supabase SQL editor.
Tables: `recipes`, `recipe_ingredients`, `recipe_instructions`, `tags`, `recipe_tags`, `shopping_list_items`

## Environment variables

- `apps/web/.env.local` — Clerk + Supabase keys (copy from `.env.local.example`)
- `apps/mobile/.env.local` — `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`, `EXPO_PUBLIC_API_BASE_URL`

## Quality checks

After implementing features or making changes, run TypeScript type-checking on the affected app(s):

- **Web**: `npm run type-check` (in `apps/web/`) or `nx run web:type-check`
- **Mobile**: `npm run type-check` (in `apps/mobile/`) or `nx run mobile:type-check`

These commands run `tsc --noEmit` to catch type errors without emitting output files. Always run type-check before committing code that touches both apps.

## Other notable things

- When installing packages to the mobile app, always use `npx expo install`
- Never install any packages to the root
