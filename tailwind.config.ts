import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        clubhaus: {
          dark: "#0a0e1a",
          blue: {
            950: "#0c1222",
            900: "#0f1629",
            800: "#141d33",
            700: "#1a2540",
          },
        },
      },
    },
  },
  plugins: [],
};
export default config;
