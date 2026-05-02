import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/inter-tight/400.css";
import "@fontsource/inter-tight/600.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/600.css";
import "./styles/tokens.css";
import "./diagnostics/logger";
import { AppProviders } from "./api/providers";
import { addJarvisLog } from "./diagnostics/logger";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { DiagnosticsOverlay } from "./components/DiagnosticsOverlay";
import { SafeMode } from "./components/SafeMode";

function markMounted() {
  try {
    (window as any).__JARVIS_REACT_MOUNTED__ = true;
    const d = document.getElementById("bootdiag");
    if (d) d.style.display = "none";
    const bootLog = (window as any).__JARVIS_BOOT_LOG__;
    if (typeof bootLog === "function") bootLog("INFO", "React gemountet");
  } catch {}
}

function FatalBootError({ error }: { error: unknown }) {
  const err = error instanceof Error ? error : new Error(String(error));
  return (
    <div style={{ minHeight: "100vh", background: "#02040a", color: "#e8f6ff", padding: 24, fontFamily: "Consolas, monospace" }}>
      <h1 style={{ color: "#7ee7ff" }}>JARVIS Frontend Fehler</h1>
      <p>Die Oberflaeche konnte nicht sauber geladen werden. Der Fehler steht unten und wurde im Diagnose Log gespeichert.</p>
      <pre style={{ whiteSpace: "pre-wrap", background: "rgba(255,0,80,.12)", border: "1px solid rgba(255,0,80,.35)", padding: 16, borderRadius: 12 }}>{err.name}: {err.message}{"\n"}{err.stack}</pre>
      <button onClick={() => { localStorage.clear(); location.href = "/?safe=1"; }} style={{ background: "rgba(0,180,255,.18)", color: "#e8f6ff", border: "1px solid rgba(0,180,255,.45)", borderRadius: 10, padding: "10px 14px", cursor: "pointer" }}>Storage loeschen und Safe Mode</button>
      <button onClick={() => { location.href = "/diagnose.html"; }} style={{ marginLeft: 8, background: "rgba(0,180,255,.18)", color: "#e8f6ff", border: "1px solid rgba(0,180,255,.45)", borderRadius: 10, padding: "10px 14px", cursor: "pointer" }}>Statische Diagnose</button>
    </div>
  );
}

function runBootSequence(): Promise<void> {
  const params = new URLSearchParams(location.search);
  if (params.has("noboot") || params.has("stackPreview") || localStorage.getItem("jarvis_boot_disabled") === "1") return Promise.resolve();

  return new Promise((resolve) => {
    let done = false;
    const overlay = document.createElement("div");
    overlay.className = "jarvis-command-grid-boot-host";
    overlay.innerHTML = `
      <iframe class="jarvis-command-grid-boot-frame" src="/jarvis-command-grid-boot.html" title="JARVIS Bootsequenz"></iframe>
      <button class="jarvis-command-grid-boot-skip" type="button">BOOT UEBERSPRINGEN</button>
    `;

    const style = document.createElement("style");
    style.id = "jarvis-command-grid-boot-host-style";
    style.textContent = `
      .jarvis-command-grid-boot-host{position:fixed;inset:0;z-index:2147483000;background:#000814;overflow:hidden;transition:opacity .55s ease,transform .55s ease}
      .jarvis-command-grid-boot-host.is-out{opacity:0;transform:scale(1.012);pointer-events:none}
      .jarvis-command-grid-boot-frame{position:absolute;inset:0;width:100%;height:100%;border:0;background:#000814}
      .jarvis-command-grid-boot-skip{position:absolute;right:28px;bottom:24px;z-index:2;border:1px solid rgba(0,212,255,.35);border-radius:999px;background:rgba(0,8,20,.68);color:rgba(220,250,255,.82);font:11px Consolas,monospace;letter-spacing:2px;padding:10px 14px;cursor:pointer;backdrop-filter:blur(10px);box-shadow:0 0 22px rgba(0,212,255,.16)}
      .jarvis-command-grid-boot-skip:hover{color:#fff;border-color:rgba(0,212,255,.72);box-shadow:0 0 30px rgba(0,212,255,.28)}
    `;

    function finish() {
      if (done) return;
      done = true;
      window.removeEventListener("message", onMessage);
      overlay.classList.add("is-out");
      setTimeout(() => {
        overlay.remove();
        resolve();
      }, 580);
    }

    function onMessage(event: MessageEvent) {
      const data = event.data as { type?: string } | undefined;
      if (data?.type === "jarvis-command-grid-boot-complete") finish();
    }

    window.addEventListener("message", onMessage);
    overlay.querySelector("button")?.addEventListener("click", finish);
    if (!document.getElementById(style.id)) document.head.appendChild(style);
    document.body.appendChild(overlay);
    setTimeout(finish, 11000);
  });
}
async function boot() {
  const root = document.getElementById("root");
  if (!root) return;
  try {
    const params = new URLSearchParams(location.search);
    const safe = params.has("safe") || localStorage.getItem("jarvis_safe_mode") === "1";
    const stackPreview = params.has("stackPreview");
    addJarvisLog("info", "boot", safe ? "Safe Mode" : stackPreview ? "Stack Preview" : "Normale App");
    if (safe) {
      createRoot(root).render(<StrictMode><AppProviders><SafeMode /><DiagnosticsOverlay /></AppProviders></StrictMode>);
      setTimeout(markMounted, 50);
      return;
    }
    if (stackPreview) {
      const mod = await import("./components/dashboard/StackMigrationPreview");
      const StackMigrationPreview = mod.StackMigrationPreview;
      createRoot(root).render(<StrictMode><AppProviders><StackMigrationPreview /><DiagnosticsOverlay /></AppProviders></StrictMode>);
      setTimeout(markMounted, 50);
      return;
    }
    await runBootSequence();
    const mod = await import("./App");
    const App = mod.App;
    createRoot(root).render(<StrictMode><AppProviders><ErrorBoundary><App /></ErrorBoundary><DiagnosticsOverlay /></AppProviders></StrictMode>);
    setTimeout(markMounted, 50);
  } catch (error) {
    addJarvisLog("error", "boot", error);
    createRoot(root).render(<StrictMode><AppProviders><FatalBootError error={error} /><DiagnosticsOverlay /></AppProviders></StrictMode>);
    setTimeout(markMounted, 50);
  }
}

boot();
