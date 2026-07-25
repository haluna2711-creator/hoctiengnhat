"use client";
import { useCallback, useEffect, useState } from "react";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 360);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  }, []);

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Lên đầu trang"
      title="Lên đầu trang"
      className={`group fixed bottom-5 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full transition-all duration-300 ease-out sm:bottom-7 sm:right-6 sm:h-16 sm:w-16 ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      {/* Đế hoa: nền giấy washi (sáng) / mực đậm (tối), viền beni mảnh */}
      <span
        className="absolute inset-0 rounded-full bg-washi shadow-soft ring-1 ring-beni/25 transition-colors duration-300 dark:bg-zinc-900 dark:ring-beni/40"
        aria-hidden="true"
      />

      {/* Hoa anh đào — 5 cánh, bấm để "rụng hoa" quay lại đầu trang */}
      <svg
        viewBox="0 0 100 100"
        className="relative h-[68%] w-[68%] drop-shadow-soft transition-transform duration-500 ease-out group-hover:rotate-[18deg] group-active:scale-90"
      >
        <g className="origin-center transition-transform duration-500 ease-out group-hover:scale-105">
          {[0, 72, 144, 216, 288].map((deg) => (
            <path
              key={deg}
              d="M50 52
                 C41 45 36 32 39 21
                 C40.5 15.5 45.5 13 50 18
                 C54.5 13 59.5 15.5 61 21
                 C64 32 59 45 50 52 Z"
              transform={`rotate(${deg} 50 50)`}
              className="fill-beni transition-opacity duration-300 group-hover:opacity-90"
            />
          ))}
        </g>

        {/* Nhụy hoa */}
        <circle cx="50" cy="50" r="6.5" className="fill-washi dark:fill-zinc-900" />
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <circle
            key={deg}
            cx={50 + 9 * Math.cos((deg * Math.PI) / 180)}
            cy={50 + 9 * Math.sin((deg * Math.PI) / 180)}
            r="1.3"
            className="fill-beni"
          />
        ))}
      </svg>

      <span className="sr-only">Lên đầu trang</span>
    </button>
  );
}
