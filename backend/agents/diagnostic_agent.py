"""
JARVIS Diagnostic Agent
Analysiert Fehlerlogs, Startprobleme, Build-Fehler, fehlende Ports,
Python/Node-Probleme und gibt strukturierte Befunde mit Fix-Vorschlägen zurück.
"""
from __future__ import annotations
import json
import os
import platform
import re
import shutil
import socket
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Generator

from agents.base_agent import BaseAgent, AgentContext, AgentResult

BASE_DIR = Path(__file__).resolve().parent.parent.parent

# ── Schweregrad-Klassifikation ────────────────────────────────────────────────
SEVERITY_CRITICAL = "critical"
SEVERITY_HIGH     = "high"
SEVERITY_MEDIUM   = "medium"
SEVERITY_LOW      = "low"
SEVERITY_INFO     = "info"

# ── Fehlermuster ──────────────────────────────────────────────────────────────
ERROR_PATTERNS = [
    # Python
    (r"ModuleNotFoundError: No module named '([^']+)'", SEVERITY_CRITICAL,
     "Fehlende Python-Bibliothek: {match}",
     "pip install {match} in der venv ausführen"),
    (r"ImportError: ([^\n]+)", SEVERITY_HIGH,
     "Python Import-Fehler: {match}",
     "requirements.txt prüfen und pip install -r requirements.txt ausführen"),
    (r"SyntaxError: ([^\n]+)", SEVERITY_CRITICAL,
     "Python Syntaxfehler: {match}",
     "Datei im Editor öffnen, Zeilennummer aus dem Traceback prüfen"),
    (r"PermissionError: \[Errno 13\]", SEVERITY_HIGH,
     "Zugriff verweigert",
     "Datei- oder Ordnerrechte prüfen, ggf. als Administrator ausführen"),
    (r"FileNotFoundError: \[Errno 2\] No such file or directory: '([^']+)'", SEVERITY_HIGH,
     "Datei nicht gefunden: {match}",
     "Pfad prüfen: {match}"),
    (r"json\.decoder\.JSONDecodeError", SEVERITY_MEDIUM,
     "Defekte JSON-Datei",
     "JSON-Datei im Editor prüfen oder corrupt_backups/ wiederherstellen"),
    (r"Address already in use|Only one usage of each socket", SEVERITY_HIGH,
     "Port bereits belegt",
     "Laufenden Prozess beenden: taskkill /F /IM python.exe (Windows)"),
    (r"ConnectionRefusedError|Connection refused", SEVERITY_HIGH,
     "Verbindung abgelehnt — Zieldienst läuft nicht",
     "Ollama starten: ollama serve"),
    (r"uvicorn\.error|uvicorn\s+ERROR", SEVERITY_HIGH,
     "Uvicorn Backend-Fehler",
     "Backend-Log prüfen, main.py Syntaxcheck ausführen"),
    # Node / npm
    (r"npm ERR! code ENOENT", SEVERITY_HIGH,
     "npm: Datei nicht gefunden",
     "Verzeichnis prüfen, node_modules löschen und npm install erneut ausführen"),
    (r"npm ERR! code EACCES", SEVERITY_HIGH,
     "npm: Zugriff verweigert",
     "Als Administrator ausführen oder Ordnerrechte prüfen"),
    (r"npm WARN deprecated", SEVERITY_LOW,
     "npm: veraltete Pakete",
     "npm update ausführen, falls verfügbar"),
    (r"Cannot find module '([^']+)'", SEVERITY_HIGH,
     "Node: Modul nicht gefunden: {match}",
     "npm install ausführen oder fehlendes Paket installieren"),
    (r"TypeScript error", SEVERITY_MEDIUM,
     "TypeScript Kompilierfehler",
     "npm run typecheck ausführen für Details"),
    (r"error TS\d+", SEVERITY_MEDIUM,
     "TypeScript Fehler",
     "Fehlermeldung lesen, betroffene .tsx/.ts Datei prüfen"),
    # PowerShell
    (r"is not recognized as (an internal or external command|the name of a cmdlet)",
     SEVERITY_HIGH,
     "PowerShell: Befehl nicht gefunden",
     "PATH prüfen oder fehlende Software installieren"),
    (r"ExecutionPolicy", SEVERITY_MEDIUM,
     "PowerShell ExecutionPolicy blockiert Skript",
     "Set-ExecutionPolicy -Scope CurrentUser RemoteSigned ausführen"),
    # Pfad-Probleme
    (r"C:\\Projekte|old_frontend|jarvis_old|legacy_frontend", SEVERITY_HIGH,
     "Alter Projektpfad gefunden",
     "Pfad auf aktuelle Installation aktualisieren"),
    # Encoding
    (r"UnicodeDecodeError|UnicodeEncodeError|charmap.*codec", SEVERITY_MEDIUM,
     "Encoding-Fehler",
     "Datei mit UTF-8 Encoding lesen: open(..., encoding='utf-8')"),
    # Port
    (r"EADDRINUSE|address already in use", SEVERITY_HIGH,
     "Port bereits belegt",
     "lsof -i :PORT oder netstat -ano | findstr :PORT ausführen"),
    # Generische Fehler
    (r"CRITICAL|FATAL", SEVERITY_CRITICAL,
     "Kritischer Fehler",
     "Log vollständig lesen, Backend neu starten"),
    (r"ERROR|error:", SEVERITY_HIGH,
     "Fehler",
     "Kontext im Log prüfen"),
    (r"WARNING|WARN|warning:", SEVERITY_LOW,
     "Warnung",
     "Warnung prüfen, meist nicht kritisch"),
]


