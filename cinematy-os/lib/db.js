// Neon Postgres access. DATABASE_URL is added by the Vercel Neon integration.
import { neon } from '@neondatabase/serverless';

let _sql;
let _ready;
const sql = () => {
  if (!_sql) _sql = neon(process.env.DATABASE_URL);
  return _sql;
};

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS os_users (
     id uuid PRIMARY KEY, username text UNIQUE NOT NULL, name text NOT NULL,
     pass_hash text NOT NULL, is_founder boolean NOT NULL DEFAULT false,
     must_change boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now())`,
  `CREATE TABLE IF NOT EXISTS os_people (
     id uuid PRIMARY KEY, name text NOT NULL, role text NOT NULL DEFAULT '', team_id uuid,
     reports_to uuid, phone text NOT NULL DEFAULT '', email text NOT NULL DEFAULT '',
     campus text NOT NULL DEFAULT '', skills text[] NOT NULL DEFAULT '{}',
     status text NOT NULL DEFAULT 'active', joined date, notes text NOT NULL DEFAULT '',
     updated_at timestamptz NOT NULL DEFAULT now(), updated_by text NOT NULL DEFAULT '')`,
  `CREATE TABLE IF NOT EXISTS os_teams (
     id uuid PRIMARY KEY, name text NOT NULL, description text NOT NULL DEFAULT '',
     lead_id uuid, parent_id uuid, color text NOT NULL DEFAULT 'red',
     updated_at timestamptz NOT NULL DEFAULT now(), updated_by text NOT NULL DEFAULT '')`,
  `CREATE TABLE IF NOT EXISTS os_boards (
     id uuid PRIMARY KEY, name text NOT NULL, description text NOT NULL DEFAULT '',
     kind text NOT NULL DEFAULT 'blank', team_id uuid, data jsonb NOT NULL DEFAULT '{}'::jsonb,
     editing_by text NOT NULL DEFAULT '', editing_at timestamptz,
     updated_at timestamptz NOT NULL DEFAULT now(), updated_by text NOT NULL DEFAULT '')`,
  `CREATE TABLE IF NOT EXISTS os_projects (
     id uuid PRIMARY KEY, name text NOT NULL, type text NOT NULL DEFAULT 'shoot', date date,
     location text NOT NULL DEFAULT '', status text NOT NULL DEFAULT 'planned', lead_id uuid,
     team_id uuid, crew jsonb NOT NULL DEFAULT '[]'::jsonb, notes text NOT NULL DEFAULT '',
     updated_at timestamptz NOT NULL DEFAULT now(), updated_by text NOT NULL DEFAULT '')`,
];

export async function q(text, params = []) {
  if (!_ready) {
    _ready = (async () => {
      for (const s of SCHEMA) await sql().query(s);
    })().catch((e) => {
      _ready = undefined;
      throw e;
    });
  }
  await _ready;
  return sql().query(text, params);
}
