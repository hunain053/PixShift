const FORMATS = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "bmp",
  "webp",
  "ico",
  "tiff",
  "svg",
  "pdf",
];
const MIME_MAP = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  bmp: "image/bmp",
  webp: "image/webp",
  ico: "image/x-icon",
  tiff: "image/tiff",
  svg: "image/svg+xml",
  pdf: "application/pdf",
};

let files = [];
let nextId = 0;
let isDark = true;
let allConverted = false;

// ── INIT ──
const fmtGrid = document.getElementById("fmt-chips");
FORMATS.forEach((f) => {
  const c = document.createElement("div");
  c.className = "fmt-chip";
  c.textContent = f.toUpperCase();
  fmtGrid.appendChild(c);
});

const dropzone = document.getElementById("dropzone");
dropzone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropzone.classList.add("dragover");
});
dropzone.addEventListener("dragleave", () =>
  dropzone.classList.remove("dragover"),
);
dropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropzone.classList.remove("dragover");
  addFiles(e.dataTransfer.files);
});

const fileInput = document.getElementById("file-input");
fileInput.addEventListener("change", () => {
  addFiles(fileInput.files);
  fileInput.value = "";
});

document.addEventListener("click", (e) => {
  // Close if clicking outside any sel-face or dropdown
  const clickedFace = e.target.closest(".sel-face");
  const clickedDD = e.target.closest(".dropdown");
  if (!clickedFace && !clickedDD) closeDropdowns();
});

function triggerPick() {
  fileInput.click();
}

// ── THEME ──
function toggleTheme() {
  isDark = !isDark;
  document.documentElement.classList.toggle("light", !isDark);
  localStorage.setItem("theme", isDark ? "dark" : "light");
  const ico = document.getElementById("themeIco");
  ico.innerHTML = isDark
    ? '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'
    : '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
}

// ── INIT THEME FROM LOCALSTORAGE ──
const savedTheme = localStorage.getItem("theme") || "dark";
isDark = savedTheme === "dark";
document.documentElement.classList.toggle("light", !isDark);

// Update theme icon
const ico = document.getElementById("themeIco");
ico.innerHTML = isDark
  ? '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'
  : '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';

// ── ADD FILES ──
function addFiles(raw) {
  Array.from(raw).forEach((f) => {
    const isImage = f.type.startsWith("image/");
    const isPdf = f.type === "application/pdf";

    if (!isImage && !isPdf) return;

    const id = ++nextId;
    files.push({
      id,
      file: f,
      fmt: "jpg",
      status: "idle",
      blob: null,
      outName: "",
    });
    buildRow(files[files.length - 1]);
  });
  syncUI();
}

// ── BUILD ROW ──
function buildRow(entry) {
  const list = document.getElementById("file-list");

  const opts = FORMATS.map(
    (f) =>
      `<div class="dd-opt${f === "jpg" ? " sel" : ""}" data-fmt="${f}">${f.toUpperCase()}</div>`,
  ).join("");

  const row = document.createElement("div");
  row.className = "file-row";
  row.id = `row-${entry.id}`;
  row.innerHTML = `
    <div class="file-thumb">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    </div>
    <div class="file-info">
      <div class="file-name" title="${entry.file.name}">${clip(entry.file.name)}</div>
      <div class="file-size">${humanSize(entry.file.size)}</div>
    </div>
    <span class="cvt-label" id="lbl-${entry.id}">Convert to</span>
    <div class="sel-wrap" id="sw-${entry.id}">
      <div class="sel-face" id="sf-${entry.id}">
        <span id="sf-txt-${entry.id}">JPG</span>
      </div>
      <svg class="sel-arrow" id="sa-${entry.id}" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      <div class="dropdown" id="dd-${entry.id}">${opts}</div>
    </div>
    <button class="btn-cvt" id="bc-${entry.id}">Convert</button>
    <button class="btn-remove" id="br-${entry.id}" title="Remove">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  `;
  list.appendChild(row);

  // Move dropdown to body so it's never clipped by any parent overflow
  const ddEl = document.getElementById(`dd-${entry.id}`);
  document.body.appendChild(ddEl);

  // Bind dropdown toggle
  document.getElementById(`sf-${entry.id}`).addEventListener("click", (e) => {
    e.stopPropagation();
    toggleDropdown(entry.id);
  });

  // Bind format options
  document.querySelectorAll(`#dd-${entry.id} .dd-opt`).forEach((opt) => {
    opt.addEventListener("click", (e) => {
      e.stopPropagation();
      const fmt = opt.dataset.fmt;
      entry.fmt = fmt;
      document.getElementById(`sf-txt-${entry.id}`).textContent =
        fmt.toUpperCase();
      document
        .querySelectorAll(`#dd-${entry.id} .dd-opt`)
        .forEach((o) => o.classList.toggle("sel", o.dataset.fmt === fmt));
      closeDropdowns();
    });
  });

  // Bind convert button
  document
    .getElementById(`bc-${entry.id}`)
    .addEventListener("click", () => doConvert(entry.id));

  // Bind remove button
  document
    .getElementById(`br-${entry.id}`)
    .addEventListener("click", () => removeFile(entry.id));
}

