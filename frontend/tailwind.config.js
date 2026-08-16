/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#F2F4F8",
          100: "#E4E8F0",
          200: "#C3CCDE",
          300: "#93A2C0",
          400: "#5E729B",
          500: "#3D5079",
          600: "#2A3C60",
          700: "#1C2E4F",
          800: "#14213D",
          900: "#0F1929",
          950: "#0A1220",
        },
        brass: {
          50: "#FBF7EF",
          100: "#F3E9D8",
          200: "#E6D2AF",
          300: "#D6B682",
          400: "#C29F6B",
          500: "#B08D57",
          600: "#93733F",
          700: "#755A32",
          900: "#463620",
        },
        surface: {
          DEFAULT: "#F7F8FA",
          card: "#FFFFFF",
          sunken: "#F0F2F5",
        },
        status: {
          new: "#64748B",
          contacted: "#3B82F6",
          interested: "#8B5CF6",
          highly: "#B08D57",
          qualified: "#0D9488",
          converted: "#16A34A",
          notinterested: "#94A3B8",
          lost: "#DC2626",
        },
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        sans: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15, 25, 41, 0.04), 0 4px 12px rgba(15, 25, 41, 0.04)",
        card: "0 1px 3px rgba(15, 25, 41, 0.06), 0 8px 24px -8px rgba(15, 25, 41, 0.10)",
        pop: "0 12px 32px -8px rgba(15, 25, 41, 0.18)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: 0, transform: "translateY(4px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
        slideIn: { "0%": { transform: "translateX(12px)", opacity: 0 }, "100%": { transform: "translateX(0)", opacity: 1 } },
        pulseSoft: { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.55 } },
      },
      animation: {
        fadeIn: "fadeIn 0.25s ease-out",
        slideIn: "slideIn 0.2s ease-out",
        pulseSoft: "pulseSoft 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
