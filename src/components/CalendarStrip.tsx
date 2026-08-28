import { Link } from 'react-router-dom';
import { weekends } from '../data/weekends';

/** Compact chronological strip of all weekends. */
export function CalendarStrip() {
  return (
    <div className="calstrip">
      {weekends.map((w) => (
        <Link key={w.id} to={`/weekend/${w.id}`} className="calstrip__cell">
          <div className="calstrip__num">WE{w.number}</div>
          <div className="calstrip__date">{w.dates.replace(' 2026', '')}</div>
          <div className="calstrip__title">{w.title}</div>
          {w.project && <span className="calstrip__project">{w.project}</span>}
        </Link>
      ))}
    </div>
  );
}
