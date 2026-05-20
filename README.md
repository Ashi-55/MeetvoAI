# MeetvoAI

MeetvoAI is a Next.js marketplace for businesses and verified AI builders. It includes onboarding, builder discovery, realtime chat, offer cards, escrow-style checkout, pricing, and an AI Studio for generating agent ideas from text or voice prompts.

Live app: https://meetvoai.in

## Features

- Business and builder authentication with Supabase
- Buyer and builder onboarding profiles
- Marketplace with builder/business cards
- Realtime messaging using Supabase Realtime
- Offer cards with accept/decline flow
- Razorpay checkout for escrow payments
- AI Studio prompt builder with Indian language voice recognition
- Dashboard, settings, pricing, orders, and notifications pages

## Tech Stack

- Next.js 13 App Router
- React 18
- TypeScript
- Tailwind CSS
- Supabase Auth, Database, and Realtime
- Razorpay payments
- Vercel deployment

## Local Setup

Install dependencies:

```bash
npm install
```

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

NEXT_PUBLIC_APP_URL=http://localhost:3000

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

OPENROUTER_API_KEY=your_openrouter_key
ANTHROPIC_API_KEY=your_anthropic_key
GEMINI_API_KEY=your_gemini_key
HUGGINGFACE_API_KEY=your_huggingface_key
```

Run locally:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Supabase Setup

Run the SQL migrations in `supabase/migrations/` inside the Supabase SQL editor, especially:

```text
supabase/migrations/20260505070444_meetvoai_schema.sql
supabase/migrations/20260505070445_fix_schema_and_policies.sql
supabase/migrations/20260516_fix_deployed_agents_schema.sql
supabase/migrations/20260518000000_add_builder_profiles_onboarding_fields.sql
```

If your database is missing the `orders` table, run the main schema migration first. The app expects these core tables:

- `profiles`
- `buyer_profiles`
- `builder_profiles`
- `agents`
- `conversations`
- `messages`
- `orders`
- `reviews`
- `studio_builds`
- `notifications`

Enable realtime for chat:

```sql
alter publication supabase_realtime add table conversations;
alter publication supabase_realtime add table messages;
```

If Supabase says a table is already a member of the publication, that is fine.

## Auth Redirects

In Supabase Authentication settings, set:

```text
Site URL:
https://meetvoai.in
```

Add redirect URLs:

```text
http://localhost:3000/auth/callback
http://localhost:3000/api/auth/callback
https://meetvoai.in/auth/callback
https://meetvoai.in/api/auth/callback
```

For Google sign-in, also add the same callback URL in Google Cloud OAuth settings.

## Razorpay Setup

Add Razorpay keys to `.env.local` and to Vercel environment variables.

For UPI/QR payment options, enable UPI in the Razorpay dashboard. The app opens Razorpay Checkout after a business accepts an offer.

Escrow flow:

1. Business or builder opens a conversation.
2. Builder sends an offer card.
3. Business accepts the offer.
4. An order is created with `order_status = pending_payment` and `escrow_status = pending`.
5. Razorpay checkout opens.
6. After payment confirmation, the order becomes active and escrow status becomes held.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run typecheck
```

## Deployment

The app is deployed on Vercel.

Production URL:

```text
https://meetvoai.in
```

Deploy with Vercel CLI:

```bash
npx vercel@latest --prod
```

Set these Vercel environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_KEY
NEXT_PUBLIC_APP_URL
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
NEXT_PUBLIC_RAZORPAY_KEY_ID
RAZORPAY_WEBHOOK_SECRET
OPENROUTER_API_KEY
ANTHROPIC_API_KEY
GEMINI_API_KEY
HUGGINGFACE_API_KEY
```

For production, `NEXT_PUBLIC_APP_URL` should be:

```env
NEXT_PUBLIC_APP_URL=https://meetvoai.in
```

## Important Routes

- `/` - landing page
- `/signup` - signup
- `/login` - login
- `/dashboard` - business dashboard
- `/dashboard/builder` - builder dashboard
- `/marketplace` - marketplace
- `/messages` - realtime messages
- `/studio` - AI Studio
- `/pricing` - pricing
- `/settings` - profile settings
- `/orders` - orders and escrow status

## Notes

- Do not commit `.env.local`.
- Keep Supabase service role keys only in server-side environments.
- Re-run `npm run build` before production deploys.
- Client-side rendering warnings for `/login`, `/messages`, and `/studio` are currently expected and do not block deployment.
