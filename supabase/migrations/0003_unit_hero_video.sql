-- Add optional hero video URL to units (used for the public-facing hero banner).
alter table public.units
  add column if not exists hero_video_url text;
