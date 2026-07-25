/**
 * Lịch sử các buổi luyện tập — giống cách `lib/srs.ts` lưu tiến độ ôn
 * từ, module này lưu KẾT QUẢ TỪNG BUỔI luyện tập (điểm số, độ chính
 * xác) ngay trên trình duyệt (localStorage), không cần đăng nhập hay
 * gửi lên server. Trang "Đánh giá" đọc dữ liệu từ đây + từ srs.ts để
 * vẽ thống kê tiến độ học tập.
 */

import type { JlptLevel } from "@/lib/types";

export type SessionMode = "mc" | "hiragana" | "kanji" | "flashcard" | "match";

export interface SessionRecord {
  id: string;
  mode: SessionMode;
  level: JlptLevel | "all";
  /** ISO timestamp lúc kết thúc buổi luyện tập. */
  timestamp: string;
  /** Số câu/thẻ đúng (hoặc "đã thuộc" với flashcard, "cặp ghép đúng
   * hiệu chỉnh theo số lần sai" với match). */
  correct: number;
  total: number;
  /** Đã làm tròn sẵn 0-100 để hiển thị nhanh, khỏi tính lại nhiều nơi. */
  accuracyPct: number;
}

const STORAGE_KEY = "htn_history_v1";
const MAX_ENTRIES = 300;

function todayStr(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function makeId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}

function loadHistory(): SessionRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SessionRecord[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(records: SessionRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Bỏ qua lỗi (VD: chế độ ẩn danh chặn localStorage, hết dung lượng...)
  }
}

/** Ghi lại 1 buổi luyện tập vừa hoàn thành. */
export function recordSession(entry: {
  mode: SessionMode;
  level: JlptLevel | "all";
  correct: number;
  total: number;
}): SessionRecord {
  const record: SessionRecord = {
    id: makeId(),
    mode: entry.mode,
    level: entry.level,
    timestamp: new Date().toISOString(),
    correct: entry.correct,
    total: entry.total,
    accuracyPct: entry.total > 0 ? Math.round((entry.correct / entry.total) * 100) : 0,
  };

  const records = [...loadHistory(), record];
  // Chỉ giữ lại các buổi gần nhất — tránh localStorage phình to vô hạn.
  const trimmed = records.length > MAX_ENTRIES ? records.slice(records.length - MAX_ENTRIES) : records;
  saveHistory(trimmed);
  return record;
}

/** Toàn bộ lịch sử, mới nhất trước. */
export function getHistory(): SessionRecord[] {
  return [...loadHistory()].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export interface ModeBreakdown {
  mode: SessionMode;
  sessions: number;
  avgAccuracyPct: number;
  totalItems: number;
  totalCorrect: number;
}

const MODE_ORDER: SessionMode[] = ["mc", "hiragana", "kanji", "flashcard", "match"];

/** Gộp thống kê theo từng chế độ luyện tập. */
export function getModeBreakdown(): ModeBreakdown[] {
  const all = loadHistory();
  return MODE_ORDER.map((mode) => {
    const rows = all.filter((r) => r.mode === mode);
    const totalItems = rows.reduce((sum, r) => sum + r.total, 0);
    const totalCorrect = rows.reduce((sum, r) => sum + r.correct, 0);
    return {
      mode,
      sessions: rows.length,
      avgAccuracyPct: totalItems > 0 ? Math.round((totalCorrect / totalItems) * 100) : 0,
      totalItems,
      totalCorrect,
    };
  }).filter((m) => m.sessions > 0);
}

/** Độ chính xác trung bình theo từng ngày trong N ngày gần nhất (dùng
 * để vẽ biểu đồ xu hướng). Ngày không luyện tập -> null. */
export interface DailyAccuracy {
  dateStr: string;
  sessions: number;
  avgAccuracyPct: number | null;
}

export function getDailyAccuracy(days: number): DailyAccuracy[] {
  const all = loadHistory();
  const out: DailyAccuracy[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = todayStr(d);
    const rows = all.filter((r) => r.timestamp.slice(0, 10) === dateStr);
    const totalItems = rows.reduce((sum, r) => sum + r.total, 0);
    const totalCorrect = rows.reduce((sum, r) => sum + r.correct, 0);
    out.push({
      dateStr,
      sessions: rows.length,
      avgAccuracyPct: totalItems > 0 ? Math.round((totalCorrect / totalItems) * 100) : null,
    });
  }
  return out;
}

/** Số ngày luyện tập liên tiếp tính đến hôm nay (hoặc hôm qua nếu hôm
 * nay chưa luyện) — kiểu "streak" quen thuộc của các app học ngoại ngữ. */
export function getStreakDays(): number {
  const all = loadHistory();
  if (all.length === 0) return 0;

  const daysWithSession = new Set(all.map((r) => r.timestamp.slice(0, 10)));
  const today = new Date();
  let cursor = new Date(today);

  // Nếu hôm nay chưa luyện, streak vẫn tính từ hôm qua trở về trước
  // (chưa "gãy" cho tới hết ngày hôm nay).
  if (!daysWithSession.has(todayStr(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (daysWithSession.has(todayStr(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export interface OverallStats {
  totalSessions: number;
  totalItemsAnswered: number;
  totalCorrect: number;
  overallAccuracyPct: number;
  streakDays: number;
}

export function getOverallStats(): OverallStats {
  const all = loadHistory();
  const totalItemsAnswered = all.reduce((sum, r) => sum + r.total, 0);
  const totalCorrect = all.reduce((sum, r) => sum + r.correct, 0);
  return {
    totalSessions: all.length,
    totalItemsAnswered,
    totalCorrect,
    overallAccuracyPct:
      totalItemsAnswered > 0 ? Math.round((totalCorrect / totalItemsAnswered) * 100) : 0,
    streakDays: getStreakDays(),
  };
}

export const MODE_LABELS: Record<SessionMode, string> = {
  mc: "Trắc nghiệm",
  hiragana: "Nhập hiragana",
  kanji: "Viết kanji",
  flashcard: "Flashcard",
  match: "Ghép từ",
};
