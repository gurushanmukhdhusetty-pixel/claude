"""THE BIG BREAKDOWN — EP01 score + sound design, synthesised from scratch (no samples).
usage: python3 audio.py <voiceover.wav 48k mono> <out_mix.wav>
Writes stems next to the output: music.wav, sfx.wav, then a ducked mix (voice-over unaltered in timing)."""
import sys, numpy as np, wave
from scipy import signal

SR = 48000
DUR = 124.29
N = int(DUR * SR) + SR // 2
rng = np.random.default_rng(42)

def read_wav(p):
    w = wave.open(p); a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
    return a.reshape(-1, w.getnchannels()).mean(1) if w.getnchannels() > 1 else a
def write_wav(p, x):
    x = np.clip(x, -1, 1); w = wave.open(p, 'wb'); w.setnchannels(x.shape[1]); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((x * 32767).astype(np.int16).tobytes()); w.close()

def t_(d): return np.arange(int(d * SR)) / SR
def lp(x, f, o=2): return signal.sosfilt(signal.butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return signal.sosfilt(signal.butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, lo, hi, o=2): return signal.sosfilt(signal.butter(o, [lo, hi], 'band', fs=SR, output='sos'), x)
def env_adsr(n, a=.01, r=.3, curve=4):
    e = np.ones(n); na = max(1, int(a * SR)); nr = max(1, int(r * SR)); e[:na] = np.linspace(0, 1, na)
    if nr < n: e[-nr:] *= np.exp(-curve * np.linspace(0, 1, nr))
    return e
def mtof(m): return 440 * 2 ** ((m - 69) / 12)
def saw(f, d, det=0.0):  # band-limited-ish saw via additive harmonics up to 8k
    t = t_(d); out = np.zeros_like(t); fr = f * (1 + det)
    for k in range(1, int(8000 / fr) + 1):
        out += np.sin(2 * np.pi * fr * k * t + k) / k
    return out * .6
def place(buf, x, at, gain=1.0, pan=0.0):
    i = int(at * SR);
    if i >= len(buf): return
    x = x[: len(buf) - i]
    if x.ndim == 1:
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        buf[i:i + len(x), 0] += x * gain * l * 1.414; buf[i:i + len(x), 1] += x * gain * r * 1.414
    else: buf[i:i + len(x)] += x * gain

def reverb(x, secs=2.5, mix=.3, damp=4000, seed=1):
    r = np.random.default_rng(seed); n = int(secs * SR)
    ir = r.standard_normal((n, 2)) * np.exp(-np.linspace(0, 6.5, n))[:, None]
    ir[:, 0] = lp(ir[:, 0], damp); ir[:, 1] = lp(ir[:, 1], damp); ir /= np.abs(ir).sum(0) ** .5 * 6
    if x.ndim == 1: x = np.stack([x, x], 1)
    wet = np.stack([signal.fftconvolve(x[:, c], ir[:, c])[: len(x)] for c in range(2)], 1)
    return x * (1 - mix) + wet * mix

# =============================================================== MUSIC
music = np.zeros((N, 2))
BPM = 96; BEAT = 60 / BPM
# chord plan (midi roots + chord tones) per section
D, F, Bb, C, G, A, Eb = 50, 53, 46, 48, 43, 45, 51
def chord(root, kind='m'):
    return [root, root + (3 if kind == 'm' else 4), root + 7, root + 12 + (3 if kind == 'm' else 4)] if kind in ('m', 'M') else \
           [root, root + 4, root + 7, root + 11] if kind == 'M7' else [root, root + 1, root + 7, root + 13]  # 'x' = tension cluster
SECTIONS = [  # start, end, chords (each 2 bars), energy
    (0.0, 8.7, [(D, 'm')], .45), (8.7, 16.75, [(D, 'm'), (Bb, 'M')], .55), (16.75, 37.4, [(D, 'm'), (Bb, 'M'), (F, 'M'), (C, 'M')], .75),
    (37.4, 52.0, [(Bb, 'M'), (F, 'M'), (C, 'M'), (D, 'm')], .8), (52.0, 61.6, [(D, 'm'), (C, 'M'), (Bb, 'M'), (A, 'M')], .85),
    (61.6, 74.7, [(Bb, 'M7'), (F, 'M'), (G, 'm'), (D, 'm')], .7), (74.7, 91.6, [(D, 'x'), (Eb, 'M'), (D, 'x'), (A, 'm')], .6),
    (91.6, 107.8, [(D, 'm'), (Bb, 'M'), (F, 'M'), (C, 'M')], .95), (107.8, 116.0, [(Bb, 'M7'), (F, 'M'), (C, 'M')], .6), (116.0, DUR + .5, [(D, 'm')], .5)]

def pad_note(m, d, bright=1200):
    x = sum(saw(mtof(m), d, det) for det in (-.004, 0, .005)) / 3
    x = lp(x, bright, 2); return x * env_adsr(len(x), a=min(1.2, d * .3), r=min(1.5, d * .4), curve=3)

for (s, e, chs, en) in SECTIONS:
    bar = 4 * BEAT; dur_ch = 2 * bar; t = s; k = 0
    while t < e - .05:
        root, kind = chs[k % len(chs)]; d = min(dur_ch, e - t) + .8
        notes = chord(root, kind)
        for j, m in enumerate(notes):
            place(music, pad_note(m, d, 900 + 900 * en), t, .055 * (1 if j else 1.2), pan=(-.5 + j / 3))
        # sub bass (sine) on root
        sb = np.sin(2 * np.pi * mtof(root - 24) * t_(d)) * env_adsr(int(d * SR), .3, .8)
        place(music, sb, t, .12 * en)
        t += dur_ch; k += 1

# rhythmic pulse: 8th-note filtered bass ostinato + 16th ticks, gated by section energy
def pulse_track():
    out = np.zeros((N, 2)); step = BEAT / 2
    for (s, e, chs, en) in SECTIONS:
        if en < .55: continue
        n0 = int(np.ceil(s / step)); n1 = int(e / step)
        for n in range(n0, n1):
            tt = n * step; bar_i = int((tt - s) / (8 * BEAT)); root, kind = chs[bar_i % len(chs)]
            m = root - 12 + (12 if n % 4 == 2 else 0)
            x = saw(mtof(m), .22); x = lp(x, 400 + 900 * en * (0.6 + .4 * np.sin(tt * .7) ** 2), 2) * env_adsr(len(x), .003, .18, 5)
            place(out, x, tt, .06 * en * (1.0 if n % 2 == 0 else .7))
            if en >= .75:  # ticks
                for q in range(2):
                    tk = hp(rng.standard_normal(int(.03 * SR)), 6000) * np.exp(-np.linspace(0, 9, int(.03 * SR)))
                    place(out, tk, tt + q * step / 2, .02 * en * (1 if q == 0 else .6), pan=.4 if q else -.4)
        # soft low thumps on beats in high-energy sections
        if en >= .8:
            for b in range(int(np.ceil(s / BEAT)), int(e / BEAT)):
                tt = b * BEAT; th = np.sin(2 * np.pi * (55 * np.exp(-t_(.35) * 9) + 38) * t_(.35)) * np.exp(-t_(.35) * 10)
                place(out, th, tt, .16 * (en - .6))
    return out
music += pulse_track()

# arpeggio plucks for Starlink / AI / VI sections
def pluck(m, d=.35):
    x = saw(mtof(m), d) * .5 + np.sin(2 * np.pi * mtof(m + 12) * t_(d)) * .3
    return lp(x, 2500) * np.exp(-t_(d) * 9)
for (s, e, rate) in [(37.6, 51.8, 4), (52.1, 61.4, 4), (61.7, 74.5, 2), (94.4, 107.6, 4), (108.0, 115.8, 2)]:
    step = BEAT / rate; sec = [x for x in SECTIONS if x[0] <= s < x[1]][0]
    for n in range(int(np.ceil(s / step)), int(e / step)):
        tt = n * step; bar_i = int((tt - sec[0]) / (8 * BEAT)); root, kind = sec[2][bar_i % len(sec[2])]
        notes = chord(root + 12, kind); m = notes[[0, 1, 2, 3, 2, 1][n % 6]] + (12 if n % 12 >= 6 else 0)
        place(music, pluck(m), tt, .03, pan=np.sin(n * .9) * .6)
# risk section: ticking clock + low dissonant drone
for b in range(int(77.6 / (BEAT / 2)), int(91.4 / (BEAT / 2))):
    tk = bp(rng.standard_normal(int(.02 * SR)), 2500, 5000) * np.exp(-np.linspace(0, 8, int(.02 * SR)))
    place(music, tk, b * BEAT / 2, .05, pan=.3 if b % 2 else -.3)
dr = (saw(mtof(26), 17) + saw(mtof(27), 17, .002)) * .5; dr = lp(dr, 300) * env_adsr(len(dr), 2, 2)
place(music, dr, 74.7, .08)
music = reverb(music, 3.2, .32, 5000, 3)
# final resolve: let music bloom under the end card
music *= np.clip(np.interp(np.arange(N) / SR, [0, .4, DUR - .6, DUR + .2], [0, 1, 1, 0]), 0, 1)[:, None]

# =============================================================== SFX
sfx = np.zeros((N, 2))
def impact(big=1.0):
    d = 3.0; t = t_(d)
    sub = np.sin(2 * np.pi * np.cumsum(40 + 60 * np.exp(-t * 6)) / SR) * np.exp(-t * (2.2 / big))
    nz = lp(rng.standard_normal(len(t)), 900) * np.exp(-t * 14)
    click = hp(rng.standard_normal(len(t)), 3000) * np.exp(-t * 60)
    return reverb(sub * .9 + nz * .5 + click * .25, 2.8, .35, 3000, 7)
def hit_soft():
    d = 1.2; t = t_(d); x = np.sin(2 * np.pi * np.cumsum(70 + 80 * np.exp(-t * 15)) / SR) * np.exp(-t * 7) + lp(rng.standard_normal(len(t)), 1500) * np.exp(-t * 25) * .4
    return reverb(x, 1.5, .25, 4000, 9)
def sweep_noise(d, f0, f1, bands=10):
    """smooth band sweep: overlapping fixed bandpass layers crossfaded along time (no filter-state clicks)"""
    t = t_(d); out = np.zeros(len(t)); u = t / d
    for k in range(bands):
        c = k / (bands - 1); f = f0 * (f1 / f0) ** c
        layer = bp(rng.standard_normal(len(t)), f / 1.4, min(f * 1.4, 21000))
        w = np.exp(-((u - c) ** 2) / (2 * (0.7 / bands) ** 2)); out += layer * w
    return out / np.sqrt(bands) * 2.2
def riser(d):
    t = t_(d); nz = sweep_noise(d, 300, 9000, 12)
    tone = np.sin(2 * np.pi * np.cumsum(120 * (8 ** (t / d))) / SR) * .25
    e = (t / d) ** 2.2
    return reverb((nz * .8 + tone) * e, 1.2, .3, 6000, 11)
def whoosh(d=.7, up=True):
    t = t_(d); x = sweep_noise(d, 400, 5000, 8) if up else sweep_noise(d, 5000, 400, 8)
    e = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2; x = x * e
    L = x * np.linspace(1, .3, len(x)); R = x * np.linspace(.3, 1, len(x))
    return np.stack([L, R], 1)
def blip(f=1800, d=.12):
    t = t_(d); return np.sin(2 * np.pi * f * t) * np.exp(-t * 40) + np.sin(2 * np.pi * f * 2.01 * t) * np.exp(-t * 60) * .3
def ping(f=1650):
    t = t_(1.6); x = np.sin(2 * np.pi * f * t) * np.exp(-t * 6)
    return reverb(x, 1.6, .5, 8000, 13)
def zap():
    t = t_(.25); return np.sin(2 * np.pi * np.cumsum(3200 * np.exp(-t * 14) + 600) / SR) * np.exp(-t * 14)
def tick(): return hp(rng.standard_normal(int(.012 * SR)), 2000) * np.exp(-np.linspace(0, 7, int(.012 * SR)))
def rumble(d, intensity=1.0, crackle=.4):
    t = t_(d); b = np.cumsum(rng.standard_normal(len(t))); b = hp(b, 20); b /= np.abs(b).max() + 1e-9
    x = lp(b, 220, 2) * 1.0 + lp(rng.standard_normal(len(t)), 1800) * .25
    cr = (rng.random(len(t)) < .002) * rng.standard_normal(len(t)); cr = bp(cr, 1500, 6000) * 4 * crackle
    e = np.clip(np.minimum(t / .25, (d - t) / .8), 0, 1)
    return reverb((x + cr) * e * intensity, 2.0, .3, 3000, 17)
def data_burst(d):
    t = t_(d); x = np.zeros(len(t)); n = int(d * 40)
    for k in range(n):
        i = int(rng.random() * (len(t) - 2000)); f = rng.choice([1200, 1600, 2400, 3200, 4800]); seg = np.sin(2 * np.pi * f * t_(.03)) * np.exp(-t_(.03) * 120)
        x[i:i + len(seg)] += seg * rng.random()
    return x * np.clip(np.minimum(t / .2, (d - t) / .3), 0, 1)
def hiss(d):
    t = t_(d); return hp(rng.standard_normal(len(t)), 3000) * np.clip(np.minimum(t / .05, (d - t) / .4), 0, 1) * np.exp(-t * 1.2)
def thud(): t = t_(.6); return np.sin(2 * np.pi * np.cumsum(50 + 40 * np.exp(-t * 20)) / SR) * np.exp(-t * 9) + lp(rng.standard_normal(len(t)), 600) * np.exp(-t * 18) * .5
def stamp(): return reverb(thud() * .8 + np.pad(hp(rng.standard_normal(int(.08 * SR)), 1500) * np.exp(-np.linspace(0, 10, int(.08 * SR))) * .4, (0, int(.52 * SR))), 1.0, .2, 4000, 19)

# impacts
for t0, g in [(0.02, .55), (8.85, .6), (20.55, .5), (31.45, .55), (37.45, .45), (52.05, .5), (63.06, .55), (74.75, .55), (82.1, .5), (91.7, .5), (102.25, .55), (107.85, .45), (115.95, .65)]:
    place(sfx, impact(), t0, g)
for t0 in [2.95, 12.2, 97.3, 98.5, 99.76, 117.55]: place(sfx, hit_soft(), t0, .35)
for t0 in [33.6, 81.3]: place(sfx, stamp(), t0, .5)
for end, d in [(8.75, 1.6), (20.55, 1.0), (37.45, 1.9), (63.06, 1.4), (91.6, 1.0), (107.8, 2.0), (115.95, 1.4), (102.25, 1.4)]:
    place(sfx, riser(d), end - d, .18)
for t0 in [8.5, 16.5, 20.3, 26.3, 34.7, 51.8, 61.3, 74.5, 91.3, 107.45, 115.7]: place(sfx, whoosh(.6 + .2 * rng.random(), up=bool(rng.random() < .5)), t0, .22)
for t0 in [1.25, 3.66, 17.3, 28.15, 39.6, 54.5, 61.7, 76.15, 85.1, 92.8, 104.5]: place(sfx, whoosh(.45, True), t0, .1)
# rockets
place(sfx, lp(rumble(5.6, .5, .1), 400), 0.3, .25)
place(sfx, rumble(2.3, 1.0, .6), 22.4, .5)
place(sfx, impact() * .5, 22.45, .3)
place(sfx, hiss(.6), 24.2, .12, pan=.3); place(sfx, thud(), 24.2, .25)
place(sfx, rumble(1.0, .8, .4), 25.3, .35)
place(sfx, thud(), 26.22, .45)
place(sfx, rumble(2.6, .6, .3), 35.0, .22)
# UI / data
for t0 in [9.75, 19.3, 19.44, 19.58, 29.1, 39.6, 42.6, 43.4, 45.0, 46.75, 48.6, 49.7, 49.85, 54.5, 55.6, 65.0, 65.4, 65.9, 67.5, 70.9, 72.5, 85.4, 87.5, 89.8, 94.3, 95.6, 104.5, 117.9, 118.6]:
    place(sfx, blip(rng.choice([1500, 1800, 2200, 2600])), t0, .12, pan=rng.uniform(-.5, .5))
for t0 in [77.72, 78.46, 79.28, 80.16]: place(sfx, blip(900, .2), t0, .18); place(sfx, hit_soft(), t0, .15)
for a, b, rate in [(30.4, 31.2, 22), (31.45, 32.2, 22), (41.9, 42.9, 25), (82.6, 84.2, 14)]:
    for k in range(int((b - a) * rate)): place(sfx, tick(), a + k / rate * (1 + .3 * k / ((b - a) * rate)) , .12, pan=.2)
for t0 in [3.7, 5.6, 6.2, 41.9, 42.5, 43.3, 44.0, 108.5]: place(sfx, ping(rng.choice([1400, 1650, 1900])), t0, .1, pan=rng.uniform(-.6, .6))
for t0 in [5.7, 42.4, 42.8, 43.2, 67.4, 67.7, 68.0]: place(sfx, zap(), t0, .08, pan=rng.uniform(-.7, .7))
place(sfx, data_burst(3.4), 54.2, .07); place(sfx, data_burst(3.9), 70.3, .07); place(sfx, data_burst(1.0), 78.46, .06)
place(sfx, hiss(1.2) * .5, 77.72, .08)
g = np.sin(2 * np.pi * np.cumsum(np.linspace(200, 900, int(1.7 * SR))) / SR) * np.linspace(0, 1, int(1.7 * SR)) * .3; place(sfx, g, 82.6, .06)
# deep space ambience bed
amb = lp(rng.standard_normal(N), 160, 2) * .6 + lp(rng.standard_normal(N), 90, 2); amb /= np.abs(amb).max()
sfx[:, 0] += amb * .05; sfx[:, 1] += np.roll(amb, 2400) * .05

# =============================================================== MIX
vo_path, out = sys.argv[1], sys.argv[2]
vo = read_wav(vo_path); vo = np.pad(vo, (0, max(0, N - len(vo))))[:N]
vo = hp(vo, 70, 2)
# sidechain ducking envelope from voice
a = np.abs(vo); win = int(.03 * SR); rms = np.sqrt(np.convolve(a ** 2, np.ones(win) / win, 'same'))
envd = np.zeros_like(rms); att, rel = np.exp(-1 / (.02 * SR)), np.exp(-1 / (.35 * SR)); y = 0.0
rr = rms.astype(np.float64)
# vectorised-ish one-pole follower in blocks
blk = 240; vals = rr.reshape(-1, blk).max(1) if len(rr) % blk == 0 else np.pad(rr, (0, blk - len(rr) % blk)).reshape(-1, blk).max(1)
ev = np.zeros_like(vals); y = 0; aa, rl = np.exp(-blk / (.02 * SR)), np.exp(-blk / (.4 * SR))
for i, v_ in enumerate(vals): y = v_ + (y - v_) * (aa if v_ > y else rl); ev[i] = y
envd = np.repeat(ev, blk)[:N]
duck = 1 - .6 * np.clip(envd / .05, 0, 1)
mus = music * duck[:, None] * 1.7
mix = mus + sfx * .85 + np.stack([vo, vo], 1) * 1.0
write_wav(out.replace('.wav', '_music.wav'), music * .5); write_wav(out.replace('.wav', '_sfx.wav'), sfx * .5)
peak = np.abs(mix).max(); mix = mix / max(peak, 1e-9) * .89
write_wav(out, mix[: int(DUR * SR)])
print('peak before norm', peak)
