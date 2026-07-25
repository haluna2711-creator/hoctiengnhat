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
      {/* Con dấu triện tròn — bấm để "đóng dấu" quay lại đầu trang */}
      <svg
        viewBox="0 0 100 100"
        className="h-full w-full drop-shadow-soft transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-active:scale-90"
      >
        <circle cx="50" cy="50" r="47" fill="#FFF5EE" stroke="#A9575A" strokeWidth="3" />
        <circle cx="50" cy="50" r="40" fill="none" stroke="#A9575A" strokeWidth="1.4" opacity="0.6" />
        <path
          d="M50 38 L61 58 L39 58 Z"
          fill="#A9575A"
          className="transition-transform duration-300 group-hover:-translate-y-0.5"
        />
        <rect x="42" y="60" width="16" height="4" rx="1" fill="#A9575A" />
      </svg>
      <span className="sr-only">Lên đầu trang</span>
    </button>
  );
}
