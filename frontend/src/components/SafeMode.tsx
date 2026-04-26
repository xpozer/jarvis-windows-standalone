import { useState } from "react";
import { addJarvisLog, copyJarvisLogs, downloadJarvisLogs, getJarvisLogText } from "../diagnostics/logger";

export function SafeMode() {
  const [backend, setBackend] = useState("noch nicht getestet");

  async function testBackend() {
    setBackend("prüfe...");
    try {
      const res = await fetch("http://127.0.0.1:8000/docs");
      setBackend(res.ok ? "online" : `HTTP ${res.status}`);
      addJarvisLog(res.ok ? "info" : "warn", "safe-mode", `Backend Test: ${res.status}`);
    } catch (err) {
      setBackend("nicht erreichbar");
      addJarvisLog("error", "safe-mode", err);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(circle at center, #06233b 0%, #02040a 58%, #000 100%)", color: "#e8f6ff", padding: 28, fontFamily: "Consolas, monospace" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", border: "1px solid rgba(0,180,255,.4)", borderRadius: 18, padding: 24, background: "rgba(0,10,22,.82)", boxShadow: "0 0 60px rgba(0,180,255,.18)" }}>
        <h1 style={{ marginTop: 0, color: "#7ee7ff" }}>JARVIS Safe Mode</h1>
        <p>Die normale Oberfläche wird hier bewusst nicht geladen. Damit können wir prüfen, ob React/Vite grundsätzlich läuft und ob das Backend erreichbar ist.</p>
        <div style={{ lineHeight: 1.7 }}>
          <div>Frontend: online</div>
          <div>Backend: {backend}</div>
          <div>URL: {location.href}</div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
          <button style={btn} onClick={testBackend}>Backend testen</button>
          <button style={btn} onClick={() => { localStorage.setItem("jarvis_safe_mode", "0"); location.href = location.origin + location.pathname + "?diag=1"; }}>Normale UI mit Diagnose starten</button>
          <button style={btn} onClick={() => { localStorage.clear(); location.href = location.origin + location.pathname + "?diag=1"; }}>Storage löschen + normal starten</button>
          <button style={btn} onClick={() => copyJarvisLogs()}>Log kopieren</button>
          <button style={btn} onClick={() => downloadJarvisLogs()}>Log speichern</button>
        </div>
        <textarea readOnly value={getJarvisLogText()} style={{ width: "100%", height: 330, marginTop: 18, background: "#010309", color: "#dff8ff", border: "1px solid rgba(0,190,255,.25)", borderRadius: 12, padding: 12 }} />
      </div>
    </div>
  );
}

const btn: React.CSSProperties = {
  background: "rgba(0,180,255,.18)",
  color: "#e8f6ff",
  border: "1px solid rgba(0,180,255,.45)",
  borderRadius: 10,
  padding: "10px 14px",
  cursor: "pointer",
};
