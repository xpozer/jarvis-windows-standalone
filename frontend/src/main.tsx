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
        radial-gradient(circle at 50% 47%, rgba(6,28,52,.94), transparent 58%),
        radial-gradient(circle at 14% 18%, rgba(255,54,95,.14), transparent 28%),
        #02050a;
      color: #e8fbff;
      font-family: Consolas, "JetBrains Mono", monospace;
      --boot-ratio: 0;
      --live-progress: 0%;
      --phase-progress: 0%;
    }
    .jarvis-boot::before {
      content: "";
      position: absolute;
      inset: 0;
      pointer-events: none;
      background-image:
        linear-gradient(rgba(126,231,255,.045) 1px, transparent 1px),
        linear-gradient(90deg, rgba(126,231,255,.032) 1px, transparent 1px);
      background-size: 44px 44px;
      opacity: .66;
      mask-image: radial-gradient(circle at center, black 0 72%, transparent 96%);
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
      filter: saturate(1.08) contrast(1.04) brightness(.92);
      animation: jarvisBootExactPulse 2.2s ease-in-out infinite;
      transform-origin: center center;
      opacity: .84;
    }
    .jarvis-boot-topline {
      position: absolute;
      top: 22px;
      left: 34px;
      right: 34px;
      z-index: 9;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      pointer-events: none;
    }
    .jarvis-boot-logo {
      font-size: 28px;
      letter-spacing: 22px;
      color: #e8fbff;
      text-shadow: 0 0 18px rgba(126,231,255,.82);
    }
    .jarvis-boot-sub {
      margin-top: 8px;
      color: rgba(126,231,255,.66);
      font-size: 10px;
      letter-spacing: .24em;
    }
    .jarvis-boot-live-clock {
      color: rgba(218,244,255,.70);
      font-size: 11px;
      letter-spacing: .18em;
      text-align: right;
      line-height: 1.75;
    }
    .jarvis-boot-live-clock b {
      color: #7ee7ff;
      text-shadow: 0 0 14px rgba(126,231,255,.48);
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
    .jarvis-boot-panels {
      position: absolute;
      inset: 112px 36px 94px;
      z-index: 8;
      pointer-events: none;
      display: grid;
      grid-template-columns: minmax(280px, 360px) 1fr minmax(280px, 360px);
      gap: 24px;
    }
    .jarvis-boot-left,
    .jarvis-boot-right {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .jarvis-boot-right { justify-content: flex-start; }
    .jarvis-boot-panel {
      border: 1px solid rgba(126,231,255,.18);
      border-radius: 14px;
      background: linear-gradient(180deg, rgba(4,14,27,.62), rgba(2,7,15,.42));
      box-shadow: 0 0 34px rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,.035);
      backdrop-filter: blur(12px);
      padding: 14px;
      min-height: 0;
    }
    .jarvis-boot-panel h3 {
      margin: 0 0 12px;
      color: #7ee7ff;
      font-size: 12px;
      letter-spacing: .16em;
      text-transform: uppercase;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .jarvis-boot-panel h3 small {
      color: #ff365f;
      font-size: 9px;
      letter-spacing: .18em;
    }
    .jarvis-boot-phase {
      display: grid;
      grid-template-columns: 34px 1fr 42px;
      align-items: center;
      gap: 10px;
      padding: 8px 0;
      border-bottom: 1px solid rgba(126,231,255,.08);
      opacity: .38;
      transition: opacity .18s ease, transform .18s ease;
    }
    .jarvis-boot-phase.active {
      opacity: 1;
      transform: translateX(4px);
    }
    .jarvis-boot-phase.done { opacity: .74; }
    .jarvis-boot-phase-dot {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 1px solid rgba(126,231,255,.38);
      background: radial-gradient(circle, rgba(126,231,255,.70), transparent 42%);
      box-shadow: 0 0 14px rgba(126,231,255,.20);
    }
    .jarvis-boot-phase.active .jarvis-boot-phase-dot {
      border-color: rgba(255,54,95,.58);
      box-shadow: 0 0 18px rgba(255,54,95,.35), inset 0 0 10px rgba(255,54,95,.18);
    }
    .jarvis-boot-phase-title {
      color: #e8fbff;
      font-size: 11px;
      letter-spacing: .12em;
      text-transform: uppercase;
    }
    .jarvis-boot-phase-sub {
      margin-top: 3px;
      color: rgba(218,244,255,.52);
      font-size: 9px;
      letter-spacing: .14em;
      text-transform: uppercase;
    }
    .jarvis-boot-phase-value {
      color: #7ee7ff;
      font-size: 11px;
      text-align: right;
    }
    .jarvis-boot-telemetry {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
    .jarvis-boot-metric {
      border: 1px solid rgba(126,231,255,.12);
      border-radius: 10px;
      padding: 10px;
      background: rgba(2,8,17,.34);
    }
    .jarvis-boot-metric span {
      display: block;
      color: rgba(218,244,255,.56);
      font-size: 9px;
      letter-spacing: .14em;
      text-transform: uppercase;
    }
    .jarvis-boot-metric b {
      display: block;
      margin-top: 6px;
      color: #7ee7ff;
      font-size: 18px;
      letter-spacing: .08em;
      text-shadow: 0 0 14px rgba(126,231,255,.38);
    }
    .jarvis-boot-metric em {
      display: block;
      margin-top: 6px;
      height: 3px;
      border-radius: 999px;
      background: rgba(126,231,255,.12);
      overflow: hidden;
    }
    .jarvis-boot-metric em i {
      display: block;
      height: 100%;
      width: var(--w, 40%);
      background: linear-gradient(90deg, #1f9cff, #7ee7ff);
      box-shadow: 0 0 12px rgba(126,231,255,.60);
    }
    .jarvis-boot-chart {
      height: 82px;
      display: flex;
      align-items: end;
      gap: 8px;
      border-bottom: 1px solid rgba(126,231,255,.11);
      padding-bottom: 8px;
    }
    .jarvis-boot-chart i {
      flex: 1;
      min-width: 7px;
      height: var(--h, 38%);
      background: linear-gradient(180deg, #7ee7ff, rgba(126,231,255,.10));
      box-shadow: 0 0 12px rgba(126,231,255,.22);
      transition: height .18s ease;
    }
    .jarvis-boot-diag {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid rgba(126,231,255,.08);
      padding: 7px 0;
      color: rgba(218,244,255,.64);
      font-size: 10px;
      letter-spacing: .12em;
      text-transform: uppercase;
    }
    .jarvis-boot-diag b { color: #4ce8a0; }
    .jarvis-boot-diag.hot b { color: #ff365f; text-shadow: 0 0 12px rgba(255,54,95,.45); }
    .jarvis-boot-log {
      max-height: 154px;
      overflow: hidden;
      color: rgba(126,231,255,.72);
      font-size: 10px;
      line-height: 1.65;
      letter-spacing: .08em;
    }
    .jarvis-boot-log-line {
      white-space: nowrap;
      animation: jarvisLogIn .24s ease-out both;
    }
    .jarvis-boot-log-line b { color: #4ce8a0; font-weight: 400; }
    .jarvis-boot-log-line.hot b { color: #ff365f; }
    .jarvis-boot-crunch {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      gap: 5px;
      margin-top: 10px;
    }
    .jarvis-boot-crunch i {
      height: 18px;
      border: 1px solid rgba(126,231,255,.10);
      border-radius: 4px;
      background: rgba(126,231,255,.08);
      opacity: var(--o, .4);
      box-shadow: 0 0 10px rgba(126,231,255,.08);
    }
    .jarvis-boot-flash {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 7;
      background: radial-gradient(circle at 50% 47%, rgba(255,255,255,.95), rgba(126,231,255,.32) 18%, transparent 44%);
      opacity: 0;
      mix-blend-mode: screen;
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
      z-index: 7;
    }
    .jarvis-boot-live {
      position: absolute;
      left: 50%;
      bottom: 24px;
      transform: translateX(-50%);
      width: min(720px, 46vw);
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
      height: 7px;
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
    .jarvis-boot-phasebar {
      height: 3px;
      border-radius: 999px;
      background: rgba(126,231,255,.12);
      overflow: hidden;
      margin-top: 8px;
    }
    .jarvis-boot-phasebar span {
      display: block;
      width: var(--phase-progress, 0%);
      height: 100%;
      background: linear-gradient(90deg, #ff365f, #7ee7ff);
      box-shadow: 0 0 14px rgba(126,231,255,.55);
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
    .jarvis-boot.ready .jarvis-boot-flash { animation: jarvisReadyFlash .68s ease-out 1; }
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
      0%,100% { filter: saturate(1.08) contrast(1.04) brightness(.92); }
      50% { filter: saturate(1.24) contrast(1.09) brightness(1.05); }
    }
    @keyframes jarvisBootSpin { to { transform: rotate(360deg); } }
    @keyframes jarvisBootSpinReverse { to { transform: rotate(-360deg); } }
    @keyframes jarvisBootBreath { 0%,100% { opacity: .46; transform: scale(.97); } 50% { opacity: .9; transform: scale(1.025); } }
    @keyframes jarvisBootCoreCharge { 0%,100% { transform: scale(.88); opacity: .78; } 50% { transform: scale(1.16); opacity: 1; } }
    @keyframes jarvisSynapse { 0%,100% { opacity: 0; } 16% { opacity: .95; } 46% { opacity: .42; } 68% { opacity: 0; } }
    @keyframes jarvisSpark { 0%,100% { opacity: .2; transform: scale(.55); } 35% { opacity: 1; transform: scale(1.25); } 65% { opacity: .42; transform: scale(.8); } }
    @keyframes jarvisBootCrashShake { 0% { transform: translate(-50%, -50%) translate(0,0) scale(1.03); } 25% { transform: translate(-50%, -50%) translate(2px,-1px) scale(1.045); } 50% { transform: translate(-50%, -50%) translate(-2px,1px) scale(1.035); } 75% { transform: translate(-50%, -50%) translate(1px,2px) scale(1.052); } 100% { transform: translate(-50%, -50%) translate(0,0) scale(1.03); } }
    @keyframes jarvisReadyFlash { 0% { opacity: 0; } 30% { opacity: .88; } 100% { opacity: 0; } }
    @keyframes jarvisLogIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
    @media (max-width: 1180px) {
      .jarvis-boot-panels { grid-template-columns: 1fr; inset: 110px 22px 90px; opacity: .92; }
      .jarvis-boot-right { display: none; }
      .jarvis-boot-left { max-width: 360px; }
      .jarvis-boot-live { width: min(720px, 72vw); bottom: 18px; }
      .jarvis-boot-skip { right: 18px; bottom: 18px; }
      .jarvis-boot-orb { width: min(64vw, 54vh); top: 47%; }
      .jarvis-boot-logo { letter-spacing: 12px; font-size: 20px; }
    }
  `;
  document.head.appendChild(style);
}

function runBootSequence(): Promise<void> {
  const params = new URLSearchParams(location.search);
  if (params.has("noboot") || localStorage.getItem("jarvis_boot_disabled") === "1") return Promise.resolve();

  injectBootStyle();

  const hasBooted = localStorage.getItem("jarvis_boot_seen") === "1";
  const duration = hasBooted ? 5200 : 16800;
  const phases = [
    { title: "Power Core", sub: "Kernel wake and HUD frame", start: 0, end: 10, label: "Power core ignition" },
    { title: "Memory Banks", sub: "Context cache alignment", start: 10, end: 28, label: "Syncing memory banks" },
    { title: "IO Channels", sub: "Local ports and service bus", start: 28, end: 44, label: "Binding local IO channels" },
    { title: "Security Layer", sub: "Permission shell and audit", start: 44, end: 58, label: "Validating security layer" },
    { title: "Neural Core", sub: "Synaptic crashout sequence", start: 58, end: 78, label: "Charging neural core" },
    { title: "Backend Link", sub: "FastAPI route handshake", start: 78, end: 90, label: "Linking backend services" },
    { title: "Interface Sync", sub: "Dashboard and command layer", start: 90, end: 100, label: "Interface synchronized" },
  ];

  const overlay = document.createElement("div");
  overlay.className = "jarvis-boot";
  overlay.innerHTML = `
    <div class="jarvis-boot-stage">
      <img class="jarvis-boot-exact" src="/jarvis-boot-sequence.svg" alt="JARVIS Boot Sequence" />
    </div>
    <div class="jarvis-boot-topline">
      <div>
        <div class="jarvis-boot-logo">JARVIS</div>
        <div class="jarvis-boot-sub">LOCAL ASSISTANT BOOT SEQUENCE</div>
      </div>
      <div class="jarvis-boot-live-clock"><span class="boot-time">00:00:00</span><br/>SESSION <b>LOCAL</b><br/>MODE <b>STANDALONE</b></div>
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
    <div class="jarvis-boot-panels">
      <div class="jarvis-boot-left">
        <section class="jarvis-boot-panel">
          <h3>Boot Phases <small>REAL PROGRESS</small></h3>
          ${phases.map((phase, index) => `
            <div class="jarvis-boot-phase" data-phase="${index}">
              <div class="jarvis-boot-phase-dot"></div>
              <div><div class="jarvis-boot-phase-title">${phase.title}</div><div class="jarvis-boot-phase-sub">${phase.sub}</div></div>
              <div class="jarvis-boot-phase-value">00%</div>
            </div>`).join("")}
        </section>
        <section class="jarvis-boot-panel">
          <h3>Runtime Telemetry <small>LIVE</small></h3>
          <div class="jarvis-boot-telemetry">
            <div class="jarvis-boot-metric"><span>CPU Load</span><b data-metric="cpu">00%</b><em><i data-bar="cpu"></i></em></div>
            <div class="jarvis-boot-metric"><span>Memory</span><b data-metric="mem">0.0 GB</b><em><i data-bar="mem"></i></em></div>
            <div class="jarvis-boot-metric"><span>Core Temp</span><b data-metric="temp">00.0 C</b><em><i data-bar="temp"></i></em></div>
            <div class="jarvis-boot-metric"><span>Uplink</span><b data-metric="net">0.00 Gb/s</b><em><i data-bar="net"></i></em></div>
          </div>
        </section>
      </div>
      <div></div>
      <div class="jarvis-boot-right">
        <section class="jarvis-boot-panel">
          <h3>Neural Activity <small>STREAM</small></h3>
          <div class="jarvis-boot-chart">${Array.from({ length: 18 }, (_, i) => `<i data-chart="${i}"></i>`).join("")}</div>
          <div class="jarvis-boot-crunch">${Array.from({ length: 40 }, (_, i) => `<i data-cell="${i}"></i>`).join("")}</div>
        </section>
        <section class="jarvis-boot-panel">
          <h3>Diagnostics <small>CHECK</small></h3>
          <div class="jarvis-boot-diag"><span>Backend Port</span><b data-diag="backend">SCANNING</b></div>
          <div class="jarvis-boot-diag"><span>Ollama Bridge</span><b data-diag="ollama">PENDING</b></div>
          <div class="jarvis-boot-diag"><span>Model Slot</span><b data-diag="model">LOCKING</b></div>
          <div class="jarvis-boot-diag"><span>Dashboard Bus</span><b data-diag="dashboard">INIT</b></div>
          <div class="jarvis-boot-diag"><span>Command Layer</span><b data-diag="command">ARMING</b></div>
          <div class="jarvis-boot-phasebar"><span></span></div>
        </section>
        <section class="jarvis-boot-panel">
          <h3>Boot Log <small>TRACE</small></h3>
          <div class="jarvis-boot-log"></div>
        </section>
      </div>
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
  const phaseBar = overlay.querySelector<HTMLElement>(".jarvis-boot-phasebar > span");
  const phaseEls = Array.from(overlay.querySelectorAll<HTMLElement>(".jarvis-boot-phase"));
  const chartBars = Array.from(overlay.querySelectorAll<HTMLElement>("[data-chart]"));
  const cells = Array.from(overlay.querySelectorAll<HTMLElement>("[data-cell]"));
  const bootLog = overlay.querySelector<HTMLElement>(".jarvis-boot-log");
  const timeEl = overlay.querySelector<HTMLElement>(".boot-time");
  let done = false;
  let raf = 0;
  let started = 0;
  let readyFlashed = false;
  let lastLogIndex = -1;

  const logMessages = [
    "POWER RAIL NOMINAL",
    "KERNEL WAKE VECTOR ACCEPTED",
    "HUD FRAME BUFFER ONLINE",
    "MEMORY BANKS INDEXED",
    "CONTEXT CACHE ALIGNED",
    "LOCAL IO CHANNELS BOUND",
    "PORT 8000 ROUTE TABLE PREPARED",
    "SECURITY SHELL VERIFIED",
    "AUDIT STREAM READY",
    "SYNAPTIC GRID CHARGING",
    "NEURAL CRASHOUT STABILIZING",
    "OLLAMA BRIDGE HANDSHAKE QUEUED",
    "MODEL SLOT RESERVED",
    "DASHBOARD EVENT BUS READY",
    "COMMAND LAYER ONLINE",
    "INTERFACE SYNCHRONIZED",
    "SYSTEM READY"
  ];

  const setMetric = (name: string, value: string, width: number) => {
    const metric = overlay.querySelector<HTMLElement>(`[data-metric="${name}"]`);
    const bar = overlay.querySelector<HTMLElement>(`[data-bar="${name}"]`);
    if (metric) metric.textContent = value;
    if (bar) bar.style.setProperty("--w", `${Math.max(3, Math.min(100, width))}%`);
  };

  const setDiag = (name: string, value: string) => {
    const item = overlay.querySelector<HTMLElement>(`[data-diag="${name}"]`);
    if (item) item.textContent = value;
  };

  const addLog = (index: number, hot = false) => {
    if (!bootLog || index <= lastLogIndex || !logMessages[index]) return;
    lastLogIndex = index;
    const now = new Date();
    const stamp = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const line = document.createElement("div");
    line.className = `jarvis-boot-log-line ${hot ? "hot" : ""}`;
    line.innerHTML = `${stamp}.${String(Math.floor(performance.now() % 999)).padStart(3, "0")}&nbsp;&nbsp;<b>${hot ? "SYNC" : "OK"}</b>&nbsp;&nbsp;${logMessages[index]}`;
    bootLog.appendChild(line);
    while (bootLog.children.length > 9) bootLog.removeChild(bootLog.firstElementChild as Element);
  };

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
      const raw = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - raw, 2.2);
      const pct = Math.round(eased * 100);
      const pulse = Math.sin(now / 260);
      const wave = Math.sin(now / 520);
      overlay.style.setProperty("--boot-ratio", String(eased));
      overlay.classList.toggle("crashout", raw > .34 && raw < .76);
      overlay.classList.toggle("stabilize", raw >= .76 && raw < .94);
      if (raw > .92 && !readyFlashed) {
        readyFlashed = true;
        overlay.classList.add("ready");
      }
      if (timeEl) timeEl.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      if (livePercent) livePercent.textContent = `${String(pct).padStart(2, "0")}%`;
      if (liveBar) liveBar.style.setProperty("--live-progress", `${pct}%`);

      const currentPhase = phases.find((phase) => pct >= phase.start && pct <= phase.end) || phases[phases.length - 1];
      const phaseRange = Math.max(1, currentPhase.end - currentPhase.start);
      const phasePct = Math.max(0, Math.min(100, ((pct - currentPhase.start) / phaseRange) * 100));
      if (phaseBar) phaseBar.style.setProperty("--phase-progress", `${phasePct}%`);
      if (liveLabel) liveLabel.textContent = currentPhase.label;

      phaseEls.forEach((el, index) => {
        const phase = phases[index];
        const donePhase = pct > phase.end;
        const active = pct >= phase.start && pct <= phase.end;
        const local = donePhase ? 100 : active ? Math.round(Math.max(0, Math.min(100, ((pct - phase.start) / Math.max(1, phase.end - phase.start)) * 100))) : 0;
        el.classList.toggle("done", donePhase);
        el.classList.toggle("active", active);
        const value = el.querySelector<HTMLElement>(".jarvis-boot-phase-value");
        if (value) value.textContent = `${String(local).padStart(2, "0")}%`;
      });

      setMetric("cpu", `${Math.round(24 + eased * 54 + pulse * 11)}%`, 24 + eased * 54 + pulse * 11);
      setMetric("mem", `${(3.8 + eased * 7.6 + wave * .6).toFixed(1)} GB`, 34 + eased * 42 + wave * 8);
      setMetric("temp", `${(31.4 + eased * 10.8 + pulse * 1.2).toFixed(1)} C`, 28 + eased * 36 + pulse * 6);
      setMetric("net", `${(0.18 + eased * 1.82 + Math.abs(wave) * .36).toFixed(2)} Gb/s`, 18 + eased * 62 + Math.abs(wave) * 12);

      chartBars.forEach((bar, index) => {
        const h = 18 + Math.abs(Math.sin(now / (220 + index * 17) + index)) * 74;
        bar.style.setProperty("--h", `${h}%`);
      });
      cells.forEach((cell, index) => {
        const o = .18 + Math.abs(Math.sin(now / 190 + index * .7)) * .78;
        cell.style.setProperty("--o", String(o));
      });

      setDiag("backend", pct > 78 ? "ONLINE" : pct > 32 ? "SCANNING" : "PENDING");
      setDiag("ollama", pct > 84 ? "BRIDGED" : pct > 58 ? "HANDSHAKE" : "PENDING");
      setDiag("model", pct > 88 ? "READY" : pct > 62 ? "LOCKING" : "WAITING");
      setDiag("dashboard", pct > 92 ? "SYNCED" : pct > 48 ? "LOADING" : "INIT");
      setDiag("command", pct > 96 ? "ONLINE" : pct > 72 ? "ARMING" : "STANDBY");

      const logIndex = Math.min(logMessages.length - 1, Math.floor(eased * logMessages.length));
      addLog(logIndex, raw > .34 && raw < .76);

      if (raw >= 1) finish();
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
