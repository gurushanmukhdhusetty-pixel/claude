import ApplyForm from './ApplyForm';
import { LOGO_SVG } from '@/lib/logo-svg';

export default function Page() {
  return (
    <main>
      <section className="hero">
        <div className="perf" style={{ top: 0 }} />
        <div className="wrap">
          <div className="logo" dangerouslySetInnerHTML={{ __html: LOGO_SVG }} />
          <div className="mono" style={{ color: '#8A8A8A' }}>Cinematy @ Mahindra University</div>
          <h1 className="serif">
            Calling all writers, directors, actors <i>and editors.</i>
          </h1>
          <p>
            We’re <b style={{ color: '#fff' }}>Cinematy</b>, a home for Hyderabad’s filmmakers. We’re building the{' '}
            <b style={{ color: '#fff' }}>Cinematy Content Unit at MU</b>: a crew of students who make short films, reels, skits and
            behind-the-scenes videos for Cinematy’s YouTube, Instagram and other channels.
          </p>
          <div className="facts">
            <div className="fact hl">
              <div className="mono">Heads up</div>
              <div>This is <b>pro bono, not a paid gig.</b> Not a job or an internship. It’s a crew.</div>
            </div>
            <div className="fact">
              <div className="mono">What you get</div>
              <div>Credit on everything you make, real work for your portfolio, and people to create with.</div>
            </div>
            <div className="fact">
              <div className="mono">Experience</div>
              <div>None needed. A reel you made for fun counts.</div>
            </div>
            <div className="fact">
              <div className="mono">Time</div>
              <div>About 2 minutes to apply.</div>
            </div>
          </div>
        </div>
        <div className="perf" style={{ bottom: 0 }} />
      </section>
      <div className="wrap">
        <ApplyForm />
      </div>
      <footer>
        <div className="mono grey">Cinematy · Where Hyderabad’s films begin · cinematy.in</div>
      </footer>
    </main>
  );
}
