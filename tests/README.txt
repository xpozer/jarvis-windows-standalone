JARVIS Tests
============

Einmalig einrichten (in der venv):
  .venv\Scripts\python.exe -m pip install pytest httpx

Alle Tests ausfuehren:
  .venv\Scripts\python.exe -m pytest tests/ -v --tb=short

Nur Backend:
  .venv\Scripts\python.exe -m pytest tests/backend/ -v

Einzelner Test:
  .venv\Scripts\python.exe -m pytest tests/backend/test_classify.py -v

Was getestet wird:
  test_classify.py  - Agent-Routing fuer SAP, VDE, Email, Exam, Calendar, Fallback
  test_io.py        - read_json / write_json atomares Schreiben
  test_skills.py    - Skill-Parsing, Matching, Kontext-Injektion
  test_routes.py    - API-Endpunkte (Notes, Tasks, Skills, Voice) ohne Ollama

Kein Ollama noetig fuer die Tests.
Alle Tests laufen offline gegen den FastAPI TestClient.
