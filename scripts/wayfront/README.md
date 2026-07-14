# Wayfront form 152 → Zoom → ticket: findings & plan

Goal: get the Zoom meeting details from the **"Schedule a Free Assessment"** form
(Wayfront form **152**, access key `EL1R6L`) onto the ticket the form creates.

## What we learned (2026-07-14)

- Form 152 embeds Zoom's **native** scheduler in a cross-origin `<iframe>`
  (`trusteefriend.zoom.us/zbook/alex/trusteefriend-assessment-gm…`).
- A **front-end capture script cannot work**: Zoom's embed communicates over a
  private **MessageChannel/MessagePort**, not `window.postMessage`, so a
  parent-page `message` listener never receives the booking. Confirmed live —
  the browser console showed the booking (`Booked appt {appointmentId: …}`) with
  **no** corresponding capture, and the `MessagePort._` stack frames.
- The system is really designed as **form_data → webhook → backend**. There is
  an **active webhook (#21): `ticket.created` → `https://scheduler.trusteefriend.com/webhook`**.
  The custom-scheduler forms (141/144/149) write `zoomTime` / `plannerID` /
  `timeZone` hidden fields; that backend reads them, creates the Zoom meeting,
  and advances the ticket (→ "Scheduled (Zoom Created)" / "Booked for Initial
  Call"). Form 152's native embed sends **no** `zoomTime`, so nothing books.

## Decision: Approach B

Keep the native Zoom embed on form 152, and link the booking back to the ticket
on the **backend** by handling Zoom's own Scheduler webhook. Implementation home
is the **`TrusteeFriend/zoom-scheduler-to-wayfront-ticket`** repo (backs
`scheduler.trusteefriend.com`); `TrusteeFriend/wayfront-webhooks` is the related
Cloudflare Worker.

### Sketch of the backend work
1. Subscribe to Zoom's **Scheduler booking** webhook (booking created / updated /
   canceled) → an endpoint on `scheduler.trusteefriend.com`.
2. **Match** the booking to the right form-152 ticket. Candidate keys:
   - booker email entered in the Zoom scheduler, and/or
   - the Zoom `appointmentId`, and/or
   - the fact the ticket `source` is `EL1R6L` (form 152) and is recent/unbooked.
3. Write the Zoom details onto the ticket (message and/or `zoomTime`-style
   fields) and set status → **40 Scheduled (Zoom Created)**; handle
   reschedule/cancel → **41 / appropriate status**.

Open question to resolve first: the reliable **match key**. The Wayfront form
captures the *planning partner* (George), while the Zoom scheduler captures the
*invitee/client* — we need one shared identifier (most likely the invitee email)
present on both sides.

## Cleanup done
- The hidden field **7409 "Zoom Booking Details"** (which was leaking
  `ZOOM_BOOKING_PENDING` onto tickets) has been **removed** from form 152 via the
  Wayfront MCP. Form is back to its 7 original fields + both conditional rules.
- The front-end capture approach is abandoned (scripts removed from this repo).
  The leftover capture `<script>` still in form 152's custom code is now a no-op
  (no sentinel field to find); delete that second `<script>` block from the form
  editor at <https://trusteefriend.wayfront.com/forms/152> when convenient. The
  first (George/Missiha prefill) block should stay.
