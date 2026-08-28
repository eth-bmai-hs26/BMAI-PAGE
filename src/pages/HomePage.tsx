import { Link } from 'react-router-dom';
import { weekends } from '../data/weekends';
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
