# JARVIS · Living UI Vision (2026 → 2050)

> Diese Datei ist gleichzeitig **Vision-Dokument** und **wieder­verwend­barer Prompt**. Kopier sie in eine neue Claude-Session, und der Agent versteht das Ziel ohne Kontext.

## Leitsatz

> JARVIS ist ein **lebender Assistent**, kein Dashboard. Die UI soll **atmen**, **reagieren**, und **zuhören** — nicht nur Daten anzeigen.

Wir orientieren uns am Niveau eines Operator-Consoles aus einem Sci-Fi-Film, das in 2050 in Produktion läuft: jede Pixel-Zeile fühlt sich **bewusst** an. Nichts ist statisch, nichts ist zufällig.

---

## Die DO-Liste — was ein lebendiges UI ausmacht

### 1. Konstante Mikro-Bewegung
Nichts ist je 100% still. Pulsieren, Atmen, Drift, Flackern — auf Frequenzen die nie aufdringlich werden.

- **Heartbeat-System**: ein globaler Rhythmus (z. B. 60 BPM) auf den alle Pulse-Dots, Glows, Audit-Feed-Einträge synchronisieren. Der User spürt einen Puls, ohne ihn aktiv wahrzunehmen.
- **Idle-Drift**: Cards, Labels, Werte „atmen" minimal (±0.5px translate, opacity 0.92→1.0)
- **Telemetry breathes**: jede Zahl pulsiert minimal beim Update, statt nur die Ziffer zu tauschen
- **Background-Particles**: 50–200 langsame leuchtende Punkte, die in 3D-Tiefe driften (parallax)

### 2. Reaktivität auf User-Präsenz
Die UI weiß, dass jemand davorsitzt — und reagiert.

- **Magnetic-Cursor**: Buttons, Links, Cards ziehen den Cursor leicht an wenn er nahe ist
- **Cursor-Glow-Trail**: ein dezenter Cyan-Glow folgt dem Cursor mit Inertia (kein Pixel-perfekt-Verfolg, sondern eine Spur die nachzieht)
- **Card-Tilt**: 3D-Perspective-Tilt der Cards basierend auf Cursor-Position über der Card (max ±6°)
- **Idle-Ambient**: nach 30s ohne Interaktion wechselt die Hintergrund-Animation in einen ruhigeren Modus
- **Active-Boost**: bei Tastatur-Input verdichten sich Particles und Glows minimal

### 3. Reaktivität auf Daten & Compute
Die UI **zeigt** dass der Assistent denkt — nicht nur "Loading...".

- **Scanning-Beam** beim LLM-Call: ein vertikaler Cyan-Beam scannt über die aktive Card
- **Pulse-on-Event**: jedes neue Audit-Event löst eine Welle aus (radial, schnell abklingend)
- **Energy-Meter** statt CPU-Bar: visualisiere Compute-Load als „Metabolism" — eine atmende Form, kein Fortschrittsbalken
- **Confidence-Beam**: wenn die Antwort generiert wird, läuft ein Beam von oben nach unten durch das Conversation-Panel — Geschwindigkeit korreliert mit Streaming-Throughput
- **Heatmap-Rückkanal**: Module die gerade aktiv sind (SAP-Aufruf, Knowledge-Lookup) glimmen kurz im Sidebar
- **Pre-Cog-Hints**: bevor der User eine Frage zu Ende tippt, fängt JARVIS schon an Module zu „warmen" → visualisiert als sanftes Aufleuchten der wahrscheinlich relevanten Sidebar-Items

### 4. Sound × Visual Coupling
Visuals reagieren auf Sound, Sound reagiert auf Visuals — symbiotisch.

