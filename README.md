    # MeetvoAI

Next.js (App Router) SaaS marketplace for verified AI builders, escrow-protected deals, and an AI Studio for generating + deploying agents.

## Setup

### 1) Install dependencies
```bash
npm install
```

### 2) Configure environment
Create `.env.local` with the following keys (fill values as needed):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `HUGGINGFACE_API_KEY`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `NEXT_PUBLIC_APP_URL`

> Note: The app also uses additional Supabase tables like `profiles`, `builder_profiles`, `business_profiles`, `agents`, `conversations`, `messages`, `orders`, `deals`, and `notifications`.

### 3) Run locally
```bash
npm run dev
```

Open: `http://localhost:3000`

## Demo data (evaluation)

### Seed demo data
```bash
curl "http://localhost:3000/api/seed"
```

### Clear demo data
```bash
curl "http://localhost:3000/api/seed/clear"
```

### Demo credentials
- **Business**
  - Email: `demo-business@meetvoai.in`
  - Password: `Demo@1234`
  - Role: `business`

- **Builder**
  - Email: `demo-builder@meetvoai.in`
  - Password: `Demo@1234`
  - Role: `builder`

## Architecture overview

- **App Router** under `app/`
- **UI components** under `components/` (Radix + Tailwind)
- **Auth hooks** under `hooks/`
- **Supabase helpers** under `lib/`
- **State stores** under `stores/` (Zustand)
- **API routes** under `app/api/`

Key routes:
- `/orders` – marketplace orders UI (Buying/Selling)
- `/pricing` – pricing page
- `/studio` – AI Studio

## Deal flow (high level)

1. **Buyer discovers / selects a builder agent** from the marketplace.
2. **Order is created** and paid via the external payment flow (Razorpay + escrow).
3. **Escrow holds funds** until the delivery is submitted and the business approves.
4. **If delivery is disputed**, the platform/admin reviews.
5. **Completed deals** can generate reviews.

## Seeding implementation

- `app/api/seed/route.ts`: best-effort seeding for demo evaluation.
- `app/api/seed/clear/route.ts`: deletes demo data.
- `lib/notifications.ts`: helper to create notifications.

