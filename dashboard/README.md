# Retrace — Tutor Dashboard

A calm, low-clutter Vite + React dashboard that lets a volunteer tutor open one
student's page and understand, in under a minute, what that student struggles
with and what the previous tutor already knew.

## Run locally

```bash
cd dashboard
npm install
npm run dev
```

Then open the printed local URL (usually http://localhost:5173). Enter any
Student ID on the landing screen to open that student's page.

## Setting the backend endpoint URLs

Both endpoint URLs live in one place: **`src/config.js`**, at the very top of
the file:

```js
export const DASHBOARD_READ_URL = "REPLACE_WITH_DASHBOARD_READ_URL";
export const DASHBOARD_WRITE_URL = "REPLACE_WITH_DASHBOARD_WRITE_URL";
```

Swap the placeholder strings for the real Lambda Function URLs:

- `DASHBOARD_READ_URL` — called as `GET {url}?studentId=...`, returns the
  student JSON (`patterns`, `schedule`, `mistakeCount`, `handoffNote`).
- `DASHBOARD_WRITE_URL` — called as `POST {url}` with JSON body
  `{ studentId, handoffNote }`; the response is plain text.

### Contract assumptions

The backend contract only types `lastSeen` and `nextReview` as strings. The
dashboard **assumes they are ISO-8601 timestamps** (anything `new Date(...)`
can parse works) so it can show them as relative/short dates. If a value
doesn't parse as a date, it is shown verbatim instead.

## Demo mode

While either URL still starts with `REPLACE_WITH`, the app runs in **demo
mode**: it serves realistic built-in sample data (matching the backend contract
shape exactly) and pretends note saves succeed after a short delay — the save
confirmation reads "Saved (demo only — not persisted)" so it can't be mistaken
for a real save. The student page also shows a small banner — "Showing demo
data — set the endpoint URLs in src/config.js" — so it's always clear you're
not looking at live data. This keeps the dashboard fully demoable before the
backend endpoints exist.

## Production build

```bash
npm run build
```

Outputs a static site to `dist/`. Preview it locally with `npm run preview`.