- **Voice-Wellenform** beim Sprechen: nicht ein Standard-Mic-Visualizer, sondern eine 3D-Wellenform, die sich um den Orb legt
- **TTS-Visualization**: bei Antwort-Wiedergabe pulst der Orb auf der Wellenform der Sprachausgabe
- **Ambient-Hum**: dezenter, ducker-betonter Hintergrund-Drone (10dB unter Sprache), der bei Aktivität minimal heller wird
- **State-Sound-Cues**: jedes Phase-Change (idle → listening → thinking → speaking) hat ein 0.3s langes, organisches Sound-Cue (kein „beep")
- **Mute-Visualization**: wenn Sound off ist, wird ein durchgestrichenes Wellen-Icon dezent in der Topbar gezeigt

### 5. Räumliche Tiefe & Material
Wir verlassen die 2D-Glasebene.

- **Multi-Layer Parallax**: Hintergrund (langsam), Mid-Layer (Cards), Foreground (HUD-Frames). Maus-Bewegung verschiebt die Layer minimal gegeneinander
- **Holographic Glass**: Cards haben einen subtilen Refraktions-Shimmer am Rand (CSS conic-gradient + animation)
- **Volumetric Glow**: cyan Glows haben einen 2-Stage Falloff statt eines simplen Box-Shadow
- **Chromatic Aberration**: bei schnellen State-Changes (z. B. „mode switch") kurz RGB-Split (0.5px) — sehr sparsam!
- **Depth-of-Field**: bei Modal/Command-Palette-Open: Hintergrund leicht out-of-focus blurred (`backdrop-filter: blur(12px)`)
- **Scan-Lines**: nur auf dem Orb-Container, nur 5% Opacity — keine 80er-Tron-Übertreibung

### 6. Lebendige Typografie
Buchstaben sind kein toter Text.

- **Type-On-Effect** für Live-Daten: neue Werte „landen" Zeichen-für-Zeichen mit minimal stagger (60ms)
- **Glitch-on-Update**: bei wichtigen State-Changes flackert der Wert kurz mit verschmierten Zeichen (0.15s, sehr dezent)
- **Variable-Font-Breathing**: bei `Inter`/`Orbitron` Variable Fonts — Weight pulst minimal (450 → 470) auf aktiven Labels
- **Live-Cursor** in Eingabe-Feldern: kein Browser-Default, sondern ein cyan glühender Caret mit Trail
- **Semantic-Color**: Zahlen die sich verändern bekommen automatisch grün (gestiegen) / amber (gefallen) für 1.5s

### 7. Persönlichkeit & Micro-Copy
JARVIS ist ein **Charakter**, nicht ein Eingabefeld.

- **Status-Texte mit Persönlichkeit**:
  - statt "Loading..." → "Stelle Verbindung her", "Hole letzten Stand", "Synchronisiere mit SAP"
  - statt "Listening" → "Ich höre."
  - statt "Thinking" → "Denke nach...", "Verknüpfe Wissensbasen", "Prüfe VDE-Norm"
  - statt "Error" → "Etwas ist quergegangen — sehe es mir an"
- **Greeting-Variation**: Tageszeit-abhängig + zufällig variiert (8-10 Varianten)
- **Idle-Whispers**: alle 5–10 Min eine sehr dezente Notification mit Status-Insight ("KB enthält 3 ungelesene VDE-Updates")
- **Inside-Jokes**: subtile Easter-Eggs (z. B. `/help` zeigt einen Hinweis auf einen versteckten Dev-Mode)
- **First-Person, freundlich, präzise**: nie korporate Sprache, aber auch nicht überfreundlich

### 8. Time-of-Day Awareness
Die UI weiß welche Tageszeit es ist und passt sich an.

- **Morning** (6–11): Cyan etwas wärmer (+8% Saturation), Energy hoch
- **Day** (11–17): Standard-Palette
- **Evening** (17–22): Cyan etwas kühler, dezentere Glows, weniger Particles
- **Night** (22–6): Maximal dezent, "Shadow-Mode" — sehr dunkler Hintergrund, minimaler Kontrast wo nicht nötig
- **Optional**: Greeting variieren (Guten Morgen / Tag / Abend / Nacht)

### 9. Spatial Audio Cues (optional, nach Voice-Modul)
- Sound-Events kommen positionsbezogen aus der UI (left/right/center) basierend auf wo das Event visuell passiert

---

## Die DON'T-Liste — was wir NIEMALS tun

- ❌ **Tron 1982**: keine grünen Wireframe-Schriften, keine vector-net-Hintergründe
- ❌ **Generic Metaverse**: keine bunten Neon-Verläufe, kein Vaporwave
- ❌ **Cyberpunk 2077 Glitch-Overload**: Glitches sparsam, kontextuell, nie Selbstzweck
- ❌ **Apple-Sterilität**: nicht zu cleansauber — JARVIS hat Charakter, nicht Marketing-Gloss
- ❌ **Web 3.0 Holo-Cards**: keine bunten Holo-Glow-Borders auf jedem Element
- ❌ **AI-Slop-Aesthetic**: keine generischen "AI"-Icons, keine ChatGPT-Bubble-Layouts, kein "Sparkle"-Spam ✨
- ❌ **Loading-Spinner**: nie ein generischer Spinner — immer kontextuelles Skeleton oder Scanning-Beam
- ❌ **Modal-Dialogs**: alles inline oder als Sheet, niemals zentriertes Modal
- ❌ **Fakes**: nie Mock-Daten in der Live-UI ohne dass es klar gekennzeichnet ist
- ❌ **Performance-Killer**: Background-Animationen niemals über 60 FPS Budget; alle Effekte respektieren `prefers-reduced-motion`

---

## Inspirations-Anker (zum Recherchieren)

| Werk | Was wir mitnehmen |
|---|---|
| **Iron Man** (Filme) — JARVIS HUDs | Räumliche Tiefe, Glow, Confidence-Geste — aber **ohne** Gesten-UI |
| **Halo 4** — Cortana Scenes | Lebendigkeit eines Charakters, Voice-Visualization |
| **Persona 5** — Menu-Motion | Lebendige Typografie, Layer-Depth |
| **Apple Vision Pro** — visionOS | Glas-Material, Tiefe, Spatial UI |
| **NASA Mission Control** — Apollo + heute | Telemetrie-Densität, Audit-Feed-Stil |
| **Bloomberg Terminal** | Information-Dichte ohne UI-Clutter |
| **Death Stranding** UI (Kojima) | Atmosphärische Subtilität, organische Animationen |
| **Generative Coding-Demos** auf shadertoy.com | WebGL-Hintergründe, particle systems |

---

## Technischer Anker

### Stack-Notes
- **React 18 + TypeScript + Vite** (vorhanden)
- **Three.js** ist schon im Projekt (`Orb.tsx`) → für 3D-Hintergrund nutzen
- **WebGL-Shader** für ambient backgrounds (`<canvas>` + custom GLSL)
- **CSS Custom Properties** sind die Source of Truth (siehe `frontend/src/styles/tokens.css`)
- **Framer Motion** könnte ergänzt werden für orchestrated animations (zu evaluieren)
- **Wenig neue Dependencies**: alles was geht, vanilla CSS + native APIs

### Performance-Budget
- **60 FPS** auf einem mid-range Notebook (kein Gaming-Rig)
- **First Paint < 1s** auf nicht-cached load
- **Ambient-Hintergrund** darf bei Idle nicht mehr als 5% CPU ziehen
- **`prefers-reduced-motion`** schaltet alle Mikro-Animationen ab, lässt Layout aber identisch
- **Bundle-Size**: jede neue Dependency muss < 30 KB gzipped sein

### Accessibility-Mindeste
- Kontrast WCAG AA auf allen Text-Bereichen
- Keyboard-First: alles per Tab erreichbar, sichtbarer Focus-Ring
- `aria-live="polite"` für Status-Updates und Toasts
- Sound-Cues haben immer einen visuellen Begleiter

---

## Tracks — geordnete Roadmap

> Reihenfolge ist von **risikoarm + sichtbar** zu **invasiv + lebendig**. Jeder Track ist ein eigener PR.

### 🟢 LU-1 · Heartbeat-System (Foundation, ~3h)
- Globaler Pulse-Hook in React (`useHeartbeat()`)
- Alle existierenden Pulse-Dots, Glows, Audit-Indicators synchronisieren auf den Heartbeat
- Frequenz adaptierbar: idle (60 BPM), thinking (90 BPM), error (120 BPM, einmalig 3 Beats)
- **Akzeptanz**: Heartbeat sichtbar überall, kein UI-Element schlägt out-of-sync

### 🟢 LU-2 · Living Background (~4h)
- Neuer `<AmbientField>` Component mit WebGL-Canvas
- Particle-System: 80–120 Punkte, 3D-Drift, parallax-zur-Maus
- Reaktiv: bei `thinking` State verdichten sich Particles um den Orb
- **Akzeptanz**: Hintergrund lebt subtil, < 5% CPU idle, respekt `prefers-reduced-motion`

### 🟢 LU-3 · Cursor-System (~2h)
- Magnetic-Cursor auf Buttons + Cards (Pure CSS via `:hover` transform)
- Cursor-Glow-Trail (kleines `<div>`, follows mouse mit `lerp`)
- **Akzeptanz**: feel'n it. Glow folgt natürlich, kein Lag, kein "haftet am Cursor"

### 🟡 LU-4 · Card-Tilt + Volumetric Glow (~3h)
- 3D-Perspective-Tilt auf Cards basierend auf Cursor-Position
- Volumetric Glows: 2-Stage Box-Shadow für allen `--j-cyan-glow`
- Holographic-Edge-Shimmer (CSS conic-gradient animation auf Card-Border)
- **Akzeptanz**: Tilt natürlich, max ±6°, snappt bei mouseleave smooth zurück

### 🟡 LU-5 · Type-On + Live-Cursor (~3h)
- Custom `<TypeOn>` Component für streaming Live-Daten
- Custom Caret in InputBar (cyan, glow, leichte Trail-Animation)
- Glitch-on-Update für Status-Werte (0.15s, sparsam)
- **Akzeptanz**: alle Live-Werte „landen" smooth, fühlt sich wie ein Mission-Console an

### 🟡 LU-6 · Persönlichkeit & Micro-Copy (~2h)
- Status-String-Pool mit Variation
- Tageszeit-abhängiges Greeting
- Loading-States bekommen kontextuelle Texte (basierend auf welchem Modul gerade läuft)
- **Akzeptanz**: kein „Loading..." mehr in der App, jede Wartezeit ist erklärt

### 🟠 LU-7 · Sound × Visual Coupling (~5h)
- TTS-Wellenform am Orb visualisieren
- State-Sound-Cues definieren (idle/listening/thinking/speaking)
- Ambient-Hum optional + on/off Toggle
- **Akzeptanz**: jeder Mode hat ein Sound-Profil, das User kann es jederzeit muten

### 🟠 LU-8 · Time-of-Day Adaptive Theme (~3h)
- 4 Sub-Palettes (morning/day/evening/night)
- Smooth interpolation alle 5min
- Greeting + Tone-Anpassung
- **Akzeptanz**: 24h Test zeigt klare Mode-Wechsel ohne Layout-Shift

### 🔴 LU-9 · Pre-Cog Module-Hints (~6h, advanced)
- Während User tippt: leichtes NLP (lokal, keyword-basiert) für wahrscheinlich-relevante Module
- Sidebar-Items zu diesen Modulen glimmen sanft auf
- **Akzeptanz**: Test-Strings „Erstelle SAP-Order" lässt SAP-Item glimmen, „VDE 0100" lässt VDE glimmen

### 🔴 LU-10 · Confidence-Beam + Energy-Meter (~5h)
- Beam-Effekt während LLM-Streaming, Geschwindigkeit ~ Throughput
- Energy-Meter als atmende Form (SVG-Path-Animation)
- **Akzeptanz**: erkennbar wenn JARVIS denkt, ohne dass es nervig ist

---

## Tabu-Liste (für jeden LU-Track verbindlich)

Niemals anfassen ohne separate Diskussion:

- `frontend/src/components/Orb.tsx` (Three.js, hand-getuned, Backend-gekoppelt)
- `frontend/src/App.tsx::sendMessage` und der SSE-Parser
- `frontend/src/sound-engine.ts`
- Voice / Speech Recognition Setup
- LocalStorage-Keys (Zoom, Theme, SafeMode)
- Backend-API-Shapes
- Three.js-Animation-Timings vom Orb

---

## Mess-Kriterien

Wir wissen, dass es funktioniert wenn:

- [ ] **First-Time-User** sagt nach 10 Sekunden nicht „cool app" sondern „**das fühlt sich anders an**"
- [ ] **Power-User** entdeckt nach 1 Woche noch Mikro-Details
- [ ] **Dev-Tools** zeigen 60 FPS in idle, 50+ FPS bei active streaming
- [ ] **Bundle-Size** ist < 1 MB gzipped (aktuell ~700 KB)
- [ ] **`prefers-reduced-motion`** schaltet alle Mikro-Animationen sauber aus
- [ ] **Lighthouse**: Performance > 85, Accessibility > 95
- [ ] **Manuelles Test**: alle 31 Pages atmen, keine Pages fühlt sich tot an
- [ ] **24h-Test**: UI ändert sich subtil über den Tag
- [ ] **Vergleichstest**: Screenshot der App heute vs. nach LU-1..LU-10 ist offensichtlich anders

---

## Wie diese Datei als Prompt nutzen

Wenn du eine neue Claude-Session startest und einen Track angehen willst:

```
Lies docs/FRONTEND_LIVING_UI_VISION.md und docs/FRONTEND_VISUAL_ROADMAP.md.
Implementiere LU-X gemäß Track-Beschreibung. Beachte die Tabu-Liste.
Liefere als ein PR mit Test-Plan, ohne andere Tracks zu vermischen.
```

Claude versteht dann ohne weiteren Kontext was zu tun ist.

---

## Aktualisieren

Diese Datei lebt mit. Wenn ein Track abgeschlossen ist:
- Status-Marker `🟢/🟡/🟠/🔴` bleibt als Aufwand-Indikator
- Track bekommt einen `✅ Done in #PR` Anhang
- Lessons Learned werden unten angefügt

---

## Lessons Learned (live-Sektion)

_Noch leer. Wird gefüllt nach LU-1._
