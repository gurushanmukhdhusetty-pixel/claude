/* THE BIG BREAKDOWN — reusable visual system (canvas 2D, 1080x1920, deterministic per-frame).
   Every episode loads this file and builds its scenes on top of the primitives below. */
const BB = (() => {
  const W = 1080, H = 1920;
  const C = {
    bg: '#050506', char: '#0c0d0f', char2: '#141518', line: 'rgba(255,255,255,0.06)',
    white: '#F3F3F0', dim: '#8A8D93', faint: 'rgba(243,243,240,0.38)',
    red: '#E5252A', redHot: '#FF3B30', redDeep: '#7A0E12',
  };
  const F = { disp: 'Inter Tight', mono: 'JetBrains Mono' };
  // Safe zones for Instagram Reels UI
  const SAFE = { top: 170, bottom: 1560, left: 80, right: 1000, subY: 1405 };

  // ---------- math / easing ----------
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const E = {
    lin: x => x,
    out3: x => 1 - Math.pow(1 - x, 3),
    in3: x => x * x * x,
    io3: x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2,
    outExpo: x => x >= 1 ? 1 : 1 - Math.pow(2, -10 * x),
    inExpo: x => x <= 0 ? 0 : Math.pow(2, 10 * x - 10),
    ioExpo: x => x <= 0 ? 0 : x >= 1 ? 1 : x < .5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2,
    outBack: x => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
    io5: x => x < .5 ? 16 * x ** 5 : 1 - Math.pow(-2 * x + 2, 5) / 2,
  };
  // windowed envelope: 0 before a, ramps up over fin, holds, ramps down over fout before b
  const env = (t, a, b, fin = .3, fout = .3, ez = E.out3) => {
    if (t < a || t > b) return 0;
    return Math.min(ez(seg(t, a, a + fin)), fout > 0 ? E.io3(1 - seg(t, b - fout, b)) : 1);
  };
  function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const noise1 = (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u) * 2 - 1; };
  const fmt = n => Math.round(n).toLocaleString('en-US');

  // ---------- text ----------
  function font(ctx, size, weight = 800, fam = F.disp) { ctx.font = `${weight} ${size}px "${fam}"`; }
  function text(ctx, s, x, y, o = {}) {
    const { size = 40, weight = 800, fam = F.disp, color = C.white, align = 'left', base = 'alphabetic', track = 0, alpha = 1 } = o;
    if (alpha <= 0) return 0;
    ctx.save(); font(ctx, size, weight, fam); ctx.letterSpacing = track + 'px'; ctx.textAlign = align; ctx.textBaseline = base;
    ctx.globalAlpha *= alpha; ctx.fillStyle = color; ctx.fillText(s, x, y); const w = ctx.measureText(s).width; ctx.restore(); return w;
  }
  function measure(ctx, s, size, weight = 800, fam = F.disp, track = 0) { ctx.save(); font(ctx, size, weight, fam); ctx.letterSpacing = track + 'px'; const w = ctx.measureText(s).width; ctx.restore(); return w; }
  // masked line reveal: text slides up from behind an invisible baseline mask
  function reveal(ctx, s, x, y, p, o = {}) {
    const size = o.size || 40; if (p <= 0) return;
    ctx.save(); ctx.beginPath(); ctx.rect(-50, y - size * 1.05, W + 100, size * 1.35); ctx.clip();
    text(ctx, s, x, y + (1 - E.outExpo(p)) * size * 1.2, o); ctx.restore();
  }
  // per-character staggered reveal
  function revealChars(ctx, s, x, y, t, o = {}) {
    const { size = 40, weight = 800, fam = F.disp, align = 'left', stagger = .025, dur = .5, track = 0 } = o;
    const tw = measure(ctx, s, size, weight, fam, track); let cx = align === 'center' ? x - tw / 2 : align === 'right' ? x - tw : x;
    ctx.save(); ctx.beginPath(); ctx.rect(-50, y - size * 1.05, W + 100, size * 1.35); ctx.clip();
    for (let i = 0; i < s.length; i++) {
      const ch = s[i]; const p = E.outExpo(seg(t, i * stagger, i * stagger + dur));
      const cw = measure(ctx, ch, size, weight, fam, track);
      if (p > 0) text(ctx, ch, cx, y + (1 - p) * size * 1.1, { ...o, align: 'left', alpha: (o.alpha ?? 1) * p });
      cx += cw;
    }
    ctx.restore();
  }
  // number counter
  function counter(from, to, p) { return lerp(from, to, p); }

  // ---------- backgrounds ----------
  function bg(ctx, t, o = {}) {
    const g = ctx.createRadialGradient(W / 2, H * .42, 50, W / 2, H * .5, H * .85);
    g.addColorStop(0, o.inner || '#101114'); g.addColorStop(1, C.bg);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  function grid(ctx, t, o = {}) {
    const { step = 90, alpha = 1, ox = 0, oy = 0, color = 'rgba(255,255,255,0.045)' } = o;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.beginPath();
    const sx = ((ox % step) + step) % step, sy = ((oy % step) + step) % step;
    for (let x = sx; x < W; x += step) { ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, H); }
    for (let y = sy; y < H; y += step) { ctx.moveTo(0, y + .5); ctx.lineTo(W, y + .5); }
    ctx.stroke();
    // crosses at intersections
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath();
    for (let x = sx; x < W; x += step * 3) for (let y = sy; y < H; y += step * 3) { ctx.moveTo(x - 5, y + .5); ctx.lineTo(x + 6, y + .5); ctx.moveTo(x + .5, y - 5); ctx.lineTo(x + .5, y + 6); }
    ctx.stroke(); ctx.restore();
  }
  let stars = null;
  function starfield(ctx, t, o = {}) {
    const { alpha = 1, dx = 0, dy = 0, streak = 0 } = o;
    if (!stars) { const r = rng(7); stars = []; for (let i = 0; i < 700; i++) stars.push([r() * W * 1.4 - W * .2, r() * H * 1.4 - H * .2, r() * r() * 1.8 + .3, r() * .8 + .2, r()]); }
    ctx.save();
    for (const [x, y, s, b, d] of stars) {
      const px = ((x + dx * (0.3 + d)) % (W * 1.4) + W * 1.4) % (W * 1.4) - W * .2, py = ((y + dy * (0.3 + d)) % (H * 1.4) + H * 1.4) % (H * 1.4) - H * .2;
      const tw = .75 + .25 * Math.sin(t * 2 + x);
      ctx.globalAlpha = alpha * b * tw; ctx.fillStyle = '#fff';
      if (streak > 0) { ctx.fillRect(px, py, s, s + streak * (0.3 + d)); } else ctx.fillRect(px, py, s, s);
    }
    ctx.restore();
  }

  // ---------- HUD ----------
  function brackets(ctx, x, y, w, h, o = {}) {
    const { len = 26, color = 'rgba(255,255,255,0.55)', lw = 2, p = 1 } = o; const l = len * p;
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.beginPath();
    ctx.moveTo(x, y + l); ctx.lineTo(x, y); ctx.lineTo(x + l, y);
    ctx.moveTo(x + w - l, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + l);
    ctx.moveTo(x + w, y + h - l); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w - l, y + h);
    ctx.moveTo(x + l, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + h - l); ctx.stroke(); ctx.restore();
  }
  function tag(ctx, s, x, y, o = {}) { // red block label
    const { size = 22, fill = C.red, color = C.white, padX = 12, padY = 8, alpha = 1, align = 'left' } = o;
    const w = measure(ctx, s, size, 700, F.mono, 2) + padX * 2; const x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = fill; ctx.fillRect(x0, y, w, size + padY * 2);
    text(ctx, s, x0 + padX, y + padY + size * .82, { size, weight: 700, fam: F.mono, color, track: 2 }); ctx.restore(); return w;
  }
  function mono(ctx, s, x, y, o = {}) { return text(ctx, s, x, y, { size: 20, weight: 500, fam: F.mono, color: C.dim, track: 2, ...o }); }
  // persistent series HUD — top-left series id, top-right section
  function hud(ctx, t, o = {}) {
    const { episode = '01', section = '', alpha = 1, tc = true } = o; if (alpha <= 0) return;
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.fillStyle = C.red; ctx.fillRect(SAFE.left, 196, 10, 10);
    mono(ctx, 'THE BIG BREAKDOWN', SAFE.left + 22, 206, { color: C.white, size: 19, weight: 700 });
    mono(ctx, 'EP ' + episode, SAFE.left + 22 + measure(ctx, 'THE BIG BREAKDOWN ', 19, 700, F.mono, 2), 206, { size: 19 });
    if (section) mono(ctx, section, SAFE.right, 206, { align: 'right', size: 19 });
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(SAFE.left, 224, SAFE.right - SAFE.left, 1);
    if (tc) { const s = Math.floor(t), fr = Math.floor((t - s) * 30); mono(ctx, `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}:${String(fr).padStart(2, '0')}`, SAFE.right, 252, { align: 'right', size: 16, color: 'rgba(255,255,255,0.35)' }); }
    ctx.restore();
  }

  // ---------- LOGO ----------
  // "THE BIG / BREAKDOWN" stacked; signature = red cut line with horizontally offset halves.
  function logo(ctx, cx, cy, s, t, o = {}) {
    const { p = 1, alpha = 1, split = 1, tagline = true } = o; if (alpha <= 0) return;
    const big = 132 * s, small = 132 * s;
    const wB = measure(ctx, 'BREAKDOWN', big, 900, F.disp, -2 * s);
    const x0 = cx - wB / 2, y1 = cy - big * .14, y2 = cy + big * .98;
    ctx.save(); ctx.globalAlpha *= alpha;
    const r1 = E.outExpo(seg(p, 0, .35)), r2 = E.outExpo(seg(p, .1, .45));
    reveal(ctx, 'THE BIG', x0, y1, r1, { size: small, weight: 900, track: -2 * s });
    // BREAKDOWN sliced along a horizontal cut: halves shear apart, red bar sits in the gap
    const lineP = E.io3(seg(p, .35, .65)); const sp = E.outExpo(seg(p, .55, .9)) * split;
    const cutY = y2 - big * .36; const off = 18 * s * sp, gap = 11 * s * sp;
    if (r2 > 0) {
      ctx.save(); ctx.beginPath(); ctx.rect(-50, y2 - big * 1.2, W + 100, big * 1.2 - (y2 - cutY) - gap); ctx.clip();
      reveal(ctx, 'BREAKDOWN', x0 + off, y2 - gap, r2, { size: big, weight: 900, track: -2 * s }); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.rect(-50, cutY + gap, W + 100, big * .6); ctx.clip();
      reveal(ctx, 'BREAKDOWN', x0 - off, y2 + gap, r2, { size: big, weight: 900, track: -2 * s }); ctx.restore();
    }
    if (lineP > 0) { ctx.fillStyle = C.red; const th = 6 * s; const lw = (wB + 160 * s) * lineP; ctx.fillRect(x0 - 80 * s, cutY - th / 2, lw, th); }
    // red square mark next to THE BIG
    const sq = E.outBack(seg(p, .45, .7)); if (sq > 0) { const wt = measure(ctx, 'THE BIG', small, 900, F.disp, -2 * s); const q = 30 * s * sq; ctx.fillStyle = C.red; ctx.fillRect(x0 + wt + 22 * s, y1 - big * .7 + (30 * s - q) / 2, q, q); }
    ctx.restore();
    return { x0, w: wB, top: y1 - big * .75, bottom: y2 + big * .1, cutY };
  }

  // ---------- chapter card overlay ----------
  function chapter(ctx, t, a, b, num, title, o = {}) {
    const lt = t - a; if (t < a || t > b) return;
    const out = E.inExpo(seg(t, b - .45, b));
    const y = o.y || 560, x = SAFE.left;
    ctx.save(); ctx.globalAlpha *= 1 - out;
    { const nl = title.split('\n').length; const g = ctx.createLinearGradient(0, 0, 900, 0); g.addColorStop(0, 'rgba(5,5,6,0.78)'); g.addColorStop(1, 'rgba(5,5,6,0)'); ctx.save(); ctx.globalAlpha *= E.out3(seg(lt, 0, .4)); ctx.fillStyle = g; ctx.fillRect(0, y - 300, 900, 300 + 200 + nl * 112); ctx.restore(); }
    // big outlined numeral
    const p = E.outExpo(seg(lt, 0, .6));
    ctx.save(); font(ctx, 300, 900); ctx.letterSpacing = '-10px'; ctx.lineWidth = 2; ctx.strokeStyle = `rgba(255,255,255,${.5 * p})`;
    ctx.strokeText(num, x - 8 + (1 - p) * -60, y); ctx.restore();
    ctx.fillStyle = C.red; ctx.fillRect(x, y + 40, 260 * E.io3(seg(lt, .15, .6)), 8);
    mono(ctx, `SECTION ${num} / 03`, x, y + 92, { alpha: seg(lt, .25, .6), color: C.white });
    const lines = title.split('\n');
    lines.forEach((ln, i) => reveal(ctx, ln, x - 4, y + 200 + i * 112, seg(lt, .25 + i * .08, .95 + i * .08), { size: o.size || 108, weight: 900, track: -3 }));
    ctx.restore();
  }

  // vertical legibility scrim (top block of type over imagery)
  function scrim(ctx, y0, y1, a = .7) { if (a <= 0) return; const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, `rgba(5,5,6,${a})`); g.addColorStop(.7, `rgba(5,5,6,${a * .6})`); g.addColorStop(1, 'rgba(5,5,6,0)'); ctx.fillStyle = g; ctx.fillRect(0, y0, W, y1 - y0); }
  // ---------- transitions ----------
  // red bar wipe: returns clip progress; draws the bar on top
  function wipeBar(ctx, p, o = {}) {
    if (p <= 0 || p >= 1) return; const { dir = 1, color = C.red } = o; const e = E.io5(p);
    const x = dir > 0 ? lerp(-260, W + 60, e) : lerp(W + 60, -260, e);
    ctx.save(); ctx.fillStyle = color; ctx.translate(x, 0); ctx.transform(1, 0, -0.18, 1, 0, 0); ctx.fillRect(0, -100, 200, H + 200);
    ctx.fillStyle = C.white; ctx.fillRect(210, -100, 6, H + 200); ctx.restore();
  }
  function clipWipe(ctx, p, dir = 1) { // clip region revealed by wipe (for incoming scene)
    const e = E.io5(p); const x = dir > 0 ? lerp(-260, W + 60, e) : lerp(W + 60, -260, e);
    ctx.beginPath();
    if (dir > 0) { ctx.moveTo(-400, -100); ctx.lineTo(x + 0.18 * 100, -100); ctx.lineTo(x - 0.18 * (H + 100), H + 100); ctx.lineTo(-400, H + 100); }
    else { ctx.moveTo(W + 400, -100); ctx.lineTo(x + 200 + 0.18 * 100, -100); ctx.lineTo(x + 200 - 0.18 * (H + 100), H + 100); ctx.lineTo(W + 400, H + 100); }
    ctx.closePath(); ctx.clip();
  }
  // horizontal "breakdown" split transition: screen cut along y, halves slide apart
  function flash(ctx, a, color = '#fff') { if (a <= 0) return; ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = color; ctx.fillRect(0, 0, W, H); ctx.restore(); }

  // ---------- subtitles ----------
  function buildSubs(words, o = {}) {
    const { fixes = {}, keywords = new Set(), maxChars = 20, maxWords = 4 } = o;
    const toks = [];
    words.forEach((w, i) => {
      let s = fixes[i] !== undefined ? fixes[i] : w.w;
      if (s.startsWith('-') && toks.length) { const p = toks[toks.length - 1]; p.w += s; p.e = w.e; return; }
      toks.push({ w: s, s: w.s, e: w.e });
    });
    const chunks = []; let cur = [];
    const flush = () => { if (cur.length) chunks.push(cur); cur = []; };
    toks.forEach((tk, i) => {
      const len = cur.reduce((a, c) => a + c.w.length + 1, 0);
      if (cur.length && (len + tk.w.length > maxChars || cur.length >= maxWords || tk.s - cur[cur.length - 1].e > .45)) flush();
      cur.push(tk);
      if (/[.?!,]$/.test(tk.w)) flush();
    });
    flush();
    return chunks.map((c, i) => {
      const next = chunks[i + 1];
      const end = Math.min(next ? next[0].s - .02 : c[c.length - 1].e + .6, c[c.length - 1].e + .7);
      return { s: c[0].s - .06, e: end, words: c.map(w => ({ ...w, key: keywords.has(w.w.toLowerCase().replace(/[^a-z0-9$'-]/g, '')) })) };
    });
  }
  function subs(ctx, t, chunks, o = {}) {
    const { y = SAFE.subY, size = 58, alpha = 1 } = o; if (alpha <= 0) return;
    const ch = chunks.find(c => t >= c.s && t < c.e); if (!ch) return;
    const disp = ch.words.map(w => w.w.replace(/[,]$/, '').toUpperCase());
    const sp = size * .28; const ws = disp.map(s => measure(ctx, s, size, 800, F.disp, -0.5));
    // wrap into max 2 lines of width 860
    const lines = [[]]; let lw = 0;
    ws.forEach((w, i) => { if (lw + w > 860 && lines[lines.length - 1].length) { lines.push([]); lw = 0; } lines[lines.length - 1].push(i); lw += w + sp; });
    const inP = E.outExpo(seg(t, ch.s, ch.s + .18));
    ctx.save(); ctx.globalAlpha *= alpha;
    // soft legibility band
    const bandH = lines.length * size * 1.18 + 60; const g = ctx.createLinearGradient(0, y - bandH, 0, y + 60);
    g.addColorStop(0, 'rgba(5,5,6,0)'); g.addColorStop(.5, 'rgba(5,5,6,0.55)'); g.addColorStop(1, 'rgba(5,5,6,0)');
    ctx.fillStyle = g; ctx.fillRect(0, y - bandH, W, bandH + 60);
    lines.forEach((ln, li) => {
      const tw = ln.reduce((a, i) => a + ws[i], 0) + sp * (ln.length - 1); let x = W / 2 - tw / 2;
      const ly = y - (lines.length - 1 - li) * size * 1.15;
      ln.forEach(i => {
        const w = ch.words[i]; const on = t >= w.s - .04; const p = E.outBack(seg(t, w.s - .04, w.s + .14));
        const col = w.key ? C.red : C.white;
        ctx.save(); const sc = on ? lerp(.86, 1, p) : .86; ctx.translate(x + ws[i] / 2, ly - size * .35); ctx.scale(sc, sc); ctx.translate(-(x + ws[i] / 2), -(ly - size * .35));
        ctx.shadowColor = 'rgba(0,0,0,0.65)'; ctx.shadowBlur = 18;
        text(ctx, disp[i], x, ly + (on ? (1 - p) * 10 : 10) + (1 - inP) * 20, { size, weight: 800, color: on ? col : 'rgba(243,243,240,0.32)', track: -0.5, alpha: inP });
        ctx.restore(); x += ws[i] + sp;
      });
    });
    ctx.restore();
  }

  // ---------- post ----------
  let grainCv = null;
  function post(ctx, t, o = {}) {
    const { vignette = .75, grain = .07 } = o;
    const g = ctx.createRadialGradient(W / 2, H / 2, H * .25, W / 2, H / 2, H * .75);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${vignette})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    if (!grainCv) { grainCv = document.createElement('canvas'); grainCv.width = grainCv.height = 512; const gx = grainCv.getContext('2d'); const id = gx.createImageData(512, 512); const r = rng(99); for (let i = 0; i < id.data.length; i += 4) { const v = r() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; } gx.putImageData(id, 0, 0); }
    const f = Math.floor(t * 30); const ox = (hash(f) * 512) | 0, oy = (hash(f + 33) * 512) | 0;
    ctx.save(); ctx.globalAlpha = grain; ctx.globalCompositeOperation = 'overlay';
    for (let x = -ox; x < W; x += 512) for (let y = -oy; y < H; y += 512) ctx.drawImage(grainCv, x, y);
    ctx.restore();
  }

  return { W, H, C, F, SAFE, clamp, lerp, seg, E, env, rng, hash, noise1, fmt, font, text, measure, reveal, revealChars, counter, bg, grid, starfield, brackets, tag, mono, hud, logo, chapter, scrim, wipeBar, clipWipe, flash, buildSubs, subs, post };
})();
