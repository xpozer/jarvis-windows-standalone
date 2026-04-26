export type JarvisLogLevel = "info" | "warn" | "error";

export interface JarvisLogEntry {
  time: string;
  level: JarvisLogLevel;
  area: string;
  message: string;
}

const LOG_KEY = "jarvis_frontend_logs";
const MAX_LOGS = 250;

function normaliseMessage(value: unknown): string {
  if (value instanceof Error) {
    return `${value.name}: ${value.message}\n${value.stack ?? ""}`.trim();
  }
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function readStoredLogs(): JarvisLogEntry[] {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(-MAX_LOGS) : [];
  } catch {
    return [];
  }
}

function writeStoredLogs(logs: JarvisLogEntry[]) {
  try {
    localStorage.setItem(LOG_KEY, JSON.stringify(logs.slice(-MAX_LOGS)));
  } catch {
    // ignore storage failures
  }
}

export function addJarvisLog(level: JarvisLogLevel, area: string, value: unknown) {
  const entry: JarvisLogEntry = {
    time: new Date().toISOString(),
    level,
    area,
    message: normaliseMessage(value),
  };
  const logs = [...readStoredLogs(), entry].slice(-MAX_LOGS);
  writeStoredLogs(logs);
  return entry;
}

export function getJarvisLogs(): JarvisLogEntry[] {
  return readStoredLogs();
}

export function getJarvisLogText(): string {
  return readStoredLogs()
    .map((entry) => `[${entry.time}] [${entry.level.toUpperCase()}] [${entry.area}] ${entry.message}`)
    .join("\n");
}

export async function copyJarvisLogs() {
  const text = getJarvisLogText();
  try {
    await navigator.clipboard.writeText(text);
    addJarvisLog("info", "diagnostics", "Log in Zwischenablage kopiert");
  } catch (error) {
    addJarvisLog("error", "diagnostics", error);
  }
}

export function downloadJarvisLogs() {
  try {
    const blob = new Blob([getJarvisLogText()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jarvis-frontend-log-${new Date().toISOString().replace(/[:.]/g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    addJarvisLog("info", "diagnostics", "Log Download gestartet");
  } catch (error) {
    addJarvisLog("error", "diagnostics", error);
  }
}

if (typeof window !== "undefined") {
  const existingError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    addJarvisLog("error", "window", error ?? `${message} at ${source}:${lineno}:${colno}`);
    if (typeof existingError === "function") {
      return existingError(message, source, lineno, colno, error);
    }
    return false;
  };

  const existingUnhandled = window.onunhandledrejection;
  window.onunhandledrejection = (event) => {
    addJarvisLog("error", "promise", event.reason);
    if (typeof existingUnhandled === "function") {
      return existingUnhandled.call(window, event);
    }
  };
}
