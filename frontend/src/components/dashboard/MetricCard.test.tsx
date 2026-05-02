// frontend/src/components/dashboard/MetricCard.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MetricCard } from "./MetricCard";

describe("MetricCard", () => {
  it("renders label, value, unit and status", () => {
    render(<MetricCard label="Latency" value="42" unit="ms" status="ok" trend="last 5 calls" />);

    expect(screen.getByText("Latency")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("ms")).toBeInTheDocument();
    expect(screen.getByText("ok")).toBeInTheDocument();
    expect(screen.getByText("last 5 calls")).toBeInTheDocument();
  });
});
