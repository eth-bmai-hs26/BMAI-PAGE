import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { weekends, getWeekend } from '../data/weekends';
import { ScheduleTable } from '../components/ScheduleTable';
import type { Resource } from '../types';

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
  const isPdf = resource.url.toLowerCase().endsWith('.pdf');
  return (
    <li>
      <a
        className="reslink"
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        {...(isPdf ? { download: '' } : {})}
      >
        {resource.label}
        <span className="reslink__arrow">{isPdf ? 'PDF ↓' : '↗'}</span>
      </a>
    </li>
  );
}

export function WeekendPage() {
  const { id } = useParams();
  const weekend = id ? getWeekend(id) : undefined;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

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

  const hasRealResources = weekend.resources.some((r) => r.url !== '#');

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
            {weekend.project && (
              <div>
                <dt>Project</dt>
                <dd>{weekend.project}</dd>
              </div>
            )}
          </dl>
          <p className="wdetail-head__summary">{weekend.summary}</p>
        </header>

        <div className="days">
          <ScheduleTable day="Friday" date={friDate.trim()} sessions={weekend.friday} />
          <ScheduleTable day="Saturday" date={satDate.trim()} sessions={weekend.saturday} />
        </div>

        <section className="resources">
          <h2>Materials</h2>
          <p className="resources__note">
            {hasRealResources
              ? 'Slides, notebooks and project descriptions for this weekend.'
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
