# 🍼 BabyTracker

Track your baby's feedings and diaper changes. Built with Angular 19 + Supabase.

## Features

- **Breastfeeding timer** — Start a session, track left/right breast with live per-side timing and the ability to switch mid-feed
- **Time since last feeding** — Always visible on the dashboard
- **Diaper logging** — One-tap log for pee, poop, or both
- **Daily diaper totals** — Running count for the current day
- **Full history** — Browse any past date with date navigation
- **Realtime sync** — Both parents see updates instantly via Supabase Realtime

## Tech Stack

| | |
|---|---|
| Frontend | Angular 19 (standalone, signals) |
| Styling | Vanilla CSS (dark-first glassmorphism) |
| Backend | Supabase (PostgreSQL + Auth + Realtime) |
| Deploy | Vercel (static SPA) |

---

## Local Development

### Prerequisites

- Node.js v18.19+ (tested on v22.12.0)
- Docker Desktop (for local Supabase)
- Supabase CLI

```bash
npm install -g supabase
```

### 1. Install dependencies

```bash
cd babytracker
npm install
```

### 2. Start local Supabase

```bash
supabase start
# Note the `anon key` and `API URL` from the output
```

### 3. Run the SQL migration

```bash
supabase db reset
# OR paste supabase/migrations/20240101000000_initial_schema.sql into the Supabase Studio SQL editor
```

### 4. Configure environment

Edit `src/environments/environment.ts` and replace the placeholders:

```ts
export const environment = {
  production: false,
  supabaseUrl: 'http://127.0.0.1:54321',   // from `supabase start` output
  supabaseAnonKey: 'your-local-anon-key',  // from `supabase start` output
};
```

### 5. Run the dev server

```bash
npm start
# → http://localhost:4200
```

### 6. Logging in Locally (Email Auth)

This app uses passwordless "magic link" email login. During local development, Supabase catches all outgoing emails using a local testing tool called **Inbucket**. You do not need to configure a real email provider.

1. Open the app at `http://localhost:4200` and enter any email address to sign in.
2. Open the local Inbucket web interface at `http://localhost:54324` in your browser.
3. You should see the intercepted "Magic Link" email. Open it.
4. Click the sign-in link inside the email to complete the login process and start using the app!

---

## Production Deployment (Vercel)

1. **Push this repo to GitHub**

2. **Create a Supabase project** at [supabase.com](https://supabase.com)

3. **Run the migration** in your Supabase project:
   - Go to SQL Editor → paste `supabase/migrations/20240101000000_initial_schema.sql` → Run

4. **Import to Vercel**
   - Connect GitHub repo
   - Framework: **Other** (Angular builds to static files)
   - Build command: `npm run build`
   - Output directory: `dist/babytracker/browser`

5. **Add Vercel environment variables**:
   - `NG_APP_SUPABASE_URL` → your Supabase project URL
   - `NG_APP_SUPABASE_ANON_KEY` → your Supabase anon key

   > **Note**: Update `src/environments/environment.prod.ts` with your actual production values before deploying, OR set them up as build-time replacements.

6. Deploy! ✨

---

## Database Schema

### `feedings`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → auth.users | |
| `started_at` | timestamptz | |
| `ended_at` | timestamptz | null = in progress |

### `feeding_segments`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `feeding_id` | uuid FK → feedings | |
| `breast` | text | 'left' or 'right' |
| `started_at` | timestamptz | |
| `ended_at` | timestamptz | null = currently active |

### `diaper_changes`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → auth.users | |
| `changed_at` | timestamptz | |
| `type` | text | 'pee', 'poop', or 'both' |

---

## Supabase Auth

This app uses **magic-link (passwordless) email login**. Sign in with your email, click the link, and you're in. No passwords to remember.

All tables have Row-Level Security (RLS) enabled — users can only read and write their own data.
