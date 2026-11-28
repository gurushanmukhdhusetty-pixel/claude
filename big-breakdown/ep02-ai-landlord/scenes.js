/* THE BIG BREAKDOWN — EP02 "SpaceX is now an AI landlord". Collage + pixel edit. VO is the master clock. */
const { W, H, C, F, SAFE, clamp, lerp, seg, E, env, rng, hash, noise1, fmt, text, measure, reveal, revealChars, mono } = BB;
const { v } = G3;
const cv = document.getElementById('c'); let ctx = cv.getContext('2d');
let SUBS = [];
const DUR = 75.81;

function init(data) {
  G3.setEarth(data.earth);
  const bin = atob(data.mask); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); G3.setMask(u8, 2048, 1024);
  // tidy transcript tokens: join decimals ("$41" ".1"), spelling fixes
  const ws = [];
  data.words.forEach(w => { if (/^\.\d/.test(w.w) && ws.length) { const p = ws[ws.length - 1]; p.w += w.w; p.e = w.e; } else ws.push({ ...w }); });
  ws.forEach(w => { if (w.w === "center's") w.w = 'centres'; if (w.w === 'of' && Math.abs(w.s - 55.88) < .05) w.w = 'off'; if (w.w === '3.') w.w = '3.'; });
  const kw = ['spacex', 'spacex\'s', '$41', '$41.1', 'billion', 'rockets', 'xai', 'xai\'s', 'google', '$920', 'anthropic', 'competitors', 'landlord', 'landlord.', 'gigawatts', 'aws', 'risks', 'quarter', 'chips', 'power', 'control', 'directors', 'marketing', 'december', '31st', 'follow', 'february', 'tenant', 'compute'];
  SUBS = BB.buildSubs(ws, { keywords: new Set(kw) });
}

// ---------------------------------------------------------------- pixel assets
const PAL = { W: C.white, R: C.red, B: '#1b1c20', G: '#8A8D93', D: '#3a3b40', O: '#ff5a2a', Y: '#ffd27a', K: '#0b0b0c', H: '#d9d6cf', C: '#E9E2C8', c: '#b7ad8c' };
const ROCKET = ['....R....', '...WWW...', '...WWW...', '..WWWWW..', '..WWWWW..', '..WWBWW..', '..WWWWW..', '..WWWWW..', '..RRRRR..', '..WWWWW..', '..WWWWW..', '..WWWWW..', '..WWWWW..', '..WWWWW..', '.GWWWWWG.', 'GGWWWWWGG', 'GG.DDD.GG', '...DDD...', '...OYO...', '..OYYYO..', '...OYO...', '....O....'];
const PYLON = ['......W......', '.....WWW.....', '....W.W.W....', 'WWWWWWWWWWWWW', '.W..W.W.W..W.', '....W.W.W....', '...W..W..W...', 'WWWWWWWWWWWWW', '.W.W..W..W.W.', '...W..W..W...', '...W.W.W.W...', '..W..W.W..W..', '..W.W...W.W..', '..WW.....WW..', '.W.W.....W.W.', '.WW.......WW.', '.W.W.....W.W.', 'W...W...W...W', 'W....W.W....W', 'W.....W.....W', 'W....W.W....W', 'W...W...W...W', 'W..W.....W..W', 'WWW.......WWW'];
const BOLT = ['....RRR', '...RRR.', '..RRR..', '.RRR...', 'RRRRRRR', '...RRR.', '..RRR..', '.RRR...', 'RRR....', 'RR.....'];
const KEY = ['.WWWW.........', 'WW..WW........', 'W....WWWWWWWWW', 'W....WWWWWWWWW', 'WW..WW...WW.WW', '.WWWW....WW.WW'];
const CROWN = ['W....W....W', 'WW..WWW..WW', 'WWW.WWW.WWW', 'WWWWWWWWWWW', 'WRWWWRWWWRW', 'WWWWWWWWWWW', 'WWWWWWWWWWW'];
const PERSON = ['..HHH..', '.HHHHH.', '.HHHHH.', '..HHH..', '.......', '.BBBBB.', 'BBBBBBB', 'BBBBBBB', 'BBBBBBB'];
const COIN = ['..CCCC..', '.CccccC.', 'CcCCCCcC', 'CcCRRCcC', 'CcCRRCcC', 'CcCCCCcC', '.CccccC.', '..CCCC..'];
function pixRect(g, x0, y0, px, gx, gy, w, h, col) { g.fillStyle = col; g.fillRect(Math.round(x0 + gx * px), Math.round(y0 + gy * px), Math.ceil(w * px), Math.ceil(h * px)); }
// pixel data centre: 40 x 24 cells
function dataCentre(g, cx, cy, px, t, o = {}) {
  const { reveal = 1, label = '', hot = 0, seed = 1, small = false } = o; const x0 = cx - 20 * px, y0 = cy - 12 * px; const s12 = Math.floor(t * 12);
  const R = (gx, gy, w, h, col) => { if (reveal < 1 && hash(gx * 7 + gy * 13 + seed) > reveal) return; pixRect(g, x0, y0, px, gx, gy, w, h, col); };
  R(0, 6, 40, 18, '#26272b'); R(0, 5, 40, 1, '#8A8D93'); R(0, 23, 40, 1, '#111');
  // rooftop cooling units with spinning fans
  for (let k = 0; k < 4; k++) { const fx = 3 + k * 9; R(fx, 1, 6, 4, '#3a3b40'); const ph = (s12 + k) % 2; R(fx + 1, 2, 4, 2, ph ? '#8A8D93' : '#55575c'); R(fx + 2 + ph, 2, 1, 2, '#1b1c20'); }
  // rack windows with blinking LEDs
  for (let r = 0; r < 3; r++) for (let c = 0; c < 8; c++) {
    const wx = 2 + c * 4.6, wy = 8 + r * 4.6; R(wx, wy, 3.4, 3.4, '#0b0b0c');
    for (let l = 0; l < 3; l++) { const on = hash(c * 3 + r * 11 + l * 5 + seed + Math.floor(s12 / 2) * 0.37) > .45; R(wx + .5 + l * 1.0, wy + 1.2, .7, .7, on ? (hash(c + r + l + seed) > .8 + (1 - hot) * .1 ? C.red : '#cfe3d0') : '#26272b'); }
  }
  R(17, 20, 6, 3, '#111'); // loading door
  if (label && reveal >= .95) { const lw = measure(g, label, small ? 26 : 34, 900, F.disp) + 30; g.fillStyle = C.white; g.fillRect(cx - lw / 2, y0 + 6.6 * px - (small ? 20 : 26), lw, small ? 34 : 44); text(g, label, cx, y0 + 6.6 * px + (small ? 6 : 8), { size: small ? 26 : 34, weight: 900, align: 'center', color: '#0b0b0c' }); }
  return { x0, y0, w: 40 * px, h: 24 * px };
}
function pixChip(g, cx, cy, px, o = {}) {
  const { reveal = 1 } = o; const x0 = cx - 8 * px, y0 = cy - 8 * px;
  const R = (gx, gy, w, h, col) => { if (reveal < 1 && hash(gx * 3.7 + gy * 9.1) > reveal) return; pixRect(g, x0, y0, px, gx, gy, w, h, col); };
  for (let k = 0; k < 5; k++) { R(3 + k * 2.5, 0, 1, 2, '#8A8D93'); R(3 + k * 2.5, 14, 1, 2, '#8A8D93'); R(0, 3 + k * 2.5, 2, 1, '#8A8D93'); R(14, 3 + k * 2.5, 2, 1, '#8A8D93'); }
  R(2, 2, 12, 12, '#2b2c30'); R(4, 4, 8, 8, '#111'); R(5, 5, 6, 6, C.red); R(6, 6, 4, 4, '#ff6a5a');
}
function pixFire(g, cx, by, px, t, w = 14, hmax = 16, k = 1) {
  const s = Math.floor(t * 12); for (let i = 0; i < w; i++) {
    const h = Math.floor(hmax * k * (.35 + .65 * Math.abs(Math.sin(i * .6 + 1)) * (0.6 + .4 * hash(i * 13 + s))));
    for (let j = 0; j < h; j++) { const u = j / Math.max(1, h); g.fillStyle = u < .3 ? '#ffd27a' : u < .65 ? '#ff7a2a' : C.red; if (u > .85 && hash(i + j + s) > .5) continue; g.fillRect(cx + (i - w / 2) * px, by - (j + 1) * px, px, px); }
  }
}

