-- ZennVault — Supabase schema
-- Run this in Supabase → SQL Editor → New query → Run.

create table if not exists files (
  id uuid primary key default gen_random_uuid(),
  nama_file text not null,
  deskripsi text,
  url_safelinku text not null,
  created_at timestamptz not null default now()
);

-- Row Level Security: locked down by default, then opened up
-- just enough for the public site to read.
alter table files enable row level security;

-- /api/files.js reads with the anon key — this policy is what
-- lets that succeed. It only allows SELECT, never insert/update/
-- delete, so the anon key alone can never modify data.
create policy "Public can read files"
  on files
  for select
  to anon
  using (true);

-- No insert/update/delete policy is created for "anon" on purpose.
-- /api/admin.js uses the service-role key instead, which bypasses
-- Row Level Security entirely — that's the only way files get
-- created or removed.

-- Optional: a couple of sample rows so the site isn't empty on first load.
insert into files (nama_file, deskripsi, url_safelinku) values
  ('Premium Lightroom Presets Pack', '120 cinematic color presets for Adobe Lightroom, mobile & desktop.', 'https://safelinku.com/example-1'),
  ('Pro Video Editor — Modded', 'Unlocked version of a popular mobile video editor, no watermark.', 'https://safelinku.com/example-2'),
  ('Complete UI Kit for Figma', '200+ components, dark & light variants, ready for handoff.', 'https://safelinku.com/example-3');
