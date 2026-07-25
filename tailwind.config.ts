import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Nền chính — Seashell #FFF5EE, ấm và sáng như trong bảng màu tham khảo.
        washi: "#FFF5EE",
        "washi-deep": "#F6E3DA",
        // Chữ chính — nâu plum đậm, ấm hơn đen thuần để hợp tông hồng đất.
        sumi: "#3B2A2C",
        "sumi-soft": "#8C6B6B",
        // Rosy Brown #BC8F8F — màu nhấn chính (nút, link, tiêu đề, khối lớn).
        ai: "#BC8F8F",
        "ai-deep": "#93696A",
        "ai-soft": "#D8B7B7",
        // Đỏ hồng đất — dùng tiết chế: đúng/nhấn mạnh/dấu mốc.
        beni: "#A9575A",
        "beni-deep": "#833F42",
        // Vàng ấm — nhãn cấp độ JLPT.
        kin: "#B08A5B",
        line: "#E7D0C8",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        jp: ["var(--font-jp)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      backgroundImage: {
        "hero-grid":
          "linear-gradient(135deg, #FFF5EE 0%, #F9E4DC 60%, #F6E3DA 100%)",
      },
      boxShadow: {
        soft: "0 10px 30px -12px rgba(59, 42, 44, 0.18)",
        card: "0 6px 18px -8px rgba(59, 42, 44, 0.16)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
export default config;
