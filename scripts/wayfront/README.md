# Wayfront form 152 → Zoom → ticket

Goal: capture the Zoom assessment booking from the **"Schedule a Free
Assessment"** flow (Wayfront form **152**, access key `EL1R6L`) onto a ticket.

## Final design (Approach B)

Form 152 is a **jump-off page**: it asks *"Do you require an Arabic translator?"*
and shows a full-page **Book** button to the matching Zoom page —

| Answer | Zoom page |
| --- | --- |
| **Yes** (translator) | `https://trusteefriend.zoom.us/zbook/alex/trusteefriend-assessment-gm` |
| **No** | `https://trusteefriend.zoom.us/zbook/alex/trusteefriend-assessment-gm-2` |

The person books inside Zoom. Zoom fires a `scheduler.scheduled_event_created`
webhook → the **`TrusteeFriend/zoom-scheduler-to-wayfront-ticket`** backend
creates the ticket (attributed to the GM Brokerage planning partner, George
Missiha), attaches the meeting details, posts a confirmation message, and sets
the status. A front-end capture script is **not** used — Zoom's native embed
talks over a private MessageChannel the parent page can't read.

## What's deployed (live) vs. pending

**Live now (done via Wayfront MCP):**
- Form 152 fields 7404 (shown on "Yes") and 7408 (shown on "No") now render the
  Book buttons to the gm / gm-2 pages instead of embedded Zoom iframes. The
  existing show/hide rules were preserved.
- The stray hidden field 7409 ("Zoom Booking Details") was removed.

**Pending (manual / deploy):**
1. **Clean the form's custom code.** The MCP can't edit `custom_code`, so the
   old no-op capture `<script>` is still there (harmless). Replace the Custom
   code box with `form-152-customcode-clean.html` (prefill only) at
   <https://trusteefriend.wayfront.com/forms/152>.
2. **Deploy the backend.** Branch **`claude/assessment-gm-zoom-to-ticket`** in
   `TrusteeFriend/zoom-scheduler-to-wayfront-ticket` adds the assessment handler
   (see that repo). Merge + deploy it to whatever runs
   `scheduler.trusteefriend.com` / the Zoom-webhook receiver.
3. **Confirm Zoom → webhook wiring.** Ensure the Zoom app's
   `scheduler.scheduled_event_created` webhook is subscribed and points at the
   receiver, and that the assessment pages emit it.
4. **Validate detection against a real payload.** The handler identifies
   assessment bookings by finding `trusteefriend-assessment-gm` in the booking
   object, and reads gm vs gm-2 for the Arabic flag. After deploy, do one test
   booking and check the `📦 Full booking object` log to confirm the slug is
   present; adjust detection if Zoom nests it differently.

## Backend behavior (implemented + unit-tested)

On an assessment booking the receiver:
- attributes it to `george@gmbrokerage.com` (looked up → Wayfront user 5050),
- subject `Assessment for {first} {last}`,
- note + `Arabic Translator` form-data field (Yes for gm, No for gm-2),
- confirmation message, status → 24 "Booked for Initial Call".

The referral flow and its filter are unchanged. Covered by
`test/assessment.test.js` (Wayfront calls stubbed): assessment gm/gm-2, referral
unchanged, non-TrusteeFriend ignored — all pass.

## Open choices you may want to revisit
- **Status:** uses 24 "Booked for Initial Call" (matches the referral flow). The
  pipeline also has 40 "Scheduled (Zoom Created)" if you'd prefer that for
  assessments.
- **Fee consent:** the "$150 fee" checkbox now sits below the Book button; since
  clicking Book navigates away, it's effectively bypassed. Remove it or move the
  consent into the flow if it needs to be acknowledged first.
