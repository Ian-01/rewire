// Small date helpers shared by the pattern cards and the progress chart.

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Whole-day difference between a date string and today (positive = past). */
function daysAgo(isoString) {
  const then = startOfDay(new Date(isoString));
  const today = startOfDay(new Date());
  return Math.round((today - then) / MS_PER_DAY);
}

/** "today" / "yesterday" / "3 days ago" / "2 weeks ago" / "3 months ago". */
export function relativePast(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;

  const days = daysAgo(isoString);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 14) return days + " days ago";
  if (days < 60) return Math.round(days / 7) + " weeks ago";
  return Math.round(days / 30) + " months ago";
}

/** Exact date for title attributes, e.g. "September 17, 2026". */
export function exactDate(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Short date for inline display, e.g. "Sep 24". */
export function shortDate(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
