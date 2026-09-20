# Retrace Chrome Extension

Silently watches leetcode.com, detects when a student submits a solution, and
POSTs the result to the Retrace backend. The student never interacts with it
during practice — the only UI is a one-field options page for their student ID.

## Load it (unpacked)

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode** (toggle, top right).
3. Click **Load unpacked** and select this `extension/` folder.

No icons are bundled — Chrome shows a default puzzle-piece icon for unpacked
extensions, which is fine for development.

## Point it at your backend

Open `background.js`. At the very top:

```js
const INGEST_URL = "REPLACE_WITH_INGEST_URL";
```

Replace `REPLACE_WITH_INGEST_URL` with your real ingest Lambda Function URL,
then reload the extension on `chrome://extensions` (click the circular refresh
arrow on the Retrace card).

The extension POSTs JSON to that URL:

```json
{ "studentId": "…", "problemSlug": "two-sum", "code": "…", "passed": true }
```

The response body is plain text (`ok`/`logged`) and is never parsed.

## Set the student ID

Click the Retrace toolbar icon (it opens the settings page directly — there is
no popup), or use the **Details → Extension options** link on
`chrome://extensions`. Enter the student's ID in **Your Student ID** and click
**Save**. You'll see "Saved ✓". Until an ID is saved, submissions are dropped
with a console log only — the page reminds you about this.

## Test it

1. Make sure the ID is saved and `INGEST_URL` is replaced.
2. On `chrome://extensions`, click the **service worker** link on the Retrace
   card to open the background console.
3. Open any problem on `https://leetcode.com/problems/...`, write a solution
   (passing or failing — both are reported), and click **Submit**.
4. When LeetCode finishes judging, the extension POSTs once per submission.
   Success is silent by design; failures (missing ID, network errors after one
   retry ~2s later) appear only as `[Retrace] …` lines in that service worker
   console. You can also confirm the request in the service worker's Network
   tab, or on your backend's logs.

## How it works

- `interceptor.js` (MAIN world, `document_start`) wraps `window.fetch` and
  `XMLHttpRequest` to observe LeetCode's own traffic: the POST to
  `/problems/<slug>/submit/` (captures `typed_code` + `submission_id`) and the
  polling of `/submissions/detail/<id>/check/` (waits for
  `state === "SUCCESS"`, then reads `status_msg`; `passed` is
  `status_msg === "Accepted"`). It posts a single `window.postMessage` per
  submission and never alters LeetCode's requests or responses.
- `relay.js` (isolated world) forwards that message to the service worker via
  `chrome.runtime.sendMessage`.
- `background.js` reads `studentId` from `chrome.storage.local`, POSTs the
  payload, retries once after ~2 seconds on failure, then gives up with a
  console log only. Never any UI, notification, or badge.

## Known limitations

- Relies on LeetCode's current private endpoints
  (`/problems/<slug>/submit/` and `/submissions/detail/<id>/check/`) and their
  JSON field names (`typed_code`, `submission_id`, `state`, `status_msg`). If
  LeetCode changes these, detection silently stops working.
- Only real **Submit** actions are logged — "Run" (test-run) is not, since it
  uses different endpoints.
- If the extension is reloaded while a LeetCode tab is open, that tab's relay
  loses its extension context; refresh the LeetCode tab to resume logging.
- No icon files are bundled.
- No authentication — the student ID is a plain string stored in
  `chrome.storage.local`.
