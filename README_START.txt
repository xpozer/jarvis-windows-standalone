JARVIS WINDOWS STANDALONE v8 FEATURE BASE

Start:
1. FIRST_SETUP.bat einmal ausfuehren
2. Danach START_JARVIS.bat nutzen
3. Browser: http://127.0.0.1:8000/?diag=1

Neu in v8:
- Paket 1: Notizen, Aufgaben, Erinnerungen, lokaler Speicher, Suche, Systemstatus, Backend Diagnose
- Paket 2: sichere Windows Tools, Programmstarter, Ordner oeffnen, Datei Suche
- Chat Befehle: "Notiz: ...", "Aufgabe: ...", "offene Aufgaben", "zeige Notizen", "Systemstatus", "oeffne Outlook", "oeffne Downloads", "suche Datei ..."

Sicherheit:
- Programme und Ordner laufen ueber Allowlist.
- Keine freien Shell Kommandos.
- Kein automatisches Loeschen, Verschieben oder Mail Senden.

Logs:
- logs/backend.log
- logs/start.log
- logs/npm-build.log


VERSION v9_FEATURE_COMPLETE
Neue Punkte:
- Arbeitsmodus mit SAP Texten, Mail, LNW, FSM Hinweis
- Kostenrechner und Steckdosen Prüfzeit Rechner
- Datei Import fuer Text/Log/CSV/Code Dateien
- strukturiertes Arbeitswissen lokal in data/work_memory.json
- VDE Textbausteine als kurze Arbeitsnotizen
- Self Check im Backend und als SELF_CHECK.bat
- Agent Status Endpoint
- rote Synapsen Denk Animation vorbereitet, aber noch nicht aktiv geschaltet

Start:
1. FIRST_SETUP.bat einmalig ausfuehren
2. START_JARVIS.bat normal starten
3. Bei Fehlern SELF_CHECK.bat ausfuehren und logs/self-check.log schicken


────────────────────────────────────────
v10 TECH CORE
────────────────────────────────────────
Neue Funktionen:
- Tool Registry ähnlich MCP, aber lokal und mit Allowlist
- sichere Windows Aktionen mit Bestätigung
- Websuche im Browser öffnen
- Dokumente und Logs analysieren
- offene Aktionen anzeigen und bestätigen
- Tech Core UI Seite

Chat Beispiele:
- zeig tools
- google suche VDE 0100-600
- analysiere letzte datei
- offene aktionen
- schreibe datei downloads/test.txt: Hallo aus JARVIS
- bestätige aktion <ID>

Hinweis:
Es wurde kein fremder GitHub Code übernommen. Die Funktionen sind eigene Implementierungen, inspiriert von Konzepten wie Computer Control, Dokumenten Agenten und Tool Registry.


────────────────────────────────────────
v11 WORK AGENT
────────────────────────────────────────
Neue Funktionen:
- Work Agent UI Seite
- Erweiterter SAP Angebotstext Generator
- Mail Textgenerator
- LNW Textgenerator
- FSM/CATS Hinweisgenerator
- VDE Angebots und Normhinweise
- Work Agent Logs
- Chat Kurzbefehle für Arbeitstexte

Chat Beispiele:
- work agent hilfe
- sap text: LED Umbau E41 mit Prüfung nach DIN VDE 0100-600
- mail text: Bitte FSM Stunden nicht anteilig in CATS buchen
- lnw text: Beleuchtung geprüft und instandgesetzt
- vde hinweis 0100-600
- fsm cats hinweis


────────────────────────────────────────
v12 AUTOMATION & DAILY OPS
────────────────────────────────────────
Neue Funktionen:
- Automation UI Seite
- lokale Wiedervorlagen
- fällige Wiedervorlagen anzeigen und erledigen
- Tagesstart Briefing
- Feierabend Bericht
- Ordnerüberwachung für freigegebene Ordner
- Folder Watch Scan
- bessere Datei Analyse
- DOCX Textextraktion ohne Zusatzpaket
- PDF Textextraktion über pypdf
- Chat Kurzbefehle für Tagesroutinen

Chat Beispiele:
- tagesstart
- feierabend
- wiedervorlage: Volker wegen LNW fragen | 2026-04-26T09:00
- wiedervorlagen
- ordner scan


