# Cinematy: Project Context

Everything a new Claude conversation needs to know about Cinematy, as of 24 Nov 2026. Upload this file to the Claude Project's knowledge.

---

## 1. What Cinematy is

- **Cinematy** is a community for student filmmakers and film lovers in **Hyderabad**, backed by a web app.
- **Core idea:** help people *find their crew*. Writers, directors, actors, DOPs, editors, sound and more connect, collaborate, make films and screen them.
- **Product (web app):** feed and posts, discover, crewing board (find and fill crew roles), projects, screening room, events, festivals, and verified credits.
- **Audience:** primarily college students and student filmmakers, plus film enthusiasts and working creators in Hyderabad.
- **Tagline / recurring lines:** "Find your crew." · "Cinematy for writers, directors, editors, filmmakers…" · "How life sounds when you find your crew." · "Coming soon. Join the waitlist."
- **Status:** pre-launch, with a waitlist open at cinematy.in.

## 2. People

| Person | Role |
|---|---|
| **Shanmukh Dhusetty** | Founder (business, strategy, writer, entrepreneur) |
| **Raagin** | Co-founder (actor, filmmaker, "the chemistry") |
| **Sahaj** | Spokesperson. **Not** a founder; never list him as one. |
| **Sanhitha Reddy** | Lead, Cinematy MU Content Unit |
| **Kyati** | Coordinates and evaluates unit recruits with Sanhitha |
| **Hasini, Bhanu** | Call applicants and share venue and shoot timings |

Founders' intro framing: Shanmukh is "the brain" (business, strategy) and Raagin is "the heart" (chemistry, story). Line used: "Strategy, meet story."

## 3. Teams and structure

- **Cinematy Hyderabad:** the city-wide core team.
- **Campus teams:** teams at universities and colleges, run by campus leads.
- **Cinematy MU Content Unit:** the team at Mahindra University (MU). Writers, directors, actors, DOPs, editors, shoot managers, line producers and planners. It is **pro bono** (unpaid, not a hiring call).

## 4. Links and where things live

| What | Link | Hosted on |
|---|---|---|
| Waitlist site | cinematy.in (admin at /admin) | Vercel project `cinematy-in` |
| Platform demo v1 | cinematy.vercel.app | Not in our Vercel account; owner unconfirmed |
| Platform demo v2 (current) | cinematy-app.vercel.app | Vercel project `cinematy-app` |
| MU Content Unit form | cinematy-mu.vercel.app (admin at /admin) | Vercel project `cinematy-mu` |
| Cinematy Hyderabad form (core team + campus leads) | cinematy-join.vercel.app (admin at /admin) | Vercel project `cinematy-join` |
| Links & Access doc (has admin passwords) | https://claude.ai/artifact/DiYdsVnzYPRHPsa97tydXp | Claude Docs |
| Founding Partner pitch doc | https://claude.ai/artifact/Ex2EycZTrXFqtHMjrupME1 | Claude Docs |

- **Vercel:** account `hellocinematy`, team `cin16`. Projects are deployed from the command line and are not connected to GitHub.
- **GitHub:** repo `gurushanmukhdhusetty-pixel/claude`, branch `claude/gifted-euler-ynrds3`. Holds the form code, launch films, reels, carousels, posters, briefing and pitch.
- **Databases:**
  - The MU and Hyderabad forms use Neon Postgres `cinematy-forms-db`, with tables `mu_applications` and `join_applications`. They moved off Vercel Blob in Nov 2026 with no data lost; the old Blob stores are kept as a read-only backup.
  - The waitlist has its own **separate** database (`cinematy-waitlist`). **Never touch the waitlist database or its code.**
- **Admin passwords** are in the Links & Access doc. Don't paste them into chats or this file.

## 5. Brand guidelines

- **Colours:** black `#000` and white `#fff`, greys (`#6B6B6B`, `#E8E8E8`), and a single red accent `#D92D20`.
- **Fonts:**
  - **Instrument Serif:** headlines, often with an *italic* word.
  - **Geist:** body text.
  - **Geist Mono:** uppercase labels and kickers with wide letter-spacing.
- **Logo:** a laurel wreath with "CINEMATY / HYDERABAD". The source file is `launch-video/assets/logo.svg`.
- **QR code:** points to cinematy.in. The source file is `launch-video/assets/qr.svg`.
- **Look:** minimal, cinematic, film-strip perforations, slate-style info boxes.
- **Videos:** a slightly faded, warm-highlight and cool-shadow grade with film grain and a soft vignette.
- **Exception:** the GTA-6-style carousel used sunset gradients and the Anton font, as a one-off.

