// Shared form options and server-side validation.
export const ROLES = ['Writing', 'Directing', 'Acting', 'Editing', 'Shooting', 'Shoot management', 'Line production', 'Planning', 'Other'];
export const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer to self-describe'];
export const PLAYING_AGES = ['16–20', '20–25', '25–30', '30–40', '40+'];
export const LANGUAGES = ['Telugu', 'Hindi', 'English', 'Other'];
export const RESIDENCE = ['Day scholar', 'Hosteller'];
export const YES_SOMETIMES_NO = ['Yes', 'Sometimes', 'No'];
export const STATUSES = [
  ['new', 'New'],
  ['contacted', 'Contacted'],
  ['unit', 'In the unit'],
  ['notnow', 'Not now'],
];

const str = (v, max = 300) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const arr = (v, allowed) => (Array.isArray(v) ? [...new Set(v.filter((x) => allowed.includes(x)))] : []);

export function normalizePhone(v) {
  let d = String(v || '').replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? d : null;
}

export function normalizeUrl(v) {
  const s = str(v, 500);
  if (!s) return '';
  try {
    const u = new URL(/^https?:\/\//i.test(s) ? s : 'https://' + s);
    if (!u.hostname.includes('.')) return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function normalizeInstagram(v) {
  const s = str(v, 200);
  if (!s) return '';
  const m = s.match(/instagram\.com\/([A-Za-z0-9._]+)/i);
  const handle = (m ? m[1] : s).replace(/^@/, '');
  return /^[A-Za-z0-9._]{1,30}$/.test(handle) ? handle : null;
}

export function isDriveUrl(u) {
  try {
    const h = new URL(u).hostname;
    return /(^|\.)drive\.google\.com$|(^|\.)docs\.google\.com$|(^|\.)photos\.google\.com$|(^|\.)photos\.app\.goo\.gl$/.test(h);
  } catch {
    return false;
  }
}

// Returns { data } or { errors: {field: message} }
export function validate(input) {
  const e = {};
  const d = {};
  d.name = str(input.name, 120);
  if (d.name.length < 2) e.name = 'Tell us your name.';

  d.phone = normalizePhone(input.phone);
  if (!d.phone) e.phone = 'Enter a 10-digit Indian mobile number.';

  d.programme = str(input.programme, 120);
  if (!d.programme) e.programme = 'Add your year and programme.';

  d.roles = arr(input.roles, ROLES);
  if (!d.roles.length) e.roles = 'Pick at least one.';
  d.roleOther = d.roles.includes('Other') ? str(input.roleOther, 80) : '';
  if (d.roles.includes('Other') && !d.roleOther) e.roleOther = 'Tell us what else you do.';

  d.workLink = normalizeUrl(input.workLink);
  if (d.workLink === null) e.workLink = 'That link doesn’t look right.';

  d.about = str(input.about, 600);

  if (d.roles.includes('Acting')) {
    const a = input.actor || {};
    const actor = {};
    actor.gender = GENDERS.includes(a.gender) ? a.gender : '';
    if (!actor.gender) e['actor.gender'] = 'Pick one.';
    actor.genderSelf = actor.gender === 'Prefer to self-describe' ? str(a.genderSelf, 60) : '';
    actor.playingAge = PLAYING_AGES.includes(a.playingAge) ? a.playingAge : '';
    if (!actor.playingAge) e['actor.playingAge'] = 'Pick one.';
    actor.height = str(a.height, 20);
    actor.languages = arr(a.languages, LANGUAGES);
    if (!actor.languages.length) e['actor.languages'] = 'Pick at least one.';
    actor.languageOther = actor.languages.includes('Other') ? str(a.languageOther, 60) : '';
    actor.instagram = normalizeInstagram(a.instagram);
    if (actor.instagram === null) e['actor.instagram'] = 'Enter a valid Instagram handle.';
    actor.photosLink = normalizeUrl(a.photosLink);
    if (actor.photosLink === null) e['actor.photosLink'] = 'That link doesn’t look right.';
    else if (actor.photosLink && !isDriveUrl(actor.photosLink)) e['actor.photosLink'] = 'Use a Google Drive or Google Photos link.';
    if (!actor.instagram && !actor.photosLink && !e['actor.instagram'] && !e['actor.photosLink'])
      e['actor.photos'] = 'Add your Instagram (with photos of you) or a Google Drive link with a few angles.';
    d.actor = actor;
  } else d.actor = null;

  d.residence = RESIDENCE.includes(input.residence) ? input.residence : '';
  if (!d.residence) e.residence = 'Pick one.';
  d.stayBack = d.residence === 'Day scholar' && YES_SOMETIMES_NO.includes(input.stayBack) ? input.stayBack : '';
  if (d.residence === 'Day scholar' && !d.stayBack) e.stayBack = 'Pick one.';
  d.weekends = YES_SOMETIMES_NO.includes(input.weekends) ? input.weekends : '';
  if (!d.weekends) e.weekends = 'Pick one.';

  if (input.proBono !== true) e.proBono = 'Please confirm this to continue.';
  if (input.consent !== true) e.consent = 'Please confirm this to continue.';
  d.proBono = true;
  d.consent = true;

  return Object.keys(e).length ? { errors: e } : { data: d };
}
