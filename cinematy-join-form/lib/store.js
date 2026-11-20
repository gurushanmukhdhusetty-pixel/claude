// Storage for applications: Neon Postgres (DATABASE_URL is set by the Vercel integration).
// One row per applicant; the full form answers live in a JSONB column.
import { randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';

export const TABLE = 'join_applications';
let _sql;
let _ready;
function db() {
  if (!_sql) _sql = neon(process.env.DATABASE_URL);
  return _sql;
}

async function ready() {
  if (!_ready) {
    _ready = db().query(`CREATE TABLE IF NOT EXISTS ${TABLE} (
      id uuid PRIMARY KEY,
      created_at timestamptz NOT NULL DEFAULT now(),
      phone text NOT NULL UNIQUE,
      data jsonb NOT NULL,
      status text NOT NULL DEFAULT 'new',
      notes text NOT NULL DEFAULT '',
      meta_updated_at timestamptz
    )`).catch((e) => { _ready = undefined; throw e; });
  }
  return _ready;
}

export async function q(text, params = []) {
  await ready();
  return db().query(text, params);
}

const toRow = (r) => ({
  ...r.data,
  id: r.id,
  createdAt: new Date(r.created_at).toISOString(),
  meta: { status: r.status, notes: r.notes, updatedAt: r.meta_updated_at ? new Date(r.meta_updated_at).toISOString() : null },
});

// Saves an application. Returns { ok: true, id } or { duplicate: true }.
export async function saveApplication(data) {
  const id = randomUUID();
  const rows = await q(
    `INSERT INTO ${TABLE} (id, phone, data) VALUES ($1, $2, $3::jsonb) ON CONFLICT (phone) DO NOTHING RETURNING id`,
    [id, data.phone, JSON.stringify(data)]
  );
  return rows.length ? { ok: true, id } : { duplicate: true };
}

export async function setMeta(id, meta) {
  const rows = await q(
    `UPDATE ${TABLE} SET status = $2, notes = $3, meta_updated_at = now() WHERE id = $1 RETURNING id`,
    [id, meta.status, meta.notes || '']
  );
  return rows.length > 0;
}

export async function listApplications() {
  const rows = await q(`SELECT * FROM ${TABLE} ORDER BY created_at DESC`);
  return rows.map(toRow);
}

export async function deleteApplication(id) {
  const rows = await q(`DELETE FROM ${TABLE} WHERE id = $1 RETURNING id`, [id]);
  return rows.length > 0;
}
