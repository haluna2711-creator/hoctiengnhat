import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Giấy washi — nền chính, ấm và hơi xám hơn "cream" thông thường.
        washi: "#F2ECDD",
        "washi-deep": "#E7DDC5",
        // Mực sumi — chữ, gần đen nhưng ngả nâu ấm chứ không phải đen thuần.
        sumi: "#25221D",
        "sumi-soft": "#57503F",
        // Chàm Aizome — màu nhấn chính (nút, link, tiêu đề).
        ai: "#2B4C6E",
        "ai-deep": "#1C3348",
        "ai-soft": "#5F7C97",
        // Đỏ triện Hanko — dùng rất tiết chế: đúng/nhấn mạnh/dấu mốc.
        beni: "#A93B32",
        "beni-deep": "#832A23",
        // Kim — nhãn cấp độ JLPT.
        kin: "#A3823C",
        line: "#CBBE9E",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        jp: ["var(--font-jp)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      backgroundImage: {
        "hero-grid":
          "linear-gradient(135deg, #F2ECDD 0%, #EAE1CB 60%, #E7DDC5 100%)",
      },
      boxShadow: {
        soft: "0 10px 30px -12px rgba(37, 34, 29, 0.16)",
        card: "0 6px 18px -8px rgba(37, 34, 29, 0.14)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
export default config;
