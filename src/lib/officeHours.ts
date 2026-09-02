/**
 * Client for the Google Apps Script Web App that fronts the office-hours Sheet.
 *
 * Reads:   GET  → `{ ok: true, bookings: [...] }`.
 * Book:    POST `{ action: 'book',   date, time, name, email }` → `{ ok: true }`.
 * Cancel:  POST `{ action: 'cancel', date, time }`             → `{ ok: true }`.
 *
 * The POST uses `Content-Type: text/plain` on purpose: it keeps the request a
 * CORS "simple request" so the browser does not fire a preflight OPTIONS call
 * (Apps Script web apps do not answer preflights). The script reads the raw
 * body from `e.postData.contents` and JSON-parses it.
 */
import { OFFICE_HOURS_API_URL, ZOOM_SLOT_SUFFIX } from '../data/officeHours';

export interface Booking {
  /** ISO timestamp set server-side when the row was created. */
  timestamp: string;
  /** Slot date, ISO `YYYY-MM-DD`. */
  date: string;
  /** Slot start time, `HH:mm`. */
  time: string;
  name: string;
  email?: string;
}

export interface BookInput {
  date: string;
  time: string;
  name: string;
  email?: string;
}

/** Whether an Apps Script URL has been configured. */
export const isConfigured = (): boolean => OFFICE_HOURS_API_URL.trim().length > 0;

function ensureConfigured(): void {
  if (!isConfigured()) throw new Error('Office-hours booking is not configured yet.');
}

/** Fetch all current bookings. */
export async function fetchBookings(): Promise<Booking[]> {
  ensureConfigured();
  const res = await fetch(OFFICE_HOURS_API_URL, { method: 'GET', redirect: 'follow' });
  if (!res.ok) throw new Error(`Could not load bookings (HTTP ${res.status}).`);
  const data: unknown = await res.json();
  if (!data || typeof data !== 'object' || !('bookings' in data)) {
    throw new Error('Unexpected response from the booking service.');
  }
  const list = (data as { bookings: unknown }).bookings;
  return Array.isArray(list) ? (list as Booking[]) : [];
}

async function post(body: Record<string, unknown>): Promise<void> {
  ensureConfigured();
  const res = await fetch(OFFICE_HOURS_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`Request failed (HTTP ${res.status}).`);
  const data: unknown = await res.json().catch(() => null);
  if (!data || typeof data !== 'object' || (data as { ok?: boolean }).ok !== true) {
    const message =
      data && typeof data === 'object' && typeof (data as { error?: string }).error === 'string'
        ? (data as { error: string }).error
        : 'The booking service rejected the request.';
    throw new Error(message);
  }
}

/** Book a slot. Throws (e.g. "That slot is already taken.") on failure. */
export function bookSlot(input: BookInput): Promise<void> {
  return post({ action: 'book', ...input });
}

/** Cancel whoever holds a slot. Anyone may cancel any slot. */
export function cancelSlot(date: string, time: string): Promise<void> {
  return post({ action: 'cancel', date, time });
}

/* ── TA Zoom links ─────────────────────────────────────────────────────────
 * Stored as ordinary rows under a reserved slot key (`TA1-ZOOM`), with the URL
 * living in the `name` column. See ZOOM_SLOT_SUFFIX in ../data/officeHours.
 */

/** Reserved slot key holding the Zoom link for a TA duty slot (`TA1` → `TA1-ZOOM`). */
export const zoomSlotFor = (taSlot: string): string => `${taSlot}${ZOOM_SLOT_SUFFIX}`;

/**
 * Accept what someone realistically pastes and return a safe absolute URL,
 * or `null` if it cannot be one. A bare `ethz.zoom.us/j/123` gains `https://`;
 * anything not http(s) (notably `javascript:`) is rejected outright.
 */
export function normalizeZoomUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
  if (!parsed.hostname.includes('.')) return null;
  return parsed.href;
}

/**
 * Set (or replace) the Zoom link on a TA slot. The backend refuses to book an
 * occupied key, so replacing means clearing first — cancelling a key that holds
 * nothing is a no-op server-side.
 */
export async function setZoomLink(date: string, taSlot: string, url: string): Promise<void> {
  const slot = zoomSlotFor(taSlot);
  await cancelSlot(date, slot);
  await bookSlot({ date, time: slot, name: url });
}

/** Remove a TA slot's Zoom link. */
export function clearZoomLink(date: string, taSlot: string): Promise<void> {
  return cancelSlot(date, zoomSlotFor(taSlot));
}
