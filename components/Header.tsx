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
  { href: "/nap-tu-vung", label: "Nạp dữ liệu" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-washi/90 backdrop-blur">
      <div className="bg-ai text-washi text-center text-[11px] tracking-[0.2em] py-1.5 uppercase">
        今日の一語、明日の力に — mỗi ngày một từ, tích luỹ mỗi ngày
      </div>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="flex items-baseline gap-1.5 sm:gap-2"
        >
          <span className="font-jp text-2xl font-semibold text-beni sm:text-3xl">
            語
          </span>
          <span className="font-display text-xl font-semibold text-sumi sm:text-2xl">
            Học Từ Vựng Tiếng Nhật
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium tracking-wide text-sumi-soft md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition hover:text-ai"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-3 md:flex">
          <ThemeToggle />
          <Link
            href="/luyen-tap"
            className="rounded-full bg-ai px-5 py-2.5 text-sm font-semibold text-washi shadow-card transition hover:bg-ai-deep"
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
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-washi-deep text-sumi transition hover:bg-line md:hidden"
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
        className={`overflow-hidden border-t border-line/70 bg-washi transition-[max-height] duration-300 ease-in-out md:hidden ${
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
