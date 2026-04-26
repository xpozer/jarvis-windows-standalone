import { useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
type Tab = "leitung" | "kurzschluss";

interface LeitungResult {
  spannungsfall: number;
  spannungsfallProzent: number;
  querschnittMin: number;
  querschnittEmpfohlen: number;
  verlustleistung: number;
}

interface KurzschlussResult {
  ik: number;
  ikMin: number;
  abschaltzeitOk: boolean;
  empfohlenerSicherung: string;
  b_wert: number;
}

// Normquerschnitte nach VDE
const NORM_QUERSCHNITTE = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120];

function naechsterNormquerschnitt(min: number): number {
  return NORM_QUERSCHNITTE.find((q) => q >= min) ?? 120;
}

// Empfohlene Sicherung nach Kurzschlussstrom (grobe Näherung)
function empfohlenenSicherung(ib: number): string {
  const stufen = [6, 10, 13, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125];
  const s = stufen.find((a) => a >= ib);
  return s ? `B${s} / C${s}` : ">C125 — Lastschalter prüfen";
}

// ── Leitungsberechnung ────────────────────────────────────────────────────────
function berechneLeit(
  strom: number,
  laenge: number,
  spannung: number,
  leitfaehigkeit: number, // κ in m/(Ω·mm²)
  phasen: 1 | 3,
  maxSpannungsfall: number
): LeitungResult {
  const k = phasen === 3 ? Math.sqrt(3) : 2;
  // Spannungsfall bei gegebenem Querschnitt (erst mit Mindestquerschnitt berechnen)
  const querschnittMin = (k * strom * laenge) / (leitfaehigkeit * maxSpannungsfall * (spannung / 100));
  const querschnittEmpfohlen = naechsterNormquerschnitt(querschnittMin);

  const widerstand = (k * laenge) / (leitfaehigkeit * querschnittEmpfohlen);
  const spannungsfall = strom * widerstand;
  const spannungsfallProzent = (spannungsfall / spannung) * 100;
  const verlustleistung = strom * strom * widerstand;

  return {
    spannungsfall,
    spannungsfallProzent,
    querschnittMin,
    querschnittEmpfohlen,
    verlustleistung,
  };
}

// ── Kurzschlussberechnung (vereinfacht nach IEC 60909) ────────────────────────
function berechneKurzschluss(
  spannung: number,      // Nennspannung in V
  impedanz: number,      // Netzimpedanz in Ω (Zq)
  leitlaenge: number,    // Leitungslänge in m
  querschnitt: number,   // Leitungsquerschnitt in mm²
  leitfaehigkeit: number,
  ib: number             // Betriebsstrom (für Sicherungsempfehlung)
): KurzschlussResult {
  const rLeitung = (2 * leitlaenge) / (leitfaehigkeit * querschnitt);
  const zGesamt = impedanz + rLeitung;

  // Maximaler Kurzschlussstrom (c=1.0 vereinfacht)
  const ik = (spannung / Math.sqrt(3)) / zGesamt;

  // Minimaler Kurzschlussstrom (c=0.95, Leitungsende)
  const ikMin = ik * 0.95;

  // B-Wert = Ik / Ib
  const b_wert = ikMin / ib;

  // Abschaltbedingung: B ≥ 5 für Leitungsschutzschalter Typ B (vereinfacht)
  const abschaltzeitOk = b_wert >= 5;

  return {
    ik,
    ikMin,
    abschaltzeitOk,
    empfohlenerSicherung: empfohlenenSicherung(ib),
    b_wert,
  };
}

// ── Hilfskomponenten ──────────────────────────────────────────────────────────
function FormelBox({ children }: { children: React.ReactNode }) {
  return <div className="calc-formel">{children}</div>;
}

function ResultRow({
  label,
  value,
  unit,
  highlight,
  warn,
}: {
  label: string;
  value: string;
  unit?: string;
  highlight?: boolean;
  warn?: boolean;
}) {
  return (
    <div className={`calc-result-row ${highlight ? "highlight" : ""} ${warn ? "warn" : ""}`}>
      <span className="calc-result-label">{label}</span>
      <span className="calc-result-value">
        {value}
        {unit && <span className="calc-result-unit"> {unit}</span>}
      </span>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  unit,
  min,
  step,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit?: string;
  min?: number;
  step?: number;
}) {
  return (
    <div className="calc-field">
      <label className="calc-label">{label}</label>
      <div className="calc-input-wrap">
        <input
          className="calc-input"
          type="number"
          value={value}
          min={min}
          step={step ?? "any"}
          onChange={(e) => onChange(e.target.value)}
        />
        {unit && <span className="calc-unit">{unit}</span>}
      </div>
    </div>
  );
}

