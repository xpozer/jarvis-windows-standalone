import { useState, useEffect } from "react";

const STORAGE_KEY = "jarvis_todos";

interface Todo {
  id: number;
  text: string;
  done: boolean;
  created: number;
}

function load(): Todo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Rückwärtskompatibel: falls nur strings gespeichert waren
    if (Array.isArray(parsed) && typeof parsed[0] === "string") {
      return parsed.map((t: string, i: number) => ({ id: i, text: t, done: false, created: Date.now() }));
    }
    return parsed;
  } catch { return []; }
}

function save(todos: Todo[]) {
  // Auch als String-Array für useGreeting
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  // Greeting-kompatibles Format zusätzlich
  const open = todos.filter((t) => !t.done).map((t) => t.text);
  localStorage.setItem("jarvis_todos", JSON.stringify(open));
}

export function AufgabenPage() {
  const [todos, setTodos] = useState<Todo[]>(load);
  const [input, setInput] = useState("");

  useEffect(() => { save(todos); }, [todos]);

  function addTodo() {
    const text = input.trim();
    if (!text) return;
    setTodos((prev) => [...prev, { id: Date.now(), text, done: false, created: Date.now() }]);
    setInput("");
  }

  function toggleTodo(id: number) {
    setTodos((prev) => prev.map((t) => t.id === id ? { ...t, done: !t.done } : t));
  }

  function deleteTodo(id: number) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") addTodo();
  }

  const open = todos.filter((t) => !t.done);
  const done = todos.filter((t) => t.done);

  return (
    <div className="aufg-root">
      <div className="calc-title">AUFGABEN</div>

      <div className="aufg-input-row">
        <input className="sap-input aufg-input" value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey} placeholder="Neue Aufgabe eingeben..." autoFocus />
        <button className="termin-parse-btn" onClick={addTodo}>HINZUFÜGEN</button>
      </div>

      {open.length > 0 && (
        <div className="aufg-section">
          <div className="sap-label">OFFEN ({open.length})</div>
          {open.map((t) => (
            <div key={t.id} className="aufg-item">
              <button className="aufg-check" onClick={() => toggleTodo(t.id)}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="1" y="1" width="14" height="14" rx="3" />
                </svg>
              </button>
              <span className="aufg-text">{t.text}</span>
              <button className="sap-remove-btn" onClick={() => deleteTodo(t.id)}>✕</button>
            </div>
          ))}
        </div>
      )}

      {done.length > 0 && (
        <div className="aufg-section">
          <div className="sap-label">ERLEDIGT ({done.length})</div>
          {done.map((t) => (
            <div key={t.id} className="aufg-item done">
              <button className="aufg-check done" onClick={() => toggleTodo(t.id)}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="1" y="1" width="14" height="14" rx="3" />
                  <polyline points="4,8 7,11 12,5" />
                </svg>
              </button>
              <span className="aufg-text">{t.text}</span>
              <button className="sap-remove-btn" onClick={() => deleteTodo(t.id)}>✕</button>
            </div>
          ))}
          <button className="aufg-clear" onClick={() => setTodos((p) => p.filter((t) => !t.done))}>
            Erledigte löschen
          </button>
        </div>
      )}

      {todos.length === 0 && (
        <div className="jv-content-placeholder" style={{ flex: 1 }}>
          <div className="jv-placeholder-hint">Keine Aufgaben. Trag etwas ein.</div>
        </div>
      )}
    </div>
  );
}
