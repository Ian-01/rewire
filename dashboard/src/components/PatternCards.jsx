import { relativePast, exactDate } from "../dates.js";

/**
 * Section 1: one small card per recurring mistake pattern,
 * sorted most frequent first.
 */
export default function PatternCards({ patterns }) {
  if (!patterns || patterns.length === 0) {
    return (
      <p className="empty-state">
        No recurring pitfalls yet — nothing for this student has clustered into
        a pattern so far. That's a fine place to be.
      </p>
    );
  }

  const sorted = [...patterns].sort((a, b) => b.count - a.count);

  return (
    <div className="pattern-grid">
      {sorted.map((pattern) => (
        <div className="card pattern-card" key={pattern.clusterKey}>
          <p className="pattern-label">{pattern.label}</p>
          <p className="pattern-meta">
            Seen {pattern.count} {pattern.count === 1 ? "time" : "times"}
            <br />
            <span title={exactDate(pattern.lastSeen)}>
              Last seen {relativePast(pattern.lastSeen)}
            </span>
          </p>
        </div>
      ))}
    </div>
  );
}