// ── Leitungsberechnung Panel ──────────────────────────────────────────────────
function LeitungsPanel() {
  const [strom, setStrom] = useState("16");
  const [laenge, setLaenge] = useState("50");
  const [spannung, setSpannung] = useState("400");
  const [phasen, setPhasen] = useState<"1" | "3">("3");
  const [maxDU, setMaxDU] = useState("3");
  const [kappa, setKappa] = useState("56"); // Kupfer

  const result: LeitungResult | null = (() => {
    const i = parseFloat(strom);
    const l = parseFloat(laenge);
    const u = parseFloat(spannung);
    const du = parseFloat(maxDU);
    const k = parseFloat(kappa);
    if ([i, l, u, du, k].some(isNaN) || i <= 0 || l <= 0 || u <= 0) return null;
    return berechneLeit(i, l, u, k, phasen === "3" ? 3 : 1, du);
  })();

  return (
    <div className="calc-panel">
      <div className="calc-section">
        <div className="calc-section-title">EINGABE</div>
        <div className="calc-fields">
          <InputField label="Strom Ib" value={strom} onChange={setStrom} unit="A" min={0} />
          <InputField label="Leitungslänge" value={laenge} onChange={setLaenge} unit="m" min={0} />
          <InputField label="Nennspannung" value={spannung} onChange={setSpannung} unit="V" min={0} />
          <InputField label="Max. Spannungsfall ΔU" value={maxDU} onChange={setMaxDU} unit="%" min={0} step={0.5} />
          <InputField label="Leitfähigkeit κ" value={kappa} onChange={setKappa} unit="m/Ω·mm²" min={1} />

          <div className="calc-field">
            <label className="calc-label">System</label>
            <div className="calc-toggle">
              <button
                className={`calc-toggle-btn ${phasen === "1" ? "active" : ""}`}
                onClick={() => setPhasen("1")}
              >
                1-phasig
              </button>
              <button
                className={`calc-toggle-btn ${phasen === "3" ? "active" : ""}`}
                onClick={() => setPhasen("3")}
              >
                3-phasig
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="calc-section">
        <div className="calc-section-title">FORMELN</div>
        <FormelBox>
          <div className="calc-formel-line">
            <span className="cf-sym">A<sub>min</sub></span>
            <span className="cf-eq">=</span>
            <span className="cf-frac">
              <span>{phasen === "3" ? "√3" : "2"} · I<sub>b</sub> · l</span>
              <span>κ · ΔU<sub>zul</sub></span>
            </span>
          </div>
          <div className="calc-formel-line">
            <span className="cf-sym">ΔU</span>
            <span className="cf-eq">=</span>
            <span className="cf-expr">I<sub>b</sub> · R<sub>L</sub></span>
          </div>
          <div className="calc-formel-line">
            <span className="cf-sym">R<sub>L</sub></span>
            <span className="cf-eq">=</span>
            <span className="cf-frac">
              <span>{phasen === "3" ? "√3" : "2"} · l</span>
              <span>κ · A</span>
            </span>
          </div>
        </FormelBox>
      </div>

      {result && (
        <div className="calc-section">
          <div className="calc-section-title">ERGEBNIS</div>
          <div className="calc-results">
            <ResultRow
              label="Mindestquerschnitt"
              value={result.querschnittMin.toFixed(2)}
              unit="mm²"
            />
            <ResultRow
              label="Empfohlener Normquerschnitt"
              value={result.querschnittEmpfohlen.toFixed(1)}
              unit="mm²"
              highlight
            />
            <ResultRow
              label="Spannungsfall ΔU"
              value={result.spannungsfall.toFixed(2)}
              unit="V"
            />
            <ResultRow
              label="Spannungsfall ΔU%"
              value={result.spannungsfallProzent.toFixed(2)}
              unit="%"
              warn={result.spannungsfallProzent > parseFloat(maxDU)}
            />
            <ResultRow
              label="Verlustleistung"
              value={result.verlustleistung.toFixed(1)}
              unit="W"
            />
          </div>
          {result.spannungsfallProzent > parseFloat(maxDU) && (
            <div className="calc-warning">
              Spannungsfall überschreitet {maxDU}% — nächsten Normquerschnitt wählen
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Kurzschlussstrom Panel ────────────────────────────────────────────────────
function KurzschlussPanel() {
  const [spannung, setSpannung] = useState("400");
  const [zNetz, setZNetz] = useState("0.1");
  const [laenge, setLaenge] = useState("50");
  const [querschnitt, setQuerschnitt] = useState("2.5");
  const [ib, setIb] = useState("16");
  const [kappa, setKappa] = useState("56");

  const result: KurzschlussResult | null = (() => {
    const u = parseFloat(spannung);
    const z = parseFloat(zNetz);
    const l = parseFloat(laenge);
    const a = parseFloat(querschnitt);
    const i = parseFloat(ib);
    const k = parseFloat(kappa);
    if ([u, z, l, a, i, k].some(isNaN) || [u, l, a, i, k].some((v) => v <= 0)) return null;
    return berechneKurzschluss(u, z, l, a, k, i);
  })();

  return (
    <div className="calc-panel">
      <div className="calc-section">
        <div className="calc-section-title">EINGABE</div>
        <div className="calc-fields">
          <InputField label="Nennspannung" value={spannung} onChange={setSpannung} unit="V" />
          <InputField label="Netzimpedanz Zq" value={zNetz} onChange={setZNetz} unit="Ω" step={0.01} />
          <InputField label="Leitungslänge" value={laenge} onChange={setLaenge} unit="m" />
          <InputField label="Querschnitt" value={querschnitt} onChange={setQuerschnitt} unit="mm²" />
          <InputField label="Betriebsstrom Ib" value={ib} onChange={setIb} unit="A" />
          <InputField label="Leitfähigkeit κ" value={kappa} onChange={setKappa} unit="m/Ω·mm²" />
        </div>
      </div>

      <div className="calc-section">
        <div className="calc-section-title">FORMELN</div>
        <FormelBox>
          <div className="calc-formel-line">
            <span className="cf-sym">I<sub>k</sub></span>
            <span className="cf-eq">=</span>
            <span className="cf-frac">
              <span>c · U<sub>n</sub> / √3</span>
              <span>Z<sub>q</sub> + R<sub>L</sub></span>
            </span>
          </div>
          <div className="calc-formel-line">
            <span className="cf-sym">R<sub>L</sub></span>
            <span className="cf-eq">=</span>
            <span className="cf-frac">
              <span>2 · l</span>
              <span>κ · A</span>
            </span>
          </div>
          <div className="calc-formel-line">
            <span className="cf-sym">B</span>
            <span className="cf-eq">=</span>
            <span className="cf-frac">
              <span>I<sub>k,min</sub></span>
              <span>I<sub>b</sub></span>
            </span>
            <span className="cf-note">≥ 5 (Typ B)</span>
          </div>
        </FormelBox>
        <div className="calc-norm-hint">
          Berechnung nach IEC 60909 vereinfacht (c = 1.0 / 0.95)
        </div>
      </div>

      {result && (
        <div className="calc-section">
          <div className="calc-section-title">ERGEBNIS</div>
          <div className="calc-results">
            <ResultRow
              label="Kurzschlussstrom Ik (max)"
              value={(result.ik / 1000).toFixed(2)}
              unit="kA"
              highlight
            />
            <ResultRow
              label="Kurzschlussstrom Ik (min)"
              value={(result.ikMin / 1000).toFixed(2)}
              unit="kA"
            />
            <ResultRow
              label="B-Wert (Ik,min / Ib)"
              value={result.b_wert.toFixed(1)}
              warn={!result.abschaltzeitOk}
            />
            <ResultRow
              label="Abschaltbedingung (B ≥ 5)"
              value={result.abschaltzeitOk ? "ERFÜLLT" : "NICHT ERFÜLLT"}
              highlight={result.abschaltzeitOk}
              warn={!result.abschaltzeitOk}
            />
            <ResultRow
              label="Sicherungsempfehlung"
              value={result.empfohlenerSicherung}
              highlight
            />
          </div>
          {!result.abschaltzeitOk && (
            <div className="calc-warning">
              B-Wert &lt; 5 — Abschaltbedingung nicht erfüllt. Querschnitt erhöhen oder Leitungslänge reduzieren.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Hauptkomponente ───────────────────────────────────────────────────────────
export function RechnerPage() {
  const [tab, setTab] = useState<Tab>("leitung");

  return (
    <div className="calc-root">
      <div className="calc-header">
        <div className="calc-title">ELEKTRISCHER RECHNER</div>
        <div className="calc-tabs">
          <button
            className={`calc-tab ${tab === "leitung" ? "active" : ""}`}
            onClick={() => setTab("leitung")}
          >
            LEITUNGSBERECHNUNG
          </button>
          <button
            className={`calc-tab ${tab === "kurzschluss" ? "active" : ""}`}
            onClick={() => setTab("kurzschluss")}
          >
            KURZSCHLUSSSTROM
          </button>
        </div>
      </div>

      <div className="calc-content">
        {tab === "leitung" ? <LeitungsPanel /> : <KurzschlussPanel />}
      </div>
    </div>
  );
}
