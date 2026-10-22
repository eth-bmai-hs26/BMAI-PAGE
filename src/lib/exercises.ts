import { useEffect, useState } from 'react';
import type { CodingExercise } from '../types';
import { downloadKind } from './links';

/** SOON, the placeholder for material not uploaded yet. */
export const isSoon = (url: string): boolean => url === '#';

/**
 * The four colours of the weekend page, one per kind of material: slides,
 * visualizations, coding exercises and worked examples. A link's kind follows
 * from its address: a PDF is slides, a Colab notebook is an example, anything
 * else (a page in the browser) is a visualization. Exercises are never plain
 * links, they come from a weekend's `exercises`.
 */
export type LinkKind = 'slides' | 'viz' | 'example';

export function linkKind(url: string): LinkKind {
  if (downloadKind(url) === 'pdf') return 'slides';
  if (url.startsWith('https://colab.research.google.com/')) return 'example';
  return 'viz';
}

/**
 * The order a schedule row shows its notebooks in: the ranked exercises
 * easiest first, then the demos, then what is still SOON.
 */
export function rowOrder(a: CodingExercise, b: CodingExercise): number {
  const group = (e: CodingExercise) => (isSoon(e.url) ? 2 : e.demo ? 1 : 0);
  return group(a) - group(b) || (a.rank ?? 0) - (b.rank ?? 0);
}

/** An exercise is remembered by its address, so adding one does not move the ticks. */
export const exerciseId = (e: CodingExercise): string =>
  !isSoon(e.url) ? e.url : `${e.day} ${e.time} ${e.title}`;

/**
 * The ticks live in this browser only, under one key per weekend. Storage can
 * be missing or throw (a private window, blocked site data), so every read and
 * write is guarded and the page still works without it.
 */
const storageKey = (weekendId: string) => `bmai-hs26:done:${weekendId}`;

function loadDone(key: string): string[] {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** The exercises of a weekend ticked as done in this browser, and a way to tick one. */
export function useDoneExercises(weekendId: string): [string[], (id: string) => void] {
  const key = storageKey(weekendId);
  const [done, setDone] = useState<string[]>(() => loadDone(key));

  useEffect(() => {
    setDone(loadDone(key));
  }, [key]);

  const toggle = (id: string) => {
    const next = done.includes(id) ? done.filter((x) => x !== id) : [...done, id];
    setDone(next);
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // No storage here: the tick still shows until the page is left.
    }
  };

  return [done, toggle];
}
