/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "surface-dim": "#e2ece9",
        "surface-bright": "#ffffff",
        "surface": "#eef6f5",
        "background": "#eef6f5",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#e4f0ed",
        "surface-container": "#d5e5e1",
        "surface-container-high": "#c4dad5",
        "surface-container-highest": "#9cb8b2",
        "primary": "#115e59",
        "primary-dark": "#0f524e",
        "primary-container": "#134e4a",
        "primary-fixed": "#ccfbf1",
        "primary-fixed-dim": "#99f6e4",
        "on-primary": "#ffffff",
        "on-primary-container": "#ffffff",
        "on-primary-fixed": "#115e59",
        "secondary": "#0d9488",
        "secondary-container": "#14b8a6",
        "secondary-fixed": "#e0f2fe",
        "on-secondary": "#ffffff",
        "accent-coral": "#f97316",
        "accent-coral-light": "#ffedd5",
        "tertiary": "#059669",
        "tertiary-container": "#10b981",
        "tertiary-fixed": "#d1fae5",
        "on-tertiary": "#ffffff",
        "on-surface": "#0f172a",
        "on-surface-variant": "#475569",
        "outline": "#94a3b8",
        "outline-variant": "#cbd5e1",
        "error": "#dc2626",
        "error-container": "#fee2e2",
        "on-error": "#ffffff",
        "on-error-container": "#991b1b",
        "inverse-surface": "#1e293b",
        "inverse-on-surface": "#f8fafc",
        "inverse-primary": "#2dd4bf"
      },
      borderRadius: {
        DEFAULT: "0.375rem",
        lg: "0.5rem",
        xl: "0.75rem",
        '2xl': "1rem",
        '3xl': "1.5rem",
        full: "9999px"
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "sans-serif"],
        body: ["Plus Jakarta Sans", "sans-serif"],
        heading: ["Plus Jakarta Sans", "sans-serif"]
      }
    }
  },
  plugins: []
};
