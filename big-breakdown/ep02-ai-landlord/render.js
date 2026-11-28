// node render.js stills t1 t2 ...  |  node render.js chunk <startFrame> <endFrame> <out.mp4>
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const { spawn } = require('child_process');
(async () => {
  const [mode, ...a] = process.argv.slice(2);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => console.error('PAGEERR', e.message)); p.on('console', m => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });
  await p.goto('file://' + path.resolve(__dirname, 'index.html'));
  const data = { words: JSON.parse(fs.readFileSync(path.join(__dirname, 'data/words.json'))), earth: JSON.parse(fs.readFileSync(path.join(__dirname, 'data/earth_dots.json'))), mask: fs.readFileSync(path.join(__dirname, 'data/land_mask_2048x1024.u8')).toString('base64') };
  await p.evaluate(d => init(d), data);
  await p.evaluate(async () => { const fams = ['900 40px "Inter Tight"', '800 40px "Inter Tight"', '700 40px "Inter Tight"', '600 40px "Inter Tight"', '500 20px "JetBrains Mono"', '700 20px "JetBrains Mono"']; for (const f of fams) await document.fonts.load(f); });
  const out = process.env.OUT || path.join(__dirname, 'out'); fs.mkdirSync(out, { recursive: true });
  const grab = async () => Buffer.from(await p.evaluate(() => document.getElementById('c').toDataURL('image/jpeg', .94).split(',')[1]), 'base64');
  if (mode === 'stills') { for (const t of a) { await p.evaluate(t => render(+t), t); fs.writeFileSync(path.join(out, `still_${t}.jpg`), await grab()); } }
  else {
    const [s, e, file] = [+a[0], +a[1], a[2]];
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', '-r', '30', file], { stdio: ['pipe', 'inherit', 'inherit'] });
    const t0 = Date.now();
    for (let f = s; f < e; f++) { await p.evaluate(t => render(t), f / 30); const buf = await grab(); if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)); if (f % 150 === 0) console.log(file, 'frame', f, ((Date.now() - t0) / 1000).toFixed(0) + 's'); }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
  }
  await b.close();
})();
