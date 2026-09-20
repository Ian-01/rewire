import { shortDate, exactDate } from "../dates.js";

/**
 * Section 2: hand-rolled horizontal bar chart of spaced-repetition review
 * intervals — one row per schedule entry, bar length proportional to
 * intervalDays. Plain divs, no chart library, no animation.
 */
export default function ProgressChart({ schedule, patterns, mistakeCount }) {
  const labelFor = (clusterKey) => {
    const match = patterns?.find((p) => p.clusterKey === clusterKey);
    return match ? match.label : clusterKey;
  };

  if (!schedule || schedule.length === 0) {
    return (
      <>
        <p className="chart-stat">
          {mistakeCount} {mistakeCount === 1 ? "mistake" : "mistakes"} logged
          overall
        </p>
        <p className="empty-state">
          No review schedule yet — intervals will appear here once this student
          starts reviewing patterns.
        </p>
      </>
    );
  }

  const maxInterval = Math.max(
    1,
    ...schedule.map((entry) => entry.intervalDays || 0)
  );

  return (
    <>
      <p className="chart-stat">
        {mistakeCount} {mistakeCount === 1 ? "mistake" : "mistakes"} logged
        overall
      </p>
      <div className="chart-rows">
        {schedule.map((entry) => {
          const interval = entry.intervalDays || 0;
          const widthPercent = Math.max(2, (interval / maxInterval) * 100);
          return (
            <div className="chart-row" key={entry.clusterKey}>
              <p className="chart-row-label">{labelFor(entry.clusterKey)}</p>
              <div className="chart-bar-track">
                <div
                  className="chart-bar"
                  style={{ width: widthPercent + "%" }}
                  role="img"
                  aria-label={
                    "Review interval: " +
                    interval +
                    (interval === 1 ? " day" : " days")
                  }
                />
                <span className="chart-bar-value" aria-hidden="true">
                  {interval} {interval === 1 ? "day" : "days"}
                </span>
              </div>
              <p className="chart-row-next" title={exactDate(entry.nextReview)}>
                Next review {shortDate(entry.nextReview)}
              </p>
            </div>
          );
        })}
      </div>
    </>
  );
}
