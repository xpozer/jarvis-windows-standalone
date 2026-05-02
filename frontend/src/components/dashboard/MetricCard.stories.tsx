// frontend/src/components/dashboard/MetricCard.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Activity } from "lucide-react";

import { MetricCard } from "./MetricCard";

const meta = {
  title: "Dashboard/MetricCard",
  component: MetricCard,
  tags: ["autodocs"],
  args: {
    label: "Latency",
    value: "42",
    unit: "ms",
    status: "ok",
    trend: "last 5 calls",
    icon: <Activity size={18} />,
  },
} satisfies Meta<typeof MetricCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Critical: Story = {
  args: {
    label: "Audit Risk",
    value: "03",
    unit: "open",
    status: "critical",
    trend: "requires confirmation",
  },
};
