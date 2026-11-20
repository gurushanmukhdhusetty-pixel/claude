// Shared form options and server-side validation for the Campus Lead & Team form.
export const INTERESTS = ['Campus lead', 'Join the team', 'Both'];
export const STATUS = ['Student', 'Not a student'];
export const OCCUPATIONS = ['Working professional', 'Freelancer', 'Filmmaker / creator', 'Recent graduate', 'Other'];
export const YEARS = ['1st year', '2nd year', '3rd year', '4th year', '5th year', 'Postgrad', 'Graduated'];
export const CLUB = ['Yes', 'No', 'Not sure'];
export const CREW_SIZE = ['1–5', '5–15', '15–30', '30+'];
export const KICKOFF = ['Screenings', 'Meetups', 'Workshops', 'Content crew', 'Short film project', 'Other'];
export const TEAM_AREAS = ['Content', 'Community', 'Events', 'Design', 'Social media', 'Partnerships', 'Tech', 'Operations', 'Other'];
export const HOURS = ['Under 3', '3–6', '6–10', '10+'];
export const STATUSES = [
  ['new', 'New'],
  ['contacted', 'Contacted'],
  ['onboarded', 'Onboarded'],
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

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

export const wantsLead = (d) => d.interest === 'Campus lead' || d.interest === 'Both';
export const wantsTeam = (d) => d.interest === 'Join the team' || d.interest === 'Both';

// Returns { data } or { errors: {field: message} }
export function validate(input) {
  const e = {};
  const d = {};
  d.name = str(input.name, 120);
  if (d.name.length < 2) e.name = 'Tell us your name.';
  d.phone = normalizePhone(input.phone);
  if (!d.phone) e.phone = 'Enter a 10-digit Indian mobile number.';
  d.email = str(input.email, 160);
  if (d.email && !isEmail(d.email)) e.email = 'That email doesn’t look right.';
  d.instagram = normalizeInstagram(input.instagram);
  if (d.instagram === null) e.instagram = 'Enter a valid Instagram handle.';

  d.status = STATUS.includes(input.status) ? input.status : '';
  if (!d.status) e.status = 'Pick one.';
  const student = d.status === 'Student';
  d.city = str(input.city, 80) || 'Hyderabad';
  d.college = student ? str(input.college, 160) : '';
  if (student && d.college.length < 2) e.college = 'Which college or university are you at?';
  d.year = student && YEARS.includes(input.year) ? input.year : '';
  if (student && !d.year) e.year = 'Pick one.';
  d.programme = student ? str(input.programme, 120) : '';
  d.occupation = !student && OCCUPATIONS.includes(input.occupation) ? input.occupation : '';
  if (d.status === 'Not a student' && !d.occupation) e.occupation = 'Pick one.';
  d.occupationDetail = !student ? str(input.occupationDetail, 160) : '';
  // campus leads must be students
  if (!student && (input.interest === 'Campus lead' || input.interest === 'Both')) input = { ...input, interest: 'Join the team' };

  d.interest = INTERESTS.includes(input.interest) ? input.interest : '';
  if (!d.interest) e.interest = 'Pick one.';

  if (wantsLead(d)) {
    const l = input.lead || {};
    const lead = {};
    lead.club = CLUB.includes(l.club) ? l.club : '';
    if (!lead.club) e['lead.club'] = 'Pick one.';
    lead.clubName = lead.club === 'Yes' ? str(l.clubName, 120) : '';
    lead.crew = CREW_SIZE.includes(l.crew) ? l.crew : '';
    if (!lead.crew) e['lead.crew'] = 'Pick one.';
    lead.kickoff = arr(l.kickoff, KICKOFF);
    if (!lead.kickoff.length) e['lead.kickoff'] = 'Pick at least one.';
    lead.kickoffOther = lead.kickoff.includes('Other') ? str(l.kickoffOther, 120) : '';
    d.lead = lead;
  } else d.lead = null;

  if (wantsTeam(d)) {
    const t = input.team || {};
    const team = {};
    team.areas = arr(t.areas, TEAM_AREAS);
    if (!team.areas.length) e['team.areas'] = 'Pick at least one.';
    team.areaOther = team.areas.includes('Other') ? str(t.areaOther, 120) : '';
    team.hours = HOURS.includes(t.hours) ? t.hours : '';
    if (!team.hours) e['team.hours'] = 'Pick one.';
    d.team = team;
  } else d.team = null;

  d.workLink = normalizeUrl(input.workLink);
  if (d.workLink === null) e.workLink = 'That link doesn’t look right.';
  d.why = str(input.why, 800);

  if (input.proBono !== true) e.proBono = 'Please confirm this to continue.';
  if (input.consent !== true) e.consent = 'Please confirm this to continue.';
  d.proBono = true;
  d.consent = true;
  return Object.keys(e).length ? { errors: e } : { data: d };
}
