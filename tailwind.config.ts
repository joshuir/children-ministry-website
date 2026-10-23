import type { Config } from "tailwindcss";

// Design tokens: blue / black / white foundation with warm accents.
const config: Config = {
  // Hover styles only apply on devices that can actually hover (no sticky hover on phones).
  future: { hoverOnlyWhenSupported: true },
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: { DEFAULT: "1.25rem", md: "2rem" }, screens: { "2xl": "1240px" } },
    extend: {
      colors: {
        ink: { DEFAULT: "#0B1530", soft: "#2E3858", mute: "#4B5675" },
        brand: { 50: "#EEF4FF", 100: "#DCE7FF", 200: "#B9CEFF", 400: "#5B8CFF", 500: "#2563EB", 600: "#1D4FD8", 700: "#173EA8", 900: "#0E2463" },
        sun: { 100: "#FFF4D1", 300: "#FFD966", 400: "#FFC53D", 600: "#B7791F" },
        coral: { 100: "#FFE4DC", 400: "#FF7A59", 600: "#D9472A" },
        mint: { 100: "#E3F1FF", 400: "#4FA8FF", 600: "#1565C0" },
        lilac: { 100: "#E4E8F5", 400: "#1E3A8A" },
        paper: "#FBFAF7",
      },
      fontFamily: {
        display: ["var(--font-display)", '"Bricolage Grotesque Variable"', '"Bricolage Grotesque"', "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", '"Nunito Sans Variable"', '"Nunito Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: { "4xl": "2rem", "5xl": "2.5rem" },
      boxShadow: {
        card: "0 1px 2px rgba(11,21,48,.06), 0 8px 24px -12px rgba(11,21,48,.18)",
        lift: "0 2px 4px rgba(11,21,48,.06), 0 24px 48px -20px rgba(11,21,48,.28)",
        pop: "0 4px 0 0 #0B1530",
      },
      keyframes: {
        float: { "0%,100%": { transform: "translateY(0) rotate(0)" }, "50%": { transform: "translateY(-12px) rotate(4deg)" } },
      },
      animation: { float: "float 7s ease-in-out infinite" },
    },
  },
  plugins: [],
};
export default config;
