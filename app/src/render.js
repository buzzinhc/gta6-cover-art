// Vice Poster Studio — poster rendering engine.
// Pure canvas drawing: given a state object it paints the whole poster at
// whatever resolution the canvas is set to. No DOM access here except the
// images the studio hands in, so the same code path serves the live editor
// preview and the exported PNG.

export const LAYOUTS = {
  // Classic five-panel collage: one hero panel, two stacked at the side,
  // two along the bottom — the composition every box-art parody reaches for.
  collage: [
    { x: 0.00, y: 0.00, w: 0.60, h: 0.64 },
    { x: 0.60, y: 0.00, w: 0.40, h: 0.32 },
    { x: 0.60, y: 0.32, w: 0.40, h: 0.32 },
    { x: 0.00, y: 0.64, w: 0.52, h: 0.36 },
    { x: 0.52, y: 0.64, w: 0.48, h: 0.36 },
  ],
  // One big hero shot with a film-strip of three panels underneath.
  spotlight: [
    { x: 0.00, y: 0.00, w: 1.00, h: 0.70 },
    { x: 0.00, y: 0.70, w: 0.34, h: 0.30 },
    { x: 0.34, y: 0.70, w: 0.33, h: 0.30 },
    { x: 0.67, y: 0.70, w: 0.33, h: 0.30 },
  ],
  // Two panels up top over one wide banner panel.
  bands: [
    { x: 0.00, y: 0.00, w: 0.55, h: 0.52 },
    { x: 0.55, y: 0.00, w: 0.45, h: 0.52 },
    { x: 0.00, y: 0.52, w: 1.00, h: 0.48 },
  ],
};

export function panelRects(layoutName, W, H) {
  const frac = LAYOUTS[layoutName] ?? LAYOUTS.collage;
  return frac.map((p) => ({ x: p.x * W, y: p.y * H, w: p.w * W, h: p.h * H }));
}

const PLACEHOLDER_PAINTS = [
  ["#ff9a5c", "#e83e8c"],
  ["#37c6e8", "#5b4bd6"],
  ["#ffd76e", "#ff5e59"],
  ["#7bf1a8", "#1f9d8f"],
  ["#f78ae0", "#6a3df0"],
];

