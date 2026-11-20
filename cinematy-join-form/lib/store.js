// Storage for applications.
// Production: a PRIVATE Vercel Blob store (BLOB_READ_WRITE_TOKEN is set when the store is connected).
// Local development: JSON files under .data/ (no token needed).
import { createHash, randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
const LOCAL_DIR = path.join(process.cwd(), '.data');

async function blobApi() {
  return await import('@vercel/blob');
}

async function readText(pathname) {
  if (useBlob) {
    const { get } = await blobApi();
    const res = await get(pathname, { access: 'private', useCache: false });
    if (!res || res.statusCode !== 200) return null;
    return await new Response(res.stream).text();
  }
  try {
    return await fs.readFile(path.join(LOCAL_DIR, pathname), 'utf8');
  } catch {
    return null;
  }
}

async function writeJSON(pathname, data, { overwrite = true } = {}) {
  const body = JSON.stringify(data);
  if (useBlob) {
    const { put } = await blobApi();
    await put(pathname, body, {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: overwrite,
      contentType: 'application/json',
    });
    return;
  }
  const file = path.join(LOCAL_DIR, pathname);
  await fs.mkdir(path.dirname(file), { recursive: true });
  if (!overwrite) {
    try {
      await fs.writeFile(file, body, { flag: 'wx' });
    } catch (e) {
      if (e.code === 'EEXIST') throw Object.assign(new Error('exists'), { exists: true });
      throw e;
    }
    return;
  }
  await fs.writeFile(file, body);
}

async function remove(pathnames) {
  if (useBlob) {
    const { del } = await blobApi();
    await del(pathnames);
    return;
  }
  await Promise.all(pathnames.map((n) => fs.rm(path.join(LOCAL_DIR, n), { force: true })));
}

async function listPathnames(prefix) {
  if (useBlob) {
    const { list } = await blobApi();
    const out = [];
    let cursor;
    do {
      const r = await list({ prefix, cursor, limit: 1000 });
      out.push(...r.blobs.map((b) => b.pathname));
      cursor = r.hasMore ? r.cursor : undefined;
    } while (cursor);
    return out;
  }
  try {
    const dir = path.join(LOCAL_DIR, prefix);
    return (await fs.readdir(dir)).map((f) => prefix + f);
  } catch {
    return [];
  }
}

export const phoneKey = (phone) => createHash('sha256').update('cinematy-join:' + phone).digest('hex').slice(0, 40);

// Saves an application. Returns { ok: true, id } or { duplicate: true }.
export async function saveApplication(data) {
  const id = randomUUID();
  try {
    await writeJSON(`index/${phoneKey(data.phone)}.json`, { id }, { overwrite: false });
  } catch (e) {
    const msg = String(e && (e.message || e));
    if (e.exists || /already exists|exists/i.test(msg)) return { duplicate: true };
    throw e;
  }
  const record = { id, createdAt: new Date().toISOString(), ...data };
  await writeJSON(`applicants/${id}.json`, record, { overwrite: false });
  return { ok: true, id };
}

const DEFAULT_META = { status: 'new', notes: '', updatedAt: null };

export async function getMeta(id) {
  const t = await readText(`meta/${id}.json`);
  return t ? { ...DEFAULT_META, ...JSON.parse(t) } : { ...DEFAULT_META };
}

export async function setMeta(id, meta) {
  const exists = await readText(`applicants/${id}.json`);
  if (!exists) return false;
  await writeJSON(`meta/${id}.json`, { ...meta, updatedAt: new Date().toISOString() });
  return true;
}

export async function listApplications() {
  const names = await listPathnames('applicants/');
  const rows = await Promise.all(
    names.map(async (n) => {
      const t = await readText(n);
      if (!t) return null;
      const a = JSON.parse(t);
      return { ...a, meta: await getMeta(a.id) };
    })
  );
  return rows.filter(Boolean).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function deleteApplication(id) {
  const t = await readText(`applicants/${id}.json`);
  if (!t) return false;
  const a = JSON.parse(t);
  await remove([`applicants/${id}.json`, `meta/${id}.json`, `index/${phoneKey(a.phone)}.json`]);
  return true;
}
