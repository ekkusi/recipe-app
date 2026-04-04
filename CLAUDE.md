# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build
npm run start    # Start production server
```

## Stack

- **Next.js 16** (App Router, `src/` dir, TypeScript, Turbopack)
- **ShadCN UI v4** + **Tailwind CSS v4** — components in `src/components/ui/` — uses `@base-ui/react` (not Radix), no `asChild` prop; use `render={<Link />}` for polymorphic buttons
- **Clerk** — authentication (env: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`)
- **Supabase** — PostgreSQL database via service role key (no Supabase auth, Clerk handles auth)
- **next-pwa** — PWA manifest at `public/manifest.json`, disabled in development

## Architecture

### Route groups
- `src/app/(app)/` — authenticated app shell with bottom nav + `max-w-lg` centered layout
- `src/app/(auth)/` — Clerk sign-in/sign-up pages
- `src/app/api/` — REST API routes used by client components

### Auth pattern
Clerk proxy in `src/proxy.ts` (Next.js 16 renamed `middleware.ts` → `proxy.ts`) protects all routes except `/`, `/sign-in`, `/sign-up`. Server-side pages use `auth()` from `@clerk/nextjs/server`. Client pages hit `/api/*` routes which also call `auth()`.

### Database pattern
All DB access goes through **service role key** (bypasses RLS) in server-only code (`src/lib/db/`). The `user_id` is the Clerk `userId` string, stored as `text` in all tables. Never call Supabase from client components directly.

### Key files
- `src/lib/db/recipes.ts` — all recipe CRUD + tag queries
- `src/lib/db/shopping-list.ts` — shopping list CRUD
- `src/lib/supabase/server.ts` — `createClient()` (cookie-based) and `createServiceClient()` (service role)
- `src/lib/units.ts` — `UNITS` constant used by ingredient forms
- `src/components/recipes/ingredient-row.tsx` — reusable ingredient input (name + qty + unit)
- `src/components/recipes/recipe-form.tsx` — full recipe create/edit form (client component)

## Database schema

Run `supabase/schema.sql` in the Supabase SQL editor to set up tables and seed tags.

Tables: `recipes`, `recipe_ingredients`, `recipe_instructions`, `tags`, `recipe_tags`, `shopping_list_items`

## Environment variables

Copy `.env.local.example` to `.env.local` and fill in Clerk and Supabase keys.

## Design system

Pastel theme defined in `src/app/globals.css` CSS variables — cream background, dusty rose primary, sage secondary, lavender accent. Font: Nunito (rounded). Border radius base: `0.875rem` (rounder than ShadCN default). Use `rounded-2xl` / `rounded-3xl` for cards and buttons.

## PWA icons

Generate `public/icon-192.png` and `public/icon-512.png` to complete PWA installability (currently missing).
