type CheckStatus = "idle" | "loading" | "ok" | "warn" | "error";

type CheckItem = {
  key: string;
  title: string;
  endpoint: string;
  status: CheckStatus;
  data?: unknown;
  error?: string;
};

const checks: CheckItem[] = [
  { key: "self", title: "Backend Self Check", endpoint: "/self-check", status: "idle" },
  { key: "chat", title: "Ollama / LLM", endpoint: "/api/chat/health", status: "idle" },
  { key: "metrics", title: "System Metrics", endpoint: "/system/metrics", status: "idle" },
  { key: "ports", title: "Ports", endpoint: "/diagnostic/ports", status: "idle" },
  { key: "deps", title: "Dependencies", endpoint: "/diagnostic/dependencies", status: "idle" },
  { key: "logs", title: "Logs", endpoint: "/diagnostic/logs/list", status: "idle" },
  { key: "deep", title: "Deep Status", endpoint: "/deep/status", status: "idle" },
  { key: "repair", title: "Repair Plan", endpoint: "/deep/repair-plan", status: "idle" },
];

let state: CheckItem[] = checks.map((item) => ({ ...item }));
let selectedKey = "self";
let panel: HTMLElement | null = null;

function pretty(value: unknown) {
  if (value === undefined) return "";
  if (typeof value === "string") return value;
  try { return JSON.stringify(value, null, 2); } catch { return String(value); }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char] || char));
}

function inferStatus(data: unknown): CheckStatus {
  const text = pretty(data).toLowerCase();
  if (text.includes('"ok": false') || text.includes('"status": "error"') || text.includes("failed") || text.includes("fehler")) return "error";
  if (text.includes("warn") || text.includes("missing") || text.includes("nicht erreichbar") || text.includes("unbekannt")) return "warn";
  return "ok";
}

function label(status: CheckStatus) {
  if (status === "loading") return "Prüft";
  if (status === "ok") return "OK";
  if (status === "warn") return "Warnung";
  if (status === "error") return "Fehler";
  return "Bereit";
}

function summary(item: CheckItem) {
  if (item.status === "loading") return "Diagnose läuft...";
  if (item.error) return item.error;
  if (!item.data) return "Noch nicht geprüft";
  const data = item.data as any;
  if (item.key === "chat" && typeof data === "object") return `Ollama: ${data.ok ? "erreichbar" : "nicht erreichbar"} · Modell: ${data.model || "unbekannt"}`;
  if (item.key === "metrics" && typeof data === "object") return `CPU ${data.cpu?.percent ?? "N/A"}% · RAM ${data.memory?.percent ?? "N/A"}% · Temp ${data.temperature?.celsius ?? "N/A"}°C`;
  if (item.key === "logs" && typeof data === "object") {
    const count = Array.isArray(data.logs) ? data.logs.length : Array.isArray(data.items) ? data.items.length : 0;
    return `${count} Logs gefunden`;
  }
  if (typeof data === "object") return `${Object.keys(data).length} Felder geprüft`;
  return String(data).slice(0, 160);
}

async function fetchJson(endpoint: string) {
  const response = await fetch(endpoint, { cache: "no-store" });
  const text = await response.text();
  let data: unknown = text;
  try { data = text ? JSON.parse(text) : {}; } catch {}
  if (!response.ok) throw new Error(typeof data === "string" ? data : pretty(data));
  return data;
}