// ---------------------------------------------------------------- scene helpers
const T = () => CL.textures();
function hudS(t, s) { BB.hud(ctx, t, { episode: '02', section: s }); }
function typeOn(s, t0, t, cps = 38) { const n = Math.floor(clamp((t - t0) * cps, 0, s.length)); return s.slice(0, n); }

// 0) HOOK 0 – 5.5
function sHook(t) {
  CL.paperBg(ctx, t, { halftone: .5 });
  const [bx, by] = CL.boil(t, 1, 3);
  // "$41" assembles out of pixels, then resolves into solid type
  const asm = seg(t, 0.0, .9); const solid = seg(t, .9, 1.25);
  ctx.save(); ctx.translate(bx, by);
  if (solid < 1) CL.pixelText(ctx, '$41', SAFE.left - 6, 640, { size: 360, px: 14, reveal: E.out3(asm), color: C.white });
  if (solid > 0) text(ctx, '$41', SAFE.left - 2, 640, { size: 360, weight: 900, track: -14, alpha: solid });
  ctx.restore();
  const bp = seg(t, 1.62, 1.95); if (bp > 0) { ctx.save(); ctx.translate(SAFE.left, 790); ctx.scale(lerp(1.25, 1, E.outExpo(bp)), lerp(1.25, 1, E.outExpo(bp))); text(ctx, 'BILLION', 0, 0, { size: 150, weight: 900, track: -5, color: C.red, alpha: E.out3(bp) }); ctx.restore(); }
  CL.highlight(ctx, SAFE.left + 6, 838, 260, 62, seg(t, 2.2, 2.6), { color: C.white, seed: 4 });
  if (t > 2.2) text(ctx, 'A YEAR', SAFE.left + 20, 888, { size: 50, weight: 900, color: '#0b0b0c', alpha: seg(t, 2.3, 2.5) });
  // the not-rocket card
  const cp = seg(t, 3.0, 3.35); if (cp > 0) {
    const [cx2, cy2, cr] = CL.boil(t, 7, 3);
    CL.card(ctx, 600 + cx2, 930 + cy2 + (1 - E.outBack(cp)) * 300, 380, 400, { rot: .06 + cr, seed: 11, tone: 'kraft' }, (g, w, h) => {
      CL.sprite(g, ROCKET, w / 2, h / 2 - 10, 13, PAL);
      BB.mono(g, 'ROCKETS', w / 2, h - 26, { align: 'center', color: C.white, size: 20, weight: 700 });
    });
    CL.tape(ctx, 790 + cx2, 940 + cy2 + (1 - E.outBack(cp)) * 300, 150, -.12);
    CL.cross(ctx, 790, 1120, 150, seg(t, 4.75, 5.15), { lw: 16 });
  }
  if (t > 3.6) { const p = seg(t, 3.6, 3.9); CL.label(ctx, 'COMPUTE DEALS', SAFE.left, 990, { rot: -.04, fill: C.red, color: C.white, alpha: p, size: 26 }); CL.arrow(ctx, 420, 1010, 590, 1060, seg(t, 3.9, 4.4), { bend: -.3, color: C.red }); }
  hudS(t, 'COLD OPEN');
}

