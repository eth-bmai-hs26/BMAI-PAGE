import type { Session } from '../types';
import { SessionTypeChip } from './SessionTypeChip';

interface Props {
  day: string;
  date: string;
  sessions: Session[];
}

export function ScheduleTable({ day, date, sessions }: Props) {
  return (
    <div className="day">
      <div className="day__head">
        <h3>{day}</h3>
        <span className="day__meta">
          <span className="day__date">{date}</span>
        </span>
      </div>
      <div className="schedule">
        {sessions.map((s, i) => {
          // Coding exercises are prefixed with "CX" to match the course convention.
          const title = s.type === 'exercise' ? `CX ${s.title}` : s.title;
          // PDFs are offered as a download rather than opened in the browser viewer.
          const isPdf = !!s.url && s.url.toLowerCase().endsWith('.pdf');
          const quiet = s.type === 'break' || s.type === 'tba';
          return (
            <div key={i} className={`srow${quiet ? ` srow--${s.type}` : ''}`}>
              <div className="srow__time">{s.time}</div>
              <div className="srow__body">
                {s.url ? (
                  <a
                    className="srow__title srow__title--link"
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    {...(isPdf ? { download: '' } : {})}
                  >
                    {title}
                    <span className="srow__ext" aria-hidden="true">
                      {isPdf ? '↓' : '↗'}
                    </span>
                  </a>
                ) : (
                  <span className="srow__title">{title}</span>
                )}
                {s.type !== 'break' && (
                  <span className="srow__meta">
                    <SessionTypeChip type={s.type} />
                    {s.links?.map((l, j) => (
                      <a
                        key={j}
                        className="srow__link"
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {l.label}
                        <span className="srow__ext" aria-hidden="true">
                          ↗
                        </span>
                      </a>
                    ))}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
