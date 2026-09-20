// Retrace — isolated-world relay. The MAIN-world interceptor cannot touch
// chrome.* APIs, so it posts a window message; this script forwards it to the
// background service worker via chrome.runtime.sendMessage.

(function () {
  "use strict";

  window.addEventListener("message", function (event) {
    // Only accept messages posted by this exact page to itself.
    if (event.source !== window) return;
    if (event.origin !== window.location.origin) return;

    var data = event.data;
    if (!data || data.__retrace !== true) return;

    try {
      var maybePromise = chrome.runtime.sendMessage({
        __retrace: true,
        problemSlug: data.problemSlug,
        code: data.code,
        passed: data.passed === true,
        statusMsg: data.statusMsg
      });
      // MV3 returns a promise when no callback is given; swallow rejections
      // (e.g. "Extension context invalidated" after a reload).
      if (maybePromise && typeof maybePromise.catch === "function") {
        maybePromise.catch(function () {});
      }
    } catch (e) {
      // Extension context can be invalidated when the extension is reloaded
      // while the LeetCode tab stays open. Never surface this to the student.
    }
  });
})();