// 1) TITLE 5.5 – 9.3
function sTitle(t) {
  CL.paperBg(ctx, t, { halftone: .7 });
  const lt = t - 5.5; const [bx, by, br] = CL.boil(t, 3, 2);
  const cardIn = E.outBack(seg(t, 5.55, 6.0));
  CL.card(ctx, 70 + bx, 380 + by + (1 - cardIn) * 900, 940, 560, { rot: -.03 + br, seed: 21, tone: 'kraft' }, (g, w, h) => {
    BB.logo(g, w / 2, h / 2 - 40, .78, t, { p: seg(t, 5.8, 7.2) });
  });
  CL.tape(ctx, 140, 400 + (1 - cardIn) * 900, 160, -.5); CL.tape(ctx, 940, 400 + (1 - cardIn) * 900, 160, .45);
  CL.stamp(ctx, 'EPISODE 02', W / 2 + 120, 1010, seg(t, 7.8, 8.1), { size: 56, rot: -.08, sub: 'THE BIG BREAKDOWN' });
  const tp = seg(t, 8.1, 8.5); if (tp > 0) {
    text(ctx, 'SPACEX IS NOW', SAFE.left, 1180, { size: 64, weight: 900, alpha: tp, track: -1 });
    CL.highlight(ctx, SAFE.left + 2, 1206, 600, 78, seg(t, 8.3, 8.8), { seed: 8 });
    text(ctx, 'AN AI LANDLORD', SAFE.left + 6, 1268, { size: 64, weight: 900, alpha: tp, track: -1 });
  }
}

// 2) THE MOVE 9.3 – 19.3
function sMove(t) {
  CL.paperBg(ctx, t, { graph: .5 });
  const out = E.inExpo(seg(t, 14.85, 15.3));
  // A: document card with the claim
  if (out < 1) {
    const [bx, by, br] = CL.boil(t, 5, 2); const inP = E.outBack(seg(t, 9.35, 9.8));
    ctx.save(); ctx.translate(0, -out * 1300);
    CL.card(ctx, 70 + bx, 380 + by + (1 - inP) * 1000, 940, 640, { rot: -.025 + br, seed: 31 }, (g, w, h) => {
      BB.mono(g, 'COMPUTE DEALS · ANNUAL REVENUE', 50, 80, { color: '#5b5a57', size: 22, weight: 700 });
      g.fillStyle = '#0b0b0c'; g.fillRect(50, 100, w - 100, 3);
      const n = lerp(0, 41.1, E.outExpo(seg(t, 10.6, 13.6)));
      CL.highlight(g, 50, 170, 640, 190, seg(t, 13.4, 13.9), { color: 'rgba(229,37,42,0.88)', seed: 6 });
      text(g, '$' + n.toFixed(1) + 'B', 60, 330, { size: 190, weight: 900, color: '#0b0b0c', track: -8 });
      text(g, 'PER YEAR', 64, 420, { size: 56, weight: 900, color: '#0b0b0c' });
      text(g, typeOn('From renting out AI data centres.', 10.7, t, 30), 60, 500, { size: 34, weight: 600, color: '#2a2928' });
      BB.mono(g, 'SOURCE: SPACEX CFO REMARKS, 2026 (AS REPORTED)', 60, h - 50, { color: '#7a7873', size: 16 });
    });
    CL.label(ctx, 'SPACEX CFO', 640, 300 + (1 - inP) * 1000, { rot: .06, fill: C.red, color: C.white, alpha: seg(t, 9.8, 10.1), size: 26 });
    CL.tape(ctx, 540, 340 + (1 - inP) * 1000, 200, .02);
    ctx.restore();
  }
  // B: pixel data centre for rent
  if (t > 14.9) {
    const rv = seg(t, 15.0, 15.8); const [bx, by] = CL.boil(t, 9, 2);
    const dc = dataCentre(ctx, W / 2 + bx, 640 + by, 18, t, { reveal: rv, label: 'xAI', seed: 3 });
    BB.mono(ctx, 'BUILT BY xAI', W / 2, 920, { align: 'center', color: C.white, size: 22, weight: 700, alpha: seg(t, 15.9, 16.3) });
    // FOR RENT sign swings in (stop-motion)
    const fr = seg(t, 16.85, 17.15); if (fr > 0) { const sw = Math.sin(CL.step(t) * 5) * .08 * (1 - seg(t, 17.1, 18.5)); ctx.save(); ctx.translate(W / 2 + 230, 380); ctx.rotate(sw); ctx.strokeStyle = C.white; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-60, -60); ctx.lineTo(-60, 0); ctx.moveTo(60, -60); ctx.lineTo(60, 0); ctx.stroke(); ctx.scale(lerp(1.4, 1, E.outExpo(fr)), lerp(1.4, 1, E.outExpo(fr))); ctx.fillStyle = C.red; ctx.fillRect(-130, 0, 260, 90); text(ctx, 'FOR RENT', 0, 62, { size: 52, weight: 900, align: 'center' }); ctx.restore(); }
    // tenants: smaller buildings
    const tn = seg(t, 17.85, 18.4); if (tn > 0) {
      [[230, 1150], [540, 1190], [850, 1150]].forEach(([x, y], i) => { const r = clamp(tn * 1.6 - i * .25); dataCentre(ctx, x, y, 6.5, t, { reveal: r, seed: 10 + i, small: true }); CL.arrow(ctx, W / 2 + (i - 1) * 120, 880, x, y - 110, r, { bend: (i - 1) * -.15, lw: 4, color: C.red }); });
      CL.label(ctx, 'OTHER AI COMPANIES', W / 2 - 190, 1290, { rot: -.02, alpha: seg(t, 18.3, 18.6), size: 24 });
    }
  }
  hudS(t, 'THE MOVE');
}

