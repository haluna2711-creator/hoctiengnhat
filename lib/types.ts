export type JlptLevel = "n5" | "n4" | "n3" | "n2" | "n1" | "khac";

export const JLPT_LEVELS: { value: JlptLevel; label: string }[] = [
  { value: "n5", label: "N5" },
  { value: "n4", label: "N4" },
  { value: "n3", label: "N3" },
  { value: "n2", label: "N2" },
  { value: "n1", label: "N1" },
  { value: "khac", label: "Khác" },
];

export interface Vocab {
  id: string;
  kanji: string | null;
  hiragana: string;
  romaji: string | null;
  meaning: string;
  example_jp: string | null;
  example_romaji: string | null;
  example_vi: string | null;
  audio_url: string | null;
  jlpt_level: JlptLevel;
  tags: string[];
  created_at: string;
}

export type VocabDraft = Omit<Vocab, "id" | "created_at">;

/** Mặt chữ chính để hiển thị to trong thẻ / ô luyện tập: ưu tiên kanji,
 * nếu từ không có kanji (chỉ viết hiragana) thì dùng hiragana. */
export function headword(v: Pick<Vocab, "kanji" | "hiragana">): string {
  return (v.kanji ?? "").trim() || v.hiragana;
}

export function normalizeTags(tags: string[] | null | undefined): string[] {
  return (tags ?? []).map((t) => t.trim().toLowerCase()).filter(Boolean);
}

/** Khoá định danh 1 từ vựng theo cặp (kanji, hiragana) — dùng để phát
 * hiện trùng lặp khi nạp từ mới. Coalesce kanji về "" để khớp đúng
 * logic unique index ở database (coalesce(kanji, ''), hiragana). */
export function vocabKey(kanji: string | null | undefined, hiragana: string): string {
  return `${(kanji ?? "").trim()}|${hiragana.trim()}`;
}

/** So khớp câu trả lời gõ tay: bỏ khoảng trắng thừa đầu/cuối, coi
 * khoảng trắng liên tiếp là một, không phân biệt hoa/thường (romaji có
 * thể gõ hoa). Hiragana/kanji tiếng Nhật không có khái niệm hoa
 * thường nên chỉ ảnh hưởng tới romaji. */
export function normalizeAnswer(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Một dòng trong sổ tra cứu & tổng hợp chữ Hán — khác với "Vocab"
 * (từ/cụm từ), đây luôn là ĐÚNG 1 chữ Hán độc lập kèm nghĩa Hán Việt,
 * âm On, âm Kun và (tuỳ chọn) ảnh tượng hình để hỗ trợ ghi nhớ. */
export interface KanjiEntry {
  id: string;
  /** Đúng 1 ký tự Hán, VD: "山". */
  kanji: string;
  /** Nghĩa Hán Việt ngắn gọn, VD: "sơn". */
  han_viet: string;
  /** Giải nghĩa tiếng Việt đầy đủ hơn, không bắt buộc. */
  meaning: string | null;
  /** Âm On — thường viết bằng katakana, 1 chữ có thể có nhiều âm. */
  on_yomi: string[];
  /** Âm Kun — thường viết bằng hiragana, 1 chữ có thể có nhiều âm. */
  kun_yomi: string[];
  /** Bộ thủ, VD: "水" hoặc "氵". */
  radical: string | null;
  /** Tổng số nét. */
  stroke_count: number | null;
  /** Link ảnh tượng hình / nguồn gốc chữ, hiển thị bên cạnh chữ Hán. */
  pictograph_url: string | null;
  /** Mẹo nhớ chữ, không bắt buộc. */
  mnemonic: string | null;
  jlpt_level: JlptLevel;
  created_at: string;
}

export type KanjiDraft = Omit<KanjiEntry, "id" | "created_at">;

/** Khoá định danh 1 chữ Hán — dùng để phát hiện trùng lặp khi nạp Hán
 * tự mới, khớp đúng logic unique index ở database (unique trên cột
 * "kanji"). */
export function kanjiKey(kanji: string): string {
  return kanji.trim();
}
