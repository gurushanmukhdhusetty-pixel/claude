'use client';
import { useEffect, useRef, useState } from 'react';
import { ROLES, GENDERS, PLAYING_AGES, LANGUAGES, RESIDENCE, YES_SOMETIMES_NO, validate } from '@/lib/schema';
import { LOGO_SVG } from '@/lib/logo-svg';

const EMPTY = {
  name: '', phone: '', programme: '', roles: [], roleOther: '', workLink: '', about: '',
  actor: { gender: '', genderSelf: '', playingAge: '', height: '', languages: [], languageOther: '', instagram: '', photosLink: '' },
  residence: '', stayBack: '', weekends: '', proBono: false, consent: false, website: '',
};

// Which error keys belong to which step
const STEP_FIELDS = {
  about: ['name', 'phone', 'programme'],
  work: ['roles', 'roleOther', 'workLink'],
  actor: ['actor.gender', 'actor.playingAge', 'actor.languages', 'actor.instagram', 'actor.photosLink', 'actor.photos'],
  schedule: ['residence', 'stayBack', 'weekends'],
  confirm: ['proBono', 'consent'],
};

function Err({ msg }) {
  return msg ? <div className="err" role="alert">{msg}</div> : null;
}

function Field({ label, req, hint, error, children }) {
  return (
    <div className={'field' + (error ? ' bad' : '')}>
      <label className="label">
        {label}
        {req && <span className="req">*</span>}
      </label>
      {hint && <div className="hint">{hint}</div>}
      {children}
      <Err msg={error} />
    </div>
  );
}

function Chips({ name, options, value, onChange, multi }) {
  return (
    <div className="chips" role={multi ? 'group' : 'radiogroup'}>
      {options.map((o) => {
        const checked = multi ? value.includes(o) : value === o;
        return (
          <label className="chip" key={o}>
            <input type={multi ? 'checkbox' : 'radio'} name={name} checked={checked}
              onChange={() => onChange(multi ? (checked ? value.filter((x) => x !== o) : [...value, o]) : o)} />
            <span>{o}</span>
          </label>
        );
      })}
    </div>
  );
}

