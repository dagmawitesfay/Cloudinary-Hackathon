-- Only needed if you already ran a 0001 that required community-hackathon/.
-- The upload preset's public_id_prefix is "flyers", so real uploads are flyers/<id>.
alter table public.listings drop constraint if exists listings_image_public_id_check;
alter table public.listings add constraint listings_image_public_id_check
  check (image_public_id ~ '^flyers/[A-Za-z0-9_\-/]+$');