// ── DROPDOWN (fixed-position portal) ──
function toggleDropdown(id) {
  const dd = document.getElementById(`dd-${id}`);
  const sf = document.getElementById(`sf-${id}`);
  const wasOpen = dd.classList.contains("open");
  closeDropdowns();
  if (!wasOpen) {
    // Position dropdown using getBoundingClientRect so it always renders on top
    const rect = sf.getBoundingClientRect();
    dd.style.top = rect.bottom + 6 + "px";
    dd.style.left = rect.left + "px";
    dd.classList.add("open");
    sf.classList.add("open");
  }
}
function closeDropdowns() {
  document.querySelectorAll(".dropdown.open").forEach((dd) => {
    dd.classList.remove("open");
    // find the matching sel-face via id
    const idNum = dd.id.replace("dd-", "");
    const sf = document.getElementById("sf-" + idNum);
    if (sf) sf.classList.remove("open");
  });
}
// Reposition open dropdown on scroll/resize
window.addEventListener("scroll", closeDropdowns, true);
window.addEventListener("resize", closeDropdowns);

// ── REMOVE ──
function removeFile(id) {
  files = files.filter((x) => x.id !== id);
  const row = document.getElementById(`row-${id}`);
  if (row) {
    row.style.transition = "opacity 0.2s, transform 0.2s";
    row.style.opacity = "0";
    row.style.transform = "scale(0.97)";
    setTimeout(() => {
      row.remove();
      syncUI();
    }, 210);
  } else {
    syncUI();
  }
}

