/**
 * Office-hours booking configuration.
 *
 * Bookings are stored in a Google Sheet, fronted by a Google Apps Script Web
 * App (this site is static, so the browser cannot touch the Sheet directly).
 * See `google-apps-script/office-hours.gs` for the script and deploy steps,
 * then paste the deployed Web App URL into OFFICE_HOURS_API_URL below.
 *
 * The page shows one week at a time: a grid of the days below × the time slots
 * below. Each slot can be booked by one person, and anyone can cancel any slot.
 */
export const OFFICE_HOURS_API_URL =
  'https://script.google.com/macros/s/AKfycbzqYAabmaWEo5UIrGtTJ9eC7WnzDNZWof_1ANCiW0D_AjicN3Do-sMUd1SgXXbKURE/exec';

/** Weekdays offered each week (0 = Sunday … 6 = Saturday). Tue/Wed/Thu. */
export const officeHourWeekdays: number[] = [2, 3, 4];

/** 30-minute slot start times ("HH:mm", 24h). Default: four slots, 18:00–20:00. */
export const officeHourTimes: string[] = ['18:00', '18:30', '19:00', '19:30'];

/** Number of TA "on duty" slots shown at the top of each day. */
export const officeHourTAsPerDay = 2;

/**
 * Suffix for the pseudo-slot that holds a TA's Zoom link for a given day.
 *
 * The backend is a generic `(date, time, name)` store, so — exactly like the
 * `TA1`/`TA2` duty slots — a Zoom link is just a row whose `time` is a reserved
 * key (`TA1-ZOOM`) and whose `name` column holds the URL. No schema change.
 */
export const ZOOM_SLOT_SUFFIX = '-ZOOM';

/** Monday (ISO `YYYY-MM-DD`) of the first bookable week. */
export const officeHourFirstMonday = '2026-09-07';

/** Number of consecutive weeks to offer from the first Monday. */
export const officeHourWeeks = 15;

/** Minutes per slot — used to render the end time. Keep in sync with the times above. */
export const SLOT_MINUTES = 30;
