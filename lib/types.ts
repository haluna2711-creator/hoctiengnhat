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
