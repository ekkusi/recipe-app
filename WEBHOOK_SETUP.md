# Clerk Webhook Setup for Account Deletion

When a user deletes their account through the Clerk UserButton component in the Header, we need a webhook to clean up their data from Supabase.

## Setup Steps

### 1. Install Dependencies
```bash
cd apps/web
npm install
```

### 2. Get Webhook Endpoint
The webhook handler is at: `/api/webhooks/clerk`

Your public endpoint will be: `https://yourdomain.com/api/webhooks/clerk`

### 3. Configure in Clerk Dashboard

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Navigate to **Webhooks** (in the left sidebar under "Integrations")
4. Click **Create Endpoint**
5. Enter the endpoint URL: `https://yourdomain.com/api/webhooks/clerk` (replace with your domain)
6. Select the `user.deleted` event
7. Click **Create**
8. Copy the **Signing Secret**

### 4. Add Environment Variable

Add to `apps/web/.env.local`:
```
CLERK_WEBHOOK_SECRET=your_signing_secret_here
```

Replace `your_signing_secret_here` with the secret from step 3.

## How It Works

1. User opens Header → clicks UserButton (avatar) → Account settings
2. User selects "Delete account" from Clerk's built-in menu
3. User confirms deletion in Clerk
4. Clerk sends a `user.deleted` webhook event
5. Our webhook handler at `/api/webhooks/clerk` receives the event
6. Handler deletes all user data (recipes, collections, shopping lists) from Supabase
7. Clerk also signs out the user automatically

## Files Created/Modified

- **New**: `apps/web/src/app/api/webhooks/clerk/route.ts` — Webhook handler
- **Modified**: `apps/web/src/app/api/account/delete/route.ts` — Fixed session issue
- **Modified**: `apps/web/src/app/(app)/settings/delete-account/delete-account-form.tsx` — Fixed redirect
- **Modified**: `apps/web/package.json` — Added svix dependency
