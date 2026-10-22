import type { CodingExercise, Resource, Session } from '../types';
import { SessionTypeChip } from './SessionTypeChip';
import { ExerciseChip, ExerciseItem, LinkChip } from './Chips';
import { downloadKind } from '../lib/links';
import { exerciseId, isSoon, linkKind, rowOrder } from '../lib/exercises';

interface Props {
  day: string;
  date: string;
  sessions: Session[];
  room?: string;
  /**
   * This day's coding notebooks. A weekend that has them shows its links in the
   * four colours, with a "Details" button on every row that has something to
   * describe; a weekend without them keeps the plain chips.
   */
  exercises?: CodingExercise[];
  /** Ids of the exercises ticked as done in this browser. */
  done?: string[];
  onToggleDone?: (id: string) => void;
  /** Keys of the rows whose details are open, see rowKey(). */
  openRows?: Set<string>;
  onToggleRow?: (key: string) => void;
}

export const rowKey = (day: string, time: string) => `${day}-${time}`;

/** The notebooks that belong to a schedule row: the same time, on a row that is not a break. */
export function exercisesOfRow(session: Session, exercises: CodingExercise[]): CodingExercise[] {
  if (session.type === 'break' || session.type === 'tba') return [];
  return exercises.filter((e) => e.time === session.time).sort(rowOrder);
}

/**
 * A row gets a "Details" button when there is something to describe: a link
 * with a description, or a notebook that is online. A row whose only
 * exercise is still "Soon" has nothing to open.
 */
export function rowHasDetails(session: Session, rowExercises: CodingExercise[]): boolean {
  if (session.type === 'break' || session.type === 'tba') return false;
  return (session.links ?? []).some((l) => l.description) || rowExercises.some((e) => !isSoon(e.url));
}

/** In the details a deck sits under "Slides", so its label loses that word. */
function slideTitle(link: Resource, session: Session): string {
  const bare = link.label.replace(/^Slides:\s*/, '');
  return bare === 'Slides' ? session.title : bare;
}

function DetailLink({ link, title }: { link: Resource; title: string }) {
  const isFile = downloadKind(link.url) !== null;
  return (
    <div className="ditem">
      <a
        className={`ditem__title ditem__title--${linkKind(link.url)}`}
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        {...(isFile ? { download: '' } : {})}
      >
        {title}
        <span className="srow__ext" aria-hidden="true">
          {isFile ? '↓' : '↗'}
        </span>
      </a>
      {link.description && <p className="ditem__desc">{link.description}</p>}
    </div>
  );
}

export function ScheduleTable({
  day,
  date,
  sessions,
  room,
  exercises,
  done = [],
  onToggleDone = () => {},
  openRows = new Set(),
  onToggleRow = () => {},
}: Props) {
  const typed = exercises !== undefined;
  return (
    <div className="day">
      <div className="day__head">
        <h3>{day}</h3>
        <span className="day__meta">
          <span className="day__date">{date}</span>
          {room && <span className="day__room">{room}</span>}
        </span>
      </div>
      <div className="schedule">
        {sessions.map((s, i) => {
          // Coding exercises are prefixed with "CX" to match the course convention.
          const title = s.type === 'exercise' ? `CX ${s.title}` : s.title;
          // PDFs and notebooks are offered as a download rather than opened in
          // the browser viewer. This applies to the chips below as well as the
          // title, so a deck saves the same way whether it is reached from here
          // or from the weekend's Materials list.
          const isFile = !!s.url && downloadKind(s.url) !== null;
          const quiet = s.type === 'break' || s.type === 'tba';
          const links = s.links ?? [];
          const rowExercises = typed ? exercisesOfRow(s, exercises) : [];
          const key = rowKey(day, s.time);
          const hasDetails = typed && rowHasDetails(s, rowExercises);
          const open = hasDetails && openRows.has(key);
          const slides = links.filter((l) => linkKind(l.url) === 'slides');
          const others = links.filter((l) => linkKind(l.url) !== 'slides');
          return (
            <div
              key={i}
              className={`srow${quiet ? ` srow--${s.type}` : ''}${open ? ' srow--open' : ''}`}
            >
              <div className="srow__time">{s.time}</div>
              <div className="srow__body">
                <div className="srow__head">
                  {s.url ? (
                    <a
                      className="srow__title srow__title--link"
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      {...(isFile ? { download: '' } : {})}
                    >
                      {title}
                      <span className="srow__ext" aria-hidden="true">
                        {isFile ? '↓' : '↗'}
                      </span>
                    </a>
                  ) : (
                    <span className="srow__title">{title}</span>
                  )}
                  {hasDetails && (
                    <button
                      type="button"
                      className="srow__toggle"
                      aria-expanded={open}
                      aria-controls={`details-${key}`}
                      onClick={() => onToggleRow(key)}
                    >
                      {open ? 'Hide details' : 'Details'}
                      <span className="srow__chev" aria-hidden="true">
                        ▾
                      </span>
                    </button>
                  )}
                </div>
                {s.type !== 'break' && (
                  <span className="srow__meta">
                    <SessionTypeChip type={s.type} />
                    {!open &&
                      links.map((l, j) => {
                        if (typed) return <LinkChip key={j} link={l} />;
                        const isLinkFile = downloadKind(l.url) !== null;
                        return (
                          <a
                            key={j}
                            className="srow__link"
                            href={l.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            {...(isLinkFile ? { download: '' } : {})}
                          >
                            {l.label}
                            <span className="srow__ext" aria-hidden="true">
                              {isLinkFile ? '↓' : '↗'}
                            </span>
                          </a>
                        );
                      })}
                  </span>
                )}
                {!open && rowExercises.length > 0 && (
                  <span className="srow__steps">
                    {rowExercises.map((e) => (
                      <ExerciseChip key={exerciseId(e)} ex={e} isDone={done.includes(exerciseId(e))} />
                    ))}
                  </span>
                )}
                {open && (
                  <div className="sdetail" id={`details-${key}`}>
                    {slides.length > 0 && (
                      <div className="sdetail__group">
                        <h4 className="sdetail__title">Slides</h4>
                        {slides.map((l, j) => (
                          <DetailLink key={j} link={l} title={slideTitle(l, s)} />
                        ))}
                      </div>
                    )}
                    {others.length > 0 && (
                      <div className="sdetail__group">
                        <h4 className="sdetail__title">Visualizations</h4>
                        {others.map((l, j) => (
                          <DetailLink key={j} link={l} title={l.label} />
                        ))}
                      </div>
                    )}
                    {rowExercises.length > 0 && (
                      <div className="sdetail__group">
                        <h4 className="sdetail__title">Coding exercises, easiest first</h4>
                        {rowExercises.map((e) => (
                          <ExerciseItem
                            key={exerciseId(e)}
                            ex={e}
                            isDone={done.includes(exerciseId(e))}
                            onToggle={() => onToggleDone(exerciseId(e))}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
