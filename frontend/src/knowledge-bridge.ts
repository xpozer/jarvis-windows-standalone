type PanelState = {
  stats?: unknown;
  documents?: unknown[];
  categories?: unknown[];
  files?: unknown[];
  results?: unknown[];
  answer?: string;
  error?: string;
  loading?: boolean;
  query: string;
};

let panel: HTMLElement | null = null;
let state: PanelState = { query: "" };

function pretty(value: unknown) {
  if (value === undefined) return "";
  if (typeof value === "string") return value;
  try { return JSON.stringify(value, null, 2); } catch { return String(value); }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char] || char));
}

function listFrom(data: unknown, keys: string[]) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  const obj = data as Record<string, unknown>;
  for (const key of keys) if (Array.isArray(obj[key])) return obj[key] as unknown[];
  return [];
}

function titleOf(item: unknown, fallback: string) {
  if (!item || typeof item !== "object") return fallback;
  const obj = item as Record<string, unknown>;
  return String(obj.title || obj.name || obj.filename || obj.id || fallback);
}

function textOf(item: unknown) {
  if (!item || typeof item !== "object") return String(item ?? "");
  const obj = item as Record<string, unknown>;
  return String(obj.text || obj.content || obj.snippet || obj.summary || obj.text_preview || obj.path || "");
}

async function fetchJson(url: string, options?: RequestInit) {
  const response = await fetch(url, { cache: "no-store", ...options });
  const text = await response.text();
  let data: unknown = text;
  try { data = text ? JSON.parse(text) : {}; } catch {}
  if (!response.ok) throw new Error(typeof data === "string" ? data : pretty(data));
  return data;
}

async function refreshKnowledge() {
  state = { ...state, loading: true, error: undefined };
  renderPanel();
  try {
    const [stats, documentsData, categoriesData, filesData] = await Promise.all([
      fetchJson("/knowledge/stats"),
      fetchJson("/knowledge/documents"),
      fetchJson("/knowledge/categories"),
      fetchJson("/api/files"),
    ]);
    state = {
      ...state,
      stats,
      documents: listFrom(documentsData, ["documents", "items", "results"]),
      categories: listFrom(categoriesData, ["categories", "items", "results"]),
      files: listFrom(filesData, ["files", "items", "results"]),
      loading: false,
      error: undefined,
    };
  } catch (error) {
    state = { ...state, loading: false, error: error instanceof Error ? error.message : String(error) };
  }
  renderPanel();
}

async function runSearch(answer = false) {
  const q = state.query.trim();
  if (!q) return;
  state = { ...state, loading: true, error: undefined };
  renderPanel();
  try {
    if (answer) {
      const data = await fetchJson(`/knowledge/answer?q=${encodeURIComponent(q)}&limit=8`);
      const obj = data as Record<string, unknown>;
      state = {
        ...state,
        answer: String(obj.answer || obj.response || obj.result || pretty(data)),
        results: listFrom(data, ["results", "items", "documents"]),
        loading: false,
      };
    } else {
      const data = await fetchJson(`/knowledge/search?q=${encodeURIComponent(q)}&limit=10`);
      state = { ...state, results: listFrom(data, ["results", "items", "documents"]), answer: undefined, loading: false };
    }
  } catch (error) {
    state = { ...state, loading: false, error: error instanceof Error ? error.message : String(error) };
  }
  renderPanel();
}

async function rebuildKnowledge() {
  state = { ...state, loading: true, error: undefined };
  renderPanel();
  try {
    await fetchJson("/knowledge/rebuild", { method: "POST" });
    await refreshKnowledge();
  } catch (error) {
    state = { ...state, loading: false, error: error instanceof Error ? error.message : String(error) };
    renderPanel();
  }
}

function sendToChat(text: string) {
  const input = document.querySelector<HTMLInputElement>(".jarvis-input-row input");
  const send = document.querySelector<HTMLButtonElement>(".send-btn");
  if (!input || !send) return;
  input.value = text;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  send.click();
}

function cardHtml(item: unknown, index: number, type: string) {
  const title = titleOf(item, `${type} ${index + 1}`);
  const text = textOf(item);
  return `
    <article class="jv-kb-item">
      <div><b>${escapeHtml(title)}</b><span>${escapeHtml(text.slice(0, 190) || "Keine Vorschau")}</span></div>
      <button data-chat="${escapeHtml(`Beantworte eine Frage zu ${title}: ${state.query || "Fasse den Inhalt zusammen"}`)}">CHAT</button>
    </article>
  `;
}

