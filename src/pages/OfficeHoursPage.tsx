import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  OFFICE_HOURS_API_URL,
  SLOT_MINUTES,
  officeHourFirstMonday,
  officeHourTAsPerDay,
  officeHourTimes,
  officeHourWeekdays,
  officeHourWeeks,
} from '../data/officeHours';
import {
  bookSlot,
  cancelSlot,
  clearZoomLink,
  fetchBookings,
  isConfigured,
  normalizeZoomUrl,
  setZoomLink,
  zoomSlotFor,
  type Booking,
} from '../lib/officeHours';
import { MONTH_NAMES, WEEKDAYS_SHORT, addDaysISO, pad2 } from '../lib/date';

/** How often (ms) to refresh so the grid stays close to live. */
const POLL_MS = 20_000;

const NAME_KEY = 'bmai-oh-name';
const slotKey = (date: string, time: string): string => `${date} ${time}`;

/** Internal slot keys for the per-day TA "on duty" assignments (stored like bookings). */
const taSlots = Array.from({ length: officeHourTAsPerDay }, (_, i) => `TA${i + 1}`);

/** Offset in days from the week's Monday for a JS weekday (0=Sun…6=Sat). */
const offsetFromMonday = (weekday: number): number => (weekday - 1 + 7) % 7;

/** "18:00" → "18:00–18:30" using the configured slot length. */
function slotRange(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + SLOT_MINUTES;
  return `${time}–${pad2(Math.floor(total / 60) % 24)}:${pad2(total % 60)}`;
}

/** "2026-09-08" → "Tue 8 Sep". */
function shortDay(iso: string): { wd: string; dm: string } {
  const [y, m, d] = iso.split('-').map(Number);
  const js = new Date(y, m - 1, d).getDay();
  const wd = WEEKDAYS_SHORT[(js + 6) % 7];
  return { wd, dm: `${d} ${MONTH_NAMES[m - 1].slice(0, 3)}` };
}

