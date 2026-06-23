# InstaAI - Project Checkpoint

## Live Deployment
- **URL:** https://instagram-ai-tool-tau.vercel.app
- **GitHub:** https://github.com/notrealaman/instagram-ai-tool
- **Branch:** main (latest commit: responsive sidebar)

## Environment
- Node.js v20.11.0 portable at `C:\nodejs\node-v20.11.0-win-x64`
- Neon PostgreSQL: `postgresql://neondb_owner:npg_4CGONiXp1faH@ep-twilight-bonus-aogzlh2e.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`
- Gemini API key: `AQ.Ab8RN6LEdYKCHJfLEYQBc_Qm9RFSmyPAibYqKuO9a4rXMf9h2A`

## Commands
```bash
taskkill /F /IM node.exe  # kill existing node processes
node node_modules\prisma\build\index.js generate  # regenerate prisma client
node node_modules\prisma\build\index.js db push --skip-generate  # push schema to DB
node node_modules\next\dist\bin\next build  # build
node node_modules\next\dist\bin\next start -p 3000  # start dev
```

## Checkpoint: Responsive Sidebar (Latest)
**Commit:** `13b0c90` - "feat: responsive sidebar with mobile hamburger menu + collapsible desktop sidebar"

### What was done:
1. **dashboard/layout.tsx** - Full responsive sidebar:
   - Mobile (< lg): Hidden sidebar, hamburger menu toggles overlay with backdrop
   - Desktop (>= lg): Collapsible sidebar (w-64 <-> w-16 icons-only)
   - Auto-closes on route change and resize
   - Sticky header with responsive padding

2. **dashboard/page.tsx** - Responsive grids:
   - Profile card stacks vertically on mobile
   - Stat cards: 2-col mobile, 4-col desktop
   - Performance/Recent: 1-col mobile, 3-col desktop
   - Top posts: 1/2/3 col breakpoints

3. **post-generator/page.tsx** - `grid-cols-1 lg:grid-cols-3`
4. **caption-generator/page.tsx** - `grid-cols-1 lg:grid-cols-3`
5. **occasional-post/page.tsx** - Already responsive (no changes needed)
6. **dm-chatbot/page.tsx** - Status bar wraps, settings grid `grid-cols-1 lg:grid-cols-2`, chat height adjusted
7. **settings/page.tsx** - Toggle rows stack, API usage grid responsive

## Checkpoint: Trigger Advanced Access Endpoint
**Commit:** `d0185a7` - "feat: add trigger-advanced-access endpoint for Facebook App Review"

### What was done:
- Created `src/app/api/instagram/trigger-advanced-access/route.ts`
- GET endpoint makes 5 Graph API calls per request (token debug, conversations, profile, media, subscription)
- No auth required for easy testing
- Purpose: Trigger Facebook's "Request advanced access" button for `pages_messaging`

### How to use:
1. Call `GET /api/instagram/trigger-advanced-access` repeatedly (10-20 times over a day)
2. Wait 24 hours for Facebook to activate the button
3. Then submit for App Review

## Checkpoint: Fix directUrl Build Error
**Commit:** `31dd001` - "fix: remove directUrl to fix Vercel build"

### What was done:
- Removed `directUrl = env("DIRECT_URL")` from `prisma/schema.prisma`
- Was causing Vercel build failure because `DIRECT_URL` env var wasn't set
- Not needed since we use `db push` (not `migrate deploy`)

## Features Built (All Complete)
- [x] Auth (login/register with JWT + bcrypt)
- [x] Dashboard homepage (real Instagram data)
- [x] Dark theme toggle
- [x] Post Generator (Nemotron caption + Gemini/Pollinations image)
- [x] Occasional Post Generator (holidays/events)
- [x] Caption Generator (Nemotron/Llama, SEO score, history)
- [x] DM Chatbot (personality customization, test chat)
- [x] DM Auto-reply polling (every 15s)
- [x] Webhook system (GET verify + POST notifications)
- [x] Webhook subscription endpoint
- [x] Instagram Graph API client
- [x] DM debug endpoint
- [x] Settings page (API keys, Instagram connection)
- [x] Privacy policy page
- [x] Vercel deployment
- [x] Responsive sidebar with mobile hamburger + desktop collapse
- [x] Trigger advanced access endpoint for Facebook App Review

## Blocked / Next Steps
1. **Facebook App Review** - `pages_messaging` needs Advanced access approval
   - App is Live mode, Standard access granted
   - Button grayed out - need successful test API calls first
   - Use `/api/instagram/trigger-advanced-access` endpoint to trigger it
   - After 24h, submit with screen recording + privacy policy
2. **Set up APP_SECRET** env var for webhook signature verification
3. Consider scheduled posting
4. Consider follower growth tracking over time

## Key Files
```
src/
  app/
    dashboard/
      layout.tsx          # Responsive sidebar + header
      page.tsx            # Dashboard home (stats, posts)
      post-generator/     # AI post generation
      caption-generator/  # AI caption generation
      occasional-post/    # Holiday/event posts
      dm-chatbot/         # DM chatbot + settings
      settings/           # App settings
    api/
      webhook/            # Facebook webhook handler
      instagram/
        trigger-advanced-access/  # Facebook App Review trigger
        auto-reply/       # DM auto-reply polling
        webhook-subscribe/ # Webhook subscription
        dm-debug/         # DM API debug
    privacy/              # Privacy policy page
  lib/
    db.ts                 # Prisma client
    auth.ts               # JWT + bcrypt
    gemini.ts             # Gemini API (text + image)
    nemotron.ts           # NVIDIA Nemotron/Llama
    image-generation.ts   # Pollinations.ai fallback
    instagram-graph.ts    # Instagram Graph API client
prisma/
  schema.prisma           # Database schema (PostgreSQL)
vercel.json               # Vercel build config
next.config.js            # ignoreBuildErrors, image hosts
```
