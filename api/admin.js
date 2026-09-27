/**
 * /api/admin.js
 * ---------------------------------------------------------------
 * Vercel Serverless Function — runs on Node.js, never in the browser.
 * Handles the admin dashboard's writes: POST to create a file,
 * DELETE to remove one. Kept separate from /api/files.js on purpose,
 * so the powerful service-role key only ever lives in the one
 * function that actually needs it.
 *
 * Env vars used here (Vercel → Project → Settings → Environment
 * Variables):
 *   SUPABASE_URL                the same project URL as /api/files.js
 *   SUPABASE_SERVICE_ROLE_KEY   full-access key — bypasses Row Level
 *                                Security, so it must NEVER be sent
 *                                to the browser or committed to git
 *   ADMIN_API_KEY               a secret you make up yourself, used
 *                                only to check that a request came
 *                                from the admin dashboard (see the
 *                                note in admin/script.js about this
 *                                being a demo-level check, not real
 *                                auth)
 * ---------------------------------------------------------------
 */

function isAuthorized(req) {
  const provided = req.headers["x-admin-key"];
  return !!process.env.ADMIN_API_KEY && provided === process.env.ADMIN_API_KEY;
}

module.exports = async function handler(req, res) {
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: "Supabase env vars are not configured" });
  }

  const authHeaders = {
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  };

  if (req.method === "POST") {
    const { nama_file, deskripsi, url_safelinku } = req.body || {};
    if (!nama_file || !url_safelinku) {
      return res.status(400).json({ error: "nama_file dan url_safelinku wajib diisi" });
    }

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/files`, {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          nama_file,
          deskripsi: deskripsi || "",
          url_safelinku,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Supabase error ${response.status}: ${text}`);
      }

      const [file] = await response.json();
      return res.status(201).json({ file });
    } catch (err) {
      console.error("[api/admin POST]", err);
      return res.status(500).json({ error: "Gagal menambah file" });
    }
  }

  if (req.method === "DELETE") {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "id wajib diisi" });

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/files?id=eq.${encodeURIComponent(id)}`,
        { method: "DELETE", headers: authHeaders }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Supabase error ${response.status}: ${text}`);
      }

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("[api/admin DELETE]", err);
      return res.status(500).json({ error: "Gagal menghapus file" });
    }
  }

  res.setHeader("Allow", "POST, DELETE");
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
};
