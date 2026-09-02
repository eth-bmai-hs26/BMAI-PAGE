/**
 * Office-hours slot-booking backend for the BMAI 2026 site.
 *
 * Trusted middle layer between the static website (GitHub Pages, no server) and
 * a Google Sheet. Reads/writes happen with the sheet owner's permissions, so no
 * credentials ship to the browser.
 *
 * ── Sheet layout ──────────────────────────────────────────────────────────
 * Tab named "Bookings" with this header row (row 1):
 *
 *   Timestamp | Date | Time | Name | Email
 *
 * Date is ISO `YYYY-MM-DD`, Time is `HH:mm`. One row = one booked slot.
 * (The script creates the tab + headers automatically if it is missing/empty,
 * and forces the Date/Time columns to plain-text so Sheets won't reformat them.)
 *
 * ── Deploy ────────────────────────────────────────────────────────────────
 * 1. Google Sheet → Extensions → Apps Script. Paste this file, Save.
 * 2. Deploy → New deployment → Web app.
 *      - Execute as:  Me
 *      - Who has access:  Anyone
 * 3. Copy the /exec URL into OFFICE_HOURS_API_URL in src/data/officeHours.ts.
 * Re-deploy (Deploy → Manage deployments → edit → New version) after edits.
 *
 * ── API ───────────────────────────────────────────────────────────────────
 *   GET                                        → { ok, bookings: [...] }
 *   POST { action:'book',   date,time,name,email } → { ok } | { ok:false, error }
 *   POST { action:'cancel', date,time }            → { ok }
 *
 * ── Optional shared secret (light anti-spam) ──────────────────────────────
 * Set SHARED_SECRET to a non-empty string and send the same value as `secret`
 * in the POST body. Leave '' to disable.
 */

var SHEET_NAME = 'Bookings';
var SHARED_SECRET = '';

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Timestamp', 'Date', 'Time', 'Name', 'Email']);
  }
  // Keep Date (B) and Time (C) as plain text so Sheets doesn't coerce them.
  sheet.getRange('B:C').setNumberFormat('@');
  return sheet;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function pad2_(n) {
  return (n < 10 ? '0' : '') + n;
}

/** Normalize a Date-or-string cell to ISO `YYYY-MM-DD`. */
function normDate_(v) {
  if (v instanceof Date) {
    return v.getFullYear() + '-' + pad2_(v.getMonth() + 1) + '-' + pad2_(v.getDate());
  }
  return String(v).trim();
}

/** Normalize a Date-or-string cell to `HH:mm`. */
function normTime_(v) {
  if (v instanceof Date) {
    return pad2_(v.getHours()) + ':' + pad2_(v.getMinutes());
  }
  return String(v).trim();
}

function readBookings_(sheet) {
  var values = sheet.getDataRange().getValues();
  var bookings = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var date = normDate_(row[1]);
    var time = normTime_(row[2]);
    if (!date || !time) continue;
    bookings.push({
      timestamp: row[0] instanceof Date ? row[0].toISOString() : String(row[0]),
      date: date,
      time: time,
      name: String(row[3] || ''),
      email: String(row[4] || ''),
    });
  }
  return bookings;
}

/** GET → all bookings. */
function doGet() {
  try {
    return json_({ ok: true, bookings: readBookings_(getSheet_()) });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

/** POST → book or cancel a slot. */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); // serialize writes to avoid double-booking races

    var body = {};
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }

    if (SHARED_SECRET && body.secret !== SHARED_SECRET) {
      return json_({ ok: false, error: 'Unauthorized.' });
    }

    var sheet = getSheet_();
    var date = normDate_(body.date || '');
    var time = normTime_(body.time || '');
    if (!date || !time) {
      return json_({ ok: false, error: 'Missing slot date/time.' });
    }

    var action = body.action || 'book';

    if (action === 'cancel') {
      var values = sheet.getDataRange().getValues();
      // Iterate bottom-up so row deletions don't shift indices we still need.
      for (var i = values.length - 1; i >= 1; i--) {
        if (normDate_(values[i][1]) === date && normTime_(values[i][2]) === time) {
          sheet.deleteRow(i + 1);
        }
      }
      return json_({ ok: true });
    }

    // action === 'book'
    var name = (body.name || '').toString().trim();
    if (!name) {
      return json_({ ok: false, error: 'Name is required.' });
    }
    var existing = readBookings_(sheet);
    for (var j = 0; j < existing.length; j++) {
      if (existing[j].date === date && existing[j].time === time) {
        return json_({ ok: false, error: 'That slot is already taken.' });
      }
    }
    sheet.appendRow([new Date(), date, time, name, (body.email || '').toString().trim()]);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}