function renderPanel() {
  if (!panel) return;
  const totals = {
    ok: state.filter((item) => item.status === "ok").length,
    warn: state.filter((item) => item.status === "warn").length,
    error: state.filter((item) => item.status === "error").length,
    loading: state.filter((item) => item.status === "loading").length,
  };
  const selected = state.find((item) => item.key === selectedKey) || state[0];
  panel.innerHTML = `
    <section class="jv-diagnostics-shell jv-diagnostics-bridge">
      <div class="jv-diagnostics-header">
        <div>
          <small>System Diagnostics</small>
          <h1>JARVIS Diagnose</h1>
          <p>Prüft Backend, LLM, Ports, Logs, Dependencies und Repair Plan als klare Statuskarten.</p>
        </div>
        <div class="jv-diagnostics-actions">
          <button data-action="run-all">KOMPLETT PRÜFEN</button>
          <button data-action="chat-repair">REPARATURPLAN IM CHAT</button>
        </div>
      </div>
      <div class="jv-diagnostics-summary">
        <div class="ok"><b>${totals.ok}</b><span>OK</span></div>
        <div class="warn"><b>${totals.warn}</b><span>Warnung</span></div>
        <div class="error"><b>${totals.error}</b><span>Fehler</span></div>
        <div class="loading"><b>${totals.loading}</b><span>Läuft</span></div>
      </div>
      <div class="jv-diagnostics-grid">
        <div class="jv-check-list">
          ${state.map((item) => `
            <button class="jv-check-card ${item.status} ${selectedKey === item.key ? "active" : ""}" data-select="${item.key}">
              <div><b>${escapeHtml(item.title)}</b><span>${escapeHtml(item.endpoint)}</span></div>
              <em>${label(item.status)}</em>
              <p>${escapeHtml(summary(item))}</p>
              <strong data-run="${item.key}">Neu prüfen</strong>
            </button>
          `).join("")}
        </div>
        <div class="jv-diagnostics-detail">
          <div class="jv-detail-title">
            <div><h2>${escapeHtml(selected.title)}</h2><span>${escapeHtml(selected.endpoint)}</span></div>
            <button data-run="${selected.key}">AKTUALISIEREN</button>
          </div>
          <pre>${escapeHtml(selected.error || pretty(selected.data) || "Noch kein Ergebnis vorhanden.")}</pre>
        </div>
      </div>
    </section>
  `;
}

async function runOne(key: string) {
  const index = state.findIndex((item) => item.key === key);
  if (index < 0) return;
  state[index] = { ...state[index], status: "loading", error: undefined };
  renderPanel();
  try {
    const data = await fetchJson(state[index].endpoint);
    state[index] = { ...state[index], status: inferStatus(data), data };
  } catch (error) {
    state[index] = { ...state[index], status: "error", error: error instanceof Error ? error.message : String(error) };
  }
  renderPanel();
}

async function runAll() {
  for (const item of state) await runOne(item.key);
}

function openDiagnostics() {
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "jarvis-diagnostics-bridge";
    document.body.appendChild(panel);
    panel.addEventListener("click", (event) => {
      const target = event.target as HTMLElement | null;
      const select = target?.closest("[data-select]") as HTMLElement | null;
      const run = target?.closest("[data-run]") as HTMLElement | null;
      const action = target?.closest("[data-action]") as HTMLElement | null;
      if (select) {
        selectedKey = select.dataset.select || selectedKey;
        renderPanel();
      }
      if (run) void runOne(run.dataset.run || "");
      if (action?.dataset.action === "run-all") void runAll();
      if (action?.dataset.action === "chat-repair") {
        const input = document.querySelector<HTMLInputElement>(".jarvis-input-row input");
        const send = document.querySelector<HTMLButtonElement>(".send-btn");
        if (input && send) {
          input.value = "Erstelle mir aus der aktuellen Diagnose einen konkreten Reparaturplan";
          input.dispatchEvent(new Event("input", { bubbles: true }));
          send.click();
        }
      }
    });
  }
  panel.style.display = "block";
  renderPanel();
  void runAll();
}

function closeDiagnostics() {
  if (panel) panel.style.display = "none";
}

function installDiagnosticsBridge() {
  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    const item = target?.closest(".jarvis-nav-item") as HTMLElement | null;
    if (!item) return;
    const labelText = item.textContent || "";
    if (labelText.includes("Diagnostics")) {
      window.setTimeout(openDiagnostics, 80);
      return;
    }
    if (!labelText.includes("Diagnostics")) closeDiagnostics();
  }, true);
}

installDiagnosticsBridge();
