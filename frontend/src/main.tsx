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
      background:
        radial-gradient(circle at 52% 48%, rgba(76,168,232,.22), transparent 34%),
        radial-gradient(circle at 52% 48%, transparent 0 295px, rgba(126,231,255,.15) 297px, transparent 300px),
        radial-gradient(circle at 52% 48%, transparent 0 420px, rgba(126,231,255,.07) 422px, transparent 425px),
        linear-gradient(135deg, #02040a 0%, #06101d 52%, #02040a 100%);
      color: #e8fbff;
      font-family: "JetBrains Mono", "Fira Code", Consolas, monospace;
      letter-spacing: .08em;
    }
    .jarvis-boot::before {
      content: "";
      position: absolute;
      inset: 0;
      pointer-events: none;
      background-image:
        linear-gradient(rgba(126,231,255,.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(126,231,255,.035) 1px, transparent 1px);
      background-size: 46px 46px;
      opacity: .72;
      mask-image: radial-gradient(circle at center, black 0 72%, transparent 95%);
    }
    .jarvis-boot::after {
      content: "";
      position: absolute;
      inset: 0;
      pointer-events: none;
      background:
        linear-gradient(90deg, transparent, rgba(126,231,255,.16), transparent) 0 50%/100% 1px no-repeat,
        linear-gradient(0deg, transparent, rgba(126,231,255,.13), transparent) 52% 0/1px 100% no-repeat;
      opacity: .85;
    }
    .jarvis-boot-top {
      position: absolute;
      top: 24px;
      left: 36px;
      right: 36px;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      z-index: 4;
    }
    .jarvis-boot-logo {
      font-size: 28px;
      letter-spacing: 24px;
      color: #e8fbff;
      text-shadow: 0 0 18px rgba(126,231,255,.85);
    }
    .jarvis-boot-subtitle {
      margin-top: 8px;
      font-size: 10px;
      letter-spacing: .24em;
      color: rgba(126,231,255,.68);
    }
    .jarvis-boot-metrics {
      display: flex;
      gap: 28px;
      text-align: right;
      color: rgba(126,231,255,.7);
      font-size: 10px;
      text-transform: uppercase;
    }
    .jarvis-boot-metrics b {
      display: block;
      color: #7ee7ff;
      font-size: 18px;
      margin-top: 5px;
      text-shadow: 0 0 16px rgba(126,231,255,.45);
    }
    .jarvis-boot-center-label {
      position: absolute;
      top: 52px;
      left: 50%;
      transform: translateX(-50%);
      text-align: center;
      z-index: 4;
      text-transform: uppercase;
      color: #7ee7ff;
      font-size: 14px;
      letter-spacing: .28em;
      text-shadow: 0 0 18px rgba(126,231,255,.5);
    }
    .jarvis-boot-percent {
      display: block;
      margin-top: 18px;
      font-size: 44px;
      letter-spacing: .04em;
      color: #aaf1ff;
    }
    .jarvis-boot-core {
      position: absolute;
      left: 52%;
      top: 50%;
      width: min(46vw, 640px);
      height: min(46vw, 640px);
      transform: translate(-50%, -50%);
      border-radius: 50%;
      z-index: 3;
      background:
        radial-gradient(circle at center, #e8fbff 0 1.5%, #7ee7ff 2.4%, rgba(126,231,255,.22) 7%, transparent 9%),
        repeating-radial-gradient(circle at center, rgba(126,231,255,.24) 0 1px, transparent 2px 36px),
        radial-gradient(circle at center, rgba(76,168,232,.32), transparent 58%);
      box-shadow: 0 0 80px rgba(76,168,232,.30), inset 0 0 90px rgba(76,168,232,.12);
      overflow: visible;
      animation: jarvisBootCorePulse 1.8s ease-in-out infinite;
    }
    .jarvis-boot-core::before,
    .jarvis-boot-core::after {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 1px solid rgba(126,231,255,.44);
      box-shadow: inset 0 0 45px rgba(126,231,255,.12), 0 0 42px rgba(126,231,255,.16);
    }
    .jarvis-boot-core::before {
      inset: 7%;
      border: 2px solid rgba(126,231,255,.65);
      background: repeating-conic-gradient(from 12deg, rgba(126,231,255,.72) 0 2deg, transparent 2.6deg 8deg);
      mask-image: radial-gradient(circle, transparent 0 62%, black 63% 66%, transparent 67%);
      animation: jarvisBootSpin 8s linear infinite;
    }
    .jarvis-boot-core::after {
      inset: 18%;
      border-style: dashed;
      animation: jarvisBootSpinReverse 11s linear infinite;
    }
    .jarvis-boot-particles {
      position: absolute;
      inset: 17%;
      border-radius: 50%;
      background:
        radial-gradient(circle at 50% 50%, rgba(255,255,255,.95), transparent 2%),
        radial-gradient(circle at 34% 28%, rgba(126,231,255,.75), transparent 1.3%),
        radial-gradient(circle at 66% 35%, rgba(126,231,255,.70), transparent 1.1%),
        radial-gradient(circle at 29% 68%, rgba(126,231,255,.60), transparent 1.1%),
        radial-gradient(circle at 71% 72%, rgba(126,231,255,.60), transparent 1.1%),
        repeating-conic-gradient(from 0deg, rgba(126,231,255,.20) 0 .4deg, transparent .45deg 4deg);
      opacity: .95;
      animation: jarvisBootBreath 1.4s ease-in-out infinite;
    }
    .jarvis-synapse {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 55vw;
      height: 2px;
      transform-origin: 0 50%;
      background: linear-gradient(90deg, rgba(255,54,95,.95), rgba(255,54,95,.36), transparent 72%);
      box-shadow: 0 0 12px rgba(255,54,95,.9), 0 0 32px rgba(255,54,95,.35);
      opacity: 0;
      z-index: 2;
      animation: jarvisSynapse 1.5s ease-in-out infinite;
      clip-path: polygon(0 0, 5% 100%, 10% 20%, 18% 100%, 25% 0, 31% 100%, 41% 12%, 53% 100%, 62% 30%, 74% 100%, 100% 45%, 100% 55%, 74% 100%, 62% 55%, 53% 100%, 41% 62%, 31% 100%, 25% 55%, 18% 100%, 10% 70%, 5% 100%, 0 100%);
    }
    .jarvis-synapse.s1 { transform: rotate(0deg); animation-delay: .18s; }
    .jarvis-synapse.s2 { transform: rotate(42deg); animation-delay: .56s; }
    .jarvis-synapse.s3 { transform: rotate(96deg); animation-delay: .92s; }
    .jarvis-synapse.s4 { transform: rotate(151deg); animation-delay: 1.2s; }
    .jarvis-synapse.s5 { transform: rotate(210deg); animation-delay: .38s; }
    .jarvis-synapse.s6 { transform: rotate(300deg); animation-delay: .78s; }
    .jarvis-boot-left,
    .jarvis-boot-right {
      position: absolute;
      z-index: 5;
      top: 130px;
      bottom: 88px;
      width: min(330px, 22vw);
      pointer-events: none;
    }
    .jarvis-boot-left { left: 42px; }
    .jarvis-boot-right { right: 42px; display: flex; flex-direction: column; gap: 18px; }
    .jarvis-boot-panel-title {
      color: #7ee7ff;
      font-size: 12px;
      letter-spacing: .22em;
      margin-bottom: 18px;
      text-transform: uppercase;
    }
    .jarvis-boot-step {
      position: relative;
      display: grid;
      grid-template-columns: 48px 1fr;
      gap: 14px;
      align-items: center;
      min-height: 78px;
      opacity: .42;
      transform: translateX(-10px);
      transition: all .28s ease;
    }
    .jarvis-boot-step.active {
      opacity: 1;
      transform: translateX(0);
    }
    .jarvis-boot-icon {
      width: 46px;
      height: 46px;
      border: 1px solid rgba(126,231,255,.46);
      border-radius: 50%;
      background: repeating-conic-gradient(rgba(126,231,255,.65) 0 4deg, transparent 5deg 14deg);
      box-shadow: 0 0 18px rgba(126,231,255,.18), inset 0 0 18px rgba(126,231,255,.13);
      mask-image: radial-gradient(circle, transparent 0 33%, black 34%);
    }
    .jarvis-boot-step.hot .jarvis-boot-icon,
    .jarvis-boot-step.hot .jarvis-boot-step-title,
    .jarvis-boot-step.hot .jarvis-boot-value {
      color: #ff365f;
      border-color: rgba(255,54,95,.65);
      text-shadow: 0 0 14px rgba(255,54,95,.55);
    }
    .jarvis-boot-step-title {
      color: #7ee7ff;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: .11em;
      text-transform: uppercase;
    }
    .jarvis-boot-step-sub {
      margin: 6px 0 7px;
      color: rgba(218,244,255,.58);
      font-size: 10px;
      letter-spacing: .14em;
      text-transform: uppercase;
    }
    .jarvis-boot-bar {
      height: 3px;
      border-radius: 999px;
      background: rgba(126,231,255,.13);
      overflow: hidden;
    }
    .jarvis-boot-bar span {
      display: block;
      height: 100%;
      width: var(--boot-step-progress, 0%);
      background: linear-gradient(90deg, #1f9cff, #7ee7ff);
      box-shadow: 0 0 14px rgba(126,231,255,.62);
      transition: width .18s linear;
    }
    .jarvis-boot-step.hot .jarvis-boot-bar span {
      background: linear-gradient(90deg, #ff365f, #ff8aa0);
      box-shadow: 0 0 14px rgba(255,54,95,.62);
    }
    .jarvis-boot-value {
      position: absolute;
      right: 0;
      bottom: 8px;
      color: #7ee7ff;
      font-size: 12px;
    }
    .jarvis-boot-card {
      border: 1px solid rgba(126,231,255,.18);
      border-radius: 14px;
      background: linear-gradient(180deg, rgba(4,14,27,.58), rgba(2,7,15,.42));
      box-shadow: 0 0 34px rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,.035);
      backdrop-filter: blur(12px);
      padding: 16px;
    }
    .jarvis-boot-card h3 {
      margin: 0 0 12px;
      color: #7ee7ff;
      font-size: 12px;
      letter-spacing: .14em;
      text-transform: uppercase;
    }
    .jarvis-boot-chart {
      height: 76px;
      display: flex;
      align-items: end;
      gap: 9px;
      border-bottom: 1px solid rgba(126,231,255,.11);
      padding-bottom: 8px;
    }
    .jarvis-boot-chart i {
      flex: 1;
      min-width: 9px;
      background: linear-gradient(180deg, #7ee7ff, rgba(126,231,255,.1));
      box-shadow: 0 0 12px rgba(126,231,255,.22);
    }
    .jarvis-boot-diag {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid rgba(126,231,255,.08);
      padding: 7px 0;
      color: rgba(218,244,255,.64);
      font-size: 10px;
    }
    .jarvis-boot-diag b { color: #4ce8a0; }
    .jarvis-boot-log {
      max-height: 120px;
      overflow: hidden;
      color: rgba(126,231,255,.72);
      font-size: 10px;
      line-height: 1.65;
    }
    .jarvis-boot-bottom {
      position: absolute;
      left: 50%;
      bottom: 42px;
      transform: translateX(-50%);
      width: min(620px, 44vw);
      z-index: 5;
      text-align: center;
      color: rgba(126,231,255,.75);
      letter-spacing: .22em;
      text-transform: uppercase;
      font-size: 11px;
    }
    .jarvis-boot-main-progress {
      height: 8px;
      border: 1px solid rgba(126,231,255,.22);
      border-radius: 999px;
      background: rgba(2,8,17,.54);
      overflow: hidden;
      margin-top: 12px;
      box-shadow: 0 0 18px rgba(76,168,232,.18);
    }
    .jarvis-boot-main-progress span {
      display: block;
      height: 100%;
      width: var(--boot-progress, 0%);
      background: linear-gradient(90deg, rgba(31,156,255,.4), #7ee7ff, rgba(255,54,95,.72));
      box-shadow: 0 0 18px rgba(126,231,255,.65);
      transition: width .14s linear;
    }
    .jarvis-boot-skip {
      position: absolute;
      right: 34px;
      bottom: 28px;
      z-index: 8;
      border: 1px solid rgba(126,231,255,.22);
      border-radius: 999px;
      background: rgba(2,8,17,.48);
      color: rgba(218,244,255,.72);
      font: inherit;
      font-size: 10px;
      letter-spacing: .18em;
      padding: 8px 12px;
      cursor: pointer;
      pointer-events: auto;
    }
    .jarvis-boot-skip:hover {
      color: #fff;
      border-color: rgba(126,231,255,.55);
      box-shadow: 0 0 22px rgba(126,231,255,.18);
    }
    .jarvis-boot.out {
      opacity: 0;
      transform: scale(1.012);
      transition: opacity .42s ease, transform .42s ease;
    }
    @keyframes jarvisBootSpin { to { transform: rotate(360deg); } }
    @keyframes jarvisBootSpinReverse { to { transform: rotate(-360deg); } }
    @keyframes jarvisBootCorePulse { 0%,100% { filter: brightness(.95); transform: translate(-50%, -50%) scale(.985); } 50% { filter: brightness(1.22); transform: translate(-50%, -50%) scale(1.018); } }
    @keyframes jarvisBootBreath { 0%,100% { opacity: .55; transform: scale(.96); } 50% { opacity: 1; transform: scale(1.02); } }
    @keyframes jarvisSynapse { 0%, 100% { opacity: 0; transform-origin: 0 50%; } 18% { opacity: .95; } 44% { opacity: .32; } 65% { opacity: 0; } }
    @media (max-width: 1100px) {
      .jarvis-boot-left,.jarvis-boot-right{display:none}
      .jarvis-boot-core{width:min(72vw,560px);height:min(72vw,560px);left:50%}
      .jarvis-boot-center-label{top:100px}
      .jarvis-boot-bottom{width:72vw}
      .jarvis-boot-logo{letter-spacing:14px;font-size:22px}
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
  const steps = hasBooted
    ? [
        { title: "CORE LINK", sub: "FAST WAKE", hot: false },
        { title: "HUD INTERFACE", sub: "LAYER RESUME", hot: false },
        { title: "SYSTEM READY", sub: "AWAITING COMMAND", hot: false },
      ]
    : [
        { title: "INITIALIZING CORE", sub: "SYSTEM WAKE", hot: false },
        { title: "SYNCING MEMORY BANKS", sub: "CACHE ALIGNMENT", hot: false },
        { title: "NEURAL NETWORK LINK", sub: "ESTABLISHING SYNAPTIC GRID", hot: true },
        { title: "LOADING INTERFACE MODULES", sub: "HOLOGRAPHIC LAYER INIT", hot: false },
        { title: "SYSTEM WAKE SEQUENCE", sub: "ACTIVATING CORE PROTOCOLS", hot: false },
        { title: "SYSTEM READY", sub: "AWAITING COMMAND", hot: false },
      ];

  const overlay = document.createElement("div");
  overlay.className = "jarvis-boot";
  overlay.innerHTML = `
    <div class="jarvis-boot-top">
      <div>
        <div class="jarvis-boot-logo">JARVIS</div>
        <div class="jarvis-boot-subtitle">ADVANCED REACTIVE VIRTUAL INTELLIGENCE SYSTEM</div>
      </div>
      <div class="jarvis-boot-metrics">
        <span>Core Temp<b>34.2°C</b></span>
        <span>CPU Load<b>67%</b></span>
        <span>Memory<b>8.3/12GB</b></span>
        <span>Net Uplink<b>1.26Gb/s</b></span>
      </div>
    </div>
    <div class="jarvis-boot-center-label">BOOT SEQUENCE INITIATED<span class="jarvis-boot-percent">00%</span></div>
    <div class="jarvis-synapse s1"></div><div class="jarvis-synapse s2"></div><div class="jarvis-synapse s3"></div><div class="jarvis-synapse s4"></div><div class="jarvis-synapse s5"></div><div class="jarvis-synapse s6"></div>
    <div class="jarvis-boot-core"><div class="jarvis-boot-particles"></div></div>
    <div class="jarvis-boot-left">
      <div class="jarvis-boot-panel-title">BOOT SEQUENCE</div>
      ${steps.map((step) => `
        <div class="jarvis-boot-step ${step.hot ? "hot" : ""}">
          <div class="jarvis-boot-icon"></div>
          <div>
            <div class="jarvis-boot-step-title">${step.title}</div>
            <div class="jarvis-boot-step-sub">${step.sub}</div>
            <div class="jarvis-boot-bar"><span></span></div>
            <div class="jarvis-boot-value">0%</div>
          </div>
        </div>`).join("")}
    </div>
    <div class="jarvis-boot-right">
      <div class="jarvis-boot-card">
        <h3>NEURAL ACTIVITY <small style="float:right;color:#ff365f">LIVE</small></h3>
        <div class="jarvis-boot-chart"><i style="height:28%"></i><i style="height:45%"></i><i style="height:36%"></i><i style="height:70%"></i><i style="height:54%"></i><i style="height:76%"></i><i style="height:48%"></i><i style="height:68%"></i></div>
        <div class="jarvis-boot-diag"><span>Overall Activity</span><b>72%</b></div>
      </div>
      <div class="jarvis-boot-card">
        <h3>SYSTEM DIAGNOSTICS</h3>
        <div class="jarvis-boot-diag"><span>CORE SYSTEMS</span><b>OPTIMAL</b></div>
        <div class="jarvis-boot-diag"><span>NEURAL NETWORK</span><b>SYNCING</b></div>
        <div class="jarvis-boot-diag"><span>MEMORY BANKS</span><b>SYNCING</b></div>
        <div class="jarvis-boot-diag"><span>I/O INTERFACES</span><b>ACTIVE</b></div>
        <div class="jarvis-boot-diag"><span>SECURITY LAYER</span><b>INIT</b></div>
        <div class="jarvis-boot-diag"><span>VOICE MODULE</span><b>PENDING</b></div>
      </div>
      <div class="jarvis-boot-card">
        <h3>BOOT LOG</h3>
        <div class="jarvis-boot-log">
          13:13:15.102&nbsp;&nbsp; SYSTEM POWER ON<br/>
          13:13:15.215&nbsp;&nbsp; BIOS HANDSHAKE... OK<br/>
          13:13:15.367&nbsp;&nbsp; CORE SYSTEMS... OK<br/>
          13:13:15.589&nbsp;&nbsp; MEMORY DETECT... OK<br/>
          13:13:15.812&nbsp;&nbsp; NEURAL NETWORK... SYNCING<br/>
          13:13:16.045&nbsp;&nbsp; HOLOGRAPHIC ENGINE... LOADING<br/>
          13:13:16.276&nbsp;&nbsp; SECURITY PROTOCOL... INIT<br/>
          13:13:16.509&nbsp;&nbsp; VOICE MODULE... PENDING<br/>
        </div>
      </div>
    </div>
    <div class="jarvis-boot-bottom">
      <div class="jarvis-boot-bottom-text">SYSTEM STABILIZING... NEURAL PATTERNS CONVERGING</div>
      <div class="jarvis-boot-main-progress"><span></span></div>
    </div>
    <button class="jarvis-boot-skip" type="button">SKIP BOOT</button>
  `;
  document.body.appendChild(overlay);

  const percent = overlay.querySelector<HTMLElement>(".jarvis-boot-percent");
  const progress = overlay.querySelector<HTMLElement>(".jarvis-boot-main-progress > span");
  const bottomText = overlay.querySelector<HTMLElement>(".jarvis-boot-bottom-text");
  const stepEls = Array.from(overlay.querySelectorAll<HTMLElement>(".jarvis-boot-step"));
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
      const eased = 1 - Math.pow(1 - ratio, 2.2);
      const pct = Math.round(eased * 100);
      if (percent) percent.textContent = `${String(pct).padStart(2, "0")}%`;
      if (progress) progress.style.setProperty("--boot-progress", `${pct}%`);
      if (bottomText) bottomText.textContent = ratio > .86 ? "SYSTEM READY... AWAITING COMMAND" : ratio > .58 ? "SYSTEM STABILIZING... NEURAL PATTERNS CONVERGING" : "CALIBRATING NEURAL PATHWAYS";

      stepEls.forEach((line, index) => {
        const start = index / (stepEls.length + .6);
        const local = Math.max(0, Math.min(1, (ratio - start) * (stepEls.length / 1.2)));
        const stepPct = Math.round((1 - Math.pow(1 - local, 2)) * 100);
        line.classList.toggle("active", local > .04);
        const bar = line.querySelector<HTMLElement>(".jarvis-boot-bar > span");
        const value = line.querySelector<HTMLElement>(".jarvis-boot-value");
        if (bar) bar.style.setProperty("--boot-step-progress", `${stepPct}%`);
        if (value) value.textContent = `${stepPct}%`;
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
