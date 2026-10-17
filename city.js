// city.js: SolarPunk Kyrgyzstan painted scene (2D canvas, no deps).
// API: const city = createCity(stageEl); city.update(stats, P, risk); city.setEnding('win'|'lose'|null); city.dispose();

const TAU = Math.PI * 2;
const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const css = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
function rng(seed) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

const LH = 560;
const ROOF_Y = 446; // top of parapet
const BASE_Y = 402; // city ground

export function createCity(container) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;display:block';
  container.insertBefore(canvas, container.firstChild);
  const ctx = canvas.getContext('2d');

  let cw = 900, ch = 560, dpr = 1, S = 1, LW = 900;
  const cur = { P: 62, risk: 0, literacy: 50, poverty: 40, energy: 60, debt: 60, nature: 60, happiness: 60, tourism: 40, economy: 50, culture: 50, tech: 40, win: 0, lose: 0 };
  const tgt = { ...cur };
  let ending = null;

  // layout data
  let mtFar, mtNear, peaksFar, peaksNear, blds, farBlds, yurts, trees, animals, clouds, turbines, cars, drops, birds, hills = {};
  const smokeP = [], embers = [], splashes = [], sparks = [], confetti = [];
  let tm = 0, last = performance.now(), raf = 0, disposed = false;
  let flash = 0, nextFlash = 3, bolt = null, nextFw = 0;
  let D = {};

  // ---------- layout ----------
  function ridge(seed, base, amp, peaksCount) {
    const r = rng(seed); const peaks = [];
    for (let i = 0; i < peaksCount; i++) peaks.push({ c: (i + r() * 0.8) / peaksCount * (LW + 160) - 80, w: 70 + r() * 110, h: amp * (0.45 + r() * 0.55) });
    const n = Math.ceil((LW + 160) / 6) + 1; const ys = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = i * 6 - 80; let h = 10;
      for (const p of peaks) h = Math.max(h, p.h * (1 - Math.abs(x - p.c) / p.w));
      h += Math.sin(x * 0.31 + seed) * 2.2 + Math.sin(x * 0.12) * 3.5 * (h / amp);
      ys[i] = base - h;
    }
    return { ys, peaks, base };
  }
  function hillY(x) {
    let y = 380 + 13 * Math.sin(x * 0.012 + 0.6) + 6 * Math.sin(x * 0.031 + 2) - 20 * Math.exp(-(((x - LW * 0.16) / (LW * 0.15)) ** 2)) - 10 * Math.exp(-(((x - LW * 0.36) / (LW * 0.08)) ** 2));
    return lerp(y, BASE_Y, sstep(LW * 0.46, LW * 0.58, x));
  }
  function layout() {
    mtFar = ridge(11, 308, 170, Math.max(5, Math.round(LW / 150)));
    mtNear = ridge(23, 348, 120, Math.max(6, Math.round(LW / 120)));
    let r = rng(7);
    blds = []; let x = LW * 0.5 - 6;
    while (x < LW + 30) {
      const w = 32 + r() * 30;
      const edge = sstep(LW * 0.52, LW * 0.78, x);
      blds.push({ x, w, hOld: 44 + r() * 56, hNew: (95 + r() * 150) * lerp(0.5, 1, edge), rank: r(), thr: r() < 0.5 ? r() * 0.8 : 9, seed: r() * 1000, wr: Array.from({ length: 220 }, () => r()), kind: Math.floor(r() * 3), edge });
      x += w * 0.92 + 2 + r() * 8;
    }
    farBlds = []; x = LW * 0.3;
    while (x < LW * 0.56) { const w = 14 + r() * 22; farBlds.push({ x, w, h: 24 + r() * 56 }); x += w * 0.95; }
    yurts = []; r = rng(31);
    const nY = 8;
    for (let i = 0; i < nY; i++) {
      const fx = LW * (0.05 + (i / (nY - 1)) * 0.32) + (r() - 0.5) * 16;
      yurts.push({ x: fx, w: 40 + r() * 22, rank: i < 3 ? 0 : (i - 2) / (nY - 2), ly: (r() - 0.5) * 18, seed: r() * 100, door: r() > 0.5 });
    }
    trees = []; r = rng(55);
    for (let i = 0; i < 46; i++) {
      const tx = r() * (LW + 40) - 20;
      trees.push({ x: tx, dy: 4 + r() * 38, s: 0.7 + r() * 0.8, kind: r() < 0.55 ? 0 : 1, rank: r(), seed: r() });
    }
    animals = [];
    for (let i = 0; i < 9; i++) animals.push({ x: LW * (0.1 + r() * 0.3), dy: 8 + r() * 22, kind: i < 2 ? 'horse' : 'sheep', ph: r() * 6, sp: 0.15 + r() * 0.2 });
    clouds = [];
    for (let i = 0; i < 9; i++) clouds.push({ x: r() * (LW + 300) - 150, y: 40 + r() * 150, s: 0.7 + r() * 1.1, sp: 4 + r() * 8, rank: r(), puffs: Array.from({ length: 6 }, (_, k) => ({ dx: (k - 2.5) * 22 + r() * 8, dy: -Math.abs(Math.sin(k * 1.3)) * 10 - r() * 6, r: 16 + r() * 14 })) });
    turbines = [{ x: LW * 0.2, y: hillY(LW * 0.2) - 2, h: 40, sp: 1 }, { x: LW * 0.31, y: hillY(LW * 0.31) - 2, h: 32, sp: 0.8 }, { x: LW * 0.665, y: BASE_Y, h: 60, sp: 1.2 }];
    cars = [];
    for (let i = 0; i < 16; i++) cars.push({ lane: i % 2, x: r() * (LW + 100), sp: 18 + r() * 30, col: [[220, 70, 60], [240, 200, 70], [70, 140, 200], [240, 240, 240], [60, 170, 110], [150, 80, 170]][i % 6], rank: i / 16 });
    drops = Array.from({ length: 420 }, () => ({ x: r() * (LW + 260), y: r() * LH, v: 520 + r() * 260, l: 9 + r() * 10, ground: 430 + r() * 125 }));
    birds = Array.from({ length: 7 }, (_, i) => ({ x: r() * LW, y: 70 + r() * 110, sp: 14 + r() * 14, ph: r() * 6, s: 0.8 + r() * 0.6, rank: i / 7 }));
  }

  function resize() {
    cw = container.clientWidth || 900; ch = container.clientHeight || 560;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(cw * dpr)); canvas.height = Math.max(1, Math.round(ch * dpr));
    S = ch / LH; LW = cw / S;
    layout();
  }
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => resize()) : null;
  if (ro) ro.observe(container);
  resize();

  // ---------- state ----------
  function derive() {
    const c = cur, win = c.win, lose = c.lose;
    const P = lerp(lerp(c.P, 94, win), 8, lose);
    const hap = lerp(lerp(c.happiness, 90, win), 6, lose);
    const d = {};
    d.P = P;
    d.golden = sstep(60, 80, P); d.gold76 = sstep(72, 80, P);
    d.haze = sstep(70, 52, P) * 0.7;
    d.gloom = Math.max(sstep(55, 30, P), sstep(40, 20, hap) * 0.8, lose);
    d.rain = clamp(Math.max(sstep(50, 34, P) * 0.65 + sstep(36, 18, P) * 0.35, sstep(36, 16, hap) * 0.6, lose)) * (1 - win);
    d.fire = clamp(Math.max(sstep(0.72, 0.9, c.risk), lose)) * (1 - win);
    d.smoke = clamp(Math.max(sstep(0.5, 0.75, c.risk), lose)) * (1 - win * 0.8);
    d.smog = sstep(40, 12, c.nature);
    d.nat = sstep(5, 85, c.nature);
    d.brown = sstep(48, 12, c.nature);
    d.blackout = sstep(55, 15, c.energy) * (1 - win * 0.8);
    d.tech = clamp(c.tech / 100); d.eco = clamp(c.economy / 100); d.tour = clamp(c.tourism / 100); d.cult = clamp(c.culture / 100);
    d.pov = sstep(55, 92, c.poverty); d.debt = clamp((c.debt - 80) / 120);
    d.win = win; d.lose = lose;
    d.good = sstep(46, 80, P);
    d.storm = Math.max(lose, d.fire * 0.8, sstep(0.55, 0.95, d.rain) * 0.5);
    d.dark = clamp(d.gloom * 0.9 + d.blackout * 0.45 + d.fire * 0.4);
    d.wind = 0.6 + d.tech * 1.3 + d.storm * 1.6;
    return d;
  }

  // ---------- helpers ----------
  function poly(pts, close = true) { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); if (close) ctx.closePath(); }
  function glow(x, y, r, col, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, css(col, a)); g.addColorStop(1, css(col, 0));
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  function parallax(d) { return Math.sin(tm * 0.07 + d) * 7 * d; }

  let SKY = null;
  function skyColors() {
    let top = [52, 126, 205], mid = [116, 184, 226], hor = [250, 222, 168];
    top = mix(top, [150, 170, 190], D.haze); mid = mix(mid, [205, 212, 212], D.haze); hor = mix(hor, [225, 220, 205], D.haze);
    top = mix(top, [70, 120, 196], D.golden * 0.5); mid = mix(mid, [255, 196, 130], D.gold76 * 0.6 + D.golden * 0.15); hor = mix(hor, [255, 170, 80], D.golden * 0.7);
    top = mix(top, [66, 72, 82], D.gloom); mid = mix(mid, [104, 110, 116], D.gloom); hor = mix(hor, [150, 152, 150], D.gloom);
    mid = mix(mid, [150, 120, 84], D.smog * 0.35); hor = mix(hor, [166, 128, 82], D.smog * 0.45);
    top = mix(top, [38, 8, 10], D.fire * 0.9); mid = mix(mid, [112, 28, 16], D.fire * 0.9); hor = mix(hor, [232, 92, 28], D.fire * 0.95);
    top = mix(top, [88, 112, 224], D.win * 0.8); mid = mix(mid, [255, 150, 140], D.win * 0.7); hor = mix(hor, [255, 206, 110], D.win * 0.9);
    return { top, mid, hor };
  }

  // ---------- layers ----------
  function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, 380);
    g.addColorStop(0, css(SKY.top)); g.addColorStop(0.55, css(SKY.mid)); g.addColorStop(1, css(SKY.hor));
    ctx.fillStyle = g; ctx.fillRect(-100, -10, LW + 200, 420);
  }
  function sunPos() { return { x: lerp(LW * 0.27, LW * 0.5, D.win), y: lerp(212, 292, D.win) }; }
  function drawSun() {
    const { x, y } = sunPos();
    const vis = clamp((1 - D.gloom * 1.15) * (1 - D.fire) * (1 - D.haze * 0.4)) * (0.55 + 0.45 * D.good);
    if (vis > 0.02) {
      const R = lerp(26, 34, D.golden) + D.win * 30;
      ctx.globalCompositeOperation = 'lighter';
      glow(x, y, 230 + D.golden * 120 + D.win * 220, [255, 214, 140], 0.5 * vis * (0.55 + D.golden * 0.6));
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = css(mix([255, 246, 210], [255, 214, 130], D.golden), vis);
      ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill();
    }
    // light shafts at golden hour
    const sh = D.gold76 * (1 - D.gloom) * (1 - D.win);
    if (sh > 0.02 || D.win > 0.02) {
      const a = Math.max(sh * 0.16, D.win * 0.22);
      ctx.globalCompositeOperation = 'lighter';
      const n = D.win > 0.02 ? 22 : 6;
      for (let i = 0; i < n; i++) {
        const ang = D.win > 0.02 ? (i / n) * TAU + tm * 0.05 : -0.35 + i * 0.26 + Math.sin(tm * 0.2 + i) * 0.03;
        const wd = D.win > 0.02 ? 0.05 : 0.07; const L = 760;
        const g = ctx.createLinearGradient(x, y, x + Math.cos(ang) * L, y + Math.sin(ang) * L);
        g.addColorStop(0, css([255, 224, 150], a)); g.addColorStop(1, css([255, 224, 150], 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(ang - wd) * L, y + Math.sin(ang - wd) * L); ctx.lineTo(x + Math.cos(ang + wd) * L, y + Math.sin(ang + wd) * L); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    }
  }
  function drawClouds() {
    const cover = clamp(0.28 + D.gloom * 0.9 + D.haze * 0.4);
    const col = mix(mix([255, 255, 255], [214, 220, 226], D.haze), [64, 68, 76], D.gloom);
    const colF = mix(col, [150, 44, 22], D.fire * 0.85);
    for (const c of clouds) {
      c.x += c.sp * (0.5 + D.wind * 0.5) * lastDt; if (c.x > LW + 160) c.x = -180;
      const a = clamp((cover - c.rank * 0.75) * 2.4) * 0.92;
      if (a < 0.02) continue;
      ctx.fillStyle = css(colF, a);
      ctx.beginPath();
      for (const p of c.puffs) { const px = c.x + p.dx * c.s, py = c.y + p.dy * c.s; ctx.moveTo(px + p.r * c.s, py); ctx.arc(px, py, p.r * c.s, 0, TAU); }
      ctx.fill();
      ctx.fillStyle = css(mix(colF, [20, 20, 30], 0.28), a * 0.55);
      ctx.beginPath(); ctx.ellipse(c.x, c.y + 10 * c.s, 62 * c.s, 8 * c.s, 0, 0, TAU); ctx.fill();
      if (D.fire > 0.05) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = css([255, 90, 30], a * 0.18 * D.fire); ctx.beginPath(); ctx.ellipse(c.x, c.y + 14 * c.s, 70 * c.s, 8 * c.s, 0, 0, TAU); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }
    }
  }
  function drawMountain(mt, colTop, colBot, snowLine, snowCol) {
    const ys = mt.ys, n = ys.length;
    const g = ctx.createLinearGradient(0, mt.base - 180, 0, mt.base + 10);
    g.addColorStop(0, css(colTop)); g.addColorStop(1, css(colBot));
    const path = () => { ctx.beginPath(); ctx.moveTo(-80, LH); for (let i = 0; i < n; i++) ctx.lineTo(i * 6 - 80, ys[i]); ctx.lineTo(LW + 80, LH); ctx.closePath(); };
    path(); ctx.fillStyle = g; ctx.fill();
    ctx.save(); path(); ctx.clip();
    // shaded facets
    for (const p of mt.peaks) {
      ctx.fillStyle = css([36, 48, 86], 0.17);
      ctx.beginPath(); ctx.moveTo(p.c, mt.base - p.h); ctx.lineTo(p.c + p.w * 0.9, mt.base); ctx.lineTo(p.c + p.w * 0.1, mt.base); ctx.closePath(); ctx.fill();
    }
    // snow
    ctx.beginPath(); ctx.moveTo(-80, -10);
    for (let i = 0; i < n; i += 1) { const x = i * 6 - 80; ctx.lineTo(x, snowLine + Math.sin(x * 0.09) * 7 + Math.sin(x * 0.23) * 4 + Math.sin(x * 0.04 + 2) * 12); }
    ctx.lineTo(LW + 80, -10); ctx.closePath(); ctx.fillStyle = css(snowCol, 0.96); ctx.fill();
    ctx.restore();
  }
  function drawMountains() {
    const warm = D.golden * 0.5, brown = D.brown * 0.45;
    let hz = SKY.hor;
    let farTop = mix(mix([140, 160, 204], [196, 168, 168], warm), [150, 140, 128], brown);
    let nearTop = mix(mix([96, 120, 160], [160, 130, 130], warm), [120, 102, 86], brown);
    farTop = mix(farTop, [96, 100, 108], D.gloom * 0.7); nearTop = mix(nearTop, [70, 74, 82], D.gloom * 0.7);
    farTop = mix(farTop, [96, 40, 40], D.fire * 0.6); nearTop = mix(nearTop, [60, 24, 24], D.fire * 0.6);
    const snowCol = mix(mix([246, 250, 255], [255, 232, 200], warm), [190, 190, 196], D.gloom * 0.6);
    const sc = mix(snowCol, [255, 170, 130], D.fire * 0.5);
    const n = D.nat;
    ctx.save(); ctx.translate(parallax(0.5), 0);
    drawMountain(mtFar, farTop, mix(farTop, hz, 0.6), lerp(160, 262, n), sc);
    ctx.restore();
    ctx.save(); ctx.translate(parallax(0.8), 0);
    drawMountain(mtNear, nearTop, mix(nearTop, hz, 0.45), lerp(222, 288, n), sc);
    ctx.restore();
    // horizon haze
    const g = ctx.createLinearGradient(0, 260, 0, 400);
    g.addColorStop(0, css(SKY.hor, 0)); g.addColorStop(1, css(SKY.hor, 0.6 + D.haze * 0.3));
    ctx.fillStyle = g; ctx.fillRect(-100, 260, LW + 200, 140);
  }
  function drawFarCity() {
    ctx.save(); ctx.translate(parallax(1.0), 0);
    const c = css(mix(SKY.hor, [110, 140, 160], 0.35), 0.8);
    ctx.fillStyle = c;
    for (const b of farBlds) { const f = sstep(LW * 0.3, LW * 0.5, b.x); ctx.globalAlpha = 0.5 + 0.3 * f; ctx.fillRect(b.x, 372 - b.h * (0.6 + 0.4 * D.tech), b.w, b.h * (0.6 + 0.4 * D.tech) + 30); }
    ctx.globalAlpha = 1; ctx.restore();
  }

  function grass() {
    let a = mix([104, 176, 78], [150, 128, 74], D.brown);
    let b = mix([58, 126, 58], [112, 92, 56], D.brown);
    a = mix(a, [120, 130, 120], D.gloom * 0.5); b = mix(b, [70, 80, 76], D.gloom * 0.5);
    a = mix(a, [190, 150, 70], D.golden * 0.18); a = mix(a, [110, 50, 30], D.fire * 0.5); b = mix(b, [60, 24, 20], D.fire * 0.5);
    return { a, b };
  }
  function drawTree(t, x, y, brown, nat) {
    const sc = t.s * (0.65 + 0.45 * nat);
    const leaf = 1 - clamp((brown - t.rank * 0.55) * 3);
    // trunk
    ctx.strokeStyle = css(mix([96, 66, 40], [70, 56, 44], brown), 1); ctx.lineWidth = 2 * sc;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 14 * sc); ctx.stroke();
    if (leaf < 0.98) {
      ctx.lineWidth = 1.2 * sc; ctx.globalAlpha = 1 - leaf;
      ctx.beginPath(); ctx.moveTo(x, y - 8 * sc); ctx.lineTo(x - 6 * sc, y - 15 * sc); ctx.moveTo(x, y - 11 * sc); ctx.lineTo(x + 6 * sc, y - 19 * sc); ctx.moveTo(x, y - 14 * sc); ctx.lineTo(x - 3 * sc, y - 23 * sc); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (leaf > 0.02) {
      const gcol = mix(mix([40, 112, 50], [110, 100, 50], brown), [30, 50, 40], D.gloom * 0.4);
      const g2 = mix(gcol, [30, 20, 20], D.fire * 0.5);
      ctx.fillStyle = css(g2, leaf);
      if (t.kind === 0) { for (let k = 0; k < 3; k++) { const w = (9 - k * 2.4) * sc, yy = y - (7 + k * 7) * sc; ctx.beginPath(); ctx.moveTo(x - w, yy); ctx.lineTo(x, yy - 12 * sc); ctx.lineTo(x + w, yy); ctx.fill(); } }
      else { ctx.beginPath(); ctx.arc(x, y - 17 * sc, 8 * sc, 0, TAU); ctx.arc(x - 5 * sc, y - 13 * sc, 6 * sc, 0, TAU); ctx.arc(x + 5 * sc, y - 13 * sc, 6 * sc, 0, TAU); ctx.fill(); }
    }
  }
  function drawYurt(y, x, base, sc, a) {
    const w = y.w * sc, wallH = w * 0.34, roofH = w * 0.28;
    const warm = D.golden * 0.4;
    const felt = mix(mix([248, 244, 232], [255, 232, 196], warm), [150, 152, 156], D.gloom * 0.6);
    const feltD = mix(felt, [90, 100, 130], 0.28);
    const fr = D.fire;
    ctx.globalAlpha = a;
    // wall
    ctx.fillStyle = css(mix(felt, [200, 70, 40], fr * 0.4)); ctx.fillRect(x - w / 2, base - wallH, w, wallH);
    // roof dome
    const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0); g.addColorStop(0, css(felt)); g.addColorStop(1, css(feltD));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x - w * 0.56, base - wallH); ctx.quadraticCurveTo(x - w * 0.34, base - wallH - roofH * 1.05, x, base - wallH - roofH); ctx.quadraticCurveTo(x + w * 0.34, base - wallH - roofH * 1.05, x + w * 0.56, base - wallH); ctx.closePath(); ctx.fill();
    // wall shade right
    ctx.fillStyle = css(feltD, 0.45); ctx.fillRect(x + w * 0.2, base - wallH, w * 0.3, wallH);
    // ropes
    ctx.strokeStyle = css([120, 110, 100], 0.55); ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(x - w / 2, base - wallH * 0.75); ctx.lineTo(x + w / 2, base - wallH * 0.75); ctx.moveTo(x - w * 0.5, base - wallH); ctx.lineTo(x + w * 0.5, base - wallH); ctx.stroke();
    // ornament band
    ctx.fillStyle = css([196, 52, 44], 0.95); ctx.fillRect(x - w / 2, base - wallH * 0.28, w, wallH * 0.2);
    ctx.fillStyle = css([250, 214, 90], 0.9);
    for (let k = 0; k < w / 6; k++) { ctx.beginPath(); const px = x - w / 2 + 3 + k * 6; ctx.moveTo(px, base - wallH * 0.18); ctx.lineTo(px + 2.4, base - wallH * 0.28); ctx.lineTo(px + 4.8, base - wallH * 0.18); ctx.fill(); }
    // door
    ctx.fillStyle = css([140, 70, 36]); ctx.fillRect(x - w * 0.09, base - wallH * 0.82, w * 0.18, wallH * 0.82);
    ctx.fillStyle = css([226, 170, 60], 0.9); ctx.fillRect(x - w * 0.015, base - wallH * 0.82, w * 0.03, wallH * 0.82);
    // crown
    ctx.fillStyle = css([90, 70, 54]); ctx.beginPath(); ctx.arc(x, base - wallH - roofH, w * 0.07, Math.PI, 0); ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawHills() {
    const { a, b } = grass();
    ctx.save(); ctx.translate(parallax(0.9), 0);
    // far green ridge
    ctx.beginPath(); ctx.moveTo(-60, LH);
    for (let x = -60; x <= LW + 60; x += 14) ctx.lineTo(x, 352 + 16 * Math.sin(x * 0.0085 + 2) + 7 * Math.sin(x * 0.021));
    ctx.lineTo(LW + 60, LH); ctx.closePath();
    ctx.fillStyle = css(mix(mix(a, SKY.hor, 0.4), [200, 200, 205], 0), 1); ctx.fill();
    ctx.restore();
    ctx.save(); ctx.translate(parallax(1.2), 0);
    // main meadow
    const g = ctx.createLinearGradient(0, 340, 0, 470); g.addColorStop(0, css(a)); g.addColorStop(1, css(b));
    ctx.beginPath(); ctx.moveTo(-60, LH);
    for (let x = -60; x <= LW + 60; x += 10) ctx.lineTo(x, hillY(x));
    ctx.lineTo(LW + 60, LH); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
    // light sheen on slopes
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = css([255, 214, 120], 0.07 * D.golden * (1 - D.gloom));
    ctx.beginPath(); ctx.moveTo(-60, 420); for (let x = -60; x <= LW * 0.5; x += 10) ctx.lineTo(x, hillY(x) + 8); ctx.lineTo(LW * 0.5, 420); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    // turbines on hills
    for (let i = 0; i < 2; i++) drawTurbine(turbines[i]);
    // trees left side
    const lim = LW * 0.5;
    for (const t of trees) { if (t.x > lim + 10) continue; const y = hillY(t.x) + t.dy; if (y > 436) continue; drawTree(t, t.x, y, D.brown, D.nat); }
    // yurts
    const nvis = lerp(3.4, 8, D.cult);
    for (const yr of yurts) {
      const k = clamp(nvis - (yr.rank * 5 + 1.2) * 1.0 + (yr.rank === 0 ? 5 : 0), 0, 1);
      if (yr.rank > 0 && k <= 0.01) continue;
      const kk = yr.rank === 0 ? 1 : k;
      const by = hillY(yr.x) + 14 + yr.ly;
      drawYurt(yr, yr.x, by, lerp(0.6, 1, kk), kk);
      // chimney smoke source
      if (D.rain < 0.6 && Math.random() < 0.02 * lastDt * 60 && smokeP.length < 160) smokeP.push({ x: yr.x + 4, y: by - yr.w * 0.6, vx: 5 + D.wind * 4, vy: -12 - Math.random() * 6, r: 2.5, life: 0, max: 3.5, a: 0.35, col: [235, 235, 235], g: 3.5 });
      // festive flags on culture
      if (D.cult > 0.45 && yr.rank < D.cult - 0.2) drawFlags(yr.x - yr.w * 0.5, by - yr.w * 0.62, yr.x - yr.w * 1.2, by - yr.w * 0.42, yr.seed);
    }
    // animals
    for (const an of animals) {
      const x = an.x + Math.sin(tm * an.sp + an.ph) * 16; const y = hillY(x) + an.dy + 14;
      if (an.kind === 'sheep') {
        ctx.fillStyle = css(mix([246, 244, 238], [150, 150, 150], D.gloom * 0.5)); ctx.beginPath(); ctx.ellipse(x, y - 4, 4.5, 3.4, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = css([60, 56, 54]); ctx.beginPath(); ctx.arc(x + 4.4, y - 4.6, 1.7, 0, TAU); ctx.fill(); ctx.fillRect(x - 2.5, y - 1.5, 1, 3); ctx.fillRect(x + 1.5, y - 1.5, 1, 3);
      } else {
        ctx.fillStyle = css([112, 70, 40]); ctx.beginPath(); ctx.ellipse(x, y - 8, 8.5, 4, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = css([112, 70, 40]); ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(x + 6, y - 9); ctx.lineTo(x + 10, y - 15); ctx.stroke();
        ctx.lineWidth = 1.5; ctx.strokeStyle = css([70, 44, 28]); ctx.beginPath(); ctx.moveTo(x - 6, y - 5); ctx.lineTo(x - 6.5, y); ctx.moveTo(x - 3, y - 5); ctx.lineTo(x - 3, y); ctx.moveTo(x + 4, y - 5); ctx.lineTo(x + 4.5, y); ctx.moveTo(x + 6.5, y - 5); ctx.lineTo(x + 7, y); ctx.stroke();
      }
    }
    // tourists, flags and balloons
    if (D.tour > 0.3) {
      const n = Math.floor(2 + D.tour * 6);
      for (let i = 0; i < n; i++) {
        const x = LW * (0.14 + i * 0.045) + Math.sin(tm * 0.2 + i) * 3; const y = hillY(x) + 30 + (i % 3) * 5;
        ctx.fillStyle = css([[230, 70, 70], [60, 140, 220], [250, 200, 60], [90, 180, 110]][i % 4]); ctx.fillRect(x - 1.5, y - 8, 3, 6);
        ctx.fillStyle = css([240, 200, 170]); ctx.beginPath(); ctx.arc(x, y - 10, 1.8, 0, TAU); ctx.fill();
      }
    }
    ctx.restore();
  }
  function drawFlags(x1, y1, x2, y2, seed) {
    ctx.strokeStyle = css([80, 70, 60], 0.7); ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo((x1 + x2) / 2, Math.max(y1, y2) + 6, x2, y2); ctx.stroke();
    const cols = [[230, 60, 60], [250, 200, 60], [60, 150, 220], [250, 250, 250], [90, 180, 100]];
    for (let i = 1; i < 7; i++) {
      const t = i / 7; const px = lerp(x1, x2, t); const py = lerp(y1, y2, t) + Math.sin(t * Math.PI) * 6 + 1;
      const fl = Math.sin(tm * 4 + i + seed) * 1.2;
      ctx.fillStyle = css(cols[i % 5]); ctx.beginPath(); ctx.moveTo(px - 1.8, py); ctx.lineTo(px + 1.8, py); ctx.lineTo(px + fl, py + 5); ctx.fill();
    }
  }
  function drawTurbine(t) {
    const hub = t.y - t.h;
    ctx.strokeStyle = css(mix([240, 242, 246], [150, 150, 156], D.gloom * 0.6)); ctx.lineWidth = 2.2 * (t.h / 60 + 0.4);
    ctx.beginPath(); ctx.moveTo(t.x, t.y); ctx.lineTo(t.x, hub); ctx.stroke();
    t.ang = (t.ang || 0) + D.wind * t.sp * lastDt * 1.6;
    ctx.lineWidth = 1.7 * (t.h / 60 + 0.4);
    ctx.beginPath();
    for (let k = 0; k < 3; k++) { const a = t.ang + k * TAU / 3; ctx.moveTo(t.x, hub); ctx.lineTo(t.x + Math.cos(a) * t.h * 0.55, hub + Math.sin(a) * t.h * 0.55); }
    ctx.stroke();
    ctx.fillStyle = css([200, 200, 205]); ctx.beginPath(); ctx.arc(t.x, hub, 2, 0, TAU); ctx.fill();
  }

  // ----- city -----
  function drawCrane(x, y, sc, ph) {
    ctx.strokeStyle = css([226, 160, 40], 0.95); ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = 1.6 * sc;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 52 * sc); ctx.stroke();
    const sw = Math.cos(tm * 0.25 + ph);
    ctx.lineWidth = 1.3 * sc; ctx.beginPath(); ctx.moveTo(x - 8 * sc * sw, y - 52 * sc); ctx.lineTo(x + 32 * sc * sw, y - 52 * sc); ctx.stroke();
    ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(x + 24 * sc * sw, y - 52 * sc); ctx.lineTo(x + 24 * sc * sw, y - 36 * sc + Math.sin(tm * 0.6) * 3); ctx.stroke();
    ctx.fillRect(x + 22 * sc * sw, y - 36 * sc + Math.sin(tm * 0.6) * 3, 4 * sc, 3 * sc);
  }
  function buildingBase(i, b) {
    const m = clamp((D.tech - b.rank) * 4 + 0.5);
    const ab = clamp((D.debt - b.thr) * 4);
    return { m, ab, h: lerp(b.hOld, b.hNew, m) };
  }
  const fireSpots = [[0.22, 0, 0.12], [0.75, 0, 0.35], [0.5, 0.3, 0.55], [0.3, 0.58, 0.78]];

  function drawBuilding(b, i) {
    const { m, ab, h } = buildingBase(i, b);
    const x = b.x, w = b.w, top = BASE_Y - h;
    const edgeCalm = lerp(0.55, 1, b.edge); // calmer in the middle band
    // colors
    const glassTop = mix([150, 224, 232], [255, 214, 160], D.golden * 0.4);
    const glassBot = mix([60, 140, 170], [200, 140, 100], D.golden * 0.25);
    let oldC = mix([186, 180, 168], [212, 188, 150], D.golden * 0.4);
    let cTop = mix(oldC, glassTop, m), cBot = mix(mix(oldC, [138, 132, 124], 0.5), glassBot, m);
    const dull = clamp(D.gloom * 0.85 + D.pov * 0.25);
    cTop = mix(cTop, [108, 112, 118], dull); cBot = mix(cBot, [70, 74, 80], dull);
    cTop = mix(cTop, SKY.hor, (1 - edgeCalm) * 0.5); cBot = mix(cBot, SKY.hor, (1 - edgeCalm) * 0.5);
    cTop = mix(cTop, [90, 30, 24], D.fire * 0.45); cBot = mix(cBot, [60, 20, 18], D.fire * 0.45);
    const g = ctx.createLinearGradient(0, top, 0, BASE_Y); g.addColorStop(0, css(cTop)); g.addColorStop(1, css(cBot));
    ctx.fillStyle = g;
    if (b.kind === 1 && m > 0.3) { // stepped tower
      ctx.fillRect(x, top, w, h); ctx.fillRect(x + w * 0.15, top - h * 0.12, w * 0.7, h * 0.12 + 1);
    } else if (b.kind === 2 && m > 0.3) { // slanted roof
      ctx.beginPath(); ctx.moveTo(x, BASE_Y); ctx.lineTo(x, top + 14); ctx.lineTo(x + w, top); ctx.lineTo(x + w, BASE_Y); ctx.closePath(); ctx.fill();
    } else ctx.fillRect(x, top, w, h);
    // side shade
    ctx.fillStyle = css([20, 36, 60], 0.2); ctx.fillRect(x + w * 0.72, top, w * 0.28, h);
    // glass sheen (clean air)
    if (m > 0.2) {
      const sh = m * D.good * (1 - D.gloom);
      ctx.fillStyle = css([255, 255, 255], 0.16 * sh); ctx.beginPath(); ctx.moveTo(x + w * 0.1, top); ctx.lineTo(x + w * 0.38, top); ctx.lineTo(x + w * 0.12, BASE_Y); ctx.lineTo(x - w * 0.1, BASE_Y); ctx.fill();
    }
    // windows
    const cols = Math.max(2, Math.floor((w - 6) / 8)), rows = Math.max(2, Math.floor((h - 8) / 12));
    const cwid = (w - 6) / cols, rhei = 12;
    const energy = clamp(cur.energy / 100);
    const shut = sstep(52, 30, D.P);
    let litFrac = lerp(0.03, 0.9, sstep(0.08, 0.8, energy)) * (1 - 0.55 * shut) * (1 - 0.5 * D.pov) * (1 - ab) * (1 - D.fire * 0.35);
    litFrac = lerp(litFrac, 0.9, D.win * 0.8);
    const candle = D.blackout > 0.45;
    const darkWin = css(mix([40, 70, 90], [24, 28, 34], dull), 0.55 + 0.2 * dull);
    const litCol = candle ? css([255, 160, 60], 0.85) : css([255, 226, 150], clamp(0.5 + D.dark * 0.45));
    const glossy = css([255, 255, 255], 0.14 * m * D.good * (1 - D.gloom));
    ctx.fillStyle = darkWin; ctx.beginPath();
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) ctx.rect(x + 3 + c * cwid + 1, BASE_Y - 8 - (r + 1) * rhei + 2, cwid - 2.5, 7);
    ctx.fill();
    ctx.fillStyle = glossy; ctx.beginPath();
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) ctx.rect(x + 3 + c * cwid + 1, BASE_Y - 8 - (r + 1) * rhei + 2, cwid - 2.5, 3);
    ctx.fill();
    ctx.fillStyle = litCol; ctx.beginPath();
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const k = b.wr[(r * 8 + c) % 220]; const tw = k + 0.04 * Math.sin(tm * 0.6 + k * 20);
      if (tw < litFrac) ctx.rect(x + 3 + c * cwid + 1, BASE_Y - 8 - (r + 1) * rhei + 2, cwid - 2.5, 7);
    }
    ctx.fill();
    // terraces and vertical gardens
    const gr = m * D.nat;
    if (gr > 0.05) {
      const gc = mix(mix([60, 168, 76], [120, 120, 70], D.brown), [40, 70, 50], D.gloom * 0.4);
      ctx.fillStyle = css(gc, 0.95 * gr);
      for (let r = 2; r < rows; r += 3) {
        const yy = BASE_Y - 8 - r * rhei + 1; const off = (r % 2) ? 0 : w * 0.3;
        ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - 2 + off * 0.2, yy, w * 0.7 + 4, 3.4, 1.5) : ctx.rect(x - 2, yy, w * 0.7 + 4, 3.4); ctx.fill();
        for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(x + off * 0.2 + k * (w * 0.7 / 4), yy, 2.2, Math.PI, 0); ctx.fill(); }
        ctx.fillRect(x + off * 0.2 + 1, yy, 0.9, 7); ctx.fillRect(x + off * 0.2 + w * 0.5, yy, 0.9, 9);
      }
    }
    // roof: panels or old tank
    const rt = b.kind === 1 && m > 0.3 ? top - h * 0.12 : top;
    if (m > 0.1) {
      ctx.globalAlpha = clamp(m * 1.3);
      const sun = (0.5 + 0.5 * D.good) * (1 - D.gloom);
      ctx.fillStyle = css(mix([28, 56, 122], [20, 28, 50], D.gloom), 1);
      const pw = w * 0.5;
      ctx.beginPath(); ctx.moveTo(x + 2, rt); ctx.lineTo(x + 2 + pw, rt - 6); ctx.lineTo(x + 2 + pw + 6, rt - 6); ctx.lineTo(x + 8, rt); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x + w * 0.55, rt); ctx.lineTo(x + w * 0.55 + pw * 0.8, rt - 5); ctx.lineTo(x + w * 0.55 + pw * 0.8 + 5, rt - 5); ctx.lineTo(x + w * 0.55 + 5, rt); ctx.fill();
      if (sun > 0.3) { ctx.fillStyle = css([140, 210, 255], 0.5 * sun * (0.6 + 0.4 * Math.sin(tm * 1.7 + b.seed))); ctx.fillRect(x + 6, rt - 5, 8, 1.4); }
      // rooftop garden
      ctx.fillStyle = css(mix([70, 170, 80], [120, 110, 60], D.brown), 0.95 * D.nat);
      for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(x + w * (0.62 + k * 0.12), rt - 2, 3.2 + (k % 2), Math.PI, 0); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
    if (m < 0.9) { // old roof clutter
      ctx.globalAlpha = 1 - m;
      ctx.fillStyle = css([120, 112, 104]); ctx.fillRect(x + w * 0.2, top - 6, w * 0.25, 6);
      ctx.fillRect(x + w * 0.7, top - 14, 1, 14); ctx.fillRect(x + w * 0.62, top - 10, 14, 1);
      if (D.pov > 0.2) { ctx.fillStyle = css([140, 90, 70], 0.7 * D.pov); ctx.fillRect(x + 2, top, w * 0.4, 5); ctx.fillStyle = css([90, 100, 110], 0.7 * D.pov); ctx.fillRect(x + w * 0.5, top + 8, w * 0.3, 6); }
      ctx.globalAlpha = 1;
    }
    // abandoned: darken + scaffold
    if (ab > 0.02) {
      ctx.fillStyle = css([18, 20, 26], 0.55 * ab); ctx.fillRect(x, top, w, h);
      ctx.strokeStyle = css([150, 110, 60], 0.8 * ab); ctx.lineWidth = 0.9;
      ctx.beginPath();
      for (let yy = BASE_Y; yy > top + 6; yy -= 16) { ctx.moveTo(x - 1, yy); ctx.lineTo(x + w + 1, yy); ctx.moveTo(x - 1, yy); ctx.lineTo(x + w + 1, yy - 16); }
      ctx.moveTo(x - 1, top); ctx.lineTo(x - 1, BASE_Y); ctx.moveTo(x + w + 1, top); ctx.lineTo(x + w + 1, BASE_Y);
      ctx.stroke();
    }
    // hologram and beam on prosperous modern towers
    const holo = m * D.tech * (1 - D.gloom) * (1 - D.blackout * 0.6) * (1 - D.fire) * (1 - ab);
    if (holo > 0.25 && b.rank < 0.5) {
      ctx.globalCompositeOperation = 'lighter';
      const hx = x + w * 0.5, hy = rt - 22 - Math.sin(tm * 1.1 + b.seed) * 2;
      const fl = 0.6 + 0.4 * Math.sin(tm * 7 + b.seed);
      ctx.strokeStyle = css([110, 240, 255], 0.55 * holo * fl); ctx.lineWidth = 1;
      ctx.strokeRect(hx - 8, hy - 7, 16, 12);
      ctx.fillStyle = css([110, 240, 255], 0.16 * holo * fl); ctx.fillRect(hx - 8, hy - 7, 16, 12);
      ctx.fillStyle = css([200, 255, 255], 0.5 * holo); for (let k = 0; k < 3; k++) ctx.fillRect(hx - 6, hy - 5 + k * 3.5, 6 + (k % 2) * 6, 1);
      const bg = ctx.createLinearGradient(0, rt, 0, rt - 70); bg.addColorStop(0, css([140, 255, 240], 0.35 * holo)); bg.addColorStop(1, css([140, 255, 240], 0));
      ctx.fillStyle = bg; ctx.fillRect(hx - 1, rt - 70, 2, 70);
      ctx.globalCompositeOperation = 'source-over';
    }
    // sparkles at flourishing
    if (D.gold76 > 0.2 && m > 0.4) {
      const ph = (tm * 0.8 + b.seed) % 3;
      if (ph < 0.5) { const sx = x + w * ((b.seed * 7) % 1), sy = top + h * (((b.seed * 3) % 1) * 0.7); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = css([255, 255, 220], (0.5 - Math.abs(ph - 0.25) * 2) * D.gold76); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(sx - 4, sy); ctx.lineTo(sx + 4, sy); ctx.moveTo(sx, sy - 4); ctx.lineTo(sx, sy + 4); ctx.stroke(); ctx.globalCompositeOperation = 'source-over'; }
    }
    // fire + smoke
    for (let k = 0; k < fireSpots.length; k++) {
      const fs = fireSpots[k]; const inten = clamp((D.fire - fs[2] * 0.7) * 3);
      if (inten > 0.02 && (i + k) % 2 === 0 || (inten > 0.5 && k < 2)) {
        flame(x + w * fs[0], top + h * fs[1] + (fs[1] > 0 ? 6 : 0), inten * (0.8 + b.rank * 0.5), b.seed + k);
        if (Math.random() < 0.5 * lastDt * 60 * 0.12 && embers.length < 80) embers.push({ x: x + w * fs[0], y: top + h * fs[1], vx: (Math.random() - 0.3) * 14, vy: -26 - Math.random() * 30, life: 0, max: 1.2 + Math.random() });
        if (Math.random() < 0.06 * lastDt * 60 && smokeP.length < 160) smokeP.push({ x: x + w * fs[0], y: top + h * fs[1] - 14, vx: 6 + D.wind * 5, vy: -22 - Math.random() * 10, r: 5, life: 0, max: 4, a: 0.55, col: [40, 36, 36], g: 7 });
      }
    }
    if (D.smoke > 0.15 && (i % 3 === 0) && Math.random() < D.smoke * 0.05 * lastDt * 60 && smokeP.length < 160)
      smokeP.push({ x: x + w * 0.5, y: rt - 4, vx: 6 + D.wind * 4, vy: -18, r: 4, life: 0, max: 4.5, a: 0.4 * D.smoke, col: mix([150, 150, 150], [50, 46, 46], D.fire), g: 6 });
  }

  function flame(x, y, s, seed) {
    const t = tm; const w = s * 10, h = s * 34;
    ctx.globalCompositeOperation = 'lighter';
    glow(x, y - h * 0.4, h * 1.5, [255, 110, 30], 0.28);
    ctx.globalCompositeOperation = 'source-over';
    const cols = [[214, 40, 12], [255, 132, 20], [255, 226, 110]], sc = [1, 0.68, 0.38];
    for (let l = 0; l < 3; l++) {
      const k = sc[l]; const f = 1 + 0.2 * Math.sin(t * 9 + seed * 3 + l) + 0.1 * Math.sin(t * 17 + seed);
      const sway = Math.sin(t * 6 + seed * 2) * w * 0.35 * k;
      ctx.fillStyle = css(cols[l], 0.95);
      ctx.beginPath(); ctx.moveTo(x - w * k, y); ctx.quadraticCurveTo(x - w * k * 1.1, y - h * k * 0.55 * f, x + sway, y - h * k * f);
      ctx.quadraticCurveTo(x + w * k * 1.1, y - h * k * 0.55 * f, x + w * k, y); ctx.closePath(); ctx.fill();
    }
  }

  function drawWalkway() {
    const x1 = LW * 0.6, y1 = BASE_Y - 108, x2 = LW * 0.9, y2 = BASE_Y - 96;
    const gl = css(mix([200, 230, 235], [120, 130, 140], D.gloom), 0.95);
    ctx.lineCap = 'round';
    ctx.strokeStyle = css([60, 70, 80], 0.8 * (1 - D.gloom * 0.3)); ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.bezierCurveTo(x1 + (x2 - x1) * 0.3, y1 + 56, x1 + (x2 - x1) * 0.7, y2 + 56, x2, y2); ctx.stroke();
    ctx.strokeStyle = css(mix([84, 176, 90], [120, 110, 70], D.brown), 1); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x1, y1 - 2); ctx.bezierCurveTo(x1 + (x2 - x1) * 0.3, y1 + 54, x1 + (x2 - x1) * 0.7, y2 + 54, x2, y2 - 2); ctx.stroke();
    ctx.strokeStyle = gl; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x1, y1 - 6); ctx.bezierCurveTo(x1 + (x2 - x1) * 0.3, y1 + 50, x1 + (x2 - x1) * 0.7, y2 + 50, x2, y2 - 6); ctx.stroke();
    ctx.lineCap = 'butt';
    // supports
    ctx.strokeStyle = css([80, 90, 100], 0.7); ctx.lineWidth = 1.5;
    for (const t of [0.25, 0.5, 0.75]) {
      const u = 1 - t; const px = u * u * u * x1 + 3 * u * u * t * (x1 + (x2 - x1) * 0.3) + 3 * u * t * t * (x1 + (x2 - x1) * 0.7) + t * t * t * x2;
      const py = u * u * u * y1 + 3 * u * u * t * (y1 + 56) + 3 * u * t * t * (y2 + 56) + t * t * t * y2;
      ctx.beginPath(); ctx.moveTo(px, py + 2); ctx.lineTo(px, BASE_Y); ctx.stroke();
    }
  }

  function drawCity() {
    ctx.save(); ctx.translate(parallax(1.4), 0);
    // base plaza
    const px0 = LW * 0.44, px1 = LW * 0.6;
    const plaza = ctx.createLinearGradient(px0, 0, px1, 0);
    const pc = css(mix([150, 160, 152], [90, 94, 98], D.gloom));
    plaza.addColorStop(0, css(mix([150, 160, 152], [90, 94, 98], D.gloom), 0)); plaza.addColorStop(1, pc);
    ctx.fillStyle = plaza; ctx.beginPath(); ctx.moveTo(px0, ROOF_Y + 4); for (let x = px0; x <= LW + 60; x += 10) ctx.lineTo(x, hillY(x) + 1); ctx.lineTo(LW + 60, ROOF_Y + 4); ctx.fill();
    // far skyline bits behind (already drawn), turbines
    drawTurbine(turbines[2]);
    drawWalkway();
    for (let i = 0; i < blds.length; i++) drawBuilding(blds[i], i);
    // cranes
    if (D.eco > 0.45) {
      const n = D.eco > 0.7 ? 2 : 1;
      for (let k = 0; k < n; k++) { const b = blds[3 + k * 4]; if (b) { const { h } = buildingBase(0, b); drawCrane(b.x + b.w * 0.5, BASE_Y - h, 0.9, k * 2); } }
    }
    // park trees along plaza
    for (const t of trees) { if (t.x < LW * 0.52 || t.x > LW + 10) continue; drawTree(t, t.x, BASE_Y + 3 + t.dy * 0.3, D.brown, D.nat); }
    ctx.restore();
    // drones
    const nd = Math.floor(D.tech * 4 * (1 - D.gloom));
    for (let i = 0; i < nd; i++) {
      const x = LW * (0.62 + 0.3 * ((Math.sin(tm * 0.2 + i * 2) + 1) / 2)), y = 180 + i * 28 + Math.sin(tm * 0.7 + i) * 8;
      ctx.fillStyle = css([40, 50, 60]); ctx.fillRect(x - 3, y, 6, 2); ctx.fillRect(x - 5, y - 1, 3, 1); ctx.fillRect(x + 2, y - 1, 3, 1);
      ctx.fillStyle = css([255, 80, 80], 0.5 + 0.5 * Math.sin(tm * 6 + i)); ctx.fillRect(x - 0.5, y + 2, 1.2, 1.2);
    }
  }

  function drawRoad() {
    ctx.save(); ctx.translate(parallax(1.5), 0);
    ctx.fillStyle = css(mix([84, 88, 94], [44, 46, 52], D.gloom * 0.6)); ctx.fillRect(-60, 424, LW + 120, 22);
    ctx.fillStyle = css([220, 220, 200], 0.55); for (let x = -60; x < LW + 60; x += 26) ctx.fillRect(x + (tm * 0) % 26, 434.5, 12, 1.2);
    ctx.fillStyle = css(mix([170, 176, 170], [100, 104, 108], D.gloom)); ctx.fillRect(-60, 422, LW + 120, 3);
    ctx.restore();
    // cars
    const density = clamp(D.eco * 0.9 + 0.1) * (1 - D.gloom * 0.4) * (1 - D.lose * 0.8) * (1 - D.fire * 0.5);
    const night = clamp(D.dark + 0.2);
    for (const c of cars) {
      const vis = clamp((density * 1.1 - c.rank) * 6);
      c.x += (c.lane ? -c.sp : c.sp) * lastDt * (0.4 + D.eco * 0.8); if (c.x > LW + 40) c.x = -40; if (c.x < -40) c.x = LW + 40;
      if (vis < 0.03) continue;
      const y = c.lane ? 441 : 430;
      ctx.globalAlpha = vis;
      ctx.fillStyle = css(mix(c.col, [60, 60, 66], D.gloom * 0.5)); ctx.beginPath(); ctx.roundRect ? ctx.roundRect(c.x - 7, y - 4, 14, 5, 1.6) : ctx.rect(c.x - 7, y - 4, 14, 5); ctx.fill();
      ctx.fillStyle = css([220, 240, 250], 0.85); ctx.fillRect(c.x - 3, y - 7, 6, 3.4);
      ctx.fillStyle = css([20, 20, 24]); ctx.fillRect(c.x - 5, y, 3, 1.8); ctx.fillRect(c.x + 3, y, 3, 1.8);
      if (night > 0.3) { ctx.globalCompositeOperation = 'lighter'; glow(c.x + (c.lane ? -8 : 8), y - 1.5, 9, [255, 240, 180], 0.5 * night); ctx.globalCompositeOperation = 'source-over'; }
      ctx.globalAlpha = 1;
    }
  }

  // ----- particles -----
  function stepParticles(dt) {
    for (let i = smokeP.length - 1; i >= 0; i--) {
      const p = smokeP[i]; p.life += dt; if (p.life > p.max) { smokeP.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.g * dt; p.vy *= 0.995;
    }
    for (let i = embers.length - 1; i >= 0; i--) { const p = embers[i]; p.life += dt; if (p.life > p.max) { embers.splice(i, 1); continue; } p.x += p.vx * dt; p.y += p.vy * dt; p.vx += Math.sin(tm * 8 + i) * 4 * dt; }
  }
  function drawParticles() {
    ctx.save(); ctx.translate(parallax(1.4), 0);
    for (const p of smokeP) {
      const k = p.life / p.max; const a = p.a * Math.sin(Math.min(1, k * 1.4) * Math.PI * 0.5) * (1 - k);
      ctx.fillStyle = css(p.col, a); ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill();
    }
    ctx.globalCompositeOperation = 'lighter';
    for (const p of embers) { const k = 1 - p.life / p.max; ctx.fillStyle = css([255, 160, 60], k); ctx.fillRect(p.x, p.y, 1.6, 1.6); }
    ctx.restore();
    ctx.globalCompositeOperation = 'source-over';
  }

  function drawBirds() {
    const vis = D.good * (1 - D.gloom) * (1 - D.rain) * (1 - D.fire);
    if (vis < 0.05) return;
    ctx.strokeStyle = css(mix([40, 50, 60], [90, 60, 40], D.golden * 0.4), 0.85); ctx.lineWidth = 1.2;
    for (const b of birds) {
      b.x += b.sp * lastDt; if (b.x > LW + 20) b.x = -20;
      if (b.rank > vis) continue;
      const y = b.y + Math.sin(tm * 0.5 + b.ph) * 6; const f = Math.sin(tm * 7 + b.ph) * 3.2 * b.s;
      ctx.beginPath(); ctx.moveTo(b.x - 6 * b.s, y - f); ctx.quadraticCurveTo(b.x - 2 * b.s, y + 1 - f * 0.3, b.x, y + 1); ctx.quadraticCurveTo(b.x + 2 * b.s, y + 1 - f * 0.3, b.x + 6 * b.s, y - f); ctx.stroke();
    }
    // balloons (tourism)
    if (D.tour > 0.35) {
      const n = Math.floor(1 + D.tour * 3);
      for (let i = 0; i < n; i++) {
        const x = LW * (0.15 + i * 0.09) + Math.sin(tm * 0.15 + i) * 8, y = 130 + i * 18 + Math.sin(tm * 0.4 + i) * 5;
        ctx.fillStyle = css([[230, 70, 60], [250, 190, 50], [60, 140, 210], [100, 190, 110]][i % 4], 0.95); ctx.beginPath(); ctx.ellipse(x, y, 9, 11, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = css([255, 255, 255], 0.35); ctx.beginPath(); ctx.ellipse(x - 2, y - 3, 2.5, 4, 0.3, 0, TAU); ctx.fill();
        ctx.fillStyle = css([110, 70, 40]); ctx.fillRect(x - 2, y + 14, 4, 3); ctx.strokeStyle = css([80, 60, 40], 0.7); ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(x - 5, y + 8); ctx.lineTo(x - 2, y + 14); ctx.moveTo(x + 5, y + 8); ctx.lineTo(x + 2, y + 14); ctx.stroke();
      }
    }
  }

  function drawRain(dt) {
    const k = D.rain; if (k < 0.02) return;
    const n = Math.floor(drops.length * k);
    const slant = 0.28 + D.storm * 0.12;
    ctx.strokeStyle = css(mix([200, 215, 235], [255, 190, 170], D.fire * 0.5), 0.3 + 0.18 * k); ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const d = drops[i];
      d.y += d.v * dt; d.x -= d.v * slant * dt;
      if (d.y > d.ground) {
        if (d.ground > 462 && splashes.length < 90 && Math.random() < 0.5) splashes.push({ x: d.x, y: d.ground, t: 0 });
        d.y = -20 - Math.random() * 60; d.x = Math.random() * (LW + 260); d.ground = 430 + Math.random() * 128;
      }
      ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + d.l * slant, d.y - d.l);
    }
    ctx.stroke();
    for (let i = splashes.length - 1; i >= 0; i--) {
      const s = splashes[i]; s.t += dt; if (s.t > 0.35) { splashes.splice(i, 1); continue; }
      const u = s.t / 0.35; ctx.strokeStyle = css([220, 232, 245], 0.55 * (1 - u)); ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.ellipse(s.x, s.y, 1 + u * 5, 0.5 + u * 1.6, 0, 0, TAU); ctx.stroke();
    }
  }

  // ----- foreground rooftop -----
  function drawRooftop() {
    const gl = D.gloom, wet = D.rain;
    const deckTop = mix([176, 172, 164], [96, 100, 106], gl), deckBot = mix([132, 128, 122], [60, 62, 68], gl);
    const warmD = (a) => mix(a, [255, 190, 120], D.golden * 0.12);
    const parTop = warmD(mix([208, 204, 194], [112, 116, 122], gl)), parFace = warmD(mix([160, 156, 148], [78, 82, 88], gl));
    // railing behind parapet
    ctx.strokeStyle = css(mix([220, 226, 230], [90, 96, 104], gl), 0.75); ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(-10, ROOF_Y - 26); ctx.lineTo(LW + 10, ROOF_Y - 26); ctx.moveTo(-10, ROOF_Y - 13); ctx.lineTo(LW + 10, ROOF_Y - 13);
    for (let x = 6; x < LW; x += 38) { ctx.moveTo(x, ROOF_Y); ctx.lineTo(x, ROOF_Y - 26); }
    ctx.stroke();
    // parapet
    ctx.fillStyle = css(parTop); ctx.fillRect(-10, ROOF_Y, LW + 20, 6);
    ctx.fillStyle = css(parFace); ctx.fillRect(-10, ROOF_Y + 6, LW + 20, 14);
    ctx.fillStyle = css([255, 255, 255], 0.1); ctx.fillRect(-10, ROOF_Y, LW + 20, 1.5);
    // deck
    const g = ctx.createLinearGradient(0, ROOF_Y + 20, 0, LH); g.addColorStop(0, css(deckTop)); g.addColorStop(1, css(deckBot));
    ctx.fillStyle = g; ctx.fillRect(-10, ROOF_Y + 20, LW + 20, LH - ROOF_Y);
    ctx.strokeStyle = css([60, 60, 60], 0.14); ctx.lineWidth = 1; ctx.beginPath();
    const vx = LW / 2;
    for (let i = -14; i <= 14; i++) { ctx.moveTo(vx + i * 26, ROOF_Y + 20); ctx.lineTo(vx + i * 80, LH); }
    for (let k = 0; k < 6; k++) { const yy = ROOF_Y + 20 + Math.pow(k / 5.2, 1.6) * (LH - ROOF_Y - 20); ctx.moveTo(0, yy); ctx.lineTo(LW, yy); }
    ctx.stroke();
    // puddle sheen
    if (wet > 0.05) {
      ctx.fillStyle = css([210, 225, 240], 0.2 * wet);
      for (const p of [[0.18, 0.84, 70], [0.72, 0.9, 90], [0.46, 0.96, 60], [0.9, 0.8, 50]]) { ctx.beginPath(); ctx.ellipse(LW * p[0], LH * p[1] + 10, p[2], p[2] * 0.1, 0, 0, TAU); ctx.fill(); }
      const sg = ctx.createLinearGradient(0, ROOF_Y + 20, 0, LH); sg.addColorStop(0, css([220, 232, 245], 0.12 * wet)); sg.addColorStop(1, css([220, 232, 245], 0));
      ctx.fillStyle = sg; ctx.fillRect(-10, ROOF_Y + 20, LW + 20, 70);
    }
    // water tank (left)
    const tx = Math.min(LW * 0.07, 90), ty = 505;
    ctx.fillStyle = css(mix([120, 100, 80], [60, 56, 54], gl)); ctx.fillRect(tx - 24, ty - 36, 3, 36); ctx.fillRect(tx + 21, ty - 36, 3, 36);
    ctx.fillStyle = css(mix([176, 130, 90], [92, 76, 66], gl)); ctx.fillRect(tx - 28, ty - 78, 56, 44);
    ctx.fillStyle = css([40, 30, 24], 0.25); ctx.fillRect(tx + 8, ty - 78, 20, 44);
    ctx.strokeStyle = css([70, 60, 54], 0.8); ctx.lineWidth = 1.5; for (const yy of [-70, -56, -42]) { ctx.beginPath(); ctx.moveTo(tx - 28, ty + yy); ctx.lineTo(tx + 28, ty + yy); ctx.stroke(); }
    ctx.fillStyle = css(mix([140, 100, 70], [76, 64, 56], gl)); ctx.beginPath(); ctx.moveTo(tx - 30, ty - 78); ctx.lineTo(tx, ty - 92); ctx.lineTo(tx + 30, ty - 78); ctx.fill();
    // solar panels on stands (right)
    const px = LW - Math.min(LW * 0.2, 190);
    for (let i = 0; i < 2; i++) {
      const x = px + i * 74; const sun = (0.5 + 0.5 * D.good) * (1 - gl);
      ctx.fillStyle = css(mix([34, 70, 150], [24, 32, 56], gl)); ctx.beginPath(); ctx.moveTo(x, 486); ctx.lineTo(x + 66, 478); ctx.lineTo(x + 70, 504); ctx.lineTo(x + 2, 512); ctx.fill();
      ctx.strokeStyle = css([160, 190, 235], 0.4); ctx.lineWidth = 0.7; ctx.beginPath();
      for (let k = 1; k < 4; k++) { ctx.moveTo(x + k * 16.5, 485 - k * 2); ctx.lineTo(x + 2 + k * 17, 512 - k * 2); }
      ctx.moveTo(x + 1, 499); ctx.lineTo(x + 68, 491); ctx.stroke();
      ctx.fillStyle = css([140, 210, 255], 0.35 * sun * (0.7 + 0.3 * Math.sin(tm * 1.6 + i))); ctx.beginPath(); ctx.moveTo(x + 6, 487); ctx.lineTo(x + 24, 485); ctx.lineTo(x + 14, 511); ctx.lineTo(x + 3, 512); ctx.fill();
      ctx.strokeStyle = css([90, 94, 100]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 10, 508); ctx.lineTo(x + 10, 522); ctx.moveTo(x + 58, 502); ctx.lineTo(x + 58, 516); ctx.stroke();
    }
    // antenna + dish
    const ax = LW - Math.min(LW * 0.05, 46);
    ctx.strokeStyle = css(mix([180, 184, 190], [86, 90, 96], gl)); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(ax, 520); ctx.lineTo(ax, 396); ctx.moveTo(ax - 10, 420); ctx.lineTo(ax + 10, 420); ctx.moveTo(ax - 7, 436); ctx.lineTo(ax + 7, 436); ctx.stroke();
    ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(ax, 400); ctx.lineTo(ax - 18, 520); ctx.moveTo(ax, 400); ctx.lineTo(ax + 18, 520); ctx.stroke();
    ctx.fillStyle = css([255, 60, 50], 0.4 + 0.6 * Math.max(0, Math.sin(tm * 3))); ctx.beginPath(); ctx.arc(ax, 396, 2.4, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = 'lighter'; glow(ax, 396, 12, [255, 60, 50], 0.4 * Math.max(0, Math.sin(tm * 3))); ctx.globalCompositeOperation = 'source-over';
    // potted plants
    const dead = D.brown;
    const pots = [[Math.min(LW * 0.19, 190), 520, 1], [LW * 0.7, 510, 0.8], [Math.min(LW * 0.19, 190) + 22, 524, 0.7], [LW * 0.3, 540, 0.0]];
    for (const [x, y, s] of pots) {
      if (s === 0) continue;
      ctx.fillStyle = css(mix([176, 90, 56], [90, 56, 44], gl)); ctx.beginPath(); ctx.moveTo(x - 9 * s, y - 12 * s); ctx.lineTo(x + 9 * s, y - 12 * s); ctx.lineTo(x + 6 * s, y); ctx.lineTo(x - 6 * s, y); ctx.fill();
      const lc = mix(mix([56, 156, 70], [126, 106, 56], dead), [36, 60, 46], gl * 0.4);
      ctx.fillStyle = css(lc);
      for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k - 2) * 0.55 + Math.sin(tm * 1.2 + k + x) * 0.05; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * 9 * s, y - 12 * s + Math.sin(a) * 12 * s, 3.4 * s, 9 * s, a + Math.PI / 2, 0, TAU); ctx.fill(); }
      if (dead < 0.5) { ctx.fillStyle = css([250, 120, 150], 0.9); ctx.beginPath(); ctx.arc(x - 6 * s, y - 24 * s, 2 * s, 0, TAU); ctx.arc(x + 5 * s, y - 27 * s, 2 * s, 0, TAU); ctx.fill(); }
    }
  }

  // ----- overlays -----
  function drawOverlays(dt) {
    // fire red tint
    if (D.fire > 0.02) {
      ctx.fillStyle = css([190, 36, 12], 0.2 * D.fire); ctx.fillRect(0, 0, LW, LH);
      const g = ctx.createLinearGradient(0, 220, 0, 470); g.addColorStop(0, css([255, 90, 20], 0)); g.addColorStop(1, css([255, 90, 20], 0.28 * D.fire));
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(0, 220, LW, 250); ctx.globalCompositeOperation = 'source-over';
    }
    // smog
    if (D.smog > 0.03) {
      ctx.fillStyle = css([128, 96, 54], 0.28 * D.smog); ctx.fillRect(0, 0, LW, LH);
      const g = ctx.createLinearGradient(0, 180, 0, 470); g.addColorStop(0, css([140, 104, 56], 0)); g.addColorStop(1, css([140, 104, 56], 0.5 * D.smog));
      ctx.fillStyle = g; ctx.fillRect(0, 180, LW, 290);
      for (let i = 0; i < 4; i++) { const x = ((tm * (6 + i * 3) + i * 330) % (LW + 400)) - 200; ctx.fillStyle = css([138, 104, 62], 0.2 * D.smog); ctx.beginPath(); ctx.ellipse(x, 300 + i * 34, 240, 20, 0, 0, TAU); ctx.fill(); }
    }
    // golden warmth + flare
    const sp = sunPos();
    if (D.golden > 0.02) {
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(sp.x, sp.y, 20, sp.x, sp.y, LW * 0.8); g.addColorStop(0, css([255, 190, 110], 0.2 * D.golden * (1 - D.gloom))); g.addColorStop(1, css([255, 190, 110], 0));
      ctx.fillStyle = g; ctx.fillRect(0, 0, LW, LH);
      if (D.gold76 > 0.05) {
        const ex = LW * 0.5, ey = 400;
        for (let i = 1; i <= 5; i++) { const t = i * 0.2; const fx = lerp(sp.x, ex + (ex - sp.x) * 0.6, t), fy = lerp(sp.y, ey, t); glow(fx, fy, 10 + (i % 3) * 14, i % 2 ? [255, 214, 140] : [150, 220, 255], 0.14 * D.gold76 * (1 - D.gloom)); }
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    // darkness
    const dk = 0.34 * D.gloom + 0.3 * D.blackout + 0.1 * D.fire;
    if (dk > 0.01) { ctx.fillStyle = css([14, 20, 32], dk); ctx.fillRect(0, 0, LW, LH); }
    // lightning
    if (D.storm > 0.3) {
      nextFlash -= dt;
      if (nextFlash <= 0) { flash = 1; nextFlash = 2.5 + Math.random() * 5 * (1.3 - D.storm); const bx = Math.random() * LW; bolt = [[bx, 0]]; let y = 0, x = bx; while (y < 330) { y += 20 + Math.random() * 24; x += (Math.random() - 0.5) * 40; bolt.push([x, y]); } }
    }
    if (flash > 0.01) {
      ctx.fillStyle = css([230, 236, 255], 0.38 * flash * D.storm); ctx.fillRect(0, 0, LW, LH);
      if (bolt && flash > 0.4) { ctx.strokeStyle = css([255, 255, 255], flash); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bolt[0][0], bolt[0][1]); for (const p of bolt) ctx.lineTo(p[0], p[1]); ctx.stroke(); }
      flash *= Math.pow(0.02, dt * 1.4);
    }
    // vignette
    const vg = ctx.createRadialGradient(LW / 2, LH * 0.5, LH * 0.45, LW / 2, LH * 0.5, Math.max(LW, LH) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(10,14,24,${0.32 + 0.2 * D.gloom})`);
    ctx.fillStyle = vg; ctx.fillRect(0, 0, LW, LH);
  }

  function drawWinFx(dt) {
    if (D.win < 0.05 && !sparks.length && !confetti.length) return;
    if (D.win > 0.3) {
      nextFw -= dt;
      if (nextFw <= 0) {
        nextFw = 0.45 + Math.random() * 0.5;
        const cx = LW * (0.15 + Math.random() * 0.7), cy = 60 + Math.random() * 160; const col = [[255, 220, 90], [255, 120, 120], [120, 220, 255], [170, 255, 150], [255, 160, 255]][Math.floor(Math.random() * 5)];
        for (let i = 0; i < 42 && sparks.length < 400; i++) { const a = (i / 42) * TAU, v = 60 + Math.random() * 90; sparks.push({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 1.1 + Math.random() * 0.7, col }); }
        for (let i = 0; i < 18 && confetti.length < 160; i++) confetti.push({ x: Math.random() * LW, y: -10, vx: (Math.random() - 0.5) * 30, vy: 40 + Math.random() * 50, ph: Math.random() * 6, col: [[255, 220, 90], [255, 120, 120], [120, 220, 255], [170, 255, 150]][i % 4], life: 0 });
      }
    }
    ctx.globalCompositeOperation = 'lighter';
    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i]; p.life += dt; if (p.life > p.max) { sparks.splice(i, 1); continue; }
      p.vy += 70 * dt; p.vx *= 0.985; p.x += p.vx * dt; p.y += p.vy * dt;
      const a = 1 - p.life / p.max; ctx.fillStyle = css(p.col, a); ctx.fillRect(p.x - 1, p.y - 1, 2.4, 2.4);
    }
    ctx.globalCompositeOperation = 'source-over';
    for (let i = confetti.length - 1; i >= 0; i--) {
      const p = confetti[i]; p.life += dt; p.y += p.vy * dt; p.x += (p.vx + Math.sin(tm * 3 + p.ph) * 20) * dt;
      if (p.y > LH + 10) { confetti.splice(i, 1); continue; }
      ctx.fillStyle = css(p.col, 0.9); ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(tm * 4 + p.ph); ctx.fillRect(-2.5, -1.2, 5, 2.4); ctx.restore();
    }
  }

  // ---------- frame ----------
  let lastDt = 0.016;
  function frame(now) {
    if (disposed) return;
    raf = requestAnimationFrame(frame);
    if (document.hidden) { last = now; return; }
    const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000)); last = now;
    lastDt = dt; tm += dt;
    const k = 1 - Math.exp(-dt / 0.45);
    for (const key in tgt) cur[key] += (tgt[key] - cur[key]) * k;
    D = derive(); SKY = skyColors();
    ctx.setTransform(dpr * S, 0, 0, dpr * S, 0, 0);
    ctx.clearRect(0, 0, LW, LH);
    ctx.save(); ctx.translate(parallax(0.2), 0);
    drawSky(); drawSun();
    ctx.restore();
    ctx.save(); ctx.translate(parallax(0.3), 0); drawClouds(); ctx.restore();
    drawMountains(); drawFarCity(); drawBirds();
    drawHills(); drawCity(); drawRoad();
    stepParticles(dt); drawParticles();
    drawOverlays(dt);
    drawWinFx(dt);
    drawRooftop();
    drawRain(dt);
  }
  raf = requestAnimationFrame(frame);

  // ---------- API ----------
  return {
    update(stats, P, risk) {
      if (stats) for (const key of ['literacy', 'poverty', 'energy', 'debt', 'nature', 'happiness', 'tourism', 'economy', 'culture', 'tech']) {
        const v = Number(stats[key]); if (Number.isFinite(v)) tgt[key] = v;
      }
      if (Number.isFinite(Number(P))) tgt.P = Number(P);
      if (Number.isFinite(Number(risk))) tgt.risk = clamp(Number(risk));
    },
    setEnding(kind) { ending = kind || null; if (kind !== 'win') { sparks.length = 0; confetti.length = 0; } tgt.win = kind === 'win' ? 1 : 0; tgt.lose = kind === 'lose' ? 1 : 0; },
    dispose() { disposed = true; cancelAnimationFrame(raf); if (ro) ro.disconnect(); canvas.remove(); },
  };
}
