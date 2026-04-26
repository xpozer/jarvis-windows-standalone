import { useState } from "react";

// ── Typen ─────────────────────────────────────────────────────────────────────
interface ParsedTermin {
  titel: string;
  datum: Date | null;
  dauer: number; // Minuten
  ort: string;
  teilnehmer: string; // E-Mail
  notiz: string;
  raw: string;
}

// ── Datum-Parser ──────────────────────────────────────────────────────────────
// Versteht: heute, morgen, übermorgen, Wochentage, DD.MM., DD.MM.YYYY
// Uhrzeiten: 14 Uhr, 14:30, 14.30, um 9
function parseTermin(text: string): ParsedTermin {
  const now = new Date();
  const lower = text.toLowerCase();

  // ── Datum ──
  let datum: Date | null = null;

  const relativ: Record<string, number> = {
    heute: 0,
    morgen: 1,
    übermorgen: 2,
    uebermorgen: 2,
  };

  for (const [word, offset] of Object.entries(relativ)) {
    if (lower.includes(word)) {
      datum = new Date(now);
      datum.setDate(datum.getDate() + offset);
      datum.setHours(9, 0, 0, 0);
      break;
    }
  }

  // Wochentage
  if (!datum) {
    const wochentage = ["sonntag", "montag", "dienstag", "mittwoch", "donnerstag", "freitag", "samstag"];
    for (let i = 0; i < wochentage.length; i++) {
      if (lower.includes(wochentage[i])) {
        datum = new Date(now);
        const diff = (i - datum.getDay() + 7) % 7 || 7;
        datum.setDate(datum.getDate() + diff);
        datum.setHours(9, 0, 0, 0);
        break;
      }
    }
  }

  // DD.MM.YYYY oder DD.MM.
  if (!datum) {
    const dmyMatch = text.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})?/);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1]);
      const month = parseInt(dmyMatch[2]) - 1;
      const year = dmyMatch[3] ? parseInt(dmyMatch[3]) : now.getFullYear();
      datum = new Date(year, month, day, 9, 0, 0, 0);
    }
  }

  // Fallback: heute
  if (!datum) {
    datum = new Date(now);
    datum.setHours(9, 0, 0, 0);
  }

  // ── Uhrzeit ──
  // "14:30", "14.30", "14 Uhr", "um 14", "9:00"
  const zeitPatterns = [
    /(\d{1,2})[:\.](\d{2})\s*uhr?/i,
    /(\d{1,2})[:\.](\d{2})/,
    /um\s+(\d{1,2})\s*uhr?/i,
    /(\d{1,2})\s*uhr/i,
  ];

  for (const pattern of zeitPatterns) {
    const m = text.match(pattern);
    if (m) {
      datum.setHours(parseInt(m[1]), m[2] ? parseInt(m[2]) : 0, 0, 0);
      break;
    }
  }

  // ── Dauer ──
  let dauer = 60;
  const dauerMatch = text.match(/(\d+)\s*(stunde[n]?|std|h)\b/i);
  const minMatch = text.match(/(\d+)\s*min(uten?)?/i);
  if (dauerMatch) dauer = parseInt(dauerMatch[1]) * 60;
  else if (minMatch) dauer = parseInt(minMatch[1]);

  // ── Ort ──
  let ort = "";
  const ortMatch = text.match(/(?:in|im|bei|raum|room)\s+([A-Za-zÄÖÜäöüß0-9\s\-]+?)(?:,|\.|\s+um|\s+mit|\s+für|$)/i);
  if (ortMatch) ort = ortMatch[1].trim();

  // ── Teilnehmer / E-Mail ──
  let teilnehmer = "";
  const emailMatch = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) teilnehmer = emailMatch[0];

  // ── Titel: alles was übrig bleibt ──
  let titel = text
    .replace(/(\d{1,2})[:\.](\d{2})\s*uhr?/gi, "")
    .replace(/um\s+\d{1,2}\s*uhr?/gi, "")
    .replace(/\d{1,2}\s*uhr/gi, "")
    .replace(/(\d{1,2})\.(\d{1,2})\.(\d{4})?/g, "")
    .replace(/\b(heute|morgen|übermorgen|montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag)\b/gi, "")
    .replace(/\d+\s*(stunde[n]?|std|h)\b/gi, "")
    .replace(/\d+\s*min(uten?)?/gi, "")
    .replace(/(?:in|im|bei|raum)\s+[A-Za-zÄÖÜäöüß0-9\s\-]+?(?:,|\.|\s+um|\s+mit|\s+für|$)/gi, "")
    .replace(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  // Erste Buchstabe groß
  if (titel) titel = titel.charAt(0).toUpperCase() + titel.slice(1);
  if (!titel) titel = "Neuer Termin";

  return { titel, datum, dauer, ort, teilnehmer, notiz: "", raw: text };
}

