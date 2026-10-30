# PLAN.md — Community Flyer Directory

"Snap a flyer, and it becomes a listing anyone in the community can find."

This is the build plan for the app described in `CLAUDE.md`. It covers the audit results, the target structure, the database schema, the serverless API, and the risks.

---

## 1. Audit findings (Phase 0)

| Check | Result | Action |
|---|---|---|
| Scaffold at repo root | **No.** The `create-cloudinary-react` scaffold is in `cloudinary-hackathon/`. The root has only `README.md`, an empty `package-lock.json`, and the untracked agent files. | Phase 1, first commit: `git mv` the scaffold contents to the root, delete the empty root `package-lock.json`, and merge the two READMEs. |
| `package.json` | React 19.2, Vite 6, TS 5.9 (strict), ESLint 9 flat config, `@cloudinary/react` 1.14, `@cloudinary/url-gen` 1.22. Scripts `build` (`tsc -b && vite build`) and `lint` are present. The deprecated `cloudinary-react` package is not used. | Keep as is. |
| `.gitignore` | Only `cloudinary-hackathon/.gitignore` exists. It ignores `.env`, `.env.local`, `.env.production`, `dist`, `node_modules`. `.env` is confirmed ignored and was never committed. | Moves to the root with the scaffold. Add `.vercel` and `.env*.local`. |
| `.env.example` | **Missing.** `cloudinary-hackathon/.env` exists with `VITE_CLOUDINARY_CLOUD_NAME` and `VITE_CLOUDINARY_UPLOAD_PRESET`. | Create in Phase 1 with all 7 variables from `CLAUDE.md`. |
| Skills | `cloudinary-docs`, `cloudinary-react`, `cloudinary-transformations` are installed in `.agents/skills/` and symlinked into `.claude/skills/`. | — |
| `.claude/skills/cloudinary-hackathon/SKILL.md` | **Missing**, though `CLAUDE.md` references it. | Needs your input: add it, or I'll drop the reference from `CLAUDE.md`. |
| Scaffold code | `src/cloudinary/config.ts` (the `cld` instance), `src/cloudinary/UploadWidget.tsx` (loads the widget script and opens it), demo `App.tsx`/`App.css`. `.cursor/mcp.json` points to Cloudinary MCP servers. | Reuse `UploadWidget.tsx` (extend its options). Replace the demo `App`. |
| Untracked files | `.agents/`, `.claude/`, `CLAUDE.md`, `KICK_OFF_PROMPT.md`, `skills-lock.json` | Commit them with the Phase 1 restructure so the project context travels with the repo (your call). |

---

## 2. Target file and folder structure

```
/
├── api/                          # Vercel serverless functions (Node runtime, server secrets only)
│   ├── analyze.ts                # POST: OCR + captioning for an uploaded public_id
│   └── _lib/
│       ├── cloudinaryAdmin.ts    # Signed Admin API calls via fetch (Basic auth with key:secret)
│       └── parseFlyer.ts         # OCR text → {title, date, location, contact} heuristics
├── supabase/
│   └── migrations/
│       └── 0001_listings.sql     # Table, enums, indexes, RLS, moderators
├── src/
│   ├── main.tsx                  # Router provider
│   ├── router.tsx                # Route table
│   ├── index.css                 # Tailwind entry
│   ├── components/
│   │   ├── Layout.tsx            # Header/nav, skip link, <main>, footer
│   │   ├── ListingCard.tsx
│   │   ├── ListingForm.tsx
│   │   ├── SearchFilters.tsx
│   │   ├── ShareCard.tsx
│   │   ├── RequireModerator.tsx  # Route guard
│   │   └── states/               # Spinner, EmptyState, ErrorState (shared)
│   ├── cloudinary/
│   │   ├── config.ts             # (scaffold) cld instance
│   │   └── UploadWidget.tsx      # (scaffold) extended: formats, max size, folder
│   ├── lib/
│   │   ├── cloudinary.ts         # ALL transformation builders: card, hero, share, preview
│   │   ├── supabase.ts           # Typed client (anon key)
│   │   ├── listings.ts           # Query/insert/update helpers
│   │   ├── categories.ts         # Category list (shared by form + filters)
│   │   └── types.ts              # Listing, AnalyzeResponse, etc.
│   ├── hooks/
│   │   └── useSession.ts         # Supabase auth session
│   └── pages/
│       ├── HomePage.tsx          # /            browse + search + filter
│       ├── SubmitPage.tsx        # /submit      upload → prefill → form → success
│       ├── ListingPage.tsx       # /listing/:id detail + share
│       ├── LoginPage.tsx         # /mod/login
│       ├── ModQueuePage.tsx      # /mod         protected queue
│       └── NotFoundPage.tsx
├── tsconfig.api.json             # Type-checks /api (Node types) as part of `tsc -b`
├── vercel.json                   # SPA rewrite (non-/api → index.html)
├── .env.example
├── PLAN.md
└── README.md                     # Pitch, setup, env vars, "How we use Cloudinary" table
```

