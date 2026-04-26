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
        radial-gradient(circle at 50% 48%, rgba(6,28,52,.92), transparent 58%),
        #02050a;
      font-family: Consolas, "JetBrains Mono", monospace;
      --boot-ratio: 0;
      --live-progress: 0%;
    }
    .jarvis-boot-stage {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      overflow: hidden;
    }
    .jarvis-boot-exact {
      width: min(100vw, calc(100vh * 1.333333));
      height: min(100vh, calc(100vw * .75));
      object-fit: contain;
      object-position: center center;
      filter: saturate(1.08) contrast(1.04) brightness(.98);
      animation: jarvisBootExactPulse 2.2s ease-in-out infinite;
      transform-origin: center center;
    }
    .jarvis-boot-orb {
      position: absolute;
      left: 50%;
      top: 47%;
      width: min(45vw, 62vh);
      aspect-ratio: 1;
      transform: translate(-50%, -50%) scale(calc(.96 + var(--boot-ratio) * .07));
      z-index: 6;
      pointer-events: none;
      mix-blend-mode: screen;
      filter: drop-shadow(0 0 34px rgba(126,231,255,.46));
    }
    .jarvis-boot-orb-core {
      position: absolute;
      inset: 36%;
      border-radius: 50%;
      background: radial-gradient(circle, #fff 0 5%, #7ee7ff 14%, rgba(126,231,255,.58) 28%, rgba(255,54,95,.16) 46%, transparent 72%);
      box-shadow: 0 0 28px rgba(126,231,255,.95), 0 0 90px rgba(76,168,232,.55), 0 0 130px rgba(255,54,95,.20);
      animation: jarvisBootCoreCharge .9s ease-in-out infinite;
    }
    .jarvis-boot-orb-ring {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 1px solid rgba(126,231,255,.42);
      box-shadow: inset 0 0 28px rgba(126,231,255,.10), 0 0 24px rgba(126,231,255,.16);
    }
    .jarvis-boot-orb-ring.r1 {
      inset: 4%;
      border-width: 2px;
      background: repeating-conic-gradient(from 0deg, rgba(126,231,255,.70) 0 1.5deg, transparent 2deg 7deg);
      mask-image: radial-gradient(circle, transparent 0 64%, black 65% 67%, transparent 68%);
      animation: jarvisBootSpin 7s linear infinite;
    }
    .jarvis-boot-orb-ring.r2 {
      inset: 15%;
      border-style: dashed;
      animation: jarvisBootSpinReverse 5.8s linear infinite;
    }
    .jarvis-boot-orb-ring.r3 {
      inset: 25%;
      border-color: rgba(255,54,95,.45);
      opacity: .38;
      animation: jarvisBootSpin 3.4s linear infinite;
    }
    .jarvis-boot-orb-grid {
      position: absolute;
      inset: 10%;
      border-radius: 50%;
      background:
        linear-gradient(90deg, transparent 49.8%, rgba(126,231,255,.42) 50%, transparent 50.2%),
        linear-gradient(0deg, transparent 49.8%, rgba(126,231,255,.42) 50%, transparent 50.2%),
        repeating-radial-gradient(circle, transparent 0 32px, rgba(126,231,255,.26) 33px, transparent 34px),
        repeating-conic-gradient(from 0deg, rgba(126,231,255,.24) 0 .35deg, transparent .45deg 4deg);
      opacity: .62;
      animation: jarvisBootBreath 1.2s ease-in-out infinite;
    }
    .jarvis-boot-orb-synapse {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 55vw;
      height: 2px;
      transform-origin: 0 50%;
      background: linear-gradient(90deg, rgba(255,54,95,.98), rgba(255,54,95,.42), transparent 74%);
      box-shadow: 0 0 14px rgba(255,54,95,.95), 0 0 38px rgba(255,54,95,.40);
      opacity: 0;
      clip-path: polygon(0 0, 5% 100%, 10% 20%, 18% 100%, 25% 0, 31% 100%, 41% 12%, 53% 100%, 62% 30%, 74% 100%, 100% 45%, 100% 55%, 74% 100%, 62% 55%, 53% 100%, 41% 62%, 31% 100%, 25% 55%, 18% 100%, 10% 70%, 5% 100%, 0 100%);
      animation: jarvisSynapse 1.35s ease-in-out infinite;
    }
    .jarvis-boot-orb-synapse.s1 { transform: rotate(3deg); animation-delay: .08s; }
    .jarvis-boot-orb-synapse.s2 { transform: rotate(42deg); animation-delay: .34s; }
    .jarvis-boot-orb-synapse.s3 { transform: rotate(94deg); animation-delay: .58s; }
    .jarvis-boot-orb-synapse.s4 { transform: rotate(151deg); animation-delay: .82s; }
    .jarvis-boot-orb-synapse.s5 { transform: rotate(214deg); animation-delay: 1.02s; }
    .jarvis-boot-orb-synapse.s6 { transform: rotate(303deg); animation-delay: .20s; }
    .jarvis-boot-orb-spark {
      position: absolute;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 0 15px #7ee7ff, 0 0 35px rgba(255,54,95,.58);
      opacity: .85;
      animation: jarvisSpark 1.6s ease-in-out infinite;
    }
    .jarvis-boot-orb-spark.p1 { left: 28%; top: 32%; animation-delay: .1s; }
    .jarvis-boot-orb-spark.p2 { left: 70%; top: 38%; animation-delay: .4s; }
    .jarvis-boot-orb-spark.p3 { left: 38%; top: 72%; animation-delay: .7s; }
    .jarvis-boot-orb-spark.p4 { left: 62%; top: 65%; animation-delay: 1s; }
    .jarvis-boot.crashout .jarvis-boot-orb {
      animation: jarvisBootCrashShake .16s linear infinite;
      filter: drop-shadow(0 0 42px rgba(255,54,95,.70)) drop-shadow(0 0 60px rgba(126,231,255,.36));
    }
    .jarvis-boot.crashout .jarvis-boot-orb-core {
      box-shadow: 0 0 34px rgba(255,255,255,.95), 0 0 100px rgba(255,54,95,.68), 0 0 170px rgba(255,54,95,.36);
      background: radial-gradient(circle, #fff 0 6%, #ff9fb0 12%, #ff365f 22%, rgba(126,231,255,.42) 38%, transparent 72%);
      animation-duration: .42s;
    }
    .jarvis-boot.crashout .jarvis-boot-orb-ring.r3,
    .jarvis-boot.crashout .jarvis-boot-orb-synapse { opacity: 1; }
    .jarvis-boot.stabilize .jarvis-boot-orb { filter: drop-shadow(0 0 42px rgba(126,231,255,.58)); }
    .jarvis-boot.stabilize .jarvis-boot-orb-synapse { animation-duration: 2.2s; opacity: .34; }
    .jarvis-boot-flash {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 7;
      background: radial-gradient(circle at 50% 47%, rgba(255,255,255,.95), rgba(126,231,255,.32) 18%, transparent 44%);
      opacity: 0;
      mix-blend-mode: screen;
    }
    .jarvis-boot.ready .jarvis-boot-flash { animation: jarvisReadyFlash .68s ease-out 1; }
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
    .jarvis-boot-live {
      position: absolute;
      left: 50%;
      bottom: 24px;
      transform: translateX(-50%);
      width: min(620px, 42vw);
      z-index: 9;
      color: rgba(218,244,255,.88);
      text-align: center;
      letter-spacing: .24em;
      font-size: 10px;
      text-transform: uppercase;
      text-shadow: 0 0 14px rgba(126,231,255,.45);
      pointer-events: none;
    }
    .jarvis-boot-live-row {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 8px;
      color: rgba(126,231,255,.78);
    }
    .jarvis-boot-live-percent {
      color: #7ee7ff;
      font-weight: 700;
    }
    .jarvis-boot-livebar {
      height: 6px;
      border-radius: 999px;
      border: 1px solid rgba(126,231,255,.26);
      background: rgba(2,8,17,.72);
      overflow: hidden;
      box-shadow: 0 0 18px rgba(126,231,255,.14);
    }
    .jarvis-boot-livebar span {
      display: block;
      height: 100%;
      width: var(--live-progress, 0%);
      background: linear-gradient(90deg, rgba(31,156,255,.35), #7ee7ff, rgba(255,54,95,.72));
      box-shadow: 0 0 18px rgba(126,231,255,.65);
      transition: width .12s linear;
    }
    .jarvis-boot-skip {
      position: absolute;
      right: 34px;
      bottom: 28px;
      z-index: 10;
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
    @keyframes jarvisBootSpin { to { transform: rotate(360deg); } }
    @keyframes jarvisBootSpinReverse { to { transform: rotate(-360deg); } }
    @keyframes jarvisBootBreath { 0%,100% { opacity: .46; transform: scale(.97); } 50% { opacity: .9; transform: scale(1.025); } }
    @keyframes jarvisBootCoreCharge { 0%,100% { transform: scale(.88); opacity: .78; } 50% { transform: scale(1.16); opacity: 1; } }
    @keyframes jarvisSynapse { 0%,100% { opacity: 0; } 16% { opacity: .95; } 46% { opacity: .42; } 68% { opacity: 0; } }
    @keyframes jarvisSpark { 0%,100% { opacity: .2; transform: scale(.55); } 35% { opacity: 1; transform: scale(1.25); } 65% { opacity: .42; transform: scale(.8); } }
    @keyframes jarvisBootCrashShake { 0% { transform: translate(-50%, -50%) translate(0,0) scale(1.03); } 25% { transform: translate(-50%, -50%) translate(2px,-1px) scale(1.045); } 50% { transform: translate(-50%, -50%) translate(-2px,1px) scale(1.035); } 75% { transform: translate(-50%, -50%) translate(1px,2px) scale(1.052); } 100% { transform: translate(-50%, -50%) translate(0,0) scale(1.03); } }
    @keyframes jarvisReadyFlash { 0% { opacity: 0; } 30% { opacity: .88; } 100% { opacity: 0; } }
    @media (max-aspect-ratio: 4/3) {
      .jarvis-boot-live { width: min(620px, 72vw); bottom: 18px; }
      .jarvis-boot-skip { right: 18px; bottom: 18px; }
      .jarvis-boot-orb { width: min(64vw, 54vh); top: 47%; }
    }
  `;
  document.head.appendChild(style);
}

function runBootSequence(): Promise<void> {
  const params = new URLSearchParams(location.search);
  if (params.has("noboot") || localStorage.getItem("jarvis_boot_disabled") === "1") return Promise.resolve();

  injectBootStyle();

  const hasBooted = localStorage.getItem("jarvis_boot_seen") === "1";
  const duration = hasBooted ? 2200 : 6200;

  const overlay = document.createElement("div");
  overlay.className = "jarvis-boot";
  overlay.innerHTML = `
    <div class="jarvis-boot-stage">
      <img class="jarvis-boot-exact" src="/jarvis-boot-sequence.svg" alt="JARVIS Boot Sequence" />
    </div>
    <div class="jarvis-boot-orb">
      <div class="jarvis-boot-orb-ring r1"></div>
      <div class="jarvis-boot-orb-ring r2"></div>
      <div class="jarvis-boot-orb-ring r3"></div>
      <div class="jarvis-boot-orb-grid"></div>
      <div class="jarvis-boot-orb-core"></div>
      <div class="jarvis-boot-orb-synapse s1"></div>
      <div class="jarvis-boot-orb-synapse s2"></div>
      <div class="jarvis-boot-orb-synapse s3"></div>
      <div class="jarvis-boot-orb-synapse s4"></div>
      <div class="jarvis-boot-orb-synapse s5"></div>
      <div class="jarvis-boot-orb-synapse s6"></div>
      <div class="jarvis-boot-orb-spark p1"></div>
      <div class="jarvis-boot-orb-spark p2"></div>
      <div class="jarvis-boot-orb-spark p3"></div>
      <div class="jarvis-boot-orb-spark p4"></div>
    </div>
    <div class="jarvis-boot-flash"></div>
    <div class="jarvis-boot-scan"></div>
    <div class="jarvis-boot-live">
      <div class="jarvis-boot-live-row"><span class="jarvis-boot-live-label">Loading interface modules</span><span class="jarvis-boot-live-percent">00%</span></div>
      <div class="jarvis-boot-livebar"><span></span></div>
    </div>
    <button class="jarvis-boot-skip" type="button">SKIP BOOT</button>
  `;
  document.body.appendChild(overlay);

  const img = overlay.querySelector<HTMLImageElement>(".jarvis-boot-exact");
  const skip = overlay.querySelector<HTMLButtonElement>(".jarvis-boot-skip");
  const livePercent = overlay.querySelector<HTMLElement>(".jarvis-boot-live-percent");
  const liveLabel = overlay.querySelector<HTMLElement>(".jarvis-boot-live-label");
  const liveBar = overlay.querySelector<HTMLElement>(".jarvis-boot-livebar > span");
  let done = false;
  let raf = 0;
  let started = 0;
  let readyFlashed = false;

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

    const tick = (now: number) => {
      if (!started) started = now;
      const ratio = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - ratio, 2.2);
      const pct = Math.round(eased * 100);
      overlay.style.setProperty("--boot-ratio", String(eased));
      overlay.classList.toggle("crashout", ratio > .34 && ratio < .76);
      overlay.classList.toggle("stabilize", ratio >= .76 && ratio < .94);
      if (ratio > .92 && !readyFlashed) {
        readyFlashed = true;
        overlay.classList.add("ready");
      }
      if (livePercent) livePercent.textContent = `${String(pct).padStart(2, "0")}%`;
      if (liveBar) liveBar.style.setProperty("--live-progress", `${pct}%`);
      if (liveLabel) {
        liveLabel.textContent = ratio > .92
          ? "System ready, awaiting command"
          : ratio > .76
            ? "Stabilizing core resonance"
            : ratio > .34
              ? "Synaptic crashout, neural grid charging"
              : ratio > .18
                ? "Syncing memory banks"
                : "Loading interface modules";
      }
      if (ratio >= 1) finish();
      else raf = requestAnimationFrame(tick);
    };

    const startAnimation = () => {
      if (done || raf) return;
      raf = requestAnimationFrame(tick);
    };

    skip?.addEventListener("click", finish);
    if (img?.complete) startAnimation();
    else {
      img?.addEventListener("load", startAnimation, { once: true });
      img?.addEventListener("error", startAnimation, { once: true });
      window.setTimeout(startAnimation, 600);
    }
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
