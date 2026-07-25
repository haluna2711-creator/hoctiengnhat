"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

/** Nút chuyển Light/Dark mode. Class "dark" trên <html> đã được gắn
 * sẵn (nếu cần) bởi script chống-nháy-màu trong layout.tsx trước khi
 * component này mount — ở đây chỉ cần đọc lại state đó để hiển thị
 * đúng icon, và xử lý việc bấm đổi + lưu lựa chọn vào localStorage. */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
    setMounted(true);
  }, []);

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem("theme", next);
    } catch {
      // localStorage có thể bị chặn (chế độ ẩn danh nghiêm ngặt...) —
      // không sao, chỉ là lựa chọn theme không được nhớ lại lần sau.
    }
  }

  // Tránh hiển thị icon sai trong khoảnh khắc trước khi mount (server
  // luôn render mặc định "light" vì không biết theme thật cho tới khi
  // script phía client chạy) — giữ chỗ cùng kích thước để không giật layout.
  if (!mounted) {
    return <span className={`inline-block h-9 w-9 ${className}`} aria-hidden="true" />;
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
      title={theme === "dark" ? "Chế độ sáng" : "Chế độ tối"}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-sumi-soft transition hover:border-ai hover:text-ai ${className}`}
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
    </svg>
  );
}
