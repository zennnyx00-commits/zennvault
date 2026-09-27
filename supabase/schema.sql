-- ZennVault — Supabase schema
-- Run this in Supabase → SQL Editor → New query → Run.

create table if not exists files (
  id uuid primary key default gen_random_uuid(),
  nama_file text not null,
  deskripsi text,
  url_safelinku text not null,
  kategori text,       -- optional badge shown on the card, e.g. "ZIP", "Anime", "Featured"
  ukuran_file text,     -- optional size label shown on the card, e.g. "45 MB"
  created_at timestamptz not null default now()
);

-- Already ran the schema before this column existed? Run these two
-- lines once in the SQL Editor to add them to your existing table
-- (safe to run even if the table is empty or already has these):
--   alter table files add column if not exists kategori text;
--   alter table files add column if not exists ukuran_file text;

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
insert into files (nama_file, deskripsi, url_safelinku, kategori, ukuran_file) values
  ('Premium Lightroom Presets Pack', '120 cinematic color presets for Adobe Lightroom, mobile & desktop.', 'https://safelinku.com/example-1', 'ZIP', '38 MB'),
  ('Pro Video Editor — Modded', 'Unlocked version of a popular mobile video editor, no watermark.', 'https://safelinku.com/example-2', 'APK', '64 MB'),
  ('Complete UI Kit for Figma', '200+ components, dark & light variants, ready for handoff.', 'https://safelinku.com/example-3', 'Featured', '12 MB');