## 6. How Shanmukh likes things done

**Tone and writing**
- Casual, student-friendly, simple words.
- Write "better", not longer. Short options first, then expand if asked.

**WhatsApp messages**
- Plain text only, with WhatsApp *bold* and _italics_.
- No code blocks: copying the fences breaks the formatting.

**Videos**
- No AI-generated footage or images. Use motion graphics and real footage only.
- Always **beat-sync** cuts to the music.
- **Never repeat the same clip** in an edit.
- Don't change the clip order unless asked.
- Captions go at the **bottom** of the frame, above Instagram's UI.
- Music only (no dialogue) unless asked to keep dialogue. When dialogue is kept, dip the music only lightly underneath it.
- Compress without visible quality loss. HEVC (H.265) at a capped bitrate works well.
- Deliver vertical 9:16 for Reels and horizontal 16:9 when asked.

**Documents**
- Founder-only docs use the Cinematy-designed PDF style.
- Internal docs are bare minimum: no checklists unless asked, no descriptions under titles.

**Instagram captions**
- 3–5 hashtags, a keyword block, and a music credit line.

## 7. Money

- **Monthly spend:** about ₹50,000 for the whole organisation.
- **Fundraising targets (earlier roadmap):**
  - minimum ₹2.5 lakh, optimal ₹3 lakh
  - the fundraising process should not depend on the founders being personally involved
- **Revenue drivers to build:** events (ticketed screenings, workshops, festivals) and subscriptions (premium membership).

**Current raise: the Founding Partner pitch**
- **The ask:** ₹4,00,000 from **one production company** for launch plus 6 months of runway.
- **The deal:**
  - no equity
  - internally, a **6-month sponsorship**, renewable
  - publicly, "Cinematy, backed by [Company]"; never call them investors
- **What the partner gets:**
  - crewing support for their shoots
  - talent scouting and casting help
  - promotion of their films
  - first look at talent and stories
  - brand presence
  - masterclass, judging and screening slots
  - **priority** access (not exclusivity)
- **Payment:** ₹2.5 lakh at signing, ₹1.5 lakh at month 3 once milestones are hit.
- **Renewal:** at month 6, review results; the partner gets first right to renew.

## 8. What has been made so far (in the repo)

**Launch films (motion graphics, beat-synced, end on the QR code and cinematy.in)**
- *Alors on danse* version: 2:30 long, with a 9:16 cut.
- *Aane Wala Star* version.
- *Thaalam Trip* version.
- All three include the "Cinematy for ___" sequence.

**Reels**
- Founders intro reel: horizontal. Raagin appears first, Shanmukh comes in on the drop, and it ends on "Lights. Camera. Cinematy."
- BTS reel to *Udd Gaye* (Ritviz), 2:20–2:42, in 9:16 and 16:9. Caption: "how life sounds / when you find your crew." Plus standalone end-card clips.
- Team edit with dialogue in two versions:
  - *Udd Gaye*: "Coming soon" lands on the 2:20.78 downbeat. The song that was baked into the clips' own audio was removed.
  - *ENE Repeat* (Vivek Sagar).

**Carousels**
- "Why 24fps": infotainment.
- "Aspect ratios": v3, written for both a general and a filmmaker audience.
- "Character Select": GTA-6-style, 6 roles (Writer, Director, Actor, DOP, Editor, Sound Recordist).

**Documents**
- Waitlist QR poster (horizontal).
- MU Unit briefing PDF (what Cinematy is, what the unit is, what members do, unit lead contact).
- Launch roadmap PDF (founders only).
- Founding Partner pitch (PDF and doc).

**Forms**
- Two forms with admin directories: MU Content Unit and Cinematy Hyderabad.
- The Hyderabad form has a non-student path and no MU references.

## 9. Recurring copy to reuse

- "You probably might've heard of us. Know more at cinematy.in / instagram.com/…"
- "Wanna be part of this cool crew? 👀 / Apply with the link in bio"
- "Now recruiting for the Cinematy Hyderabad core team and for campus teams across universities and colleges in the city."
- Instagram hashtags: #Cinematy #CinematyHyderabad #HyderabadFilmmakers #StudentFilmmakers #FindYourCrew
- Keyword block: filmmakers Hyderabad · student filmmakers · actors · writers · directors · editors · DOP · film crew · short films · campus film club · casting call Hyderabad

## 10. Competitors (for positioning)

- **Cinic** and **Stud** are the comparisons that came up.
- Cinematy's angle: it's local (Hyderabad), **community first with a web app behind it**, focused on students and crewing (finding collaborators), with verified credits, and it puts screenings and events at the centre.
