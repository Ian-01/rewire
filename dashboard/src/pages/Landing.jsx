import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const [studentId, setStudentId] = useState("");
  const navigate = useNavigate();

  const trimmed = studentId.trim();

  function handleSubmit(event) {
    event.preventDefault();
    if (!trimmed) return;
    navigate("/student/" + encodeURIComponent(trimmed));
  }

  return (
    <main className="landing">
      <div className="card landing-card">
        <h1>Retrace</h1>
        <p className="tagline">
          See what a student struggles with — and what the last tutor already
          knew — in under a minute.
        </p>
        <form className="landing-form" onSubmit={handleSubmit}>
          <div>
            <label className="field-label" htmlFor="student-id">
              Student ID
            </label>
            <input
              id="student-id"
              className="text-input"
              type="text"
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
              autoComplete="off"
              autoFocus
            />
          </div>
          <button className="button" type="submit" disabled={!trimmed}>
            Open student page
          </button>
        </form>
      </div>
    </main>
  );
}
