# CLAUDE.md — Project context for Claude Code

## What we're building

A **community resource directory** where anyone can photograph a paper flyer (clinic,
food drive, ESL class, church or community event) and Cloudinary turns it into a clean,
accessible, searchable listing.

Pitch: "Snap a flyer, and it becomes a listing anyone in the community can find."

Users:
- **Visitors**: browse, search, filter, and share approved listings (no login)
- **Contributors**: upload a flyer photo and submit a listing (no login)
- **Moderators**: log in, approve or reject pending listings

## Core user flow (must work end to end, with real data)

1. Contributor uploads a flyer photo (Cloudinary Upload Widget, unsigned preset).
2. A serverless function analyzes the upload with Cloudinary:
   - **OCR** to read the flyer text and pre-fill title, date/time, address, contact
   - **AI captioning** to generate alt text
3. Contributor reviews and edits the pre-filled form, then submits. Listing is saved as `pending`.
4. Moderator approves it and it appears publicly.
5. Visitors browse and search listing cards. Images are delivered via Cloudinary transformations.
6. Each listing has a shareable social card (text overlay on the image).

## Stack

- Scaffolded with `create-cloudinary-react`: React 19, Vite, TypeScript (strict), ESLint
- `@cloudinary/react` + `@cloudinary/url-gen` for delivery. **Never** use the deprecated `cloudinary-react` package.
- Tailwind CSS for styling
- **Supabase** (Postgres + Auth) for listings and moderator login
- **Vercel** for hosting, with serverless functions in `/api` for anything that needs the Cloudinary API secret
- React Router for pages

## Environment variables

Client (`VITE_` prefix, safe to expose):
- `VITE_CLOUDINARY_CLOUD_NAME`
- `VITE_CLOUDINARY_UPLOAD_PRESET`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Server only (Vercel functions, never `VITE_`):
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`

Keep `.env.example` in sync whenever a variable is added. Never commit `.env`.

## Cloudinary rules

- Use the installed Cloudinary skills (`cloudinary-docs`, `cloudinary-react`,
  `cloudinary-transformations`) and `.claude/skills/cloudinary-hackathon/SKILL.md`.
  Check docs before using any API, add-on, or transformation you're unsure about.
- The API secret is only used inside `/api` functions.
- Every delivered image uses `f_auto` + `q_auto`, with `g_auto` for crops.
- Repeated looks (card, detail hero, share card) are built in one place
  (`src/lib/cloudinary.ts`) and documented as candidates for named transformations.
- Store `public_id` in the database, never full URLs.
- OCR and AI captioning are add-ons that may need enabling in the Cloudinary console.
  **Build graceful fallbacks**: if an add-on isn't available or fails, the form still
  works with manual entry and a manual alt-text field. Never block a submission on AI.

## Data model (starting point)

`listings`: id, created_at, status (`pending` | `approved` | `rejected`), title,
description, category, event_date, location_text, contact, image_public_id,
image_alt, ocr_raw_text, tags (text[]).

Row Level Security: anyone can insert with status `pending` and read `approved`;
only authenticated moderators can read pending rows and update status.

## Design
All UI follows `DESIGN.md` (dark theme, coral accent `#ff6b35`, Bebas Neue + Inter,
grain overlay, bordered cards). Read it before building or changing any page or
component, and use the design tokens instead of hard-coded colors.

## Working rules

- Work in the phase order from the kickoff prompt. Stop at the end of each phase and summarize.
- One feature branch per phase (`feat/<name>`), small focused commits, conventional
  commit messages (`feat:`, `fix:`, `chore:`). Don't push or merge without asking.
- After every change: `npm run build` and `npm run lint` must pass.
- Every async UI has loading, empty, and error states. Mobile-first and keyboard accessible.
- Prefer the simplest thing that works. Mark extras as stretch instead of building them.
- When a Cloudinary feature is added, also add a row to the README's
  "How we use Cloudinary" table (feature, Cloudinary capability, file).
- Ask me before installing large dependencies, changing the stack, or touching
  anything in the Cloudinary or Supabase dashboards.