────────────────────────────────────────
v13 UI COMMAND CENTER
────────────────────────────────────────
Neue Oberfläche:
- Command Center Layout
- dein bestehender Orb bleibt unverändert
- größere HUD Panels
- klare linke Navigation
- rechter Live Bereich für Status/Agenten
- Chat Dock unten
- Hover Vergrößerungen
- rote Denkimpulse im Thinking Zustand
- bessere Anordnung für Work Agent, Tech Core, Automationen und Dateien


────────────────────────────────────────
v14 UNIVERSAL INSTALLER
────────────────────────────────────────
Neue Installation:
- INSTALL_JARVIS.bat installiert JARVIS in einen sauberen lokalen Ordner
- Paket prüft zuerst Node.js, Python und Ollama
- fehlende Laufzeitkomponenten werden über winget geladen
- Backend läuft in eigener .venv im Installationsordner
- Frontend wird im Installationsordner frisch gebaut
- bestehende Installation wird nicht verwendet, sondern als Backup verschoben
- keine alten Projektpfade werden referenziert
- Desktop Verknüpfungen werden erstellt

Standardpfad:
%LOCALAPPDATA%\JARVIS_WINDOWS_STANDALONE

Start danach:
START_JARVIS.bat im Installationsordner oder Desktop Verknüpfung


────────────────────────────────────────
v15 BACKUP UPDATE SECURITY KNOWLEDGE
────────────────────────────────────────
Neue Funktionen:
- System Center UI Seite
- Backup erstellen und auflisten
- Restore Vorbereitung mit automatischem Pre Restore Backup
- Diagnose ZIP erstellen
- Rechtezentrale mit erlaubten Apps, Ordnern und bestätigungspflichtigen Aktionen
- Update Vorbereitung mit Pre Update Backup
- lokaler Wissensindex aus Dateien, Notizen und Arbeitswissen
- Local Knowledge UI Seite
- Dashboard UI Seite
- Voice Lab vorbereitet, standardmäßig deaktiviert
- UI Optionen vorbereitet
- zusätzliche BAT Dateien für Backup und Diagnose

Chat Beispiele:
- backup erstellen
- backups
- diagnose zip
- update vorbereiten
- wissen neu aufbauen
- wissen suche E41
- dashboard

Neue UI Seiten:
- Dashboard
- System Center
- Local Knowledge
- Voice Lab
- UI Optionen

Hinweis:
Voice ist nur vorbereitet und standardmäßig deaktiviert. Kein Mikrofon Zugriff ohne späteren bewussten Ausbau.


────────────────────────────────────────
v16 VOICE CORE
────────────────────────────────────────
Neue Funktionen:
- Voice Core UI Seite
- kostenlose Sprachausgabe über Browser/Windows TTS
- Stimme auswählen
- Tempo einstellen
- Pitch einstellen
- Lautstärke einstellen
- JARVIS Voice Presets
- Test Satz sprechen
- Auto Speak Einstellung vorbereitet
- Speaking Event für Orb/UI vorbereitet
- Piper Ordner vorbereitet
- Piper bleibt optional
- Mikrofon und Wake Word weiterhin deaktiviert

Chat Beispiele:
- voice core
- voice status
- piper vorbereiten
- voice preset jarvis_deep

Neue UI Seite:
- Voice Core

Sicherheit:
v16 spricht nur. Es hört nicht zu. Kein Mikrofon Zugriff, kein Wake Word.


────────────────────────────────────────
v17 VOICE INTERFACE CONTROL
────────────────────────────────────────
Neue Funktionen:
- Voice Interface UI Seite
- Mikrofon über Interface aktivierbar
- Mikrofon aus über Interface
- Push to Talk Button
- Wake Word vorbereitet und testbar
- sichtbarer Listening Status
- Browser SpeechRecognition Check
- erkannter Text als Transkript
- Transkript wird lokal im Runtime Status gespeichert
- Events für Orb Listening und Speaking vorbereitet
- Sicherheitsanzeige Mikrofon AN/AUS

Chat Beispiele:
- voice interface
- mikrofon status
- mikrofon an
- mikrofon aus

Sicherheit:
Mikrofon bleibt standardmäßig aus.
Aktivierung erfolgt bewusst über das Interface.
Browser/Windows fragt zusätzlich nach Mikrofonfreigabe.
Wake Word startet nicht dauerhaft automatisch, sondern nur bewusst im Testmodus.