// 3) TENANTS 19.3 – 27.8
function sTenants(t) {
  CL.paperBg(ctx, t, { halftone: .4 });
  const [bx, by, br] = CL.boil(t, 13, 2); const inP = E.outBack(seg(t, 19.35, 19.75));
  CL.card(ctx, 60 + bx, 300 + by + (1 - inP) * 1100, 960, 860, { rot: .015 + br, seed: 41, tone: 'kraft' }, (g, w, h) => {
    text(g, 'TENANT DIRECTORY', 50, 90, { size: 56, weight: 900, track: -1 }); BB.mono(g, 'SPACEX COMPUTE · LEASED CAPACITY', 52, 128, { size: 18, color: C.dim });
    g.fillStyle = C.red; g.fillRect(50, 150, w - 100, 5);
    const rows = [['GOOGLE', 19.54], ['ANTHROPIC', 23.2], ['xAI', 26.0]];
    rows.forEach(([n, at], i) => {
      const p = seg(t, at - .05, at + .25); if (p <= 0) return; const y = 260 + i * 200;
      // split-flap style strip
      g.fillStyle = '#0b0b0c'; g.fillRect(50, y - 70, w - 100, 110); g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(50, y - 16, w - 100, 2);
      const shown = p < 1 ? n.split('').map((ch, k) => hash(k + Math.floor(t * 24)) < p ? ch : String.fromCharCode(65 + Math.floor(hash(k * 3 + Math.floor(t * 24)) * 26))).join('') : n;
      text(g, shown, 80, y + 6, { size: 66, weight: 900, track: 1, color: i === 2 ? C.red : C.white });
      if (i === 0) { const m = lerp(0, 920, E.outExpo(seg(t, 20.45, 21.6))); text(g, '~$' + Math.round(m) + 'M', w - 80, y - 4, { size: 54, weight: 900, align: 'right', alpha: seg(t, 20.4, 20.6) }); BB.mono(g, 'PER MONTH', w - 80, y + 26, { align: 'right', size: 16, alpha: seg(t, 21.5, 21.8) }); }
      if (i === 1) { BB.mono(g, 'TENANT', w - 80, y + 4, { align: 'right', size: 30, weight: 700, color: C.white, alpha: seg(t, 24.1, 24.4) }); }
      if (i === 2) { BB.mono(g, 'BUILT IT', w - 80, y + 4, { align: 'right', size: 30, weight: 700, color: C.red, alpha: seg(t, 26.3, 26.6) }); }
    });
    // pixel coins dropping into a stack, one per "month"
    const months = Math.floor(clamp((t - 21.6) * 3, 0, 12)); if (t > 21.6) { for (let k = 0; k < months; k++) CL.sprite(g, COIN, 640 + (k % 2) * 6, 380 - k * 9, 6, PAL); }
    if (t > 22.5) BB.mono(g, '≈ $11B / YEAR · ~27% OF COMPUTE INCOME', 52, 360, { size: 17, color: C.white, alpha: seg(t, 22.5, 22.9) });
  });
  // "The tenants? xAI's own competitors."
  CL.circle(ctx, 300, 560, 230, 80, seg(t, 25.1, 25.55), { seed: 5 }); CL.circle(ctx, 360, 760, 290, 80, seg(t, 25.35, 25.8), { seed: 9 });
  const cp = seg(t, 26.9, 27.2); if (cp > 0) { CL.stamp(ctx, 'COMPETITORS', W / 2 + 60, 1230, cp, { size: 64, rot: -.06, sub: "OF xAI — NOW PAYING RENT" }); CL.arrow(ctx, 480, 1060, 560, 790, seg(t, 27.0, 27.4), { color: C.red, bend: .3, lw: 6 }); }
  hudS(t, 'THE TENANTS');
}

