import type { SessionType } from '../types';

const LABELS: Record<SessionType, string> = {
  lecture: 'Lecture',
  exercise: 'Coding Exercise',
  lab: 'Lab Session',
  quiz: 'Quiz',
  project: 'Project',
  break: 'Break',
  tba: 'To be announced',
};

export function SessionTypeChip({ type }: { type: SessionType }) {
  return <span className={`chip chip--${type}`}>{LABELS[type]}</span>;
}

export { LABELS as sessionTypeLabels };
