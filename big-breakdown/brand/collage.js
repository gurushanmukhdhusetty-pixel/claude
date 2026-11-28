/* THE BIG BREAKDOWN — collage / pixel add-on (explainer-documentary edit style).
   Paper textures, torn cut-outs, tape, marker highlights, hand-drawn annotations,
   stop-motion "boil", halftone, pixel-art sprites and mosaic pixelation.
   Sits on top of brand.js: same palette, type, logo, subtitles and HUD. */
const CL = (() => {
  const { W, H, C, F, clamp, lerp, seg, E, rng, hash, text, measure } = BB;
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  // ---------- textures (generated once) ----------
  let TX = null;
  function textures() {
    if (TX) return TX; TX = {};
    // dark charcoal paper: blotchy low-frequency + fibres + fine grain
    const paper = (w, h, base, seed, fib) => {
      const c = mk(w, h), g = c.getContext('2d'), r = rng(seed);
      g.fillStyle = base; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 260; i++) { const x = r() * w, y = r() * h, rr = 40 + r() * 220; const gr = g.createRadialGradient(x, y, 0, x, y, rr); const l = r() < .5 ? '255,255,255' : '0,0,0'; gr.addColorStop(0, `rgba(${l},${.035 * r()})`); gr.addColorStop(1, `rgba(${l},0)`); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
      g.lineWidth = 1; for (let i = 0; i < fib; i++) { const x = r() * w, y = r() * h, a = r() * 6.28, L = 6 + r() * 30; g.strokeStyle = `rgba(${r() < .5 ? '255,255,255' : '0,0,0'},${.05 + .07 * r()})`; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + 1) * L * .5, y + Math.sin(a + 1) * L * .5, x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); }
      const id = g.getImageData(0, 0, w, h), d = id.data; for (let i = 0; i < d.length; i += 4) { const n = (r() - .5) * 18; d[i] += n; d[i + 1] += n; d[i + 2] += n; } g.putImageData(id, 0, 0);
      return c;
    };
    TX.dark = paper(W, H, '#121214', 3, 5000);
    TX.card = paper(1024, 1024, '#ECE8DF', 5, 3500);     // off-white newsprint for documents
    TX.kraft = paper(1024, 1024, '#2A2725', 9, 3000);    // dark kraft for cut-outs
    // dust & scratches layer (several variants, swapped per frame)
    TX.dust = [0, 1, 2, 3].map(k => { const c = mk(W, H), g = c.getContext('2d'), r = rng(100 + k); for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(255,255,255,${.15 + .35 * r()})`; const s = r() * 2.5 + .5; g.fillRect(r() * W, r() * H, s, s); } g.strokeStyle = 'rgba(255,255,255,0.12)'; for (let i = 0; i < 3; i++) { const x = r() * W; g.lineWidth = r() * 1.2 + .3; g.beginPath(); g.moveTo(x, r() * H * .3); g.lineTo(x + (r() - .5) * 20, H * (.5 + r() * .5)); g.stroke(); } for (let i = 0; i < 6; i++) { g.strokeStyle = `rgba(0,0,0,${.3 + .3 * r()})`; g.lineWidth = 1 + r(); const x = r() * W, y = r() * H; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + r() * 20, y + r() * 20, x - r() * 20, y + r() * 30, x + r() * 10, y + 30 + r() * 30); g.stroke(); } return c; });
    // halftone dot tile
    const ht = mk(12, 12), hg = ht.getContext('2d'); hg.fillStyle = 'rgba(255,255,255,0.10)'; hg.beginPath(); hg.arc(6, 6, 2.2, 0, 7); hg.fill(); TX.halftone = ht;
    // graph paper
    const gp = mk(W, H), gg = gp.getContext('2d'); gg.strokeStyle = 'rgba(255,255,255,0.05)'; gg.lineWidth = 1; gg.beginPath(); for (let x = 0; x < W; x += 24) { gg.moveTo(x + .5, 0); gg.lineTo(x + .5, H); } for (let y = 0; y < H; y += 24) { gg.moveTo(0, y + .5); gg.lineTo(W, y + .5); } gg.stroke(); gg.strokeStyle = 'rgba(255,255,255,0.09)'; gg.beginPath(); for (let x = 0; x < W; x += 120) { gg.moveTo(x + .5, 0); gg.lineTo(x + .5, H); } for (let y = 0; y < H; y += 120) { gg.moveTo(0, y + .5); gg.lineTo(W, y + .5); } gg.stroke(); TX.graph = gp;
    return TX;
  }

  // ---------- stop-motion helpers ----------
  const step = (t, fps = 12) => Math.floor(t * fps) / fps;       // hold frames "on twos"
  const boil = (t, seed = 0, amp = 2) => { const s = Math.floor(t * 12); return [(hash(s * 1.3 + seed) - .5) * amp, (hash(s * 2.7 + seed + 9) - .5) * amp, (hash(s * 3.1 + seed + 4) - .5) * amp * .004]; };

  // ---------- backgrounds ----------
  function paperBg(ctx, t, o = {}) {
    const T = textures(); const { graph = 0, halftone = 0, drift = true } = o;
    const s = Math.floor(t * 12); const ox = drift ? (hash(s) - .5) * 6 : 0, oy = drift ? (hash(s + 5) - .5) * 6 : 0;
    ctx.drawImage(T.dark, ox - 4, oy - 4, W + 8, H + 8);
    if (graph > 0) { ctx.save(); ctx.globalAlpha = graph; ctx.drawImage(T.graph, 0, 0); ctx.restore(); }
    if (halftone > 0) { ctx.save(); ctx.globalAlpha = halftone; ctx.fillStyle = ctx.createPattern(T.halftone, 'repeat'); ctx.fillRect(0, 0, W, H); ctx.restore(); }
  }

  // ---------- torn paper ----------
  function tornPath(x, y, w, h, seed, rough = 7) {
    const r = rng(seed), p = new Path2D(); const n = (L) => Math.max(4, Math.floor(L / 14));
    const edge = (x0, y0, x1, y1, first) => { const k = n(Math.hypot(x1 - x0, y1 - y0)); for (let i = 0; i <= k; i++) { const u = i / k; const j = (r() - .5) * rough * 2; const nx = -(y1 - y0), ny = x1 - x0, nl = Math.hypot(nx, ny) || 1; const px = lerp(x0, x1, u) + nx / nl * j, py = lerp(y0, y1, u) + ny / nl * j; if (first && i === 0) p.moveTo(px, py); else p.lineTo(px, py); } };
    edge(x, y, x + w, y, true); edge(x + w, y, x + w, y + h); edge(x + w, y + h, x, y + h); edge(x, y + h, x, y); p.closePath(); return p;
  }
  // a paper cut-out card (with fibre edge, drop shadow, optional rotation) — draws `inner` in its local space
  function card(ctx, x, y, w, h, o = {}, inner) {
    const T = textures(); const { rot = 0, seed = 1, tone = 'card', shadow = 1, alpha = 1, scale = 1, rough = 6 } = o;
    if (alpha <= 0) return;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x + w / 2, y + h / 2); ctx.rotate(rot); ctx.scale(scale, scale); ctx.translate(-w / 2, -h / 2);
    const p = tornPath(0, 0, w, h, seed, rough);
    if (shadow) { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 26; ctx.shadowOffsetX = 8; ctx.shadowOffsetY = 14; ctx.fillStyle = '#000'; ctx.fill(p); ctx.restore(); }
    ctx.save(); ctx.clip(p); const tex = T[tone] || T.card; const sx = (seed * 137) % 400, sy = (seed * 71) % 400;
    ctx.drawImage(tex, sx, sy, Math.min(1024 - sx, w), Math.min(1024 - sy, h), 0, 0, w, h);
    if (inner) inner(ctx, w, h);
    ctx.restore();
    // bright torn fibre rim
    ctx.strokeStyle = tone === 'card' ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1.5; ctx.stroke(p);
    ctx.restore();
  }
  function tape(ctx, x, y, w = 130, rot = -.2, a = 1) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha *= a * .82;
    const p = tornPath(-w / 2, -18, w, 36, Math.floor(x + y), 3); ctx.fillStyle = 'rgba(226,220,196,0.78)'; ctx.fill(p);
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(-w / 2, -16, w, 6); ctx.restore();
  }

  // ---------- marker annotations ----------
  // highlighter swipe behind text; p = draw progress
  function highlight(ctx, x, y, w, h, p, o = {}) {
    if (p <= 0) return; const { color = 'rgba(229,37,42,0.85)', seed = 3 } = o; const r = rng(seed);
    const e = E.out3(clamp(p)); const ww = w * e;
    ctx.save(); ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x - 6, y + r() * 4);
    for (let i = 0; i <= 10; i++) ctx.lineTo(x - 6 + ww * i / 10, y + (r() - .5) * 5);
    ctx.lineTo(x - 6 + ww + 6, y + h * .5); for (let i = 10; i >= 0; i--) ctx.lineTo(x - 6 + ww * i / 10, y + h + (r() - .5) * 5); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  // rough hand-drawn ellipse (double loop), drawn progressively
  function circle(ctx, cx, cy, rx, ry, p, o = {}) {
    if (p <= 0) return; const { color = C.red, lw = 6, seed = 7, turns = 1.15 } = o; const r = rng(seed);
    const n = 80, tot = Math.floor(n * turns * clamp(p)); const a0 = -2.2 + r() * .4, wob = [r(), r(), r()];
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
    for (let i = 0; i <= tot; i++) { const a = a0 + i / n * Math.PI * 2; const k = 1 + .06 * Math.sin(a * 2 + wob[0] * 6) + .04 * (i / n); ctx[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k * (1 + .05 * wob[1])); }
    ctx.stroke(); ctx.restore();
  }
  function underline(ctx, x, y, w, p, o = {}) {
    if (p <= 0) return; const { color = C.red, lw = 6, seed = 2 } = o; const r = rng(seed); const e = E.out3(clamp(p));
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y);
    const k = 6; for (let i = 1; i <= k; i++) { const u = i / k; if (u > e) { ctx.lineTo(x + w * e, y + (r() - .5) * 6); break; } ctx.lineTo(x + w * u, y + (r() - .5) * 6 + (u > .9 ? -4 : 0)); }
    ctx.stroke(); ctx.restore();
  }
  function cross(ctx, cx, cy, s, p, o = {}) {
    const { color = C.red, lw = 10 } = o; ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round';
    const p1 = E.out3(seg(p, 0, .5)), p2 = E.out3(seg(p, .5, 1));
    if (p1 > 0) { ctx.beginPath(); ctx.moveTo(cx - s, cy - s * .9); ctx.lineTo(cx - s + 2 * s * p1, cy - s * .9 + 1.85 * s * p1); ctx.stroke(); }
    if (p2 > 0) { ctx.beginPath(); ctx.moveTo(cx + s, cy - s); ctx.lineTo(cx + s - 2 * s * p2, cy - s + 1.95 * s * p2); ctx.stroke(); }
    ctx.restore();
  }
  function arrow(ctx, x0, y0, x1, y1, p, o = {}) { // hand-drawn curved arrow
    if (p <= 0) return; const { color = C.white, lw = 5, bend = .25 } = o; const e = E.out3(clamp(p));
    const mx = (x0 + x1) / 2 - (y1 - y0) * bend, my = (y0 + y1) / 2 + (x1 - x0) * bend;
    const q = (u) => [(1 - u) ** 2 * x0 + 2 * (1 - u) * u * mx + u * u * x1, (1 - u) ** 2 * y0 + 2 * (1 - u) * u * my + u * u * y1];
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
    for (let i = 0; i <= 30; i++) { const u = e * i / 30; const [x, y] = q(u); ctx[i ? 'lineTo' : 'moveTo'](x, y); } ctx.stroke();
    if (e > .95) { const [xa, ya] = q(.92), [xb, yb] = q(1); const a = Math.atan2(yb - ya, xb - xa); ctx.beginPath(); ctx.moveTo(xb - Math.cos(a - .5) * 26, yb - Math.sin(a - .5) * 26); ctx.lineTo(xb, yb); ctx.lineTo(xb - Math.cos(a + .5) * 26, yb - Math.sin(a + .5) * 26); ctx.stroke(); }
    ctx.restore();
  }
  // rubber stamp (rotated outline box, ink texture)
  function stamp(ctx, s, cx, cy, p, o = {}) {
    if (p <= 0) return; const { size = 64, rot = -.12, color = C.red, sub = '' } = o;
    const sc = lerp(1.8, 1, E.outExpo(clamp(p))); const w = measure(ctx, s, size, 900, F.disp, 2) + 60;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(sc, sc); ctx.globalAlpha *= E.out3(clamp(p * 2));
    ctx.strokeStyle = color; ctx.lineWidth = 7; ctx.strokeRect(-w / 2, -size * .85, w, size * (sub ? 1.95 : 1.6));
    text(ctx, s, 0, size * .2, { size, weight: 900, align: 'center', color, track: 2 }); if (sub) BB.mono(ctx, sub, 0, size * .82, { align: 'center', color, size: 18, weight: 700 });
    // ink gaps
    ctx.globalCompositeOperation = 'destination-out'; const r = rng(Math.floor(cx)); for (let i = 0; i < 90; i++) { ctx.fillStyle = `rgba(0,0,0,${.4 + .6 * r()})`; ctx.fillRect((r() - .5) * w, (r() - .6) * size * 1.6, 2 + r() * 5, 1 + r() * 3); }
    ctx.restore();
  }
  // label sticker (white or red strip with mono text)
  function label(ctx, s, x, y, o = {}) { const { rot = 0, fill = C.white, color = '#0b0b0c', size = 22, alpha = 1 } = o; if (alpha <= 0) return; ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha *= alpha; const w = measure(ctx, s, size, 700, F.mono, 2) + 28; ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(5, 6, w, size + 18); ctx.fillStyle = fill; ctx.fillRect(0, 0, w, size + 18); text(ctx, s, 14, size + 4, { size, weight: 700, fam: F.mono, color, track: 2 }); ctx.restore(); return w; }

  // ---------- pixel art ----------
  // sprite = array of strings, palette = {char: color}
  function sprite(ctx, rows, x, y, px, pal, o = {}) {
    const { reveal = 1, seed = 1, align = 'center' } = o; const h = rows.length, w = rows[0].length;
    const x0 = align === 'center' ? x - w * px / 2 : x, y0 = align === 'center' ? y - h * px / 2 : y;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const ch = rows[j][i]; if (ch === '.' || ch === ' ') continue; const col = pal[ch]; if (!col) continue;
      if (reveal < 1 && hash(i * 31 + j * 17 + seed) > reveal) continue;
      ctx.fillStyle = typeof col === 'function' ? col(i, j) : col; ctx.fillRect(Math.round(x0 + i * px), Math.round(y0 + j * px), Math.ceil(px), Math.ceil(px));
    }
    return { w: w * px, h: h * px, x0, y0 };
  }
  // large text rendered as chunky pixels (rasterised then sampled)
  let ptCv = null;
  function pixelText(ctx, s, x, y, o = {}) {
    const { size = 200, px = 10, color = C.white, reveal = 1, seed = 2, align = 'left', weight = 900 } = o;
    if (!ptCv) ptCv = mk(W, 600); const g = ptCv.getContext('2d'); g.clearRect(0, 0, W, 600);
    const cw = Math.min(W, Math.ceil(measure(ctx, s, size, weight, F.disp, -4) + 20)); g.font = `${weight} ${size}px "${F.disp}"`; g.letterSpacing = '-4px'; g.fillStyle = '#fff'; g.textBaseline = 'alphabetic'; g.fillText(s, 10, size * 1.05);
    const hh = Math.ceil(size * 1.3); const d = g.getImageData(0, 0, cw, hh).data; const x0 = align === 'center' ? x - cw / 2 : align === 'right' ? x - cw : x;
    ctx.fillStyle = color;
    for (let j = 0; j < hh; j += px) for (let i = 0; i < cw; i += px) { const a = d[((j + (px >> 1)) * cw + i + (px >> 1)) * 4 + 3]; if (!(a >= 128)) continue; if (reveal < 1 && hash(i * .37 + j * 1.91 + seed) > reveal) continue; ctx.fillRect(x0 + i - 10, y - size * 1.05 + j, px - 1, px - 1); }
  }
  // render fn() into a low-res buffer and blow it up with hard pixels (mosaic)
  let pxCv = null, pxCtx = null, fullCv = null, fullCtx = null;
  function pixelate(ctx, block, fn) {
    if (block <= 1.01) { fn(ctx); return; }
    if (!fullCv) { fullCv = mk(W, H); fullCtx = fullCv.getContext('2d'); pxCv = mk(W, H); pxCtx = pxCv.getContext('2d'); }
    fullCtx.setTransform(1, 0, 0, 1, 0, 0); fullCtx.globalAlpha = 1; fullCtx.globalCompositeOperation = 'source-over'; fullCtx.clearRect(0, 0, W, H); fullCtx.save(); fn(fullCtx); fullCtx.restore();
    const w = Math.max(1, Math.round(W / block)), h = Math.max(1, Math.round(H / block));
    pxCtx.imageSmoothingEnabled = true; pxCtx.clearRect(0, 0, w, h); pxCtx.drawImage(fullCv, 0, 0, w, h);
    ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(pxCv, 0, 0, w, h, 0, 0, W, H); ctx.restore();
  }

  // ---------- finishing ----------
  function finish(ctx, t, o = {}) {
    const T = textures(); const { dust = .9, leak = 0 } = o; const s = Math.floor(t * 12);
    ctx.save(); ctx.globalAlpha = dust; ctx.globalCompositeOperation = 'screen'; ctx.drawImage(T.dust[s % 4], (hash(s) - .5) * 40, (hash(s + 1) - .5) * 40); ctx.restore();
    // gate weave flicker
    const fl = (hash(Math.floor(t * 24)) - .5) * .04; if (fl > 0) { ctx.save(); ctx.globalAlpha = fl; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    if (leak > 0) { ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = ctx.createRadialGradient(W * 1.05, H * .2, 0, W * 1.05, H * .2, 700); g.addColorStop(0, `rgba(255,70,40,${.35 * leak})`); g.addColorStop(1, 'rgba(255,70,40,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  }

  return { textures, step, boil, paperBg, tornPath, card, tape, highlight, circle, underline, cross, arrow, stamp, label, sprite, pixelText, pixelate, finish };
})();
