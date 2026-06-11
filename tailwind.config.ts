import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Devhalla palette — torchlit dusk
        realm: {
          bg: "#0b0e14",
          panel: "#141a26",
          panelHi: "#1d2535",
          edge: "#2a3550",
          gold: "#e8c66a",
          goldDim: "#a8894a",
          ember: "#ff7a3c",
          rune: "#6ad0ff",
          text: "#e6ebf5",
          muted: "#8b97b0",
        },
      },
      fontFamily: {
        display: ['"Cinzel"', "ui-serif", "Georgia", "serif"],
        body: ['"Inter"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        glow: "0 0 24px -4px var(--tw-shadow-color)",
        panel: "0 10px 40px -12px rgba(0,0,0,0.6)",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "0.55", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.06)" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-fast": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "blink": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
      },
      animation: {
        "pulse-glow": "pulse-glow 2.4s ease-in-out infinite",
        "fade-in": "fade-in 0.35s ease-out both",
        "fade-in-fast": "fade-in-fast 0.2s ease-out both",
        "blink": "blink 1s step-end infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
