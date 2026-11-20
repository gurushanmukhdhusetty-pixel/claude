'use client';
import { useEffect, useRef, useState } from 'react';
import { INTERESTS, YEARS, CLUB, CREW_SIZE, KICKOFF, TEAM_AREAS, HOURS, validate, wantsLead, wantsTeam } from '@/lib/schema';
import { LOGO_SVG } from '@/lib/logo-svg';

const EMPTY = {
  name: '', phone: '', email: '', instagram: '', college: '', city: 'Hyderabad', year: '', programme: '',
  interest: '',
  lead: { club: '', clubName: '', crew: '', kickoff: [], kickoffOther: '' },
  team: { areas: [], areaOther: '', hours: '' },
  workLink: '', why: '', proBono: false, consent: false, website: '',
};

const Err = ({ msg }) => (msg ? <div className="err" role="alert">{msg}</div> : null);

function Choices({ name, options, value, onPick, multi }) {
  return (
    <div className={'choices' + (options.length > 4 ? ' many' : '')} role={multi ? 'group' : 'radiogroup'}>
      {options.map((o, i) => {
        const on = multi ? value.includes(o) : value === o;
        return (
          <button type="button" key={o} className={'choice' + (on ? ' on' : '')} aria-pressed={on}
            onClick={() => onPick(multi ? (on ? value.filter((x) => x !== o) : [...value, o]) : o)}>
            <span className="key">{String.fromCharCode(65 + i)}</span>
            <span>{o}</span>
            {on && <span className="tick">✓</span>}
          </button>
        );
      })}
    </div>
  );
}

function Pills({ name, options, value, onPick, multi }) {
  return (
    <div className="pills" role={multi ? 'group' : 'radiogroup'}>
      {options.map((o) => {
        const on = multi ? value.includes(o) : value === o;
        return (
          <button type="button" key={o} className={'pillopt' + (on ? ' on' : '')} aria-pressed={on}
            onClick={() => onPick(multi ? (on ? value.filter((x) => x !== o) : [...value, o]) : o)}>{o}</button>
        );
      })}
    </div>
  );
}

function Q({ label, hint, req, error, children }) {
  return (
    <div className={'qblock' + (error ? ' bad' : '')}>
      <div className="qlabel">{label}{req && <span className="req">*</span>}</div>
      {hint && <div className="hint qh">{hint}</div>}
      {children}
      <Err msg={error} />
    </div>
  );
}


function Intro({ onStart }) {
  return (
    <section className="intro">
      <div className="perf" style={{ top: 0 }} />
      <div className="intro-grid intro-in">
        <div className="intro-main">
          <div className="logo" dangerouslySetInnerHTML={{ __html: LOGO_SVG }} />
          <div className="mono" style={{ color: '#8A8A8A' }}>Cinematy · Campus leads &amp; team</div>
          <h1 className="serif">Bring Cinematy to <i>your campus.</i></h1>
          <p>
            We’re <b>Cinematy</b>, a community for student filmmakers and film lovers in Hyderabad. We started with the
            {' '}<b>Cinematy Content Unit at Mahindra University</b>, and now we want to go further: <b>campus leads</b> who kickstart
            Cinematy at their college, and people who want to <b>join the core team</b>.
          </p>
          <div className="go-wrap"><button className="go" onClick={onStart}>Let’s go <span aria-hidden>→</span></button></div>
        </div>
        <div className="facts">
          <div className="fact hl"><div className="mono">Heads up</div><div>This is <b>pro bono, not a paid gig.</b> It’s a chance to build something from the start.</div></div>
          <div className="fact"><div className="mono">Campus lead</div><div>Start a Cinematy crew at your college: screenings, meetups, content and shoots.</div></div>
          <div className="fact"><div className="mono">Core team</div><div>Help build Cinematy itself: content, community, events, design and more.</div></div>
          <div className="fact"><div className="mono">Experience</div><div>None needed. Just the passion. About 2 minutes to apply.</div></div>
        </div>
      </div>
      <div className="perf" style={{ bottom: 0 }} />
    </section>
  );
}

