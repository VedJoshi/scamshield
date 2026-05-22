# Handoff - ScamShield MVP v2 - 2026-05-22

## Current State

Branch: `main`

Supabase is active locally. The database migration has been applied and `GET /api/cases` returns:

```json
{"cases":[],"storage":"supabase"}
```

The only required runtime secret still missing locally is `OPENAI_API_KEY`.

## Completed In This Session

- Hardened F9/F10 upload flows:
  - image/audio requests use `AbortController`
  - object URLs are cleaned up for image previews and audio metadata reads
  - upload callbacks no longer re-fire on parent renders
  - image/audio client-side size and type checks added
  - audio route now passes the incoming `File` directly to OpenAI Whisper
- Added shared in-memory rate limiting:
  - `/api/analyze`
  - `/api/analyze-image`
  - `/api/analyze-audio`
  - `/api/v1/check`
- Implemented F11 Smart Drop Zone:
  - drag image/audio near the form
  - auto-routes to Screenshot or Voice Note mode
  - starts the existing upload analysis flow
- Implemented F12 VoiceShield live-mode demo simulation:
  - `VoiceShieldPreview` embedded in the VoiceShield agent card
  - clearly labeled as a simulation
- Implemented Supabase-backed persistence and dashboard:
  - `/api/cases` server route for case load/save
  - HTTP-only session cookie for browser-scoped case ownership
  - `/dashboard` FraudRadar aggregate stats page
  - `supabase/migrations/20260522000000_create_cases.sql`
- Added dashboard nav links.
- Updated docs.

## Supabase Notes

The app uses a server-side boundary. Browser code does not use Supabase directly.

Runtime env needed:

```env
SUPABASE_URL=https://ijebpkdxucjfgxqcysti.supabase.co
SUPABASE_SECRET_KEY=...
OPENAI_API_KEY=...
```

Migration-only env:

```env
SUPABASE_DB_URL=postgresql://postgres.ijebpkdxucjfgxqcysti:...@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres
```

The working DB pooler was `aws-1-ap-southeast-1.pooler.supabase.com:6543`.

## Verification

Passed:

```bash
npm run typecheck
npm run build
```

Dev server was running at:

```text
http://127.0.0.1:3000
```

## Remaining Work

1. Add `OPENAI_API_KEY` locally and in Vercel.
2. Manually QA:
   - text/link analysis
   - QR upload
   - image upload
   - audio upload
   - save case
   - `/history`
   - `/dashboard`
3. Add Vercel env vars:
   - `SUPABASE_URL`
   - `SUPABASE_SECRET_KEY`
   - `OPENAI_API_KEY`
4. Deploy and test production.
5. Optional: review `npm audit` findings.

## Security

- Do not commit `.env.local`.
- Keep `SUPABASE_SECRET_KEY` and `SUPABASE_DB_URL` server-only.
- Rotate the Supabase secret before a public demo if it may have been exposed outside local env.