function drawPlaceholder(ctx, rect, index) {
  const [a, b] = PLACEHOLDER_PAINTS[index % PLACEHOLDER_PAINTS.length];
  const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  grad.addColorStop(0, a);
  grad.addColorStop(1, b);
  ctx.fillStyle = grad;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  // A simple sun disc + horizon so an empty panel still reads as a scene.
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.fillStyle = "rgba(255,255,255,.55)";
  ctx.beginPath();
  ctx.arc(rect.x + rect.w * 0.68, rect.y + rect.h * 0.36, rect.h * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(20,8,40,.35)";
  ctx.fillRect(rect.x, rect.y + rect.h * 0.72, rect.w, rect.h * 0.28);
  ctx.restore();
  ctx.fillStyle = "rgba(255,255,255,.92)";
  ctx.font = `700 ${Math.max(15, rect.h * 0.075)}px "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("DROP A PHOTO HERE", rect.x + rect.w / 2, rect.y + rect.h * 0.9);
}

function drawPhoto(ctx, img, rect, panel, grade) {
  const scale = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * (panel.scale || 1);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = rect.x + (rect.w - dw) / 2 + (panel.dx || 0);
  const dy = rect.y + (rect.h - dh) / 2 + (panel.dy || 0);
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (grade.on) {
    const s = 1 + 0.45 * grade.amount;
    const c = 1 + 0.18 * grade.amount;
    const b = 1 + 0.03 * grade.amount;
    ctx.filter = `saturate(${s.toFixed(3)}) contrast(${c.toFixed(3)}) brightness(${b.toFixed(3)})`;
  }
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.filter = "none";
  if (grade.on) {
    // Vice wash: warm pink at the top, tangerine through the middle,
    // deep violet shade pooling at the bottom.
    const wash = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
    wash.addColorStop(0.0, `rgba(255, 64, 130, ${(0.26 * grade.amount).toFixed(3)})`);
    wash.addColorStop(0.45, `rgba(255, 150, 64, ${(0.10 * grade.amount).toFixed(3)})`);
    wash.addColorStop(1.0, `rgba(24, 0, 54, ${(0.38 * grade.amount).toFixed(3)})`);
    ctx.fillStyle = wash;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  }
  ctx.restore();
}

const TITLE_FONT = '"AntonLocal", "Arial Black", Impact, sans-serif';

function fitFontSize(ctx, text, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `${size}px ${TITLE_FONT}`;
  const width = ctx.measureText(text).width;
  if (width > maxWidth && width > 0) size = Math.floor(size * (maxWidth / width));
  return Math.max(20, size);
}

function drawTitle(ctx, W, H, state) {
  const title = (state.title || "").trim();
  if (!title) return;
  const cx = W / 2;
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
  const size = fitFontSize(ctx, title.toUpperCase(), W * 0.94, W * 0.155);
  ctx.font = `${size}px ${TITLE_FONT}`;
  const baseline = H * 0.035 + size;
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;

  if (state.titleStyle === "neon") {
    ctx.shadowColor = "rgba(255, 45, 150, .95)";
    ctx.shadowBlur = size * 0.30;
    ctx.strokeStyle = "#2a0730";
    ctx.lineWidth = size * 0.14;
    ctx.strokeText(title.toUpperCase(), cx, baseline);
    ctx.fillStyle = "#ff6ec7";
    ctx.fillText(title.toUpperCase(), cx, baseline);
    ctx.shadowBlur = 0;
  } else {
    ctx.shadowColor = "rgba(10, 0, 24, .55)";
    ctx.shadowOffsetY = size * 0.06;
    ctx.shadowBlur = size * 0.05;
    ctx.strokeStyle = "#160a24";
    ctx.lineWidth = size * 0.17;
    ctx.strokeText(title.toUpperCase(), cx, baseline);
    if (state.titleStyle === "sunset") {
      const grad = ctx.createLinearGradient(0, baseline - size, 0, baseline);
      grad.addColorStop(0, "#ffe27a");
      grad.addColorStop(0.55, "#ff8a5c");
      grad.addColorStop(1, "#ff4d9d");
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = "#ffffff";
    }
    ctx.fillText(title.toUpperCase(), cx, baseline);
    ctx.shadowColor = "transparent";
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 0;
  }

  const sub = (state.subtitle || "").trim();
  if (sub) {
    const s2 = Math.max(16, Math.round(W * 0.030));
    ctx.font = `700 ${s2}px "Segoe UI", Arial, sans-serif`;
    if ("letterSpacing" in ctx) ctx.letterSpacing = `${Math.round(s2 * 0.32)}px`;
    const y2 = baseline + s2 * 1.55;
    ctx.lineWidth = s2 * 0.16;
    ctx.strokeStyle = "rgba(16, 6, 30, .9)";
    ctx.strokeText(sub.toUpperCase(), cx, y2);
    ctx.fillStyle = "#ffe9a8";
    ctx.fillText(sub.toUpperCase(), cx, y2);
    if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
  }
  ctx.restore();
}

export function drawPoster(ctx, W, H, state) {
  const rects = panelRects(state.layout, W, H);
  const gutter = Math.max(4, Math.round(W * 0.0075));
  // White gutters between panels, like the seams on a printed box cover.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  rects.forEach((raw, i) => {
    const rect = {
      x: raw.x + gutter / 2,
      y: raw.y + gutter / 2,
      w: raw.w - gutter,
      h: raw.h - gutter,
    };
    const panel = state.panels[i] || {};
    if (panel.img) drawPhoto(ctx, panel.img, rect, panel, state.grade);
    else drawPlaceholder(ctx, rect, i);
    ctx.strokeStyle = "rgba(12, 4, 28, .35)";
    ctx.lineWidth = Math.max(1.5, W * 0.0016);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  });
  if (state.frame) {
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = Math.max(6, W * 0.011);
    ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, W - ctx.lineWidth, H - ctx.lineWidth);
    ctx.strokeStyle = "#160a24";
    ctx.lineWidth = Math.max(2, W * 0.0022);
    const inset = Math.max(6, W * 0.011);
    ctx.strokeRect(inset, inset, W - inset * 2, H - inset * 2);
  }
  // The selection outline goes on after the frame so the frame's white band
  // cannot paint over it at the poster's edges (the title still wins).
  if (state.selected >= 0 && state.showSelection) {
    const raw = rects[state.selected];
    if (raw) {
      ctx.save();
      ctx.strokeStyle = "#ff4d9d";
      ctx.lineWidth = Math.max(3, W * 0.004);
      ctx.setLineDash([W * 0.02, W * 0.012]);
      ctx.strokeRect(raw.x + gutter / 2, raw.y + gutter / 2, raw.w - gutter, raw.h - gutter);
      ctx.restore();
    }
  }
  drawTitle(ctx, W, H, state);
}
