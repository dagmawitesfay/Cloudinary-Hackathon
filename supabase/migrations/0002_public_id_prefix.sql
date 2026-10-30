-- Uploads now land under community-hackathon/ (upload preset folder) instead of flyers/.
-- Safe to run on a database created from either version of 0001.
alter table public.listings drop constraint if exists listings_image_public_id_check;
alter table public.listings add constraint listings_image_public_id_check
  check (image_public_id ~ '^community-hackathon/[A-Za-z0-9_\-/]+$');
