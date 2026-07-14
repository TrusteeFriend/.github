# Wayfront — post Zoom booking info onto the ticket (form 152)

Captures the Zoom meeting details booked on the **"Schedule a Free Assessment"**
form (Wayfront form **152**, access key `EL1R6L`) and writes them onto the
ticket the form creates.

## Why this is needed

Form 152 embeds Zoom's **native** scheduler as a cross-origin `<iframe>`
(`trusteefriend.zoom.us/zbook/alex/trusteefriend-assessment-gm…`). The booking
happens entirely inside that iframe, so nothing about the scheduled call
(date/time, join URL, invitee) is written back to Wayfront — the created ticket
has no record of the appointment. The other Zoom forms (141/144/149) avoid this
by writing their chosen slot/planner/timezone into hidden fields.

`form-152-zoom-to-ticket.html` brings form 152 in line with that pattern: it
listens for the Zoom Scheduler's `postMessage` "booking complete" event and
stashes the details into a hidden field, which is saved onto the ticket on
submit.

## Deployment status (as of 2026-07-14)

| Piece | Status | How |
| --- | --- | --- |
| Hidden field **"Zoom Booking Details"** (field id **7409**, default `ZOOM_BOOKING_PENDING`) | ✅ Done | Added live to form 152 via the Wayfront MCP |
| The capture **custom code** | ⏳ Needs a manual paste | See below |

**Why the code isn't deployed via API:** the Wayfront MCP `form-tool` can edit
fields but has **no `custom_code` parameter**, so it cannot set a form's custom
code. Only the hidden field could be added programmatically.

## Finish deploying (one manual step)

1. Open the form editor: <https://trusteefriend.wayfront.com/forms/152>
2. Paste the **entire contents of `form-152-zoom-to-ticket.html`** into the
   form's **Custom code** box (it already includes the existing George/Missiha
   prefill script — so replace the current custom code with this file, don't
   just append).
3. Save.

The script finds the hidden field by its sentinel default value
(`ZOOM_BOOKING_PENDING`), so no field id is hard-coded; on load it clears the
sentinel so a no-booking submit sends an empty value.

## Tested

The capture script was run in headless Chromium against a mock of the form DOM
(`scratchpad/zoom_test.html`): a Zoom-origin `postMessage` booking event is
captured into field 7409 as JSON (start/end time, timezone, join URL, meeting
id, invitee name/email, host, plus the raw payload), a non-Zoom-origin message
is ignored, and the sentinel is cleared on load. Result: **PASS**.

## Confirm the real Zoom event shape (do this after pasting)

Zoom's Scheduler-embed `postMessage` schema is not publicly documented and could
not be exercised from the build environment, so the field mapping in
`extractBooking()` is best-effort. To finalize:

1. Open the live form, open DevTools → Console, and book a **test** assessment.
2. Read the `[zoom->ticket] message from …` log lines — that is the real payload.
3. If the field paths differ, adjust `extractBooking()`. The script always
   stores the **raw** payload too, so no data is lost meanwhile.

## Open question worth checking

The ticket-status pipeline already has **40 "Scheduled (Zoom Created)"** /
**41 "Rescheduled (Meeting Updated)"**, which suggests a backend may already
receive Zoom events. If `scheduler.trusteefriend.com` already knows the booking
*and* the ticket it belongs to, a server-side link would be cleaner and this
front-end capture may be redundant. Worth confirming.

## Alternative not taken

Posting the booking as a staff-only **ticket message** via an API after booking
(instead of a hidden field). That needs a reachable endpoint and the ticket
number at booking time; the hidden-field approach needs neither and matches the
existing forms. Say the word if you'd prefer the message approach instead.
