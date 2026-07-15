// version.js
// Populates any element tagged with data-version-* attributes
// from data/version.json. This file is what the pipeline's
// build stage overwrites on every run — refreshing this script's
// input is the whole point of the "auto-updated build version" page.

(function () {
  const dataPath = window.PIPELINEOPS_DATA_ROOT
    ? `${window.PIPELINEOPS_DATA_ROOT}version.json`
    : "../data/version.json";

  function statusToBadgeClass(status) {
    switch (status) {
      case "success": return "badge--success";
      case "fail": return "badge--fail";
      case "running": return "badge--running";
      case "pending": return "badge--warning";
      default: return "badge--info";
    }
  }

  fetch(dataPath)
    .then((res) => {
      if (!res.ok) throw new Error(`version.json ${res.status}`);
      return res.json();
    })
    .then((data) => {
      document.querySelectorAll("[data-version]").forEach((el) => {
        el.textContent = `v${data.version}`;
      });
      document.querySelectorAll("[data-build-number]").forEach((el) => {
        el.textContent = `#${data.build_number}`;
      });
      document.querySelectorAll("[data-commit-sha]").forEach((el) => {
        el.textContent = data.commit_sha;
      });
      document.querySelectorAll("[data-built-at]").forEach((el) => {
        el.textContent = data.built_at;
      });
      document.querySelectorAll("[data-branch]").forEach((el) => {
        el.textContent = data.branch;
      });
      document.querySelectorAll("[data-build-status]").forEach((el) => {
        el.textContent = data.status;
        el.className = `badge ${statusToBadgeClass(data.status)}`;
      });

      const historyBody = document.querySelector("[data-deploy-history]");
      if (historyBody && Array.isArray(data.history)) {
        historyBody.innerHTML = data.history
          .map(
            (entry) => `
          <tr>
            <td class="mono">v${entry.version}</td>
            <td class="mono">#${entry.build_number}</td>
            <td class="mono">${entry.commit_sha}</td>
            <td><span class="env-tag">${entry.environment}</span></td>
            <td>${entry.date}</td>
            <td><span class="badge ${statusToBadgeClass(entry.status)}">${entry.status}</span></td>
          </tr>`
          )
          .join("");
      }
    })
    .catch((err) => {
      console.error("Failed to load version.json", err);
      document.querySelectorAll("[data-version]").forEach((el) => {
        el.textContent = "unavailable";
      });
    });
})();
