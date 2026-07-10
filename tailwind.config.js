/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        canvas: "var(--canvas)",
        surface: {
          DEFAULT: "var(--surface)",
          2: "var(--surface-2)",
        },
        line: {
          DEFAULT: "var(--border)",
          strong: "var(--border-strong)",
        },
        ink: {
          DEFAULT: "var(--text)",
          muted: "var(--text-muted)",
          subtle: "var(--text-subtle)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          soft: "var(--accent-soft)",
          fg: "var(--accent-fg)",
        },
        positive: { DEFAULT: "var(--positive)", soft: "var(--positive-soft)", line: "var(--positive-line)" },
        warning: { DEFAULT: "var(--warning)", soft: "var(--warning-soft)", line: "var(--warning-line)" },
        danger: { DEFAULT: "var(--danger)", soft: "var(--danger-soft)", line: "var(--danger-line)" },
        info: { DEFAULT: "var(--info)", soft: "var(--info-soft)", line: "var(--info-line)" },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        num: ["var(--font-num)"],
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
    },
  },
  plugins: [],
};
