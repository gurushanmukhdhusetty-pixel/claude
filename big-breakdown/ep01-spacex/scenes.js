/* THE BIG BREAKDOWN — EP01 SpaceX: Bigger Than Billions. Voice-over is the master clock (seconds). */
const { W, H, C, F, SAFE, clamp, lerp, seg, E, env, rng, hash, noise1, fmt, text, measure, reveal, revealChars, mono, tag, brackets } = BB;
const { v } = G3;
const cv = document.getElementById('c'); const ctx = cv.getContext('2d');
let SUBS = [];
const DUR = 124.29;

// ---------------------------------------------------------------- init
function init(data) {
  G3.setEarth(data.earth);
  const bin = atob(data.mask); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); G3.setMask(u8, 2048, 1024);
  const fixes = {}; data.words.forEach((w, i) => { if (w.w === 'and' && Math.abs(w.s - 66.38) < .05) fixes[i] = 'in'; });
  const kw = ['spacex', 'rocket', 'infrastructure', 'economy', 'billion-dollar', 'insights', 'three', 'aerospace', 'reusable', 'starship', '$200', 'kilogram', 'starlink',
    'engine', 'thousands', 'recurring', 'revenue', 'millions', 'intelligence', 'artificial', 'xai', 'computing', 'orbital', 'centres', 'solar-powered', 'laser', 'orbit', 'earth',
    'challenges', 'cooling', 'radiation', 'maintenance', 'economics', 'unresolved', 'risk', 'viability', 'vertical', 'integration', 'layers', 'payloads', 'world', 'history', 'follow', 'comment', 'next', 'ambition', 'space'];
  SUBS = BB.buildSubs(data.words, { fixes, keywords: new Set(kw) });
  buildODC();
}

// ---------------------------------------------------------------- shared visual helpers
const glow = G3.glow;
function sunFlare(x, y, r, a) {
  if (a <= 0) return; ctx.save(); ctx.globalCompositeOperation = 'lighter';
  glow(ctx, x, y, r, '255,250,240', a); glow(ctx, x, y, r * .25, '255,255,255', a);
  ctx.globalAlpha = a * .5; ctx.fillStyle = 'rgba(255,240,230,0.5)'; ctx.fillRect(x - r * 2.5, y - 1, r * 5, 2);
  ctx.restore();
}
function plume(x, y, s, ang, len, t, k = 1) { // engine plume pointing along +y (local) rotated by ang
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.globalCompositeOperation = 'lighter';
  const fl = 1 + .12 * noise1(t * 30) + .06 * noise1(t * 53 + 4);
  const L = len * fl * s;
  for (const [wf, lf, col, a] of [[1.9, 1.0, '255,90,40', .35], [1.25, .75, '255,170,90', .55], [.7, .5, '255,240,220', .95]]) {
    ctx.save(); ctx.scale(wf * s * 14, L * lf / 10);
    const g = ctx.createRadialGradient(0, 2, 0, 0, 2, 10); g.addColorStop(0, `rgba(${col},${a * k})`); g.addColorStop(.5, `rgba(${col},${a * .45 * k})`); g.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 2, 10, 0, 7); ctx.fill(); ctx.restore();
  }
  ctx.restore();
}
function smoke(x, y, t, t0, o = {}) { // billowing ground cloud
  const { n = 60, spread = 520, seed = 3, a = .5, s = 1 } = o; if (t < t0) return; const r = rng(seed);
  ctx.save();
  for (let i = 0; i < n; i++) {
    const b = t0 + r() * 1.2, dir = (r() - .5) * 2, sz = (40 + r() * 90) * s, up = r();
    const age = t - b; if (age < 0) continue; const p = 1 - Math.exp(-age * 1.6);
    const px = x + dir * spread * p * s, py = y - up * 120 * p * s - age * 10; const rr = sz * (0.4 + p);
    const g = ctx.createRadialGradient(px, py, 0, px, py, rr); const l = 120 + up * 70;
    g.addColorStop(0, `rgba(${l},${l},${l + 4},${a * (1 - p * .6)})`); g.addColorStop(1, `rgba(${l},${l},${l},0)`); ctx.fillStyle = g; ctx.fillRect(px - rr, py - rr, rr * 2, rr * 2);
  }
  ctx.restore();
}
// generic two-stage reusable rocket (white, black interstage), base at (0,0), pointing up
function rocket2D(x, y, s, ang, o = {}) {
  const { upper = true, booster = true, legs = 0, fins = 0, sepGap = 0 } = o;
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s);
  const w = 34; const body = (x0, y0, w0, h0) => { const g = ctx.createLinearGradient(x0, 0, x0 + w0, 0); g.addColorStop(0, '#6c6f75'); g.addColorStop(.32, '#f4f4f2'); g.addColorStop(.55, '#d9dadc'); g.addColorStop(1, '#45474c'); ctx.fillStyle = g; ctx.fillRect(x0, y0, w0, h0); };
  if (booster) {
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(14, 0); ctx.lineTo(11, -12); ctx.lineTo(-11, -12); ctx.fill();
    body(-w / 2, -420, w, 408);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; for (let k = 1; k < 6; k++) ctx.fillRect(-w / 2, -12 - k * 68, w, 1.2);
    // interstage
    const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0); g.addColorStop(0, '#0b0b0c'); g.addColorStop(.35, '#3a3b3f'); g.addColorStop(1, '#050505'); ctx.fillStyle = g; ctx.fillRect(-w / 2, -462, w, 42);
    // grid fins
    if (fins > 0) { ctx.fillStyle = '#2b2c30'; const fx = 6 + 14 * fins; ctx.fillRect(-w / 2 - fx, -455, fx, 10); ctx.fillRect(w / 2, -455, fx, 10); }
    // legs
    ctx.strokeStyle = '#8a8d93'; ctx.lineWidth = 5; ctx.beginPath(); const la = legs * 0.75;
    ctx.moveTo(-w / 2, -70); ctx.lineTo(-w / 2 - Math.sin(la) * 80, -70 + Math.cos(la) * 80); ctx.moveTo(w / 2, -70); ctx.lineTo(w / 2 + Math.sin(la) * 80, -70 + Math.cos(la) * 80); ctx.stroke();
    // logo stripe (generic red band)
    ctx.fillStyle = C.red; ctx.fillRect(-w / 2, -300, w, 5);
  }
  if (upper) {
    ctx.save(); ctx.translate(0, -sepGap);
    if (sepGap > 0) { ctx.fillStyle = '#222'; ctx.fillRect(-9, -470, 18, 10); }
    body(-w / 2, -640, w, 172);
    // fairing ogive
    const g = ctx.createLinearGradient(-w / 2 - 4, 0, w / 2 + 4, 0); g.addColorStop(0, '#6c6f75'); g.addColorStop(.32, '#fafafa'); g.addColorStop(1, '#45474c');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-w / 2 - 4, -640); ctx.lineTo(-w / 2 - 4, -700); ctx.bezierCurveTo(-w / 2 - 4, -760, -6, -800, 0, -805); ctx.bezierCurveTo(6, -800, w / 2 + 4, -760, w / 2 + 4, -700); ctx.lineTo(w / 2 + 4, -640); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}
