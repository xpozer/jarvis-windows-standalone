import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./diagnostics/logger";
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
      <p>Die Oberfläche konnte nicht sauber geladen werden. Der Fehler steht unten und wurde im Diagnose Log gespeichert.</p>
      <pre style={{ whiteSpace: "pre-wrap", background: "rgba(255,0,80,.12)", border: "1px solid rgba(255,0,80,.35)", padding: 16, borderRadius: 12 }}>{err.name}: {err.message}{"\n"}{err.stack}</pre>
      <button onClick={() => { localStorage.clear(); location.href = "/?safe=1"; }} style={{ background: "rgba(0,180,255,.18)", color: "#e8f6ff", border: "1px solid rgba(0,180,255,.45)", borderRadius: 10, padding: "10px 14px", cursor: "pointer" }}>Storage löschen und Safe Mode</button>
      <button onClick={() => { location.href = "/diagnose.html"; }} style={{ marginLeft: 8, background: "rgba(0,180,255,.18)", color: "#e8f6ff", border: "1px solid rgba(0,180,255,.45)", borderRadius: 10, padding: "10px 14px", cursor: "pointer" }}>Statische Diagnose</button>
    </div>
  );
}

function injectBootStyle() {
  if (document.getElementById("jarvis-boot-style")) return;
  const style = document.createElement("style");
  style.id = "jarvis-boot-style";
  style.textContent = `
    .jarvis-boot {
      position: fixed;
      inset: 0;
      z-index: 2147483000;
      overflow: hidden;
      background: #02050a;
      font-family: Consolas, "JetBrains Mono", monospace;
    }
    .jarvis-boot-exact {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center center;
      transform: scale(1.002);
      filter: saturate(1.08) contrast(1.04) brightness(.98);
      animation: jarvisBootExactPulse 2.2s ease-in-out infinite;
    }
    .jarvis-boot-scan {
      position: absolute;
      inset: 0;
      pointer-events: none;
      background:
        linear-gradient(180deg, transparent 0%, rgba(126,231,255,.14) 50%, transparent 100%) 0 -40% / 100% 34% no-repeat,
        radial-gradient(circle at 50% 50%, transparent 0 35%, rgba(126,231,255,.05) 36%, transparent 50%);
      mix-blend-mode: screen;
      opacity: .7;
      animation: jarvisBootScan 2.5s ease-in-out infinite;
    }
    .jarvis-boot-skip {
      position: absolute;
      right: 34px;
      bottom: 28px;
      z-index: 8;
      border: 1px solid rgba(126,231,255,.28);
      border-radius: 999px;
      background: rgba(2,8,17,.58);
      color: rgba(218,244,255,.78);
      font: inherit;
      font-size: 10px;
      letter-spacing: .18em;
      padding: 9px 13px;
      cursor: pointer;
      backdrop-filter: blur(10px);
      box-shadow: 0 0 18px rgba(126,231,255,.12);
    }
    .jarvis-boot-skip:hover {
      color: #fff;
      border-color: rgba(126,231,255,.65);
      box-shadow: 0 0 24px rgba(126,231,255,.24);
    }
    .jarvis-boot.out {
      opacity: 0;
      transform: scale(1.012);
      transition: opacity .42s ease, transform .42s ease;
    }
    @keyframes jarvisBootScan {
      0% { background-position: 0 -40%, center; }
      65%,100% { background-position: 0 140%, center; }
    }
    @keyframes jarvisBootExactPulse {
      0%,100% { filter: saturate(1.08) contrast(1.04) brightness(.96); }
      50% { filter: saturate(1.2) contrast(1.08) brightness(1.06); }
    }
  `;
  document.head.appendChild(style);
}

function runBootSequence(): Promise<void> {
  const params = new URLSearchParams(location.search);
  if (params.has("noboot") || localStorage.getItem("jarvis_boot_disabled") === "1") return Promise.resolve();

  injectBootStyle();

  const hasBooted = localStorage.getItem("jarvis_boot_seen") === "1";
  const duration = hasBooted ? 1700 : 5200;

  const overlay = document.createElement("div");
  overlay.className = "jarvis-boot";
  overlay.innerHTML = `
    <img class="jarvis-boot-exact" src="/jarvis-boot-sequence.svg" alt="JARVIS Boot Sequence" />
    <div class="jarvis-boot-scan"></div>
    <button class="jarvis-boot-skip" type="button">SKIP BOOT</button>
  `;
  document.body.appendChild(overlay);

  const skip = overlay.querySelector<HTMLButtonElement>(".jarvis-boot-skip");
  let done = false;
  let timer = 0;

  return new Promise((resolve) => {
    const finish = () => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      localStorage.setItem("jarvis_boot_seen", "1");
      overlay.classList.add("out");
      setTimeout(() => {
        overlay.remove();
        resolve();
      }, 430);
    };

    skip?.addEventListener("click", finish);
    timer = window.setTimeout(finish, duration);
  });
}

async function boot() {
  const root = document.getElementById("root");
  if (!root) return;
  try {
    const params = new URLSearchParams(location.search);
    const safe = params.has("safe") || localStorage.getItem("jarvis_safe_mode") === "1";
    addJarvisLog("info", "boot", safe ? "Safe Mode" : "Normale App");
    if (safe) {
      createRoot(root).render(<StrictMode><SafeMode /><DiagnosticsOverlay /></StrictMode>);
      setTimeout(markMounted, 50);
      return;
    }
    await runBootSequence();
    const mod = await import("./App");
    const App = mod.App;
    createRoot(root).render(<StrictMode><ErrorBoundary><App /></ErrorBoundary><DiagnosticsOverlay /></StrictMode>);
    setTimeout(markMounted, 50);
  } catch (error) {
    addJarvisLog("error", "boot", error);
    createRoot(root).render(<StrictMode><FatalBootError error={error} /><DiagnosticsOverlay /></StrictMode>);
    setTimeout(markMounted, 50);
  }
}

boot();
