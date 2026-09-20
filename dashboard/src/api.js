import { DASHBOARD_READ_URL, DASHBOARD_WRITE_URL } from "./config.js";

// Demo mode: active while the placeholder URLs in src/config.js have not been
// swapped for real endpoint URLs yet.
export function isDemoMode() {
  return (
    DASHBOARD_READ_URL.startsWith("REPLACE_WITH") ||
    DASHBOARD_WRITE_URL.startsWith("REPLACE_WITH")
  );
}

// ---------------------------------------------------------------------------
// Built-in sample data (demo mode only). Matches the backend contract exactly:
// { studentId, patterns[], schedule[], mistakeCount, handoffNote }
// ---------------------------------------------------------------------------

function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function buildDemoData(studentId) {
  return {
    studentId,
    patterns: [
      {
        clusterKey: "dp-missing-base-case",
        label: "Misses base case in recursive DP",
        count: 7,
        lastSeen: daysFromNow(-2),
      },
      {
        clusterKey: "binary-search-off-by-one",
        label: "Off-by-one in binary search bounds",
        count: 5,
        lastSeen: daysFromNow(-1),
      },
      {
        clusterKey: "empty-input-unhandled",
        label: "Forgets to handle empty input arrays",
        count: 4,
        lastSeen: daysFromNow(-5),
      },
      {
        clusterKey: "mutating-while-iterating",
        label: "Mutates a list while iterating over it",
        count: 3,
        lastSeen: daysFromNow(-9),
      },
      {
        clusterKey: "bfs-dfs-mixup",
        label: "Mixes up BFS and DFS traversal order",
        count: 2,
        lastSeen: daysFromNow(-16),
      },
      {
        clusterKey: "hashmap-default-missing",
        label: "Reads a hash map key without a default",
        count: 1,
        lastSeen: daysFromNow(0),
      },
    ],
    schedule: [
      {
        clusterKey: "dp-missing-base-case",
        nextReview: daysFromNow(1),
        intervalDays: 2,
      },
      {
        clusterKey: "binary-search-off-by-one",
        nextReview: daysFromNow(3),
        intervalDays: 4,
      },
      {
        clusterKey: "empty-input-unhandled",
        nextReview: daysFromNow(5),
        intervalDays: 7,
      },
      {
        clusterKey: "mutating-while-iterating",
        nextReview: daysFromNow(8),
        intervalDays: 14,
      },
      {
        clusterKey: "bfs-dfs-mixup",
        nextReview: daysFromNow(12),
        intervalDays: 21,
      },
      {
        clusterKey: "hashmap-default-missing",
        nextReview: daysFromNow(1),
        intervalDays: 1,
      },
    ],
    mistakeCount: 22,
    handoffNote:
      "Working with them since June. Strongest on arrays and strings; recursion still " +
      "shakes their confidence, so start sessions with one easy DP warm-up before " +
      "anything new. They respond really well to talking the base case out loud before " +
      "typing. Avoid piling on more than one new topic per session — focus drifts fast " +
      "after ~40 minutes. Next up: binary search edge cases (left/right bounds).",
  };
}

const DEMO_DELAY_MS = 500;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch everything for one student.
 * GET DASHBOARD_READ_URL?studentId=...
 */
export async function fetchStudent(studentId, { signal } = {}) {
  if (isDemoMode()) {
    await delay(DEMO_DELAY_MS);
    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }
    return buildDemoData(studentId);
  }

  const url =
    DASHBOARD_READ_URL + "?studentId=" + encodeURIComponent(studentId);
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error("Request failed with status " + response.status);
  }
  return response.json();
}

/**
 * Save the handoff note.
 * POST DASHBOARD_WRITE_URL with JSON { studentId, handoffNote }.
 * The response is plain text — it is intentionally never JSON-parsed.
 */
export async function saveHandoffNote(studentId, handoffNote) {
  if (isDemoMode()) {
    await delay(DEMO_DELAY_MS);
    return "ok";
  }

  const response = await fetch(DASHBOARD_WRITE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentId, handoffNote }),
  });
  if (!response.ok) {
    throw new Error("Request failed with status " + response.status);
  }
  // Plain text body ("ok"/"logged") — read it but never JSON.parse it.
  return response.text();
}
