/**
 * Ôn tập giãn cách kiểu Anki (thuật toán SM-2 rút gọn còn 2 mức đánh
 * giá: "chưa thuộc" / "đã thuộc"). Vì app chưa có hệ thống đăng nhập
 * người dùng, tiến độ ôn tập được lưu ngay trên trình duyệt
 * (localStorage), theo từng id từ vựng.
 */

export type SrsGrade = "again" | "good";

export interface SrsCardState {
  vocabId: string;
  /** Số lần liên tiếp trả lời "đã thuộc". */
  repetitions: number;
  /** Khoảng cách tới lần ôn tiếp theo, tính theo ngày. */
  intervalDays: number;
  /** Hệ số dễ — càng cao thì khoảng cách giãn ra càng nhanh. */
  easeFactor: number;
  /** Ngày đến hạn ôn lại, dạng YYYY-MM-DD (giờ địa phương). */
  dueDate: string;
  lastReviewed: string | null;
  lastGrade: SrsGrade | null;
}

const STORAGE_KEY = "htn_srs_v1";
const DEFAULT_EASE = 2.5;
const MIN_EASE = 1.3;
const MAX_EASE = 3.2;

function todayStr(): string {
  return dateToStr(new Date());
}

function dateToStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function addDays(fromDateStr: string, days: number): string {
  const d = new Date(`${fromDateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return dateToStr(d);
}

function loadStore(): Record<string, SrsCardState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, SrsCardState>) : {};
  } catch {
    return {};
  }
}

function saveStore(store: Record<string, SrsCardState>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Bỏ qua lỗi (VD: chế độ ẩn danh chặn localStorage, hết dung lượng...)
  }
}

function freshState(vocabId: string): SrsCardState {
  return {
    vocabId,
    repetitions: 0,
    intervalDays: 0,
    easeFactor: DEFAULT_EASE,
    dueDate: todayStr(),
    lastReviewed: null,
    lastGrade: null,
  };
}

export function getCardState(vocabId: string): SrsCardState | null {
  return loadStore()[vocabId] ?? null;
}

/** Thẻ chưa từng ôn — luôn được coi là "đến hạn" ngay từ đầu. */
export function isNewCard(vocabId: string): boolean {
  return getCardState(vocabId) === null;
}

export function isDue(vocabId: string, onDate: string = todayStr()): boolean {
  const s = getCardState(vocabId);
  if (!s) return true;
  return s.dueDate <= onDate;
}

/** Ghi nhận 1 lượt ôn cho 1 từ và tính lịch ôn tiếp theo. */
export function reviewCard(vocabId: string, grade: SrsGrade): SrsCardState {
  const store = loadStore();
  const prev = store[vocabId] ?? freshState(vocabId);

  let { repetitions, intervalDays, easeFactor } = prev;

  if (grade === "again") {
    repetitions = 0;
    intervalDays = 1;
    easeFactor = Math.max(MIN_EASE, easeFactor - 0.2);
  } else {
    if (repetitions === 0) intervalDays = 1;
    else if (repetitions === 1) intervalDays = 6;
    else intervalDays = Math.max(1, Math.round(intervalDays * easeFactor));
    repetitions += 1;
    easeFactor = Math.min(MAX_EASE, easeFactor + 0.05);
  }

  const today = todayStr();
  const next: SrsCardState = {
    vocabId,
    repetitions,
    intervalDays,
    easeFactor,
    dueDate: addDays(today, intervalDays),
    lastReviewed: today,
    lastGrade: grade,
  };

  store[vocabId] = next;
  saveStore(store);
  return next;
}

export interface DueStats {
  /** Thẻ mới, chưa từng ôn lần nào. */
  newCount: number;
  /** Thẻ đã ôn trước đó và nay đến hạn ôn lại. */
  dueCount: number;
  total: number;
}

export function getDueStats(pool: { id: string }[]): DueStats {
  const today = todayStr();
  let newCount = 0;
  let dueCount = 0;
  for (const v of pool) {
    const s = getCardState(v.id);
    if (!s) newCount++;
    else if (s.dueDate <= today) dueCount++;
  }
  return { newCount, dueCount, total: pool.length };
}

/** Lọc ra các từ nên ôn hôm nay: từ mới + từ đã đến hạn theo lịch giãn
 * cách (giống danh sách "Due" của Anki). */
export function filterDuePool<T extends { id: string }>(pool: T[]): T[] {
  const today = todayStr();
  return pool.filter((v) => isDue(v.id, today));
}

/**
 * Mức độ thuộc từ, suy ra từ trạng thái SRS — dùng cho trang "Đánh
 * giá" để vẽ biểu đồ phân bố mức độ thuộc trên toàn kho từ:
 *  - new: chưa ôn lần nào.
 *  - learning: đã ôn nhưng lần gần nhất là "chưa thuộc" (repetitions = 0).
 *  - young: đang nhớ tốt nhưng khoảng ôn còn ngắn (< 21 ngày).
 *  - mature: khoảng ôn đã dài (>= 21 ngày) — coi như đã thuộc chắc.
 */
export type MasteryLevel = "new" | "learning" | "young" | "mature";

const MATURE_INTERVAL_DAYS = 21;

export function classifyMastery(state: SrsCardState | null): MasteryLevel {
  if (!state) return "new";
  if (state.repetitions === 0) return "learning";
  return state.intervalDays >= MATURE_INTERVAL_DAYS ? "mature" : "young";
}

export interface MasteryBreakdown {
  new: number;
  learning: number;
  young: number;
  mature: number;
  total: number;
}

/** Phân bố mức độ thuộc trên 1 kho từ (VD: toàn bộ từ vựng hoặc từ
 * vựng theo 1 cấp độ JLPT). */
export function getMasteryBreakdown(pool: { id: string }[]): MasteryBreakdown {
  const breakdown: MasteryBreakdown = { new: 0, learning: 0, young: 0, mature: 0, total: pool.length };
  for (const v of pool) {
    breakdown[classifyMastery(getCardState(v.id))] += 1;
  }
  return breakdown;
}

/** Tổng số từ đã từng được ôn ít nhất 1 lần (có mặt trong kho SRS lưu
 * ở localStorage), không phụ thuộc vào 1 pool cụ thể nào. */
export function getTotalReviewedWords(): number {
  return Object.keys(loadStore()).length;
}

export const MASTERY_LABELS: Record<MasteryLevel, string> = {
  new: "Chưa học",
  learning: "Đang học",
  young: "Sắp thuộc",
  mature: "Đã thuộc",
};
