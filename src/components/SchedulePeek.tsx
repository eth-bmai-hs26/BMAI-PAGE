import type { Weekend, Session } from '../types';

/** Headline sessions only, so the hover preview stays compact. */
const mainSessions = (sessions: Session[]): Session[] =>
  sessions.filter((s) => s.type === 'lecture' || s.type === 'project');

function PeekDay({ label, sessions }: { label: string; sessions: Session[] }) {
  const items = mainSessions(sessions);
  if (items.length === 0) return null;
  return (
    <>
      <div className="wpeek__day">{label}</div>
      {items.map((s, i) => (
        <div className="wpeek__row" key={`${label}-${i}`}>
          <span className="wpeek__time">{s.time}</span>
          <span className="wpeek__title">{s.title}</span>
        </div>
      ))}
    </>
  );
}

/** Small floating agenda preview shown when hovering a weekend block. */
export function SchedulePeek({ weekend }: { weekend: Weekend }) {
  return (
    <div className="wpeek" role="tooltip">
      <div className="wpeek__head">Agenda at a glance</div>
      <PeekDay label="Friday" sessions={weekend.friday} />
      <PeekDay label="Saturday" sessions={weekend.saturday} />
    </div>
  );
}