// ── ICS-Generator ─────────────────────────────────────────────────────────────
function toICSDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function generateICS(t: ParsedTermin): string {
  if (!t.datum) return "";
  const start = new Date(t.datum);
  const end = new Date(start.getTime() + t.dauer * 60000);
  const uid = `jarvis-${Date.now()}@jarvis-local`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//JARVIS Windows Standalone//DE",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toICSDate(new Date())}`,
    `DTSTART:${toICSDate(start)}`,
    `DTEND:${toICSDate(end)}`,
    `SUMMARY:${t.titel}`,
    t.ort ? `LOCATION:${t.ort}` : "",
    t.notiz ? `DESCRIPTION:${t.notiz}` : "",
    t.teilnehmer ? `ATTENDEE;CN=${t.teilnehmer}:mailto:${t.teilnehmer}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  return lines;
}

function downloadICS(t: ParsedTermin) {
  const ics = generateICS(t);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${t.titel.replace(/[^a-zA-Z0-9]/g, "_")}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

// Outlook-Protokolllink (Windows + installiertes Outlook)
function buildOutlookLink(t: ParsedTermin): string {
  if (!t.datum) return "";
  const start = new Date(t.datum);
  const end = new Date(start.getTime() + t.dauer * 60000);

  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

  const params = new URLSearchParams({
    subject: t.titel,
    startdt: fmt(start),
    enddt: fmt(end),
    ...(t.ort ? { location: t.ort } : {}),
    ...(t.notiz ? { body: t.notiz } : {}),
  });

  return `ms-outlook://compose?type=appointment&${params.toString()}`;
}

