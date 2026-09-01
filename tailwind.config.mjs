/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary — deep forest green
        forest: {
          50:  "#EEF4EE",
          100: "#D5E8D5",
          200: "#A8CFA8",
          300: "#78B178",
          400: "#4E934E",
          500: "#2E6B2E",
          600: "#1E5020",
          700: "#163A18",
          800: "#0E2710",
          900: "#071408",
        },
        // Accent — warm brass/copper
        brass: {
          50:  "#FDF8EC",
          100: "#F8EDD0",
          200: "#F0D89A",
          300: "#E5BE5E",
          400: "#D4A228",
          500: "#B8861A",
          600: "#956A12",
          700: "#70500D",
          800: "#4E3709",
          900: "#2E2005",
        },
        // Neutral — warm stone
        stone: {
          50:  "#FAF9F7",
          100: "#F3F1EC",
          200: "#E8E4DC",
          300: "#D8D2C6",
          400: "#C0B8A8",
          500: "#9E9588",
          600: "#7A7068",
          700: "#5A5248",
          800: "#3C3630",
          900: "#201C18",
        },
      },
      fontFamily: {
        display: ["'Cormorant Garamond'", "Georgia", "serif"],
        body:    ["'Instrument Sans'", "system-ui", "sans-serif"],
        mono:    ["'JetBrains Mono'", "monospace"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        "card":  "0 1px 3px rgba(30,24,18,0.06), 0 4px 16px rgba(30,24,18,0.04)",
        "card-hover": "0 4px 12px rgba(30,24,18,0.10), 0 12px 40px rgba(30,24,18,0.08)",
        "input": "0 0 0 3px rgba(46,107,46,0.12)",
      },
      animation: {
        "fade-up": "fadeUp 0.4s ease both",
        "fade-in": "fadeIn 0.25s ease both",
        "slide-in": "slideIn 0.3s ease both",
        "pulse-dot": "pulseDot 2s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%":   { opacity: "0", transform: "translateX(-8px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%":      { opacity: "0.5", transform: "scale(0.8)" },
        },
      },
    },
  },
  plugins: [],
};
