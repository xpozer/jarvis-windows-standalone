// frontend/src/components/dashboard/LogList.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";

import { LogList } from "./LogList";

const meta = {
  title: "Dashboard/LogList",
  component: LogList,
  tags: ["autodocs"],
  args: {
    items: [
      { id: "1", time: "08:15", source: "AuditLog", message: "Quick Capture gespeichert", status: "ok" },
      { id: "2", time: "08:17", source: "ToolRegistry", message: "High Risk Aktion wartet", status: "critical" },
      { id: "3", time: "08:21", source: "Agent", message: "ResearchAgent idle", status: "idle" },
    ],
  },
} satisfies Meta<typeof LogList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    items: [],
  },
};