// Starship-inspired stainless super-heavy stack; base (0,0), pointing up, total height ~ 1000*s
function steelGrad(x0, w) { const g = ctx.createLinearGradient(x0, 0, x0 + w, 0); g.addColorStop(0, '#3b3d41'); g.addColorStop(.2, '#9b9ea4'); g.addColorStop(.38, '#f1f2f3'); g.addColorStop(.5, '#c9cbcf'); g.addColorStop(.78, '#6e7176'); g.addColorStop(1, '#2a2b2e'); return g; }
function starship(x, y, s, o = {}) {
  const { trace = 1, fill = 1, ship = true, boost = true } = o;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); const w = 76;
  const path = new Path2D();
  // booster 0..-560, hot stage ring -560..-585, ship -585..-1000
  if (boost) path.rect(-w / 2, -560, w, 560);
  if (ship) { path.moveTo(-w / 2, -585); path.lineTo(-w / 2, -880); path.bezierCurveTo(-w / 2, -950, -14, -1000, 0, -1004); path.bezierCurveTo(14, -1000, w / 2, -950, w / 2, -880); path.lineTo(w / 2, -585); path.closePath(); }
  if (fill > 0) {
    ctx.globalAlpha = fill; ctx.fillStyle = steelGrad(-w / 2, w); ctx.fill(path);
    // weld rings
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; for (let yy = -20; yy > -1000; yy -= 18) { if (yy < -880 && yy > -1004) continue; if (yy < -560 && yy > -585) continue; if (!boost && yy > -585) continue; if (!ship && yy < -560) continue; ctx.fillRect(-w / 2, yy, w, 1); }
    if (boost && ship) { ctx.fillStyle = '#1a1b1d'; ctx.fillRect(-w / 2 + 2, -585, w - 4, 25); ctx.fillStyle = '#3a3c40'; for (let k = 0; k < 9; k++) ctx.fillRect(-w / 2 + 6 + k * 7.6, -580, 4, 15); }
    // grid fins on booster
    if (boost) { ctx.fillStyle = '#2b2d31'; ctx.fillRect(-w / 2 - 18, -540, 18, 24); ctx.fillRect(w / 2, -540, 18, 24); ctx.strokeStyle = '#555'; ctx.lineWidth = 1; ctx.strokeRect(-w / 2 - 18, -540, 18, 24); ctx.strokeRect(w / 2, -540, 18, 24); }
    // ship flaps
    if (ship) { ctx.fillStyle = '#26272a'; ctx.beginPath(); ctx.moveTo(-w / 2, -900); ctx.lineTo(-w / 2 - 20, -870); ctx.lineTo(-w / 2, -850); ctx.fill(); ctx.beginPath(); ctx.moveTo(w / 2, -900); ctx.lineTo(w / 2 + 20, -870); ctx.lineTo(w / 2, -850); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-w / 2, -650); ctx.lineTo(-w / 2 - 30, -600); ctx.lineTo(-w / 2, -592); ctx.fill(); ctx.beginPath(); ctx.moveTo(w / 2, -650); ctx.lineTo(w / 2 + 30, -600); ctx.lineTo(w / 2, -592); ctx.fill();
      ctx.fillStyle = 'rgba(10,10,12,0.75)'; ctx.fillRect(-w / 2 + 4, -880, w * .38, 280); } // heat shield side (dark tiles)
    if (boost) { ctx.fillStyle = '#1b1c1e'; ctx.fillRect(-w / 2 + 6, -6, w - 12, 6); }
    ctx.globalAlpha = 1;
  }
  if (trace > 0 && trace < 1.01) { ctx.save(); ctx.strokeStyle = `rgba(255,255,255,${.9 * (1 - fill * .7)})`; ctx.lineWidth = 2 / s; ctx.setLineDash([3200 * trace, 3200]); ctx.stroke(path); ctx.restore(); }
  ctx.restore();
}
function dimLine(x1, y1, x2, y2, label, p, o = {}) { // technical dimension marker
  if (p <= 0) return; ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.5; const e = E.out3(p);
  const xe = lerp(x1, x2, e), ye = lerp(y1, y2, e); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(xe, ye); ctx.stroke();
  ctx.beginPath(); const nx = -(y2 - y1), ny = x2 - x1, nl = Math.hypot(nx, ny); ctx.moveTo(x1 - nx / nl * 8, y1 - ny / nl * 8); ctx.lineTo(x1 + nx / nl * 8, y1 + ny / nl * 8);
  if (e > .98) { ctx.moveTo(x2 - nx / nl * 8, y2 - ny / nl * 8); ctx.lineTo(x2 + nx / nl * 8, y2 + ny / nl * 8); } ctx.stroke(); ctx.restore();
  if (label) mono(ctx, label, (x1 + x2) / 2 + (o.dx || 14), (y1 + y2) / 2 + (o.dy || 0), { alpha: seg(p, .5, 1), color: C.white, size: 18, align: o.align || 'left' });
}
function icon(kind, x, y, s, p = 1, col = C.white) { // line icons
  if (p <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 3 / s * s * .9; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalAlpha *= p;
  const L = new Path2D();
  if (kind === 'rocket') { L.moveTo(0, -40); L.bezierCurveTo(14, -26, 14, 0, 12, 22); L.lineTo(-12, 22); L.bezierCurveTo(-14, 0, -14, -26, 0, -40); L.moveTo(-12, 8); L.lineTo(-22, 26); L.lineTo(-12, 22); L.moveTo(12, 8); L.lineTo(22, 26); L.lineTo(12, 22); L.moveTo(-5, 30); L.lineTo(0, 40); L.lineTo(5, 30); }
  if (kind === 'sat') { L.rect(-9, -9, 18, 18); L.rect(-42, -7, 26, 14); L.rect(16, -7, 26, 14); L.moveTo(-16, 0); L.lineTo(-9, 0); L.moveTo(9, 0); L.lineTo(16, 0); L.moveTo(0, 9); L.lineTo(0, 18); L.moveTo(-8, 24); L.quadraticCurveTo(0, 16, 8, 24); L.moveTo(-14, 32); L.quadraticCurveTo(0, 20, 14, 32); }
  if (kind === 'chip') { L.rect(-22, -22, 44, 44); L.rect(-10, -10, 20, 20); for (let k = -1; k <= 1; k++) { L.moveTo(k * 11, -22); L.lineTo(k * 11, -32); L.moveTo(k * 11, 22); L.lineTo(k * 11, 32); L.moveTo(-22, k * 11); L.lineTo(-32, k * 11); L.moveTo(22, k * 11); L.lineTo(32, k * 11); } }
  if (kind === 'globe') { L.arc(0, 0, 30, 0, 7); L.ellipse(0, 0, 13, 30, 0, 0, 7); L.moveTo(-30, 0); L.lineTo(30, 0); L.moveTo(-26, -15); L.lineTo(26, -15); L.moveTo(-26, 15); L.lineTo(26, 15); }
  if (kind === 'therm') { L.arc(0, 22, 12, 0, 7); L.moveTo(-6, 12); L.lineTo(-6, -30); L.arc(0, -30, 6, Math.PI, 0); L.lineTo(6, 12); for (let k = 0; k < 3; k++) { L.moveTo(12, -20 + k * 12); L.lineTo(20, -20 + k * 12); } }
  if (kind === 'rad') { L.arc(0, 0, 6, 0, 7); for (let k = 0; k < 3; k++) { const a = k * 2.094 - 1.57; L.moveTo(Math.cos(a - .5) * 12, Math.sin(a - .5) * 12); L.arc(0, 0, 32, a - .5, a + .5); L.lineTo(Math.cos(a + .5) * 12, Math.sin(a + .5) * 12); L.arc(0, 0, 12, a + .5, a - .5, true); } }
  if (kind === 'wrench') { L.moveTo(-26, 26); L.lineTo(4, -4); L.arc(14, -14, 14, 2.4, 5.6 + 1.2); L.moveTo(-26, 26); L.lineTo(-20, 32); L.lineTo(10, 2); }
  if (kind === 'dollar') { L.moveTo(16, -18); L.bezierCurveTo(8, -28, -20, -26, -18, -10); L.bezierCurveTo(-16, 4, 18, -2, 18, 14); L.bezierCurveTo(18, 30, -10, 30, -18, 18); L.moveTo(0, -34); L.lineTo(0, 34); }
  ctx.stroke(L); ctx.restore();
}
function panelBox(x, y, w, h, p, o = {}) { // HUD panel frame
  if (p <= 0) return; ctx.save(); ctx.globalAlpha *= E.out3(p); ctx.fillStyle = o.fill || 'rgba(16,17,20,0.72)'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1; ctx.strokeRect(x + .5, y + .5, w - 1, h - 1); brackets(ctx, x, y, w, h, { len: 18, color: o.bc || 'rgba(255,255,255,0.6)', p: E.out3(p) }); ctx.restore();
}

// ---------------------------------------------------------------- Earth / constellation shared
const SATS = G3.shell([{ planes: 48, per: 30, inc: 53 * Math.PI / 180, r: 1.09, speed: .22 }, { planes: 36, per: 22, inc: 43 * Math.PI / 180, r: 1.083, speed: .24 },
{ planes: 30, per: 24, inc: 70 * Math.PI / 180, r: 1.1, speed: .2 }, { planes: 20, per: 20, inc: 97.6 * Math.PI / 180, r: 1.095, speed: .21 }]);
const SUN = v.norm([-.85, .35, .55]);
function constellation(cam, e, t, o = {}) {
  const { count = 1, links = 0, beams = 0, alpha = 1, red = 0, pulses = 0 } = o; const out = [];
  const N = Math.floor(SATS.length * count);
  ctx.save(); ctx.globalAlpha *= alpha;
  const pos = new Array(SATS.length);
  for (let i = 0; i < N; i++) {
    const s = SATS[i]; const w = G3.satW(s, t, e); if (G3.occluded(cam, w, e)) continue; const p = cam.proj(w); if (!p) continue; pos[i] = p;
  }
  // links (shell 0)
  if (links > 0) {
    ctx.lineWidth = 1.2; const sh = SATS.filter(s => s.shell === 0); const per = 30, planes = 48;
    ctx.beginPath(); ctx.strokeStyle = `rgba(255,70,55,${.45 * links})`;
    const pulsePts = [];
    for (let i = 0; i < planes * per && i < N; i++) {
      const a = pos[i]; if (!a) continue; if (hash(i * 3.1) > links) continue;
      const pl = Math.floor(i / per), j = i % per; const n1 = pl * per + (j + 1) % per, n2 = ((pl + 1) % planes) * per + j;
      for (const k of [n1, n2]) { const b = pos[k]; if (!b) continue; if (Math.hypot(a.x - b.x, a.y - b.y) > 160) continue; ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); if (pulses > 0 && hash(i + k) < .35) { const f = (t * .9 + hash(i * 7 + k)) % 1; pulsePts.push(lerp(a.x, b.x, f), lerp(a.y, b.y, f)); } }
    }
    ctx.stroke();
    if (pulsePts.length) { ctx.fillStyle = `rgba(255,235,225,${pulses})`; for (let j = 0; j < pulsePts.length; j += 2) ctx.fillRect(pulsePts[j] - 1.5, pulsePts[j + 1] - 1.5, 3, 3); }
  }
  // beams to ground
  if (beams > 0) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < N; i += 37) {
      const p = pos[i]; if (!p) continue; const s = SATS[i]; const w = G3.satW(s, t, e); const g0 = v.add(e.c, v.mul(v.norm(v.sub(w, e.c)), e.R));
      const toCam = v.sub(cam.pos, g0); if (v.dot(v.sub(g0, e.c), toCam) < 0) continue; const gp = cam.proj(g0); if (!gp) continue;
      const fl = .5 + .5 * Math.sin(t * 3 + i); const sp = 26 * p.s / 400;
      const gr = ctx.createLinearGradient(p.x, p.y, gp.x, gp.y); gr.addColorStop(0, `rgba(255,255,255,${.28 * beams * fl})`); gr.addColorStop(1, `rgba(255,60,45,${.05 * beams})`);
      ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(gp.x - 16, gp.y); ctx.lineTo(gp.x + 16, gp.y); ctx.fill();
      ctx.fillStyle = `rgba(255,70,50,${.5 * beams})`; ctx.beginPath(); ctx.ellipse(gp.x, gp.y, 18, 6, 0, 0, 7); ctx.fill();
    }
    ctx.restore();
  }
  for (let i = 0; i < N; i++) { const p = pos[i]; if (!p) continue; const isRed = hash(i * .77) < red; ctx.fillStyle = isRed ? '#ff3b30' : '#ffffff'; const s = clamp(p.s * .0035, 1.4, 3.6); ctx.globalAlpha = alpha * (isRed ? 1 : .9); ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s); }
  ctx.restore(); return pos;
}
const HUBS = [[40.7, -74], [51.5, -.1], [35.7, 139.7], [1.35, 103.8], [19.1, 72.9], [-23.5, -46.6], [37.8, -122.4], [25.2, 55.3], [-33.9, 151.2], [52.5, 13.4], [31.2, 121.5], [6.5, 3.4], [-26.2, 28.0], [19.4, -99.1], [28.6, 77.2], [48.9, 2.35]];
const ARCS = [[0, 1], [1, 9], [0, 6], [6, 2], [2, 10], [10, 3], [3, 4], [4, 7], [7, 1], [0, 5], [5, 12], [12, 11], [11, 15], [3, 8], [2, 8], [14, 7], [13, 0], [13, 5], [15, 9], [4, 14]];
function slerp(a, b, t) { const d = clamp(v.dot(a, b), -1, 1); const om = Math.acos(d); if (om < 1e-4) return a; const s = Math.sin(om); return v.add(v.mul(a, Math.sin((1 - t) * om) / s), v.mul(b, Math.sin(t * om) / s)); }
function arcsNet(cam, e, t, p, o = {}) {
  const { col = '255,59,48', a = 1 } = o; ctx.save(); ctx.lineWidth = 2;
  ARCS.forEach(([i, j], k) => {
    const pk = clamp(p * 1.6 - k * .03); if (pk <= 0) return; const A = G3.ll2v(...HUBS[i]), B = G3.ll2v(...HUBS[j]); const h = .08 + .12 * v.len(v.sub(A, B)) / 2;
    ctx.beginPath(); let first = true; const pts = [];
    for (let s = 0; s <= 40 * pk; s++) { const u = s / 40; const q = v.mul(slerp(A, B, u), 1 + h * Math.sin(Math.PI * u)); const w = G3.eX(q, e); if (G3.occluded(cam, w, e)) { first = true; continue; } const pp = cam.proj(w); if (!pp) continue; pts.push(pp); if (first) ctx.moveTo(pp.x, pp.y); else ctx.lineTo(pp.x, pp.y); first = false; }
    ctx.strokeStyle = `rgba(${col},${.7 * a})`; ctx.stroke();
    // travelling packet
    const f = (t * .6 + k * .13) % 1; const q = v.mul(slerp(A, B, f), 1 + h * Math.sin(Math.PI * f)); const w = G3.eX(q, e); if (pk >= 1 && !G3.occluded(cam, w, e)) { const pp = cam.proj(w); if (pp) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, pp.x, pp.y, 14, '255,220,200', .9 * a); ctx.restore(); } }
  });
  HUBS.forEach(hb => { const w = G3.eX(G3.ll2v(...hb), e); if (v.dot(v.sub(w, e.c), v.sub(cam.pos, w)) < 0) return; const pp = cam.proj(w); if (!pp) return; ctx.fillStyle = `rgba(255,255,255,${a * clamp(p * 3)})`; ctx.beginPath(); ctx.arc(pp.x, pp.y, 3.5, 0, 7); ctx.fill(); ctx.strokeStyle = `rgba(255,59,48,${a * .8 * clamp(p * 3)})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(pp.x, pp.y, 8 + 6 * ((t * 1.2 + hb[0]) % 1), 0, 7); ctx.stroke(); });
  ctx.restore();
}

// ================================================================ SCENES
// 0) HOOK 0 – 8.7
function sHook(t) {
  BB.bg(ctx, t); const push = E.outExpo(seg(t, 0, 3.2)); const drift = t * .05;
  BB.starfield(ctx, t, { alpha: .9, dy: -t * 6, streak: (1 - push) * 40 });
  const d = lerp(30, 5.2, push) - seg(t, 3.2, 8.7) * .7;
  const e = { c: [0, 0, 0], R: 1, spin: 1.05 + t * .035, tilt: .42, sun: SUN, glow: 1 };
  const yaw = -.25 + drift * .6; const cam = G3.camera([Math.sin(yaw) * d, .55 + .2 * push, Math.cos(yaw) * d], [0, .15, 0], 40, { cy: 1130, roll: (1 - push) * .25 });
  G3.earth(ctx, cam, e);
  // rocket launch from Florida rising to orbit
  const site = G3.ll2v(28.5, -80.6), east = v.norm(v.cross([0, 1, 0], site));
  const lp = seg(t, .35, 5.8); if (lp > 0) {
    const pts = []; for (let k = 0; k <= 60; k++) { const u = lp * k / 60; const q = v.mul(v.norm(v.add(site, v.mul(east, u * .75))), 1 + .3 * Math.pow(u, .8)); const w = G3.eX(q, e); if (!G3.occluded(cam, w, e)) { const pp = cam.proj(w); if (pp) pts.push(pp); } }
    if (pts.length > 1) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
      for (const [lw, a] of [[10, .12], [4, .35], [1.6, .95]]) { ctx.strokeStyle = `rgba(255,${lw > 5 ? 90 : 210},${lw > 5 ? 50 : 180},${a})`; ctx.lineWidth = lw; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke(); }
      const hd = pts[pts.length - 1]; glow(ctx, hd.x, hd.y, 60, '255,170,120', .9); glow(ctx, hd.x, hd.y, 14, '255,255,255', 1); ctx.restore();
      if (t > 1 && t < 6) { brackets(ctx, hd.x - 34, hd.y - 34, 68, 68, { len: 12, color: 'rgba(255,59,48,0.9)', p: seg(t, 1, 1.3) }); mono(ctx, `ALT ${fmt(lp * 550)} KM`, hd.x + 46, hd.y - 6, { color: C.white, size: 17, alpha: seg(t, 1.1, 1.4) }); mono(ctx, `V ${(lp * 7.6).toFixed(2)} KM/S`, hd.x + 46, hd.y + 18, { size: 17, alpha: seg(t, 1.1, 1.4) }); }
    }
  }
  // orbital network appears with "infrastructure"
  const net = seg(t, 4.6, 7.4);
  if (net > 0) {
    for (let k = 0; k < 6; k++) G3.orbitLine(ctx, cam, e, (53 + k * 7) * Math.PI / 180, k * .9 + .3, 1.12 + k * .012, { color: `rgba(255,255,255,${.16 * net})` });
    constellation(cam, e, t, { count: net * .45, links: E.out3(seg(t, 5.6, 7.6)) * .9, red: .05, alpha: net, pulses: 1 });
    arcsNet(cam, e, t, E.io3(seg(t, 6, 8.2)));
  }
  // "global economy" pulse
  const pu = seg(t, 7.66, 8.6); if (pu > 0 && pu < 1) { const cp = cam.proj([0, 0, 0]); ctx.save(); ctx.strokeStyle = `rgba(255,59,48,${1 - pu})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cp.x, cp.y, 300 + pu * 500, 0, 7); ctx.stroke(); ctx.restore(); }
  // kinetic headline
  BB.scrim(ctx, 0, 900, .8);
  if (t < 3.6) {
    const a = 1 - seg(t, 3.25, 3.6);
    revealChars(ctx, 'WHAT IF SPACEX', SAFE.left, 350, t - .05, { size: 64, weight: 800, alpha: a, stagger: .02 });
    revealChars(ctx, 'IS NO LONGER JUST A', SAFE.left, 422, t - 1.25, { size: 64, weight: 800, alpha: a, color: C.dim, stagger: .015 });
    revealChars(ctx, 'ROCKET', SAFE.left - 4, 570, t - 2.38, { size: 150, weight: 900, alpha: a, track: -4 });
    revealChars(ctx, 'COMPANY?', SAFE.left - 4, 712, t - 2.62, { size: 150, weight: 900, alpha: a, track: -4 });
    const st = E.ioExpo(seg(t, 2.95, 3.2)); if (st > 0) { ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = C.red; ctx.fillRect(SAFE.left - 10, 518, (560) * st, 14); ctx.restore(); }
  } else {
    const a = env(t, 3.66, 8.75, .3, .35);
    revealChars(ctx, 'OR THE', SAFE.left, 340, t - 3.66, { size: 60, weight: 800, alpha: a, color: C.dim });
    revealChars(ctx, 'INFRASTRUCTURE', SAFE.left - 4, 448, t - 4.75, { size: 104, weight: 900, alpha: a, track: -4, color: C.white });
    revealChars(ctx, 'OF THE NEXT', SAFE.left, 528, t - 6.4, { size: 60, weight: 800, alpha: a, color: C.dim });
    revealChars(ctx, 'GLOBAL ECONOMY?', SAFE.left - 4, 636, t - 7.6, { size: 96, weight: 900, alpha: a, track: -4, color: C.red });
  }
  BB.hud(ctx, t, { section: 'COLD OPEN', alpha: seg(t, .6, 1.2) });
}

