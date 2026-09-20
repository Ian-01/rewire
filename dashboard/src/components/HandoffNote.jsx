import { useEffect, useRef, useState } from "react";
import { saveHandoffNote, isDemoMode } from "../api.js";

/**
 * Section 3: the handoff note. Explicit save (no autosave), a visible
 * dirty/saving/saved/error status in an aria-live region, and a beforeunload
 * warning only while there are unsaved changes. In-app navigation is guarded
 * too: the dirty flag is reported up via onDirtyChange so the page can
 * confirm before leaving. A background refetch never clobbers text the tutor
 * has already typed: the incoming note is only applied while the textarea is
 * clean.
 */
export default function HandoffNote({ studentId, initialNote, onDirtyChange }) {
  const [text, setText] = useState(initialNote ?? "");
  const [savedText, setSavedText] = useState(initialNote ?? "");
  // "idle" | "saving" | "saved" | "error"
  const [status, setStatus] = useState("idle");

  const dirty = text !== savedText;
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  // Sync in a refetched note only while the tutor hasn't typed anything new.
  useEffect(() => {
    if (!dirtyRef.current) {
      setText(initialNote ?? "");
      setSavedText(initialNote ?? "");
    }
  }, [initialNote]);

  // Tell the parent page whether there are unsaved changes so it can guard
  // in-app navigation (beforeunload below only covers full page unloads).
  useEffect(() => {
    onDirtyChange?.(dirty);
    return () => onDirtyChange?.(false);
  }, [dirty, onDirtyChange]);

  // Warn before leaving the page only while there are unsaved changes.
  useEffect(() => {
    if (!dirty) return undefined;
    function handleBeforeUnload(event) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

  function handleChange(event) {
    setText(event.target.value);
    if (status === "error" || status === "saved") setStatus("idle");
  }

  async function handleSave() {
    const snapshot = text;
    setStatus("saving");
    try {
      await saveHandoffNote(studentId, snapshot);
      setSavedText(snapshot);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  let statusMessage = "";
  let statusClass = "";
  if (status === "saving") {
    statusMessage = "Saving…";
  } else if (status === "error") {
    statusMessage = "Couldn't save — please try again";
    statusClass = "is-error";
  } else if (dirty) {
    statusMessage = "Unsaved changes";
    statusClass = "is-dirty";
  } else if (status === "saved") {
    statusMessage = isDemoMode()
      ? "Saved (demo only — not persisted)"
      : "Note saved ✓";
    statusClass = "is-success";
  }

  return (
    <div>
      <label className="field-label" htmlFor="handoff-note">
        Note for the next tutor
      </label>
      <textarea
        id="handoff-note"
        className="textarea note-textarea"
        rows={8}
        value={text}
        onChange={handleChange}
      />
      <div className="note-actions">
        <button
          type="button"
          className="button"
          onClick={handleSave}
          disabled={status === "saving"}
        >
          {status === "saving" ? "Saving…" : "Save note"}
        </button>
        <span
          className={"note-status " + statusClass}
          role="status"
          aria-live="polite"
        >
          {statusMessage}
        </span>
      </div>
    </div>
  );
}
