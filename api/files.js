/**
 * /api/files.js
 * ---------------------------------------------------------------
 * Vercel Serverless Function — runs on Node.js, never in the browser.
 * Public, read-only endpoint used by the user-facing site.
 *
 * Credentials never touch the frontend: this function reads
 * SUPABASE_URL and SUPABASE_ANON_KEY from process.env (set them in
 * Vercel → Project → Settings → Environment Variables) and calls
 * Supabase's auto-generated REST API directly with fetch — no
 * @supabase/supabase-js package needed, so there's nothing to
 * npm-install and no node_modules to manage.
 *
 * The anon key is intentionally low-privilege: combined with the
 * Row Level Security policy in /supabase/schema.sql, it can only
 * SELECT rows, never insert/update/delete. Writes go through
 * /api/admin.js instead, using the service-role key.
 * ---------------------------------------------------------------
 */

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: "Supabase env vars are not configured" });
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/files?select=id,nama_file,deskripsi,url_safelinku,kategori,ukuran_file,created_at&order=created_at.desc`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Supabase error ${response.status}: ${text}`);
    }

    const files = await response.json();
    return res.status(200).json({ files });
  } catch (err) {
    console.error("[api/files]", err);
    return res.status(500).json({ error: "Could not load files" });
  }
};
