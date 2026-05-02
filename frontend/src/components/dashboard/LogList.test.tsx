// frontend/src/components/dashboard/LogList.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LogList } from "./LogList";

describe("LogList", () => {
  it("renders log entries", () => {
    render(
      <LogList
        items={[
          { id: "1", time: "08:15", source: "AuditLog", message: "Quick Capture gespeichert", status: "ok" },
        ]}
      />,
    );

    expect(screen.getByText("08:15")).toBeInTheDocument();
    expect(screen.getByText("AuditLog")).toBeInTheDocument();
    expect(screen.getByText("Quick Capture gespeichert")).toBeInTheDocument();
  });

  it("renders empty state", () => {
    render(<LogList items={[]} emptyText="Keine Eintraege" />);

    expect(screen.getByText("Keine Eintraege")).toBeInTheDocument();
  });
});
