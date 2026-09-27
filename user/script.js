/* =========================================================
   ZennVault — Client script (vanilla JS, no build step)
   ========================================================= */

/* ---------------------------------------------------------
   1) i18n dictionary
   Default language is English. Add more locales by adding
   another key here (e.g. "ja", "th") — no other code needs
   to change.
   --------------------------------------------------------- */
const I18N = {
  en: {
    searchPlaceholder: "Search for a file...",
    tagline: "Find the file you need. Grab it instantly.",
    loading: "Loading files...",
    noResults: "No files match your search. Try a different keyword.",
    fetchError: "Couldn't load the file list. Please refresh the page.",
    downloadFree: "Free Download",
    buyPremium: "Get Instant Access",
    modalTitle: "Premium Access",
    modalBody: "Payment is handled via TikTok DM. Tap OK and send a direct message to @zennlonevyn with the name of the file you want — payment instructions will be shared there.",
    modalButton: "OK",
    footerRights: "All rights reserved.",
    footerContact: "Contact",
    footerSupport: "Support this project",
    footerTiktok: "Follow on TikTok",
  },
  zh: { // Traditional Chinese — covers Taiwan; swap to zh-Hans copy for mainland China if you want a script split
    searchPlaceholder: "搜尋檔案...",
    tagline: "尋找你需要的檔案，立即取得。",
    loading: "檔案載入中...",
    noResults: "找不到符合的檔案，請嘗試其他關鍵字。",
    fetchError: "無法載入檔案清單，請重新整理頁面。",
    downloadFree: "免費下載",
    buyPremium: "立即取得存取權",
    modalTitle: "進階存取",
    modalBody: "付款透過 TikTok 私訊完成。請按下「了解」後私訊 @zennlonevyn 並告知您想要的檔案名稱，付款方式將在私訊中說明。",
    modalButton: "了解",
    footerRights: "版權所有。",
    footerContact: "聯絡方式",
    footerSupport: "支持這個專案",
    footerTiktok: "在 TikTok 上追蹤",
  },
  vi: {
    searchPlaceholder: "Tìm kiếm tệp tin...",
    tagline: "Tìm file bạn cần. Tải ngay lập tức.",
    loading: "Đang tải danh sách file...",
    noResults: "Không tìm thấy tệp phù hợp. Hãy thử từ khóa khác.",
    fetchError: "Không thể tải danh sách file. Vui lòng tải lại trang.",
    downloadFree: "Tải miễn phí",
    buyPremium: "Truy cập ngay",
    modalTitle: "Truy cập Premium",
    modalBody: "Thanh toán qua tin nhắn TikTok. Nhấn OK rồi nhắn tin trực tiếp (DM) cho @zennlonevyn kèm tên file bạn muốn mua, hướng dẫn thanh toán sẽ được gửi qua tin nhắn.",
    modalButton: "OK",
    footerRights: "Bảo lưu mọi quyền.",
    footerContact: "Liên hệ",
    footerSupport: "Ủng hộ dự án này",
    footerTiktok: "Theo dõi trên TikTok",
  },
  id: {
    searchPlaceholder: "Cari nama file...",
    tagline: "Cari file yang kamu butuhkan, langsung dapat.",
    loading: "Memuat daftar file...",
    noResults: "Tidak ada file yang cocok. Coba kata kunci lain.",
    fetchError: "Gagal memuat daftar file. Coba muat ulang halaman.",
    downloadFree: "Download Gratis",
    buyPremium: "Beli Akses Langsung",
    modalTitle: "Akses Premium",
    modalBody: "Pembayaran dilakukan via DM TikTok. Tekan OK lalu DM @zennlonevyn dan sebutkan nama file yang ingin dibeli — instruksi pembayaran akan dijelaskan lewat DM.",
    modalButton: "OK",
    footerRights: "Hak cipta dilindungi.",
    footerContact: "Kontak",
    footerSupport: "Dukung proyek ini",
    footerTiktok: "Ikuti di TikTok",
  },
};

/* ---------------------------------------------------------
   2) Auto-detect device/browser language
   navigator.language looks like "en-US", "zh-TW", "vi-VN", "id-ID"...
   We only need the primary subtag.
   --------------------------------------------------------- */
function detectLocale() {
  const raw = (navigator.language || navigator.userLanguage || "en").toLowerCase();
  if (raw.startsWith("zh")) return "zh";   // Taiwan (zh-TW) / China (zh-CN) / HK / SG
  if (raw.startsWith("vi")) return "vi";   // Vietnam
  if (raw.startsWith("id")) return "id";   // Indonesia
  return "en";                             // default
}

const LOCALE = detectLocale();
const T = I18N[LOCALE] || I18N.en;

/* Apply translations to every element tagged with data-i18n / data-i18n-placeholder */
function applyTranslations() {
  document.documentElement.lang = LOCALE;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (T[key]) el.textContent = T[key];
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (T[key]) el.placeholder = T[key];
  });
}

