# Cinematy @ MU · Content Unit form

Live: **https://cinematy-mu.vercel.app** · Team directory: **https://cinematy-mu.vercel.app/admin**

- `/`: the public application form (brand: ink on paper, Instrument Serif / Geist / Geist Mono, laurel logo). Roles: Writing, Directing, Acting, Editing, Shooting, Shoot management, Line production, Planning, Other. The role list lives in `lib/schema.js` (`ROLES`); the form, validation, admin filters and CSV all read from it.
- `/admin`: password-protected team directory:
  - status tabs with counts (New / Contacted / In the unit / Not now)
  - search (name, number, programme, notes, @instagram), role chips, *More filters* (residence, stays back, weekends, and gender / playing age / language for actors), sort
  - cards or table view (remembered per device)
  - click anyone for a detail panel: Call, WhatsApp (pre-written intro message), copy number, one-tap status, team notes, delete
  - export exactly what's filtered to CSV; ↻ Refresh to pull new applications

## Where data lives
Neon Postgres database `cinematy-forms-db` (Vercel Marketplace, free plan, region sin1), table `mu_applications`, shared with the other Cinematy form but in its own table. The waitlist (cinematy.in) uses a separate database and is not touched.
The table is created automatically on first use. Applications submitted before 20 Nov 2026 were copied from the old private Blob store `cinematy-mu-applicants` (kept as a read-only backup) with `POST /api/admin/migrate`, which is idempotent.

## Settings (Vercel → cinematy-mu → Settings → Environment Variables)
| Variable | What |
|---|---|
| `ADMIN_PASSWORD` | The shared team password for `/admin`. Change it here, then redeploy. |
| `SESSION_SECRET` | Signs admin login cookies. Changing it signs everyone out. |
| `DATABASE_URL` | Added automatically by the Neon store connection. (`BLOB_READ_WRITE_TOKEN` is only used by the one-time migrate route.) |

## Local development
```bash
npm install
ADMIN_PASSWORD=dev npm run dev
```
Set `DATABASE_URL` to any Postgres (e.g. a Neon dev branch) to run locally.

## Deploy
```bash
npx vercel deploy --prod
```
