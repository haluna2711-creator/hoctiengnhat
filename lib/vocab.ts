import { supabase } from "@/lib/supabase";
import type { JlptLevel, Vocab, VocabDraft } from "@/lib/types";

const SELECT_COLUMNS =
  "id, kanji, hiragana, romaji, meaning, example_jp, example_romaji, example_vi, audio_url, jlpt_level, tags, created_at";

export interface VocabFilter {
  level?: JlptLevel | "all";
  search?: string;
}

/** Lấy danh sách từ vựng, có thể lọc theo cấp độ JLPT và từ khoá tìm
 * kiếm (khớp trên kanji, hiragana, romaji hoặc nghĩa). */
export async function fetchVocabList(filter: VocabFilter = {}): Promise<Vocab[]> {
  let query = supabase
    .from("vocab")
    .select(SELECT_COLUMNS)
    .order("created_at", { ascending: false });

  if (filter.level && filter.level !== "all") {
    query = query.eq("jlpt_level", filter.level);
  }

  if (filter.search && filter.search.trim()) {
    const term = filter.search.trim();
    query = query.or(
      `kanji.ilike.%${term}%,hiragana.ilike.%${term}%,romaji.ilike.%${term}%,meaning.ilike.%${term}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Vocab[];
}

/** Lấy toàn bộ từ vựng của 1 (hoặc nhiều) cấp độ để luyện tập — dùng
 * cho cả bốc câu hỏi lẫn chọn đáp án nhiễu. */
export async function fetchVocabForPractice(level: JlptLevel | "all"): Promise<Vocab[]> {
  let query = supabase.from("vocab").select(SELECT_COLUMNS);
  if (level !== "all") {
    query = query.eq("jlpt_level", level);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Vocab[];
}

export async function countVocabByLevel(): Promise<Record<string, number>> {
  const { data, error } = await supabase.from("vocab").select("jlpt_level");
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.jlpt_level] = (counts[row.jlpt_level] ?? 0) + 1;
  }
  return counts;
}

/** Thêm nhiều từ cùng lúc (dùng cho trang "Nạp từ vựng"). Supabase
 * giới hạn payload hợp lý nên chia nhỏ theo lô 200 dòng/lần. */
export async function insertVocabBatch(drafts: VocabDraft[]): Promise<void> {
  const BATCH_SIZE = 200;
  for (let i = 0; i < drafts.length; i += BATCH_SIZE) {
    const batch = drafts.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("vocab").insert(batch);
    if (error) throw error;
  }
}
