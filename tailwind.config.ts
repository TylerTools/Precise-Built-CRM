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
        brand: {
          50: "#fdf8f6",
          100: "#f9ede7",
          200: "#f3d9ce",
          300: "#e8b99e",
          400: "#d4926a",
          500: "#c47a4f",
          600: "#b0643a",
          700: "#934f2e",
          800: "#7a4128",
          900: "#663724",
        },
      },
      fontFamily: {
        syne: ['"Syne"', "system-ui", "sans-serif"],
        mono: ['"DM Mono"', "ui-monospace", "monospace"],
        body: ['"Inter"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