// 4) PIVOT 27.8 – 35.1
function sPivot(t) {
  CL.paperBg(ctx, t, { graph: .3 });
  const flip = seg(t, 33.0, 33.4);
  // calendar
  const [bx, by, br] = CL.boil(t, 17, 2);
  ctx.save(); ctx.globalAlpha = 1 - E.io3(flip) * .85;
  const cal = E.outBack(seg(t, 28.0, 28.4));
  CL.card(ctx, 80 + bx, 300 + by - (1 - cal) * 800, 380, 400, { rot: -.05 + br, seed: 51 }, (g, w, h) => {
    g.fillStyle = C.red; g.fillRect(0, 0, w, 90); text(g, 'FEB', w / 2, 70, { size: 64, weight: 900, align: 'center' });
    text(g, '2026', w / 2, 260, { size: 130, weight: 900, align: 'center', color: '#0b0b0c', track: -4 });
    for (let k = 0; k < 7; k++) { g.fillStyle = '#c9c4b8'; g.fillRect(40 + k * 44, 300, 30, 22); g.fillRect(40 + k * 44, 334, 30, 22); }
  });
  CL.tape(ctx, 270, 310 - (1 - cal) * 800, 140, -.08);
  // xAI card + ACQUIRED stamp
  const xc = E.outBack(seg(t, 29.7, 30.05));
  CL.card(ctx, 540 + bx, 330 - by + (1 - xc) * 900, 440, 380, { rot: .05 - br, seed: 53, tone: 'kraft' }, (g, w, h) => {
    pixChip(g, w / 2, 150, 11); text(g, 'xAI', w / 2, 330, { size: 74, weight: 900, align: 'center' });
  });
  CL.stamp(ctx, 'ACQUIRED', 760, 530, seg(t, 29.4, 29.7), { size: 60, rot: .12, sub: 'BY SPACEX' });
  // burning cash
  const bn = seg(t, 30.65, 31.0); if (bn > 0) {
    for (let k = 0; k < 8; k++) CL.sprite(ctx, COIN, 380 + (k % 4) * 90, 1170 - Math.floor(k / 4) * 60, 10, PAL, { reveal: bn });
    pixFire(ctx, 520, 1210, 14, t, 26, 24, E.out3(bn) * (1 - seg(t, 33, 33.4)));
    const m = lerp(0, 1, E.outExpo(seg(t, 31.2, 32.3)));
    text(ctx, '−$' + m.toFixed(1) + 'B', SAFE.left, 870, { size: 120, weight: 900, color: C.red, track: -4, alpha: bn });
    BB.mono(ctx, 'BURN PER MONTH (APPROX.)', SAFE.left + 4, 910, { color: C.white, size: 20, alpha: bn });
  }
  ctx.restore();
  // LAB -> LANDLORD
  if (flip > 0) {
    ctx.save(); ctx.fillStyle = `rgba(10,10,12,${.9 * E.io3(flip)})`; ctx.fillRect(0, 0, W, H); ctx.restore();
    const a = E.out3(flip);
    text(ctx, 'THE LAB', SAFE.left, 620, { size: 150, weight: 900, track: -5, alpha: a });
    CL.cross(ctx, 330, 570, 210, seg(t, 33.6, 34.0) * 1, { lw: 14 });
    const lp = seg(t, 34.35, 34.6); if (lp > 0) { ctx.save(); const s = lerp(1.6, 1, E.outExpo(lp)); ctx.translate(SAFE.left, 900); ctx.scale(s, s); text(ctx, 'IS A', 0, -120, { size: 60, weight: 800, color: C.dim }); CL.highlight(ctx, -6, -20, 820, 150, 1, { seed: 12 }); text(ctx, 'LANDLORD', 6, 110, { size: 150, weight: 900, track: -5 }); ctx.restore(); CL.sprite(ctx, KEY, 760, 1120, 16, PAL, { reveal: seg(t, 34.5, 34.9) }); }
  }
  hudS(t, 'THE PIVOT');
}

// 5) THE MATH 35.1 – 46.2
function sMath(t) {
  CL.paperBg(ctx, t, { graph: 1 });
  text(ctx, 'THE MATH', SAFE.left, 380, { size: 110, weight: 900, track: -4, alpha: seg(t, 35.2, 35.4) }); CL.underline(ctx, SAFE.left, 410, 520, seg(t, 35.35, 35.8), { lw: 8 });
  const base = 1240, unit = 70; // px per GW
  const bars = [[230, 1.4, 36.06, 'JUN 2026', 'LIVE', false], [520, 2, 38.42, 'DEC 2026', 'TARGET', true], [810, 10, 39.8, 'END 2027', 'TARGET', true]];
  const dimP = seg(t, 42.2, 42.6) * .55;
  ctx.save(); ctx.globalAlpha = 1 - dimP;
  bars.forEach(([x, gw, at, lab, st, tgt], i) => {
    const grow = seg(t, at, at + (gw > 5 ? 1.4 : .5)); if (grow <= 0) return; const blk = 14; const cols = 12, bw = cols * blk;
    const nRows = Math.round(gw * unit / blk); const shown = Math.floor(nRows * CL.step(grow, 1) + (grow >= 1 ? 0 : 0));
    const sh = Math.floor(nRows * Math.floor(grow * 24) / 24);
    for (let r = 0; r < sh; r++) for (let c = 0; c < cols; c++) { const y = base - (r + 1) * blk, xx = x - bw / 2 + c * blk; if (tgt) { ctx.strokeStyle = i === 2 ? C.red : C.white; ctx.lineWidth = 1.5; ctx.strokeRect(xx + 1.5, y + 1.5, blk - 3, blk - 3); } else { ctx.fillStyle = C.white; ctx.fillRect(xx + 1, y + 1, blk - 2, blk - 2); } }
    const topY = base - sh * blk;
    text(ctx, (gw === 10 ? '~10' : gw) + ' GW', x, topY - 22, { size: 54, weight: 900, align: 'center', color: i === 2 ? C.red : C.white });
    BB.mono(ctx, lab, x, base + 40, { align: 'center', color: C.white, size: 20, weight: 700 }); BB.mono(ctx, st, x, base + 66, { align: 'center', size: 16, color: tgt ? C.red : C.dim });
  });
  ctx.fillStyle = C.white; ctx.fillRect(80, base, 920, 3);
  CL.arrow(ctx, 260, 1080, 760, 470, seg(t, 40.4, 41.1), { color: C.red, bend: .22, lw: 7 });
  if (t > 40.9) text(ctx, '~7×', 420, 760, { size: 90, weight: 900, color: C.red, alpha: seg(t, 40.9, 41.2) });
  if (t > 41.2) BB.mono(ctx, 'IN ~18 MONTHS', 425, 800, { color: C.white, size: 18, alpha: seg(t, 41.2, 41.5) });
  ctx.restore();
  // back-of-envelope note
  const np = E.outBack(seg(t, 42.3, 42.7)); if (np > 0) {
    const [bx, by, br] = CL.boil(t, 23, 2);
    CL.card(ctx, 70 + bx, 470 + by + (1 - np) * 1200, 640, 600, { rot: -.04 + br, seed: 61 }, (g, w, h) => {
      BB.mono(g, 'BACK-OF-ENVELOPE', 40, 60, { color: C.red, size: 20, weight: 700 });
      const L = [['$41.1B ÷ 1.4 GW', 42.46], ['≈ $29B per GW', 43.2], ['× 10 GW ≈ $290B / yr', 43.8]];
      L.forEach(([s, at], i) => text(g, typeOn(s, at, t, 30), 40, 150 + i * 80, { size: 50, weight: 800, color: '#0b0b0c', track: -1 }));
      const ap = seg(t, 44.6, 45.0); if (ap > 0) { CL.highlight(g, 40, 360, 470, 84, ap, { seed: 14 }); text(g, '> AWS / YEAR', 50, 422, { size: 58, weight: 900, color: C.white, alpha: ap }); }
      BB.mono(g, 'ROUGH: INCOME (SEP) & CAPACITY (JUN) ARE', 40, h - 70, { color: '#6a6864', size: 14 }); BB.mono(g, 'FROM DIFFERENT DATES. ILLUSTRATIVE ONLY.', 40, h - 46, { color: '#6a6864', size: 14 });
    });
    CL.tape(ctx, 390, 480 + (1 - np) * 1200, 170, .1);
  }
  hudS(t, 'THE MATH');
}

