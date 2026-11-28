/* Minimal deterministic 3D for canvas 2D: camera, projection, dot-matrix Earth, orbits, flat-shaded meshes. */
const G3 = (() => {
  const { W, H, C, clamp, lerp } = BB;
  const v = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s], dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    len: a => Math.hypot(a[0], a[1], a[2]), norm: a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
    lerp: (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)],
  };
  const rotY = (p, a) => { const c = Math.cos(a), s = Math.sin(a); return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c]; };
  const rotX = (p, a) => { const c = Math.cos(a), s = Math.sin(a); return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c]; };
  const rotZ = (p, a) => { const c = Math.cos(a), s = Math.sin(a); return [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]]; };

  function camera(pos, tgt, fov = 40, o = {}) {
    const f = v.norm(v.sub(tgt, pos)); let r = v.norm(v.cross(f, [0, 1, 0])); let u = v.cross(r, f);
    if (o.roll) { const c = Math.cos(o.roll), s = Math.sin(o.roll); const r2 = v.add(v.mul(r, c), v.mul(u, s)); u = v.sub(v.mul(u, c), v.mul(r, s)); r = r2; }
    const foc = (H / 2) / Math.tan(fov * Math.PI / 360);
    const cx = o.cx ?? W / 2, cy = o.cy ?? H / 2;
    return {
      pos, f, r, u, foc, cx, cy,
      proj(p) { const d = v.sub(p, pos); const z = v.dot(d, f); if (z < .01) return null; return { x: cx + v.dot(d, r) * foc / z, y: cy - v.dot(d, u) * foc / z, z, s: foc / z }; },
      toCam(p) { const d = v.sub(p, pos); return [v.dot(d, r), v.dot(d, u), v.dot(d, f)]; },
    };
  }

  // ---------- Earth ----------
  let dots = null, lights = null;
  function setEarth(lonlat) {
    dots = new Float32Array(lonlat.length * 3); lights = new Uint8Array(lonlat.length);
    const r = BB.rng(5);
    lonlat.forEach(([lo, la], i) => { const a = la * Math.PI / 180, b = lo * Math.PI / 180; dots[i * 3] = Math.cos(a) * Math.sin(b); dots[i * 3 + 1] = Math.sin(a); dots[i * 3 + 2] = Math.cos(a) * Math.cos(b); lights[i] = r() < .07 ? 1 : 0; });
  }
  // earth transform: unit -> world
  function eX(p, e) { let q = rotY(p, e.spin || 0); q = rotX(q, e.tilt || 0); return [e.c[0] + q[0] * e.R, e.c[1] + q[1] * e.R, e.c[2] + q[2] * e.R]; }
  function occluded(cam, wp, e) { // true if earth sphere blocks the point
    const d = v.sub(wp, cam.pos); const L = v.len(d); const dn = v.mul(d, 1 / L); const oc = v.sub(cam.pos, e.c);
    const b = v.dot(oc, dn), c = v.dot(oc, oc) - e.R * e.R * .995; const disc = b * b - c; if (disc < 0) return false;
    const t0 = -b - Math.sqrt(disc); return t0 > 0 && t0 < L - 1e-4;
  }
  function earth(ctx, cam, e) {
    const { R, c, sun = v.norm([-1, .3, .6]), alpha = 1, dot = 1, glow = 1, cities = 1, grat = .5 } = e;
    const cp = cam.proj(c); if (!cp) return;
    const sr = R * cam.foc / v.len(v.sub(c, cam.pos)); // approx screen radius
    ctx.save(); ctx.globalAlpha *= alpha;
    // sun direction in screen space for shading body
    const sp = cam.toCam(v.add(c, v.mul(sun, R))); const sdx = sp[0], sdy = -sp[1]; const sl = Math.hypot(sdx, sdy) || 1;
    // atmosphere glow
    if (glow > 0) {
      const ag = ctx.createRadialGradient(cp.x, cp.y, sr * .96, cp.x, cp.y, sr * 1.22);
      ag.addColorStop(0, `rgba(190,205,230,${.32 * glow})`); ag.addColorStop(.25, `rgba(140,160,200,${.12 * glow})`); ag.addColorStop(1, 'rgba(120,140,180,0)');
      ctx.fillStyle = ag; ctx.beginPath(); ctx.arc(cp.x, cp.y, sr * 1.22, 0, 7); ctx.fill();
    }
    // body
    const bx = cp.x + sdx / sl * sr * .45, by = cp.y + sdy / sl * sr * .45;
    const bgd = ctx.createRadialGradient(bx, by, sr * .05, cp.x, cp.y, sr);
    bgd.addColorStop(0, '#1b1e24'); bgd.addColorStop(.6, '#0b0c0f'); bgd.addColorStop(1, '#040405');
    ctx.fillStyle = bgd; ctx.beginPath(); ctx.arc(cp.x, cp.y, sr, 0, 7); ctx.fill();
    // graticule
    if (grat > 0) {
      ctx.strokeStyle = `rgba(255,255,255,${.07 * grat})`; ctx.lineWidth = 1; ctx.beginPath();
      for (let la = -60; la <= 60; la += 30) { let first = true; for (let lo = 0; lo <= 360; lo += 6) { const a = la * Math.PI / 180, b = lo * Math.PI / 180; const w = eX([Math.cos(a) * Math.sin(b), Math.sin(a), Math.cos(a) * Math.cos(b)], e); const n = v.sub(w, c); if (v.dot(n, v.sub(cam.pos, w)) < 0) { first = true; continue; } const p = cam.proj(w); if (!p) { first = true; continue; } if (first) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); first = false; } }
      for (let lo = 0; lo < 360; lo += 30) { let first = true; for (let la = -84; la <= 84; la += 6) { const a = la * Math.PI / 180, b = lo * Math.PI / 180; const w = eX([Math.cos(a) * Math.sin(b), Math.sin(a), Math.cos(a) * Math.cos(b)], e); const n = v.sub(w, c); if (v.dot(n, v.sub(cam.pos, w)) < 0) { first = true; continue; } const p = cam.proj(w); if (!p) { first = true; continue; } if (first) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); first = false; } }
      ctx.stroke();
    }
    // dots bucketed by brightness
    const NB = 10; const buckets = Array.from({ length: NB }, () => []); const city = [];
    const n = dots.length / 3; const q = rotX; const sinS = Math.sin(e.spin || 0), cosS = Math.cos(e.spin || 0); const ct = Math.cos(e.tilt || 0), st = Math.sin(e.tilt || 0);
    for (let i = 0; i < n; i++) {
      const x0 = dots[i * 3], y0 = dots[i * 3 + 1], z0 = dots[i * 3 + 2];
      const x1 = x0 * cosS + z0 * sinS, z1 = -x0 * sinS + z0 * cosS; const y2 = y0 * ct - z1 * st, z2 = y0 * st + z1 * ct;
      const wx = c[0] + x1 * R, wy = c[1] + y2 * R, wz = c[2] + z2 * R;
      const tx = cam.pos[0] - wx, ty = cam.pos[1] - wy, tz = cam.pos[2] - wz;
      const facing = x1 * tx + y2 * ty + z2 * tz; if (facing <= 0) continue;
      const p = cam.proj([wx, wy, wz]); if (!p) continue; if (p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20) continue;
      const lit = x1 * sun[0] + y2 * sun[1] + z2 * sun[2];
      const fl = facing / Math.hypot(tx, ty, tz); // limb falloff
      const b = clamp((.16 + .84 * clamp(lit * 1.4 + .1)) * (.35 + .65 * fl));
      const k = Math.min(NB - 1, Math.floor(b * NB)); const s = Math.max(.9, R * .0105 * p.s * dot);
      buckets[k].push(p.x, p.y, s);
      if (lights[i] && lit < -.08 && cities > 0) city.push(p.x, p.y, s * (0.7 + .6 * ((i * 7919) % 13) / 13), clamp(-lit * 3));
    }
    for (let k = 0; k < NB; k++) { const a = buckets[k]; if (!a.length) continue; const l = Math.round(60 + 195 * (k + .5) / NB); ctx.fillStyle = `rgb(${l},${l},${Math.min(255, l + 6)})`; for (let j = 0; j < a.length; j += 3) ctx.fillRect(a[j] - a[j + 2] / 2, a[j + 1] - a[j + 2] / 2, a[j + 2], a[j + 2]); }
    if (city.length) { ctx.fillStyle = '#ff5a3c'; for (let j = 0; j < city.length; j += 4) { ctx.globalAlpha = alpha * cities * city[j + 3] * .9; ctx.fillRect(city[j] - city[j + 2] / 2, city[j + 1] - city[j + 2] / 2, city[j + 2], city[j + 2]); } ctx.globalAlpha = alpha; }
    // thin rim light on sun side
    ctx.lineWidth = Math.max(1.5, sr * .006); const rg = ctx.createLinearGradient(cp.x - sdx / sl * sr, cp.y - sdy / sl * sr, cp.x + sdx / sl * sr, cp.y + sdy / sl * sr);
    rg.addColorStop(0, 'rgba(255,255,255,0)'); rg.addColorStop(.6, 'rgba(255,255,255,0.05)'); rg.addColorStop(1, `rgba(235,240,255,${.55 * glow})`);
    ctx.strokeStyle = rg; ctx.beginPath(); ctx.arc(cp.x, cp.y, sr * 1.002, 0, 7); ctx.stroke();
    ctx.restore();
    return { cp, sr };
  }

  // ---------- per-pixel dot-matrix Earth (any zoom level) ----------
  let MASK = null, MW = 0, MH = 0, off = null, offCtx = null;
  function setMask(u8, w, h) { MASK = u8; MW = w; MH = h; }
  function earthPix(ctx, cam, e) {
    const { R, c, sun = v.norm([-1, .3, .6]), alpha = 1, glow = 1, g = .5, cities = 1 } = e;
    const cp = cam.proj(c); if (!cp) return;
    const dist = v.len(v.sub(c, cam.pos)); const sr = R * cam.foc / Math.sqrt(Math.max(1e-6, dist * dist - R * R));
    ctx.save(); ctx.globalAlpha *= alpha;
    if (glow > 0) { const ag = ctx.createRadialGradient(cp.x, cp.y, sr * .96, cp.x, cp.y, sr * 1.22); ag.addColorStop(0, `rgba(190,205,230,${.32 * glow})`); ag.addColorStop(.25, `rgba(140,160,200,${.12 * glow})`); ag.addColorStop(1, 'rgba(120,140,180,0)'); ctx.fillStyle = ag; ctx.beginPath(); ctx.arc(cp.x, cp.y, sr * 1.22, 0, 7); ctx.fill(); }
    const x0 = Math.max(0, Math.floor(cp.x - sr - 2)), x1 = Math.min(W, Math.ceil(cp.x + sr + 2)), y0 = Math.max(0, Math.floor(cp.y - sr - 2)), y1 = Math.min(H, Math.ceil(cp.y + sr + 2));
    const bw = x1 - x0, bh = y1 - y0; if (bw <= 0 || bh <= 0) { ctx.restore(); return { cp, sr }; }
    if (!off) { off = document.createElement('canvas'); off.width = W; off.height = H; offCtx = off.getContext('2d'); }
    const img = offCtx.createImageData(bw, bh); const D = img.data;
    const [px, py, pz] = cam.pos, [fx, fy, fz] = cam.f, [rx, ry, rz] = cam.r, [ux, uy, uz] = cam.u, foc = cam.foc, ccx = cam.cx, ccy = cam.cy;
    const ox = px - c[0], oy = py - c[1], oz = pz - c[2], ooc = ox * ox + oy * oy + oz * oz;
    const cs = Math.cos(-(e.spin || 0)), ss = Math.sin(-(e.spin || 0)), ct = Math.cos(-(e.tilt || 0)), st = Math.sin(-(e.tilt || 0));
    const [sx, sy, sz] = sun; const RAD = 180 / Math.PI; const dr = .42 * g;
    for (let j = 0; j < bh; j++) {
      const yy = ccy - (y0 + j + .5);
      for (let i = 0; i < bw; i++) {
        const xx = x0 + i + .5 - ccx;
        let dx = fx * foc + rx * xx + ux * yy, dy = fy * foc + ry * xx + uy * yy, dz = fz * foc + rz * xx + uz * yy; const dl = 1 / Math.sqrt(dx * dx + dy * dy + dz * dz); dx *= dl; dy *= dl; dz *= dl;
        const b = ox * dx + oy * dy + oz * dz; const perp2 = ooc - b * b; const disc = R * R - perp2;
        const pw = -b / foc * 1.0; // world size of a pixel at that depth
        const edge = Math.min(1, Math.max(0, (R - Math.sqrt(Math.max(0, perp2))) / pw + .5)); if (edge <= 0) continue;
        const tt = -b - Math.sqrt(Math.max(0, disc));
        const nx = (ox + dx * tt) / R, ny = (oy + dy * tt) / R, nz = (oz + dz * tt) / R;
        const ndv = Math.max(.02, -(nx * dx + ny * dy + nz * dz));
        // inverse earth transform: undo tilt (rotX) then spin (rotY)
        const qy = ny * ct - nz * st, qz1 = ny * st + nz * ct; const qx = nx * cs + qz1 * ss, qz = -nx * ss + qz1 * cs;
        const lat = Math.asin(Math.max(-1, Math.min(1, qy))) * RAD, lon = Math.atan2(qx, qz) * RAD;
        const lit = nx * sx + ny * sy + nz * sz;
        // dot grid
        const ri = Math.floor((lat + 90) / g), latc = ri * g - 90 + g / 2; const cl = Math.max(.05, Math.cos(latc / RAD)); const gl = g / cl;
        const ci = Math.floor((lon + 180) / gl), lonc = ci * gl - 180 + gl / 2;
        const mi = Math.min(MW - 1, Math.max(0, ((lonc + 180) / 360 * MW) | 0)), mj = Math.min(MH - 1, Math.max(0, ((90 - latc) / 180 * MH) | 0));
        const land = MASK[mj * MW + mi] > 0;
        const fp = RAD * (tt / foc) / (R * ndv); // degrees per pixel on surface
        // ocean body
        const shade = Math.max(0, Math.min(1, lit * 1.2 + .15));
        let cr = 6 + 16 * shade, cg = 7 + 18 * shade, cb = 9 + 23 * shade;
        // ocean specular
        const hx = sx - dx, hy = sy - dy, hz = sz - dz, hl = Math.sqrt(hx * hx + hy * hy + hz * hz) || 1; const sp = Math.pow(Math.max(0, (nx * hx + ny * hy + nz * hz) / hl), 60) * .5;
        cr += sp * 120; cg += sp * 125; cb += sp * 135;
        if (land) {
          const ddx = (lon - lonc) * Math.cos(lat / RAD), ddy = lat - latc; const d = Math.sqrt(ddx * ddx + ddy * ddy);
          let cov = fp > g * .7 ? .34 : Math.min(1, Math.max(0, (dr - d) / fp + .5));
          const bb = Math.max(0, Math.min(1, (.16 + .84 * Math.max(0, Math.min(1, lit * 1.4 + .1))) * (.35 + .65 * ndv)));
          const L = 85 + 170 * bb;
          let lr = L, lg = L, lb = Math.min(255, L + 6);
          if (cities > 0 && lit < -.06) { const h = Math.sin(ri * 12.9898 + ci * 78.233) * 43758.5453; const hr = h - Math.floor(h); if (hr < .03) { const k = Math.min(1, -lit * 3) * cities; lr = lerp(lr, 255, k); lg = lerp(lg, 80, k); lb = lerp(lb, 55, k); } }
          cr = lerp(cr, lr, cov); cg = lerp(cg, lg, cov); cb = lerp(cb, lb, cov);
        }
        // limb darkening
        const lk = .55 + .45 * Math.min(1, ndv * 2.2); const o = (j * bw + i) * 4;
        D[o] = cr * lk; D[o + 1] = cg * lk; D[o + 2] = cb * lk; D[o + 3] = 255 * edge;
      }
    }
    offCtx.clearRect(0, 0, bw, bh); offCtx.putImageData(img, 0, 0); ctx.drawImage(off, 0, 0, bw, bh, x0, y0, bw, bh);
    const sp2 = cam.toCam(v.add(c, v.mul(sun, R))); const sdx = sp2[0], sdy = -sp2[1]; const sl = Math.hypot(sdx, sdy) || 1;
    ctx.lineWidth = Math.max(1.5, Math.min(6, sr * .004)); const rg = ctx.createLinearGradient(cp.x - sdx / sl * sr, cp.y - sdy / sl * sr, cp.x + sdx / sl * sr, cp.y + sdy / sl * sr);
    rg.addColorStop(0, 'rgba(255,255,255,0)'); rg.addColorStop(.6, 'rgba(255,255,255,0.05)'); rg.addColorStop(1, `rgba(235,240,255,${.6 * glow})`);
    ctx.strokeStyle = rg; ctx.beginPath(); ctx.arc(cp.x, cp.y, sr, 0, 7); ctx.stroke();
    ctx.restore(); return { cp, sr };
  }
  const ll2v = (lat, lon) => { const a = lat * Math.PI / 180, b = lon * Math.PI / 180; return [Math.cos(a) * Math.sin(b), Math.sin(a), Math.cos(a) * Math.cos(b)]; };

  // ---------- orbits ----------
  // orbital position: inclination inc, node raan, anomaly u, radius r (unit earth frame, before earth spin)
  function orbitPos(inc, raan, u, r) { let p = [Math.cos(u) * r, 0, Math.sin(u) * r]; p = rotX(p, inc); p = rotY(p, raan); return p; }
  function shell(defs) { // [{planes, per, inc, r, speed}] -> list
    const out = []; defs.forEach((d, di) => { for (let i = 0; i < d.planes; i++) for (let j = 0; j < d.per; j++) out.push({ inc: d.inc, raan: i / d.planes * Math.PI * 2, u0: j / d.per * Math.PI * 2 + i * .37, r: d.r, sp: d.speed, plane: i, idx: j, shell: di, per: d.per, planes: d.planes }); }); return out;
  }
  // world position for satellite in earth-centred inertial frame (tilt applied, no spin)
  function satW(s, t, e) { let p = orbitPos(s.inc, s.raan, s.u0 + s.sp * t, s.r); p = rotX(p, e.tilt || 0); return [e.c[0] + p[0] * e.R, e.c[1] + p[1] * e.R, e.c[2] + p[2] * e.R]; }
  function orbitLine(ctx, cam, e, inc, raan, r, o = {}) {
    const { color = 'rgba(255,255,255,0.12)', lw = 1, from = 0, to = Math.PI * 2 } = o;
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.beginPath(); let first = true;
    for (let k = 0; k <= 120; k++) { const u = lerp(from, to, k / 120); let p = orbitPos(inc, raan, u, r); p = rotX(p, e.tilt || 0); const w = [e.c[0] + p[0] * e.R, e.c[1] + p[1] * e.R, e.c[2] + p[2] * e.R]; if (occluded(cam, w, e)) { first = true; continue; } const q = cam.proj(w); if (!q) { first = true; continue; } if (first) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y); first = false; }
    ctx.stroke(); ctx.restore();
  }

  // ---------- meshes ----------
  // box centred at c with half extents h, color, emissive; returns 6 quads
  function box(c, h, col, o = {}) {
    const [x, y, z] = c, [a, b, d] = h; const P = (sx, sy, sz) => [x + sx * a, y + sy * b, z + sz * d];
    const q = (p, n) => ({ p, n, col, ...o });
    return [q([P(-1, -1, 1), P(1, -1, 1), P(1, 1, 1), P(-1, 1, 1)], [0, 0, 1]), q([P(1, -1, -1), P(-1, -1, -1), P(-1, 1, -1), P(1, 1, -1)], [0, 0, -1]),
    q([P(1, -1, 1), P(1, -1, -1), P(1, 1, -1), P(1, 1, 1)], [1, 0, 0]), q([P(-1, -1, -1), P(-1, -1, 1), P(-1, 1, 1), P(-1, 1, -1)], [-1, 0, 0]),
    q([P(-1, 1, 1), P(1, 1, 1), P(1, 1, -1), P(-1, 1, -1)], [0, 1, 0]), q([P(-1, -1, -1), P(1, -1, -1), P(1, -1, 1), P(-1, -1, 1)], [0, -1, 0])];
  }
  function panel(c, u, w, col, o = {}) { // flat double-sided rectangle spanned by vectors u,w from centre c
    const p = [v.sub(v.sub(c, u), w), v.sub(v.add(c, u), w), v.add(v.add(c, u), w), v.add(v.sub(c, u), w)];
    return [{ p, n: v.norm(v.cross(u, w)), col, two: true, ...o }];
  }
  function xform(quads, fn, fnN) { return quads.map(q => ({ ...q, p: q.p.map(fn), n: fnN ? fnN(q.n) : q.n })); }
  function drawMesh(ctx, cam, quads, o = {}) {
    const { sun = v.norm([-1, .4, .5]), amb = .22, alpha = 1, wire = 0 } = o;
    const list = [];
    for (const q of quads) {
      const pp = q.p.map(p => cam.proj(p)); if (pp.some(p => !p)) continue;
      const cen = v.mul(q.p.reduce((a, b) => v.add(a, b), [0, 0, 0]), 1 / q.p.length);
      let n = q.n; const toC = v.sub(cam.pos, cen); let facing = v.dot(n, toC);
      if (facing < 0) { if (!q.two) continue; n = v.mul(n, -1); }
      const z = v.len(toC); const lit = clamp(v.dot(n, sun)); list.push({ q, pp, z, lit, n });
    }
    list.sort((a, b) => b.z - a.z);
    ctx.save(); ctx.globalAlpha *= alpha; ctx.lineJoin = 'round';
    for (const { q, pp, lit, n } of list) {
      const k = amb + (1 - amb) * lit; const [r, g, b] = q.col; const em = q.em || 0;
      ctx.fillStyle = `rgb(${Math.min(255, r * k + em * 255) | 0},${Math.min(255, g * k + em * 60) | 0},${Math.min(255, b * k + em * 50) | 0})`;
      ctx.beginPath(); ctx.moveTo(pp[0].x, pp[0].y); for (let i = 1; i < pp.length; i++) ctx.lineTo(pp[i].x, pp[i].y); ctx.closePath(); ctx.fill();
      if (q.edge !== false) { ctx.strokeStyle = q.edgeCol || `rgba(255,255,255,${.06 + .14 * lit})`; ctx.lineWidth = q.lw || 1; ctx.stroke(); }
      if (q.cells) { // grid lines across the quad (solar cells)
        const [a, b2, c2, d] = pp; ctx.strokeStyle = q.cellCol || 'rgba(255,255,255,0.18)'; ctx.lineWidth = .8; ctx.beginPath();
        for (let i = 1; i < q.cells[0]; i++) { const t = i / q.cells[0]; ctx.moveTo(lerp(a.x, b2.x, t), lerp(a.y, b2.y, t)); ctx.lineTo(lerp(d.x, c2.x, t), lerp(d.y, c2.y, t)); }
        for (let i = 1; i < q.cells[1]; i++) { const t = i / q.cells[1]; ctx.moveTo(lerp(a.x, d.x, t), lerp(a.y, d.y, t)); ctx.lineTo(lerp(b2.x, c2.x, t), lerp(b2.y, c2.y, t)); }
        ctx.stroke();
        // specular glint
        const spec = Math.pow(clamp(v.dot(n, sun)), 6) * (q.glint ?? .5); if (spec > .01) { ctx.fillStyle = `rgba(255,255,255,${spec * .45})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b2.x, b2.y); ctx.lineTo(c2.x, c2.y); ctx.lineTo(d.x, d.y); ctx.fill(); }
      }
    }
    ctx.restore();
  }
  // glow dot
  function glow(ctx, x, y, r, col = '255,59,48', a = 1) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(.25, `rgba(${col},${a * .35})`); g.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  return { setMask, earthPix, v, rotX, rotY, rotZ, camera, setEarth, earth, eX, ll2v, occluded, orbitPos, shell, satW, orbitLine, box, panel, xform, drawMesh, glow };
})();
