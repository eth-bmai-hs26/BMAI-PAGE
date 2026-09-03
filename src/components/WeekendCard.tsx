import { Link } from 'react-router-dom';
import type { Weekend } from '../types';
import { weekendRoom } from '../data/weekends';
import { SchedulePeek } from './SchedulePeek';

export function WeekendCard({ weekend }: { weekend: Weekend }) {
  const room = weekendRoom(weekend);
  return (
    <Link to={`/weekend/${weekend.id}`} className="wcard">
      <div className="wcard__top">
        <span className="wcard__num">Weekend {weekend.number}</span>
        <span className="wcard__meta">
          <span className="wcard__dates">{weekend.dates}</span>
          {room && <span className="wcard__room">{room}</span>}
        </span>
      </div>
      <h3 className="wcard__title">{weekend.title}</h3>
      <p className="wcard__theme">{weekend.theme}</p>
      {weekend.project && <p className="wcard__project">Project: {weekend.project}</p>}
      <span className="wcard__cta">View agenda</span>

      <SchedulePeek weekend={weekend} />
    </Link>
  );
}
