# Retrace

Frontend for Retrace — a tool that helps volunteer tutors support neurodivergent students
practicing coding-interview problems. Two independent pieces:

- **`extension/`** — a Chrome extension (Manifest V3) that silently watches leetcode.com,
  detects when a student submits a solution, and reports it to the backend. Zero
  interaction required from the student beyond a one-time Student ID setup.
- **`dashboard/`** — a Vite + React dashboard that lets a tutor open one student's page
  and understand, in under a minute, what that student struggles with and what the
  previous tutor already knew.

Each folder has its own README with run/load instructions.

## Wiring up the backend

The backend (AWS Lambda Function URLs) is configured separately. Swap the placeholder
strings once the real URLs exist:

| Placeholder | File |
| --- | --- |
| `REPLACE_WITH_INGEST_URL` | `extension/background.js` (top of file) |
| `REPLACE_WITH_DASHBOARD_READ_URL` | `dashboard/src/config.js` (top of file) |
| `REPLACE_WITH_DASHBOARD_WRITE_URL` | `dashboard/src/config.js` (top of file) |

Until the dashboard URLs are replaced, the dashboard runs in **demo mode** with built-in
sample data (and a visible banner saying so), so it can be demoed before the backend
endpoints exist.

## Quick start

```bash
# Dashboard
cd dashboard
npm install
npm run dev

# Extension: chrome://extensions → enable Developer mode → Load unpacked → select extension/
```
