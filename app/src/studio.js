// Vice Poster Studio — editor wiring: state, controls, pointer work and the
// deterministic ?shot= states used for screenshots. Rendering itself lives
// in render.js; this file owns everything the visitor can touch.

import { LAYOUTS, panelRects, drawPoster } from "./render.js";

const SAMPLES = {
  pier: "samples/pier.jpg",
  boulevard: "samples/boulevard.jpg",
  neon: "samples/neon.jpg",
  boardwalk: "samples/boardwalk.jpg",
};
const SAMPLE_LABELS = {
  pier: "Pier (sample)",
  boulevard: "Boulevard (sample)",
  neon: "Neon Mile (sample)",
  boardwalk: "Boardwalk (sample)",
};

const canvas = document.getElementById("poster");
const ctx = canvas.getContext("2d");
const wrap = document.getElementById("canvasWrap");

const state = {
  layout: "collage",
  panels: [],
  selected: 0,
  title: "VICE HEAT",
  subtitle: "A FAN-MADE POSTER TRIBUTE",
  titleStyle: "sunset",
  grade: { on: true, amount: 0.7 },
  frame: true,
  showSelection: true,
};

function blankPanel() {
  return { img: null, name: "", dx: 0, dy: 0, scale: 1 };
}

function ensurePanels() {
  const count = LAYOUTS[state.layout].length;
  while (state.panels.length < count) state.panels.push(blankPanel());
  state.panels.length = count;
  if (state.selected >= count) state.selected = 0;
}

const imageCache = new Map();
function loadImage(src) {
  if (imageCache.has(src)) return imageCache.get(src);
  const promise = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
  imageCache.set(src, promise);
  return promise;
}

async function setPanelPhoto(index, src, name) {
  const img = await loadImage(src);
  const panel = state.panels[index];
  panel.img = img;
  panel.name = name;
  panel.dx = 0;
  panel.dy = 0;
  panel.scale = 1;
  buildPanelList();
  render();
}

function render() {
  drawPoster(ctx, canvas.width, canvas.height, state);
}

// ---- panel chips -------------------------------------------------------

const panelList = document.getElementById("panelList");
const selName = document.getElementById("selName");
const zoomRange = document.getElementById("zoomRange");

function buildPanelList() {
  panelList.innerHTML = "";
  state.panels.forEach((panel, i) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "panel-chip" + (i === state.selected ? " active" : "");
    chip.textContent = `Panel ${i + 1}`;
    chip.title = panel.name || "empty";
    chip.addEventListener("click", () => selectPanel(i));
    panelList.appendChild(chip);
  });
  const current = state.panels[state.selected];
  selName.textContent = `Panel ${state.selected + 1}${current && current.name ? " — " + current.name : ""}`;
  if (current) zoomRange.value = Math.round((current.scale || 1) * 100);
}

function selectPanel(i) {
  state.selected = i;
  buildPanelList();
  render();
}

// ---- controls ----------------------------------------------------------

document.getElementById("layoutRow").addEventListener("click", (event) => {
  const btn = event.target.closest("[data-layout]");
  if (!btn) return;
  document.querySelectorAll(".layout-btn").forEach((b) => b.classList.toggle("active", b === btn));
  state.layout = btn.dataset.layout;
  ensurePanels();
  buildPanelList();
  render();
});

const titleInput = document.getElementById("titleInput");
const subtitleInput = document.getElementById("subtitleInput");
titleInput.addEventListener("input", () => { state.title = titleInput.value; render(); });
subtitleInput.addEventListener("input", () => { state.subtitle = subtitleInput.value; render(); });
document.getElementById("titleStyle").addEventListener("change", (e) => { state.titleStyle = e.target.value; render(); });

const gradeToggle = document.getElementById("gradeToggle");
const gradeRange = document.getElementById("gradeRange");
gradeToggle.addEventListener("change", () => { state.grade.on = gradeToggle.checked; render(); });
gradeRange.addEventListener("input", () => { state.grade.amount = gradeRange.value / 100; render(); });
document.getElementById("frameToggle").addEventListener("change", (e) => { state.frame = e.target.checked; render(); });

const sizeSelect = document.getElementById("sizeSelect");
function applySize() {
  const [w, h] = sizeSelect.value.split("x").map(Number);
  canvas.width = w;
  canvas.height = h;
  wrap.style.setProperty("--ar", String(w / h));
  render();
}
sizeSelect.addEventListener("change", applySize);

