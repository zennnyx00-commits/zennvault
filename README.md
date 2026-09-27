# ZennVault — File Distribution Platform (Supabase edition)

A dark, glassmorphism-styled file-directory site with a public user page and
a separate admin panel, backed by a real Supabase (PostgreSQL) database.
Plain HTML/CSS/vanilla JS — no framework, no build step, no npm install.

```
zennvault/
├── vercel.json           ← routes "/" and "/admin" to the right folders
├── supabase/
│   └── schema.sql        ← run this once in Supabase's SQL editor
├── api/
│   ├── files.js          ← GET /api/files  — public, read-only (anon key)
│   └── admin.js          ← POST/DELETE /api/admin — writes (service-role key)
├── user/                  ← public site
│   ├── index.html
│   ├── style.css
│   └── script.js          ← i18n dictionary + fetch + search + premium modal
└── admin/                  ← admin panel
    ├── login.html
    ├── index.html          ← dashboard
    ├── style.css
    └── script.js
```

Everything here works with **no local install and no laptop** — you only
need a browser (Supabase, GitHub and Vercel's dashboards all work fine on
mobile).

---

## 1. Set up Supabase

1. Go to [supabase.com](https://supabase.com), sign in, and **New project**.
2. Once it's ready, open **SQL Editor** → **New query**, paste in the
   contents of `supabase/schema.sql` from this project, and **Run**. This
   creates the `files` table (`id`, `nama_file`, `deskripsi`,
   `url_safelinku`, `created_at`), locks it down with Row Level Security,
   and adds 3 sample rows.
3. Go to **Project Settings → API**. You'll need three values in step 3:
   - **Project URL** → this is `SUPABASE_URL`
   - **anon public** key → this is `SUPABASE_ANON_KEY`
   - **service_role** key → this is `SUPABASE_SERVICE_ROLE_KEY`
     (keep this one secret — it has full access and bypasses every
     security rule, which is exactly why it only ever lives in
     `api/admin.js`, never in the browser)

## 2. Put the code on GitHub

1. Go to [github.com](https://github.com) and sign in.
2. Tap **+** → **New repository**, name it `zennvault`, and create it.
3. Open the repo → **Add file** → **Upload files**, and upload this whole
   folder, keeping `api`, `user`, `admin`, and `supabase` as their own
   folders in the repo.
4. Commit.

## 3. Import the project into Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. **Add New...** → **Project** → select `zennvault` → **Import**.
3. Framework preset: leave as **Other** — no build step needed.
4. Before deploying, open **Environment Variables** and add:
   | Name | Value |
   |---|---|
   | `SUPABASE_URL` | your Supabase Project URL |
   | `SUPABASE_ANON_KEY` | your Supabase anon public key |
   | `SUPABASE_SERVICE_ROLE_KEY` | your Supabase service_role key |
   | `ADMIN_API_KEY` | any long random string you make up — guards `/api/admin` |
5. Click **Deploy**. You'll get a live URL like `https://zennvault.vercel.app`.

## 4. Try it out

- Public site: `https://your-project.vercel.app/`
- Admin panel: `https://your-project.vercel.app/admin`
  - Demo login: username `admin`, password `zennvault2026`
    (change these in `admin/script.js` → `DEMO_CREDENTIALS`, then re-upload
    that file to GitHub — Vercel redeploys automatically on every push)
  - In `admin/script.js`, set `ADMIN_DEMO_KEY` to the **same value** you
    used for `ADMIN_API_KEY` in Vercel, so the two sides agree.

## 5. How the pieces fit together

- The user site never talks to Supabase directly — it only calls
  `/api/files`, which is the only place that reads `SUPABASE_ANON_KEY`.
- The admin dashboard never talks to Supabase directly either — it calls
  `/api/admin`, the only place that reads `SUPABASE_SERVICE_ROLE_KEY`.
  Every request there must also carry the shared `x-admin-key` header
  (checked against `ADMIN_API_KEY`), or it's rejected with 401.
- Because the anon key can only `SELECT` (see the Row Level Security
  policy in `schema.sql`), even if someone found that key, they still
  couldn't add or delete files with it — only `/api/admin`, gated by the
  service-role key, can do that.

## 6. Before this is truly "live"

- **Admin login is a UI mockup**, checked in the browser. Fine for keeping
  casual visitors out, not real protection — a determined person could
  read the demo password out of the page source. For real security, move
  the check to a server function that verifies a hashed password and sets
  a secure session cookie.
- **This build supports Create + Delete**, matching the current spec. If
  you want Edit later too, it's a small addition: add a `PUT` branch to
  `api/admin.js` (same pattern as the `POST` branch, but calling Supabase's
  `PATCH` on `files?id=eq....`) and a matching "Edit" button in the admin
  dashboard.

## 7. Customizing

- **Branding / colors** — the `:root` block at the top of each
  `style.css`. `--teal` is the free-tier accent, `--gold` is premium.
- **Fonts** — Poppins (headings) + Inter (body), loaded via Google Fonts
  in each HTML file's `<head>`.
- **Languages** — `user/script.js` → `I18N` object. Add a new locale by
  adding another key (e.g. `th` for Thai) and one line in `detectLocale()`;
  every element already tagged `data-i18n` / `data-i18n-placeholder` in
  `index.html` picks it up automatically.
- **Footer links** — Saweria and Buy Me a Coffee are placeholder URLs in
  `user/index.html`; swap in your real page links there.
- **TikTok / email** — search `zennnyx00@gmail.com` and `zennlonevyn`
  across `user/index.html` and `script.js` if either ever changes.
