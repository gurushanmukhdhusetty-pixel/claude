'use client';
import { useState } from 'react';
import { ROLES, GENDERS, PLAYING_AGES, LANGUAGES, RESIDENCE, YES_SOMETIMES_NO } from '@/lib/schema';

const EMPTY = {
  name: '', phone: '', programme: '', roles: [], roleOther: '', workLink: '', about: '',
  actor: { gender: '', genderSelf: '', playingAge: '', height: '', languages: [], languageOther: '', instagram: '', photosLink: '' },
  residence: '', stayBack: '', weekends: '', proBono: false, consent: false, website: '',
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
            <input
              type={multi ? 'checkbox' : 'radio'}
              name={name}
              checked={checked}
              onChange={() => onChange(multi ? (checked ? value.filter((x) => x !== o) : [...value, o]) : o)}
            />
            <span>{o}</span>
          </label>
        );
      })}
    </div>
  );
}

export default function ApplyForm() {
  const [f, setF] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState('');

  const drop = (...keys) => setErrors((e) => { if (!keys.some((k) => e[k])) return e; const n = { ...e }; keys.forEach((k) => delete n[k]); return n; });
  const set = (k, v) => { setF((s) => ({ ...s, [k]: v })); drop(k); };
  const setA = (k, v) => { setF((s) => ({ ...s, actor: { ...s.actor, [k]: v } })); drop('actor.' + k, 'actor.photos'); };
  const isActor = f.roles.includes('Acting');

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setFormError('');
    try {
      const res = await fetch('/api/apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) });
      const j = await res.json().catch(() => ({}));
      if (res.ok && j.ok) {
        setDone(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (j.errors) {
        setErrors(j.errors);
        setFormError('A few things need a look. They’re marked in red.');
        const first = document.querySelector('.field.bad, .check.bad, .err');
        if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else setFormError(j.error || 'Something went wrong. Please try again.');
    } catch {
      setFormError('Couldn’t reach the server. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  if (done)
    return (
      <div className="done">
        <div className="mono grey">Application received</div>
        <h2 className="serif">
          You’re in! <i>🎬</i>
        </h2>
        <p>Thanks for raising your hand. Someone from the Cinematy team will reach out on WhatsApp soon.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a className="btn solid" href="https://cinematy.in" target="_blank" rel="noreferrer">
            <span className="dot" /> Join the waitlist · cinematy.in
          </a>
        </div>
        <div className="mono grey" style={{ marginTop: 40 }}>Lights. Camera. MU.</div>
      </div>
    );

  const E = errors;
  return (
    <form onSubmit={submit} noValidate>
      <div className="hp" aria-hidden="true">
        <label>
          Website <input tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => set('website', e.target.value)} />
        </label>
      </div>

      <section className="sec">
        <div className="sec-h">
          <span className="mono">01</span>
          <h2 className="serif">About <i>you</i></h2>
        </div>
        <Field label="Full name" req error={E.name}>
          <input type="text" autoComplete="name" value={f.name} onChange={(e) => set('name', e.target.value)} />
        </Field>
        <Field label="WhatsApp number" req hint="We’ll reach out here." error={E.phone}>
          <input type="tel" inputMode="tel" autoComplete="tel" placeholder="98765 43210" value={f.phone} onChange={(e) => set('phone', e.target.value)} />
        </Field>
        <Field label="Year and programme" req hint="e.g. 2nd year, B.Tech CSE" error={E.programme}>
          <input type="text" value={f.programme} onChange={(e) => set('programme', e.target.value)} />
        </Field>
      </section>

      <section className="sec">
        <div className="sec-h">
          <span className="mono">02</span>
          <h2 className="serif">What you <i>do</i></h2>
        </div>
        <Field label="What do you want to do?" req hint="Pick as many as you like." error={E.roles}>
          <Chips name="roles" multi options={ROLES} value={f.roles} onChange={(v) => set('roles', v)} />
        </Field>
        {f.roles.includes('Other') && (
          <Field label="What else do you do?" req error={E.roleOther}>
            <input type="text" placeholder="Sound, music, design…" value={f.roleOther} onChange={(e) => set('roleOther', e.target.value)} />
          </Field>
        )}

        {isActor && (
          <div className="actor">
            <div className="pill solid tag">For actors</div>
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
            <div className={'field' + (E['actor.photos'] ? ' bad' : '')}>
              <label className="label">
                Your photos<span className="req">*</span>
              </label>
              <div className="hint">If your Instagram has clear photos of you, that’s enough. If not, share a Google Drive link with a couple of good angles: front, side and full length.</div>
            </div>
            <Field label="Instagram handle" error={E['actor.instagram']}>
              <input type="text" placeholder="@yourhandle" autoCapitalize="none" value={f.actor.instagram} onChange={(e) => setA('instagram', e.target.value)} />
            </Field>
            <div className="or mono">or</div>
            <Field label="Google Drive link" hint="Set sharing to “Anyone with the link”." error={E['actor.photosLink']}>
              <input type="url" placeholder="https://drive.google.com/…" autoCapitalize="none" value={f.actor.photosLink} onChange={(e) => setA('photosLink', e.target.value)} />
            </Field>
            {E['actor.photos'] && <div className="err" style={{ margin: '-10px 0 22px' }}>{E['actor.photos']}</div>}
          </div>
        )}

        <Field label="Share your work" hint="A portfolio, Instagram, YouTube or Drive link, anything. You don’t need to be a pro: a class project or a reel you made for fun counts. No link? Skip it." error={E.workLink}>
          <input type="url" placeholder="https://" autoCapitalize="none" value={f.workLink} onChange={(e) => set('workLink', e.target.value)} />
        </Field>
        <Field label="Anything you’d like to make with us?" hint="Optional. A line or two is plenty.">
          <textarea value={f.about} onChange={(e) => set('about', e.target.value)} />
        </Field>
      </section>

      <section className="sec">
        <div className="sec-h">
          <span className="mono">03</span>
          <h2 className="serif">Your <i>schedule</i></h2>
        </div>
        <Field label="Are you a day scholar or a hosteller?" req error={E.residence}>
          <Chips name="residence" options={RESIDENCE} value={f.residence} onChange={(v) => set('residence', v)} />
        </Field>
        {f.residence === 'Day scholar' && (
          <Field label="Would you stay back after classes for a shoot, only when needed?" req error={E.stayBack}>
            <Chips name="stayBack" options={YES_SOMETIMES_NO} value={f.stayBack} onChange={(v) => set('stayBack', v)} />
          </Field>
        )}
        <Field label="Can you work on weekends?" req error={E.weekends}>
          <Chips name="weekends" options={YES_SOMETIMES_NO} value={f.weekends} onChange={(v) => set('weekends', v)} />
        </Field>
      </section>

      <section className="sec">
        <div className="sec-h">
          <span className="mono">04</span>
          <h2 className="serif">One <i>last thing</i></h2>
        </div>
        <label className={'check' + (E.proBono ? ' bad' : '')}>
          <input type="checkbox" checked={f.proBono} onChange={(e) => set('proBono', e.target.checked)} />
          <span>
            <b>I understand this is a pro bono, unpaid creative role.</b>
            <br />
            <span className="grey">I’m in for the love of making things.</span>
          </span>
        </label>
        <Err msg={E.proBono} />
        <label className={'check' + (E.consent ? ' bad' : '')}>
          <input type="checkbox" checked={f.consent} onChange={(e) => set('consent', e.target.checked)} />
          <span>
            <b>Cinematy can store my details and contact me</b> about the Content Unit.
            <br />
            <span className="grey">Your details stay private. Only the Cinematy team can see them, and you can ask us to delete them anytime.</span>
          </span>
        </label>
        <Err msg={E.consent} />
      </section>

      {formError && <div className="formerr">{formError}</div>}
      <button className="submit" type="submit" disabled={busy}>
        {busy ? 'Sending…' : 'Count me in →'}
      </button>
    </form>
  );
}
