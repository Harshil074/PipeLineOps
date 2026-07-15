// app.js
// Small, dependency-free renderers. Each one only runs if its
// target container exists on the current page, so this single
// file can be included on every page without side effects.

(function () {
  const DATA_ROOT = window.PIPELINEOPS_DATA_ROOT || "../data/";

  function fetchJSON(name) {
    return fetch(`${DATA_ROOT}${name}`).then((res) => {
      if (!res.ok) throw new Error(`${name} ${res.status}`);
      return res.json();
    });
  }

  const sevLabel = { sev1: "SEV 1", sev2: "SEV 2", sev3: "SEV 3" };

  function renderIncidents() {
    const list = document.querySelector("[data-incident-list]");
    if (!list) return;
    fetchJSON("incidents.json")
      .then((data) => {
        list.innerHTML = data.incidents
          .map(
            (inc) => `
          <article class="incident">
            <div class="incident-sev incident-sev--${inc.severity}">${sevLabel[inc.severity] || inc.severity}</div>
            <div>
              <h4>${inc.id} — ${inc.title}</h4>
              <div class="meta">${inc.date} · duration ${inc.duration}</div>
              <p class="impact"><strong>Impact:</strong> ${inc.impact}</p>
              <p class="impact"><strong>Root cause:</strong> ${inc.root_cause}</p>
              <p class="impact"><strong>Resolution:</strong> ${inc.resolution}</p>
            </div>
          </article>`
          )
          .join("");
      })
      .catch((err) => {
        list.innerHTML = `<p>Could not load incident data (${err.message}).</p>`;
      });
  }

  function renderStageTracker() {
    const tracker = document.querySelector("[data-stage-tracker]");
    if (!tracker) return;
    fetchJSON("pipeline.json")
      .then((data) => {
        tracker.innerHTML = data.stages
          .map(
            (s) => `
          <div class="stage" data-status="${s.status}">
            <span class="stage-num">STAGE ${String(s.id).padStart(2, "0")}</span>
            <div class="stage-name">${s.name}</div>
            <div class="stage-desc">${s.desc}</div>
            <div class="mono" style="font-size:0.72rem;color:var(--text-faint)">
              ${s.tooling.join(" · ")}
            </div>
          </div>`
          )
          .join("");
      })
      .catch((err) => {
        tracker.innerHTML = `<p>Could not load pipeline data (${err.message}).</p>`;
      });
  }

  function renderSecurity() {
    const list = document.querySelector("[data-security-list]");
    if (!list) return;
    fetchJSON("security.json")
      .then((data) => {
        const lastScan = document.querySelector("[data-last-scan]");
        if (lastScan) lastScan.textContent = data.last_scan;

        list.innerHTML = data.scans
          .map(
            (s) => `
          <div class="scan-row">
            <div>
              <div class="tool">${s.tool}</div>
              <div class="findings">${s.purpose}</div>
            </div>
            <div class="findings">${s.findings} finding${s.findings === 1 ? "" : "s"}</div>
            <span class="badge badge--${s.status}">${s.status}</span>
          </div>`
          )
          .join("");
      })
      .catch((err) => {
        list.innerHTML = `<p>Could not load security data (${err.message}).</p>`;
      });
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderIncidents();
    renderStageTracker();
    renderSecurity();
  });
})();
