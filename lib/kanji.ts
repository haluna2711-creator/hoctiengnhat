import { supabase } from "@/lib/supabase";
import type { JlptLevel, KanjiDraft, KanjiEntry } from "@/lib/types";
import { kanjiKey } from "@/lib/types";

const SELECT_COLUMNS =
  "id, kanji, han_viet, meaning, on_yomi, kun_yomi, radical, stroke_count, pictograph_url, mnemonic, jlpt_level, created_at";

export interface KanjiFilter {
  level?: JlptLevel | "all";
  /** Khớp trên chữ Hán, nghĩa Hán Việt, âm On, âm Kun hoặc giải nghĩa. */
  search?: string;
  /** Số dòng tối đa lấy về (mặc định 60), dùng cho "tải thêm". */
  limit?: number;
  offset?: number;
}

export interface KanjiPage {
  rows: KanjiEntry[];
  /** true nếu còn dữ liệu phía sau chưa lấy. */
  hasMore: boolean;
}

const DEFAULT_PAGE_SIZE = 60;

/** Lấy danh sách chữ Hán theo trang, có thể lọc theo cấp độ JLPT và
 * tìm theo chữ Hán / Hán Việt / âm On / âm Kun / giải nghĩa. */
export async function fetchKanjiList(filter: KanjiFilter = {}): Promise<KanjiPage> {
  const limit = filter.limit ?? DEFAULT_PAGE_SIZE;
  const offset = filter.offset ?? 0;

  let query = supabase
    .from("kanji")
    .select(SELECT_COLUMNS)
    .order("created_at", { ascending: false });

  if (filter.level && filter.level !== "all") {
    query = query.eq("jlpt_level", filter.level);
  }

  if (filter.search && filter.search.trim()) {
    const term = filter.search.trim();
    // on_yomi/kun_yomi là mảng text[] nên dùng toán tử "cs" (contains)
    // thay vì "ilike" — khớp chính xác 1 phần tử trong mảng.
    query = query.or(
      [
        `kanji.ilike.%${term}%`,
        `han_viet.ilike.%${term}%`,
        `meaning.ilike.%${term}%`,
        `on_yomi.cs.{${term}}`,
        `kun_yomi.cs.{${term}}`,
      ].join(",")
    );
  }

  // Lấy dư 1 dòng để biết còn "tải thêm" được nữa hay không.
  query = query.range(offset, offset + limit);

  const { data, error } = await query;
  if (error) throw error;
  const rows = (data ?? []) as KanjiEntry[];
  const hasMore = rows.length > limit;
  return { rows: hasMore ? rows.slice(0, limit) : rows, hasMore };
}

/** Tra đúng 1 chữ Hán (dùng cho ô tra cứu nhanh "gõ 1 chữ ra kết quả"). */
export async function fetchKanjiByChar(kanji: string): Promise<KanjiEntry | null> {
  const char = kanji.trim();
  if (!char) return null;
  const { data, error } = await supabase
    .from("kanji")
    .select(SELECT_COLUMNS)
    .eq("kanji", char)
    .maybeSingle();
  if (error) throw error;
  return (data as KanjiEntry) ?? null;
}

export async function countKanjiByLevel(): Promise<Record<string, number>> {
  const levels: JlptLevel[] = ["n5", "n4", "n3", "n2", "n1", "khac"];
  const results = await Promise.all(
    levels.map((lvl) =>
      supabase
        .from("kanji")
        .select("id", { count: "exact", head: true })
        .eq("jlpt_level", lvl)
    )
  );
  const counts: Record<string, number> = {};
  results.forEach((res, i) => {
    if (res.error) throw res.error;
    counts[levels[i]] = res.count ?? 0;
  });
  return counts;
}

/** Kiểm tra những chữ Hán sắp nạp đã có sẵn trong sổ tra cứu hay chưa.
 * Trả về tập hợp các "kanjiKey" (= chính chữ Hán đó) đã tồn tại. */
export async function findExistingKanjiKeys(
  drafts: Pick<KanjiDraft, "kanji">[]
): Promise<Set<string>> {
  const chars = Array.from(new Set(drafts.map((d) => d.kanji.trim()).filter(Boolean)));
  if (chars.length === 0) return new Set();

  const existing = new Set<string>();
  const CHUNK_SIZE = 200; // tránh câu query "in (...)" quá dài
  for (let i = 0; i < chars.length; i += CHUNK_SIZE) {
    const chunk = chars.slice(i, i + CHUNK_SIZE);
    const { data, error } = await supabase.from("kanji").select("kanji").in("kanji", chunk);
    if (error) throw error;
    for (const row of data ?? []) {
      existing.add(kanjiKey(row.kanji));
    }
  }
  return existing;
}

/** Thêm nhiều chữ Hán cùng lúc (dùng cho trang "Nạp Hán tự"). Chia
 * nhỏ theo lô 200 dòng/lần như insertVocabBatch. */
export async function insertKanjiBatch(drafts: KanjiDraft[]): Promise<void> {
  const BATCH_SIZE = 200;
  for (let i = 0; i < drafts.length; i += BATCH_SIZE) {
    const batch = drafts.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("kanji").insert(batch);
    if (error) throw error;
  }
}