/* ---------------------------------------------------------
   3) Fetching file data
   The frontend never talks to Supabase directly — it only
   calls our own /api/files serverless function, which holds
   the Supabase credentials server-side (see /api/files.js).
   --------------------------------------------------------- */
// Shown here so the UI still works if you open this page before
// deploying /api or before the Supabase table has rows — NOT a
// substitute for the real API.
const SAMPLE_FILES_FALLBACK = [
  {
    id: "sample-1",
    nama_file: "Premium Lightroom Presets Pack",
    deskripsi: "120 cinematic color presets for Adobe Lightroom, mobile & desktop.",
    url_safelinku: "https://safelinku.com/example-1",
  },
  {
    id: "sample-2",
    nama_file: "Pro Video Editor — Modded",
    deskripsi: "Unlocked version of a popular mobile video editor, no watermark.",
    url_safelinku: "https://safelinku.com/example-2",
  },
  {
    id: "sample-3",
    nama_file: "Complete UI Kit for Figma",
    deskripsi: "200+ components, dark & light variants, ready for handoff.",
    url_safelinku: "https://safelinku.com/example-3",
  },
];

async function fetchFiles() {
  try {
    const res = await fetch("/api/files");
    if (!res.ok) throw new Error("Bad response from /api/files");
    const data = await res.json();
    if (Array.isArray(data.files) && data.files.length > 0) return data.files;
    return SAMPLE_FILES_FALLBACK;
  } catch (err) {
    console.warn("[ZennVault] Falling back to sample data:", err.message);
    return SAMPLE_FILES_FALLBACK;
  }
}

/* ---------------------------------------------------------
   4) Rendering
   --------------------------------------------------------- */
let ALL_FILES = [];
let PENDING_TIKTOK_REDIRECT = false;

function fileCardHTML(file) {
  return `
    <article class="file-card" data-title="${escapeHTML(file.nama_file.toLowerCase())}">
      <div class="file-card__body">
        <h3 class="file-card__title">${escapeHTML(file.nama_file)}</h3>
        <p class="file-card__desc">${escapeHTML(file.deskripsi || "")}</p>
      </div>
      <div class="file-card__actions">
        <a class="btn btn--ghost" href="${escapeAttr(file.url_safelinku)}" target="_blank" rel="noopener noreferrer">
          ${T.downloadFree}
        </a>
        <button class="btn btn--premium" data-file-title="${escapeAttr(file.nama_file)}">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2 L4 13H11L9 22L20 9H13L15 2Z" fill="currentColor"/>
          </svg>
          ${T.buyPremium}
        </button>
      </div>
    </article>
  `;
}

function escapeHTML(str = "") {
  return str.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
function escapeAttr(str = "") { return escapeHTML(str); }

function renderFiles(files) {
  const grid = document.getElementById("fileGrid");
  if (files.length === 0) {
    grid.innerHTML = `<p class="status-text">${T.noResults}</p>`;
    return;
  }
  grid.innerHTML = files.map(fileCardHTML).join("");
}

/* ---------------------------------------------------------
   5) Live search
   --------------------------------------------------------- */
function setupSearch() {
  const input = document.getElementById("searchInput");
  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    const filtered = q
      ? ALL_FILES.filter((f) => f.nama_file.toLowerCase().includes(q))
      : ALL_FILES;
    renderFiles(filtered);
  });
}

/* ---------------------------------------------------------
   6) Premium modal
   Flow requested: click "Beli Akses Langsung" -> show localized
   alert with payment instructions -> only once the user presses
   OK do we open TikTok. Closing via the X or the backdrop just
   dismisses the alert without redirecting anywhere.
   --------------------------------------------------------- */
function setupPremiumModal() {
  const modal = document.getElementById("premiumModal");
  const closeBtn = document.getElementById("modalCloseBtn");
  const okBtn = document.getElementById("modalOkBtn");

  document.getElementById("fileGrid").addEventListener("click", (e) => {
    const btn = e.target.closest(".btn--premium");
    if (!btn) return;
    openModal();
  });

  function openModal() {
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add("is-open"));
  }

  function closeModal() {
    modal.classList.remove("is-open");
    setTimeout(() => { modal.hidden = true; }, 200);
  }

  okBtn.addEventListener("click", () => {
    closeModal();
    window.open("https://www.tiktok.com/@zennlonevyn", "_blank", "noopener");
  });

  closeBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
}

/* ---------------------------------------------------------
   7) Init
   --------------------------------------------------------- */
async function init() {
  applyTranslations();
  document.getElementById("copyYear").textContent = new Date().getFullYear();

  setupSearch();
  setupPremiumModal();

  ALL_FILES = await fetchFiles();
  renderFiles(ALL_FILES);
}

document.addEventListener("DOMContentLoaded", init);