// 6) RISKS 46.2 – 62.0
function sRisks(t) {
  CL.paperBg(ctx, t, { halftone: .35 });
  // header: "3 RISKS" in pixels, then docks to the top
  const dock = E.io3(seg(t, 47.1, 47.5));
  ctx.save(); ctx.translate(lerp(0, -40, dock), lerp(260, -170, dock)); const s = lerp(1, .5, dock); ctx.translate(SAFE.left, 520); ctx.scale(s, s); ctx.translate(-SAFE.left, -520);
  CL.pixelText(ctx, '3 RISKS', SAFE.left, 520, { size: 230, px: 12, reveal: E.out3(seg(t, 46.4, 46.9)), color: C.white });
  ctx.restore();
  const cards = [[47.5, 'CONCENTRATION', 41], [51.95, 'POWER', 43], [57.6, 'CONTROL', 47]];
  cards.forEach(([at, name, seed], i) => {
    const p = E.outBack(seg(t, at, at + .4)); if (p <= 0) return; const [bx, by, br] = CL.boil(t, seed, 2);
    const nxt = cards[i + 1] ? seg(t, cards[i + 1][0], cards[i + 1][0] + .4) : 0; const push = E.io3(nxt);
    CL.card(ctx, 70 + bx - push * 30, 400 + by + (1 - p) * 1300 - push * 30, 940, 860, { rot: (i - 1) * .025 + br - push * .03, seed, tone: 'kraft', alpha: 1 - push * .3 }, (g, w, h) => {
      text(g, '0' + (i + 1), 50, 100, { size: 40, weight: 800, fam: F.mono, color: C.red }); text(g, name, 140, 104, { size: 74, weight: 900, track: -2 });
      g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(50, 140, w - 100, 2);
      if (i === 0) { // pixel pie: Google ~1/4
        const cx = 260, cy = 420, R = 170, px = 14; const fill = seg(t, 48.7, 49.5);
        for (let y = -R; y < R; y += px) for (let x = -R; x < R; x += px) { const d = Math.hypot(x + px / 2, y + px / 2); if (d > R) continue; let a = Math.atan2(x + px / 2, -(y + px / 2)); if (a < 0) a += Math.PI * 2; const isG = a / (Math.PI * 2) < .27 * fill; g.fillStyle = isG ? C.red : 'rgba(255,255,255,0.75)'; g.fillRect(cx + x + 1, cy + y + 1, px - 2, px - 2); }
        text(g, '~1/4', 520, 380, { size: 110, weight: 900, color: C.red, alpha: seg(t, 49.0, 49.3) }); BB.mono(g, 'OF COMPUTE INCOME', 524, 420, { size: 18, color: C.white, alpha: seg(t, 49.3, 49.6) }); BB.mono(g, 'FROM ONE TENANT: GOOGLE', 524, 448, { size: 18, color: C.white, alpha: seg(t, 49.3, 49.6) });
        const cp = seg(t, 50.55, 50.95); if (cp > 0) { pixChip(g, 640, 650, 9, { reveal: cp }); CL.arrow(g, 420, 560, 560, 640, cp, { color: C.red, lw: 5 }); BB.mono(g, '+ BUILDS ITS OWN CHIPS', 470, 790, { size: 20, weight: 700, color: C.white, alpha: cp }); }
      }
      if (i === 1) { // power: pylon, +8 GW, grid
        CL.sprite(g, PYLON, 200, 470, 14, PAL); const fl = Math.floor(t * 12) % 3 !== 0; if (t > 53.6 && fl) CL.sprite(g, BOLT, 330, 300, 11, PAL);
        const ap = seg(t, 53.6, 54.0); text(g, '+8 GW', 400, 420, { size: 150, weight: 900, color: C.red, track: -5, alpha: ap }); BB.mono(g, 'IN 18 MONTHS', 406, 470, { size: 22, weight: 700, color: C.white, alpha: seg(t, 55.1, 55.4) });
        const ep = seg(t, 56.2, 56.6); if (ep > 0) {
          CL.label(g, 'ANY GRID ON EARTH?', 470, 760, { rot: -.03, fill: C.red, color: C.white, size: 20, alpha: ep });
        }
      }
      if (i === 2) { // board seats
        const seats = 11; const indep = [1, 4, 8]; for (let k = 0; k < seats; k++) { const x = 110 + (k % 6) * 130, y = 330 + Math.floor(k / 6) * 190; const p2 = seg(t, 58.2 + k * .05, 58.5 + k * .05); if (p2 <= 0) continue; CL.sprite(g, PERSON, x, y, 13, { H: indep.includes(k) ? C.white : '#55575c', B: indep.includes(k) ? C.white : '#3a3b40' }, { reveal: p2 }); }
        BB.mono(g, 'INDEPENDENT DIRECTORS', 110, 600, { size: 18, color: C.white, alpha: seg(t, 60.6, 60.9) }); g.fillStyle = C.white; g.fillRect(80, 586, 18, 18);
        CL.stamp(g, 'MAJORITY NOT REQUIRED', w / 2, 720, seg(t, 60.1, 60.4), { size: 46, rot: -.05, sub: 'PER IPO DISCLOSURE (AS REPORTED)' });
      }
    });
    // mini pixel earth on POWER card (drawn on main ctx so we can pixelate it)
    if (i === 1 && t > 56.2) { const ep = seg(t, 56.2, 56.6); const ox = 70 + bx - push * 30, oy = 400 + by + (1 - p) * 1300 - push * 30;
      CL.pixelate(ctx, 7, g2 => { const cam = G3.camera([0, .35, 17], [0, 0, 0], 40, { cx: ox + 760, cy: oy + 600 }); g2.globalAlpha = ep * (1 - push); G3.earth(g2, cam, { c: [0, 0, 0], R: 1, spin: t * .3, tilt: .4, sun: v.norm([-1, .4, .6]), glow: .6, cities: 0, grat: 0 }); }); }
  });
  hudS(t, 'WHY IT COULD BREAK');
}

