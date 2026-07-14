# Wayfront — post Zoom booking info onto the ticket (form 152)

Script that captures the Zoom meeting details booked on the **"Schedule a Free
Assessment"** form (Wayfront form **152**, access key `EL1R6L`) and writes them
onto the ticket that the form creates.

## Why this is needed

Form 152 embeds Zoom's **native** scheduler as a cross-origin `<iframe>`
(`trusteefriend.zoom.us/zbook/alex/trusteefriend-assessment-gm…`). The booking
happens entirely inside that iframe, so nothing about the scheduled call
(date/time, join URL, invitee) is written back to the Wayfront form — the
created ticket has no record of the appointment.

The other Zoom forms (141 "Request A Call", 144 "Imagine", 149 "Submit
Information") don't have this gap: they render a **custom** scheduler backed by
`scheduler.trusteefriend.com` and write the chosen slot/planner/timezone into
**hidden fields**, which then persist onto the ticket on submit.

`form-152-zoom-to-ticket.html` brings form 152 in line with that pattern: it
listens for the Zoom Scheduler's `postMessage` "booking complete" event and
stashes the details into a hidden field, so they save onto the ticket when the
form is submitted.

## Prerequisite (one-time, in Wayfront)

Only values written into a **form-defined** field are persisted onto the ticket.
A hidden `<input>` injected purely by JavaScript is *not* saved. So:

1. Edit form 152 and add a field of type **`hidden`**.
2. Note the id Wayfront renders for it — hidden fields render as
   `<input type="hidden" id="field_<FIELD_ID>">`.
3. Set `ZOOM_FIELD_ID` at the top of the script to that id
   (e.g. `"field_7410"`).

## Deploy

Paste the contents of `form-152-zoom-to-ticket.html` into form 152's
**custom code** box (append it; don't remove the existing George/Missiha
prefill script). Or ask me to push it into `custom_code` via the Wayfront MCP.

## Confirm the Zoom event shape (important)

Zoom's Scheduler-embed `postMessage` schema is not publicly documented and could
not be exercised from the build environment, so the field mapping in
`extractBooking()` is best-effort. To finalize it:

1. Deploy the script, open the form, and open browser DevTools → Console.
2. Book a test assessment.
3. Read the logged `[zoom->ticket] message from …` entries — that is the real
   payload Zoom sends.
4. Adjust `extractBooking()` if the field paths differ. The script already
   stores the **raw** payload as a fallback, so no data is lost meanwhile.

## Open decision (needs your call)

I built the **hidden-field-on-submit** approach because it matches your other
forms and needs no server endpoint. The alternative is to POST the booking to an
API that appends it as a staff-only **ticket message** after booking — better if
you want it as a visible message rather than a saved field, but it needs a
reachable endpoint (e.g. on `scheduler.trusteefriend.com`) and the ticket
number at that point. Tell me which you want; I can also wire up the message
approach.

Also note: the ticket-status pipeline already has **40 = "Scheduled (Zoom
Created)"** / **41 = "Rescheduled (Meeting Updated)"**, which suggests a backend
may already receive Zoom events. If `scheduler.trusteefriend.com` already knows
the booking *and* the ticket it belongs to, the cleanest fix is server-side and
this front-end script may be unnecessary. Worth confirming before deploying.
