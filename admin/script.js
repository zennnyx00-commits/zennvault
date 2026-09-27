/* =========================================================
   ZennVault Admin — vanilla JS, shared by login.html and index.html
   ========================================================= */

/* ---------------------------------------------------------
   DEMO AUTH — replace before going live.
   This is a UI mockup, exactly as requested. It only gates
   access to this browser tab via sessionStorage; it is NOT
   real security. For production, verify credentials on the
   server (e.g. a /api/login function that checks a hashed
   password and sets an HttpOnly session cookie) instead of
   comparing strings in client-side JS like this.
   --------------------------------------------------------- */
const DEMO_CREDENTIALS = { username: "admin", password: "zennvault2026" };
const AUTH_FLAG_KEY = "zv_admin_authed";

// Shared secret sent with write requests so /api/admin.js can tell
// admin actions apart from public reads. Client-side "secrets" are
// always visible to anyone who opens dev tools — for real protection,
// swap this for a server-issued session token once you add real auth.
const ADMIN_DEMO_KEY = "demo-admin-key-change-me";

/* ---------------------------------------------------------
   Login page logic (only runs if #loginForm exists)
   --------------------------------------------------------- */
function initLoginPage() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const errorEl = document.getElementById("authError");

    if (username === DEMO_CREDENTIALS.username && password === DEMO_CREDENTIALS.password) {
      sessionStorage.setItem(AUTH_FLAG_KEY, "true");
      window.location.href = "/admin/index.html";
    } else {
      errorEl.hidden = false;
    }
  });
}

/* ---------------------------------------------------------
   Dashboard page logic (only runs if #fileForm exists)
   Reads go to /api/files (Supabase anon key, server-side).
   Writes go to /api/admin (Supabase service-role key, server-side).
   --------------------------------------------------------- */
function guardDashboard() {
  if (sessionStorage.getItem(AUTH_FLAG_KEY) !== "true") {
    window.location.href = "/admin/login.html";
    return false;
  }
  return true;
}

async function fetchFileList() {
  const res = await fetch("/api/files");
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}

async function createFile(payload) {
  const res = await fetch("/api/admin", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": ADMIN_DEMO_KEY, // checked server-side against process.env.ADMIN_API_KEY
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Request failed (${res.status}): ${errText}`);
  }
  return res.json();
}

async function deleteFile(id) {
  const res = await fetch(`/api/admin?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { "x-admin-key": ADMIN_DEMO_KEY },
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Request failed (${res.status}): ${errText}`);
  }
  return res.json();
}

function adminRowHTML(file, index = 0) {
  return `
    <div class="admin-file-row" style="--stagger: ${index}" data-id="${file.id}">
      <div class="admin-file-row__body">
        <p class="admin-file-row__title">${file.nama_file}</p>
        <p class="admin-file-row__desc">${file.deskripsi || ""}</p>
      </div>
      <div class="admin-file-row__actions">
        <button class="btn btn--danger" data-action="delete">Delete</button>
      </div>
    </div>
  `;
}

let CURRENT_FILES = [];

async function loadFiles() {
  const listEl = document.getElementById("adminFileList");
  const countEl = document.getElementById("fileCount");
  try {
    const data = await fetchFileList();
    CURRENT_FILES = data.files || [];
    countEl.textContent = `${CURRENT_FILES.length} file${CURRENT_FILES.length === 1 ? "" : "s"}`;
    listEl.innerHTML = CURRENT_FILES.length
      ? CURRENT_FILES.map((file, i) => adminRowHTML(file, i)).join("")
      : `<p class="status-text">No files yet — add your first one above.</p>`;
  } catch (err) {
    listEl.innerHTML = `<p class="status-text">Couldn't load files: ${err.message}</p>`;
  }
}

function setStatus(message, isError = false) {
  const el = document.getElementById("formStatus");
  el.textContent = message;
  el.classList.toggle("is-error", isError);
}

function initDashboard() {
  if (!guardDashboard()) return;

  document.getElementById("logoutBtn").addEventListener("click", () => {
    sessionStorage.removeItem(AUTH_FLAG_KEY);
    window.location.href = "/admin/login.html";
  });

  const form = document.getElementById("fileForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      nama_file: document.getElementById("fName").value.trim(),
      deskripsi: document.getElementById("fDescription").value.trim(),
      url_safelinku: document.getElementById("fSafelink").value.trim(),
    };

    try {
      await createFile(payload);
      setStatus("File added.");
      form.reset();
      loadFiles();
    } catch (err) {
      setStatus(err.message, true);
    }
  });

  document.getElementById("adminFileList").addEventListener("click", async (e) => {
    if (e.target.dataset.action !== "delete") return;
    const row = e.target.closest(".admin-file-row");
    const id = row.dataset.id;
    const file = CURRENT_FILES.find((f) => f.id === id);

    if (!confirm(`Delete "${file ? file.nama_file : "this file"}"? This can't be undone.`)) return;
    try {
      await deleteFile(id);
      loadFiles();
    } catch (err) {
      alert(`Couldn't delete: ${err.message}`);
    }
  });

  loadFiles();
}

/* ---------------------------------------------------------
   Entry point
   --------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  initLoginPage();
  if (document.getElementById("fileForm")) initDashboard();
});