// 7) MY CALL 62.0 – 72.6
function sCall(t) {
  CL.paperBg(ctx, t, { graph: .5 });
  CL.stamp(ctx, 'MY CALL', W / 2, 330, seg(t, 62.18, 62.45), { size: 80, rot: -.05 });
  const [bx, by, br] = CL.boil(t, 31, 2); const cp = E.outBack(seg(t, 63.0, 63.4));
  CL.card(ctx, 330 + bx, 430 + by + (1 - cp) * 1200, 420, 380, { rot: .04 + br, seed: 71 }, (g, w, h) => {
    g.fillStyle = C.red; g.fillRect(0, 0, w, 80); text(g, 'DEC 2026', w / 2, 60, { size: 52, weight: 900, align: 'center' });
    text(g, '31', w / 2, 290, { size: 210, weight: 900, align: 'center', color: '#0b0b0c', track: -8 });
  });
  CL.tape(ctx, 540, 440 + (1 - cp) * 1200, 160, -.05);
  CL.circle(ctx, 540, 660, 250, 220, seg(t, 65.2, 65.8), { lw: 8, seed: 3 });
  // threshold gauge
  const gp = seg(t, 64.0, 64.4); if (gp > 0) {
    const x0 = 120, x1 = 960, y = 900; ctx.save(); ctx.globalAlpha = gp; ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(x0, y, x1 - x0, 26);
    const now = 1.4 / 10, thr = 2 / 10; ctx.fillStyle = C.white; ctx.fillRect(x0, y, (x1 - x0) * now * E.out3(seg(t, 64.1, 64.7)), 26);
    ctx.fillStyle = C.red; ctx.fillRect(x0 + (x1 - x0) * thr - 3, y - 30, 6, 86); BB.mono(ctx, '2 GW LINE', x0 + (x1 - x0) * thr + 12, y - 12, { color: C.red, size: 18, weight: 700 });
    BB.mono(ctx, '1.4 GW (JUN)', x0, y + 56, { color: C.white, size: 16 }); BB.mono(ctx, '10 GW', x1, y + 56, { align: 'right', size: 16 }); ctx.restore();
  }
  // two outcomes
  const L = E.outBack(seg(t, 66.6, 67.0)), R = E.outBack(seg(t, 68.85, 69.25));
  if (L > 0) { CL.card(ctx, 70, 1010 + (1 - L) * 900, 450, 300, { rot: -.03, seed: 73, tone: 'kraft' }, (g, w, h) => { BB.mono(g, 'NOT PAST 2 GW', 30, 56, { size: 20, weight: 700, color: C.dim }); text(g, '10 GW STORY', 30, 140, { size: 52, weight: 900 }); text(g, '= MARKETING', 30, 210, { size: 52, weight: 900, color: C.red, alpha: seg(t, 68.0, 68.3) }); }); }
  if (R > 0) { CL.card(ctx, 560, 1010 + (1 - R) * 900, 450, 300, { rot: .03, seed: 77, tone: 'kraft' }, (g, w, h) => { BB.mono(g, 'PAST 2 GW', 30, 56, { size: 20, weight: 700, color: C.dim }); text(g, 'BIGGEST', 30, 140, { size: 52, weight: 900, alpha: seg(t, 70.8, 71.1) }); text(g, 'AI LANDLORD', 30, 210, { size: 52, weight: 900, color: C.red, alpha: seg(t, 71.2, 71.5) }); CL.sprite(g, CROWN, w - 90, 80, 9, PAL, { reveal: seg(t, 71.2, 71.7) }); }); }
  hudS(t, 'THE CALL');
}