// ── CONVERT ONE ──
function doConvert(id) {
  const entry = files.find((x) => x.id === id);
  if (!entry || entry.status === "converting" || entry.status === "done")
    return;
  entry.status = "converting";

  // Hide controls
  ["lbl-", "sw-", "bc-", "br-"].forEach((p) => {
    const el = document.getElementById(p + id);
    if (el) el.style.display = "none";
  });

  // Show spinner badge
  const row = document.getElementById(`row-${id}`);
  const badge = document.createElement("div");
  badge.className = "badge-loading";
  badge.id = `badge-${id}`;
  badge.innerHTML = '<div class="spinner"></div>Converting...';
  row.appendChild(badge);

  // Run conversion
  convertFile(entry.file, entry.fmt)
    .then((blob) => {
      entry.blob = blob;
      entry.status = "done";
      const parts = entry.file.name.split(".");
      parts[parts.length - 1] = entry.fmt;
      entry.outName = parts.join(".");

      // Remove spinner
      const bg = document.getElementById(`badge-${id}`);
      if (bg) bg.remove();
      row.classList.add("done");

      // Done badge
      const doneBadge = document.createElement("div");
      doneBadge.className = "badge-done";
      doneBadge.innerHTML = `
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>Done`;

      // Download button
      const dlUrl = URL.createObjectURL(blob);
      const dlBtn = document.createElement("a");
      dlBtn.className = "btn-download";
      dlBtn.href = dlUrl;
      dlBtn.download = entry.outName;
      dlBtn.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="8 17 12 21 16 17"/><line x1="12" y1="3" x2="12" y2="21"/>
        </svg>Download`;

      row.appendChild(doneBadge);
      row.appendChild(dlBtn);
      checkAllDone();
    })
    .catch((err) => {
      console.error("Conversion error:", err);
      entry.status = "idle";
      const bg = document.getElementById(`badge-${id}`);
      if (bg) bg.remove();
      ["lbl-", "sw-", "bc-", "br-"].forEach((p) => {
        const el = document.getElementById(p + id);
        if (el) el.style.display = "";
      });
    });
}

// ── CONVERT ALL ──
function convertAll() {
  const pending = files.filter((x) => x.status === "idle");
  pending.forEach((entry, i) => {
    setTimeout(() => doConvert(entry.id), i * 100);
  });
}

// ── CORE CONVERSION (Canvas API + File Conversion) ──
function convertFile(file, fmt) {
  return new Promise((resolve, reject) => {
    // PDF output from image
    if (fmt === "pdf") {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const { jsPDF } = window.jspdf;
          const img = new Image();
          img.onload = () => {
            const w = img.naturalWidth || img.width;
            const h = img.naturalHeight || img.height;

            // Create PDF with image dimensions
            const doc = new jsPDF({
              orientation: w > h ? "landscape" : "portrait",
              unit: "px",
              format: [w, h],
            });

            // Use data URL instead of blob URL
            doc.addImage(ev.target.result, "JPEG", 0, 0, w, h);
            const pdfBlob = doc.output("blob");
            resolve(pdfBlob);
          };
          img.onerror = () => reject(new Error("Image failed to load"));
          img.src = ev.target.result;
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    // SVG output — wrap source image in an SVG envelope
    if (fmt === "svg") {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const w = img.naturalWidth || 800;
          const h = img.naturalHeight || 600;
          const svgStr = [
            '<svg xmlns="http://www.w3.org/2000/svg"',
            ` width="${w}" height="${h}"`,
            ' xmlns:xlink="http://www.w3.org/1999/xlink">',
            `<image width="${w}" height="${h}" xlink:href="${ev.target.result}"/>`,
            "</svg>",
          ].join("");
          resolve(new Blob([svgStr], { type: "image/svg+xml" }));
        };
        img.onerror = reject;
        img.src = ev.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    // Canvas-based conversion for all other image formats
    const objUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objUrl);
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext("2d");
      const needsBg = ["jpg", "jpeg", "bmp", "ico", "tiff"].includes(fmt);
      if (needsBg) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0);
      const mime = MIME_MAP[fmt] || "image/png";
      const quality = fmt === "jpg" || fmt === "jpeg" ? 0.92 : undefined;
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("canvas.toBlob returned null"));
        },
        mime,
        quality,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objUrl);
      reject(new Error("Image failed to load"));
    };
    img.src = objUrl;
  });
}

// ── CHECK ALL DONE ──
function checkAllDone() {
  if (!files.length) return;
  if (files.every((x) => x.status === "done") && !allConverted) {
    allConverted = true;
    document.getElementById("bot-bar").style.display = "none";
    document.getElementById("post-bar").style.display = "flex";

    // Hide "Download All" when only one file
    const dlAllBtn = document.querySelector("#post-bar .btn-dl-all");
    if (dlAllBtn) dlAllBtn.style.display = files.length > 1 ? "flex" : "none";
  }
}

// ── SYNC UI STATE ──
function syncUI() {
  const has = files.length > 0;
  document.getElementById("dropzone").style.display = has ? "none" : "flex";
  document.getElementById("file-list").style.display = has ? "flex" : "none";
  document.getElementById("bot-bar").style.display =
    has && !allConverted ? "flex" : "none";
  document.getElementById("post-bar").style.display =
    has && allConverted ? "flex" : "none";

  // Hide "Download All" when only one file
  const dlAllBtn = document.querySelector("#post-bar .btn-dl-all");
  if (dlAllBtn)
    dlAllBtn.style.display = files.length > 1 && allConverted ? "flex" : "none";
}

// ── HELPERS ──
function humanSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(2) + " MB";
}
function clip(name, max = 40) {
  if (name.length <= max) return name;
  const ext = name.split(".").pop();
  return name.slice(0, max - ext.length - 4) + "..." + ext;
}

// ── SMOOTH BRAND NAVIGATION ──
document.getElementById("brandLink").addEventListener("click", (e) => {
  e.preventDefault();

  // Add fade out animation
  document.body.style.transition = "opacity 0.4s ease";
  document.body.style.opacity = "0";

  // Navigate after fade completes
  setTimeout(() => {
    window.location.href = "../index.html";
  }, 200);
});

// Restore opacity on page load
window.addEventListener("load", () => {
  document.body.style.opacity = "1";
});

// ── PAGE LOAD ANIMATION ──
// Hide loading skeleton when page is fully loaded
window.addEventListener("load", () => {
  document.body.classList.add("loaded");
  document.body.style.opacity = "1";
  document.body.style.animation = "fadeIn 1.2s ease forwards";
});

// Also ensure body fades in if DOM is already ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    document.body.style.opacity = "1";
  });
} else {
  document.body.style.opacity = "1";
}

// ── SMOOTH BRAND NAVIGATION ──
const brandLink = document.getElementById("brandLink");
if (brandLink) {
  brandLink.addEventListener("click", (e) => {
    e.preventDefault();

    // Add fade out animation
    document.body.style.animation = "fadeOut 0.8s ease forwards";

    // Navigate after fade completes
    setTimeout(() => {
      window.location.href = "../index.html";
    }, 800);
  });
}

// Restore animation state on page load (for navigation)
window.addEventListener("load", () => {
  document.body.style.animation = "fadeIn 2.5s ease forwards";
  document.body.style.opacity = "1";
});


