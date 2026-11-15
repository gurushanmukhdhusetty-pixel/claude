'use client';
import { useEffect, useRef, useState } from 'react';
import { ROLES, GENDERS, PLAYING_AGES, LANGUAGES, RESIDENCE, YES_SOMETIMES_NO, validate } from '@/lib/schema';
import { LOGO_SVG } from '@/lib/logo-svg';

const EMPTY = {
  name: '', phone: '', programme: '', roles: [], roleOther: '', workLink: '', about: '',
  actor: { gender: '', genderSelf: '', playingAge: '', height: '', languages: [], languageOther: '', instagram: '', photosLink: '' },
  residence: '', stayBack: '', weekends: '', proBono: false, consent: false, website: '',
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

function Intro({ onStart }) {
  return (
    <section className="intro">
      <div className="perf" style={{ top: 0 }} />
      <div className="intro-grid intro-in">
        <div className="intro-main">
          <div className="logo" dangerouslySetInnerHTML={{ __html: LOGO_SVG }} />
          <div className="mono" style={{ color: '#8A8A8A' }}>Cinematy @ Mahindra University</div>
          <h1 className="serif">Calling all writers, directors, actors, editors <i>and producers.</i></h1>
          <p>
            We’re <b>Cinematy</b>, a home for Hyderabad’s filmmakers. We’re building the <b>Cinematy Content Unit at MU</b>:
            a crew of students who make short films, reels, skits and behind-the-scenes videos for our YouTube, Instagram and other channels.
            {' '}That includes the people who make shoots happen: <b>shoot managers, line producers and planners</b>.
          </p>
          <div className="go-wrap"><button className="go" onClick={onStart}>Let’s go <span aria-hidden>→</span></button></div>
        </div>
        <div className="facts">
          <div className="fact hl"><div className="mono">Heads up</div><div>This is <b>pro bono, not a paid gig.</b> Not a job or an internship. It’s a crew.</div></div>
          <div className="fact"><div className="mono">What you get</div><div>Credit on everything you make, real portfolio work, and people to create with.</div></div>
          <div className="fact"><div className="mono">Experience</div><div>None needed. A reel you made for fun counts.</div></div>
          <div className="fact"><div className="mono">Time</div><div>About 2 minutes.</div></div>
        </div>
      </div>
      <div className="perf" style={{ bottom: 0 }} />
    </section>
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

export default function ApplyFlow() {
  const [f, setF] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [idx, setIdx] = useState(-1); // -1 = intro
  const [dir, setDir] = useState(1);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState('');
  const stageRef = useRef(null);

  const drop = (...keys) => setErrors((e) => { if (!keys.some((k) => e[k])) return e; const n = { ...e }; keys.forEach((k) => delete n[k]); return n; });
  const set = (k, v) => { setF((s) => ({ ...s, [k]: v })); drop(k); };
  const setA = (k, v) => { setF((s) => ({ ...s, actor: { ...s.actor, [k]: v } })); drop('actor.' + k, 'actor.photos'); };
  const isActor = f.roles.includes('Acting');
  const first = f.name.trim().split(/\s+/)[0];

  const S = [
    { id: 'about', t: ['About', 'you'], sub: 'The basics, so we can reach you.', keys: ['name', 'phone', 'programme'] },
    { id: 'work', t: ['What you', 'do'], sub: first ? `Nice to meet you, ${first}. Pick everything you’re into.` : 'Pick everything you’re into.', keys: ['roles', 'roleOther', 'workLink'] },
    ...(isActor
      ? [
          { id: 'casting', t: ['A few casting', 'questions'], sub: 'Helps us cast you right.', keys: ['actor.gender', 'actor.playingAge', 'actor.languages'] },
          { id: 'photos', t: ['Let’s', 'see you'], sub: 'If your Instagram has clear photos of you, that’s enough. If not, share a Google Drive link with a couple of good angles: front, side and full length.', keys: ['actor.instagram', 'actor.photosLink', 'actor.photos'] },
        ]
      : []),
    { id: 'schedule', t: ['Your', 'schedule'], sub: 'So we can plan shoots around you.', keys: ['residence', 'stayBack', 'weekends'] },
    { id: 'last', t: ['Last', 'bit'], sub: 'Almost there.', keys: ['proBono', 'consent'] },
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
          <h2 className="serif">You’re in! <i>🎬</i></h2>
          <p>Thanks for raising your hand, {first}. Someone from the Cinematy team will reach out on WhatsApp soon.</p>
          <a className="btn solid" href="https://cinematy.in" target="_blank" rel="noreferrer"><span className="dot" /> Join the waitlist · cinematy.in</a>
          <div className="mono grey" style={{ marginTop: 40 }}>Lights. Camera. MU.</div>
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
                <Q label="Year and programme" req error={E.programme}>
                  <input type="text" placeholder="2nd year, B.Tech CSE" value={f.programme} onChange={(e) => set('programme', e.target.value)} onKeyDown={enter} />
                </Q>
              </>
            )}

            {cur.id === 'work' && (
              <>
                <Q label="What do you want to do?" req hint="Pick as many as you like." error={E.roles}>
                  <Choices name="roles" multi options={ROLES} value={f.roles} onPick={(v) => set('roles', v)} />
                  {f.roles.includes('Other') && (
                    <input style={{ marginTop: '.8rem' }} type="text" placeholder="What else? Sound, music, design…" value={f.roleOther} onChange={(e) => set('roleOther', e.target.value)} onKeyDown={enter} />
                  )}
                  <Err msg={E.roleOther} />
                </Q>
                <Q label="Share your work" hint="Optional. A portfolio, Instagram, YouTube or Drive link. You don’t need to be a pro: a class project or a reel you made for fun counts." error={E.workLink}>
                  <input type="url" autoCapitalize="none" placeholder="https://" value={f.workLink} onChange={(e) => set('workLink', e.target.value)} onKeyDown={enter} />
                </Q>
              </>
            )}

            {cur.id === 'casting' && (
              <>
                <Q label="Gender" req error={E['actor.gender']}>
                  <Pills name="gender" options={GENDERS} value={f.actor.gender} onPick={(v) => setA('gender', v)} />
                  {f.actor.gender === 'Prefer to self-describe' && (
                    <input style={{ marginTop: '.8rem' }} type="text" placeholder="How do you describe yourself?" value={f.actor.genderSelf} onChange={(e) => setA('genderSelf', e.target.value)} />
                  )}
                </Q>
                <Q label="Age range you can play" req error={E['actor.playingAge']}>
                  <Pills name="age" options={PLAYING_AGES} value={f.actor.playingAge} onPick={(v) => setA('playingAge', v)} />
                </Q>
                <div className="qrow">
                  <Q label="Height" hint="Optional">
                    <input type="text" placeholder="5′8″ or 172 cm" value={f.actor.height} onChange={(e) => setA('height', e.target.value)} />
                  </Q>
                  <Q label="Languages you can act in" req error={E['actor.languages']}>
                    <Pills name="lang" multi options={LANGUAGES} value={f.actor.languages} onPick={(v) => setA('languages', v)} />
                    {f.actor.languages.includes('Other') && (
                      <input style={{ marginTop: '.8rem' }} type="text" placeholder="Which other languages?" value={f.actor.languageOther} onChange={(e) => setA('languageOther', e.target.value)} />
                    )}
                  </Q>
                </div>
              </>
            )}

            {cur.id === 'photos' && (
              <>
                <Q label="Instagram handle" error={E['actor.instagram']}>
                  <input autoFocus type="text" autoCapitalize="none" placeholder="@yourhandle" value={f.actor.instagram} onChange={(e) => setA('instagram', e.target.value)} onKeyDown={enter} />
                </Q>
                <div className="or mono">or</div>
                <Q label="Google Drive link" hint="Set sharing to “Anyone with the link”." error={E['actor.photosLink']}>
                  <input type="url" autoCapitalize="none" placeholder="https://drive.google.com/…" value={f.actor.photosLink} onChange={(e) => setA('photosLink', e.target.value)} onKeyDown={enter} />
                </Q>
                <Err msg={E['actor.photos']} />
              </>
            )}

            {cur.id === 'schedule' && (
              <>
                <Q label="Are you a day scholar or a hosteller?" req error={E.residence}>
                  <Pills name="res" options={RESIDENCE} value={f.residence} onPick={(v) => set('residence', v)} />
                </Q>
                {f.residence === 'Day scholar' && (
                  <div className="anim fwd">
                    <Q label="Would you stay back after classes for a shoot, only when needed?" req error={E.stayBack}>
                      <Pills name="stay" options={YES_SOMETIMES_NO} value={f.stayBack} onPick={(v) => set('stayBack', v)} />
                    </Q>
                  </div>
                )}
                <Q label="Can you work on weekends?" req error={E.weekends}>
                  <Pills name="wk" options={YES_SOMETIMES_NO} value={f.weekends} onPick={(v) => set('weekends', v)} />
                </Q>
              </>
            )}

            {cur.id === 'last' && (
              <>
                <Q label="Anything you’d love to make with us?" hint="Optional. A line or two is plenty.">
                  <textarea placeholder="A horror short in the library at night…" value={f.about} onChange={(e) => set('about', e.target.value)} />
                </Q>
                <label className={'check' + (E.proBono ? ' bad' : '')}>
                  <input type="checkbox" checked={f.proBono} onChange={(e) => set('proBono', e.target.checked)} />
                  <span><b>I understand this is a pro bono, unpaid creative role.</b><br /><span className="grey">I’m in for the love of making things.</span></span>
                </label>
                <label className={'check' + (E.consent ? ' bad' : '')}>
                  <input type="checkbox" checked={f.consent} onChange={(e) => set('consent', e.target.checked)} />
                  <span><b>Cinematy can store my details and contact me</b> about the Content Unit.<br />
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