### Dependencies (need your OK before installing)

| Package | Why | Size |
|---|---|---|
| `tailwindcss` + `@tailwindcss/vite` | Styling (v4, Vite plugin, no PostCSS config) | dev, small |
| `react-router` (v7) | Pages | ~small |
| `@supabase/supabase-js` | DB + Auth | moderate |
| `vitest` (+ `@testing-library/react`, `jsdom`) | Phase 7 tests | dev, moderate |

I'm leaving out the `cloudinary` Node SDK on purpose. `/api/analyze` makes one Admin API call, and plain `fetch` with Basic auth handles that with no extra dependency. I'm also leaving out `@vercel/node`: functions use the standard `Request`/`Response` signature (`export async function POST(req: Request)`).

### Routes

| Path | Page | Access |
|---|---|---|
| `/` | Browse/search approved listings | public |
| `/submit` | Upload + form | public |
| `/listing/:id` | Detail + share card | public (approved only, enforced by RLS) |
| `/mod/login` | Email/password login | public |
| `/mod` | Pending queue, approve/reject | moderators |

---

## 3. Cloudinary design

### Upload preset (you create it in the console; unsigned)
- Signing mode: **Unsigned**
- Asset folder: `community-hackathon` (used as the public ID prefix)
- Allowed formats: `jpg, jpeg, png, webp, heic`
- Max file size: enforced client-side by the widget (`maxFileSize: 10_000_000`) and with an incoming transformation `c_limit,w_2500,h_2500` so oversized photos are scaled down before storage
- Unique filename: on; overwrite: off

### Transformation builders (`src/lib/cloudinary.ts`)
All builders use `f_auto` and `q_auto`. Each one is a candidate for a named transformation (documented in the README).

| Builder | Transformation | Notes |
|---|---|---|
| `cardImage(id, w, h)` | `c_pad,ar_3:4,b_gen_fill,w_<n>` **or** `c_fill,g_auto,ar_3:4,w_<n>` | Flyers are text, and cropping cuts text, so padding is the default. Generative fill runs only when the flyer's aspect ratio is far from 3:4 (based on stored width/height). Otherwise it uses `g_auto` fill. See risk R4 for cost. |
| `heroImage(id)` | `c_limit,w_1200` + responsive `w_` steps | Detail page shows the whole flyer; nothing is cropped |
| `previewImage(id)` | `c_limit,w_600` | Submit-page preview |
| `shareCard(listing)` | `c_fill,g_auto,w_1200,h_630` + dark gradient/`co_black,o_60` block + `l_text` overlays for title, date, location | Phase 6. Text is URL-encoded and length-capped |

Responsive images use `srcset` widths of 320/480/768/1024, plus `loading="lazy"` on cards.

### Analyze flow
1. The widget returns `public_id`, `width`, `height` to the client.
2. The client sends `POST /api/analyze { publicId }`.
3. The function validates that `publicId` starts with `community-hackathon/` and matches `^[\w\-/]+$`.
4. It makes **one** Admin API update call:
   `POST https://api.cloudinary.com/v1_1/<cloud>/resources/image/upload/<public_id>` with `ocr=adv_ocr&detection=captioning`.
5. It reads `info.ocr.adv_ocr.data[0].textAnnotations[0].description` (full text) and `info.detection.captioning.data.caption`.
   - If the combined call fails because one add-on isn't enabled, it retries each add-on **separately**, so a working add-on still returns data.
6. It runs `parseFlyer(text)`, which returns:
   ```ts
   { title?, eventDate?, location?, contact?, altText?, ocrText?,
     status: { ocr: 'ok' | 'unavailable' | 'error', caption: 'ok' | 'unavailable' | 'error' } }
   ```
   It always responds `200` with whatever it found. Only a bad request or missing env gets a `4xx`/`5xx`.
