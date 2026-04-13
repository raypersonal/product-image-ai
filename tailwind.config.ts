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
        // Background surfaces (Linear depth system)
        background: "#0F0F0F",       // L0 — app-level deepest
        primary: "#5E6AD2",          // Accent purple
        "primary-hover": "#6872E5",  // Accent hover
        secondary: "#161618",        // L1 — sidebars, panels
        "secondary-hover": "#1E1E21",// L2 on hover
        surface: "#1E1E21",          // L2 — cards, content area
        "surface-hover": "#252528",  // L3 — hover states
        overlay: "#2C2C30",          // L4 — dropdowns, tooltips
        elevated: "#363639",         // L5 — modals (sparingly)

        // Borders
        border: "rgba(255,255,255,0.08)",
        "border-strong": "rgba(255,255,255,0.14)",
        "border-subtle": "rgba(255,255,255,0.05)",

        // Text
        foreground: "#E8E8E8",       // Primary text
        muted: "#8A8A8A",            // Secondary text
        "text-tertiary": "#555558",  // Placeholders
        "text-disabled": "#3A3A3E",  // Disabled

        // Accent subtle
        "accent-subtle": "rgba(94,106,210,0.12)",
        "accent-text": "#818CF8",

        // Semantic
        error: "#EF4444",
        warning: "#F59E0B",
        success: "#4CAF50",
        info: "#3B82F6",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ['"JetBrains Mono"', '"Fira Code"', "monospace"],
      },
      fontSize: {
        "display": ["24px", { lineHeight: "1.3", fontWeight: "600", letterSpacing: "-0.02em" }],
        "heading-lg": ["18px", { lineHeight: "1.4", fontWeight: "500", letterSpacing: "-0.015em" }],
        "heading-md": ["15px", { lineHeight: "1.4", fontWeight: "500", letterSpacing: "-0.01em" }],
        "body": ["14px", { lineHeight: "1.6", fontWeight: "400", letterSpacing: "-0.005em" }],
        "body-sm": ["13px", { lineHeight: "1.5", fontWeight: "400" }],
        "label": ["12px", { lineHeight: "1.4", fontWeight: "500", letterSpacing: "0.01em" }],
        "caption": ["11px", { lineHeight: "1.4", fontWeight: "400", letterSpacing: "0.02em" }],
      },
      borderRadius: {
        control: "6px",   // Buttons, inputs
        card: "8px",      // Cards, panels
        modal: "12px",    // Modals, dialogs
        pill: "99px",     // Badges, tags
      },
      spacing: {
        "1": "4px",
        "2": "8px",
        "3": "12px",
        "4": "16px",
        "5": "20px",
        "6": "24px",
        "8": "32px",
        "12": "48px",
      },
      boxShadow: {
        "menu": "0 4px 20px rgba(0,0,0,0.5)",
        "modal": "0 8px 40px rgba(0,0,0,0.6)",
      },
      animation: {
        "shimmer": "shimmer 1.5s linear infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
