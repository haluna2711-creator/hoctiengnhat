import type { Metadata } from "next";
import { Shippori_Mincho, Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackgroundArt from "@/components/BackgroundArt";
import BackToTop from "@/components/BackToTop";

// Mincho Nhật Bản — dùng cho tiêu đề và mọi chỗ hiển thị kanji/hiragana
// to, mang đúng "cảm giác" chữ Nhật thay vì chữ Latin thông thường.
const display = Shippori_Mincho({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

// Cùng font nhưng khai báo riêng biến --font-jp để dùng rõ nghĩa ở
// những chỗ hiển thị nội dung tiếng Nhật (thẻ từ vựng, ô luyện tập).
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
