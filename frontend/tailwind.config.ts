import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        jarvis: {
          cyan: "#00d4ff",
          black: "#000000",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