// 1) TITLE 8.7 – 16.75
function sTitle(t) {
  const lt = t - 8.7; BB.bg(ctx, t, { inner: '#121317' });
  BB.grid(ctx, t, { oy: -lt * 14, alpha: .9 });
  // horizon earth limb at bottom
  const e = { c: [0, -1, 0], R: 1, spin: -1.2 + t * .012, tilt: .3, sun: v.norm([0, .35, -1]), glow: 1.3, cities: 1, g: .14 };
  const cam = G3.camera([0, .62, 1.5 + lt * .008], [0, .25, 0], 50, { cy: 1000 });
  ctx.save(); ctx.globalAlpha = .9; G3.earthPix(ctx, cam, e); ctx.restore();
  sunFlare(W / 2 + 120, 1600, 420, .45 * env(t, 9, 17, 1.5, .5));
  const s = lerp(1.0, 1.04, seg(lt, 0, 8)); const cy = 560;
  ctx.save(); ctx.translate(W / 2, cy); ctx.scale(s, s); ctx.translate(-W / 2, -cy);
  BB.logo(ctx, W / 2, cy - 40, .86, t, { p: seg(t, 8.85, 10.4) });
  const ep = seg(t, 9.75, 10.3); BB.tag(ctx, 'EPISODE 01', W / 2, cy + 170, { align: 'center', alpha: E.out3(ep), size: 24 });
  // episode title
  const tp = t - 12.2; if (tp > 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(W / 2 - 200 * E.io3(seg(tp, 0, .5)), cy + 270, 400 * E.io3(seg(tp, 0, .5)), 1);
    revealChars(ctx, 'SPACEX', W / 2, cy + 420, tp - .1, { size: 150, weight: 900, align: 'center', track: -3, stagger: .04 });
    revealChars(ctx, 'BIGGER THAN BILLIONS', W / 2, cy + 510, tp - .6, { size: 60, weight: 800, align: 'center', color: C.red, track: 1, stagger: .02 });
  }
  ctx.restore();
  // drifting particles
  const r = rng(11); ctx.save(); for (let i = 0; i < 90; i++) { const x = r() * W, y = ((r() * H - lt * (20 + r() * 40)) % H + H) % H; ctx.globalAlpha = .25 * r(); ctx.fillStyle = r() < .15 ? C.red : '#fff'; ctx.fillRect(x, y, 2, 2); } ctx.restore();
  BB.hud(ctx, t, { section: 'SPACEX · BIGGER THAN BILLIONS', alpha: seg(t, 12.6, 13.2) });
}

// 2) THREE BUSINESSES 16.75 – 20.55
function sThree(t) {
  const lt = t - 16.75; BB.bg(ctx, t); BB.grid(ctx, t, { ox: lt * 20, alpha: .7 });
  revealChars(ctx, "SPACEX'S", SAFE.left, 470, t - 17.3, { size: 92, weight: 900, track: -2 });
  revealChars(ctx, 'AMBITION', SAFE.left, 560, t - 18.0, { size: 92, weight: 900, track: -2, color: C.red });
  mono(ctx, '= 3 BUSINESSES, 1 SYSTEM', SAFE.left, 620, { alpha: seg(t, 19.3, 19.7), color: C.white });
  const items = [['01', 'AEROSPACE', 'rocket', 'LAUNCH'], ['02', 'STARLINK', 'sat', 'CONNECTIVITY'], ['03', 'ARTIFICIAL INTELLIGENCE', 'chip', 'COMPUTING']];
  items.forEach(([n, name, ic, sub], i) => {
    const p = seg(t, 19.3 + i * .14, 19.9 + i * .14); if (p <= 0) return; const y = 700 + i * 190; const x = SAFE.left + (1 - E.outExpo(p)) * -200;
    panelBox(x, y, 920, 160, p); icon(ic, x + 90, y + 80, 1.15, p, i === 0 ? C.red : C.white);
    text(ctx, n, x + 170, y + 62, { size: 22, weight: 700, fam: F.mono, color: C.red, alpha: p, track: 2 });
    text(ctx, name, x + 170, y + 112, { size: name.length > 12 ? 46 : 58, weight: 900, alpha: p, track: -1 });
    mono(ctx, sub, x + 900, y + 62, { align: 'right', alpha: p });
  });
  BB.hud(ctx, t, { section: 'THE THESIS' });
}

