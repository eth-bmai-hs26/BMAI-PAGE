import type { CodingExercise, Resource } from '../types';
import { downloadKind } from '../lib/links';
import { isSoon, linkKind } from '../lib/exercises';

const DAY_LABELS: Record<CodingExercise['day'], string> = { friday: 'Fri', saturday: 'Sat' };

/**
 * A link in the colour of its kind: slides blue, visualizations orange, worked
 * examples purple. An example says so in words too, "Example:", because blue
 * and purple come close for colour-blind readers.
 */
export function LinkChip({ link, prefix }: { link: Resource; prefix?: string }) {
  if (isSoon(link.url)) {
    return (
      <span className="lchip lchip--soon">
        {link.label}
        <span className="lchip__soon">Soon</span>
      </span>
    );
  }
  const kind = linkKind(link.url);
  const isFile = downloadKind(link.url) !== null;
  const pre = prefix ?? (kind === 'example' ? 'Example:' : undefined);
  return (
    <a
      className={`lchip lchip--${kind}`}
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      {...(isFile ? { download: '' } : {})}
    >
      {pre && <span className="lchip__pre">{pre}</span>}
      {link.label}
      <span className="srow__ext" aria-hidden="true">
        {isFile ? '↓' : '↗'}
      </span>
    </a>
  );
}

/**
 * A coding exercise on its schedule row: its title in one solid chip, a tick in
 * front once it is done, and the reference to open beside it attached at the
 * end, in the reference's own colour. No rank and no level on the chip (Carlos,
 * 2026-10-23); the list under the schedule still has both.
 */
export function ExerciseChip({ ex, isDone }: { ex: CodingExercise; isDone: boolean }) {
  if (isSoon(ex.url)) {
    return (
      <span className="xchip xchip--soon">
        <span className="xchip__label">Exercise soon</span>
      </span>
    );
  }
  if (ex.demo) return <LinkChip link={{ label: ex.title, url: ex.url }} prefix="Demo:" />;
  const refKind = ex.reference ? linkKind(ex.reference.url) : null;
  return (
    <span className="xchip">
      <a className="xchip__main" href={ex.url} target="_blank" rel="noopener noreferrer">
        {isDone && <span className="xchip__done">✓</span>}
        <span className="xchip__label">
          {ex.title}
          <span className="srow__ext" aria-hidden="true">
            ↗
          </span>
        </span>
      </a>
      {ex.reference && refKind && (
        <a
          className={`xchip__ref xchip__ref--${refKind}`}
          href={ex.reference.url}
          target="_blank"
          rel="noopener noreferrer"
          title={ex.reference.label}
        >
          {refKind === 'example' ? 'Example' : 'Visualization'}
          <span className="srow__ext" aria-hidden="true">
            ↗
          </span>
        </a>
      )}
    </span>
  );
}

/**
 * A coding exercise described: its rank and level, what the participant does,
 * the reference to open beside it, and a tick remembered in this browser.
 */
export function ExerciseItem({
  ex,
  isDone,
  onToggle,
  showWhen = false,
}: {
  ex: CodingExercise;
  isDone: boolean;
  onToggle: () => void;
  showWhen?: boolean;
}) {
  const soon = isSoon(ex.url);
  const classes = ['xitem', isDone && 'xitem--done', soon && 'xitem--soon', ex.demo && 'xitem--demo']
    .filter(Boolean)
    .join(' ');
  return (
    <div className={classes}>
      <span className="xitem__rank" aria-hidden={soon || ex.demo ? true : undefined}>
        {soon || ex.demo ? '' : isDone ? '✓' : ex.rank}
      </span>
      <div className="xitem__main">
        <div className="xitem__meta">
          {ex.demo ? (
            <span className="xitem__kind xitem__kind--demo">Demo, nothing to fill in</span>
          ) : soon ? (
            <span>Not uploaded yet</span>
          ) : (
            <span className="xitem__kind">{ex.level === 'hard' ? 'Hard' : 'Easy'}</span>
          )}
          {showWhen && (
            <span>
              {DAY_LABELS[ex.day]} {ex.time}
            </span>
          )}
          {ex.url.startsWith('https://colab.research.google.com/') && <span>Colab</span>}
        </div>
        {soon ? (
          <span className="xitem__title">{ex.title}</span>
        ) : (
          <a className="xitem__title" href={ex.url} target="_blank" rel="noopener noreferrer">
            {ex.title}
            <span className="srow__ext" aria-hidden="true">
              ↗
            </span>
          </a>
        )}
        {ex.summary && <p className="xitem__desc">{ex.summary}</p>}
        {ex.reference && (
          <div className="xitem__ref">
            <span className="xitem__ref-pre">Stuck? Open beside it:</span>
            <LinkChip link={ex.reference} />
          </div>
        )}
        {!soon && !ex.demo && (
          <label className="xitem__check">
            <input type="checkbox" checked={isDone} onChange={onToggle} />
            Done
          </label>
        )}
      </div>
    </div>
  );
}

/** What the four colours mean, above the schedule. */
export function KindLegend() {
  return (
    <ul className="legend" aria-label="What the colours of the links mean">
      <li className="legend__item legend__item--slides">Slides</li>
      <li className="legend__item legend__item--viz">Visualizations</li>
      <li className="legend__item legend__item--exercise">Coding exercises</li>
      <li className="legend__item legend__item--example">Worked examples</li>
    </ul>
  );
}
