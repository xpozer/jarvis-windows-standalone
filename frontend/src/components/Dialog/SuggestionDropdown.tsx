import type { Suggestion } from "../../core/types";

type SuggestionDropdownProps = {
  suggestions: Suggestion[];
  activeIndex: number;
  onPick: (command: string) => void;
};

export function SuggestionDropdown({ suggestions, activeIndex, onPick }: SuggestionDropdownProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="suggestion-dropdown" role="listbox" aria-label="Slash command suggestions">
      {suggestions.map((item, index) => (
        <button
          key={item.command}
          type="button"
          className={index === activeIndex ? "is-active" : ""}
          onMouseDown={(event) => {
            event.preventDefault();
            onPick(item.command);
          }}
        >
          <span>{item.command}</span>
          <small>{item.description}</small>
        </button>
      ))}
    </div>
  );
}