// 8) END 72.6 – end
function sEnd(t) {
  CL.paperBg(ctx, t, { halftone: .6 });
  const [bx, by, br] = CL.boil(t, 37, 2); const cp = E.outBack(seg(t, 72.65, 73.0));
  CL.card(ctx, 70 + bx, 420 + by + (1 - cp) * 1200, 940, 500, { rot: -.02 + br, seed: 81, tone: 'kraft' }, (g, w, h) => { BB.logo(g, w / 2, h / 2 - 40, .78, t, { p: seg(t, 72.8, 73.9) }); });
  CL.tape(ctx, 150, 440 + (1 - cp) * 1200, 160, -.45); CL.tape(ctx, 930, 440 + (1 - cp) * 1200, 160, .45);
  const f = seg(t, 74.25, 74.55); if (f > 0) { ctx.save(); ctx.translate(W / 2, 1040); const s = lerp(.85, 1, E.outBack(f)); ctx.scale(s, s); ctx.fillStyle = C.red; ctx.globalAlpha = E.out3(f); ctx.fillRect(-300, -52, 600, 104); text(ctx, 'FOLLOW FOR EP 03', 0, 18, { size: 50, weight: 900, align: 'center', track: -1 }); ctx.restore(); }
  text(ctx, '@shanmukhafterhours', W / 2, 1160, { size: 36, weight: 600, align: 'center', alpha: seg(t, 74.6, 75.0) });
}

// ---------------------------------------------------------------- timeline
const SCN = [[0, 5.5, sHook], [5.5, 9.3, sTitle], [9.3, 19.3, sMove], [19.3, 27.8, sTenants], [27.8, 35.1, sPivot], [35.1, 46.2, sMath], [46.2, 62.0, sRisks], [62.0, 72.6, sCall], [72.6, 999, sEnd]];
const TR = { 5.5: ['mosaic', .5], 9.3: ['tear', .55], 19.3: ['mosaic', .5], 27.8: ['tear', .55], 35.1: ['mosaic', .5], 46.2: ['tear', .55], 62.0: ['split', .5], 72.6: ['mosaic', .5] };
const SUBS_OFF = [[5.5, 9.3]];
function tearClip(g, p, seed) {
  const y = lerp(H + 80, -80, E.io5(p)); const pts = []; for (let x = -20; x <= W + 20; x += 18) pts.push([x, y + (hash(x * .13 + seed) - .5) * 26 + Math.sin(x * .01 + seed) * 18]);
  return pts;
}
function render(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  let idx = SCN.findIndex(s => t >= s[0] && t < s[1]); if (idx < 0) idx = SCN.length - 1; const fn = SCN[idx][2];
  let tr = null; for (const k in TR) { const at = +k, [ty, d] = TR[k]; if (t >= at - d / 2 && t < at + d / 2) tr = { at, ty, d }; }
  const shake = (t < .35 ? 7 * (1 - t / .35) : 0) + (t > 29.4 && t < 29.7 ? 6 * (1 - seg(t, 29.4, 29.7)) : 0) + (t > 62.18 && t < 62.5 ? 6 * (1 - seg(t, 62.18, 62.5)) : 0);
  ctx.save(); if (shake) ctx.translate(noise1(t * 45) * shake, noise1(t * 39 + 9) * shake);
  if (!tr) fn(t);
  else {
    const i2 = SCN.findIndex(s => s[0] === tr.at), outFn = SCN[i2 - 1][2], inFn = SCN[i2][2]; const p = seg(t, tr.at - tr.d / 2, tr.at + tr.d / 2);
    if (tr.ty === 'mosaic') { const blk = 1 + 30 * Math.pow(1 - Math.abs(p * 2 - 1), 1.4); const blkQ = Math.max(1, Math.round(blk / 3) * 3); const main = ctx; CL.pixelate(main, blkQ, g => { ctx = g; (p < .5 ? outFn : inFn)(t); ctx = main; }); }
    else if (tr.ty === 'tear') {
      outFn(t); const pts = tearClip(ctx, p, tr.at);
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = -10; ctx.fillStyle = '#000'; ctx.beginPath(); pts.forEach(([x, y], i) => ctx[i ? 'lineTo' : 'moveTo'](x, y)); ctx.lineTo(W + 20, H + 100); ctx.lineTo(-20, H + 100); ctx.closePath(); ctx.fill(); ctx.restore();
      ctx.save(); ctx.beginPath(); pts.forEach(([x, y], i) => ctx[i ? 'lineTo' : 'moveTo'](x, y)); ctx.lineTo(W + 20, H + 100); ctx.lineTo(-20, H + 100); ctx.closePath(); ctx.clip(); inFn(t); ctx.restore();
      ctx.save(); ctx.strokeStyle = 'rgba(236,232,223,0.95)'; ctx.lineWidth = 7; ctx.beginPath(); pts.forEach(([x, y], i) => ctx[i ? 'lineTo' : 'moveTo'](x, y + 3)); ctx.stroke(); ctx.strokeStyle = C.red; ctx.lineWidth = 3; ctx.beginPath(); pts.forEach(([x, y], i) => ctx[i ? 'lineTo' : 'moveTo'](x, y + 9)); ctx.stroke(); ctx.restore();
    }
    else if (tr.ty === 'split') { inFn(t); const e = E.io5(p); const cy = H * .5, off = e * W * 1.05; if (p < 1) { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, cy); ctx.clip(); ctx.translate(off, 0); outFn(t); ctx.restore(); ctx.save(); ctx.beginPath(); ctx.rect(0, cy, W, H - cy); ctx.clip(); ctx.translate(-off, 0); outFn(t); ctx.restore(); ctx.fillStyle = C.red; ctx.fillRect(0, cy - 4, W, 8 * (1 - e)); } }
  }
  ctx.restore();
  const off = SUBS_OFF.some(([s, e]) => t >= s && t < e); if (!off) BB.subs(ctx, t, SUBS, {});
  CL.finish(ctx, t, { dust: .8, leak: env(t, 0, 2, .1, 1.5) + env(t, 62, 63.5, .1, 1) });
  BB.post(ctx, t, { grain: .1 });
}
