# Rooms, BMAI HS26

Provenance for the `fridayRoom` / `saturdayRoom` fields in `src/data/weekends.ts`.

Course: **273-0003-00L, Building ML/AI Applications**, autumn semester 2026, block course, 36s Std.,
C. Cotrini Jimenez and A. Beuret.

Source: the official ETH course catalogue (Vorlesungsverzeichnis) entry, *Lehrveranstaltungen* view —
https://vvz.ethz.ch/Vorlesungsverzeichnis/lerneinheit.view?lerneinheitId=204814&semkez=2026W&ansicht=LEHRVERANSTALTUNGEN&lang=de

Checked 3 September 2026.

## Confirmed rooms

| Weekend | Friday | Room | Saturday | Room |
| - | - | - | - | - |
| 1 | Fri 04.09.2026, 08:15–17:00 | HG D 7.2 | Sat 05.09.2026, 08:15–13:00 | HG D 7.2 |
| 2 | Fri 18.09.2026, 08:15–17:00 | HG D 7.2 | Sat 19.09.2026, 08:15–13:00 | HG D 7.2 |
| 3 | Fri 02.10.2026, 08:15–17:00 | HG D 7.2 | Sat 03.10.2026, 08:15–13:00 | HG D 7.2 |
| 4 | Fri 23.10.2026, 08:15–17:00 | HG D 7.2 | Sat 24.10.2026, 08:15–13:00 | HG D 7.2 |

**All eight sessions are in the same room, HG D 7.2** — the VVZ entry lists exactly one
Lehrveranstaltung (`273-0003-00 V`) and one room token across the whole page. Unlike FDD 2026, no
weekend changes room, and no weekend leaves the HG building.

HG D 7.2 is in the ETH main building (Hauptgebäude), floor D.

### Note on the times

VVZ gives the academic quarter-hour start, 08:15. The site's schedules start at 08:00, which is what
the course actually runs and what the room reservation covers. That discrepancy is expected — VVZ
publishes the nominal slot, not the reservation.

## Updating

1. Re-check the VVZ link above, or the room-reservation confirmation from the administration.
2. Update `fridayRoom` / `saturdayRoom` for that weekend in `src/data/weekends.ts`.

Nothing else needs touching: the weekend cards on the home page and the schedule tables on each
weekend page read those two fields through the `weekendRoom()` helper, which collapses to a single
label when Friday and Saturday match and renders `Fri X · Sat Y` when they differ.