// Mailto-Link für Einladung
function buildMailtoLink(t: ParsedTermin, inviteEmail: string): string {
  if (!t.datum) return "";
  const dateStr = t.datum.toLocaleDateString("de-DE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = t.datum.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const body = `Hallo,\n\nhiermit lade ich Sie/Dich ein zu:\n\n${t.titel}\nDatum: ${dateStr}\nUhrzeit: ${timeStr} Uhr${t.ort ? `\nOrt: ${t.ort}` : ""}${t.notiz ? `\n\n${t.notiz}` : ""}\n\nBitte bestätigen Sie/bestätige die Teilnahme.\n\nViele Grüße`;

  return `mailto:${inviteEmail}?subject=${encodeURIComponent(`Einladung: ${t.titel}`)}&body=${encodeURIComponent(body)}`;
}

// ── Datumsformatierung für Anzeige ────────────────────────────────────────────
function formatDatum(d: Date): string {
  return d.toLocaleDateString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
function formatZeit(d: Date): string {
  return d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

// ── Hauptkomponente ───────────────────────────────────────────────────────────
export function TerminePage() {
  const [input, setInput] = useState("");
  const [parsed, setParsed] = useState<ParsedTermin | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [editTitel, setEditTitel] = useState("");
  const [editOrt, setEditOrt] = useState("");
  const [editNotiz, setEditNotiz] = useState("");
  const [done, setDone] = useState(false);

  function handleParse() {
    if (!input.trim()) return;
    const p = parseTermin(input.trim());
    setParsed(p);
    setEditTitel(p.titel);
    setEditOrt(p.ort);
    setEditNotiz(p.notiz);
    setInviteEmail(p.teilnehmer);
    setDone(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleParse();
  }

  function getTermin(): ParsedTermin {
    return {
      ...parsed!,
      titel: editTitel,
      ort: editOrt,
      notiz: editNotiz,
    };
  }

  function handleOutlook() {
    const t = getTermin();
    const link = buildOutlookLink(t);
    if (link) window.location.href = link;
    setDone(true);
  }

  function handleICS() {
    downloadICS(getTermin());
    setDone(true);
  }

  function handleMailto() {
    if (!inviteEmail.trim()) return;
    const link = buildMailtoLink(getTermin(), inviteEmail.trim());
    window.location.href = link;
  }

  function handleReset() {
    setInput("");
    setParsed(null);
    setEditTitel("");
    setEditOrt("");
    setEditNotiz("");
    setInviteEmail("");
    setDone(false);
  }

  return (
    <div className="termin-root">
      <div className="termin-header">
        <div className="termin-title">TERMINPLANUNG</div>
        <div className="termin-subtitle">Termin in natürlicher Sprache eingeben</div>
      </div>

      {/* Eingabe */}
      <div className="termin-input-section">
        <div className="termin-examples">
          <span className="termin-example-label">Beispiele:</span>
          {[
            "Morgen 14 Uhr Meeting mit Klaus",
            "Freitag 9:30 Uhr Wartung Schaltanlage Raum E12",
            "15.05. 10 Uhr VDE-Prüfung 2 Stunden",
          ].map((ex) => (
            <button
              key={ex}
              className="termin-example"
              onClick={() => setInput(ex)}
            >
              {ex}
            </button>
          ))}
        </div>
        <div className="termin-input-row">
          <input
            className="termin-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Beschreibe den Termin..."
            autoFocus
          />
          <button className="termin-parse-btn" onClick={handleParse}>
            ERKENNEN
          </button>
        </div>
      </div>

      {/* Erkannter Termin */}
      {parsed && parsed.datum && (
        <div className="termin-result">
          <div className="termin-section-title">ERKANNT — BITTE PRÜFEN</div>

          <div className="termin-fields">
            <div className="termin-field">
              <label className="termin-label">Titel</label>
              <input
                className="termin-edit-input"
                value={editTitel}
                onChange={(e) => setEditTitel(e.target.value)}
              />
            </div>

            <div className="termin-field-row">
              <div className="termin-field">
                <label className="termin-label">Datum</label>
                <div className="termin-info-val">{formatDatum(parsed.datum)}</div>
              </div>
              <div className="termin-field">
                <label className="termin-label">Uhrzeit</label>
                <div className="termin-info-val">{formatZeit(parsed.datum)}</div>
              </div>
              <div className="termin-field">
                <label className="termin-label">Dauer</label>
                <div className="termin-info-val">{parsed.dauer} min</div>
              </div>
            </div>

            <div className="termin-field">
              <label className="termin-label">Ort (optional)</label>
              <input
                className="termin-edit-input"
                value={editOrt}
                onChange={(e) => setEditOrt(e.target.value)}
                placeholder="—"
              />
            </div>

            <div className="termin-field">
              <label className="termin-label">Notiz (optional)</label>
              <input
                className="termin-edit-input"
                value={editNotiz}
                onChange={(e) => setEditNotiz(e.target.value)}
                placeholder="—"
              />
            </div>
          </div>

          {/* Aktionen */}
          <div className="termin-section-title" style={{ marginTop: 16 }}>
            IN OUTLOOK EINTRAGEN
          </div>
          <div className="termin-actions">
            <button className="termin-btn primary" onClick={handleOutlook}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              OUTLOOK DIREKT ÖFFNEN
            </button>
            <button className="termin-btn secondary" onClick={handleICS}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              .ICS HERUNTERLADEN
            </button>
          </div>

          {done && (
            <div className="termin-done">
              Termin wurde übergeben. Prüf kurz in Outlook ob alles stimmt.
            </div>
          )}

          {/* Einladung */}
          <div className="termin-section-title" style={{ marginTop: 16 }}>
            EINLADUNG VERSENDEN (OPTIONAL)
          </div>
          <div className="termin-invite-row">
            <input
              className="termin-edit-input"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="E-Mail-Adresse..."
              type="email"
            />
            <button
              className="termin-btn secondary"
              onClick={handleMailto}
              disabled={!inviteEmail.trim()}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              E-MAIL ÖFFNEN
            </button>
          </div>
          <div className="termin-hint">
            Öffnet dein Standard-Mailprogramm mit vorausgefüllter Einladung.
          </div>

          <button className="termin-reset" onClick={handleReset}>
            Neuer Termin
          </button>
        </div>
      )}

      {parsed && !parsed.datum && (
        <div className="termin-warning">
          Datum konnte nicht erkannt werden. Bitte konkreter formulieren, z.B. "Morgen 10 Uhr" oder "15.05. 14:30".
        </div>
      )}
    </div>
  );
}
