# GM Assessment one-pager

`index.html` is a self-contained "Schedule a Free Assessment" page: it asks
whether an Arabic translator is needed and embeds the matching Zoom Scheduler
(Yes/Arabic → `trusteefriend-assessment-gm-2`, No/English →
`trusteefriend-assessment-gm`).

## Serving it at app.trusteefriend.com/contact/gm-brokerage

`worker.js` + `wrangler.toml` deploy a Cloudflare Worker that serves the page at
that exact URL via a **Worker Route**. Cloudflare invokes the Worker only for
`/contact/gm-brokerage`; every other path on `app.trusteefriend.com` passes
through to Wayfront untouched.

### Prerequisite (check once)

In Cloudflare → **trusteefriend.com** zone → **DNS**, the `app` record must be
**Proxied (orange cloud)**. If it is grey (DNS-only), Worker Routes won't fire —
flip it to orange and set **SSL/TLS → Full (or Full strict)** so the rest of the
Wayfront app keeps serving over its own origin cert.

### Deploy

```bash
cd scripts/wayfront/gm-assessment
npx wrangler deploy
```

If wrangler can't attach the route automatically (zone permissions), add it by
hand: Cloudflare → **Workers & Pages → your account → Workers Routes** (or the
zone's **Workers Routes** tab) → **Add route** →
`app.trusteefriend.com/contact/gm-brokerage` → Worker `gm-brokerage-page`.

### Updating the page

Edit `index.html` and re-run `npx wrangler deploy`. The Worker imports the file
at build time, so a redeploy publishes the new markup.
