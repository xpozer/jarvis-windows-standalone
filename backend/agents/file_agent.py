"""
JARVIS FileAgent
Analysiert PDFs und Dokumente: Zusammenfassung, Grenzwerte,
Pruefberichte, Norm-Referenzen extrahieren.
"""

import json
import subprocess
from pathlib import Path
from .base_agent import BaseAgent, AgentContext, AgentResult

SYSTEM = """Du bist der Dokument-Analyst von JARVIS.
Nutzer: Julien Negro, Elektro-Arbeitsplaner bei Bayer/Tectrion.

Deine Aufgaben:
- PDFs und Dokumente zusammenfassen
- Grenzwerte, Messwerte und technische Daten extrahieren
- Pruefberichte analysieren und Maengel identifizieren
- Norm-Referenzen (VDE, DGUV, DIN, TRBS) erkennen und einordnen
- Tabellen und Listen strukturiert aufbereiten

Wenn du ein Dokument analysierst:
1. Kurze Zusammenfassung (3-5 Saetze)
2. Wichtigste Fakten/Werte als Liste
3. Norm-Referenzen separat auflisten
4. Handlungsbedarf wenn erkennbar

Antworte auf Deutsch. Praezise, technisch korrekt."""


def extract_pdf_text(filepath: str) -> str:
    """Extrahiert Text aus PDF via Python."""
    try:
        # Versuche pdfplumber (besser fuer Tabellen)
        import pdfplumber
        text_parts = []
        with pdfplumber.open(filepath) as pdf:
            for page in pdf.pages[:20]:  # Max 20 Seiten
                t = page.extract_text()
                if t:
                    text_parts.append(t)
        return "\n\n".join(text_parts)
    except ImportError:
        pass

    try:
        # Fallback: PyPDF2
        from PyPDF2 import PdfReader
        reader = PdfReader(filepath)
        text_parts = []
        for page in reader.pages[:20]:
            t = page.extract_text()
            if t:
                text_parts.append(t)
        return "\n\n".join(text_parts)
    except ImportError:
        pass

    try:
        # Fallback: PowerShell + iTextSharp (wenn vorhanden)
        r = subprocess.run(
            ["powershell.exe", "-NoProfile", "-Command",
             f'Add-Type -Path "itextsharp.dll"; $r = [iTextSharp.text.pdf.PdfReader]::new("{filepath}"); '
             f'for($i=1;$i -le [Math]::Min($r.NumberOfPages,20);$i++){{[iTextSharp.text.pdf.parser.PdfTextExtractor]::GetTextFromPage($r,$i)}}'],
            capture_output=True, text=True, timeout=30
        )
        if r.returncode == 0 and r.stdout.strip():
            return r.stdout.strip()
    except Exception:
        pass

    return "[PDF-Extraktion fehlgeschlagen. Installiere pdfplumber: pip install pdfplumber]"


class FileAgent(BaseAgent):
    name        = "file"
    description = "PDFs analysieren, Pruefberichte lesen, Dokumente zusammenfassen"

    def run(self, ctx: AgentContext) -> AgentResult:
        tool_log = []

        # Pruefen ob eine Datei referenziert wird
        filepath = ctx.extra.get("filepath", "")
        file_content = ""

        if filepath and Path(filepath).exists():
            tool_log.append(f"Datei geladen: {Path(filepath).name}")
            suffix = Path(filepath).suffix.lower()

            if suffix == ".pdf":
                file_content = extract_pdf_text(filepath)
                tool_log.append(f"PDF: {len(file_content)} Zeichen extrahiert")
            elif suffix in (".txt", ".md", ".csv", ".log"):
                try:
                    file_content = Path(filepath).read_text(encoding="utf-8", errors="ignore")[:15000]
                    tool_log.append(f"Textdatei: {len(file_content)} Zeichen")
                except Exception as e:
                    file_content = f"[Fehler beim Lesen: {e}]"
            else:
                file_content = f"[Dateityp {suffix} wird noch nicht unterstuetzt]"

        sys_content = SYSTEM
        if file_content:
            # Max 8000 Zeichen damit der Kontext nicht ueberlaeuft
            truncated = file_content[:8000]
            if len(file_content) > 8000:
                truncated += f"\n\n[... gekuerzt, {len(file_content)} Zeichen gesamt]"
            sys_content += f"\n\n--- DOKUMENT-INHALT ---\n{truncated}\n--- ENDE DOKUMENT ---"

        skill_ctx = self.get_skill_context(ctx)
        sys_content += skill_ctx

        messages = [
            {"role": "system", "content": sys_content},
            *[{"role": m["role"], "content": m["content"]} for m in ctx.history[-4:]],
            {"role": "user", "content": ctx.user_input},
        ]
        content = self.llm(messages, ctx, temperature=0.2)
        return AgentResult(agent=self.name, content=content, tool_log=tool_log)

    def run_stream(self, ctx):
        filepath = ctx.extra.get("filepath", "")
        file_content = ""
        if filepath and Path(filepath).exists():
            suffix = Path(filepath).suffix.lower()
            if suffix == ".pdf":
                file_content = extract_pdf_text(filepath)
            elif suffix in (".txt", ".md", ".csv", ".log"):
                try:
                    file_content = Path(filepath).read_text(encoding="utf-8", errors="ignore")[:15000]
                except Exception as e:
                    file_content = f"[Datei konnte nicht gelesen werden: {e}]"

        sys_content = SYSTEM
        if file_content:
            truncated = file_content[:8000]
            if len(file_content) > 8000:
                truncated += f"\n\n[... gekuerzt]"
            sys_content += f"\n\n--- DOKUMENT ---\n{truncated}\n--- ENDE ---"

        skill_ctx = self.get_skill_context(ctx)
        sys_content += skill_ctx

        messages = [
            {"role": "system", "content": sys_content},
            *[{"role": m["role"], "content": m["content"]} for m in ctx.history[-4:]],
            {"role": "user", "content": ctx.user_input},
        ]
        yield from self.llm_stream(messages, ctx, temperature=0.2)
