// Field rules for each editable table. Every write goes through clean() so only known fields reach SQL.
import { str, idOrNull, dateOrNull, oneOf } from './api';

export const COLORS = ['red', 'blue', 'green', 'amber', 'violet', 'grey'];
export const STATUSES = ['active', 'inactive', 'alumni'];
export const PROJECT_TYPES = ['shoot', 'event', 'content', 'other'];
export const PROJECT_STATUSES = ['planned', 'in_progress', 'done', 'cancelled'];

const skills = (v) =>
  Array.isArray(v) ? [...new Set(v.map((x) => str(x, 40)).filter(Boolean))].slice(0, 20) : [];
const crew = (v) =>
  Array.isArray(v)
    ? v
        .map((c) => ({ person_id: idOrNull(c && c.person_id), role: str(c && c.role, 60) }))
        .filter((c) => c.person_id)
        .slice(0, 60)
    : [];

export const ENTITIES = {
  people: {
    table: 'os_people',
    order: 'name ASC',
    fields: {
      name: (v) => str(v, 80),
      role: (v) => str(v, 80),
      team_id: idOrNull,
      reports_to: idOrNull,
      phone: (v) => str(v, 30),
      email: (v) => str(v, 120),
      campus: (v) => str(v, 120),
      skills,
      status: (v) => oneOf(v, STATUSES, 'active'),
      joined: dateOrNull,
      notes: (v) => str(v, 2000),
    },
    required: 'name',
  },
  teams: {
    table: 'os_teams',
    order: 'name ASC',
    fields: {
      name: (v) => str(v, 80),
      description: (v) => str(v, 600),
      lead_id: idOrNull,
      parent_id: idOrNull,
      color: (v) => oneOf(v, COLORS, 'red'),
    },
    required: 'name',
  },
  projects: {
    table: 'os_projects',
    order: 'date ASC NULLS LAST, name ASC',
    fields: {
      name: (v) => str(v, 120),
      type: (v) => oneOf(v, PROJECT_TYPES, 'shoot'),
      date: dateOrNull,
      location: (v) => str(v, 160),
      status: (v) => oneOf(v, PROJECT_STATUSES, 'planned'),
      lead_id: idOrNull,
      team_id: idOrNull,
      crew: (v) => JSON.stringify(crew(v)),
      notes: (v) => str(v, 3000),
    },
    required: 'name',
  },
};

// Picks known fields from input. partial=true keeps only fields present in input.
export function clean(kind, input, partial) {
  const spec = ENTITIES[kind];
  const out = {};
  for (const [k, fn] of Object.entries(spec.fields)) {
    if (partial && !(k in input)) continue;
    out[k] = fn(input[k]);
  }
  return out;
}
