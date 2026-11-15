# Cinematy @ MU · Content Unit form

Live: **https://cinematy-mu.vercel.app** · Team directory: **https://cinematy-mu.vercel.app/admin**

- `/`: the public application form (brand: ink on paper, Instrument Serif / Geist / Geist Mono, laurel logo).
- `/admin`: password-protected team directory:
  - status tabs with counts (New / Contacted / In the unit / Not now)
  - search (name, number, programme, notes, @instagram), role chips, *More filters* (residence, stays back, weekends, and gender / playing age / language for actors), sort
  - cards or table view (remembered per device)
  - click anyone for a detail panel: Call, WhatsApp (pre-written intro message), copy number, one-tap status, team notes, delete
  - export exactly what's filtered to CSV; ↻ Refresh to pull new applications

## Where data lives
A **private** Vercel Blob store, `cinematy-mu-applicants` (team `cin16`, region sin1), connected to the Vercel project `cinematy-mu`.
Nothing is publicly readable; only the server (with `BLOB_READ_WRITE_TOKEN`) can read it.

## Settings (Vercel → cinematy-mu → Settings → Environment Variables)
| Variable | What |
|---|---|
| `ADMIN_PASSWORD` | The shared team password for `/admin`. Change it here, then redeploy. |
| `SESSION_SECRET` | Signs admin login cookies. Changing it signs everyone out. |
| `BLOB_READ_WRITE_TOKEN` | Added automatically by the Blob store connection. |

## Local development
```bash
npm install
ADMIN_PASSWORD=dev npm run dev
```
Without `BLOB_READ_WRITE_TOKEN`, applications are saved to `.data/` on disk.

## Deploy
```bash
npx vercel deploy --prod
```
