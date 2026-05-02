// frontend/src/routes/StackRouterApp.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StackRouterApp } from "./StackRouterApp";

describe("StackRouterApp", () => {
  it("renders labelled navigation and main page", () => {
    render(<StackRouterApp />);

    expect(screen.getByRole("navigation", { name: "Stack Migration Pages" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start" })).toBeInTheDocument();
    expect(screen.getByText("Route:")).toBeInTheDocument();
  });
});