────────────────────────────────────────
v17-FIXED CODE REVIEW PATCHES
────────────────────────────────────────
Fix 1: pyyaml in requirements.txt ergaenzt
  - skill_system.py konnte nicht laden (ImportError)
  - Fix: pyyaml>=6.0 in requirements.txt

Fix 2: Skills werden jetzt in Chat-Kontext injiziert
  - build_messages() ruft get_skill_manager().get_skill_context() auf
  - jarvis_skills/ Ordner ist jetzt aktiv nutzbar

Fix 3: Voice Interface -> Chat Verbindung hergestellt
  - App.tsx lauscht jetzt auf jarvis-transcript Events
  - Push-to-Talk Transkript wird direkt als Chat-Nachricht gesendet

Fix 4: bare except: pass durch Logging ersetzt
  - orchestrator.py Awareness + Skill-Fehler werden jetzt geloggt
  - file_agent.py Datei-Lesefehler werden jetzt angezeigt

Neu: tests/ Ordner mit pytest-Tests
  - test_classify.py, test_io.py, test_skills.py, test_routes.py
  - Einrichten: .venv\Scripts\python.exe -m pip install pytest httpx
  - Starten: .venv\Scripts\python.exe -m pytest tests/ -v --tb=short


────────────────────────────────────────
B3 AUDIT FIX
────────────────────────────────────────
Korrekturen nach Paket Audit:
- alte Projektbezeichnungen aus Paketbeschreibung entfernt
- Installer Prinzipien neutralisiert, keine alten Projektordner als Basis
- package.json entschlackt, keine Electron Downloads im Standard Setup
- Electron Build Konfiguration entfernt, da START_JARVIS aktuell Vite/Browser nutzt
- Diagnostic Agent erkennt weiterhin Legacy Pfade, ohne alte Projektbasis zu referenzieren
- Backend Syntax und Frontend Imports geprüft


────────────────────────────────────────
B4 REALIZED DEPTH
────────────────────────────────────────
Der Tiefen Prompt wurde nicht nur abgelegt, sondern funktional umgesetzt.

Neue echte Funktionen:
- Deep Control UI Seite
- Deep Check mit aktiven Systemprüfungen
- Repair Plan, der konkrete manuelle Fix Schritte erzeugt
- Agent Tool Matrix mit registrierten und fehlenden Tool Referenzen
- Context Pack ZIP für Fehlersuche und Weiterentwicklung
- lokale Antwortbasis aus dem Knowledge Index
- zusätzliche API Routen für Deep Control
- Audit Log Einträge für Deep Check, Repair Plan, Context Pack und Knowledge Answer

Neue API Routen:
- GET  /deep/status
- GET  /deep/repair-plan
- POST /deep/repair-plan
- GET  /deep/context-pack
- GET  /agents/matrix
- GET  /knowledge/answer?q=...

Neue Chat Befehle:
- deep check
- repair plan
- agent matrix
- lokale antwort <frage>
- wissen antwort <frage>

Neue UI Seite:
- Deep Control

Sicherheitslogik:
Repair Plan führt keine riskanten Reparaturen automatisch aus.
Er erstellt bewusst nur prüfbare Schritte.
Context Pack enthält nur ausgewählte Logs und Projekt Metadaten.


