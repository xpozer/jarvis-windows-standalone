import { useEffect, useState } from "react";
import { addJarvisLog, copyJarvisLogs, downloadJarvisLogs, getJarvisLogText, getJarvisLogs } from "../diagnostics/logger";

interface HealthData {
  status: string;
  ollama: boolean;
  ollama_base: string;
  model_default: string;
  agent_active: string | null;
  agent_phase: string;
  last_error: string | null;
  time: string;
}

export function DiagnosticsOverlay() {
  const [open, setOpen] = useState(new URLSearchParams(location.search).has("diag"));
  const [tick, setTick] = useState(0);
  const [backend, setBackend] = useState("unbekannt");
  const [health, setHealth] = useState<HealthData | null>(null);
  const [healthErr, setHealthErr] = useState<string | null>(null);

  useEffect(() => {
    const i = setInterval(() => setTick(t => t + 1), 1000);
    const key = (e: KeyboardEvent) => {
      if (e.key === "F2") setOpen(o => !o);
      if (e.key === "F8") {
        localStorage.setItem("jarvis_safe_mode", "1");
        location.reload();
      }
    };
    window.addEventListener("keydown", key);
    return () => { clearInterval(i); window.removeEventListener("keydown", key); };
  }, []);

  // Health-Status automatisch alle 5 Sekunden wenn Panel offen
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch("http://127.0.0.1:8000/health", { method: "GET" });
        if (!cancelled) {
          if (res.ok) {
            const data: HealthData = await res.json();
            setHealth(data);
            setBackend(data.status === "online" ? "online" : "degraded");
            setHealthErr(null);
          } else {
            setBackend(`HTTP ${res.status}`);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setBackend("nicht erreichbar");
          setHealthErr(String(err));
        }
      }
    }
    poll();
    const timer = setInterval(poll, 5000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [open]);

  async function testBackend() {
    setBackend("prüfe...");
    setHealth(null);
    try {
      const res = await fetch("http://127.0.0.1:8000/health", { method: "GET" });
      if (res.ok) {
        const data: HealthData = await res.json();
        setHealth(data);
        setBackend("online");
        addJarvisLog("info", "backend-test", `Health OK | Ollama: ${data.ollama} | Agent: ${data.agent_phase}`);
      } else {
        setBackend(`antwortet mit HTTP ${res.status}`);
        addJarvisLog("warn", "backend-test", `Backend /health: ${res.status}`);
      }
    } catch (err) {
      setBackend("nicht erreichbar");
      setHealthErr(String(err));
      addJarvisLog("error", "backend-test", err);
    }
  }

  const errors = getJarvisLogs().filter(l => l.level === "error").length;
  const warnings = getJarvisLogs().filter(l => l.level === "warn").length;

  const statusColor = (ok: boolean) => ok ? "#00e87a" : "#ff4466";

  return (
    <div style={{ position: "fixed", right: 12, bottom: 12, zIndex: 2147483647, fontFamily: "Consolas, monospace" }}>
      {!open && (
        <button onClick={() => setOpen(true)} style={{ ...button, opacity: .82 }} title="JARVIS Diagnose öffnen. Tastenkürzel: F2">
          DIAG {errors ? `ERR ${errors}` : "OK"}
        </button>
      )}
      {open && (
        <div style={{ width: 540, maxWidth: "calc(100vw - 24px)", maxHeight: "85vh", overflow: "auto", background: "rgba(2,6,14,.96)", color: "#dff8ff", border: "1px solid rgba(0,190,255,.45)", borderRadius: 14, boxShadow: "0 0 40px rgba(0,170,255,.22)", padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
            <strong style={{ color: "#7ee7ff" }}>JARVIS Diagnose</strong>
            <button onClick={() => setOpen(false)} style={smallButton}>schließen</button>
          </div>

          {/* Backend Health Block */}
          <div style={{ marginTop: 10, fontSize: 12, lineHeight: 1.7, background: "rgba(0,20,40,.6)", borderRadius: 8, padding: "8px 10px" }}>
            <div style={{ color: "#7ee7ff", marginBottom: 4, fontWeight: "bold" }}>Backend</div>
            <div>Status: <span style={{ color: backend === "online" ? "#00e87a" : "#ff4466" }}>{backend}</span></div>
            {health && <>
              <div>Ollama: <span style={{ color: statusColor(health.ollama) }}>{health.ollama ? "erreichbar" : "nicht erreichbar"}</span>{" "}
                <span style={{ opacity: .6 }}>({health.ollama_base})</span>
              </div>
              <div>Modell: <span style={{ color: "#a8d8ea" }}>{health.model_default}</span></div>
              <div>Agent: <span style={{ color: health.agent_active ? "#ffb300" : "#6ec4ff" }}>
                {health.agent_active ? `${health.agent_active} (${health.agent_phase})` : health.agent_phase}
              </span></div>
              {health.last_error && (
                <div style={{ marginTop: 4, color: "#ff6680", wordBreak: "break-all" }}>
                  Letzter Fehler: {health.last_error}
                </div>
              )}
              <div style={{ opacity: .5, marginTop: 2 }}>Stand: {health.time}</div>
            </>}
            {healthErr && <div style={{ color: "#ff6680", marginTop: 4 }}>{healthErr}</div>}
          </div>

          {/* Frontend Status */}
          <div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.7, background: "rgba(0,20,40,.6)", borderRadius: 8, padding: "8px 10px" }}>
            <div style={{ color: "#7ee7ff", marginBottom: 4, fontWeight: "bold" }}>Frontend</div>
            <div>Logs: {getJarvisLogs().length} |{" "}
              <span style={{ color: errors ? "#ff4466" : "#00e87a" }}>Fehler: {errors}</span> |{" "}
              <span style={{ color: warnings ? "#ffb300" : "#dff8ff" }}>Warnungen: {warnings}</span>
            </div>
            <div>Safe Mode: {localStorage.getItem("jarvis_safe_mode") === "1" ? <span style={{ color: "#ffb300" }}>aktiv</span> : "aus"}</div>
            <div style={{ opacity: .6 }}>F2 Diagnose | F8 Safe Mode</div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
            <button onClick={testBackend} style={smallButton}>Health abrufen</button>
            <button onClick={() => copyJarvisLogs()} style={smallButton}>Log kopieren</button>
            <button onClick={() => downloadJarvisLogs()} style={smallButton}>Log speichern</button>
            <button onClick={() => { localStorage.clear(); location.reload(); }} style={smallButton}>Storage löschen</button>
            <button onClick={() => { localStorage.setItem("jarvis_safe_mode", "1"); location.reload(); }} style={smallButton}>Safe Mode</button>
            <button onClick={() => { localStorage.setItem("jarvis_safe_mode", "0"); location.href = location.origin + location.pathname; }} style={smallButton}>Normal Mode</button>
          </div>
          <textarea readOnly key={tick} value={getJarvisLogText()} style={{ marginTop: 10, width: "100%", height: 240, resize: "vertical", background: "#010309", color: "#dff8ff", border: "1px solid rgba(0,190,255,.25)", borderRadius: 10, padding: 10, fontSize: 12 }} />
        </div>
      )}
    </div>
  );
}

const button: React.CSSProperties = {
  background: "rgba(0,180,255,.22)", color: "#e8f6ff", border: "1px solid rgba(0,180,255,.48)", borderRadius: 10, padding: "9px 12px", cursor: "pointer",
};
const smallButton: React.CSSProperties = { ...button, padding: "7px 10px", fontSize: 12 };
