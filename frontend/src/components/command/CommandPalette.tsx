// frontend/src/components/command/CommandPalette.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";

import { HotkeyBadge } from "@/components/dashboard/HotkeyBadge";
import { cn } from "@/lib/utils";

export type CommandPaletteItem = {
  id: string;
  title: string;
  subtitle?: string;
  group: string;
  hint?: string;
  keywords?: string[];
  onSelect?: () => void;
};

type CommandPaletteProps = {
  open: boolean;
  items: CommandPaletteItem[];
  onOpenChange: (open: boolean) => void;
};

export function CommandPalette({ open, items, onOpenChange }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => searchItems(items, query).slice(0, 48), [items, query]);
  const groupedResults = useMemo(() => groupItems(results), [results]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onOpenChange(false);
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((index) => Math.min(index + 1, Math.max(results.length - 1, 0)));
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((index) => Math.max(index - 1, 0));
        return;
      }
      if (event.key === "Tab") {
        event.preventDefault();
        setActiveIndex(nextGroupIndex(results, activeIndex));
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        const item = results[activeIndex];
        if (item) {
          item.onSelect?.();
          if (!event.ctrlKey) onOpenChange(false);
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, onOpenChange, open, results]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9000] grid place-items-start bg-black/55 px-4 pt-[12vh] backdrop-blur-md" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onOpenChange(false)}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="JARVIS Command Palette"
        className="mx-auto w-full max-w-[640px] overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search size={18} className="text-muted-foreground" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            role="combobox"
            aria-expanded="true"
            aria-controls="jarvis-command-results"
            aria-activedescendant={results[activeIndex] ? `cmd-${results[activeIndex].id}` : undefined}
            placeholder="Befehl, Page, Tool oder Aktion suchen..."
            className="h-11 flex-1 bg-transparent font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md border border-border p-2 text-muted-foreground hover:text-foreground"
            aria-label="Command Palette schliessen"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div id="jarvis-command-results" role="listbox" className="max-h-[420px] overflow-y-auto p-2">
          {results.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Keine Treffer.</div>
          ) : (
            groupedResults.map(([group, groupItems]) => (
              <section key={group} className="py-1" aria-label={group}>
                <h3 className="px-3 py-2 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">{group}</h3>
                <div className="grid gap-1">
                  {groupItems.map((item) => {
                    const absoluteIndex = results.findIndex((result) => result.id === item.id);
                    const active = absoluteIndex === activeIndex;
                    return (
                      <button
                        id={`cmd-${item.id}`}
                        key={item.id}
                        type="button"
                        role="option"
                        aria-selected={active}
                        onMouseEnter={() => setActiveIndex(absoluteIndex)}
                        onClick={() => {
                          item.onSelect?.();
                          onOpenChange(false);
                        }}
                        className={cn(
                          "grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-md px-3 py-2 text-left",
                          active ? "bg-primary/12 text-foreground outline outline-1 outline-primary/40" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                        )}
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-mono text-sm">{item.title}</span>
                          {item.subtitle ? <span className="mt-0.5 block truncate text-xs text-muted-foreground">{item.subtitle}</span> : null}
                        </span>
                        {item.hint ? <span className="self-center font-mono text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">{item.hint}</span> : null}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-3">
            <HotkeyBadge label="Wählen" keys={["Enter"]} />
            <HotkeyBadge label="Offen halten" keys={["Ctrl", "Enter"]} />
            <HotkeyBadge label="Gruppe" keys={["Tab"]} />
          </div>
          <HotkeyBadge label="Schliessen" keys={["Esc"]} />
        </footer>
      </div>
    </div>
  );
}

function searchItems(items: CommandPaletteItem[], query: string) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return items;

  return items
    .map((item) => ({ item, score: scoreItem(item, normalizedQuery) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item);
}

function scoreItem(item: CommandPaletteItem, query: string) {
  const haystack = normalize([item.title, item.subtitle, item.group, ...(item.keywords ?? [])].filter(Boolean).join(" "));
  if (haystack.includes(query)) return 100 - haystack.indexOf(query);
  const chars = [...query];
  let cursor = 0;
  let score = 0;
  for (const char of chars) {
    const found = haystack.indexOf(char, cursor);
    if (found === -1) return 0;
    score += Math.max(1, 20 - (found - cursor));
    cursor = found + 1;
  }
  return score;
}

function normalize(value: string) {
  return value.toLowerCase().trim();
}

function groupItems(items: CommandPaletteItem[]) {
  const groups = new Map<string, CommandPaletteItem[]>();
  for (const item of items) {
    const group = groups.get(item.group) ?? [];
    group.push(item);
    groups.set(item.group, group);
  }
  return [...groups.entries()];
}

function nextGroupIndex(items: CommandPaletteItem[], activeIndex: number) {
  const activeGroup = items[activeIndex]?.group;
  const nextIndex = items.findIndex((item, index) => index > activeIndex && item.group !== activeGroup);
  return nextIndex === -1 ? 0 : nextIndex;
}
