import { supabase } from "@/lib/supabase";
import type { JlptLevel, Vocab, VocabDraft } from "@/lib/types";
import { vocabKey } from "@/lib/types";

const SELECT_COLUMNS =
  "id, kanji, hiragana, romaji, meaning, example_jp, example_romaji, example_vi, audio_url, jlpt_level, tags, created_at";

export interface VocabFilter {
  level?: JlptLevel | "all";
  search?: string;
  /** Số dòng tối đa lấy về (mặc định 60). Trang "Sổ từ vựng" dùng để
   * phân trang kiểu "tải thêm" thay vì tải cả kho từ một lần — quan
   * trọng khi kho từ lên tới vài trăm/nghìn từ, nhất là trên mobile. */
  limit?: number;
  /** Vị trí bắt đầu lấy (dùng cho "tải thêm"). */
  offset?: number;
}

export interface VocabPage {
  rows: Vocab[];
  /** true nếu còn dữ liệu phía sau chưa lấy (còn để bấm "Tải thêm"). */
  hasMore: boolean;
}

const DEFAULT_PAGE_SIZE = 60;

/** Lấy danh sách từ vựng theo trang, có thể lọc theo cấp độ JLPT và từ
 * khoá tìm kiếm (khớp trên kanji, hiragana, romaji hoặc nghĩa). */
export async function fetchVocabList(filter: VocabFilter = {}): Promise<VocabPage> {
  const limit = filter.limit ?? DEFAULT_PAGE_SIZE;
  const offset = filter.offset ?? 0;

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

  // Lấy dư 1 dòng để biết còn "tải thêm" được nữa hay không, mà không
  // cần thêm 1 query đếm riêng (đỡ round-trip tới Supabase).
  query = query.range(offset, offset + limit);

  const { data, error } = await query;
  if (error) throw error;
  const rows = (data ?? []) as Vocab[];
  const hasMore = rows.length > limit;
  return { rows: hasMore ? rows.slice(0, limit) : rows, hasMore };
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
  // Trước đây hàm này SELECT cột jlpt_level của MỌI dòng trong bảng rồi
  // đếm bằng JS — càng nhiều từ vựng, trang chủ càng chậm vì phải tải
  // hết dữ liệu chỉ để đếm. Đổi sang 6 query "head-count" (Supabase chỉ
  // trả về con số, không tải nội dung dòng nào), chạy song song.
  const levels: JlptLevel[] = ["n5", "n4", "n3", "n2", "n1", "khac"];

  const results = await Promise.all(
    levels.map((lvl) =>
      supabase
        .from("vocab")
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

/** Kiểm tra xem những từ sắp nạp đã tồn tại sẵn trong kho hay chưa.
 * Chỉ truy vấn theo cột "hiragana" (có index) rồi so khớp chính xác
 * theo cặp (kanji, hiragana) ở phía client — vừa nhanh vừa không cần
 * tải cả bảng vocab về. Trả về tập hợp các "vocabKey" đã tồn tại. */
export async function findExistingVocabKeys(
  drafts: Pick<VocabDraft, "kanji" | "hiragana">[]
): Promise<Set<string>> {
  const hiraganaList = Array.from(
    new Set(drafts.map((d) => d.hiragana.trim()).filter(Boolean))
  );
  if (hiraganaList.length === 0) return new Set();

  const existing = new Set<string>();
  const CHUNK_SIZE = 200; // tránh câu query "in (...)" quá dài
  for (let i = 0; i < hiraganaList.length; i += CHUNK_SIZE) {
    const chunk = hiraganaList.slice(i, i + CHUNK_SIZE);
    const { data, error } = await supabase
      .from("vocab")
      .select("kanji, hiragana")
      .in("hiragana", chunk);
    if (error) throw error;
    for (const row of data ?? []) {
      existing.add(vocabKey(row.kanji, row.hiragana));
    }
  }
  return existing;
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

/** Với mỗi chữ Hán trong danh sách, tìm các từ vựng trong sổ có chứa
 * chữ đó (dùng để hiển thị mục "Từ vựng liên quan" ngay dưới thẻ Hán
 * tự trên trang tra cứu). Trả về map chữ Hán -> danh sách từ chứa
 * chữ đó, mới nhất trước.
 *
 * Postgrest không có toán tử "chuỗi chứa 1 trong nhiều ký tự" nên phải
 * ghép nhiều điều kiện ilike bằng "or"; chia theo lô để câu query
 * không quá dài khi tra cứu nhiều chữ cùng lúc (vd cả 1 trang 60 chữ). */
export async function fetchVocabByKanjiChars(
  chars: string[]
): Promise<Record<string, Vocab[]>> {
  const uniqueChars = Array.from(new Set(chars.map((c) => c.trim()).filter(Boolean)));
  const result: Record<string, Vocab[]> = {};
  for (const char of uniqueChars) result[char] = [];
  if (uniqueChars.length === 0) return result;

  const CHUNK_SIZE = 30;
  const matched: Vocab[] = [];
  const seenIds = new Set<string>();

  for (let i = 0; i < uniqueChars.length; i += CHUNK_SIZE) {
    const chunk = uniqueChars.slice(i, i + CHUNK_SIZE);
    const orFilter = chunk.map((c) => `kanji.ilike.%${c}%`).join(",");
    const { data, error } = await supabase
      .from("vocab")
      .select(SELECT_COLUMNS)
      .not("kanji", "is", null)
      .or(orFilter)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    for (const row of (data ?? []) as Vocab[]) {
      if (seenIds.has(row.id)) continue; // 1 từ có thể khớp ở nhiều lô
      seenIds.add(row.id);
      matched.push(row);
    }
  }

  for (const v of matched) {
    if (!v.kanji) continue;
    for (const char of uniqueChars) {
      if (v.kanji.includes(char)) result[char].push(v);
    }
  }
  return result;
}
