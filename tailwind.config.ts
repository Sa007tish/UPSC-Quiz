/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      colors: {
        paper: {
          DEFAULT: "#FFFBF3",
          dark: "#15171C",
        },
        ink: {
          DEFAULT: "#1F2430",
          dark: "#EDEEF2",
        },
        saffron: {
          50: "#FFF3E8",
          100: "#FFE3C7",
          200: "#FFC98E",
          300: "#FFAB55",
          400: "#FF8A2E",
          500: "#FF6B1A",
          600: "#E8540D",
          700: "#C2410C",
          800: "#9A3412",
          900: "#7C2D12",
        },
        teal: {
          50: "#E9FBF5",
          100: "#CCF5E6",
          200: "#94E6C7",
          300: "#5DD3AB",
          400: "#2EBE8F",
          500: "#0FA877",
          600: "#0B8C63",
          700: "#0A7053",
          800: "#0A5942",
          900: "#073D2D",
        },
        indigo: {
          50: "#EEF1FF",
          100: "#DCE2FF",
          200: "#B7C2FF",
          300: "#8C9CFF",
          400: "#6577F5",
          500: "#4856DE",
          600: "#3640B8",
          700: "#2B3293",
          800: "#252A73",
          900: "#1E2259",
        },
        coral: {
          50: "#FFEEEC",
          100: "#FFD7D1",
          200: "#FFB0A6",
          300: "#FF8576",
          400: "#F65F4B",
          500: "#E8412A",
          600: "#C5301B",
          700: "#9F2716",
          800: "#7E2014",
          900: "#5C1810",
        },
        amber: {
          50: "#FFF9E6",
          100: "#FFEFB8",
          200: "#FFE07A",
          300: "#FFCE3D",
          400: "#FFBB00",
          500: "#E6A500",
          600: "#B87F00",
          700: "#8A5F00",
        },
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        soft: "0 2px 10px -2px rgba(31, 36, 48, 0.08), 0 1px 2px rgba(31,36,48,0.06)",
        lift: "0 8px 24px -6px rgba(31, 36, 48, 0.16)",
      },
      keyframes: {
        "pop-in": {
          "0%": { transform: "scale(0.92)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(255,107,26,0.45)" },
          "100%": { boxShadow: "0 0 0 8px rgba(255,107,26,0)" },
        },
      },
      animation: {
        "pop-in": "pop-in 0.18s ease-out",
        "pulse-ring": "pulse-ring 1.2s ease-out infinite",
      },
    },
  },
  plugins: [],
};
