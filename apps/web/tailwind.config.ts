import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontSize: {
        hangul: ["4.5rem", { lineHeight: "1" }]
      }
    }
  },
  plugins: []
} satisfies Config;
