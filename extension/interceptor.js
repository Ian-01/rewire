// Retrace — page-world interceptor (runs in the MAIN world; chrome.* APIs are
// NOT available here). Wraps window.fetch and XMLHttpRequest to observe
// LeetCode's own submission traffic:
//
//   1. POST /problems/<slug>/submit/          -> captures typed_code + slug,
//      and reads submission_id from the JSON response (stored as "pending").
//   2. GET  /submissions/detail/<id>/check/   -> polled while judging; when
//      the JSON body has state === "SUCCESS", status_msg holds the verdict
//      ("Accepted", "Wrong Answer", ...). We match the id to the pending
//      submission and post one message to the isolated-world relay.
//
// Every wrapper is defensive: a failure inside Retrace must NEVER break or
// alter LeetCode's own request/response flow.

(function () {
  "use strict";

  var SUBMIT_RE = /\/problems\/([^\/?#]+)\/submit\/?(?:[?#]|$)/;
  var CHECK_RE = /\/submissions\/detail\/([^\/?#]+)\/check\/?(?:[?#]|$)/;

  // submissionId -> { slug, code }
  var pending = {};

  function safeParseJson(text) {
    try {
      return JSON.parse(text);
    } catch (e) {
      return null;
    }
  }

  function extractUrl(input) {
    try {
      if (typeof input === "string") return input;
      if (input && typeof input.url === "string") return input.url; // Request
      return String(input); // URL objects stringify to their href
    } catch (e) {
      return "";
    }
  }

  function extractMethod(input, init) {
    try {
      if (init && init.method) return String(init.method).toUpperCase();
      if (input && typeof input === "object" && input.method) {
        return String(input.method).toUpperCase();
      }
    } catch (e) {}
    return "GET";
  }

  // Resolve the request body to a text string (or null). Handles fetch called
  // as fetch(url, { body }) with a string / URLSearchParams / Blob body, a
  // body passed as an already-built object, and fetch(new Request(...)).
  function readBodyText(input, init) {
    try {
      if (init && init.body != null) {
        var b = init.body;
        if (typeof b === "string") return Promise.resolve(b);
        if (typeof URLSearchParams !== "undefined" && b instanceof URLSearchParams) {
          return Promise.resolve(b.toString());
        }
        if (typeof Blob !== "undefined" && b instanceof Blob && typeof b.text === "function") {
          return b.text().catch(function () { return null; });
        }
        // Forgiving fallback: a plain object that was never serialized.
        if (typeof b === "object" && typeof b.typed_code === "string") {
          try {
            return Promise.resolve(JSON.stringify(b));
          } catch (e) {}
        }
        return Promise.resolve(null);
      }
      // Request object: clone before reading so the original stays usable.
      if (input && typeof input.clone === "function" && typeof input.text === "function") {
        return input.clone().text().catch(function () { return null; });
      }
    } catch (e) {}
    return Promise.resolve(null);
  }

  function extractTypedCode(bodyText) {
    if (typeof bodyText !== "string" || bodyText.length === 0) return null;
    var parsed = safeParseJson(bodyText);
    if (parsed && typeof parsed.typed_code === "string") return parsed.typed_code;
    return null;
  }

  function rememberPending(submissionId, slug, code) {
    try {
      if (submissionId == null || !slug || code == null) return;
      pending[String(submissionId)] = { slug: slug, code: code };
    } catch (e) {}
  }

  function handleSubmitResponseJson(slug, bodyTextPromise, respJson) {
    try {
      if (!respJson || respJson.submission_id == null) return;
      var id = String(respJson.submission_id);
      bodyTextPromise.then(function (bodyText) {
        try {
          var code = extractTypedCode(bodyText);
          if (code != null) rememberPending(id, slug, code);
        } catch (e) {}
      });
    } catch (e) {}
  }

  function handleCheckResultJson(submissionId, json) {
    try {
      if (!json) return;
      // While state !== "SUCCESS" LeetCode is still judging — keep waiting.
      if (json.state !== "SUCCESS") return;
      var entry = pending[submissionId];
      if (!entry) return;
      // Clear first so each submission reports exactly once.
      delete pending[submissionId];
      var statusMsg = typeof json.status_msg === "string" ? json.status_msg : "";
      window.postMessage({
        __retrace: true,
        problemSlug: entry.slug,
        code: entry.code,
        passed: statusMsg === "Accepted",
        statusMsg: statusMsg
      }, window.location.origin);
    } catch (e) {}
  }

  // ---------------------------------------------------------------- fetch --
  try {
    var originalFetch = window.fetch;
    if (typeof originalFetch === "function") {
      window.fetch = function (input, init) {
        // Inspect the request BEFORE dispatching it: fetch() marks a Request
        // object's body as used, so readBodyText must clone it first (cloning
        // beforehand keeps the original Request fully usable). Everything is
        // wrapped so Retrace can never block or alter the real request.
        var slug = null;
        var submissionId = null;
        var bodyTextPromise = null;
        try {
          var url = extractUrl(input);
          var method = extractMethod(input, init);
          var submitMatch = url ? url.match(SUBMIT_RE) : null;
          var checkMatch = url ? url.match(CHECK_RE) : null;

          if (submitMatch && method === "POST") {
            slug = submitMatch[1];
            bodyTextPromise = readBodyText(input, init);
          } else if (checkMatch) {
            submissionId = checkMatch[1];
          }
        } catch (e) {}

        var resultPromise = originalFetch.apply(this, arguments);
        try {
          if (slug != null && bodyTextPromise) {
            var pendingSlug = slug;
            var pendingBody = bodyTextPromise;
            resultPromise.then(function (response) {
              try {
                // clone() so LeetCode can still read the body itself.
                response.clone().json().then(function (respJson) {
                  handleSubmitResponseJson(pendingSlug, pendingBody, respJson);
                }).catch(function () {});
              } catch (e) {}
            }).catch(function () {});
          } else if (submissionId != null) {
            var checkId = submissionId;
            resultPromise.then(function (response) {
              try {
                response.clone().json().then(function (json) {
                  handleCheckResultJson(checkId, json);
                }).catch(function () {});
              } catch (e) {}
            }).catch(function () {});
          }
        } catch (e) {}
        return resultPromise;
      };
    }
  } catch (e) {}

  // ------------------------------------------------------ XMLHttpRequest --
  try {
    var origOpen = XMLHttpRequest.prototype.open;
    var origSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url) {
      try {
        this.__retraceMethod = method ? String(method).toUpperCase() : "GET";
        this.__retraceUrl = typeof url === "string" ? url : String(url);
      } catch (e) {}
      return origOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function (body) {
      try {
        var url = this.__retraceUrl || "";
        var method = this.__retraceMethod || "GET";
        var submitMatch = url.match(SUBMIT_RE);
        var checkMatch = url.match(CHECK_RE);

        if (submitMatch && method === "POST") {
          var slug = submitMatch[1];
          var bodyText = typeof body === "string" ? body : null;
          var xhr = this;
          this.addEventListener("load", function () {
            try {
              var respJson = xhrResponseJson(xhr);
              if (respJson && respJson.submission_id != null) {
                var code = extractTypedCode(bodyText);
                if (code != null) {
                  rememberPending(respJson.submission_id, slug, code);
                }
              }
            } catch (e) {}
          });
        } else if (checkMatch) {
          var submissionId = checkMatch[1];
          var xhr2 = this;
          this.addEventListener("load", function () {
            try {
              handleCheckResultJson(submissionId, xhrResponseJson(xhr2));
            } catch (e) {}
          });
        }
      } catch (e) {}
      return origSend.apply(this, arguments);
    };
  } catch (e) {}

  function xhrResponseJson(xhr) {
    try {
      var rt = xhr.responseType;
      if (rt === "" || rt === "text") return safeParseJson(xhr.responseText);
      if (rt === "json") return xhr.response;
    } catch (e) {}
    return null;
  }
})();
