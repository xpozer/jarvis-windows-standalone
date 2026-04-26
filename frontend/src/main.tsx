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
      display: grid;
      place-items: center;
      overflow: hidden;
      background:
        radial-gradient(circle at 50% 45%, rgba(76,168,232,.20), transparent 34%),
        radial-gradient(circle at 82% 18%, rgba(255,54,95,.10), transparent 24%),
        linear-gradient(135deg, #02040a 0%, #06101d 52%, #02040a 100%);
      color: #e8fbff;
      font-family: "JetBrains Mono", "Fira Code", Consolas, monospace;
      letter-spacing: .08em;
    }
    .jarvis-boot::before {
      content: "";
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(126,231,255,.055) 1px, transparent 1px),
        linear-gradient(90deg, rgba(126,231,255,.04) 1px, transparent 1px);
      background-size: 44px 44px;
      opacity: .7;
      mask-image: radial-gradient(circle at center, black 0 46%, transparent 76%);
    }
    .jarvis-boot::after {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, transparent 0%, rgba(126,231,255,.18) 50%, transparent 100%);
      height: 34%;
      transform: translateY(-120%);
      animation: jarvisBootScan 2.4s ease-in-out infinite;
      opacity: .5;
    }
    .jarvis-boot-shell {
      position: relative;
      width: min(920px, calc(100vw - 42px));
      min-height: 540px;
      border: 1px solid rgba(126,231,255,.20);
      border-radius: 34px;
      background: linear-gradient(180deg, rgba(3,9,18,.72), rgba(2,6,13,.48));
      box-shadow: 0 0 80px rgba(76,168,232,.16), inset 0 1px 0 rgba(255,255,255,.06);
      backdrop-filter: blur(18px) saturate(1.15);
      display: grid;
      grid-template-columns: 1fr 330px;
      gap: 28px;
      padding: 34px;
      overflow: hidden;
    }
    .jarvis-boot-core {
      position: relative;
      display: grid;
      place-items: center;
      min-height: 430px;
    }
    .jarvis-reactor {
      position: relative;
      width: 280px;
      height: 280px;
      border-radius: 50%;
      border: 1px solid rgba(126,231,255,.35);
      box-shadow: 0 0 36px rgba(126,231,255,.18), inset 0 0 42px rgba(76,168,232,.16);
      animation: jarvisBootPulse 1.9s ease-in-out infinite;
    }
    .jarvis-reactor::before,
    .jarvis-reactor::after {
      content: "";
      position: absolute;
      inset: 28px;
      border-radius: 50%;
      border: 1px dashed rgba(126,231,255,.42);
      animation: jarvisBootSpin 7s linear infinite;
    }
    .jarvis-reactor::after {
      inset: 72px;
      border-style: solid;
      box-shadow: 0 0 50px rgba(126,231,255,.28);
      animation-direction: reverse;
      animation-duration: 4.8s;
    }
    .jarvis-reactor-dot {
      position: absolute;
      inset: 112px;
      border-radius: 50%;
      background: radial-gradient(circle, #e8fbff 0%, #7ee7ff 32%, rgba(76,168,232,.18) 62%, transparent 70%);
      box-shadow: 0 0 36px rgba(126,231,255,.9), 0 0 90px rgba(76,168,232,.55);
    }
    .jarvis-boot-title {
      position: absolute;
      top: 4px;
      left: 4px;
      font-size: 12px;
      letter-spacing: 10px;
      color: #e8fbff;
      text-shadow: 0 0 16px rgba(126,231,255,.85);
    }
    .jarvis-boot-percent {
      position: absolute;
      bottom: 8px;
      left: 4px;
      font-size: 42px;
      color: rgba(232,251,255,.96);
      text-shadow: 0 0 20px rgba(126,231,255,.55);
    }
    .jarvis-boot-panel {
      border-left: 1px solid rgba(126,231,255,.18);
      padding-left: 26px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 14px;
    }
    .jarvis-boot-line {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      padding: 10px 12px;
      border: 1px solid rgba(126,231,255,.12);
      border-radius: 14px;
      background: rgba(2,8,17,.46);
      color: rgba(218,244,255,.72);
      font-size: 11px;
      opacity: .34;
      transform: translateX(12px);
      transition: all .28s ease;
    }
    .jarvis-boot-line.active {
      opacity: 1;
      transform: translateX(0);
      border-color: rgba(126,231,255,.34);
      color: #e8fbff;
      box-shadow: 0 0 24px rgba(76,168,232,.12);
    }
    .jarvis-boot-status {
      color: #7ee7ff;
      white-space: nowrap;
    }
    .jarvis-boot-progress {
      height: 4px;
      border-radius: 999px;
      background: rgba(126,231,255,.12);
      overflow: hidden;
      margin-top: 12px;
    }
    .jarvis-boot-progress > span {
      display: block;
      height: 100%;
      width: var(--boot-progress, 0%);
      border-radius: inherit;
      background: linear-gradient(90deg, rgba(76,168,232,.5), #7ee7ff, rgba(255,54,95,.65));
      box-shadow: 0 0 18px rgba(126,231,255,.65);
      transition: width .14s linear;
    }
    .jarvis-boot-skip {
      position: absolute;
      right: 22px;
      top: 20px;
      border: 1px solid rgba(126,231,255,.22);
      border-radius: 999px;
      background: rgba(2,8,17,.48);
      color: rgba(218,244,255,.72);
      font: inherit;
      font-size: 10px;
      letter-spacing: .18em;
      padding: 8px 12px;
      cursor: pointer;
    }
    .jarvis-boot-skip:hover {
      color: #fff;
      border-color: rgba(126,231,255,.55);
      box-shadow: 0 0 22px rgba(126,231,255,.18);
    }
    .jarvis-boot.out {
      opacity: 0;
      transform: scale(1.015);
      transition: opacity .42s ease, transform .42s ease;
    }
    @keyframes jarvisBootSpin { to { transform: rotate(360deg); } }
    @keyframes jarvisBootPulse { 0%,100% { transform: scale(.98); } 50% { transform: scale(1.02); } }
    @keyframes jarvisBootScan { 0% { transform: translateY(-120%); } 60%,100% { transform: translateY(320%); } }
    @media (max-width: 760px) {
      .jarvis-boot-shell { grid-template-columns: 1fr; min-height: 560px; }
      .jarvis-boot-panel { border-left: 0; border-top: 1px solid rgba(126,231,255,.18); padding-left: 0; padding-top: 20px; }
      .jarvis-reactor { width: 220px; height: 220px; }
      .jarvis-reactor-dot { inset: 88px; }
    }
  `;
  document.head.appendChild(style);
}

function runBootSequence(): Promise<void> {
  const params = new URLSearchParams(location.search);
  if (params.has("noboot") || localStorage.getItem("jarvis_boot_disabled") === "1") return Promise.resolve();

  injectBootStyle();

  const hasBooted = localStorage.getItem("jarvis_boot_seen") === "1";
  const duration = hasBooted ? 1500 : 4300;
  const steps = hasBooted
    ? ["CORE LINK", "VOICE BUS", "INTERFACE READY"]
    : ["NEURAL CORE", "VOICE SYSTEMS", "MEMORY MATRIX", "LOCAL AGENTS", "HUD INTERFACE", "SYSTEM READY"];

  const overlay = document.createElement("div");
  overlay.className = "jarvis-boot";
  overlay.innerHTML = `
    <div class="jarvis-boot-shell">
      <button class="jarvis-boot-skip" type="button">SKIP BOOT</button>
      <div class="jarvis-boot-core">
        <div class="jarvis-boot-title">JARVIS</div>
        <div class="jarvis-reactor"><div class="jarvis-reactor-dot"></div></div>
        <div class="jarvis-boot-percent">00%</div>
      </div>
      <div class="jarvis-boot-panel">
        ${steps.map((step) => `<div class="jarvis-boot-line"><span>${step}</span><span class="jarvis-boot-status">STANDBY</span></div>`).join("")}
        <div class="jarvis-boot-progress"><span></span></div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const percent = overlay.querySelector<HTMLElement>(".jarvis-boot-percent");
  const progress = overlay.querySelector<HTMLElement>(".jarvis-boot-progress > span");
  const lines = Array.from(overlay.querySelectorAll<HTMLElement>(".jarvis-boot-line"));
  const skip = overlay.querySelector<HTMLButtonElement>(".jarvis-boot-skip");
  let done = false;
  let raf = 0;
  const started = performance.now();

  return new Promise((resolve) => {
    const finish = () => {
      if (done) return;
      done = true;
      cancelAnimationFrame(raf);
      localStorage.setItem("jarvis_boot_seen", "1");
      overlay.classList.add("out");
      setTimeout(() => {
        overlay.remove();
        resolve();
      }, 430);
    };

    skip?.addEventListener("click", finish);

    const tick = (now: number) => {
      const ratio = Math.min(1, (now - started) / duration);
      const pct = Math.round(ratio * 100);
      if (percent) percent.textContent = `${String(pct).padStart(2, "0")}%`;
      if (progress) progress.style.setProperty("--boot-progress", `${pct}%`);

      const activeCount = Math.min(lines.length, Math.floor(ratio * (lines.length + 1)));
      lines.forEach((line, index) => {
        const active = index < activeCount;
        line.classList.toggle("active", active);
        const status = line.querySelector<HTMLElement>(".jarvis-boot-status");
        if (status) status.textContent = active ? "ONLINE" : "STANDBY";
      });

      if (ratio >= 1) finish();
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
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
