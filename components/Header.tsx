"use client";

import { useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

const NAV_LINKS = [
  { href: "/", label: "Trang chủ" },
  { href: "/tu-vung", label: "Sổ từ vựng" },
  { href: "/han-tu", label: "Tra cứu Hán tự" },
  { href: "/luyen-tap", label: "Luyện tập" },
  { href: "/danh-gia", label: "Đánh giá" },
  { href: "/nap-tu-vung", label: "Nạp từ vựng" },
];

// Mục nào trong NAV_LINKS chỉ hiện icon (không hiện chữ) trên thanh
// nav desktop, để đỡ chật chỗ — vẫn hiện đầy đủ chữ ở menu mobile.
const ICON_ONLY_HREFS = new Set(["/nap-tu-vung"]);

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-washi/90 backdrop-blur">
      <div className="bg-ai text-washi text-center text-[11px] tracking-[0.2em] py-1.5 uppercase">
        今日の一語、明日の力に — mỗi ngày một từ, tích luỹ mỗi ngày
      </div>
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-4">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="flex shrink-0 items-baseline gap-1.5 sm:gap-2"
        >
          <span className="font-jp text-2xl font-semibold text-beni sm:text-3xl">
            語
          </span>
          <span className="font-display text-xl font-semibold text-sumi sm:text-2xl">
            Học Từ Vựng Tiếng Nhật
          </span>
        </Link>

        {/* flex-1 + justify-between: các mục tự dàn trải đều trên toàn bộ
         * khoảng trống còn lại của header, thay vì gap cố định dễ bị vỡ
         * dòng khi menu có nhiều mục (VD: thêm "Tra cứu Hán tự"). */}
        <nav className="hidden flex-1 items-center justify-between whitespace-nowrap px-4 text-sm font-medium tracking-wide text-sumi-soft lg:flex xl:px-8">
          {NAV_LINKS.map((link) =>
            ICON_ONLY_HREFS.has(link.href) ? (
              <Link
                key={link.href}
                href={link.href}
                title={link.label}
                aria-label={link.label}
                className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-washi-deep hover:text-ai"
              >
                <UploadIcon />
              </Link>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="transition hover:text-ai"
              >
                {link.label}
              </Link>
            )
          )}
        </nav>

        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          <ThemeToggle />
          <Link
            href="/luyen-tap"
            className="whitespace-nowrap rounded-full bg-ai px-5 py-2.5 text-sm font-semibold text-washi shadow-card transition hover:bg-ai-deep"
          >
            Bắt đầu luyện tập
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Đóng menu" : "Mở menu"}
          className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-washi-deep text-sumi transition hover:bg-line lg:hidden"
        >
          {open ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </div>

      <div
        id="mobile-nav"
        className={`overflow-hidden border-t border-line/70 bg-washi transition-[max-height] duration-300 ease-in-out lg:hidden ${
          open ? "max-h-96" : "max-h-0"
        }`}
      >
        <nav className="flex flex-col gap-1 px-5 py-4 text-sm font-medium text-sumi-soft">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 transition hover:bg-washi-deep hover:text-ai"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 flex items-center justify-between gap-3 px-3">
            <span className="text-xs text-sumi-soft">Giao diện</span>
            <ThemeToggle />
          </div>
          <Link
            href="/luyen-tap"
            onClick={() => setOpen(false)}
            className="mt-2 rounded-full bg-ai px-4 py-2.5 text-center text-sm font-semibold text-washi shadow-card transition hover:bg-ai-deep"
          >
            Bắt đầu luyện tập
          </Link>
        </nav>
      </div>
    </header>
  );
}

/** Icon "tải lên" — thay cho chữ "Nạp từ vựng" trên nav desktop để đỡ
 * chật chỗ (mũi tên đi vào khay, ẩn dụ nạp dữ liệu mới vào kho). */
function UploadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 15V4" />
      <path d="M7.5 8.5 12 4l4.5 4.5" />
      <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}
