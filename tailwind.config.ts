import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Toàn bộ token màu bên dưới trỏ tới CSS variable khai báo ở
        // globals.css (:root cho light, .dark cho dark) thay vì hex cố
        // định — nhờ vậy đổi theme chỉ cần sửa 1 chỗ, và mọi cách dùng
        // có modifier độ mờ sẵn có trong code (VD: bg-ai/5, border-line/70)
        // vẫn hoạt động đúng vì Tailwind tự ghép rgb(var(...) / alpha).
        washi: "rgb(var(--color-washi) / <alpha-value>)",
        "washi-deep": "rgb(var(--color-washi-deep) / <alpha-value>)",
        sumi: "rgb(var(--color-sumi) / <alpha-value>)",
        "sumi-soft": "rgb(var(--color-sumi-soft) / <alpha-value>)",
        ai: "rgb(var(--color-ai) / <alpha-value>)",
        "ai-deep": "rgb(var(--color-ai-deep) / <alpha-value>)",
        "ai-soft": "rgb(var(--color-ai-soft) / <alpha-value>)",
        beni: "rgb(var(--color-beni) / <alpha-value>)",
        "beni-deep": "rgb(var(--color-beni-deep) / <alpha-value>)",
        midori: "rgb(var(--color-midori) / <alpha-value>)",
        "midori-deep": "rgb(var(--color-midori-deep) / <alpha-value>)",
        kin: "rgb(var(--color-kin) / <alpha-value>)",
        line: "rgb(var(--color-line) / <alpha-value>)",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        jp: ["var(--font-jp)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 30px -12px rgb(var(--color-sumi) / 0.18)",
        card: "0 6px 18px -8px rgb(var(--color-sumi) / 0.16)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
export default config;