export function OfficeHoursPage() {
  const configured = isConfigured();

  // Days offered each week, sorted in calendar order (Mon→Sun).
  const sortedWeekdays = useMemo(
    () => [...officeHourWeekdays].sort((a, b) => offsetFromMonday(a) - offsetFromMonday(b)),
    [],
  );

  const [weekIndex, setWeekIndex] = useState(0);
  const weekMonday = useMemo(
    () => addDaysISO(officeHourFirstMonday, weekIndex * 7),
    [weekIndex],
  );
  const days = useMemo(
    () => sortedWeekdays.map((wd) => addDaysISO(weekMonday, offsetFromMonday(wd))),
    [sortedWeekdays, weekMonday],
  );

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(configured);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null); // slot key currently in flight

  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) ?? '');
  const [email, setEmail] = useState('');

  // Zoom-link editor: which TA slot's input is open, and its current draft.
  const [zoomEditing, setZoomEditing] = useState<string | null>(null);
  const [zoomDraft, setZoomDraft] = useState('');

  const todayISO = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }, []);

  const bySlot = useMemo(() => {
    const map = new Map<string, Booking>();
    for (const b of bookings) map.set(slotKey(b.date, b.time), b);
    return map;
  }, [bookings]);

  const load = useCallback(async () => {
    try {
      setBookings(await fetchBookings());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load bookings.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    if (!configured) return;
    loadRef.current();
    const id = window.setInterval(() => loadRef.current(), POLL_MS);
    return () => window.clearInterval(id);
  }, [configured]);

  useEffect(() => {
    localStorage.setItem(NAME_KEY, name);
  }, [name]);

  async function handleBook(date: string, time: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Enter your name at the top before booking a slot.');
      return;
    }
    const key = slotKey(date, time);
    setActing(key);
    setError(null);
    try {
      await bookSlot({ date, time, name: trimmed, email: email.trim() || undefined });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed.');
      await load(); // re-sync in case someone else took it
    } finally {
      setActing(null);
    }
  }

  async function handleCancel(date: string, time: string, who: string) {
    if (!window.confirm(`Cancel the booking by ${who} on this slot?`)) return;
    const key = slotKey(date, time);
    setActing(key);
    setError(null);
    try {
      await cancelSlot(date, time);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not cancel.');
    } finally {
      setActing(null);
    }
  }

  /** Removing a TA also removes their Zoom link, so no orphan row is left behind. */
  async function handleCancelTA(date: string, taSlot: string, who: string) {
    if (!window.confirm(`Remove ${who} as TA on duty for this day?`)) return;
    const key = slotKey(date, taSlot);
    setActing(key);
    setError(null);
    try {
      await cancelSlot(date, taSlot);
      await clearZoomLink(date, taSlot);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove the TA.');
      await load();
    } finally {
      setActing(null);
    }
  }

  function openZoomEditor(key: string, current: string) {
    setZoomEditing(key);
    setZoomDraft(current);
    setError(null);
  }

  async function handleSaveZoom(date: string, taSlot: string) {
    const url = normalizeZoomUrl(zoomDraft);
    if (!url) {
      setError('Enter a valid meeting link, e.g. https://ethz.zoom.us/j/1234567890');
      return;
    }
    const key = slotKey(date, zoomSlotFor(taSlot));
    setActing(key);
    setError(null);
    try {
      await setZoomLink(date, taSlot, url);
      setZoomEditing(null);
      setZoomDraft('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the link.');
      await load();
    } finally {
      setActing(null);
    }
  }

  async function handleClearZoom(date: string, taSlot: string) {
    if (!window.confirm('Remove the Zoom link for this TA?')) return;
    const key = slotKey(date, zoomSlotFor(taSlot));
    setActing(key);
    setError(null);
    try {
      await clearZoomLink(date, taSlot);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove the link.');
    } finally {
      setActing(null);
    }
  }

  const weekLabel = `${shortDay(days[0] ?? weekMonday).wd} ${shortDay(days[0] ?? weekMonday).dm}`;

  return (
    <article className="section">
      <div className="container">
        <div className="section__head">
          <p className="eyebrow">ETH Zürich · Autumn semester 2026</p>
          <h2 style={{ fontSize: '1.9rem' }}>Office hours booking</h2>
          <p>
            Enter your name first, then click an open slot to book it — or add yourself as a TA on
            duty for a day (two per day). TAs on duty can attach their own meeting link, which
            students see under their name. The grid updates automatically for everyone; anyone can
            cancel a booking.
          </p>
        </div>

        {!configured ? (
          <div className="notice">
            <h3 className="notice__title">Booking is not live yet</h3>
            <p>
              Set the Google Apps Script Web App URL in <code>src/data/officeHours.ts</code>{' '}
              (currently <code>{OFFICE_HOURS_API_URL || 'empty'}</code>) to enable booking.
            </p>
          </div>
        ) : (
          <>
            {/* Identity */}
            <div className="oh-id">
              <label className="field oh-id__field">
                <span className="field__label">
                  Your name <span className="field__req">*</span>
                </span>
                <input
                  className="field__input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Anna Müller"
                  autoComplete="name"
                />
              </label>
              <label className="field oh-id__field">
                <span className="field__label">Email (optional)</span>
                <input
                  className="field__input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </label>
            </div>

            {/* Week navigator */}
            <div className="oh-weeknav">
              <button
                className="btn btn--ghost"
                type="button"
                onClick={() => setWeekIndex((w) => Math.max(0, w - 1))}
                disabled={weekIndex === 0}
              >
                ‹ Previous
              </button>
              <span className="oh-weeknav__label">Week of {weekLabel}</span>
              <button
                className="btn btn--ghost"
                type="button"
                onClick={() => setWeekIndex((w) => Math.min(officeHourWeeks - 1, w + 1))}
                disabled={weekIndex >= officeHourWeeks - 1}
              >
                Next ›
              </button>
            </div>

            {error && <p className="oh-msg oh-msg--err oh-banner">{error}</p>}

            {/* Slot grid */}
            <div
              className={`oh-grid-area${loading ? ' oh-grid-area--loading' : ''}`}
              aria-busy={loading}
            >
              <table className="oh-grid">
                <thead>
                  <tr>
                    <th className="oh-grid__corner">Time</th>
                    {days.map((d) => {
                      const { wd, dm } = shortDay(d);
                      return (
                        <th
                          key={d}
                          className={`oh-grid__day${d === todayISO ? ' oh-grid__day--today' : ''}`}
                        >
                          <span className="oh-grid__wd">{wd}</span>
                          <span className="oh-grid__dm">{dm}</span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {/* TAs on duty — two assignable slots per day */}
                  {taSlots.length > 0 && (
                    <tr className="oh-ta-row">
                      <th className="oh-grid__time oh-grid__time--ta" scope="row">
                        TAs on duty
                      </th>
                      {days.map((date) => (
                        <td key={`ta-${date}`} className="oh-cell oh-ta-cell">
                          <div className="oh-ta">
                            {taSlots.map((ta) => {
                              const key = slotKey(date, ta);
                              const booking = bySlot.get(key);
                              const busy = acting === key;
                              if (!booking) {
                                return (
                                  <button
                                    key={key}
                                    className="oh-tile oh-tile--ta-book"
                                    type="button"
                                    onClick={() => handleBook(date, ta)}
                                    disabled={busy || loading}
                                  >
                                    <span className="oh-tile__book-label">
                                      {busy ? 'Saving…' : '+ TA'}
                                    </span>
                                  </button>
                                );
                              }
                              // A TA on duty: name tile, with their own Zoom link beneath it.
                              const zKey = slotKey(date, zoomSlotFor(ta));
                              const zoom = bySlot.get(zKey);
                              const zBusy = acting === zKey;
                              const editing = zoomEditing === zKey;
                              return (
                                <div key={key} className="oh-ta-slot">
                                  <div className="oh-tile oh-tile--ta-taken">
                                    <span className="oh-tile__name" title={booking.name}>
                                      {booking.name}
                                    </span>
                                    <button
                                      className="oh-tile__cancel"
                                      type="button"
                                      onClick={() => handleCancelTA(date, ta, booking.name)}
                                      disabled={busy || loading}
                                      aria-label={`Remove TA ${booking.name}`}
                                      title="Remove this TA"
                                    >
                                      {busy ? '…' : '✕'}
                                    </button>
                                  </div>

                                  {editing ? (
                                    <form
                                      className="oh-zoom-edit"
                                      onSubmit={(e) => {
                                        e.preventDefault();
                                        handleSaveZoom(date, ta);
                                      }}
                                    >
                                      <input
                                        className="oh-zoom-edit__input"
                                        type="text"
                                        value={zoomDraft}
                                        onChange={(e) => setZoomDraft(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Escape') setZoomEditing(null);
                                        }}
                                        placeholder="https://ethz.zoom.us/j/…"
                                        aria-label={`Meeting link for ${booking.name}`}
                                        autoFocus
                                      />
                                      <div className="oh-zoom-edit__actions">
                                        <button
                                          className="oh-zoom-btn oh-zoom-btn--save"
                                          type="submit"
                                          disabled={zBusy}
                                        >
                                          {zBusy ? 'Saving…' : 'Save'}
                                        </button>
                                        <button
                                          className="oh-zoom-btn"
                                          type="button"
                                          onClick={() => setZoomEditing(null)}
                                          disabled={zBusy}
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </form>
                                  ) : zoom ? (
                                    <div className="oh-zoom">
                                      <a
                                        className="oh-zoom__link"
                                        href={zoom.name}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title={zoom.name}
                                      >
                                        Join meeting
                                      </a>
                                      <button
                                        className="oh-zoom__act"
                                        type="button"
                                        onClick={() => openZoomEditor(zKey, zoom.name)}
                                        disabled={zBusy || loading}
                                        title="Change this link"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        className="oh-zoom__act oh-zoom__act--clear"
                                        type="button"
                                        onClick={() => handleClearZoom(date, ta)}
                                        disabled={zBusy || loading}
                                        aria-label="Remove meeting link"
                                        title="Remove this link"
                                      >
                                        {zBusy ? '…' : '✕'}
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      className="oh-zoom-add"
                                      type="button"
                                      onClick={() => openZoomEditor(zKey, '')}
                                      disabled={zBusy || loading}
                                    >
                                      + Meeting link
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      ))}
                    </tr>
                  )}
                  {officeHourTimes.map((time) => (
                    <tr key={time}>
                      <th className="oh-grid__time" scope="row">
                        {slotRange(time)}
                      </th>
                      {days.map((date) => {
                        const key = slotKey(date, time);
                        const booking = bySlot.get(key);
                        const busy = acting === key;
                        const todayCell = date === todayISO ? ' oh-cell--today' : '';
                        if (booking) {
                          const mine = booking.name.trim() === name.trim() && name.trim() !== '';
                          return (
                            <td key={key} className={`oh-cell oh-cell--taken${todayCell}`}>
                              <div className={`oh-tile oh-tile--taken${mine ? ' oh-tile--mine' : ''}`}>
                                <span className="oh-tile__name" title={booking.name}>
                                  {booking.name}
                                </span>
                                <button
                                  className="oh-tile__cancel"
                                  type="button"
                                  onClick={() => handleCancel(date, time, booking.name)}
                                  disabled={busy || loading}
                                  aria-label={`Cancel booking by ${booking.name}`}
                                  title="Cancel this booking"
                                >
                                  {busy ? '…' : '✕'}
                                </button>
                              </div>
                            </td>
                          );
                        }
                        return (
                          <td key={key} className={`oh-cell oh-cell--free${todayCell}`}>
                            <button
                              className="oh-tile oh-tile--book"
                              type="button"
                              onClick={() => handleBook(date, time)}
                              disabled={busy || loading}
                            >
                              <span className="oh-tile__book-label">
                                {busy ? 'Booking…' : 'Book'}
                              </span>
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>

              {loading && (
                <div className="oh-loading" role="status">
                  <span className="oh-spinner" aria-hidden="true" />
                  <span className="oh-loading__text">Loading bookings…</span>
                </div>
              )}
            </div>

            <div className="oh-legend">
              <span className="oh-legend__item">
                <span className="oh-legend__swatch oh-legend__swatch--free" /> Available
              </span>
              <span className="oh-legend__item">
                <span className="oh-legend__swatch oh-legend__swatch--taken" /> Booked
              </span>
              <span className="oh-legend__item">
                <span className="oh-legend__swatch oh-legend__swatch--mine" /> Your booking
              </span>
              <span className="oh-legend__item">
                <span className="oh-legend__swatch oh-legend__swatch--ta" /> TA on duty
              </span>
              <span className="oh-legend__hint">Anyone can cancel any booking.</span>
            </div>
          </>
        )}
      </div>
    </article>
  );
}
