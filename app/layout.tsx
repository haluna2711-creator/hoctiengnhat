import type { Metadata } from "next";
import { Shippori_Mincho, Playfair_Display, Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackgroundArt from "@/components/BackgroundArt";
import BackToTop from "@/components/BackToTop";

// Font tiêu đề — dùng cho mọi heading tiếng Việt trên trang. PHẢI có
// subset "vietnamese" (Shippori Mincho trước đây chỉ có "latin" nên
// dấu tiếng Việt bị vỡ/thiếu). Playfair Display có bảng chữ Việt đầy
// đủ và vẫn giữ được cảm giác serif thanh lịch hợp với bảng màu mới.
// Chỉ tải 500 (mặc định cho heading, do không có class font-weight
// nào được gán riêng nên trình duyệt tự khớp về weight gần nhất) và
// 600 (dùng cho tên thương hiệu ở Header) — 700 chưa từng được dùng.
const display = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600"],
  variable: "--font-display",
});

// Mincho Nhật Bản — CHỈ dùng cho nội dung tiếng Nhật thật sự (kanji,
// hiragana trong thẻ từ vựng / ô luyện tập), nơi không có dấu tiếng
// Việt nên không cần subset "vietnamese".
// Chỉ tải 400 (mặc định, dùng ở hầu hết mọi nơi) và 600 (tên thương
// hiệu ở Header/Footer) — 500 và 700 chưa từng được dùng trong code.
const jp = Shippori_Mincho({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-jp",
});

const body = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Học Từ Vựng Tiếng Nhật — Luyện từ theo nhiều cách",
  description:
    "Nạp từ vựng nhanh, luyện tập bằng trắc nghiệm, nhập hiragana và viết kanji hai chiều — theo từng cấp độ JLPT.",
};

// Chạy TRƯỚC khi React hydrate để tránh nháy màu (FOUC): đọc lựa chọn
// theme đã lưu (localStorage) hoặc theo cấu hình hệ thống nếu người
// dùng chưa từng chọn, rồi gắn class "dark" lên <html> ngay lập tức.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var isDark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (isDark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      className={`${display.variable} ${jp.variable} ${body.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="font-body min-h-screen flex flex-col antialiased overflow-x-hidden">
        <BackgroundArt />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <BackToTop />
      </body>
    </html>
  );
}
