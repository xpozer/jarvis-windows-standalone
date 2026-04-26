import { useState, useCallback, useEffect } from "react";
import { useSettings } from "../hooks/useSettings";

// ── Typen ────────────────────────────────────────────────────────────────────

interface ManagedAgent {
  id: string;
  name: string;
  agent_type: string;
  status: string;
  created_at?: string;
}

interface AgentMessage {
  id: string;
  role: string;
  content: string;
  created_at?: string;
}

interface MemorySearchResult {
  content: string;
  score: number;
  metadata?: Record<string, unknown>;
}

interface MemoryStats {
  entries: number;
  backend: string;
}

type Tab = "agent" | "research" | "knowledge";

// Stanford-Agent-Typen
const AGENT_TYPES = [
  "simple",
  "orchestrator",
  "native_react",
  "native_openhands",
  "operative",
  "monitor_operative",
  "deep_research",
  "morning_digest",
];

// ── Agent-Panel ───────────────────────────────────────────────────────────────
function AgentPanel() {
  const { settings } = useSettings();
  const apiUrl = settings.apiUrl;

  const [agents, setAgents] = useState<ManagedAgent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<string>("simple");

  const loadAgents = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/v1/managed-agents`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAgents(data.agents || []);
    } catch (e) {
      setError(`Agentenliste nicht erreichbar: ${(e as Error).message}`);
    }
  }, [apiUrl]);

  const loadMessages = useCallback(async (agentId: string) => {
    try {
      const res = await fetch(`${apiUrl}/v1/managed-agents/${agentId}/messages`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (e) {
      setError(`Nachrichten laden fehlgeschlagen: ${(e as Error).message}`);
    }
  }, [apiUrl]);

  useEffect(() => { loadAgents(); }, [loadAgents]);

  useEffect(() => {
    if (selectedId) loadMessages(selectedId);
  }, [selectedId, loadMessages]);

  async function createAgent() {
    if (!newName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/v1/managed-agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), agent_type: newType }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const created = await res.json();
      setAgents((prev) => [...prev, created]);
      setSelectedId(created.id);
      setShowCreate(false);
      setNewName("");
    } catch (e) {
      setError(`Anlegen fehlgeschlagen: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    if (!selectedId || !input.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/v1/managed-agents/${selectedId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input.trim(), mode: "immediate" }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setInput("");
      setTimeout(() => loadMessages(selectedId), 800);
    } catch (e) {
      setError(`Senden fehlgeschlagen: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  async function deleteAgent(agentId: string) {
    if (!confirm("Agent wirklich löschen?")) return;
    try {
      const res = await fetch(`${apiUrl}/v1/managed-agents/${agentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setAgents((prev) => prev.filter((a) => a.id !== agentId));
      if (selectedId === agentId) {
        setSelectedId(null);
        setMessages([]);
      }
    } catch (e) {
      setError(`Löschen fehlgeschlagen: ${(e as Error).message}`);
    }
  }

  return (
    <div className="agent-panel">
      <div className="set-section">
        <div className="set-row" style={{ justifyContent: "space-between" }}>
          <div className="set-label">Verwaltete Agenten ({agents.length})</div>
          <button className="set-preview-btn" onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? "Abbrechen" : "Neuen Agenten anlegen"}
          </button>
        </div>

        {showCreate && (
          <div className="set-section" style={{ marginTop: 10 }}>
            <div className="set-row">
              <span className="set-label">Name</span>
              <input
                className="set-input"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="z.B. Arbeitsassistent"
              />
            </div>
            <div className="set-row">
              <span className="set-label">Typ</span>
              <select
                className="set-input"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
              >
                {AGENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <button className="set-preview-btn" onClick={createAgent} disabled={loading}>
              {loading ? "Erstelle..." : "Anlegen"}
            </button>
          </div>
        )}

        <div className="agent-list" style={{ marginTop: 10 }}>
          {agents.length === 0 && (
            <div className="set-hint">Keine Agenten vorhanden. Leg einen neuen an.</div>
          )}
          {agents.map((a) => (
            <div
              key={a.id}
              className={`agent-item ${selectedId === a.id ? "selected" : ""}`}
              onClick={() => setSelectedId(a.id)}
              style={{
                padding: "8px 10px",
                border: "1px solid var(--border, #333)",
                borderRadius: 6,
                marginBottom: 6,
                cursor: "pointer",
                background: selectedId === a.id ? "rgba(100,150,255,0.15)" : "transparent",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong>{a.name}</strong>{" "}
                  <span style={{ opacity: 0.6 }}>({a.agent_type})</span>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: "0.8em", opacity: 0.7 }}>{a.status}</span>
                  <button
                    className="set-preview-btn"
                    style={{ padding: "2px 8px" }}
                    onClick={(e) => { e.stopPropagation(); deleteAgent(a.id); }}
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedId && (
        <div className="set-section">
          <div className="set-label">Konversation</div>
          <div
            className="agent-messages"
            style={{
              maxHeight: 300,
              overflowY: "auto",
              border: "1px solid var(--border, #333)",
              borderRadius: 6,
              padding: 10,
              marginBottom: 10,
            }}
          >
            {messages.length === 0 && <div className="set-hint">Noch keine Nachrichten</div>}
            {messages.map((m) => (
              <div key={m.id} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: "0.75em", opacity: 0.6 }}>{m.role}</div>
                <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
              </div>
            ))}
          </div>
          <div className="set-row">
            <input
              className="set-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
              placeholder="Nachricht an Agent..."
              disabled={loading}
            />
            <button
              className="set-preview-btn"
              onClick={sendMessage}
              disabled={loading || !input.trim()}
            >
              Senden
            </button>
          </div>
        </div>
      )}

      {error && <div className="set-hint" style={{ color: "#e55" }}>{error}</div>}
    </div>
  );
}

// ── Research-Panel ────────────────────────────────────────────────────────────
// Stanford bietet Deep Research nur als Agent-Typ oder CLI, nicht als direkter Endpoint.
function ResearchPanel() {
  return (
    <div className="research-panel">
      <div className="set-section">
        <div className="set-label">Deep Research</div>
        <div className="set-hint" style={{ lineHeight: 1.6 }}>
          Deep Research läuft als eigener Agent-Typ.
          Wechsle in den Tab AGENTEN, lege einen Agenten vom Typ{" "}
          <strong>deep_research</strong> an und stell ihm deine Forschungsfrage.
          <br /><br />
          Alternativ im Terminal:
          <pre style={{
            background: "rgba(255,255,255,0.05)",
            padding: 10,
            borderRadius: 6,
            marginTop: 8,
            fontSize: "0.85em",
          }}>
{`uv run jarvis ask "Deine Forschungsfrage"

# oder als Preset einrichten
jarvis init --preset deep-research
jarvis memory index ./docs/
jarvis ask "Frage"`}
          </pre>
          Eine direkte HTTP-Anbindung folgt sobald Stanford den Endpoint veröffentlicht.
        </div>
      </div>
    </div>
  );
}

// ── Knowledge-Panel ───────────────────────────────────────────────────────────
function KnowledgePanel() {
  const { settings } = useSettings();
  const apiUrl = settings.apiUrl;

  const [query, setQuery] = useState("");
  const [topK, setTopK] = useState(5);
  const [results, setResults] = useState<MemorySearchResult[]>([]);
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [indexPath, setIndexPath] = useState("");
  const [indexed, setIndexed] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/v1/memory/stats`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStats({ entries: data.entries ?? 0, backend: data.backend ?? "?" });
    } catch (e) {
      setError(`Stats nicht erreichbar: ${(e as Error).message}`);
    }
  }, [apiUrl]);

  useEffect(() => { loadStats(); }, [loadStats]);

  async function search() {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const res = await fetch(`${apiUrl}/v1/memory/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), top_k: topK }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (e) {
      setError(`Suche fehlgeschlagen: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  async function indexFiles() {
    if (!indexPath.trim()) return;
    setLoading(true);
    setError(null);
    setIndexed(null);
    try {
      const res = await fetch(`${apiUrl}/v1/memory/index`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: indexPath.trim() }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setIndexed(`Indexiert: ${data.stored ?? data.chunks ?? "?"} Einträge`);
      loadStats();
    } catch (e) {
      setError(`Indexierung fehlgeschlagen: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="knowledge-panel">
      <div className="set-section">
        <div className="set-label">Wissensbasis-Status</div>
        {stats ? (
          <div className="set-hint">
            {stats.entries} Einträge im Backend <strong>{stats.backend}</strong>
          </div>
        ) : (
          <div className="set-hint">Lade...</div>
        )}
        <button className="set-preview-btn" onClick={loadStats}>Aktualisieren</button>
      </div>

      <div className="set-section">
        <div className="set-label">Dateien/Ordner indexieren</div>
        <div className="set-row">
          <input
            className="set-input"
            value={indexPath}
            onChange={(e) => setIndexPath(e.target.value)}
            placeholder="Ordnerpfad eingeben"
          />
          <button className="set-preview-btn" onClick={indexFiles} disabled={loading}>
            {loading ? "..." : "Indexieren"}
          </button>
        </div>
        {indexed && <div className="set-hint" style={{ color: "#5c5" }}>{indexed}</div>}
      </div>

      <div className="set-section">
        <div className="set-label">Suche</div>
        <div className="set-row">
          <input
            className="set-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") search(); }}
            placeholder="Suchbegriff..."
          />
          <input
            className="set-input"
            type="number"
            min={1}
            max={20}
            value={topK}
            onChange={(e) => setTopK(Number(e.target.value))}
            style={{ width: 60 }}
          />
          <button className="set-preview-btn" onClick={search} disabled={loading || !query.trim()}>
            Suchen
          </button>
        </div>

        {results.length > 0 && (
          <div className="search-results" style={{ marginTop: 10 }}>
            {results.map((r, i) => (
              <div
                key={i}
                style={{
                  padding: 10,
                  border: "1px solid var(--border, #333)",
                  borderRadius: 6,
                  marginBottom: 6,
                }}
              >
                <div style={{ fontSize: "0.75em", opacity: 0.6 }}>
                  Score: {r.score.toFixed(3)}
                </div>
                <div>{r.content}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <div className="set-hint" style={{ color: "#e55" }}>{error}</div>}
    </div>
  );
}

// ── Hauptkomponente ───────────────────────────────────────────────────────────
export function AgentSystemPage() {
  const [tab, setTab] = useState<Tab>("agent");

  const TABS: { id: Tab; label: string }[] = [
    { id: "agent", label: "AGENTEN" },
    { id: "research", label: "DEEP RESEARCH" },
    { id: "knowledge", label: "WISSENSBASIS" },
  ];

  return (
    <div className="calc-root">
      <div className="calc-header">
        <div className="calc-title">AGENT-SYSTEM</div>
        <div className="calc-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`calc-tab ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="calc-content">
        {tab === "agent" && <AgentPanel />}
        {tab === "research" && <ResearchPanel />}
        {tab === "knowledge" && <KnowledgePanel />}
      </div>
    </div>
  );
}
