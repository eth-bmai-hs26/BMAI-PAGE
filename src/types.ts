export type SessionType =
  | 'lecture'
  | 'exercise'
  | 'lab'
  | 'quiz'
  | 'break'
  | 'project'
  | 'tba';

export interface Session {
  time: string;
  /** Empty for slots the syllabus leaves open (rendered as a quiet placeholder row). */
  title: string;
  type: SessionType;
  /** Optional single link for this session, e.g. one notebook opened in Colab. */
  url?: string;
  /** Optional multiple labelled links, e.g. slides plus a handout. */
  links?: Resource[];
}

export interface Resource {
  label: string;
  url: string;
  /**
   * Optional sub-section heading on the weekend's Materials list, e.g.
   * "Lecture slides", "Coding exercises", "Project". Resources sharing a group
   * are rendered together under that heading, groups appear in first-seen
   * order. Resources without a group render as a single flat list.
   */
  group?: string;
  /**
   * Optional one or two sentences on what the material is, shown when a
   * schedule row is opened with its "Details" button.
   */
  description?: string;
}

/**
 * One coding notebook of a weekend. An EXERCISE has gaps to fill in and gets a
 * level and a rank: the weekend page lists the exercises easiest first, split
 * into easy and hard, and sorts them the same way on their schedule row. A DEMO
 * is a complete notebook with nothing to fill in, and gets no rank.
 *
 * Solutions are never listed here: the course site links exercises only
 * (Carlos's standing rule of 2026-10-22).
 */
export interface CodingExercise {
  day: 'friday' | 'saturday';
  /** Time of the schedule row it belongs to, e.g. '08:15'. */
  time: string;
  title: string;
  /** One line: what the participant does. Empty while it is SOON. */
  summary: string;
  /** Where it opens, or SOON while it is not uploaded. */
  url: string;
  /** A complete notebook with nothing to fill in, shown in the colour of the examples. */
  demo?: boolean;
  /** How hard the exercise is: the weekend's list splits easy from hard. */
  level?: 'easy' | 'hard';
  /** Its place in the weekend's easiest-first order, 1 being the easiest. */
  rank?: number;
  /**
   * What to open beside it when stuck: a worked example notebook (shown in the
   * colour of the examples) or a visualization (in the colour of the
   * visualizations).
   */
  reference?: Resource;
}

/**
 * One page of an `Overview`: a picture the site serves, and where a click on
 * it goes, usually the same page of a PDF.
 */
export interface OverviewPage {
  /** The picture, e.g. deck(4, 'atlas-1.png'). */
  image: string;
  /** What the picture shows, for screen readers. */
  alt: string;
  /** Where a click goes, e.g. `${deck(4, 'atlas.pdf')}#page=1`. */
  url: string;
}

/**
 * A block shown on the weekend page just before the agenda, its pages side by
 * side, e.g. weekend 4's atlas of the weekend's models.
 */
export interface Overview {
  title: string;
  /** One line under the title. */
  note?: string;
  pages: OverviewPage[];
}

export interface Weekend {
  /** Stable slug used in the URL, e.g. "we2". */
  id: string;
  number: number;
  title: string;
  /** Short theme / subtitle. */
  theme: string;
  /** Human-readable date range, e.g. "4–5 September 2026". */
  dates: string;
  /** ISO date of the Friday the weekend starts on (Saturday is the next day). */
  startISO: string;
  /** Project introduced at this weekend, if any. */
  project?: string;
  /** Authored short description of the weekend. */
  summary: string;
  /** Shown just before the agenda, if set. */
  overview?: Overview;
  /** Room / location for the Friday schedule, if known. */
  fridayRoom?: string;
  /** Room / location for the Saturday schedule, if known. */
  saturdayRoom?: string;
  friday: Session[];
  saturday: Session[];
  resources: Resource[];
  /** The weekend's coding notebooks; see CodingExercise. */
  exercises?: CodingExercise[];
}
