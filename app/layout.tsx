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
const display = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

// Mincho Nhật Bản — CHỈ dùng cho nội dung tiếng Nhật thật sự (kanji,
// hiragana trong thẻ từ vựng / ô luyện tập), nơi không có dấu tiếng
// Việt nên không cần subset "vietnamese".
const jp = Shippori_Mincho({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${display.variable} ${jp.variable} ${body.variable}`}>
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