function renderPanel() {
  if (!panel) return;
  const docs = state.documents || [];
  const files = state.files || [];
  const categories = state.categories || [];
  const results = state.results || [];
  panel.innerHTML = `
    <section class="jv-knowledge-shell">
      <div class="jv-knowledge-header">
        <div>
          <small>Knowledge Base</small>
          <h1>JARVIS Wissen</h1>
          <p>Lokale Dokumente, Uploads, Kategorien und semantische Suche als eigene Arbeitsfläche.</p>
        </div>
        <div class="jv-knowledge-actions">
          <button data-action="refresh">AKTUALISIEREN</button>
          <button data-action="rebuild">INDEX NEU BAUEN</button>
        </div>
      </div>
      ${state.error ? `<div class="jv-knowledge-error">${escapeHtml(state.error)}</div>` : ""}
      <div class="jv-knowledge-search">
        <input value="${escapeHtml(state.query)}" placeholder="Knowledge Base durchsuchen..." />
        <button data-action="search">SUCHEN</button>
        <button data-action="answer">ANTWORT</button>
      </div>
      <div class="jv-knowledge-stats">
        <div><b>${docs.length}</b><span>Dokumente</span></div>
        <div><b>${files.length}</b><span>Uploads</span></div>
        <div><b>${categories.length}</b><span>Kategorien</span></div>
        <div><b>${results.length}</b><span>Treffer</span></div>
      </div>
      <div class="jv-knowledge-grid">
        <section class="jv-knowledge-card jv-results-card">
          <div class="jv-knowledge-title"><h2>${state.answer ? "Antwort" : "Suchergebnisse"}</h2><span>${state.loading ? "lädt" : "live"}</span></div>
          ${state.answer ? `<pre>${escapeHtml(state.answer)}</pre>` : `<div class="jv-kb-list">${results.length ? results.map((item, i) => cardHtml(item, i, "Treffer")).join("") : `<div class="jv-kb-empty">Noch keine Suche ausgeführt.</div>`}</div>`}
        </section>
        <section class="jv-knowledge-card">
          <div class="jv-knowledge-title"><h2>Dokumente</h2><span>${docs.length}</span></div>
          <div class="jv-kb-list compact">${docs.length ? docs.slice(0, 20).map((item, i) => cardHtml(item, i, "Dokument")).join("") : `<div class="jv-kb-empty">Keine Dokumente im Index.</div>`}</div>
        </section>
        <section class="jv-knowledge-card">
          <div class="jv-knowledge-title"><h2>Uploads</h2><span>${files.length}</span></div>
          <div class="jv-kb-list compact">${files.length ? files.slice(0, 20).map((item, i) => cardHtml(item, i, "Upload")).join("") : `<div class="jv-kb-empty">Noch keine Uploads.</div>`}</div>
        </section>
        <section class="jv-knowledge-card">
          <div class="jv-knowledge-title"><h2>Kategorien</h2><span>${categories.length}</span></div>
          <div class="jv-category-list">${categories.length ? categories.map((cat) => `<button data-query="${escapeHtml(titleOf(cat, String(cat)))}">${escapeHtml(titleOf(cat, String(cat)))}</button>`).join("") : `<div class="jv-kb-empty">Keine Kategorien.</div>`}</div>
        </section>
      </div>
    </section>
  `;
}

function openKnowledge() {
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "jarvis-knowledge-bridge";
    document.body.appendChild(panel);
    panel.addEventListener("input", (event) => {
      const target = event.target as HTMLInputElement | null;
      if (target?.closest(".jv-knowledge-search")) state.query = target.value;
    });
    panel.addEventListener("keydown", (event) => {
      const key = event as KeyboardEvent;
      if (key.key === "Enter" && (key.target as HTMLElement)?.closest(".jv-knowledge-search")) void runSearch(false);
    });
    panel.addEventListener("click", (event) => {
      const target = event.target as HTMLElement | null;
      const action = target?.closest("[data-action]") as HTMLElement | null;
      const chat = target?.closest("[data-chat]") as HTMLElement | null;
      const category = target?.closest("[data-query]") as HTMLElement | null;
      if (action?.dataset.action === "refresh") void refreshKnowledge();
      if (action?.dataset.action === "rebuild") void rebuildKnowledge();
      if (action?.dataset.action === "search") void runSearch(false);
      if (action?.dataset.action === "answer") void runSearch(true);
      if (chat?.dataset.chat) sendToChat(chat.dataset.chat);
      if (category?.dataset.query) {
        state.query = category.dataset.query;
        renderPanel();
        void runSearch(false);
      }
    });
  }
  panel.style.display = "block";
  renderPanel();
  void refreshKnowledge();
}

function closeKnowledge() {
  if (panel) panel.style.display = "none";
}

function installKnowledgeBridge() {
  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    const item = target?.closest(".jarvis-nav-item") as HTMLElement | null;
    if (!item) return;
    const text = item.textContent || "";
    if (text.includes("Knowledge Base") || text.includes("Memory Banks")) {
      window.setTimeout(openKnowledge, 80);
      return;
    }
    closeKnowledge();
  }, true);
}

installKnowledgeBridge();

export {};
