# THE BIG BREAKDOWN — series visual system

Reusable across every episode (conglomerates, acquisitions, market strategy, tech companies).
All primitives live in `brand.js` (2D) and `engine3d.js` (3D); episodes only write scenes.

## Identity
| Element | Spec |
|---|---|
| Canvas | 1080 × 1920, 30 fps, deterministic `render(t)` (voice-over time is the master clock) |
| Background | `#050506` black → `#0c0d0f` charcoal radial, faint 90 px technical grid with registration crosses |
| Type — display | Inter Tight 800/900, uppercase, tight tracking (-2 to -6) |
| Type — HUD/data | JetBrains Mono 500/700, uppercase, +2 tracking |
| Colour | White `#F3F3F0`, dim `#8A8D93`, signal red `#E5252A` (one red idea per frame) |
| Logo | "THE BIG / BREAKDOWN" stacked; BREAKDOWN is **sliced** horizontally — halves shear apart and a red bar sits in the cut. `BB.logo()` animates it (`p` 0→1). |
| Episode tag | Red block, mono: `EPISODE 01` (`BB.tag`) |
| Persistent HUD | Top-left red square + `THE BIG BREAKDOWN EP nn`, top-right section name, timecode (`BB.hud`) |
| Chapter cards | Outlined numeral, red rule, `SECTION nn / nn`, masked title (`BB.chapter`) |
| Subtitles | Inter Tight 800, 58 px, uppercase, phrase chunks ≤ 4 words, word-level pop, upcoming words at 32 % white, keywords in red, centred at y = 1405 (`BB.buildSubs`, `BB.subs`) |
| Transitions | red slash wipe (L/R), iris with red ring, zoom-through, white flash, and the signature **split cut** (frame slices along the horizontal, halves slide apart) |
| Finish | Vignette + overlay film grain (`BB.post`) |

## Safe zones (Instagram Reels)
Top 170 px and bottom 360 px are covered by UI; keep key content in x 80–1000, y 170–1560.
Subtitles sit at y ≈ 1405, above the caption/action area.

## Closing frame (every episode)
Logo → red `FOLLOW FOR MORE` block → creator handle (smaller than the series title) → comment prompt.

## Audio language
Original synthesised score at 96 BPM in D minor; energy follows the narration's sections.
Impacts on chapter cards, risers into every major reveal, whooshes on every transition,
UI blips on HUD panels. Music is side-chain ducked under the voice; final master at −14 LUFS, −1.5 dBTP.