export default function ApplyFlow() {
  const [f, setF] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [idx, setIdx] = useState(-1);
  const [dir, setDir] = useState(1);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState('');
  const stageRef = useRef(null);

  const drop = (...keys) => setErrors((e) => { if (!keys.some((k) => e[k])) return e; const n = { ...e }; keys.forEach((k) => delete n[k]); return n; });
  const set = (k, v) => { setF((s) => ({ ...s, [k]: v })); drop(k); };
  const setL = (k, v) => { setF((s) => ({ ...s, lead: { ...s.lead, [k]: v } })); drop('lead.' + k); };
  const setT = (k, v) => { setF((s) => ({ ...s, team: { ...s.team, [k]: v } })); drop('team.' + k); };
  const first = f.name.trim().split(/\s+/)[0];
  const lead = wantsLead(f), team = wantsTeam(f);

  const S = [
    { id: 'about', t: ['About', 'you'], sub: 'The basics, so we can reach you.', keys: ['name', 'phone', 'email', 'instagram'] },
    { id: 'campus', t: ['Your', 'campus'], sub: first ? `Where are you studying, ${first}?` : 'Where are you studying?', keys: ['college', 'city', 'year', 'programme'] },
    { id: 'interest', t: ['How do you want to', 'help?'], sub: 'Pick the one that fits. You can choose both.', keys: ['interest'] },
    ...(lead ? [{ id: 'lead', t: ['Cinematy at', 'your campus'], sub: 'Tell us about the film scene at your college.', keys: ['lead.club', 'lead.crew', 'lead.kickoff'] }] : []),
    ...(team ? [{ id: 'team', t: ['Join the', 'team'], sub: 'Where would you like to help build Cinematy?', keys: ['team.areas', 'team.hours'] }] : []),
    { id: 'last', t: ['Last', 'bit'], sub: 'Almost there.', keys: ['workLink', 'proBono', 'consent'] },
  ];
  const cur = S[idx];

  useEffect(() => { window.scrollTo({ top: 0 }); if (stageRef.current) stageRef.current.scrollTop = 0; }, [idx, done]);

  function errorsFor(sec) {
    const last = sec.id === 'last';
    const r = validate({ ...f, proBono: last ? f.proBono : true, consent: last ? f.consent : true });
    const all = r.errors || {};
    const mine = {};
    sec.keys.forEach((k) => { if (all[k]) mine[k] = all[k]; });
    return mine;
  }
  function next() {
    setFormError('');
    const e = errorsFor(cur);
    if (Object.keys(e).length) {
      setErrors((x) => ({ ...x, ...e }));
      setTimeout(() => document.querySelector('.qblock.bad, .check.bad')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 30);
      return;
    }
    setDir(1);
    setIdx((i) => Math.min(i + 1, S.length - 1));
  }
  const back = () => { setFormError(''); setDir(-1); setIdx((i) => Math.max(-1, i - 1)); };

  async function submit() {
    const e = errorsFor(cur);
    if (Object.keys(e).length) { setErrors((x) => ({ ...x, ...e })); return; }
    setBusy(true); setFormError('');
    try {
      const res = await fetch('/api/apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) });
      const j = await res.json().catch(() => ({}));
      if (res.ok && j.ok) { setDone(true); return; }
      if (j.errors) {
        setErrors(j.errors);
        const target = S.findIndex((s) => s.keys.some((k) => j.errors[k]));
        if (target >= 0 && target !== idx) { setDir(-1); setIdx(target); }
        else setFormError('Something needs a look.');
      } else setFormError(j.error || 'Something went wrong. Please try again.');
    } catch {
      setFormError('Couldn’t reach the server. Check your connection and try again.');
    } finally { setBusy(false); }
  }

  if (done)
    return (
      <main className="flow">
        <div className="done anim fwd">
          <div className="logo-sm" dangerouslySetInnerHTML={{ __html: LOGO_SVG }} />
          <div className="mono grey">Application received</div>
          <h2 className="serif">You’re in the <i>loop!</i> 🎬</h2>
          <p>Thanks, {first}. Someone from the Cinematy team will reach out on WhatsApp soon to talk about {f.interest === 'Join the team' ? 'joining the team' : f.interest === 'Both' ? 'your campus and the team' : `bringing Cinematy to ${f.college || 'your campus'}`}.</p>
          <a className="btn solid" href="https://cinematy.in" target="_blank" rel="noreferrer"><span className="dot" /> Join the waitlist · cinematy.in</a>
          <div className="mono grey" style={{ marginTop: 40 }}>Lights. Camera. Cinematy.</div>
        </div>
      </main>
    );
  if (idx === -1) return <Intro onStart={() => { setDir(1); setIdx(0); }} />;

  const E = errors;
  const enter = (e) => { if (e.key === 'Enter') { e.preventDefault(); cur.id === 'last' ? submit() : next(); } };
  const pct = ((idx + 1) / S.length) * 100;

  return (
    <main className="flow">
      <header className="bar">
        <button className="back" onClick={back} aria-label="Back">←</button>
        <div className="bar-logo" dangerouslySetInnerHTML={{ __html: LOGO_SVG }} />
        <div className="mono grey step-n">{String(idx + 1).padStart(2, '0')} / {String(S.length).padStart(2, '0')}</div>
        <div className="progress"><div style={{ width: pct + '%' }} /></div>
      </header>

      <div className="stage" ref={stageRef}>
        <div key={cur.id} className={'qa anim ' + (dir > 0 ? 'fwd' : 'bwd')}>
          <div className="hp" aria-hidden="true"><input tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => set('website', e.target.value)} /></div>
          <div className="qnum mono">Section {String(idx + 1).padStart(2, '0')}</div>
          <h2 className="serif q">{cur.t[0]} <i>{cur.t[1]}</i></h2>
          <p className="grey qhint">{cur.sub}</p>

          <div className="qgroup">
            {cur.id === 'about' && (
              <>
                <Q label="Full name" req error={E.name}>
                  <input autoFocus type="text" autoComplete="name" placeholder="Your name" value={f.name} onChange={(e) => set('name', e.target.value)} onKeyDown={enter} />
                </Q>
                <Q label="WhatsApp number" req hint="We’ll reach out here." error={E.phone}>
                  <input type="tel" inputMode="tel" autoComplete="tel" placeholder="98765 43210" value={f.phone} onChange={(e) => set('phone', e.target.value)} onKeyDown={enter} />
                </Q>
                <div className="qrow">
                  <Q label="Email" hint="Optional" error={E.email}>
                    <input type="text" inputMode="email" autoComplete="email" autoCapitalize="none" placeholder="you@college.edu" value={f.email} onChange={(e) => set('email', e.target.value)} onKeyDown={enter} />
                  </Q>
                  <Q label="Instagram" hint="Optional" error={E.instagram}>
                    <input type="text" autoCapitalize="none" placeholder="@yourhandle" value={f.instagram} onChange={(e) => set('instagram', e.target.value)} onKeyDown={enter} />
                  </Q>
                </div>
              </>
            )}

            {cur.id === 'campus' && (
              <>
                <Q label="College or university" req error={E.college}>
                  <input autoFocus type="text" placeholder="e.g. Mahindra University" value={f.college} onChange={(e) => set('college', e.target.value)} onKeyDown={enter} />
                </Q>
                <Q label="Year" req error={E.year}>
                  <Pills name="year" options={YEARS} value={f.year} onPick={(v) => set('year', v)} />
                </Q>
                <div className="qrow">
                  <Q label="City" error={E.city}>
                    <input type="text" value={f.city} onChange={(e) => set('city', e.target.value)} onKeyDown={enter} />
                  </Q>
                  <Q label="Programme" hint="Optional">
                    <input type="text" placeholder="B.Tech CSE, BA Media…" value={f.programme} onChange={(e) => set('programme', e.target.value)} onKeyDown={enter} />
                  </Q>
                </div>
              </>
            )}

            {cur.id === 'interest' && (
              <Q label="I’d like to…" req error={E.interest}>
                <Choices name="interest" options={['Campus lead', 'Join the team', 'Both']} value={f.interest} onPick={(v) => set('interest', v)} />
                <div className="hint" style={{ marginTop: '.8rem' }}>
                  <b>Campus lead:</b> kickstart Cinematy activities at your college. <b>Join the team:</b> help build Cinematy itself.
                </div>
              </Q>
            )}

            {cur.id === 'lead' && (
              <>
                <Q label="Does your college have a film or media club?" req error={E['lead.club']}>
                  <Pills name="club" options={CLUB} value={f.lead.club} onPick={(v) => setL('club', v)} />
                  {f.lead.club === 'Yes' && (
                    <input style={{ marginTop: '.8rem' }} type="text" placeholder="Club name (optional)" value={f.lead.clubName} onChange={(e) => setL('clubName', e.target.value)} />
                  )}
                </Q>
                <Q label="How many people could you bring together?" req error={E['lead.crew']}>
                  <Pills name="crew" options={CREW_SIZE} value={f.lead.crew} onPick={(v) => setL('crew', v)} />
                </Q>
                <Q label="What would you start with?" req hint="Pick as many as you like." error={E['lead.kickoff']}>
                  <Pills name="kickoff" multi options={KICKOFF} value={f.lead.kickoff} onPick={(v) => setL('kickoff', v)} />
                  {f.lead.kickoff.includes('Other') && (
                    <input style={{ marginTop: '.8rem' }} type="text" placeholder="What else?" value={f.lead.kickoffOther} onChange={(e) => setL('kickoffOther', e.target.value)} />
                  )}
                </Q>
              </>
            )}

            {cur.id === 'team' && (
              <>
                <Q label="Where would you like to help?" req hint="Pick as many as you like." error={E['team.areas']}>
                  <Pills name="areas" multi options={TEAM_AREAS} value={f.team.areas} onPick={(v) => setT('areas', v)} />
                  {f.team.areas.includes('Other') && (
                    <input style={{ marginTop: '.8rem' }} type="text" placeholder="What else?" value={f.team.areaOther} onChange={(e) => setT('areaOther', e.target.value)} />
                  )}
                </Q>
                <Q label="Hours you could give in a week" req error={E['team.hours']}>
                  <Pills name="hours" options={HOURS} value={f.team.hours} onPick={(v) => setT('hours', v)} />
                </Q>
              </>
            )}

            {cur.id === 'last' && (
              <>
                <Q label="Share your work" hint="Optional. A portfolio, Instagram, YouTube or Drive link. Anything you’ve made or organised counts." error={E.workLink}>
                  <input type="url" autoCapitalize="none" placeholder="https://" value={f.workLink} onChange={(e) => set('workLink', e.target.value)} onKeyDown={enter} />
                </Q>
                <Q label="Why do you want to do this?" hint="Optional. A line or two is plenty.">
                  <textarea placeholder="I want my campus to have a real film scene…" value={f.why} onChange={(e) => set('why', e.target.value)} />
                </Q>
                <label className={'check' + (E.proBono ? ' bad' : '')}>
                  <input type="checkbox" checked={f.proBono} onChange={(e) => set('proBono', e.target.checked)} />
                  <span><b>I understand this is a pro bono, unpaid role.</b><br /><span className="grey">I’m in to help build something from the start.</span></span>
                </label>
                <label className={'check' + (E.consent ? ' bad' : '')}>
                  <input type="checkbox" checked={f.consent} onChange={(e) => set('consent', e.target.checked)} />
                  <span><b>Cinematy can store my details and contact me</b> about campus and team roles.<br />
                    <span className="grey">Your details stay private. Only the Cinematy team can see them, and you can ask us to delete them anytime.</span></span>
                </label>
                <Err msg={(E.proBono || E.consent) && 'Please tick both to continue.'} />
              </>
            )}
          </div>
          {formError && <div className="formerr" style={{ marginTop: '1rem' }}>{formError}</div>}
        </div>
      </div>

      <footer className="qfoot">
        <div className="qnav">
          <button className="btn backbtn" onClick={back}>Back</button>
          {cur.id === 'last' ? (
            <button className="ok" onClick={submit} disabled={busy}>{busy ? 'Sending…' : 'Count me in →'}</button>
          ) : (
            <button className="ok" onClick={next}>Continue →</button>
          )}
        </div>
      </footer>
    </main>
  );
}
