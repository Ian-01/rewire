// Retrace — background service worker (classic script, no modules).

// ===========================================================================
// >>> REPLACE THIS with your real ingest Lambda Function URL. <<<
// ===========================================================================
const INGEST_URL = "REPLACE_WITH_INGEST_URL";

const RETRY_DELAY_MS = 2000;

// Registered at the top level, as MV3 requires.
chrome.runtime.onMessage.addListener(function (message) {
  if (!message || message.__retrace !== true) return;
  handleSubmission(message);
});

// Toolbar icon click opens the options page (there is no popup on purpose).
chrome.action.onClicked.addListener(function () {
  chrome.runtime.openOptionsPage();
});

function handleSubmission(message) {
  chrome.storage.local.get("studentId", function (items) {
    var studentId = items && items.studentId;
    if (!studentId) {
      // Drop silently — the tool must never nag the student mid-practice.
      console.log(
        "[Retrace] No student ID set — submission not logged. " +
        "Set one on the Retrace options page."
      );
      return;
    }

    var payload = JSON.stringify({
      studentId: studentId,
      problemSlug: message.problemSlug,
      code: message.code,
      passed: message.passed === true
    });

    postOnce(payload).then(function (ok) {
      if (ok) return;
      // One retry after ~2 seconds, then give up quietly.
      setTimeout(function () {
        postOnce(payload).then(function (retryOk) {
          if (!retryOk) {
            console.log("[Retrace] Failed to log submission after retry — giving up.");
          }
        });
      }, RETRY_DELAY_MS);
    });
  });
}

// POST the payload once. Resolves true on any 2xx response, false otherwise.
// The response body is plain text ("ok"/"logged") — never parsed.
function postOnce(payload) {
  return fetch(INGEST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload
  }).then(function (response) {
    return response.ok;
  }).catch(function () {
    return false;
  });
}
