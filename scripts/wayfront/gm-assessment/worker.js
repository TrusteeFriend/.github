// Cloudflare Worker: serve the GM assessment one-pager at the exact Wayfront
// URL https://app.trusteefriend.com/contact/gm-brokerage.
//
// A Worker Route (see wrangler.toml) makes Cloudflare invoke this Worker only
// for that path; every other request on app.trusteefriend.com falls through to
// Wayfront's origin untouched. index.html is imported as text at build time so
// there is a single source of truth for the page.

import HTML from "./index.html";

// The path(s) we own. Anything else that the route happens to catch is proxied
// straight back to the Wayfront origin.
const PAGE_PATHS = new Set([
  "/contact/gm-brokerage",
  "/contact/gm-brokerage/",
]);

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (PAGE_PATHS.has(url.pathname)) {
      return new Response(HTML, {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "public, max-age=300",
        },
      });
    }

    // Not our page — hand the request back to Wayfront's origin.
    return fetch(request);
  },
};
