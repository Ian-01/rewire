// Retrace — options page logic. One field, one button, immediate confirmation.

(function () {
  "use strict";

  var form = document.getElementById("form");
  var input = document.getElementById("student-id");
  var status = document.getElementById("status");
  var reminder = document.getElementById("reminder");

  function updateReminder(hasId) {
    reminder.hidden = !!hasId;
  }

  // Load the stored value when the page opens.
  chrome.storage.local.get("studentId", function (items) {
    var stored = items && items.studentId ? String(items.studentId) : "";
    input.value = stored;
    updateReminder(stored.length > 0);
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var value = input.value.trim();

    if (value) {
      chrome.storage.local.set({ studentId: value }, function () {
        status.textContent = "Saved ✓";
        updateReminder(true);
      });
    } else {
      // Empty save clears the stored ID; the reminder reappears.
      chrome.storage.local.remove("studentId", function () {
        status.textContent = "Saved ✓ — no ID stored";
        updateReminder(false);
      });
    }
  });
})();
