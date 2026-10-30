# Community Flyer Directory

Snap a flyer, and it becomes a listing anyone in the community can find.

See `PLAN.md` for the build plan and `CLAUDE.md` for project context.

## Setup

```bash
npm install
cp .env.example .env   # fill in values
npm run dev
```

Run `supabase/migrations/0001_listings.sql` in the Supabase SQL editor.
`/api` functions need `vercel dev` to run locally.

## How we use Cloudinary

| Feature | Cloudinary capability | File |
|---|---|---|
| Flyer photo upload | Upload Widget with an unsigned preset (image formats, 10 MB client limit) | `src/cloudinary/UploadWidget.tsx` |
| Pre-fill title, date, location, contact | OCR Text Detection add-on (`ocr=adv_ocr`) via the Admin API update method | `api/analyze.ts`, `api/_lib/parseFlyer.ts` |
| Suggested alt text | AI Content Analysis add-on, captioning (`detection=captioning`) | `api/analyze.ts` |
| Upload preview | `c_limit` + `f_auto` + `q_auto` delivery | `src/lib/cloudinary.ts` (`previewImage`) |
| Listing card | `c_fill,g_auto` to a 3:4 box, or `c_pad,b_gen_fill` (generative fill) for odd-shaped flyers; `f_auto,q_auto`; `srcset` at 320/480/768 w, lazy-loaded (named transformation candidate: `card`) | `src/lib/cloudinary.ts` (`cardImage`, `cardImageSet`), `src/components/ListingCard.tsx` |
| Listing detail hero | `c_limit` (whole flyer, never cropped) + `f_auto,q_auto`; `srcset` at 600/900/1200 w (named transformation candidate: `hero`) | `src/lib/cloudinary.ts` (`heroImage`, `heroImageSet`), `src/pages/ListingPage.tsx` |
