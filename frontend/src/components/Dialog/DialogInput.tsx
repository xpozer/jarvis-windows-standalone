import { KeyboardEvent, RefObject, useMemo, useState } from "react";
import { CommandBus } from "../../core/CommandBus";
import { useUiStore } from "../../state/uiStore";
import { SuggestionDropdown } from "./SuggestionDropdown";
import { CommandHistory } from "./CommandHistory";

type DialogInputProps = {
  bus: CommandBus;
  inputRef: RefObject<HTMLInputElement>;
};

export function DialogInput({ bus, inputRef }: DialogInputProps) {
  const history = useUiStore((state) => state.history);
  const pushHistory = useUiStore((state) => state.pushHistory);
  const clearHistory = useUiStore((state) => state.clearHistory);
  const setInputFocused = useUiStore((state) => state.setInputFocused);
  const [value, setValue] = useState("");
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const suggestions = useMemo(() => bus.getSuggestions(value), [bus, value]);

  async function submit(input: string) {
    const clean = input.trim();
    if (!clean) return;

    if (clean === "/clear") {
      const result = await bus.execute(clean, "text");
      clearHistory();
      pushHistory({ input: clean, result, timestamp: Date.now() });
      setValue("");
      setHistoryIndex(-1);
      return;
    }

    const result = await bus.execute(clean, "text");
    pushHistory({ input: clean, result, timestamp: Date.now() });
    setValue("");
    setHistoryIndex(-1);
  }

  function pickSuggestion(command: string) {
    setValue(`${command} `);
    setActiveSuggestion(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      inputRef.current?.blur();
      setInputFocused(false);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (suggestions.length > 0) {
        setActiveSuggestion((index) => (index + 1) % suggestions.length);
        return;
      }
      if (history.length > 0) {
        const next = Math.max(-1, historyIndex - 1);
        setHistoryIndex(next);
        setValue(next >= 0 ? history[next].input : "");
      }
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (suggestions.length > 0) {
        setActiveSuggestion((index) => (index - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (history.length > 0) {
        const next = Math.min(history.length - 1, historyIndex + 1);
        setHistoryIndex(next);
        setValue(history[next].input);
      }
      return;
    }

    if (event.key === "Tab" && suggestions.length > 0) {
      event.preventDefault();
      pickSuggestion(suggestions[activeSuggestion].command);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (suggestions.length > 0 && value.trim() === "/") {
        pickSuggestion(suggestions[activeSuggestion].command);
        return;
      }
      void submit(value);
    }
  }

  return (
    <div className="dialog-cluster">
      <CommandHistory history={history} />
      <div className="dialog-slot__input-wrap">
        <SuggestionDropdown suggestions={suggestions} activeIndex={activeSuggestion} onPick={pickSuggestion} />
        <input
          ref={inputRef}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setActiveSuggestion(0);
          }}
          onKeyDown={onKeyDown}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          placeholder="Befehl oder Frage"
          spellCheck={false}
          autoComplete="off"
          aria-label="JARVIS command input"
        />
      </div>
    </div>
  );
}
