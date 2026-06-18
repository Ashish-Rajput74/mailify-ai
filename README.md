# Mailify.ai

Autonomous email agent — connect your Gmail, describe what you want in plain English, and the AI handles the rest.

## Stack
- **Next.js 14** — frontend + API routes (deployed on Vercel)
- **MongoDB** — users, automations, jobs
- **Nodemailer + Gmail SMTP** — send emails
- **Gemini 1.5 Flash** — parse instructions + draft emails
- **node-cron** — background worker that fires scheduled jobs (deployed on Render)

---

## Deployment Guide

### Part 1 — Vercel (Frontend + API)

1. Push this repo to GitHub
2. Go to vercel.com → New Project → Import your GitHub repo
3. Framework will auto-detect as Next.js
4. Add these Environment Variables in Vercel dashboard:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `NEXTAUTH_URL` | Your Vercel URL e.g. https://mailify-ai.vercel.app |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` to generate |
| `GEMINI_API_KEY` | From aistudio.google.com (free) |

5. Click Deploy

6. After deploy, go to Google Cloud Console → OAuth credentials → add your Vercel URL to authorized redirect URIs:
   `https://your-app.vercel.app/api/auth/callback/google`

---

### Part 2 — Render (Background Cron Worker)

The cron worker runs separately — it polls MongoDB every minute and fires due emails.

1. Go to render.com → New → **Background Worker**
2. Connect your GitHub repo
3. Set these:
   - **Build Command:** `npm install`
   - **Start Command:** `npx tsx workers/cronWorker.ts`
4. Add Environment Variables (same as Vercel, minus GOOGLE_* and NEXTAUTH_URL):

| Key | Value |
|-----|-------|
| `MONGODB_URI` | Same MongoDB URI as Vercel |
| `GEMINI_API_KEY` | Same Gemini key |
| `NEXTAUTH_SECRET` | Same secret as Vercel |

5. Click Deploy

Both services share the same MongoDB — Vercel writes automations/jobs, Render worker reads and fires them.

---

## Local Development

```bash
npm install
cp .env.local.example .env.local
# fill in .env.local

# Terminal 1
npm run dev

# Terminal 2
npm run worker
```

---

## How to get your keys

**MongoDB URI** — mongodb.com/atlas (free M0 cluster)

**Google OAuth:**
1. console.cloud.google.com → New Project
2. APIs & Services → Credentials → Create OAuth 2.0 Client ID
3. Authorized redirect URIs → add `https://your-vercel-url/api/auth/callback/google`

**NextAuth secret:**
```bash
openssl rand -base64 32
```

**Gemini API key** — aistudio.google.com → Get API key (free)

**Gmail App Password** (entered in the app UI, not .env):
1. myaccount.google.com → Security → 2-Step Verification → App Passwords
2. Generate → copy the 16-character password

---

## How it works

1. User logs in with Google
2. User connects Gmail via App Password
3. User creates an automation with a plain English instruction
4. Gemini parses it into a structured job (type, recipients, schedule, intent)
5. Job saved to MongoDB
6. Render worker polls every minute → drafts email with Gemini → sends via Gmail SMTP → marks sent
7. Recurring jobs auto-schedule their next run
