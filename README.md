# hp-stories

Unlisted story pages Happy Productions builds for clients, embedded on happyproductions.me. Not indexed.

## Client portals (portal.happyproductions.video/<slug>)

One portal page for every client, password protected, filled live from Airtable. **The team edits content in Airtable, not here.**

- Airtable base **Agency Agent** (never Happy Productions Main Base):
  - **Portals**: one row per client (slug, passcode, logo, brand colors and fonts, welcome text, next step). The `_template` row holds the defaults new portals start from.
  - **Portal Briefs**: production briefs. Duplicate a row to copy a brief; the `TEMPLATE: Production brief` row is the starting point. Only `Shared` and `Approved` briefs show.
  - **Portal Videos**: one row per video (per Edit Key, never one per version). New version = update Watch link + Version on the same row and set Status back to `Ready for review`.
  - **Portal Activity**: every client action (requests, approvals, change requests, brief notes). Change requests and video requests also land in **Video Requests**.
  - The Impact Report reads **Post Ledger** (`Report client name` must match its Client value).
- Code: `functions/api/portal/*` (server, Cloudflare Pages Functions) and `onboarding/portal-app/` (the page). `functions/_middleware.js` sends portal.happyproductions.video to the portal app; every other host is untouched.
- Onboarding creates the portal the moment the intake form is sent (`/api/portal/create`), shows the address and passcode on the last step, and moves the client into their portal right after they book the kickoff call on Calendly.
- Health check: `/api/portal/health`.
