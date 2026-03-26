/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f2f4f8",
          100: "#e5e9f1",
          200: "#ccd3e3",
          300: "#99a7c7",
          400: "#667ba9",
          500: "#19325c",
          600: "#162d53",
          700: "#122544",
          800: "#0e1c34",
          900: "#0b1527",
        },
        accent: {
          50: "#f3f8f9",
          100: "#e7f1f3",
          200: "#d0e2e8",
          300: "#a1c5d1",
          400: "#71a9bb",
          500: "#24718a",
          600: "#20667c",
          700: "#1a5365",
          800: "#143f4d",
          900: "#10333e",
        },
        surface: {
          light: "#ffffff",
          dark: "#0f172a",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Outfit", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 24px rgba(0, 0, 0, 0.06)",
        "card-hover": "0 8px 40px rgba(0, 0, 0, 0.12)",
        glow: "0 0 40px rgba(25, 50, 92, 0.15)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        flip: "flip 0.6s ease-in-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        flip: {
          "0%": { transform: "rotateY(0deg)" },
          "100%": { transform: "rotateY(180deg)" },
        },
      },
    },
  },
  plugins: [],
};