document.getElementById("exportBtn").addEventListener("click", () => {
  const wasSelection = state.showSelection;
  state.showSelection = false;
  render();
  canvas.toBlob((blob) => {
    state.showSelection = wasSelection;
    render();
    if (!blob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `vice-poster-${canvas.width}x${canvas.height}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }, "image/png");
});

const fileInput = document.getElementById("fileInput");
fileInput.addEventListener("change", () => {
  const file = fileInput.files && fileInput.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  setPanelPhoto(state.selected, url, file.name.slice(0, 28));
  fileInput.value = "";
});

document.getElementById("sampleRow").addEventListener("click", (event) => {
  const btn = event.target.closest("[data-sample]");
  if (!btn) return;
  const key = btn.dataset.sample;
  setPanelPhoto(state.selected, SAMPLES[key], SAMPLE_LABELS[key]);
});

document.getElementById("fillAllBtn").addEventListener("click", async () => {
  const current = state.panels[state.selected];
  if (!current || !current.img) return;
  state.panels.forEach((panel) => {
    panel.img = current.img;
    panel.name = current.name;
    panel.dx = 0;
    panel.dy = 0;
    panel.scale = 1;
  });
  buildPanelList();
  render();
});

document.getElementById("resetBtn").addEventListener("click", () => {
  const panel = state.panels[state.selected];
  if (!panel) return;
  panel.dx = 0;
  panel.dy = 0;
  panel.scale = 1;
  buildPanelList();
  render();
});

zoomRange.addEventListener("input", () => {
  const panel = state.panels[state.selected];
  if (!panel) return;
  panel.scale = zoomRange.value / 100;
  render();
});

// ---- pointer work on the canvas ----------------------------------------

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height),
    sx: canvas.width / rect.width,
    sy: canvas.height / rect.height,
  };
}

function panelAt(x, y) {
  const rects = panelRects(state.layout, canvas.width, canvas.height);
  for (let i = rects.length - 1; i >= 0; i--) {
    const r = rects[i];
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
  }
  return -1;
}

let drag = null;
canvas.addEventListener("pointerdown", (event) => {
  const p = canvasPoint(event);
  const index = panelAt(p.x, p.y);
  if (index < 0) return;
  if (index !== state.selected) selectPanel(index);
  const panel = state.panels[index];
  if (!panel || !panel.img) return;
  drag = { startX: p.x, startY: p.y, dx: panel.dx, dy: panel.dy, sx: p.sx, sy: p.sy };
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener("pointermove", (event) => {
  if (!drag) return;
  const p = canvasPoint(event);
  const panel = state.panels[state.selected];
  panel.dx = drag.dx + (p.x - drag.startX);
  panel.dy = drag.dy + (p.y - drag.startY);
  render();
});
["pointerup", "pointercancel"].forEach((type) =>
  canvas.addEventListener(type, () => { drag = null; })
);
canvas.addEventListener("wheel", (event) => {
  const panel = state.panels[state.selected];
  if (!panel || !panel.img) return;
  event.preventDefault();
  const step = event.deltaY < 0 ? 1.06 : 1 / 1.06;
  panel.scale = Math.min(3.5, Math.max(1, (panel.scale || 1) * step));
  zoomRange.value = Math.round(panel.scale * 100);
  render();
}, { passive: false });

// ---- deterministic states (default scene + ?shot= screenshots) ---------

const SHOT_STATES = {
  cover: {
    layout: "collage", title: "VICE HEAT", subtitle: "A FAN-MADE POSTER TRIBUTE",
    titleStyle: "sunset", grade: 0.75, photos: ["pier", "boulevard", "neon", "boardwalk", "pier"],
  },
  cover2: {
    layout: "spotlight", title: "NEON COUNTY", subtitle: "ONE MORE SUNSET TO STEAL",
    titleStyle: "classic", grade: 0.65, photos: ["boardwalk", "neon", "pier", "boulevard"],
  },
  cover3: {
    layout: "bands", title: "PALM CITY NIGHTS", subtitle: "A FAN-MADE POSTER TRIBUTE",
    titleStyle: "neon", grade: 0.8, photos: ["neon", "boardwalk", "boulevard"],
    // The wide banner panel centre-crops the boulevard photo onto a torso;
    // shifting it down frames the driver and the car instead.
    shift: { 2: 880 },
  },
  editor: {
    layout: "collage", title: "VICE HEAT", subtitle: "A FAN-MADE POSTER TRIBUTE",
    titleStyle: "sunset", grade: 0.75, photos: ["pier", "boulevard", "neon", "boardwalk", "pier"],
  },
};

async function applyState(def) {
  state.layout = def.layout;
  state.title = def.title;
  state.subtitle = def.subtitle;
  state.titleStyle = def.titleStyle;
  state.grade = { on: true, amount: def.grade };
  state.frame = true;
  state.panels = [];
  ensurePanels();
  document.querySelectorAll(".layout-btn").forEach((b) =>
    b.classList.toggle("active", b.dataset.layout === def.layout));
  titleInput.value = def.title;
  subtitleInput.value = def.subtitle;
  document.getElementById("titleStyle").value = def.titleStyle;
  gradeToggle.checked = true;
  gradeRange.value = Math.round(def.grade * 100);
  document.getElementById("frameToggle").checked = true;
  const loaded = await Promise.all(def.photos.map((key) => loadImage(SAMPLES[key])));
  def.photos.forEach((key, i) => {
    state.panels[i].img = loaded[i];
    state.panels[i].name = SAMPLE_LABELS[key];
    state.panels[i].dx = 0;
    state.panels[i].dy = (def.shift && def.shift[i]) || 0;
    state.panels[i].scale = i === 0 ? 1.12 : 1;
  });
  state.selected = 0;
  buildPanelList();
  render();
}

async function boot() {
  ensurePanels();
  buildPanelList();
  render();
  const shot = new URLSearchParams(location.search).get("shot");
  if (shot && SHOT_STATES[shot]) {
    if (shot === "editor") {
      document.body.classList.add("shot-editor");
    } else {
      document.body.classList.add("shot-cover");
      state.showSelection = false;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    await applyState(SHOT_STATES[shot]);
    if (document.fonts && document.fonts.load) {
      try { await document.fonts.load('80px "AntonLocal"'); } catch { /* fallback stack still renders */ }
    }
    render();
    document.title = `Vice Poster Studio — shot:${shot} ready`;
    return;
  }
  // First paint for a human visitor: the demo collage, ready to remix.
  await applyState(SHOT_STATES.cover);
}

boot();
