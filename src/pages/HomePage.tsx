import { Link } from 'react-router-dom';
import { weekends, deck } from '../data/weekends';
import { WeekendCard } from '../components/WeekendCard';
import { CalendarStrip } from '../components/CalendarStrip';

export function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="container">
          <div className="hero__inner">
            <p className="eyebrow">ETH Zürich · Autumn semester 2026</p>
            <h1>Building Machine Learning and AI Applications</h1>
            <div className="hero__rule" />
            <p className="hero__lead">
              Four weekends of lectures, coding exercises and projects, working from the
              optimization and neural network foundations through language models and agents to
              computer vision and generative models.
            </p>
            <dl className="hero__meta">
              <div>
                <dt>Weekends</dt>
                <dd>4</dd>
              </div>
              <div>
                <dt>Period</dt>
                <dd>4 September – 24 October 2026</dd>
              </div>
              <div>
                <dt>Format</dt>
                <dd>Friday &amp; Saturday, 08:00 to 17:00</dd>
              </div>
            </dl>
            {/*
              The intro and administration deck sits by the title, not buried in
              weekend 1's Materials list, because it answers what a participant
              asks first: how the course is passed, what the deadline is, how the
              projects work. Same placement as the FDD site.

              download rather than a plain link: every other PDF on this site is
              offered as a download, and FDD's equivalent button points at
              raw.githubusercontent.com, which serves a PDF as an attachment
              anyway. So this matches both.
            */}
            <div className="hero__cta">
              <a
                className="btn btn--ghost"
                href={deck(1, 'intro-and-onboarding.pdf')}
                target="_blank"
                rel="noopener noreferrer"
                download=""
              >
                Course intro &amp; administration slides (PDF)
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section__head">
            <h2>The four weekends</h2>
            <p>Select a weekend to see its full agenda and materials.</p>
          </div>

          <div className="card-grid">
            {weekends.map((w) => (
              <WeekendCard key={w.id} weekend={w} />
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section__head">
            <h2>Course calendar</h2>
            <p>Chronological overview of all weekends.</p>
          </div>
          <CalendarStrip />
          <div className="section__cta">
            <Link to="/calendar" className="btn">
              Open full calendar
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