7. The client pre-fills the fields it got. Missing fields stay empty for manual entry, and a short note says "We couldn't read the flyer automatically. Please fill in the details."

### `parseFlyer` heuristics
- **Title**: the first line with 3–80 characters that isn't a date, phone, URL, or address. Prefer the longest line among the first 3.
- **Date/time**: regexes for `Mon DD`, `Month DD, YYYY`, `MM/DD(/YY)`, weekday names, `H(:MM) am/pm`, and ranges. The result is an ISO string in local time for a `datetime-local` input, and the year is inferred as the next occurrence. No date library (a stretch option is `chrono-node` if regexes prove too weak).
- **Location**: a line with a street number plus a suffix (`St, Ave, Rd, Blvd, Dr, Ln, Way…`), or a line after "Where:"/"Location:".
- **Contact**: the first phone (`(xxx) xxx-xxxx` variants), email, or URL.
- Unit tests in Phase 7 run against 3–4 sample OCR strings.

---

## 4. Supabase schema and RLS (`supabase/migrations/0001_listings.sql`)

```sql
-- Enums
create type listing_status as enum ('pending', 'approved', 'rejected');

-- Listings
create table public.listings (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  status           listing_status not null default 'pending',
  title            text not null check (char_length(title) between 3 and 120),
  description      text check (char_length(description) <= 2000),
  category         text not null check (category in
                     ('health','food','education','faith','community','family','jobs','other')),
  event_date       timestamptz,
  location_text    text check (char_length(location_text) <= 300),
  contact          text check (char_length(contact) <= 200),
  image_public_id  text not null check (image_public_id ~ '^community-hackathon/[A-Za-z0-9_\-/]+$'),
  image_width      int,
  image_height     int,
  image_alt        text not null check (char_length(image_alt) between 5 and 300),
  ocr_raw_text     text check (char_length(ocr_raw_text) <= 10000),
  tags             text[] not null default '{}',
  reviewed_at      timestamptz,
  reviewed_by      uuid references auth.users(id),
  -- full-text search column
  search tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(description,'') || ' ' || coalesce(location_text,'')), 'B') ||
    setweight(to_tsvector('english', array_to_string(tags, ' ')), 'C')
  ) stored
);

create index listings_status_date_idx on public.listings (status, event_date);
create index listings_search_idx on public.listings using gin (search);

-- Moderators: an explicit allow-list (any signed-in user is NOT a moderator by default)
create table public.moderators (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.moderators enable row level security;
-- no policies → not readable/writable through the API; managed in the SQL editor only

create or replace function public.is_moderator()
returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.moderators where user_id = auth.uid()) $$;

-- RLS
alter table public.listings enable row level security;

-- Anyone (anon or authenticated) can submit, but only as pending and unreviewed
create policy "anyone can submit pending"
  on public.listings for insert
  to anon, authenticated
  with check (status = 'pending' and reviewed_at is null and reviewed_by is null);

-- Anyone can read approved listings
create policy "public reads approved"
  on public.listings for select
  to anon, authenticated
  using (status = 'approved');

-- Moderators can read everything
create policy "moderators read all"
  on public.listings for select
  to authenticated
  using (public.is_moderator());

-- Moderators can update (approve/reject/edit)
create policy "moderators update"
  on public.listings for update
  to authenticated
  using (public.is_moderator())
  with check (public.is_moderator());

-- Column privileges: anon can only insert user-supplied columns
revoke insert on public.listings from anon, authenticated;
grant insert (title, description, category, event_date, location_text, contact,
              image_public_id, image_width, image_height, image_alt, ocr_raw_text, tags)
  on public.listings to anon, authenticated;
```

Notes:
- The client inserts **without** `.select()`. Anon can't read pending rows, so `insert().select()` would fail under RLS.
- There is no delete policy. Rejection is a status change, which keeps an audit trail.
- Phase 5 verification is a script/checklist that confirms, using the anon key: (a) a select returns no pending rows, (b) an update fails, (c) inserting `status='approved'` fails, (d) a signed-in non-moderator still can't read pending rows.
- `SUPABASE_SERVICE_ROLE_KEY` isn't needed by any planned function. It stays in `.env.example` per `CLAUDE.md` for a possible stretch function, and it is never used in the client.

---

## 5. `/api` functions

