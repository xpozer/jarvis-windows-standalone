// frontend/.storybook/preview.ts
import type { Preview } from "@storybook/react";
import "../src/styles/tokens.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "jarvis",
      values: [
        { name: "jarvis", value: "#020817" },
        { name: "wireframe", value: "#050505" },
      ],
    },
  },
};

export default preview;
