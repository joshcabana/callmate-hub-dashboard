

# CallMate AI — Road to 100% Completion

## Current State Summary

The frontend is solid: landing page, auth flow, dashboard with live feed, call logs with search/filter/pagination, agent settings, and billing page all work. Code splitting is done. The app runs in **demo mode** (no Supabase connected). It is **not yet published**.

## Priority Plan (ordered by impact)

### Phase 1: Connect Real Backend (Critical)

**1. Connect Supabase to Lovable Cloud**
- Enable Lovable Cloud (Database + Auth) so the app stops running in demo mode
- Run the SQL migrations (`01_schema.sql`, `02_rls.sql`, `03_idempotency.sql`, `04_stripe.sql`) against the live database
- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as project secrets

**2. Enable Authentication**
- Enable email/password sign-up in Supabase Auth settings
- Add a **Sign Up** flow to the Login page (currently only sign-in exists)
- Test the full auth cycle: sign up, onboarding (create business), redirect to `/app`

**3. Wire Agent Settings to persist**
- Agent settings (prompt, voice, temperature) are not stored in the DB schema — add columns to `businesses` or a new `agent_configs` table
- Update `AgentSettings.tsx` to read/write from the real table instead of local state

### Phase 2: Production Integrations

**4. Deploy the webhook server**
- The Express server in `server/` handles Vapi webhooks and Twilio SMS — it needs to be deployed separately (Railway, Fly.io, or similar)
- Set env vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `BUSINESS_ID`, `VAPI_WEBHOOK_SECRET`, Twilio credentials
- Provide a runbook for the user to deploy this

**5. Connect Stripe for billing**
- The `api/stripe/checkout.ts` endpoint exists but needs Stripe keys configured
- Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` as secrets
- Test the checkout flow end-to-end

### Phase 3: Polish & Ship

**6. Add Sign Up page**
- Currently the Login page only has email/password sign-in
- Add a "Create Account" tab or link with `supabase.auth.signUp()`

**7. Mobile responsiveness pass**
- Verify all pages render correctly at 375px and 768px widths
- Fix any overflow or layout issues in the sidebar, tables, and charts

**8. Error & empty states**
- Add proper empty states for Call Logs when no data exists (not demo)
- Add error boundaries for failed queries
- Show meaningful messages when Supabase queries fail

**9. Publish the app**
- Set visibility to public and publish via Lovable
- Connect a custom domain if desired

### Phase 4: Nice-to-Haves

- Export call logs to CSV
- Dark/light theme toggle (currently dark only)
- Notification preferences in settings
- Real Supabase Realtime subscription for the live feed (replace simulated data)

---

## What I Cannot Do Without You

| Item | What you need to do |
|---|---|
| Supabase setup | Enable Lovable Cloud or connect an external Supabase project |
| Webhook server deploy | Deploy `server/` to Railway/Fly.io with env vars |
| Stripe keys | Create a Stripe account and add keys as secrets |
| Vapi config | Set up your Vapi assistant and point its webhook URL to your deployed server |
| Custom domain | Configure DNS after publishing |

---

## Recommended Next Step

Start with **Phase 1** — connect Supabase and add sign-up. This unlocks real data flow and makes everything else testable. I can implement steps 2, 3, 6, 7, and 8 directly. Steps 1, 4, and 5 require your input on which services to use.