────────────────────────────────────────
SERVICE REFACTOR
────────────────────────────────────────
Die erste Modularisierung wurde weitergeführt:
- main.py bleibt App Initialisierung, Middleware, Startup, Static Files und Router Registrierung
- config.py und utils.py bleiben zentrale Basis
- routes/*.py nutzen APIRouter Dekoratoren statt router.add_api_route
- legacy_core.py ist nur noch ein leerer Kompatibilitäts Platzhalter
- Services liegen unter backend/services/
- die ehemalige Runtime Logik liegt in backend/services/_runtime.py
- alle Backend Python Dateien wurden syntaktisch geprüft
- main import test erfolgreich


────────────────────────────────────────
B5 PRODUCT UPDATE INSTALLER EXPORT
────────────────────────────────────────
Schwerpunkt dieser Version:
- Update System
- produktfähiger Installer
- Exportfunktionen

Neue Update Funktionen:
- GET  /update/manifest
- GET  /update/staged
- POST /update/stage-upload
- POST /update/plan
- GET  /update/rollback-candidates

Neue Export Funktionen:
- GET  /export/formats
- GET  /export/list
- POST /export/text
- GET  /export/data.zip
- GET  /export/{source}?format=json|csv|md

Export Quellen:
- audit
- work_logs
- files
- knowledge
- notes
- tasks
- reminders

Neue Installer Skripte:
- PRODUCT_INSTALLER.bat
- PRODUCT_INSTALLER.ps1
- UPDATE_JARVIS.bat
- REPAIR_JARVIS.bat
- UNINSTALL_JARVIS.bat
- EXPORT_JARVIS_DATA.bat

Installer Modi:
- Install
- Repair
- Update
- Uninstall

Wichtig:
Ein laufendes Backend überschreibt sich nicht selbst.
Updates werden gestaged und über UPDATE_JARVIS.bat beziehungsweise PRODUCT_INSTALLER.ps1 ausgeführt.
Das ist absichtlich sicherer als ein Auto Update aus dem laufenden Prozess heraus.


────────────────────────────────────────
B6 PRODUCTION INSTALLER
────────────────────────────────────────
Installer wurde produktionsreif gehärtet:
- INSTALL_JARVIS.bat ruft PowerShell mit ExecutionPolicy Bypass auf
- REPAIR.bat ruft PowerShell mit ExecutionPolicy Bypass auf
- Python 3.10+ wird hart verifiziert
- Microsoft Store Python Dummy wird ignoriert
- PATH wird registrybasiert neu geladen
- npm.cmd Suche unterstützt User Scope, APPDATA, Systempfade und Registry
- winget nutzt ohne Admin nach Möglichkeit --scope user
- Fehler erzeugen INSTALL_FAILED.log auf dem Desktop
- halb installierter Zielordner wird bei Fehler entfernt
- vorherige Installation wird bei Fehler wiederhergestellt
- Ollama Pull hat 10 Minuten Timeout und blockiert Installation nicht ewig
- strukturierte Fortschrittsanzeige mit Farben
- Selbstprüfung nach Installation
- echter Repair Modus mit gezielter Reparatur von venv, Frontend Build und Ollama Start

Neue/überarbeitete Dateien:
- INSTALL_JARVIS.ps1
- FIRST_SETUP.ps1
- START_JARVIS.ps1
- REPAIR.ps1
- INSTALL_JARVIS.bat
- FIRST_SETUP.bat
- START_JARVIS.bat
- REPAIR.bat


────────────────────────────────────────
B6.1 INSTALLER HOTFIX
────────────────────────────────────────
Fix:
- Invoke-Capture prüft jetzt auf NULL Argumente.
- FIRST_SETUP.ps1 bricht dadurch nicht mehr bei ProcessStartInfo.ArgumentList.Add() ab.
- Betroffen waren leere Argumentlisten bei Versionsprüfungen und Tool Checks.


────────────────────────────────────────
B6.2 INSTALLER HOTFIX
────────────────────────────────────────
Fix:
- ProcessStartInfo.ArgumentList wird nicht mehr benutzt.
- Stattdessen wird ProcessStartInfo.Arguments mit sauberem Quoting verwendet.
- Dadurch läuft FIRST_SETUP.ps1 auch auf älteren Windows PowerShell/.NET Varianten.


────────────────────────────────────────
B6.3 INSTALLER HOTFIX
────────────────────────────────────────
Fix:
- Get-PythonLauncher wird jetzt als Array gekapselt: @(Get-PythonLauncher)
- venv Erstellung nutzt $pyCmd statt $pyLauncher[0] direkt
- Dadurch wird bei einfachem "python" nicht mehr nur der erste Buchstabe "p" ausgeführt.


────────────────────────────────────────
B6.4 INSTALLER HOTFIX
────────────────────────────────────────
Fix:
- Invoke-Checked nutzt jetzt ProcessStartInfo statt PowerShell Pipe mit 2>&1.
- npm/pip STDERR Hinweise werden geloggt, aber nicht mehr als Fehler behandelt.
- Nur der echte ExitCode entscheidet über Abbruch.


────────────────────────────────────────
B6.5 INSTALLER HOTFIX
────────────────────────────────────────
Fix:
- Alte Invoke-Checked Pipe Variante wurde jetzt aus allen PS1 Dateien entfernt.
- FIRST_SETUP.ps1 behandelt npm/pip STDERR Hinweise nicht mehr als Abbruch.
- Nur der echte ExitCode entscheidet.