def _run(cmd: list[str], timeout: int = 8) -> tuple[str, str, int]:
    """Führt Kommando aus, gibt (stdout, stderr, returncode) zurück."""
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return r.stdout.strip(), r.stderr.strip(), r.returncode
    except FileNotFoundError:
        return "", f"Befehl nicht gefunden: {cmd[0]}", 1
    except subprocess.TimeoutExpired:
        return "", f"Timeout nach {timeout}s", 1
    except Exception as e:
        return "", str(e), 1


def check_port(port: int) -> dict:
    """Prüft ob ein Port erreichbar (belegt) ist."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(0.5)
            result = s.connect_ex(("127.0.0.1", port))
            return {"port": port, "in_use": result == 0}
    except Exception:
        return {"port": port, "in_use": False}


def check_dependencies() -> list[dict]:
    """Prüft alle Laufzeit-Abhängigkeiten."""
    checks = []

    # Python
    checks.append({
        "name": "Python",
        "ok": True,
        "value": sys.version.split()[0],
        "severity": SEVERITY_INFO,
        "fix": None,
    })

    # Node.js
    out, _, rc = _run(["node", "--version"])
    checks.append({
        "name": "Node.js",
        "ok": rc == 0,
        "value": out if rc == 0 else "nicht gefunden",
        "severity": SEVERITY_CRITICAL if rc != 0 else SEVERITY_INFO,
        "fix": "Node.js LTS installieren: https://nodejs.org" if rc != 0 else None,
    })

    # npm
    out, _, rc = _run(["npm", "--version"])
    checks.append({
        "name": "npm",
        "ok": rc == 0,
        "value": out if rc == 0 else "nicht gefunden",
        "severity": SEVERITY_CRITICAL if rc != 0 else SEVERITY_INFO,
        "fix": "npm kommt mit Node.js — Node.js neu installieren" if rc != 0 else None,
    })

    # Ollama
    out, _, rc = _run(["ollama", "--version"])
    checks.append({
        "name": "Ollama",
        "ok": rc == 0,
        "value": out if rc == 0 else "nicht gefunden",
        "severity": SEVERITY_HIGH if rc != 0 else SEVERITY_INFO,
        "fix": "Ollama installieren: https://ollama.ai" if rc != 0 else None,
    })

    # venv
    venv = BASE_DIR / "backend" / ".venv" / "Scripts" / "python.exe"
    if not venv.exists():
        venv = BASE_DIR / "backend" / ".venv" / "bin" / "python"
    checks.append({
        "name": "Python venv",
        "ok": venv.exists(),
        "value": str(venv) if venv.exists() else "nicht vorhanden",
        "severity": SEVERITY_CRITICAL if not venv.exists() else SEVERITY_INFO,
        "fix": "FIRST_SETUP.ps1 ausführen" if not venv.exists() else None,
    })

    # node_modules
    nm = BASE_DIR / "frontend" / "node_modules"
    checks.append({
        "name": "node_modules",
        "ok": nm.exists(),
        "value": "vorhanden" if nm.exists() else "fehlt",
        "severity": SEVERITY_HIGH if not nm.exists() else SEVERITY_INFO,
        "fix": "npm install im frontend/ Ordner ausführen" if not nm.exists() else None,
    })

    # Frontend dist
    dist = BASE_DIR / "frontend" / "dist" / "index.html"
    checks.append({
        "name": "Frontend Build",
        "ok": dist.exists(),
        "value": "vorhanden" if dist.exists() else "fehlt",
        "severity": SEVERITY_HIGH if not dist.exists() else SEVERITY_INFO,
        "fix": "npm run build im frontend/ Ordner ausführen" if not dist.exists() else None,
    })

    # Ports
    for port, service in [(8000, "Backend"), (11434, "Ollama"), (5173, "Frontend Dev")]:
        status = check_port(port)
        checks.append({
            "name": f"Port {port} ({service})",
            "ok": status["in_use"] if port != 5173 else True,  # 5173 nur im Dev-Modus nötig
            "value": "erreichbar" if status["in_use"] else "nicht erreichbar",
            "severity": SEVERITY_INFO,
            "fix": None,
        })

    return checks


def analyze_log_text(text: str, source: str = "unbekannt") -> list[dict]:
    """Analysiert einen Log-Text und gibt strukturierte Befunde zurück."""
    findings = []
    lines = text.splitlines()

    for line_no, line in enumerate(lines, 1):
        for pattern, severity, description_tpl, fix_tpl in ERROR_PATTERNS:
            m = re.search(pattern, line, re.IGNORECASE)
            if m:
                match_str = m.group(1) if m.lastindex else m.group(0)
                description = description_tpl.replace("{match}", match_str)
                fix = fix_tpl.replace("{match}", match_str)
                findings.append({
                    "severity":    severity,
                    "description": description,
                    "fix":         fix,
                    "source":      source,
                    "line_no":     line_no,
                    "raw":         line.strip()[:200],
                })
                break  # nur ein Muster pro Zeile

    # Duplikate entfernen (gleiche description)
    seen: set[str] = set()
    unique = []
    for f in findings:
        key = f["description"]
        if key not in seen:
            seen.add(key)
            unique.append(f)

    # Nach Schweregrad sortieren
    order = {SEVERITY_CRITICAL: 0, SEVERITY_HIGH: 1, SEVERITY_MEDIUM: 2,
             SEVERITY_LOW: 3, SEVERITY_INFO: 4}
    unique.sort(key=lambda x: order.get(x["severity"], 5))
    return unique


def analyze_log_file(path: Path) -> dict:
    """Analysiert eine Logdatei und gibt vollständigen Befund zurück."""
    if not path.exists():
        return {"error": f"Datei nicht gefunden: {path}", "findings": []}
    try:
        text = path.read_text(encoding="utf-8", errors="replace")
    except Exception as e:
        return {"error": str(e), "findings": []}

    findings = analyze_log_text(text, source=path.name)
    criticals = [f for f in findings if f["severity"] == SEVERITY_CRITICAL]
    highs     = [f for f in findings if f["severity"] == SEVERITY_HIGH]

    summary = f"{len(findings)} Befunde"
    if criticals:
        summary += f", {len(criticals)} kritisch"
    if highs:
        summary += f", {len(highs)} hoch"
    if not findings:
        summary = "Keine Probleme erkannt"

    return {
        "file":     str(path),
        "lines":    text.count("\n"),
        "size_kb":  round(path.stat().st_size / 1024, 1),
        "findings": findings,
        "summary":  summary,
        "critical_count": len(criticals),
        "high_count":     len(highs),
    }


def deep_check() -> dict:
    """Vollständiger System-Check mit allen Abhängigkeiten."""
    result = {
        "ts": datetime.now().isoformat(timespec="seconds"),
        "dependencies": check_dependencies(),
        "log_analysis": [],
        "old_paths": [],
        "summary": "",
    }

    # Logs analysieren
    log_dir = BASE_DIR / "logs"
    if log_dir.exists():
        for log_file in sorted(log_dir.glob("*.log"))[:5]:
            analysis = analyze_log_file(log_file)
            if analysis.get("findings"):
                result["log_analysis"].append(analysis)

    # Alte Pfade suchen
    old_path_patterns = ["C:\\Projekte", "legacy_project", "old_frontend", "jarvis_old"]
    for py_file in (BASE_DIR / "backend").glob("*.py"):
        try:
            content = py_file.read_text(encoding="utf-8", errors="replace")
            for pat in old_path_patterns:
                if pat.lower() in content.lower():
                    result["old_paths"].append({
                        "file": py_file.name,
                        "pattern": pat,
                        "severity": SEVERITY_HIGH,
                    })
        except Exception:
            pass

    # Summary
    total_critical = sum(
        d.get("critical_count", 0) for d in result["log_analysis"]
    )
    dep_failures = sum(1 for d in result["dependencies"] if not d.get("ok"))
    issues = []
    if dep_failures:
        issues.append(f"{dep_failures} Abhängigkeiten fehlen")
    if total_critical:
        issues.append(f"{total_critical} kritische Log-Fehler")
    if result["old_paths"]:
        issues.append(f"{len(result['old_paths'])} alte Pfade")
    result["summary"] = "Alles in Ordnung" if not issues else " | ".join(issues)
    result["ok"] = not bool(issues)

    return result


# ── Agent-Klasse ─────────────────────────────────────────────────────────────

SYSTEM = """Du bist der JARVIS Diagnostic Agent.
Du analysierst Fehlermeldungen, Logs, Build-Fehler und Startprobleme.
Antworte auf Deutsch. Sei präzise und nenne konkrete Fix-Vorschläge.
Format: kurze Analyse, wahrscheinliche Ursache, konkreter nächster Schritt.
Kein Marketing, keine Phrasen."""


class DiagnosticAgent(BaseAgent):
    name        = "diagnostic"
    description = "Analysiert Logs, Fehler, Build-Probleme und gibt Fix-Vorschläge"

    def run(self, ctx: AgentContext) -> AgentResult:
        user_input = ctx.user_input.lower()
        tool_log   = []

        # Wenn Nutzer nach Check fragt → echten Check ausführen
        if any(w in user_input for w in ["check", "prüf", "diagnose", "status", "abhängigkeiten", "dependencies"]):
            deps = check_dependencies()
            problems = [d for d in deps if not d["ok"]]
            lines = ["System-Check:"]
            for d in deps:
                icon = "✓" if d["ok"] else "✗"
                lines.append(f"{icon} {d['name']}: {d['value']}")
            if problems:
                lines.append("\nProbleme gefunden:")
                for p in problems:
                    lines.append(f"  → {p['name']}: {p.get('fix', 'Fix unbekannt')}")
            else:
                lines.append("\nAlle Abhängigkeiten in Ordnung.")
            tool_log.append("check_dependencies ausgeführt")
            return AgentResult(agent=self.name, content="\n".join(lines), tool_log=tool_log)

        # Wenn Nutzer Log-Text einfügt → analysieren
        if any(w in user_input for w in ["error", "fehler", "traceback", "exception", "log", "npm", "build"]):
            findings = analyze_log_text(ctx.user_input, source="Nutzer-Input")
            if findings:
                lines = [f"Log-Analyse: {len(findings)} Befunde\n"]
                for f in findings[:10]:
                    lines.append(f"[{f['severity'].upper()}] {f['description']}")
                    lines.append(f"  Fix: {f['fix']}")
                    if f.get("line_no"):
                        lines.append(f"  Zeile {f['line_no']}: {f['raw'][:80]}")
                    lines.append("")
                tool_log.append("analyze_log_text ausgeführt")
                return AgentResult(agent=self.name, content="\n".join(lines), tool_log=tool_log)

        # Sonst: LLM mit Diagnose-Systempromt
        messages = [
            {"role": "system", "content": SYSTEM},
            *[{"role": m["role"], "content": m["content"]} for m in ctx.history[-4:]],
            {"role": "user", "content": ctx.user_input},
        ]
        content = self.llm(messages, ctx, temperature=0.2)
        return AgentResult(agent=self.name, content=content, tool_log=tool_log)

    def run_stream(self, ctx: AgentContext) -> Generator[str, None, None]:
        result = self.run(ctx)
        yield result.content
