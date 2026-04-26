"""
JARVIS EmailAgent
Liest Outlook-Inbox via PowerShell COM,
klassifiziert Mails per LLM (Ollama),
gibt Spam-Kandidaten zurueck.
Wird vom Backend als Sub-Prozess aufgerufen oder
direkt als FastAPI-Endpoint eingehaengt.
"""

import json
import subprocess
import sys
import os
from pathlib import Path
from typing import Any

# ── Pfad zu den PS-Skripten ────────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).parent
SCAN_PS    = SCRIPT_DIR / "scan_inbox.ps1"
DELETE_PS  = SCRIPT_DIR / "delete_mails.ps1"

# ── PowerShell ausfuehren ──────────────────────────────────────────────────────
def run_ps(script: Path, extra_args: list[str] = []) -> dict:
    cmd = [
        "powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass",
        "-File", str(script),
    ] + extra_args

    result = subprocess.run(
        cmd, capture_output=True, text=True, timeout=30
    )
    output = result.stdout.strip()
    if not output:
        return {"error": result.stderr.strip() or "Kein Output"}
    try:
        return json.loads(output)
    except json.JSONDecodeError:
        return {"error": f"PS-Output kein JSON: {output[:200]}"}

# ── Spam-Klassifikation per LLM ───────────────────────────────────────────────
SPAM_SYSTEM = """Du bist ein E-Mail-Filter-Assistent.
Analysiere jede E-Mail und bewerte sie als SPAM oder LEGITIM.

Spam-Indikatoren:
- Unbekannte Absender mit generischen Domains
- Werbung, Newsletter ohne klaren Bezug
- Phishing-Versuche, verdächtige Links
- Betreff mit übertriebenen Versprechen oder Dringlichkeit
- Kein persönlicher Bezug, Massen-Mailing-Stil

Legitim-Indikatoren:
- Bekannte Absender (Familie, Kollegen, offizielle Dienste)
- Klarer persönlicher oder geschäftlicher Bezug
- Erwartete Benachrichtigungen (Bestellbestätigungen, Rechnungen)

Antworte NUR mit gültigem JSON, kein Text davor oder danach:
{"classification":"SPAM","confidence":0.95,"reason":"Massenwerbung unbekannter Absender"}
oder
{"classification":"LEGITIM","confidence":0.98,"reason":"Bekannter Absender, persönlicher Bezug"}
"""

def classify_mail(mail: dict, api_url: str = "http://localhost:8000", model: str = "qwen3:8b") -> dict:
    prompt = f"""Absender: {mail.get('sender','')}
Betreff: {mail.get('subject','')}
Vorschau: {mail.get('preview','')}"""

    try:
        import urllib.request
        payload = json.dumps({
            "model": model,
            "messages": [
                {"role": "system", "content": SPAM_SYSTEM},
                {"role": "user",   "content": prompt}
            ],
            "stream": False,
            "temperature": 0.1
        }).encode()

        req = urllib.request.Request(
            f"{api_url}/v1/chat/completions",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read())
            content = data["choices"][0]["message"]["content"].strip()
            # Strip markdown fences if model wraps in ```json
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            return json.loads(content.strip())
    except Exception as e:
        return {"classification": "UNBEKANNT", "confidence": 0.0, "reason": str(e)}

# ── Haupt-Scan-Funktion ────────────────────────────────────────────────────────
def scan_and_classify(
    max_mails: int = 50,
    spam_threshold: float = 0.75,
    api_url: str = "http://localhost:8000",
    model: str = "qwen3:8b"
) -> dict:
    # 1. Inbox scannen
    inbox = run_ps(SCAN_PS, ["-MaxMails", str(max_mails)])
    if "error" in inbox:
        return {"error": inbox["error"]}

    mails = inbox.get("mails", [])
    if not mails:
        return {"total_scanned": 0, "spam": [], "legitimate": [], "unknown": []}

    # 2. Klassifizieren
    spam_candidates  = []
    legitimate       = []
    unknown          = []

    for mail in mails:
        result = classify_mail(mail, api_url=api_url, model=model)
        entry = {
            "entryId":    mail.get("entryId", ""),
            "sender":     mail.get("sender", ""),
            "subject":    mail.get("subject", ""),
            "received":   mail.get("received", ""),
            "confidence": result.get("confidence", 0),
            "reason":     result.get("reason", ""),
        }
        cls = result.get("classification", "UNBEKANNT").upper()
        if cls == "SPAM" and result.get("confidence", 0) >= spam_threshold:
            spam_candidates.append(entry)
        elif cls == "LEGITIM":
            legitimate.append(entry)
        else:
            unknown.append(entry)

    return {
        "total_scanned": len(mails),
        "spam":          spam_candidates,
        "legitimate":    legitimate,
        "unknown":       unknown,
        "threshold":     spam_threshold,
    }

# ── Delete-Funktion ────────────────────────────────────────────────────────────
def delete_mails(entry_ids: list[str], permanent: bool = False) -> dict:
    if not entry_ids:
        return {"error": "Keine IDs angegeben"}
    action = "delete" if permanent else "trash"
    ids_json = json.dumps(entry_ids)
    return run_ps(DELETE_PS, ["-EntryIdsJson", ids_json, "-Action", action])

# ── CLI fuer Tests ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="JARVIS EmailAgent")
    parser.add_argument("--scan",    action="store_true", help="Inbox scannen und klassifizieren")
    parser.add_argument("--delete",  nargs="+",           help="EntryIDs loeschen")
    parser.add_argument("--max",     type=int, default=30,help="Maximale Mails")
    parser.add_argument("--thresh",  type=float, default=0.75, help="Spam-Schwellwert")
    parser.add_argument("--api",     default="http://localhost:8000", help="Backend-URL")
    parser.add_argument("--model",   default="qwen3:8b", help="Modell")
    parser.add_argument("--permanent", action="store_true", help="Permanent loeschen")
    args = parser.parse_args()

    if args.scan:
        result = scan_and_classify(
            max_mails=args.max,
            spam_threshold=args.thresh,
            api_url=args.api,
            model=args.model
        )
        print(json.dumps(result, indent=2, ensure_ascii=False))

    elif args.delete:
        result = delete_mails(args.delete, permanent=args.permanent)
        print(json.dumps(result, indent=2, ensure_ascii=False))

    else:
        parser.print_help()
