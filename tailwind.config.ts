import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "var(--void)",
        deep: "var(--deep)",
        nebula: "var(--nebula)",
        twilight: "var(--twilight)",
        sun: "var(--sun)",
        criacao: "var(--criacao)",
        midia: "var(--midia)",
        planejamento: "var(--planejamento)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        "orbit-line": "var(--orbit-line)",
        "orbit-hover": "var(--orbit-hover)",
      },
      fontFamily: {
        sans: [
          "Helvetica Neue",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        "2xl": "48px",
        "3xl": "64px",
      },
      borderRadius: {
        card: "12px",
        input: "8px",
        pill: "9999px",
      },
    },
  },
  plugins: [],
};

export default config;
