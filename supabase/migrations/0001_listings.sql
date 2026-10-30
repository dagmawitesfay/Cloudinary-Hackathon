-- Community Flyer Directory: listings, moderators, and Row Level Security.
-- Run in the Supabase SQL editor (or `supabase db push`).

create type listing_status as enum ('pending', 'approved', 'rejected');

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
  image_public_id  text not null check (image_public_id ~ '^flyers/[A-Za-z0-9_\-/]+$'),
  image_width      int,
  image_height     int,
  image_alt        text not null check (char_length(image_alt) between 5 and 300),
  ocr_raw_text     text check (char_length(ocr_raw_text) <= 10000),
  tags             text[] not null default '{}',
  reviewed_at      timestamptz,
  reviewed_by      uuid references auth.users(id),
  search tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '') || ' ' || coalesce(location_text, '')), 'B') ||
    setweight(to_tsvector('english', array_to_string(tags, ' ')), 'C')
  ) stored
);

create index listings_status_date_idx on public.listings (status, event_date);
create index listings_search_idx on public.listings using gin (search);

-- Moderators are an explicit allow-list: being signed in is NOT enough.
create table public.moderators (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.moderators enable row level security;
-- No policies on purpose: managed only from the SQL editor.

create or replace function public.is_moderator()
returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.moderators where user_id = auth.uid()) $$;

alter table public.listings enable row level security;

create policy "anyone can submit pending"
  on public.listings for insert
  to anon, authenticated
  with check (status = 'pending' and reviewed_at is null and reviewed_by is null);

create policy "public reads approved"
  on public.listings for select
  to anon, authenticated
  using (status = 'approved');

create policy "moderators read all"
  on public.listings for select
  to authenticated
  using (public.is_moderator());

create policy "moderators update"
  on public.listings for update
  to authenticated
  using (public.is_moderator())
  with check (public.is_moderator());

-- Submitters may only set user-supplied columns (not status, reviewed_*).
revoke insert on public.listings from anon, authenticated;
grant insert (title, description, category, event_date, location_text, contact,
              image_public_id, image_width, image_height, image_alt, ocr_raw_text, tags)
  on public.listings to anon, authenticated;
