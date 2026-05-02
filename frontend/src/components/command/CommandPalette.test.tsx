// frontend/src/components/command/CommandPalette.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CommandPalette, type CommandPaletteItem } from "./CommandPalette";

const items: CommandPaletteItem[] = [
  { id: "start", title: "Start", group: "Pages", subtitle: "Kernstatus" },
  { id: "diagnostics", title: "Diagnose", group: "Pages", subtitle: "Health Checks" },
  { id: "reminder", title: "Neuer Reminder", group: "Quick Actions", subtitle: "Reminder vorbereiten" },
];

describe("CommandPalette", () => {
  it("renders grouped results and focuses search", () => {
    render(<CommandPalette open items={items} onOpenChange={vi.fn()} />);

    expect(screen.getByRole("dialog", { name: "JARVIS Command Palette" })).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveFocus();
    expect(screen.getByText("Pages")).toBeInTheDocument();
    expect(screen.getByText("Quick Actions")).toBeInTheDocument();
  });

  it("filters results while typing", async () => {
    const user = userEvent.setup();
    render(<CommandPalette open items={items} onOpenChange={vi.fn()} />);

    await user.type(screen.getByRole("combobox"), "diag");

    expect(screen.getByText("Diagnose")).toBeInTheDocument();
    expect(screen.queryByText("Neuer Reminder")).not.toBeInTheDocument();
  });

  it("closes on escape", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<CommandPalette open items={items} onOpenChange={onOpenChange} />);

    await user.keyboard("{Escape}");

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
