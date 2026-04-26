import React from "react";
import { addJarvisLog, copyJarvisLogs, downloadJarvisLogs, getJarvisLogText } from "../diagnostics/logger";

type Props = { children: React.ReactNode };
type State = { error?: Error; info?: React.ErrorInfo };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = {};

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    addJarvisLog("error", "react-error-boundary", error, { componentStack: info.componentStack });
    this.setState({ error, info });
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div style={{ minHeight: "100vh", background: "#05070d", color: "#e8f6ff", padding: 24, fontFamily: "Consolas, monospace" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", border: "1px solid rgba(0,180,255,.35)", borderRadius: 16, padding: 24, background: "rgba(0,20,35,.75)" }}>
          <h1 style={{ marginTop: 0, color: "#7ee7ff" }}>JARVIS Frontend Fehler</h1>
          <p>Die Oberfläche ist beim Laden abgestürzt. Der Fehler wird unten angezeigt und wurde im Diagnose Log gespeichert.</p>
          <pre style={{ whiteSpace: "pre-wrap", background: "rgba(255,0,80,.12)", border: "1px solid rgba(255,0,80,.35)", padding: 16, borderRadius: 12 }}>
            {this.state.error.name}: {this.state.error.message}{"\n"}{this.state.error.stack}
          </pre>
          {this.state.info?.componentStack && (
            <pre style={{ whiteSpace: "pre-wrap", background: "rgba(255,255,255,.06)", padding: 16, borderRadius: 12 }}>
              {this.state.info.componentStack}
            </pre>
          )}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
            <button onClick={() => location.reload()} style={btn}>Neu laden</button>
            <button onClick={() => { localStorage.clear(); location.reload(); }} style={btn}>LocalStorage löschen + neu laden</button>
            <button onClick={() => { localStorage.setItem("jarvis_safe_mode", "1"); location.reload(); }} style={btn}>Safe Mode starten</button>
            <button onClick={() => copyJarvisLogs()} style={btn}>Log kopieren</button>
            <button onClick={() => downloadJarvisLogs()} style={btn}>Log speichern</button>
          </div>
          <textarea readOnly value={getJarvisLogText()} style={{ width: "100%", height: 260, marginTop: 18, background: "#02040a", color: "#d7f7ff", border: "1px solid rgba(0,180,255,.25)", borderRadius: 12, padding: 12 }} />
        </div>
      </div>
    );
  }
}

const btn: React.CSSProperties = {
  background: "rgba(0,180,255,.18)",
  color: "#e8f6ff",
  border: "1px solid rgba(0,180,255,.45)",
  borderRadius: 10,
  padding: "10px 14px",
  cursor: "pointer",
};
