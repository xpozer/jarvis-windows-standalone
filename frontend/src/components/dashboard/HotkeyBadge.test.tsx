// frontend/src/components/dashboard/HotkeyBadge.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HotkeyBadge } from "./HotkeyBadge";

describe("HotkeyBadge", () => {
  it("renders label and keys", () => {
    render(<HotkeyBadge label="Open" keys={["Ctrl", "K"]} />);

    expect(screen.getByText("Open")).toBeInTheDocument();
    expect(screen.getByText("Ctrl")).toBeInTheDocument();
    expect(screen.getByText("K")).toBeInTheDocument();
    expect(screen.getByLabelText("Ctrl plus K")).toBeInTheDocument();
  });
});