| Function | Method | Input | Output | Secrets |
|---|---|---|---|---|
| `api/analyze.ts` | POST | `{ publicId: string }` | `AnalyzeResponse` (above) | `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, cloud name |

That's the only one. Delivery URLs, uploads (unsigned), and DB access (anon + RLS) all happen client-side.

Cloud name on the server: it reads `CLOUDINARY_CLOUD_NAME`, falling back to `VITE_CLOUDINARY_CLOUD_NAME`, because Vercel exposes all env vars to functions. No new variable is needed.

Local dev: `vercel dev` runs both Vite and `/api`. Plain `npm run dev` runs the frontend only, and analyze gracefully reports "unavailable", which exercises the fallback path.

**Stretch (not planned):** a Cloudinary webhook, or a moderator "delete image" function that uses the Admin API to remove rejected flyers.

---

## 6. Risks and mitigations

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| R1 | **OCR add-on (`adv_ocr`) isn't enabled** or the free quota runs out. It's a separate add-on with a small free tier. | No prefill | The analyze call returns `status.ocr = 'unavailable'` and the form works fully by hand. Per-add-on retry (§3 step 5). The UI never blocks. |
| R2 | **AI Content Analysis (captioning) isn't enabled.** It's also a separate add-on. | No alt text suggestion | A required manual alt-text field with helper text and an example. Submit is never blocked on AI. |
| R3 | OCR quality on angled or low-light phone photos | Bad prefill | Every field stays editable. Raw OCR text is shown in a collapsible "What we read" panel so users can copy from it. Stretch: try `adv_ocr:document`. |
| R4 | **Generative fill cost.** `b_gen_fill` is about 50 transformation credits per derived image, multiplied by each `srcset` width. | Credit burn | Use gen fill only for odd aspect ratios, with a small fixed set of widths. A cheap fallback (`c_pad,b_auto` or `b_white`) sits behind one constant in `cloudinary.ts` so it's a one-line switch. |
| R5 | `/api/analyze` abuse: anyone can call it with any public_id and burn add-on quota | Cost | Only `community-hackathon/` public_ids are accepted, with strict regex validation. The Admin API also returns 404 for assets that don't exist. Stretch: a rate limit, or check that `created_at` is less than an hour old. |
| R6 | Unsigned preset abuse (spam uploads) | Storage | Format and size limits on the preset. Moderators gate visibility. Stretch: enable Cloudinary moderation on the preset. |
| R7 | RLS mistakes expose pending rows or let anon approve | Integrity | A moderators allow-list (not "any authenticated user"), column grants, and an explicit verification step in Phase 5. Also **disable public sign-ups** in Supabase Auth. |
| R8 | Share-card text overlay breaks on special characters (`,` `/` `%` emoji) | Broken image | Escape through the url-gen `text()` source (double-encode `,` and `/`), cap lengths, strip emoji. Fall back to the plain hero image if the URL gets too long. |
| R9 | Scaffold not at root / Vercel root mismatch | Deploy fails | Restructure in Phase 1 so Vercel's root is the repo root. |
| R10 | `vercel dev` needs the Vercel CLI and a linked project | Local analyze untestable | Document it. You may already have the CLI. Otherwise analyze can be tested on a preview deploy. |

---

## 7. Phase checklist

| Phase | Branch | Deliverables | Needs you |
|---|---|---|---|
| 0 | `feat/plan` | This file | Review |
| 1 | `feat/foundation` | Restructure to root, Tailwind, router + 5 pages + layout, `lib/cloudinary.ts`, `lib/supabase.ts`, `vercel.json`, `tsconfig.api.json`, `.env.example`, migration SQL | Approve deps. Create the Supabase project, run the migration, and paste the URL + anon key into `.env` |
| 2 | `feat/upload-analyze` | Widget config, `/api/analyze`, `parseFlyer` | Create the unsigned preset. Enable the OCR + AI Content Analysis add-ons. Put the API key + secret in `.env` / Vercel |
| 3 | `feat/submit` | Form, validation, preview, insert, success | — |
| 4 | `feat/browse` | Grid, search (FTS), category/date filters, detail page, responsive + lazy | — |
| 5 | `feat/moderation` | Login, guard, queue, approve/reject, RLS verification | Create a moderator user, insert its id into `moderators`, disable sign-ups |
| 6 | `feat/share-card` | Share image builder, Web Share API + copy-link fallback, download | — |
| 7 | `feat/polish` | States audit, a11y pass, vitest tests, README + Cloudinary table, deploy checklist, `dist/` secret scan | Create the Vercel project and set env vars |
