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
