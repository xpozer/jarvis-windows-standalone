// frontend/src/routes/pageRegistry.test.ts
import { describe, expect, it } from "vitest";

import { dashboardPages, findDashboardPage } from "./pageRegistry";

describe("dashboardPages", () => {
  it("contains 13 page slots", () => {
    expect(dashboardPages).toHaveLength(13);
  });

  it("uses unique ids and paths", () => {
    const ids = new Set(dashboardPages.map((page) => page.id));
    const paths = new Set(dashboardPages.map((page) => page.path));

    expect(ids.size).toBe(dashboardPages.length);
    expect(paths.size).toBe(dashboardPages.length);
  });

  it("finds a page by path", () => {
    expect(findDashboardPage("/stack/diagnostics").id).toBe("diagnostics");
  });

  it("falls back to start page for unknown paths", () => {
    expect(findDashboardPage("/unknown").id).toBe("start");
  });
});