// 3) AEROSPACE chapter + reuse sequence 20.55 – 26.45
function sAero(t) {
  BB.bg(ctx, t, { inner: '#0f1013' });
  // launch & reuse in a side-view "tracking camera" composition
  const lt = t - 20.55;
  // sky gradient that darkens as altitude rises
  const alt = E.io3(seg(t, 22.4, 24.2)) * (1 - E.io3(seg(t, 24.75, 25.9))); const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, `rgb(${lerp(16, 3, alt)},${lerp(18, 3, alt)},${lerp(24, 5, alt)})`); g.addColorStop(1, `rgb(${lerp(34, 6, alt)},${lerp(30, 6, alt)},${lerp(32, 8, alt)})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); BB.starfield(ctx, t, { alpha: alt * .8, dy: alt * 900 });
  BB.grid(ctx, t, { oy: alt * 1600 + lt * 30, alpha: .6 });
  // pad + tower
  const camY = alt * 1700; const padY = 1500 + camY;
  ctx.save(); ctx.translate(0, 0);
  if (padY < H + 300) {
    ctx.fillStyle = '#0b0b0c'; ctx.fillRect(0, padY, W, 600); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(0, padY, W, 2);
    // tower
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 2; ctx.beginPath(); for (let k = 0; k < 16; k++) { const y = padY - k * 52; ctx.moveTo(800, y); ctx.lineTo(860, y - 52); ctx.moveTo(860, y); ctx.lineTo(800, y - 52); } ctx.moveTo(800, padY); ctx.lineTo(800, padY - 832); ctx.moveTo(860, padY); ctx.lineTo(860, padY - 832); ctx.stroke();
    // landing pad X (for return)
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(380, padY + 14, 120, 18, 0, 0, 7); ctx.stroke();
    ctx.strokeStyle = C.red; ctx.beginPath(); ctx.moveTo(350, padY + 6); ctx.lineTo(410, padY + 22); ctx.moveTo(410, padY + 6); ctx.lineTo(350, padY + 22); ctx.stroke();
  }
  // launch
  const lift = seg(t, 22.45, 24.2); const rx0 = 700;
  if (t < 24.2) {
    const ry = padY - 6 - E.in3(lift) * 1300; const shake = lift > 0 ? noise1(t * 40) * 4 : 0;
    if (lift > 0) { smoke(rx0, padY, t, 22.45, { n: 50, spread: 460 }); plume(rx0 + shake, ry, 1.6, 0, 26 + lift * 30, t); }
    rocket2D(rx0 + shake, ry, 1, 0, {});
  }
  // separation (camera locked on stack at altitude)
  if (t >= 24.2 && t < 24.75) {
    const sp = seg(t, 24.2, 24.75); const ry = 1450; rocket2D(600 - sp * 30, ry + sp * 160, 1, -sp * .6, { upper: false, fins: sp });
    rocket2D(600, ry - sp * 140, 1, 0, { booster: false, sepGap: sp * 160 }); plume(600, ry - 468 - sp * 300, 1, 0, 4 + sp * 14, t, sp);
    // cold-gas puffs
    ctx.save(); for (let k = 0; k < 8; k++) { const a = k / 8 * 6.28; glow(ctx, 600 + Math.cos(a) * 30 * sp * 3, ry - 450 + Math.sin(a) * 20 * sp * 3, 40, '255,255,255', .25 * (1 - sp)); } ctx.restore();
    mono(ctx, 'STAGE SEPARATION', 660, 760, { color: C.white, alpha: env(t, 24.2, 24.75, .1, .1) });
  }
  // booster flip + descent + landing
  if (t >= 24.75) {
    const d = seg(t, 24.75, 26.25); const flip = E.io3(seg(t, 24.75, 25.15));
    const ry = lerp(300, padY + 4, E.out3(d)); const rx = lerp(640, 380, E.io3(d));
    const ang = (1 - flip) * -1.4 + (1 - E.out3(seg(t, 25.1, 25.9))) * .25;
    const burn = seg(t, 25.35, 26.2) * (1 - seg(t, 26.2, 26.3));
    if (burn > 0) plume(rx, ry, 1.2, ang, 18 * burn + 6, t, burn);
    rocket2D(rx, ry, 1, ang, { upper: false, fins: 1, legs: seg(t, 25.75, 26.15) });
    if (t > 26.15) smoke(380, padY, t, 26.15, { n: 24, spread: 260, a: .35, s: .7 });
    if (t > 26.2) { const lp = seg(t, 26.2, 26.45); BB.tag(ctx, 'LANDED · REUSABLE', 380, padY - 620, { align: 'center', alpha: E.out3(lp) }); }
  }
  ctx.restore();
  // trajectory mini-map
  const mp = env(t, 22.6, 26.6, .3, .2); if (mp > 0) {
    const mx = SAFE.left, my = 300; panelBox(mx, my, 360, 220, mp); mono(ctx, 'TRAJECTORY', mx + 18, my + 32, { size: 16, color: C.white, alpha: mp });
    ctx.save(); ctx.globalAlpha = mp; ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.setLineDash([4, 5]); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(mx + 40, my + 190); ctx.quadraticCurveTo(mx + 120, my + 50, mx + 330, my + 70); ctx.stroke();
    ctx.strokeStyle = C.red; ctx.beginPath(); ctx.moveTo(mx + 120, my + 92); ctx.quadraticCurveTo(mx + 70, my + 120, mx + 60, my + 190); ctx.stroke(); ctx.setLineDash([]);
    const ph = seg(t, 22.45, 26.2); let px, py; if (ph < .45) { const u = ph / .45; px = (1 - u) ** 2 * (mx + 40) + 2 * (1 - u) * u * (mx + 120) + u * u * (mx + 200); py = (1 - u) ** 2 * (my + 190) + 2 * (1 - u) * u * (my + 50) + u * u * (my + 80); } else { const u = (ph - .45) / .55; px = lerp(mx + 120, mx + 60, u); py = lerp(my + 92, my + 190, E.in3(u)); }
    glow(ctx, px, py, 16, '255,59,48', 1); ctx.fillStyle = '#fff'; ctx.fillRect(px - 2, py - 2, 4, 4); ctx.restore();
  }
  BB.chapter(ctx, t, 20.55, 22.5, '01', 'AEROSPACE');
  BB.hud(ctx, t, { section: '01 · AEROSPACE' });
}

// 4) STARSHIP + COST 26.45 – 35.4
function sStarship(t) {
  BB.bg(ctx, t, { inner: '#111216' }); const lt = t - 26.45;
  BB.grid(ctx, t, { oy: lt * 10, alpha: .8, color: 'rgba(255,255,255,0.05)' });
  const out = E.io3(seg(t, 28.9, 29.5)); // ship moves aside for chart
  const s = lerp(1.08, .62, out); const x = lerp(540, 860, out), y = lerp(1520, 1240, out);
  // blueprint trace then fill
  starship(x, y, s, { trace: seg(t, 26.5, 27.6), fill: E.out3(seg(t, 27.3, 28.2)) });
  // dimension lines
  const dp = seg(t, 27.4, 28.2) * (1 - out);
  dimLine(x - 120 * s, y, x - 120 * s, y - 1004 * s, '', dp); mono(ctx, '~120 M', x - 130 * s, y - 502 * s, { align: 'right', color: C.white, alpha: dp, size: 20 });
  dimLine(x + 70 * s, y - 585 * s, x + 70 * s, y - 1004 * s, 'SHIP', dp); dimLine(x + 70 * s, y, x + 70 * s, y - 560 * s, 'BOOSTER', dp);
  if (lt < 3.2) {
    const a = 1 - seg(t, 28.9, 29.3);
    revealChars(ctx, 'THE BIGGEST BET', SAFE.left, 400, t - 27.2, { size: 46, weight: 800, color: C.dim, alpha: a });
    revealChars(ctx, 'STARSHIP', SAFE.left - 4, 520, t - 28.15, { size: 140, weight: 900, track: -4, alpha: a });
    mono(ctx, 'FULLY REUSABLE · TWO-STAGE · STAINLESS STEEL', SAFE.left, 572, { alpha: a * seg(t, 28.4, 28.9), color: C.white, size: 17 });
  }
  // cost chart
  if (t > 29.1) {
    const cp = seg(t, 29.1, 29.6); const X = SAFE.left, Y = 360;
    mono(ctx, 'EST. LAUNCH COST · USD PER KG TO LOW EARTH ORBIT', X, Y, { alpha: cp, color: C.white, size: 17 });
    // big counter
    let val = 54500; if (t > 30.4) val = lerp(54500, 2700, E.outExpo(seg(t, 30.4, 31.2))); if (t > 31.45) val = lerp(2700, 200, E.outExpo(seg(t, 31.45, 32.2)));
    const hit = seg(t, 31.45, 31.9); const col = t > 31.45 ? C.red : C.white;
    ctx.save(); const sc = 1 + .08 * Math.sin(Math.PI * hit); ctx.translate(X, Y + 160); ctx.scale(sc, sc);
    text(ctx, '$' + fmt(val), 0, 0, { size: 150, weight: 900, track: -5, color: col, alpha: cp }); ctx.restore();
    text(ctx, '/ KG', X + measure(ctx, '$' + fmt(val), 150, 900, F.disp, -5) + 18, Y + 160, { size: 44, weight: 700, color: C.dim, alpha: cp });
    const rows = [['SPACE SHUTTLE', 'RETIRED 2011', 54500, 29.3], ['FALCON 9', 'REUSABLE BOOSTER', 2700, 30.4], ['STARSHIP', 'LONG-TERM TARGET', 200, 31.45]];
    rows.forEach(([n, sub, val, at], i) => {
      const p = seg(t, at, at + .5); if (p <= 0) return; const ry = Y + 280 + i * 150; const bw = 560;
      text(ctx, n, X, ry, { size: 38, weight: 800, alpha: p, color: i === 2 ? C.red : C.white }); mono(ctx, sub, X, ry + 30, { alpha: p, size: 16 });
      ctx.save(); ctx.globalAlpha = p; ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(X, ry + 48, bw, 22);
      const w = Math.max(6, bw * Math.sqrt(val / 54500)) * E.outExpo(p);
      if (i < 2) { ctx.fillStyle = i === 0 ? '#9a9ca1' : C.white; ctx.fillRect(X, ry + 48, w, 22); }
      else { ctx.strokeStyle = C.red; ctx.setLineDash([6, 4]); ctx.lineWidth = 2; ctx.strokeRect(X + 1, ry + 49, Math.max(w, 34), 20); ctx.setLineDash([]); }
      text(ctx, '$' + fmt(val), X + bw - 6, ry - 2, { size: 30, weight: 700, align: 'right', alpha: p, color: i === 2 ? C.red : C.white }); ctx.restore();
    });
    mono(ctx, 'BAR LENGTH: SQRT SCALE · ROUNDED INDUSTRY ESTIMATES', X, Y + 700, { alpha: cp * .8, size: 14 });
    // stamp: target not achieved
    const st = seg(t, 33.6, 33.95); if (st > 0) {
      ctx.save(); ctx.translate(X + 300, Y + 830); ctx.rotate(-.05); const sc = lerp(1.6, 1, E.outExpo(st)); ctx.scale(sc, sc); ctx.globalAlpha = E.out3(st);
      ctx.strokeStyle = C.red; ctx.lineWidth = 4; ctx.strokeRect(-250, -46, 500, 92); text(ctx, 'IF ACHIEVED', 0, -2, { size: 40, weight: 900, align: 'center', color: C.red }); mono(ctx, 'TARGET · NOT YET DEMONSTRATED', 0, 28, { align: 'center', color: C.red, size: 16 }); ctx.restore();
    }
  }
  BB.hud(ctx, t, { section: '01 · AEROSPACE' });
}

// 5) ORBIT -> STARLINK -> FLOW  35.0 – 52.05 (one continuous camera)
function sStarlink(t) {
  BB.bg(ctx, t, { inner: '#08090b' }); BB.starfield(ctx, t, { alpha: .8, dx: -t * 4 });
  const e = { c: [0, 0, 0], R: 1, spin: -1.2 + t * .03, tilt: .38, sun: SUN, glow: 1.1 };
  // camera: from skimming low orbit (35.0) pulling back to full earth (38.8), slow orbit, then rise for revenue panel
  const pb = E.io5(seg(t, 35.2, 38.9));
  const d = lerp(1.9, 4.6, pb) + seg(t, 39, 48) * .4; const yaw = lerp(.9, .1, pb) + (t - 35) * .012;
  const up = E.io3(seg(t, 44.9, 45.8)) * (1 - E.io3(seg(t, 48.2, 49)));
  const dim = E.io3(seg(t, 48.3, 49.2));
  const cam = G3.camera([Math.sin(yaw) * d, lerp(.9, .9, pb), Math.cos(yaw) * d], [0, lerp(1.25, -.05, pb), 0], 42, { cy: lerp(960, 900, pb) + up * -330 + dim * -40 });
  ctx.save(); ctx.globalAlpha = 1 - dim * .55;
  G3.earthPix(ctx, cam, { ...e, g: .3, cities: 1 });
  const cnt = .1 + .9 * E.io3(seg(t, 41.8, 43.4));
  for (let k = 0; k < 8; k++) G3.orbitLine(ctx, cam, e, (53) * Math.PI / 180, k / 8 * Math.PI * 2, 1.09, { color: `rgba(255,255,255,${.07 * pb})` });
  constellation(cam, e, t, { count: t < 37.5 ? .08 : cnt, links: E.out3(seg(t, 42.4, 44.1)), pulses: seg(t, 43, 44), beams: env(t, 43.3, 49, .6, .6), red: .03 });
  ctx.restore();
  // rocket upper stage rising past early in this scene
  if (t < 37.6) { const u = seg(t, 35.0, 37.6); const x = lerp(340, 760, E.io3(u)), y = lerp(1500, 420, E.io3(u)); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,170,120,0.5)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(lerp(340, 760, E.io3(Math.max(0, u - .3))), lerp(1500, 420, E.io3(Math.max(0, u - .3)))); ctx.lineTo(x, y); ctx.stroke(); glow(ctx, x, y, 70 * (1 - u * .6), '255,190,140', 1); glow(ctx, x, y, 14, '255,255,255', 1); ctx.restore(); }
  sunFlare(120, 520, 260, .55 * (1 - seg(t, 37.5, 39)));
  BB.chapter(ctx, t, 37.45, 39.6, '02', 'STARLINK');
  // HUD callouts
  BB.scrim(ctx, 0, 760, .75 * Math.max(env(t, 39.5, 45.0, .3, .3), env(t, 48.4, 52.2, .3, .2)));
  const c1 = env(t, 39.6, 41.8, .3, .3); if (c1 > 0) { BB.reveal(ctx, 'COMMERCIAL', SAFE.left, 470, c1, { size: 100, weight: 900, track: -3 }); BB.reveal(ctx, 'ENGINE', SAFE.left, 570, c1, { size: 100, weight: 900, track: -3, color: C.red }); }
  const c2 = env(t, 41.9, 44.95, .3, .3); if (c2 > 0) {
    const n = Math.floor(lerp(0, 1000, E.out3(seg(t, 41.9, 42.9))));
    text(ctx, n >= 1000 ? 'THOUSANDS' : fmt(n * 9), SAFE.left, 470, { size: 100, weight: 900, track: -3, alpha: c2 });
    text(ctx, 'OF SATELLITES · LOW EARTH ORBIT', SAFE.left, 520, { size: 30, weight: 700, color: C.dim, alpha: c2 });
    if (t > 43.3) { BB.tag(ctx, 'LASER INTER-SATELLITE LINKS', SAFE.left, 560, { alpha: seg(t, 42.6, 43) * c2, size: 18 }); BB.tag(ctx, 'GLOBAL COVERAGE', SAFE.left, 610, { alpha: seg(t, 43.4, 43.8) * c2, size: 18, fill: '#fff', color: '#000' }); }
  }
  // recurring revenue panel 45 - 48.6
  const rp = env(t, 45.0, 48.7, .4, .4); if (rp > 0) {
    const X = SAFE.left, Y = 1000; panelBox(X, Y, 920, 330, rp);
    text(ctx, 'RECURRING REVENUE', X + 30, Y + 60, { size: 36, weight: 900, alpha: rp }); mono(ctx, 'ILLUSTRATIVE', X + 890, Y + 56, { align: 'right', alpha: rp, size: 15 });
    // subscription loop
    const cx = X + 140, cy = Y + 200, r = 82; ctx.save(); ctx.globalAlpha = rp; ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke();
    const ph = ((t - 45) * 1.1) % 1; ctx.strokeStyle = C.red; ctx.beginPath(); ctx.arc(cx, cy, r, -1.57, -1.57 + ph * 6.283); ctx.stroke();
    for (let k = 0; k < 12; k++) { const a = k / 12 * 6.283 - 1.57; ctx.fillStyle = '#fff'; ctx.fillRect(cx + Math.cos(a) * (r + 14) - 1, cy + Math.sin(a) * (r + 14) - 1, 2, 2); }
    text(ctx, 'MONTHLY', cx, cy + 8, { size: 22, weight: 800, align: 'center' }); ctx.restore();
    // compounding bars
    const bx = X + 290, by = Y + 290; const nb = 14; const grow = seg(t, 45.2, 47.6);
    for (let k = 0; k < nb; k++) { const p = clamp(grow * nb - k); if (p <= 0) continue; const h = (30 + 160 * Math.pow(k / (nb - 1), 1.5)) * E.outBack(p); ctx.fillStyle = k === nb - 1 ? C.red : `rgba(255,255,255,${.35 + .5 * k / nb})`; ctx.globalAlpha = rp; ctx.fillRect(bx + k * 42, by - h, 30, h); }
    ctx.globalAlpha = 1;
    // subscribers pictogram dots
    if (t > 46.7) { const sp = seg(t, 46.75, 47.9); text(ctx, 'MILLIONS', X + 890, Y + 120, { size: 44, weight: 900, align: 'right', alpha: rp * seg(t, 46.75, 47) }); mono(ctx, 'OF SUBSCRIBERS', X + 890, Y + 148, { align: 'right', alpha: rp * seg(t, 47.2, 47.5), size: 15 }); }
  }
  // revenue -> ambitions flow 48.5 - 52.05
  const fp = env(t, 48.5, 52.2, .4, .25); if (fp > 0) {
    const nodes = [[540, 720, 'STARLINK', 'CASH FLOW'], [300, 1160, 'STARSHIP', 'LAUNCH R&D'], [780, 1160, 'AI + COMPUTE', 'NEXT FRONTIER']];
    ctx.save(); ctx.globalAlpha = fp;
    [[0, 1], [0, 2]].forEach(([a, b], k) => {
      const A = nodes[a], B = nodes[b]; const lp = E.io3(seg(t, 49.2 + k * .15, 50.2 + k * .15));
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(A[0], A[1] + 70); ctx.bezierCurveTo(A[0], A[1] + 300, B[0], B[1] - 300, lerp(A[0], B[0], 1), lerp(A[1] + 70, B[1] - 80, lp)); ctx.stroke();
      // $ particles
      for (let q = 0; q < 10; q++) { const f = ((t - 49.2) * .55 + q / 10) % 1; if (lp < 1) continue; const u = f; const x = (1 - u) ** 3 * A[0] + 3 * (1 - u) ** 2 * u * A[0] + 3 * (1 - u) * u * u * B[0] + u ** 3 * B[0]; const y = (1 - u) ** 3 * (A[1] + 70) + 3 * (1 - u) ** 2 * u * (A[1] + 300) + 3 * (1 - u) * u * u * (B[1] - 300) + u ** 3 * (B[1] - 80); text(ctx, '$', x, y + 10, { size: 28, weight: 900, color: C.red, align: 'center', alpha: Math.sin(Math.PI * f) }); }
    });
    nodes.forEach(([x, y, n, sub], i) => { const p = seg(t, 48.6 + (i ? .9 + i * .15 : 0), 49.1 + (i ? .9 + i * .15 : 0)); if (p <= 0) return; panelBox(x - 200, y - 70, 400, 140, p, { bc: i === 0 ? C.red : undefined }); text(ctx, n, x, y + 8, { size: 44, weight: 900, align: 'center', alpha: p }); mono(ctx, sub, x, y + 44, { align: 'center', alpha: p, size: 16 }); });
    text(ctx, 'REVENUE THAT FUNDS THE', SAFE.left, 400, { size: 40, weight: 800, color: C.dim, alpha: seg(t, 48.6, 49.0) }); revealChars(ctx, 'LARGER AMBITIONS', SAFE.left - 2, 500, t - 50.5, { size: 96, weight: 900, track: -3, color: C.white });
    ctx.restore();
  }
  BB.hud(ctx, t, { section: '02 · STARLINK', alpha: seg(t, 37.4, 37.8) });
}

// 6) AI 52.05 – 61.6
const NN = (() => { const L = [5, 8, 10, 8, 5], r = rng(21), nodes = [], edges = []; L.forEach((n, li) => { for (let i = 0; i < n; i++) { const a = i / n * 6.283 + li; const rr = .35 + .45 * (n / 10); nodes.push({ l: li, p: [(li - 2) * .9, Math.sin(a) * rr, Math.cos(a) * rr] }); } }); let off = 0; L.forEach((n, li) => { if (li < L.length - 1) for (let i = 0; i < n; i++) for (let j = 0; j < L[li + 1]; j++) if (r() < .55) edges.push([off + i, off + n + j, r()]); off += n; }); return { nodes, edges }; })();
function sAI(t) {
  BB.bg(ctx, t, { inner: '#0d0d10' }); BB.grid(ctx, t, { ox: -t * 8, alpha: .6 });
  const lt = t - 52.05; const vennP = E.io3(seg(t, 57.2, 58.0));
  // neural network (3D)
  if (vennP < 1) {
    const ang = .5 + lt * .25; const cam = G3.camera([Math.sin(ang) * 4.6, 1.1, Math.cos(ang) * 4.6], [0, 0, 0], 38, { cy: 900 });
    ctx.save(); ctx.globalAlpha = 1 - vennP; const P = NN.nodes.map(n => cam.proj(n.p)); const build = seg(t, 52.1, 53.6);
    ctx.lineWidth = 1;
    NN.edges.forEach(([a, b, r], k) => { if (r > build * 1.1) return; const A = P[a], B = P[b]; ctx.strokeStyle = `rgba(255,255,255,${.12})`; ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke(); });
    // signal waves propagate layer to layer
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    NN.edges.forEach(([a, b, r], k) => { const la = NN.nodes[a].l; const ph = (lt * 1.6 - la * .25 - r * .2) % 1.25; if (ph < 0 || ph > 1 || r > .5 || build < 1) return; const A = P[a], B = P[b]; const x = lerp(A.x, B.x, ph), y = lerp(A.y, B.y, ph); ctx.strokeStyle = `rgba(255,70,50,.8)`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lerp(A.x, B.x, Math.max(0, ph - .25)), lerp(A.y, B.y, Math.max(0, ph - .25))); ctx.lineTo(x, y); ctx.stroke(); });
    ctx.restore();
    NN.nodes.forEach((n, i) => { const p = P[i]; const act = .5 + .5 * Math.sin(lt * 5 - n.l * 1.3 + i); const s = 5 + 5 * p.s / 600; ctx.fillStyle = act > .85 ? C.red : '#fff'; ctx.globalAlpha = (1 - vennP) * seg(build, i / NN.nodes.length * .8, i / NN.nodes.length * .8 + .2); ctx.beginPath(); ctx.arc(p.x, p.y, s, 0, 7); ctx.fill(); if (act > .85) glow(ctx, p.x, p.y, 28, '255,59,48', .6); });
    ctx.restore();
    // data stream columns (compute infrastructure)
    const dsP = env(t, 54.2, 57.6, .4, .4); if (dsP > 0) {
      const X = SAFE.left, Y = 1060; panelBox(X, Y, 920, 230, dsP);
      for (let k = 0; k < 16; k++) { const x = X + 30 + k * 54; for (let r2 = 0; r2 < 6; r2++) { const on = hash(k * 13 + r2 * 7 + Math.floor(t * 12)) > .55; ctx.fillStyle = on ? (hash(k + r2) > .85 ? C.red : 'rgba(255,255,255,0.85)') : 'rgba(255,255,255,0.08)'; ctx.globalAlpha = dsP; ctx.fillRect(x, Y + 26 + r2 * 26, 40, 14); } }
      ctx.globalAlpha = 1; mono(ctx, 'GPU CLUSTER · TRAINING + INFERENCE', X + 30, Y + 205, { alpha: dsP, size: 16, color: C.white }); mono(ctx, `${(1.2 + lt * .73).toFixed(2)} EFLOP/S`, X + 890, Y + 205, { align: 'right', alpha: dsP, size: 16, color: C.red });
    }
    const xa = env(t, 54.5, 57.4, .3, .3); if (xa > 0) {
      text(ctx, 'xAI', SAFE.left - 4, 470, { size: 150, weight: 900, track: -6, alpha: xa });
      text(ctx, 'INTEGRATED INTO THE ECOSYSTEM', SAFE.left, 530, { size: 30, weight: 700, color: C.dim, alpha: xa }); BB.tag(ctx, 'LAUNCH  +  STARLINK  +  AI', SAFE.left, 560, { alpha: xa * seg(t, 55.6, 56), size: 18 });
    }
  }
  // Venn: SPACE ∩ COMPUTING
  if (vennP > 0) {
    const sep = lerp(260, 120, E.io3(seg(t, 57.6, 59.4))); const cy = 860, R = 240; const a = vennP * (1 - seg(t, 61.3, 61.7));
    ctx.save(); ctx.globalAlpha = a;
    const L = [W / 2 - sep, cy], Rr = [W / 2 + sep, cy];
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(L[0], L[1], R, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(Rr[0], Rr[1], R, 0, 7); ctx.stroke();
    // intersection fill
    const ip = seg(t, 59.2, 59.9); ctx.save(); ctx.beginPath(); ctx.arc(L[0], L[1], R, 0, 7); ctx.clip(); ctx.beginPath(); ctx.arc(Rr[0], Rr[1], R, 0, 7); ctx.fillStyle = `rgba(229,37,42,${.85 * ip})`; ctx.fill(); ctx.restore();
    // orbiting particles in each circle
    for (let k = 0; k < 40; k++) { const an = k / 40 * 6.283 + t * .4; ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(L[0] + Math.cos(an) * (R - 16) - 1, L[1] + Math.sin(an) * (R - 16) - 1, 2, 2); const an2 = k / 40 * 6.283 - t * .4; ctx.fillRect(Rr[0] + Math.cos(an2) * (R - 16) - 1, Rr[1] + Math.sin(an2) * (R - 16) - 1, 2, 2); }
    icon('sat', L[0] - 90, cy - 40, 1.1, 1); icon('chip', Rr[0] + 90, cy - 40, 1.1, 1);
    text(ctx, 'SPACE', L[0] - 90, cy + 70, { size: 40, weight: 900, align: 'center' }); text(ctx, 'COMPUTING', Rr[0] + 90, cy + 70, { size: 40, weight: 900, align: 'center' });
    if (ip > 0) { text(ctx, 'SPACEX', W / 2, cy + 14, { size: 40, weight: 900, align: 'center', alpha: ip }); }
    ctx.restore();
    const ta = a * seg(t, 58.4, 58.9); revealChars(ctx, 'AT THE', SAFE.left, 1240, t - 58.8, { size: 44, weight: 800, color: C.dim, alpha: a }); revealChars(ctx, 'INTERSECTION', SAFE.left - 2, 1320, t - 59.2, { size: 92, weight: 900, track: -3, alpha: a });
  }
  BB.chapter(ctx, t, 52.05, 54.35, '03', 'ARTIFICIAL\nINTELLIGENCE', { y: 520 });
  BB.hud(ctx, t, { section: '03 · AI' });
}

// 7) ORBITAL DATA CENTRES 61.6 – 74.75 (centrepiece)
let ODC = null;
function buildODC() {
  const q = []; const steel = [200, 202, 206], dark = [44, 46, 52], panelC = [20, 24, 32], rad = [228, 228, 224];
  q.push(...G3.box([0, 0, 0], [4.6, .06, .06], steel)); q.push(...G3.box([0, 0, 0], [.06, .06, 2.6], steel));
  // compute modules: slim pressurised racks along the spine
  for (let k = -1.5; k <= 1.5; k += 1) { q.push(...G3.box([k * .78, 0, 0], [.3, .24, .24], dark, { edgeCol: 'rgba(255,255,255,0.28)' })); q.push(...G3.box([k * .78, .245, 0], [.26, .006, .03], [150, 20, 24], { em: .8, edge: false, mod: k })); }
  // solar wings: 2 per side, long and thin
  for (const sx of [-1, 1]) for (const k of [0, 1]) { const cx = sx * (2.0 + k * 1.55); q.push(...G3.panel([cx, 0, 1.25], [.72, 0, 0], [0, 0, .95], panelC, { cells: [6, 8], glint: .9, cellCol: 'rgba(170,190,220,0.28)' })); q.push(...G3.panel([cx, 0, -1.25], [.72, 0, 0], [0, 0, .95], panelC, { cells: [6, 8], glint: .9, cellCol: 'rgba(170,190,220,0.28)' })); }
  // radiators: white fins standing edge-on to the sun
  for (const k of [-1, 1]) q.push(...G3.panel([k * .78, .78, 0], [.5, 0, 0], [0, .5, 0], rad, { rad: 1, cells: [5, 1], cellCol: 'rgba(0,0,0,0.25)' }));
  // laser terminals
  q.push(...G3.box([4.7, 0, 0], [.1, .1, .1], [70, 70, 74])); q.push(...G3.box([-4.7, 0, 0], [.1, .1, .1], [70, 70, 74])); q.push(...G3.box([0, 0, 2.7], [.1, .1, .1], [70, 70, 74]));
  ODC = q;
}
function odcAt(pos, rotYv, sc) { return G3.xform(ODC, p => v.add(pos, v.mul(G3.rotY(p, rotYv), sc)), n => G3.rotY(n, rotYv)); }
function sODC(t) {
  BB.bg(ctx, t, { inner: '#07080a' }); BB.starfield(ctx, t, { alpha: .9, dx: -t * 6 });
  const lt = t - 61.6;
  // camera move: wide orbital vista -> hero close orbit -> wide with downlinks
  const k1 = E.io5(seg(t, 62.8, 65.0)); const k2 = E.io3(seg(t, 69.8, 72.0));
  const ang = -0.75 + lt * .07; const dist = lerp(40, 12.5, k1) + k2 * 10;
  const camPos = [Math.sin(ang) * dist, lerp(9, 4.2, k1) + k2 * 3, Math.cos(ang) * dist]; const tgt = [0, lerp(-4, -.4, k1) - k2 * 2.2, 0];
  const cam = G3.camera(camPos, tgt, 40, { cy: 860 });
  // earth far below
  const e = { c: [0, -44, -8], R: 36, spin: 1.9 + t * .004, tilt: .5, sun: G3.v.norm([-1, .5, -.2]), glow: 1.4, g: .12 };
  G3.earthPix(ctx, cam, e);
  // sun
  const sunP = cam.proj(v.add(camPos, v.mul(v.norm([-1, .5, -.2]), 200))); if (sunP) sunFlare(sunP.x, sunP.y, 420, .9);
  const build = E.out3(seg(t, 64.6, 66.4));
  // satellite cluster: hero + 4 satellites stations
  const sats = [[0, 0, 0, .0, 1], [-15, .8, -10, .6, .5], [13, -.5, -13, -.4, .5], [-9, 1.4, 12, 1.1, .45], [16, 1.0, 8, .3, .45]];
  const meshes = []; const sunV = v.norm([-1, .5, -.2]);
  sats.forEach(([x, y, z, r, s], i) => { if (i > 0 && build < .2 + i * .15) return; meshes.push(...odcAt([x, y + Math.sin(t * .4 + i) * .05, z], r + t * .02 * (i ? 1 : 0), s)); });
  // laser links between stations (behind first)
  const lk = E.io3(seg(t, 67.4, 68.6));
  const drawLinks = () => {
    if (lk <= 0) return; ctx.save(); ctx.globalCompositeOperation = 'lighter';
    [[0, 1], [0, 2], [0, 3], [0, 4], [1, 3], [2, 4]].forEach(([a, b], k) => {
      const A = cam.proj(sats[a].slice(0, 3)), B = cam.proj(sats[b].slice(0, 3)); if (!A || !B) return; const p = clamp(lk * 1.5 - k * .1);
      const x = lerp(A.x, B.x, p), y = lerp(A.y, B.y, p);
      ctx.strokeStyle = 'rgba(255,50,40,0.35)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(x, y); ctx.stroke(); ctx.strokeStyle = 'rgba(255,200,190,0.9)'; ctx.lineWidth = 1.5; ctx.stroke();
      for (let q = 0; q < 3; q++) { const f = (t * .8 + q / 3 + k * .2) % 1; if (f < p) glow(ctx, lerp(A.x, B.x, f), lerp(A.y, B.y, f), 16, '255,235,225', .9); }
    }); ctx.restore();
  };
  drawLinks();
  if (build > 0) G3.drawMesh(ctx, cam, meshes.map(q => q.mod !== undefined ? { ...q, em: .25 + .5 * (.5 + .5 * Math.sin(t * 6 + q.mod * 2)) * seg(t, 70.3, 71) + .2 } : q), { sun: sunV, amb: .26, alpha: build });
  // sunlight rays hitting panels (energy collection)
  const ray = env(t, 64.6, 70.4, .6, .6); if (ray > 0) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const pc = cam.proj([sx * 2.8, 0, sz * 1.25]); if (!pc) continue; for (let k = 0; k < 4; k++) { const f = ((t * .7 + k / 4 + sx * .1 + sz * .2) % 1); const src = v.add([sx * 2.8, 0, sz * 1.25], v.mul(sunV, 6 * (1 - f))); const sp = cam.proj(src); if (!sp) continue; glow(ctx, sp.x, sp.y, 10, '255,240,200', ray * .9 * f); } glow(ctx, pc.x, pc.y, 60, '255,240,210', .25 * ray); }
    ctx.restore();
  }
  // data processing pulses on modules + downlink to Earth
  const dl = E.io3(seg(t, 72.4, 73.4)); if (dl > 0) {
    const A = cam.proj([0, -.2, 0]); const ground = cam.proj([1.5, -6, -2]); if (A && ground) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; const yb = lerp(A.y, Math.min(H, A.y + 1400), dl);
      const gr = ctx.createLinearGradient(0, A.y, 0, yb); gr.addColorStop(0, 'rgba(255,70,50,0.9)'); gr.addColorStop(1, 'rgba(255,70,50,0.05)'); ctx.strokeStyle = gr; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(A.x + (yb - A.y) * .1, yb); ctx.stroke();
      for (let q = 0; q < 8; q++) { const f = (t * 1.1 + q / 8) % 1; if (f > dl) continue; const y = lerp(A.y, A.y + 1400, f); text(ctx, hash(q + Math.floor(t * 4)) > .5 ? '1' : '0', A.x + (y - A.y) * .1 + 16, y, { size: 22, weight: 700, fam: F.mono, color: '#ffd5cc', alpha: 1 - f }); }
      ctx.restore();
    }
  }
  // callouts on hero station
  const callout = (wp, label, sub, a, dx, dy) => { if (a <= 0) return; const p = cam.proj(wp); if (!p) return; const x2 = p.x + dx, y2 = p.y + dy; ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(x2, y2); ctx.lineTo(x2 + (dx > 0 ? 40 : -40), y2); ctx.stroke(); ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, 7); ctx.fill(); ctx.restore(); const al = dx > 0 ? 'left' : 'right'; const xx = x2 + (dx > 0 ? 50 : -50); text(ctx, label, xx, y2 + 8, { size: 28, weight: 900, align: al, alpha: a }); mono(ctx, sub, xx, y2 + 34, { size: 15, align: al, alpha: a }); };
  callout([-3.55, 0, 1.25], 'SOLAR ARRAYS', 'NEAR-CONSTANT SUNLIGHT', env(t, 65.0, 69.6, .4, .4), 40, -260);
  callout([1.17, 0, 0], 'COMPUTE MODULES', 'GPU RACKS IN ORBIT', env(t, 65.4, 69.6, .4, .4), 40, 230);
  callout([-.78, 1.1, 0], 'RADIATORS', 'HEAT REJECTION', env(t, 65.9, 69.6, .4, .4), -60, -170);
  // typography
  const q1 = env(t, 61.62, 63.0, .3, .25); if (q1 > 0) { revealChars(ctx, 'THE LONG-TERM', SAFE.left, 520, t - 61.7, { size: 64, weight: 800, color: C.dim, alpha: q1 }); revealChars(ctx, 'VISION?', SAFE.left - 4, 650, t - 62.2, { size: 140, weight: 900, track: -4, alpha: q1 }); }
  const q2 = env(t, 63.0, 64.8, .2, .3); BB.scrim(ctx, 0, 900, .7 * Math.max(q2, env(t, 61.62, 63.0, .3, .25))); if (q2 > 0) { revealChars(ctx, 'ORBITAL', SAFE.left - 4, 520, t - 63.06, { size: 150, weight: 900, track: -5, alpha: q2 }); revealChars(ctx, 'DATA', SAFE.left - 4, 660, t - 63.4, { size: 150, weight: 900, track: -5, alpha: q2 }); revealChars(ctx, 'CENTRES', SAFE.left - 4, 800, t - 63.62, { size: 150, weight: 900, track: -5, alpha: q2, color: C.red }); }
  const q3 = env(t, 67.5, 70.2, .3, .3); if (q3 > 0) { BB.tag(ctx, 'OPTICAL LASER CROSS-LINKS', SAFE.left, 330, { alpha: q3, size: 18 }); }
  const q4 = env(t, 70.3, 74.8, .3, .3); if (q4 > 0) {
    BB.tag(ctx, 'PROCESS IN ORBIT', SAFE.left, 330, { alpha: q4 * seg(t, 70.9, 71.3), size: 18 }); BB.tag(ctx, '→ TRANSMIT RESULTS TO EARTH', SAFE.left, 380, { alpha: q4 * seg(t, 72.5, 72.9), size: 18, fill: '#fff', color: '#000' });
  }
  mono(ctx, 'CONCEPT VISUALISATION · PROPOSED TECHNOLOGY', SAFE.left, 1300, { size: 14, alpha: seg(t, 64.6, 65.4) * .8 });
  BB.hud(ctx, t, { section: 'THE LONG-TERM VISION' });
}

// 8) RISKS 74.75 – 91.6
function sRisk(t) {
  BB.bg(ctx, t, { inner: '#120b0c' }); BB.grid(ctx, t, { oy: t * 10, alpha: .6, color: 'rgba(255,80,70,0.05)' });
  // red alert sweep intro
  const intro = env(t, 74.75, 77.6, .2, .3);
  if (intro > 0) {
    revealChars(ctx, 'BUT THE OPPORTUNITY', SAFE.left, 560, t - 74.8, { size: 54, weight: 800, color: C.dim, alpha: intro });
    revealChars(ctx, 'COMES WITH', SAFE.left, 630, t - 75.4, { size: 54, weight: 800, color: C.dim, alpha: intro });
    revealChars(ctx, 'SERIOUS', SAFE.left - 4, 790, t - 76.15, { size: 160, weight: 900, track: -5, alpha: intro });
    revealChars(ctx, 'CHALLENGES', SAFE.left - 4, 940, t - 76.55, { size: 160, weight: 900, track: -5, color: C.red, alpha: intro });
    // warning chevrons
    ctx.save(); ctx.globalAlpha = intro * .9; for (let k = 0; k < 14; k++) { const x = ((k * 90 + t * 120) % (W + 90)) - 90; ctx.fillStyle = k % 2 ? C.red : '#1a0a0b'; ctx.beginPath(); ctx.moveTo(x, 1060); ctx.lineTo(x + 45, 1060); ctx.lineTo(x + 90, 1100); ctx.lineTo(x + 45, 1100); ctx.fill(); } ctx.restore();
  }
  // four tiles
  const tiles = [['COOLING', 'THERMAL MANAGEMENT', 'therm', 77.72], ['RADIATION', 'COSMIC RAYS · BIT FLIPS', 'rad', 78.46], ['MAINTENANCE', 'NO TECHNICIAN ON SITE', 'wrench', 79.28], ['LAUNCH ECONOMICS', 'COST PER KG · CADENCE', 'dollar', 80.16]];
  const tA = env(t, 77.6, 82.5, .2, .4);
  if (tA > 0) tiles.forEach(([n, sub, ic, at], i) => {
    const p = seg(t, at - .05, at + .35); if (p <= 0) return; const col = i % 2, row = Math.floor(i / 2); const x = SAFE.left + col * 470, y = 360 + row * 420, w = 450, h = 400;
    ctx.save(); ctx.globalAlpha = tA; const s = lerp(.9, 1, E.outExpo(p)); ctx.translate(x + w / 2, y + h / 2); ctx.scale(s, s); ctx.translate(-x - w / 2, -y - h / 2);
    panelBox(x, y, w, h, p, { bc: C.red });
    // mini animations
    const cx = x + w / 2, cy = y + 160; const lt = t - at;
    if (i === 0) { // radiator heat
      for (let k = 0; k < 6; k++) { const hh = .5 + .5 * Math.sin(lt * 3 + k); const g = ctx.createLinearGradient(0, cy - 90, 0, cy + 90); g.addColorStop(0, `rgba(255,${80 + 100 * (1 - hh)},60,0.95)`); g.addColorStop(1, 'rgba(255,255,255,0.15)'); ctx.fillStyle = g; ctx.fillRect(cx - 150 + k * 52, cy - 90, 40, 180); }
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2; for (let k = 0; k < 3; k++) { const f = (lt * .8 + k / 3) % 1; ctx.globalAlpha = tA * (1 - f); ctx.beginPath(); ctx.arc(cx, cy, 120 + f * 60, -.6, .6); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, cy, 120 + f * 60, Math.PI - .6, Math.PI + .6); ctx.stroke(); } ctx.globalAlpha = tA;
      mono(ctx, 'NO AIR · RADIATE ONLY', cx, cy + 120, { align: 'center', size: 15, color: C.white });
    }
    if (i === 1) { // chip with particle strikes
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2; ctx.strokeRect(cx - 80, cy - 80, 160, 160); for (let a = 0; a < 8; a++) for (let b = 0; b < 8; b++) { const flip = hash(a * 8 + b + Math.floor(lt * 6) * 64) > .93; ctx.fillStyle = flip ? C.red : 'rgba(255,255,255,0.2)'; ctx.fillRect(cx - 70 + a * 18, cy - 70 + b * 18, 12, 12); }
      for (let k = 0; k < 5; k++) { const f = (lt * 1.4 + k * .21) % 1; const sx = cx - 200 + hash(k + Math.floor(lt * 1.4 + k * .21)) * 400; ctx.strokeStyle = `rgba(255,230,220,${1 - f})`; ctx.beginPath(); ctx.moveTo(sx, cy - 140); ctx.lineTo(lerp(sx, cx, f), lerp(cy - 140, cy, f)); ctx.stroke(); }
      mono(ctx, '0 → 1  SINGLE-EVENT UPSET', cx, cy + 120, { align: 'center', size: 15, color: C.white });
    }
    if (i === 2) { // unreachable module
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2; ctx.strokeRect(cx - 50, cy - 40, 100, 80); ctx.strokeRect(cx - 150, cy - 18, 90, 36); ctx.strokeRect(cx + 60, cy - 18, 90, 36);
      const bl = Math.sin(lt * 10) > 0; ctx.fillStyle = bl ? C.red : '#300'; ctx.fillRect(cx - 12, cy - 12, 24, 24);
      ctx.setLineDash([6, 6]); ctx.strokeStyle = C.red; ctx.beginPath(); ctx.arc(cx, cy, 110 + 6 * Math.sin(lt * 3), 0, 7); ctx.stroke(); ctx.setLineDash([]);
      mono(ctx, '550 KM FROM THE NEAREST ENGINEER', cx, cy + 140, { align: 'center', size: 15, color: C.white });
    }
    if (i === 3) { // uncertain cost curve
      ctx.beginPath(); ctx.strokeStyle = C.white; ctx.lineWidth = 3; const pts = []; for (let k = 0; k <= 30; k++) { const u = k / 30; pts.push([cx - 160 + u * 320, cy - 80 + 150 * (1 - Math.exp(-u * 3)) * .6]); }
      ctx.fillStyle = 'rgba(229,37,42,0.25)'; ctx.beginPath(); pts.forEach(([px, py], k) => { const sp = k / 30 * 70; k ? ctx.lineTo(px, py - sp) : ctx.moveTo(px, py - sp); }); for (let k = 30; k >= 0; k--) { const [px, py] = pts[k]; ctx.lineTo(px, py + k / 30 * 70); } ctx.fill();
      ctx.beginPath(); const dp = seg(lt, 0, 1); pts.forEach(([px, py], k) => { if (k / 30 > dp) return; k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }); ctx.stroke(); text(ctx, '?', cx + 170, cy + 30, { size: 60, weight: 900, color: C.red });
      mono(ctx, 'UNCERTAINTY WIDENS OVER TIME', cx, cy + 120, { align: 'center', size: 15, color: C.white });
    }
    icon(tiles[i][2], x + 50, y + h - 85, .6, 1, C.red);
    text(ctx, n, x + 90, y + h - 70, { size: n.length > 12 ? 30 : 40, weight: 900 }); mono(ctx, sub, x + 90, y + h - 40, { size: 15 });
    ctx.restore();
  });
  // UNRESOLVED stamp
  const us = env(t, 81.3, 82.5, .25, .4); if (us > 0) { ctx.save(); ctx.translate(W / 2, 1220); ctx.rotate(-.04); ctx.scale(lerp(1.4, 1, E.outExpo(seg(t, 81.3, 81.6))), lerp(1.4, 1, E.outExpo(seg(t, 81.3, 81.6)))); ctx.globalAlpha = us; ctx.fillStyle = C.red; ctx.fillRect(-300, -50, 600, 100); text(ctx, 'UNRESOLVED', 0, 26, { size: 76, weight: 900, align: 'center', track: -2 }); ctx.restore(); }
  // investment risk big type
  const ir = env(t, 82.05, 85.1, .2, .3); if (ir > 0) {
        revealChars(ctx, 'THE REAL', SAFE.left, 640, t - 83.3, { size: 64, weight: 800, color: C.dim, alpha: ir });
    revealChars(ctx, 'INVESTMENT', SAFE.left - 4, 800, t - 83.7, { size: 150, weight: 900, track: -5, alpha: ir });
    revealChars(ctx, 'RISK', SAFE.left - 4, 960, t - 84.1, { size: 150, weight: 900, track: -5, alpha: ir, color: C.red });
    { const gx = W / 2, gy = 1300, gr = 260; ctx.save(); ctx.globalAlpha = ir; ctx.lineWidth = 26;
      const segs = 24; for (let k = 0; k < segs; k++) { const a0 = Math.PI + k / segs * Math.PI, a1 = a0 + Math.PI / segs * .8; ctx.strokeStyle = k > 16 ? C.red : `rgba(255,255,255,${.15 + .4 * k / segs})`; ctx.beginPath(); ctx.arc(gx, gy, gr, a0, a1); ctx.stroke(); }
      const nv = E.outBack(seg(t, 82.6, 84.3)) * .86 + .015 * Math.sin(t * 9) * seg(t, 84, 84.5); const na = Math.PI + nv * Math.PI;
      ctx.strokeStyle = C.white; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + Math.cos(na) * (gr - 40), gy + Math.sin(na) * (gr - 40)); ctx.stroke();
      ctx.fillStyle = C.white; ctx.beginPath(); ctx.arc(gx, gy, 14, 0, 7); ctx.fill(); ctx.restore();
      mono(ctx, 'LOW', gx - gr, gy + 40, { align: 'center', alpha: ir, size: 16 }); mono(ctx, 'HIGH', gx + gr, gy + 40, { align: 'center', alpha: ir, size: 16, color: C.red }); }
  }
  // valuation composition 85.0 – 91.6
  const vp = env(t, 85.0, 91.7, .35, .3); if (vp > 0) {
    const X = SAFE.left, Y = 420; mono(ctx, 'WHAT INVESTORS ARE PRICING IN', X, Y, { color: C.white, alpha: vp });
    revealChars(ctx, 'ONE VALUATION,', X - 2, Y + 100, t - 85.1, { size: 74, weight: 900, track: -2, alpha: vp }); revealChars(ctx, 'TWO REALITIES', X - 2, Y + 180, t - 85.4, { size: 74, weight: 900, track: -2, alpha: vp, color: C.red });
    // stacked bar
    const bx = X, by = Y + 280, bw = 920, bh = 140; const g1 = E.outExpo(seg(t, 85.4, 86.4)), g2 = E.outExpo(seg(t, 87.5, 88.6));
    ctx.save(); ctx.globalAlpha = vp; ctx.fillStyle = C.white; ctx.fillRect(bx, by, bw * .46 * g1, bh); text(ctx, 'REVENUE TODAY', bx + 20, by + 56, { size: 30, weight: 900, color: '#000', alpha: seg(t, 86, 86.4) }); mono(ctx, 'LAUNCH · STARLINK', bx + 20, by + 90, { size: 15, color: '#333', alpha: seg(t, 86, 86.4) });
    if (g2 > 0) { const x0 = bx + bw * .46 + 8; ctx.save(); ctx.beginPath(); ctx.rect(x0, by, (bw * .54 - 8) * g2, bh); ctx.clip(); ctx.strokeStyle = C.red; ctx.lineWidth = 3; for (let k = -20; k < 40; k++) { ctx.beginPath(); ctx.moveTo(x0 + k * 22 + (t * 20) % 22, by); ctx.lineTo(x0 + k * 22 - 60 + (t * 20) % 22, by + bh); ctx.stroke(); } ctx.restore(); ctx.strokeStyle = C.red; ctx.setLineDash([8, 6]); ctx.lineWidth = 2; ctx.strokeRect(x0, by, (bw * .54 - 8) * g2, bh); ctx.setLineDash([]); }
    text(ctx, 'UNPROVEN TECH', bx + bw - 20, by + 56, { size: 30, weight: 900, align: 'right', alpha: seg(t, 88.3, 88.7), color: C.white }); mono(ctx, 'ORBITAL COMPUTE · AI', bx + bw - 20, by + 90, { size: 15, align: 'right', alpha: seg(t, 88.3, 88.7), color: C.white });
    ctx.restore();
    text(ctx, 'VALUED', bx + bw * .46 + 4, by - 26, { size: 22, weight: 800, align: 'center', alpha: vp * seg(t, 87.2, 87.6), color: C.dim }); text(ctx, 'ALONGSIDE', bx + bw * .46 + 4, by - 4, { size: 22, weight: 800, align: 'center', alpha: vp * seg(t, 87.6, 88), color: C.dim });
    // viability question
    const qv = seg(t, 89.8, 90.6); if (qv > 0) { panelBox(bx, by + 200, 920, 170, qv, { bc: C.red }); text(ctx, 'COMMERCIAL VIABILITY', bx + 30, by + 280, { size: 50, weight: 900, alpha: qv }); mono(ctx, 'STATUS: YET TO BE PROVEN', bx + 30, by + 324, { color: C.red, alpha: qv, size: 18 }); text(ctx, '?', bx + 880, by + 335, { size: 140, weight: 900, color: C.red, align: 'right', alpha: qv * (.7 + .3 * Math.sin(t * 6)) }); }
  }
  BB.hud(ctx, t, { section: 'RISKS & CHALLENGES' });
}

// 9) VERTICAL INTEGRATION 91.6 – 107.8
function slab(cam, y, h, sz, col, opts = {}) { return G3.box([0, y, 0], [sz, h, sz], col, opts); }
function sVI(t) {
  BB.bg(ctx, t, { inner: '#101115' }); BB.grid(ctx, t, { oy: -t * 8, alpha: .7 });
  const lt = t - 91.6;
  const titleA = env(t, 91.65, 94.4, .2, .3);
  if (titleA > 0) {
    revealChars(ctx, 'THE BIGGER THESIS', SAFE.left, 560, t - 91.7, { size: 54, weight: 800, color: C.dim, alpha: titleA });
    revealChars(ctx, 'VERTICAL', SAFE.left - 4, 740, t - 92.8, { size: 170, weight: 900, track: -6, alpha: titleA });
    revealChars(ctx, 'INTEGRATION', SAFE.left - 4, 900, t - 93.2, { size: 128, weight: 900, track: -6, alpha: titleA, color: C.red });
    // three converging bars
    for (let k = 0; k < 3; k++) { const p = E.io3(seg(t, 93.3 + k * .1, 94.1 + k * .1)); ctx.fillStyle = k === 1 ? C.red : 'rgba(255,255,255,0.8)'; ctx.globalAlpha = titleA; ctx.fillRect(SAFE.left, 980 + k * 26, 920 * p, 10); } ctx.globalAlpha = 1;
  }
  if (t > 94.2) {
    const a = seg(t, 94.2, 94.7); const asm = E.io3(seg(t, 102.2, 103.4)); // assembly: layers lock together
    const ang = .75 + (t - 94) * .1 + asm * .4; const cam = G3.camera([Math.sin(ang) * 18, 9.8, Math.cos(ang) * 18], [0, .1, 0], 38, { cx: 700, cy: 880 });
    const layers = [['LAUNCH', 'LAUNCHING PAYLOADS', 97.3, 'rocket'], ['CONNECTIVITY', 'CONNECTING THE WORLD', 98.5, 'sat'], ['COMPUTING', 'POWERING FUTURE COMPUTE', 99.76, 'chip']];
    const meshes = []; const pos = [];
    layers.forEach(([n], i) => {
      const p = E.outExpo(seg(t, layers[i][2] - .1, layers[i][2] + .6)); const pre = E.out3(seg(t, 94.25 + i * .14, 95.0 + i * .14));
      const gap = lerp(1.9, 1.05, asm); const y = (i - 1) * gap + (1 - pre) * 6;
      const col = p > 0 ? (i === 1 ? [200, 34, 38] : [214, 216, 220]) : [40, 42, 47]; const k = lerp(.0, 1, p);
      const c2 = [lerp(40, col[0], k), lerp(42, col[1], k), lerp(47, col[2], k)];
      if (pre > 0) { meshes.push(...G3.box([0, y, 0], [1.7, .14, 1.7], c2, { edgeCol: 'rgba(255,255,255,0.35)' })); pos.push({ y, p, pre, i }); }
    });
    // integration spine
    if (asm > 0) { meshes.push(...G3.box([0, 0, 0], [.18, 1.25 * asm + .01, .18], [255, 59, 48], { em: .6, edge: false })); }
    ctx.save(); ctx.globalAlpha = a; G3.drawMesh(ctx, cam, meshes, { sun: v.norm([.4, 1, .6]), amb: .35 });
    // top-face glyphs & connectors
    pos.forEach(({ y, p, i }) => {
      const top = y + .15;
      ctx.strokeStyle = `rgba(255,255,255,${.25 + .5 * p})`; ctx.lineWidth = 1; ctx.beginPath();
      for (let g = -1.275; g <= 1.3; g += .425) { const a1 = cam.proj([g, top, -1.7]), b1 = cam.proj([g, top, 1.7]), a2 = cam.proj([-1.7, top, g]), b2 = cam.proj([1.7, top, g]); ctx.moveTo(a1.x, a1.y); ctx.lineTo(b1.x, b1.y); ctx.moveTo(a2.x, a2.y); ctx.lineTo(b2.x, b2.y); }
      ctx.globalAlpha = a * .5 * p; ctx.stroke(); ctx.globalAlpha = a;
      // label leader to right
    });
    ctx.restore();
    // labels (left column, numbered)
    layers.forEach(([n, sub, at, ic], i) => {
      const p = seg(t, at - .1, at + .4); if (p <= 0) return; const gap = lerp(1.9, 1.05, E.io3(seg(t, 102.2, 103.4)));
      const an = cam.proj([-1.7, (i - 1) * gap, 1.7]); const yy = an.y + 10; const x = SAFE.left; ctx.save(); ctx.globalAlpha = E.out3(p) * (1 - seg(t, 102.2, 102.6));
      text(ctx, '0' + (i + 1), x, yy - 44, { size: 20, weight: 700, fam: F.mono, color: C.red, track: 2 });
      text(ctx, n, x, yy, { size: 40, weight: 900, track: -1 }); mono(ctx, sub, x, yy + 28, { size: 15 }); ctx.restore();
    });
    const ttl = env(t, 94.3, 102.2, .3, .3); BB.scrim(ctx, 0, 700, .6 * Math.max(ttl, env(t, 102.25, 108, .3, .2))); if (ttl > 0) { revealChars(ctx, 'THREE CRITICAL', SAFE.left, 400, t - 95.6, { size: 54, weight: 800, color: C.dim, alpha: ttl }); revealChars(ctx, 'LAYERS', SAFE.left - 2, 500, t - 96.3, { size: 104, weight: 900, track: -3, alpha: ttl }); }
    const fin = env(t, 102.25, 108.0, .3, .2); if (fin > 0) {
      BB.tag(ctx, 'ONE INTEGRATED STACK', SAFE.left, 330, { alpha: fin, size: 20 });
      revealChars(ctx, 'STRATEGICALLY', SAFE.left - 2, 450, t - 104.5, { size: 86, weight: 900, track: -3, alpha: fin });
      revealChars(ctx, 'IMPORTANT', SAFE.left - 2, 535, t - 105.1, { size: 86, weight: 900, track: -3, alpha: fin, color: C.red });
      revealChars(ctx, 'INFRASTRUCTURE', SAFE.left - 2, 620, t - 105.8, { size: 86, weight: 900, track: -3, alpha: fin });
      mono(ctx, '— IF IT SUCCEEDS', SAFE.left, 670, { alpha: fin * seg(t, 102.5, 103), color: C.white });
    }
    // energy pulses up the spine after assembly
    if (asm >= 1) { const sp = cam.proj([0, -1.2, 0]), tp = cam.proj([0, 1.3, 0]); ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let q = 0; q < 4; q++) { const f = (t * .9 + q / 4) % 1; glow(ctx, lerp(sp.x, tp.x, f), lerp(sp.y, tp.y, f), 40, '255,90,70', .8); } ctx.restore(); }
  }
  BB.hud(ctx, t, { section: 'VERTICAL INTEGRATION' });
}

// 10) CLOSING 107.8 – 115.95
function sClose(t) {
  BB.bg(ctx, t, { inner: '#060607' }); BB.starfield(ctx, t, { alpha: .9, dx: -t * 5 });
  const lt = t - 107.8; const ang = -.6 + lt * .045;
  const cam = G3.camera([Math.sin(ang) * 3.6, .9 - lt * .03, Math.cos(ang) * 3.6], [0, -.25, 0], 44, { cy: 1420 });
  const e = { c: [0, 0, 0], R: 1, spin: 2.1 + t * .02, tilt: .35, sun: v.norm([.2, .45, -1]), glow: 1.6, cities: .8, g: .35 };
  G3.earthPix(ctx, cam, e);
  // ring of orbital infrastructure nodes
  const nodes = []; for (let k = 0; k < 18; k++) { const u = k / 18 * 6.283 + t * .06; let p = G3.orbitPos(.35, .4, u, 1.32); p = G3.rotX(p, .35); nodes.push(p); }
  G3.orbitLine(ctx, cam, e, .35, .4, 1.32, { color: 'rgba(255,255,255,0.25)', lw: 1.2 });
  constellation(cam, e, t, { count: .35, links: .6, alpha: .7, red: .02 });
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  nodes.forEach((p, k) => { if (G3.occluded(cam, p, e)) return; const q = cam.proj(p); if (!q) return; const n = cam.proj(nodes[(k + 1) % nodes.length]); if (n && !G3.occluded(cam, nodes[(k + 1) % nodes.length], e)) { ctx.strokeStyle = 'rgba(255,60,45,0.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(n.x, n.y); ctx.stroke(); } glow(ctx, q.x, q.y, 22, '255,80,60', .9); ctx.fillStyle = '#fff'; ctx.fillRect(q.x - 2, q.y - 2, 4, 4); });
  ctx.restore();
  // sunrise over limb
  const cp = cam.proj([0, 0, 0]); sunFlare(cp.x - 380, cp.y - 430, 500, .7 * seg(t, 108, 110));
  // statement typography
  BB.scrim(ctx, 0, 1000, .8);
  const A = env(t, 107.85, 111.75, .2, .3);
  if (A > 0) {
    const L = [['THE BIGGEST', 107.88, C.white], ['OPPORTUNITY', 108.76, C.white], ['IN SPACE', 109.32, C.white], ['MAY NOT BE', 109.92, C.dim], ['SENDING', 110.74, C.white], ['PEOPLE THERE.', 111.02, C.red]];
    L.forEach(([s, at, col], i) => revealChars(ctx, s, SAFE.left - 2, 380 + i * 92, t - at, { size: 88, weight: 900, track: -3, alpha: A, color: col, stagger: .018 }));
  }
  const B = env(t, 111.75, 116.2, .2, .35);
  if (B > 0) {
    const L = [['IT MAY BE', 111.78, C.dim], ['BUILDING THE', 112.6, C.white], ['INFRASTRUCTURE', 113.16, C.red], ['THAT POWERS', 113.7, C.white], ['THE WORLD', 114.56, C.white], ['FROM THERE.', 115.14, C.white]];
    L.forEach(([s, at, col], i) => revealChars(ctx, s, SAFE.left - 2, 380 + i * 92, t - at, { size: 88, weight: 900, track: -3, alpha: B, color: col, stagger: .018 }));
  }
  BB.hud(ctx, t, { section: 'THE BIG PICTURE', alpha: 1 - seg(t, 115.5, 116) });
}

// 11) END CARD 115.95 – end
function sEnd(t) {
  const lt = t - 115.95; BB.bg(ctx, t, { inner: '#111216' }); BB.grid(ctx, t, { oy: -lt * 10, alpha: .7 });
  // earth limb glow behind
  const e = { c: [0, -1, 0], R: 1, spin: t * .02, tilt: .3, sun: v.norm([0, .4, -1]), glow: 1.3, cities: 1 };
  const cam = G3.camera([0, .62, 1.5], [0, .25, 0], 50, { cy: 1080 }); ctx.save(); ctx.globalAlpha = .75 * seg(lt, 0, 1); G3.earthPix(ctx, cam, { ...e, g: .14, spin: -1.2 + t * .012 }); ctx.restore();
  BB.logo(ctx, W / 2, 600, .86, t, { p: seg(t, 116.0, 117.4) });
  const f = seg(t, 117.55, 118.0);
  if (f > 0) { ctx.save(); const s = lerp(.9, 1, E.outBack(f)); ctx.translate(W / 2, 960); ctx.scale(s, s); ctx.fillStyle = C.red; ctx.globalAlpha = E.out3(f); const w = 560; ctx.fillRect(-w / 2, -50, w, 100); text(ctx, 'FOLLOW FOR MORE', 0, 18, { size: 50, weight: 900, align: 'center', track: -1 }); ctx.restore(); }
  text(ctx, '@shanmukhafterhours', W / 2, 1082, { size: 36, weight: 600, align: 'center', color: C.white, alpha: seg(t, 117.9, 118.4) });
  const cm = seg(t, 118.6, 119.1); if (cm > 0) { panelBox(SAFE.left + 60, 1150, 800, 120, cm); mono(ctx, 'COMMENT BELOW', W / 2, 1196, { align: 'center', color: C.red, alpha: cm, size: 18, weight: 700 }); text(ctx, 'WHAT SHOULD WE BREAK DOWN NEXT?', W / 2, 1240, { size: 34, weight: 800, align: 'center', alpha: cm }); }
  mono(ctx, 'EP 01 · SPACEX · BIGGER THAN BILLIONS', W / 2, 1320, { align: 'center', alpha: seg(t, 118, 118.6), size: 16 });
}

// ================================================================ timeline
const SCN = [[0, 8.75, sHook], [8.75, 16.75, sTitle], [16.75, 20.55, sThree], [20.55, 26.45, sAero], [26.45, 35.0, sStarship], [35.0, 52.05, sStarlink], [52.05, 61.6, sAI], [61.6, 74.75, sODC], [74.75, 91.6, sRisk], [91.6, 107.8, sVI], [107.8, 115.95, sClose], [115.95, 999, sEnd]];
// transitions at cuts: type & duration (centred on the cut)
const TR = { 8.75: ['split', .5], 16.75: ['wipe', .55], 20.55: ['iris', .6], 26.45: ['flash', .3], 35.0: ['zoom', .6], 52.05: ['wipeL', .55], 61.6: ['zoom', .6], 74.75: ['split', .5], 91.6: ['iris', .6], 107.8: ['zoom', .7], 115.95: ['split', .5] };
const SUBS_OFF = [[0, 3.55], [107.8, 115.95]];
function render(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  let idx = SCN.findIndex(s => t >= s[0] && t < s[1]); if (idx < 0) idx = SCN.length - 1;
  const [a, b, fn] = SCN[idx];
  // find active transition
  let tr = null; for (const k in TR) { const at = +k, [ty, d] = TR[k]; if (t >= at - d / 2 && t < at + d / 2) tr = { at, ty, d }; }
  // camera shake on launches
  const shake = (t > 22.45 && t < 23.6 ? 6 * (1 - seg(t, 22.45, 23.6)) : 0) + (t > 31.45 && t < 31.8 ? 8 * (1 - seg(t, 31.45, 31.8)) : 0);
  ctx.save(); if (shake) ctx.translate(noise1(t * 45) * shake, noise1(t * 39 + 9) * shake);
  if (!tr) fn(t);
  else {
    const i2 = SCN.findIndex(s => s[0] === tr.at), outFn = SCN[i2 - 1][2], inFn = SCN[i2][2]; const p = seg(t, tr.at - tr.d / 2, tr.at + tr.d / 2);
    if (tr.ty === 'wipe') { outFn(t); ctx.save(); BB.clipWipe(ctx, p, 1); inFn(t); ctx.restore(); BB.wipeBar(ctx, p); }
    else if (tr.ty === 'wipeL') { outFn(t); ctx.save(); BB.clipWipe(ctx, p, -1); inFn(t); ctx.restore(); BB.wipeBar(ctx, p, { dir: -1 }); }
    else if (tr.ty === 'iris') { outFn(t); const r = E.io5(p) * 1150; ctx.save(); ctx.beginPath(); ctx.arc(W / 2, H * .45, r, 0, 7); ctx.clip(); inFn(t); ctx.restore(); if (p < 1) { ctx.save(); ctx.strokeStyle = C.red; ctx.lineWidth = 10 * (1 - p) + 2; ctx.beginPath(); ctx.arc(W / 2, H * .45, r, 0, 7); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(W / 2, H * .45, r + 18, 0, 7); ctx.stroke(); ctx.restore(); } }
    else if (tr.ty === 'flash') { (p < .5 ? outFn : inFn)(t); BB.flash(ctx, .85 * (1 - Math.abs(p - .5) * 2), '#fff'); }
    else if (tr.ty === 'zoom') { // scale-through with crossfade
      const e = E.io3(p); ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(1 + e * .6, 1 + e * .6); ctx.translate(-W / 2, -H / 2); outFn(t); ctx.restore();
      ctx.save(); ctx.globalAlpha = E.io3(p); ctx.translate(W / 2, H / 2); const s = lerp(.8, 1, e); ctx.scale(s, s); ctx.translate(-W / 2, -H / 2); inFn(t); ctx.restore();
    } else if (tr.ty === 'split') { // breakdown cut: halves slide apart revealing next scene
      inFn(t); const e = E.io5(p); const cy = H * .5; const off = e * W * 1.05;
      if (p < 1) { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, cy); ctx.clip(); ctx.translate(off, 0); outFn(t); ctx.restore(); ctx.save(); ctx.beginPath(); ctx.rect(0, cy, W, H - cy); ctx.clip(); ctx.translate(-off, 0); outFn(t); ctx.restore(); ctx.fillStyle = C.red; ctx.fillRect(0, cy - 4, W, 8 * (1 - e)); }
    }
  }
  ctx.restore();
  // subtitles
  const off = SUBS_OFF.some(([s, e]) => t >= s && t < e);
  if (!off) BB.subs(ctx, t, SUBS, {});
  BB.post(ctx, t);
}
