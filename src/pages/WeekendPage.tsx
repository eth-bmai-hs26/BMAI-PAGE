import { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { weekends, getWeekend, weekendRoom } from '../data/weekends';
import { ScheduleTable, exercisesOfRow, rowHasDetails, rowKey } from '../components/ScheduleTable';
import { ExerciseList } from '../components/ExerciseList';
import { KindLegend } from '../components/Chips';
import { useDoneExercises } from '../lib/exercises';
import type { Resource, Weekend } from '../types';
import { downloadKind } from '../lib/links';

function ResourceLink({ resource }: { resource: Resource }) {
  const isPlaceholder = resource.url === '#';
  if (isPlaceholder) {
    return (
      <li>
        <span className="reslink reslink--placeholder">
          {resource.label}
          <span className="reslink__arrow">Soon</span>
        </span>
      </li>
    );
  }
  const kind = downloadKind(resource.url);
  return (
    <li>
      <a
        className="reslink"
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        {...(kind ? { download: '' } : {})}
      >
        {resource.label}
        <span className="reslink__arrow">
          {kind === 'pdf'
            ? 'PDF ↓'
            : kind === 'notebook'
              ? 'Notebook ↓'
              : kind === 'archive'
                ? 'ZIP ↓'
                : '↗'}
        </span>
      </a>
    </li>
  );
}

/** The rows of a weekend that have details to open, by rowKey(). */
function detailKeysOf(weekend: Weekend): string[] {
  const exercises = weekend.exercises ?? [];
  const keys = (day: string, sessions: Weekend['friday'], dayName: 'friday' | 'saturday') =>
    sessions
      .filter((s) => rowHasDetails(s, exercisesOfRow(s, exercises.filter((e) => e.day === dayName))))
      .map((s) => rowKey(day, s.time));
  return weekend.exercises === undefined
    ? []
    : [...keys('Friday', weekend.friday, 'friday'), ...keys('Saturday', weekend.saturday, 'saturday')];
}

/**
 * The rows open on arrival: none, unless the address asks for them, as
 * #/weekend/we4?details=all for every row or ?details=Friday-08:15 for one.
 */
function initialOpen(id: string | undefined, search: string): Set<string> {
  const asked = new URLSearchParams(search).get('details');
  const weekend = id ? getWeekend(id) : undefined;
  if (!asked || !weekend) return new Set();
  return new Set(asked === 'all' ? detailKeysOf(weekend) : [asked]);
}

export function WeekendPage() {
  const { id } = useParams();
  const weekend = id ? getWeekend(id) : undefined;
  const [done, toggleDone] = useDoneExercises(weekend?.id ?? '');
  const { search } = useLocation();
  const [openRows, setOpenRows] = useState<Set<string>>(() => initialOpen(id, search));

  useEffect(() => {
    window.scrollTo(0, 0);
    setOpenRows(initialOpen(id, search));
  }, [id, search]);

  if (!weekend) {
    return (
      <section className="section">
        <div className="container">
          <p>Weekend not found.</p>
          <Link to="/">← Back to all weekends</Link>
        </div>
      </section>
    );
  }

  const index = weekends.findIndex((w) => w.id === weekend.id);
  const prev = index > 0 ? weekends[index - 1] : undefined;
  const next = index < weekends.length - 1 ? weekends[index + 1] : undefined;

  const [friDate, satDate] =
    weekend.dates.split('–').length === 2
      ? weekend.dates.split('–')
      : [weekend.dates, weekend.dates];

  const exercises = weekend.exercises;
  const detailKeys = detailKeysOf(weekend);
  const allOpen = detailKeys.length > 0 && detailKeys.every((k) => openRows.has(k));
  const toggleRow = (key: string) =>
    setOpenRows((prev) => {
      const nextOpen = new Set(prev);
      if (nextOpen.has(key)) nextOpen.delete(key);
      else nextOpen.add(key);
      return nextOpen;
    });

  const hasRealResources = weekend.resources.some((r) => r.url !== '#');
  const room = weekendRoom(weekend);

  // Group resources by their optional `group`, preserving first-seen order.
  const resourceGroups: { name?: string; items: Resource[] }[] = [];
  for (const r of weekend.resources) {
    let g = resourceGroups.find((x) => x.name === r.group);
    if (!g) {
      g = { name: r.group, items: [] };
      resourceGroups.push(g);
    }
    g.items.push(r);
  }
  const isGrouped = resourceGroups.some((g) => g.name);

  return (
    <article className="section">
      <div className="container">
        <nav className="crumbs">
          <Link to="/">All weekends</Link> &nbsp;/&nbsp; Weekend {weekend.number}
        </nav>

        <header className="wdetail-head">
          <div className="wdetail-head__eyebrow">
            <span className="wdetail-head__num">Weekend {weekend.number}</span>
          </div>
          <h1>{weekend.title}</h1>
          <p className="wdetail-head__theme">{weekend.theme}</p>
          <dl className="wdetail-meta">
            <div>
              <dt>Dates</dt>
              <dd>{weekend.dates}</dd>
            </div>
            <div>
              <dt>Format</dt>
              <dd>Friday &amp; Saturday</dd>
            </div>
            {room && (
              <div>
                <dt>Room</dt>
                <dd>{room}</dd>
              </div>
            )}
            {weekend.project && (
              <div>
                <dt>Project</dt>
                <dd>{weekend.project}</dd>
              </div>
            )}
          </dl>
          <p className="wdetail-head__summary">{weekend.summary}</p>
        </header>

        {weekend.overview && (
          <section className="overview" aria-labelledby="overview-title">
            <h2 id="overview-title">{weekend.overview.title}</h2>
            {weekend.overview.note && <p className="overview__note">{weekend.overview.note}</p>}
            <div className="overview__pages">
              {weekend.overview.pages.map((p, i) => (
                <a
                  key={i}
                  className="overview__page"
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img src={p.image} alt={p.alt} />
                </a>
              ))}
            </div>
          </section>
        )}

        {exercises && (
          <div className="days__tools">
            <KindLegend />
            {detailKeys.length > 0 && (
              <button
                type="button"
                className="days__toggle"
                onClick={() => setOpenRows(allOpen ? new Set() : new Set(detailKeys))}
              >
                {allOpen ? 'Hide all details' : 'Show all details'}
              </button>
            )}
          </div>
        )}

        <div className="days">
          <ScheduleTable
            day="Friday"
            date={friDate.trim()}
            sessions={weekend.friday}
            room={weekend.fridayRoom}
            exercises={exercises?.filter((e) => e.day === 'friday')}
            done={done}
            onToggleDone={toggleDone}
            openRows={openRows}
            onToggleRow={toggleRow}
          />
          <ScheduleTable
            day="Saturday"
            date={satDate.trim()}
            sessions={weekend.saturday}
            room={weekend.saturdayRoom}
            exercises={exercises?.filter((e) => e.day === 'saturday')}
            done={done}
            onToggleDone={toggleDone}
            openRows={openRows}
            onToggleRow={toggleRow}
          />
        </div>

        {exercises && exercises.length > 0 && (
          <ExerciseList exercises={exercises} done={done} onToggle={toggleDone} />
        )}

        <section className="resources">
          <h2>Materials</h2>
          <p className="resources__note">
            {hasRealResources
              ? exercises
                ? 'Slides, visualizations and project descriptions for this weekend. The coding exercises are listed above, easiest first.'
                : 'Slides, notebooks and project descriptions for this weekend.'
              : 'Materials for this weekend will be linked here once they are uploaded.'}
          </p>
          {isGrouped ? (
            resourceGroups.map((g, gi) => (
              <div className="resgroup" key={gi}>
                {g.name && <h3 className="resgroup__title">{g.name}</h3>}
                <ul className="reslist">
                  {g.items.map((r, i) => (
                    <ResourceLink key={i} resource={r} />
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <ul className="reslist">
              {weekend.resources.map((r, i) => (
                <ResourceLink key={i} resource={r} />
              ))}
            </ul>
          )}
        </section>

        <nav className="wnav">
          {prev ? (
            <Link to={`/weekend/${prev.id}`}>
              <span className="wnav__label">Previous</span>
              Weekend {prev.number}: {prev.title}
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link to={`/weekend/${next.id}`} className="wnav__next">
              <span className="wnav__label">Next</span>
              Weekend {next.number}: {next.title}
            </Link>
          )}
        </nav>
      </div>
    </article>
  );
}