function Intro({ onStart }) {
  return (
    <section className="intro">
      <div className="perf" style={{ top: 0 }} />
      <div className="wrap intro-in">
        <div className="logo" dangerouslySetInnerHTML={{ __html: LOGO_SVG }} />
        <div className="mono" style={{ color: '#8A8A8A' }}>Cinematy @ Mahindra University</div>
        <h1 className="serif">Calling all writers, directors, actors <i>and editors.</i></h1>
        <p>
          We’re <b>Cinematy</b>, a home for Hyderabad’s filmmakers. We’re building the <b>Cinematy Content Unit at MU</b>:
          a crew of students who make short films, reels, skits and behind-the-scenes videos for our YouTube, Instagram and other channels.
        </p>
        <button className="go" onClick={onStart}>Let’s go <span aria-hidden>→</span></button>
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

export default function ApplyFlow() {
  const [f, setF] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [stepIdx, setStepIdx] = useState(-1); // -1 = intro
  const [dir, setDir] = useState(1);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState('');
  const topRef = useRef(null);

  const isActor = f.roles.includes('Acting');
  const steps = ['about', 'work', ...(isActor ? ['actor'] : []), 'schedule', 'confirm'];
  const step = steps[stepIdx];

  const drop = (...keys) => setErrors((e) => { if (!keys.some((k) => e[k])) return e; const n = { ...e }; keys.forEach((k) => delete n[k]); return n; });
  const set = (k, v) => { setF((s) => ({ ...s, [k]: v })); drop(k); };
  const setA = (k, v) => { setF((s) => ({ ...s, actor: { ...s.actor, [k]: v } })); drop('actor.' + k, 'actor.photos'); };

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [stepIdx, done]);

  function stepErrors(name) {
    const r = validate({ ...f, proBono: name === 'confirm' ? f.proBono : true, consent: name === 'confirm' ? f.consent : true });
    const all = r.errors || {};
    const mine = {};
    STEP_FIELDS[name].forEach((k) => { if (all[k]) mine[k] = all[k]; });
    return mine;
  }

  function go(delta) {
    setFormError('');
    if (delta > 0) {
      const e = stepErrors(step);
      if (Object.keys(e).length) { setErrors((x) => ({ ...x, ...e })); return; }
    }
    setDir(delta);
    setStepIdx((i) => Math.max(-1, Math.min(steps.length - 1, i + delta)));
  }

  async function submit() {
    const e = stepErrors('confirm');
    if (Object.keys(e).length) { setErrors((x) => ({ ...x, ...e })); return; }
    setBusy(true); setFormError('');
    try {
      const res = await fetch('/api/apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) });
      const j = await res.json().catch(() => ({}));
      if (res.ok && j.ok) { setDone(true); return; }
      if (j.errors) {
        setErrors(j.errors);
        const target = steps.findIndex((s) => STEP_FIELDS[s].some((k) => j.errors[k]));
        if (target >= 0 && target !== stepIdx) { setDir(-1); setStepIdx(target); }
        else setFormError('A few things need a look.');
      } else setFormError(j.error || 'Something went wrong. Please try again.');
    } catch {
      setFormError('Couldn’t reach the server. Check your connection and try again.');
    } finally { setBusy(false); }
  }

  const onKey = (e) => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'checkbox' && e.target.type !== 'radio') {
      e.preventDefault();
      step === 'confirm' ? submit() : go(1);
    }
  };

  if (stepIdx === -1 && !done) return <Intro onStart={() => { setDir(1); setStepIdx(0); }} />;

  if (done)
    return (
      <main className="flow">
        <div className="done wrap anim fwd">
          <div className="logo-sm" dangerouslySetInnerHTML={{ __html: LOGO_SVG }} />
          <div className="mono grey">Application received</div>
          <h2 className="serif">You’re in! <i>🎬</i></h2>
          <p>Thanks for raising your hand, {f.name.split(' ')[0]}. Someone from the Cinematy team will reach out on WhatsApp soon.</p>
          <a className="btn solid" href="https://cinematy.in" target="_blank" rel="noreferrer"><span className="dot" /> Join the waitlist · cinematy.in</a>
          <div className="mono grey" style={{ marginTop: 40 }}>Lights. Camera. MU.</div>
        </div>
      </main>
    );

  const E = errors;
  const titles = {
    about: ['About', 'you', 'The basics, so we can reach you.'],
    work: ['What you', 'do', 'Pick everything you’re into.'],
    actor: ['For', 'actors', 'Help us cast you right.'],
    schedule: ['Your', 'schedule', 'So we plan shoots around you.'],
    confirm: ['One last', 'thing', 'Two quick confirmations.'],
  };
  const [t1, t2, sub] = titles[step];
  const pct = ((stepIdx + 1) / steps.length) * 100;

  return (
    <main className="flow" ref={topRef}>
      <header className="bar">
        <button className="back" onClick={() => go(-1)} aria-label="Back">←</button>
        <div className="bar-logo" dangerouslySetInnerHTML={{ __html: LOGO_SVG }} />
        <div className="mono grey step-n">{String(stepIdx + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}</div>
        <div className="progress"><div style={{ width: pct + '%' }} /></div>
      </header>

      <div className="wrap">
        <div key={step} className={'step anim ' + (dir > 0 ? 'fwd' : 'bwd')} onKeyDown={onKey}>
          <div className="hp" aria-hidden="true"><label>Website <input tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => set('website', e.target.value)} /></label></div>
          <h2 className="serif step-h">{t1} <i>{t2}</i></h2>
          <p className="grey step-sub">{sub}</p>

          {step === 'about' && (
            <>
              <Field label="Full name" req error={E.name}>
                <input type="text" autoComplete="name" autoFocus value={f.name} onChange={(e) => set('name', e.target.value)} />
              </Field>
              <Field label="WhatsApp number" req hint="We’ll reach out here." error={E.phone}>
                <input type="tel" inputMode="tel" autoComplete="tel" placeholder="98765 43210" value={f.phone} onChange={(e) => set('phone', e.target.value)} />
              </Field>
              <Field label="Year and programme" req hint="e.g. 2nd year, B.Tech CSE" error={E.programme}>
                <input type="text" value={f.programme} onChange={(e) => set('programme', e.target.value)} />
              </Field>
            </>
          )}

          {step === 'work' && (
            <>
              <Field label="What do you want to do?" req hint="Pick as many as you like." error={E.roles}>
                <Chips name="roles" multi options={ROLES} value={f.roles} onChange={(v) => set('roles', v)} />
              </Field>
              {f.roles.includes('Other') && (
                <Field label="What else do you do?" req error={E.roleOther}>
                  <input type="text" placeholder="Sound, music, design…" value={f.roleOther} onChange={(e) => set('roleOther', e.target.value)} />
                </Field>
              )}
              <Field label="Share your work" hint="A portfolio, Instagram, YouTube or Drive link. You don’t need to be a pro: a class project or a reel you made for fun counts. No link? Skip it." error={E.workLink}>
                <input type="url" placeholder="https://" autoCapitalize="none" value={f.workLink} onChange={(e) => set('workLink', e.target.value)} />
              </Field>
              <Field label="Anything you’d like to make with us?" hint="Optional. A line or two is plenty.">
                <textarea value={f.about} onChange={(e) => set('about', e.target.value)} />
              </Field>
              {isActor && <div className="note"><span className="pill solid">Acting</span> picked: next we’ll ask a few casting questions.</div>}
            </>
          )}

          {step === 'actor' && (
            <>
              <Field label="Gender" req error={E['actor.gender']}>
                <Chips name="gender" options={GENDERS} value={f.actor.gender} onChange={(v) => setA('gender', v)} />
              </Field>
              {f.actor.gender === 'Prefer to self-describe' && (
                <Field label="How do you describe yourself?">
                  <input type="text" value={f.actor.genderSelf} onChange={(e) => setA('genderSelf', e.target.value)} />
                </Field>
              )}
              <Field label="Age range you can play" req error={E['actor.playingAge']}>
                <Chips name="playingAge" options={PLAYING_AGES} value={f.actor.playingAge} onChange={(v) => setA('playingAge', v)} />
              </Field>
              <Field label="Height" hint="Optional. e.g. 5′8″ or 172 cm">
                <input type="text" value={f.actor.height} onChange={(e) => setA('height', e.target.value)} />
              </Field>
              <Field label="Languages you can act in" req error={E['actor.languages']}>
                <Chips name="languages" multi options={LANGUAGES} value={f.actor.languages} onChange={(v) => setA('languages', v)} />
              </Field>
              {f.actor.languages.includes('Other') && (
                <Field label="Which other languages?">
                  <input type="text" value={f.actor.languageOther} onChange={(e) => setA('languageOther', e.target.value)} />
                </Field>
              )}
              <div className="photos">
                <div className="label">Your photos<span className="req">*</span></div>
                <div className="hint">If your Instagram has clear photos of you, that’s enough. If not, share a Google Drive link with a couple of good angles: front, side and full length.</div>
                <Field label="Instagram handle" error={E['actor.instagram']}>
                  <input type="text" placeholder="@yourhandle" autoCapitalize="none" value={f.actor.instagram} onChange={(e) => setA('instagram', e.target.value)} />
                </Field>
                <div className="or mono">or</div>
                <Field label="Google Drive link" hint="Set sharing to “Anyone with the link”." error={E['actor.photosLink']}>
                  <input type="url" placeholder="https://drive.google.com/…" autoCapitalize="none" value={f.actor.photosLink} onChange={(e) => setA('photosLink', e.target.value)} />
                </Field>
                <Err msg={E['actor.photos']} />
              </div>
            </>
          )}

          {step === 'schedule' && (
            <>
              <Field label="Are you a day scholar or a hosteller?" req error={E.residence}>
                <Chips name="residence" options={RESIDENCE} value={f.residence} onChange={(v) => set('residence', v)} />
              </Field>
              {f.residence === 'Day scholar' && (
                <div className="anim fwd">
                  <Field label="Would you stay back after classes for a shoot, only when needed?" req error={E.stayBack}>
                    <Chips name="stayBack" options={YES_SOMETIMES_NO} value={f.stayBack} onChange={(v) => set('stayBack', v)} />
                  </Field>
                </div>
              )}
              <Field label="Can you work on weekends?" req error={E.weekends}>
                <Chips name="weekends" options={YES_SOMETIMES_NO} value={f.weekends} onChange={(v) => set('weekends', v)} />
              </Field>
            </>
          )}

          {step === 'confirm' && (
            <>
              <label className={'check' + (E.proBono ? ' bad' : '')}>
                <input type="checkbox" checked={f.proBono} onChange={(e) => set('proBono', e.target.checked)} />
                <span><b>I understand this is a pro bono, unpaid creative role.</b><br /><span className="grey">I’m in for the love of making things.</span></span>
              </label>
              <Err msg={E.proBono} />
              <label className={'check' + (E.consent ? ' bad' : '')}>
                <input type="checkbox" checked={f.consent} onChange={(e) => set('consent', e.target.checked)} />
                <span><b>Cinematy can store my details and contact me</b> about the Content Unit.<br />
                  <span className="grey">Your details stay private. Only the Cinematy team can see them, and you can ask us to delete them anytime.</span></span>
              </label>
              <Err msg={E.consent} />
            </>
          )}

          {formError && <div className="formerr">{formError}</div>}
          <div className="nav">
            <button className="btn" onClick={() => go(-1)}>Back</button>
            {step === 'confirm' ? (
              <button className="submit" onClick={submit} disabled={busy}>{busy ? 'Sending…' : 'Count me in →'}</button>
            ) : (
              <button className="submit" onClick={() => go(1)}>Continue →</button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
