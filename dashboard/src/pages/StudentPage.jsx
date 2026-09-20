import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchStudent, isDemoMode } from "../api.js";
import PatternCards from "../components/PatternCards.jsx";
import ProgressChart from "../components/ProgressChart.jsx";
import HandoffNote from "../components/HandoffNote.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";

export default function StudentPage() {
  const { studentId } = useParams();
  const [state, setState] = useState({ status: "loading", data: null });
  const [retryCount, setRetryCount] = useState(0);
  const [noteDirty, setNoteDirty] = useState(false);

  // beforeunload (in HandoffNote) doesn't fire on SPA navigation, so guard
  // the in-app back link here while the note has unsaved changes.
  function handleBackClick(event) {
    if (
      noteDirty &&
      !window.confirm(
        "You have unsaved changes to the handoff note. Leave without saving?"
      )
    ) {
      event.preventDefault();
    }
  }

  useEffect(() => {
    let stale = false; // ignore responses that land after studentId changed
    const controller = new AbortController();

    setState({ status: "loading", data: null });
    fetchStudent(studentId, { signal: controller.signal })
      .then((data) => {
        if (!stale) setState({ status: "success", data });
      })
      .catch((error) => {
        if (stale || error.name === "AbortError") return;
        setState({ status: "error", data: null });
      });

    return () => {
      stale = true;
      controller.abort();
    };
  }, [studentId, retryCount]);

  return (
    <div className="page">
      <Link to="/" className="back-link" onClick={handleBackClick}>
        ← All students
      </Link>
      <header className="page-header">
        <h1>Student: {studentId}</h1>
        <ThemeToggle />
      </header>

      {isDemoMode() && (
        <p className="demo-banner">
          Showing demo data — set the endpoint URLs in src/config.js
        </p>
      )}

      {/* Persistent live region so load/failure states (including after
          pressing Retry) are announced to screen readers. */}
      <div role="status" aria-live="polite">
        {state.status === "loading" && (
          <div className="card status-block">
            <p className="status-text">Loading…</p>
          </div>
        )}

        {state.status === "error" && (
          <div className="card status-block">
            <p className="status-text">
              Couldn't load this student's data right now.
            </p>
            <button
              type="button"
              className="button"
              onClick={() => setRetryCount((n) => n + 1)}
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {state.status === "success" && (
        <>
          <section className="card section" aria-labelledby="patterns-heading">
            <h2 id="patterns-heading">Pitfall patterns</h2>
            <p className="section-sub">
              Recurring mistakes, most frequent first.
            </p>
            <PatternCards patterns={state.data.patterns} />
          </section>

          <section className="card section" aria-labelledby="progress-heading">
            <h2 id="progress-heading">Progress over time</h2>
            <p className="section-sub">
              Review interval per pattern — longer bars mean the student
              retains that pattern longer between reviews.
            </p>
            <ProgressChart
              schedule={state.data.schedule}
              patterns={state.data.patterns}
              mistakeCount={state.data.mistakeCount}
            />
          </section>

          <section className="card section" aria-labelledby="note-heading">
            <h2 id="note-heading">Handoff note</h2>
            <p className="section-sub">
              What the next tutor should know. Saved only when you press "Save
              note".
            </p>
            <HandoffNote
              studentId={studentId}
              initialNote={state.data.handoffNote}
              onDirtyChange={setNoteDirty}
            />
          </section>
        </>
      )}
    </div>
  );
}
