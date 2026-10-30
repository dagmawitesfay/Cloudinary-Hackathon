Read CLAUDE.md first, and use the installed Cloudinary skills for any Cloudinary code. We're building the full app
described in CLAUDE.md, in the phases below.

Rules for the whole build:
- Do one phase at a time, on its own branch.
- At the end of each phase: run `npm run build` and `npm run lint`, commit, then STOP
  and give me a short summary (what you built, how to test it, anything I need to do
  in a dashboard). Wait for me to say "next" before starting the next phase.
- If something needs me (API keys, enabling a Cloudinary add-on, creating the
  Supabase project), tell me the exact steps and wait.

## Phase 0 — Audit and plan (no code yet)
Inspect the repo: confirm the create-cloudinary-react scaffold is at the root, check
package.json, .gitignore (must include .env), .env.example, and which skills are
installed. Then write PLAN.md with: the file/folder structure you'll create, the
Supabase SQL schema with RLS policies, the `/api` functions you'll build, and the
risks (especially OCR/captioning add-on availability and fallbacks). Stop for my review.

## Phase 1 — Foundation
Tailwind, React Router with pages (Home/browse, Submit, Listing detail, Moderator
login, Moderator queue), a shared layout, `src/lib/cloudinary.ts` with the
transformation builders, `src/lib/supabase.ts`, Vercel config for `/api`, and an
updated `.env.example`. Add the Supabase migration SQL file.

## Phase 2 — Upload and AI prefill (the core feature)
Upload Widget with our unsigned preset (image formats only, ~10 MB max). After upload,
call `/api/analyze` with the public_id. That function uses the Cloudinary API secret to
run OCR and AI captioning, then returns suggested title, date, location, contact,
alt text, and raw OCR text. Parse the OCR text sensibly. If an add-on fails or isn't
enabled, return what we have and let the user fill in the rest manually.

## Phase 3 — Submit flow
Pre-filled, editable listing form with validation. Show the delivered image preview.
Insert into Supabase as `pending`. Clear success message ("your listing will appear
once it's reviewed").

## Phase 4 — Browse and search
Home page grid of approved listings: cards using the card transformation (`f_auto`,
`q_auto`, `g_auto` crop to a consistent aspect ratio, generative fill fallback for
odd-shaped flyers), search by text, filter by category and date. Listing detail page.
Responsive images and lazy loading.

## Phase 5 — Moderation
Supabase Auth email login for moderators, protected queue page, approve or reject
pending listings. Verify the RLS policies actually block non-moderators.

## Phase 6 — Share card
For each listing, build a share image using Cloudinary text and image overlays
(title, date, location on the flyer image) with a "Share" and "Download" button.

## Phase 7 — Production polish
Loading, empty, and error states everywhere; accessibility pass; a few key tests;
README with pitch, live link placeholder, setup, env vars, and the
"How we use Cloudinary" table; deploy checklist for Vercel. Confirm no secrets
appear in the built `dist/` folder.

Start with Phase 0 now.