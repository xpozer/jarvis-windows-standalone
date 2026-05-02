// frontend/src/components/command/commandSources.test.ts
import { describe, expect, it, vi } from "vitest";

import { buildCommandPaletteItems } from "./commandSources";

describe("buildCommandPaletteItems", () => {
  it("builds command groups from all configured sources", () => {
    const items = buildCommandPaletteItems({
      pages: [
        {
          id: "start",
          title: "Start",
          path: "/stack/start",
          group: "main",
          description: "Kernstatus",
          onSelect: vi.fn(),
        },
      ],
    });

    const groups = new Set(items.map((item) => item.group));

    expect(groups).toContain("Pages");
    expect(groups).toContain("Tools");
    expect(groups).toContain("Quick Actions");
    expect(groups).toContain("Akten");
    expect(groups).toContain("Reminder");
    expect(groups).toContain("Mails");
    expect(groups).toContain("Settings");
    expect(groups).toContain("Themes");
  });

  it("keeps page actions selectable", () => {
    const onSelect = vi.fn();
    const items = buildCommandPaletteItems({
      pages: [
        {
          id: "diagnostics",
          title: "Diagnose",
          path: "/stack/diagnostics",
          group: "system",
          description: "Health Checks",
          onSelect,
        },
      ],
    });

    const pageItem = items.find((item) => item.id === "page-diagnostics");
    pageItem?.onSelect?.();

    expect(pageItem?.title).toBe("Diagnose");
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
