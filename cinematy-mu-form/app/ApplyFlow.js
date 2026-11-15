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
          <h1 className="serif">Calling all writers, directors, actors <i>and editors.</i></h1>
          <p>
            We’re <b>Cinematy</b>, a home for Hyderabad’s filmmakers. We’re building the <b>Cinematy Content Unit at MU</b>:
            a crew of students who make short films, reels, skits and behind-the-scenes videos for our YouTube, Instagram and other channels.
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

export default function ApplyFlow() {
  const [f, setF] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [idx, setIdx] = useState(-1); // -1 = intro
  const [dir, setDir] = useState(1);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState('');
  const timer = useRef(null);
  const stageRef = useRef(null);

  const set = (k, v) => { setF((s) => ({ ...s, [k]: v })); setErrors({}); };
  const setA = (k, v) => { setF((s) => ({ ...s, actor: { ...s.actor, [k]: v } })); setErrors({}); };
  const isActor = f.roles.includes('Acting');
  const first = f.name.trim().split(/\s+/)[0];

  // One screen per question. keys = error keys this screen owns.
  const Q = [
    { id: 'name', keys: ['name'], q: 'What’s your name?', type: 'text' },
    { id: 'phone', keys: ['phone'], q: first ? `Hi ${first}! What’s your WhatsApp number?` : 'What’s your WhatsApp number?', hint: 'We’ll reach out here.', type: 'text' },
    { id: 'programme', keys: ['programme'], q: 'Which year and programme are you in?', hint: 'e.g. 2nd year, B.Tech CSE', type: 'text' },
    { id: 'roles', keys: ['roles', 'roleOther'], q: 'What do you want to do?', hint: 'Pick as many as you like.', type: 'multi' },
    { id: 'workLink', keys: ['workLink'], q: 'Got something you’ve made?', hint: 'A portfolio, Instagram, YouTube or Drive link. You don’t need to be a pro: a class project or a reel you made for fun counts.', type: 'text', optional: true },
    ...(isActor
      ? [
          { id: 'gender', keys: ['actor.gender'], q: 'A few casting questions. Your gender?', type: 'single' },
          { id: 'playingAge', keys: ['actor.playingAge'], q: 'What age range can you play?', type: 'single' },
          { id: 'height', keys: [], q: 'How tall are you?', hint: 'e.g. 5′8″ or 172 cm', type: 'text', optional: true },
          { id: 'languages', keys: ['actor.languages'], q: 'Which languages can you act in?', hint: 'Pick all that apply.', type: 'multi' },
          { id: 'photos', keys: ['actor.instagram', 'actor.photosLink', 'actor.photos'], q: 'Let’s see you.', hint: 'If your Instagram has clear photos of you, that’s enough. If not, share a Google Drive link with a couple of good angles: front, side and full length.', type: 'photos' },
        ]
      : []),
    { id: 'residence', keys: ['residence'], q: 'Are you a day scholar or a hosteller?', type: 'single' },
    ...(f.residence === 'Day scholar'
      ? [{ id: 'stayBack', keys: ['stayBack'], q: 'Would you stay back after classes for a shoot, only when needed?', type: 'single' }]
      : []),
    { id: 'weekends', keys: ['weekends'], q: 'Can you work on weekends?', type: 'single' },
    { id: 'about', keys: [], q: 'Anything you’d love to make with us?', hint: 'A line or two is plenty.', type: 'textarea', optional: true },
    { id: 'confirm', keys: ['proBono', 'consent'], q: 'Last thing.', type: 'confirm' },
  ];
  const cur = Q[idx];

  useEffect(() => { window.scrollTo({ top: 0 }); if (stageRef.current) stageRef.current.scrollTop = 0; return () => clearTimeout(timer.current); }, [idx, done]);

  function errorsFor(screen, data = f) {
    const r = validate({ ...data, proBono: screen.id === 'confirm' ? data.proBono : true, consent: screen.id === 'confirm' ? data.consent : true });
    const all = r.errors || {};
    const mine = {};
    screen.keys.forEach((k) => { if (all[k]) mine[k] = all[k]; });
    return mine;
  }

  function next(data = f) {
    setFormError('');
    const e = errorsFor(cur, data);
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setDir(1);
    setIdx((i) => Math.min(i + 1, Q.length - 1));
  }
  const back = () => { setErrors({}); setFormError(''); setDir(-1); setIdx((i) => Math.max(-1, i - 1)); };

  // Single choice: save and move on automatically.
  function pick(apply) {
    setF(apply);
    setErrors({});
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setDir(1);
      setIdx((i) => i + 1);
    }, 320);
  }

  async function submit() {
    const e = errorsFor(cur);
    if (Object.keys(e).length) { setErrors(e); return; }
    setBusy(true); setFormError('');
    try {
      const res = await fetch('/api/apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) });
      const j = await res.json().catch(() => ({}));
      if (res.ok && j.ok) { setDone(true); return; }
      if (j.errors) {
        const target = Q.findIndex((s) => s.keys.some((k) => j.errors[k]));
        setErrors(j.errors);
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
        <div className="done wrap anim fwd">
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
  const enter = (e) => { if (e.key === 'Enter' && !e.shiftKey && cur.type !== 'textarea') { e.preventDefault(); next(); } };
  const textValue = { name: f.name, phone: f.phone, programme: f.programme, workLink: f.workLink, height: f.actor.height }[cur.id];
  const setText = (v) => (cur.id === 'height' ? setA('height', v) : set(cur.id, v));
  const pct = (idx / Q.length) * 100;
  const err = cur.keys.map((k) => E[k]).filter(Boolean)[0];
  const optionsFor = { gender: GENDERS, playingAge: PLAYING_AGES, residence: RESIDENCE, stayBack: YES_SOMETIMES_NO, weekends: YES_SOMETIMES_NO };
  const singleValue = { gender: f.actor.gender, playingAge: f.actor.playingAge, residence: f.residence, stayBack: f.stayBack, weekends: f.weekends }[cur.id];

  return (
    <main className="flow">
      <header className="bar">
        <button className="back" onClick={back} aria-label="Back">←</button>
        <div className="bar-logo" dangerouslySetInnerHTML={{ __html: LOGO_SVG }} />
        <div className="mono grey step-n">{idx + 1} of {Q.length}</div>
        <div className="progress"><div style={{ width: pct + '%' }} /></div>
      </header>

      <div className="stage" ref={stageRef}>
        <div key={cur.id} className={'qa anim ' + (dir > 0 ? 'fwd' : 'bwd')}>
          <div className="hp" aria-hidden="true"><input tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => set('website', e.target.value)} /></div>
          <div className="qnum mono">{String(idx + 1).padStart(2, '0')} →</div>
          <h2 className="serif q">
            {cur.q.split(' ').slice(0, -1).join(' ')}{' '}
            <span style={{ whiteSpace: 'nowrap' }}>{cur.q.split(' ').slice(-1)[0]}{!cur.optional && cur.type !== 'confirm' && <span className="req">*</span>}</span>
          </h2>
          {cur.hint && <p className="grey qhint">{cur.hint}</p>}

          {cur.type === 'text' && (
            <input className="big" autoFocus type={cur.id === 'phone' ? 'tel' : cur.id === 'workLink' ? 'url' : 'text'}
              inputMode={cur.id === 'phone' ? 'tel' : undefined} autoComplete={cur.id === 'name' ? 'name' : cur.id === 'phone' ? 'tel' : 'off'}
              autoCapitalize={cur.id === 'workLink' ? 'none' : undefined}
              placeholder={{ name: 'Type your name', phone: '98765 43210', programme: '2nd year, B.Tech CSE', workLink: 'https://', height: '5′8″' }[cur.id]}
              value={textValue} onChange={(e) => setText(e.target.value)} onKeyDown={enter} />
          )}

          {cur.type === 'textarea' && (
            <textarea className="big" autoFocus placeholder="Type here…" value={f.about} onChange={(e) => set('about', e.target.value)} />
          )}

          {cur.type === 'single' && (
            <>
              <Choices name={cur.id} options={optionsFor[cur.id]} value={singleValue}
                onPick={(v) => {
                  if (cur.id === 'gender') {
                    setA('gender', v);
                    if (v !== 'Prefer to self-describe') pick((s) => ({ ...s, actor: { ...s.actor, gender: v } }));
                  } else if (cur.id === 'playingAge') pick((s) => ({ ...s, actor: { ...s.actor, playingAge: v } }));
                  else pick((s) => ({ ...s, [cur.id]: v }));
                }} />
              {cur.id === 'gender' && f.actor.gender === 'Prefer to self-describe' && (
                <input className="big" autoFocus style={{ marginTop: 18 }} placeholder="How do you describe yourself?" value={f.actor.genderSelf}
                  onChange={(e) => setA('genderSelf', e.target.value)} onKeyDown={enter} />
              )}
            </>
          )}

          {cur.type === 'multi' && cur.id === 'roles' && (
            <>
              <Choices name="roles" multi options={ROLES} value={f.roles} onPick={(v) => set('roles', v)} />
              {f.roles.includes('Other') && (
                <input className="big" style={{ marginTop: 18 }} placeholder="What else? Sound, music, design…" value={f.roleOther}
                  onChange={(e) => set('roleOther', e.target.value)} onKeyDown={enter} />
              )}
            </>
          )}
          {cur.type === 'multi' && cur.id === 'languages' && (
            <>
              <Choices name="languages" multi options={LANGUAGES} value={f.actor.languages} onPick={(v) => setA('languages', v)} />
              {f.actor.languages.includes('Other') && (
                <input className="big" style={{ marginTop: 18 }} placeholder="Which other languages?" value={f.actor.languageOther}
                  onChange={(e) => setA('languageOther', e.target.value)} onKeyDown={enter} />
              )}
            </>
          )}

          {cur.type === 'photos' && (
            <div className="photo-opts">
              <label className="label">Instagram handle</label>
              <input className="big" autoFocus autoCapitalize="none" placeholder="@yourhandle" value={f.actor.instagram} onChange={(e) => setA('instagram', e.target.value)} onKeyDown={enter} />
              <Err msg={E['actor.instagram']} />
              <div className="or mono">or</div>
              <label className="label">Google Drive link</label>
              <input className="big" type="url" autoCapitalize="none" placeholder="https://drive.google.com/…" value={f.actor.photosLink} onChange={(e) => setA('photosLink', e.target.value)} onKeyDown={enter} />
              <div className="hint" style={{ marginTop: 8 }}>Set sharing to “Anyone with the link”.</div>
              <Err msg={E['actor.photosLink']} />
            </div>
          )}

          {cur.type === 'confirm' && (
            <div style={{ marginTop: 26 }}>
              <label className={'check' + (E.proBono ? ' bad' : '')}>
                <input type="checkbox" checked={f.proBono} onChange={(e) => set('proBono', e.target.checked)} />
                <span><b>I understand this is a pro bono, unpaid creative role.</b><br /><span className="grey">I’m in for the love of making things.</span></span>
              </label>
              <label className={'check' + (E.consent ? ' bad' : '')}>
                <input type="checkbox" checked={f.consent} onChange={(e) => set('consent', e.target.checked)} />
                <span><b>Cinematy can store my details and contact me</b> about the Content Unit.<br />
                  <span className="grey">Your details stay private. Only the Cinematy team can see them, and you can ask us to delete them anytime.</span></span>
              </label>
            </div>
          )}

          {cur.type !== 'photos' && <Err msg={cur.type === 'confirm' ? (E.proBono || E.consent) && 'Please tick both to continue.' : err} />}
          {cur.type === 'photos' && <Err msg={E['actor.photos']} />}
          {formError && <div className="formerr" style={{ marginTop: 18 }}>{formError}</div>}

        </div>
      </div>
      <footer className="qfoot">
        <div className="qnav">
          {cur.type === 'confirm' ? (
            <button className="ok" onClick={submit} disabled={busy}>{busy ? 'Sending…' : 'Count me in →'}</button>
          ) : cur.type === 'single' && !(cur.id === 'gender' && f.actor.gender === 'Prefer to self-describe') ? (
            singleValue ? <button className="ok ghost" onClick={() => next()}>Next →</button> : <span className="mono grey">Tap one to continue</span>
          ) : (
            <>
              <button className="ok" onClick={() => next()}>
                {cur.optional && !(cur.id === 'about' ? f.about : textValue) ? 'Skip →' : 'OK →'}
              </button>
              {cur.type === 'text' || cur.type === 'photos' ? <span className="mono grey enter">press Enter ↵</span> : null}
            </>
          )}
        </div>
      </footer>
    </main>
  );
}
