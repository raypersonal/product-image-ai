import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#111827",
        foreground: "#f3f4f6",
        primary: "#22c55e",
        "primary-hover": "#16a34a",
        secondary: "#1f2937",
        "secondary-hover": "#374151",
        border: "#374151",
        muted: "#9ca3af",
        error: "#ef4444",
        warning: "#f59e0b",
      },
    },
  },
  plugins: [],
};
export default config;
