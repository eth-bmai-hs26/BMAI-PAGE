import { weekends } from './weekends';
import { addDaysISO } from '../lib/date';

export interface CourseEvent {
  uid: string;
  title: string;
  /** Inclusive ISO start date. */
  start: string;
  /** Inclusive ISO end date (same as start for single-day events). */
  end: string;
  weekendId: string;
  weekendNumber: number;
  note?: string;
}

/** Weekend events, derived from the weekend data (Friday plus Saturday). */
export const weekendEvents: CourseEvent[] = weekends.map((w) => ({
  uid: `bmai-${w.id}`,
  title: `BMAI Weekend ${w.number}: ${w.title}`,
  start: w.startISO,
  end: addDaysISO(w.startISO, 1),
  weekendId: w.id,
  weekendNumber: w.number,
  note: w.theme,
}));

export const allEvents: CourseEvent[] = [...weekendEvents].sort((a, b) =>
  a.start < b.start ? -1 : a.start > b.start ? 1 : 0,
);

/** Months the module spans (year, 0-based month): September and October 2026. */
export const calendarMonths: { year: number; month0: number }[] = [
  { year: 2026, month0: 8 },
  { year: 2026, month0: 9 },
];

/** All events overlapping a given ISO day. */
export function eventsOnDay(iso: string): CourseEvent[] {
  return allEvents.filter((e) => iso >= e.start && iso <= e.end);
}
