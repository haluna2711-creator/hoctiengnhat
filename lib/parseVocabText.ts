import type { JlptLevel, VocabDraft } from "@/lib/types";

export interface ParsedRow {
  line: number;
  raw: string;
  draft: VocabDraft;
}

export interface ParseError {
  line: number;
  raw: string;
  message: string;
}

export interface ParseResult {
  rows: ParsedRow[];
  errors: ParseError[];
  delimiterLabel: string;
}

const VALID_LEVELS: JlptLevel[] = ["n5", "n4", "n3", "n2", "n1", "khac"];

// Bất kỳ ký tự nào thuộc Hiragana, Katakana hoặc CJK (Kanji) — dùng để
// kiểm tra sơ bộ cột "cách đọc" có thực sự là chữ Nhật hay không.
const JAPANESE_CHAR = /[\u3040-\u30ff\u3400-\u9fff]/;

/** Tự phát hiện dấu phân cách cột, ưu tiên Tab (dán từ Excel/Google
 * Sheets) > "|" > ",". Dò trên toàn bộ văn bản để áp dụng nhất quán
 * cho mọi dòng. */
function detectDelimiter(text: string): { char: string; label: string } {
  if (text.includes("\t")) return { char: "\t", label: "Tab" };
  if (text.includes("|")) return { char: "|", label: "dấu | (gạch đứng)" };
  return { char: ",", label: "dấu , (phẩy)" };
}

function parseTags(field: string | undefined): string[] {
  if (!field) return [];
  return field
    .split(";")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}

function parseLevel(field: string | undefined): JlptLevel {
  const v = (field ?? "").trim().toLowerCase();
  return (VALID_LEVELS as string[]).includes(v) ? (v as JlptLevel) : "khac";
}

/**
 * Phân tích văn bản dán nhiều dòng thành danh sách từ vựng.
 *
 * Mỗi dòng là 1 từ, các cột cách nhau bằng Tab (khuyên dùng, dán trực
 * tiếp từ Google Sheets/Excel), "|" hoặc ",".  Thứ tự cột cố định:
 *
 *   kanji | hiragana | nghĩa | romaji | cấp độ | câu ví dụ (JP) | câu ví dụ (VI) | nhãn
 *
 * - Cột "kanji" để trống nếu từ chỉ có hiragana/katakana (VD: これ).
 * - Chỉ bắt buộc có "hiragana" và "nghĩa" — các cột còn lại có thể bỏ
 *   trống hoặc cắt bớt ở cuối dòng.
 * - Nhiều nhãn trong cột "nhãn" cách nhau bằng ";".
 */
export function parseVocabText(text: string): ParseResult {
  const { char: delimiter, label: delimiterLabel } = detectDelimiter(text);
  const lines = text.split(/\r?\n/);

  const rows: ParsedRow[] = [];
  const errors: ParseError[] = [];

  lines.forEach((raw, idx) => {
    const line = idx + 1;
    if (!raw.trim()) return; // bỏ qua dòng trống

    const cols = raw.split(delimiter).map((c) => c.trim());

    // Chấp nhận 2 kiểu dòng:
    //  - Chỉ 2 cột -> hiểu là (hiragana, nghĩa), không có kanji riêng.
    //  - Từ 3 cột trở lên -> (kanji, hiragana, nghĩa, ...).
    let kanji = "";
    let hiragana = "";
    let meaning = "";
    let romaji = "";
    let jlptField = "";
    let exampleJp = "";
    let exampleVi = "";
    let tagsField = "";

    if (cols.length <= 2) {
      [hiragana = "", meaning = ""] = cols;
    } else {
      [
        kanji = "",
        hiragana = "",
        meaning = "",
        romaji = "",
        jlptField = "",
        exampleJp = "",
        exampleVi = "",
        tagsField = "",
      ] = cols;
    }

    if (!hiragana) {
      errors.push({ line, raw, message: "Thiếu cách đọc (hiragana/katakana)." });
      return;
    }
    if (!meaning) {
      errors.push({ line, raw, message: "Thiếu nghĩa tiếng Việt." });
      return;
    }
    if (!JAPANESE_CHAR.test(hiragana)) {
      errors.push({
        line,
        raw,
        message: `Cột cách đọc "${hiragana}" không giống chữ Nhật — kiểm tra lại thứ tự cột.`,
      });
      return;
    }

    const draft: VocabDraft = {
      kanji: kanji || null,
      hiragana,
      meaning,
      romaji: romaji || null,
      example_jp: exampleJp || null,
      example_vi: exampleVi || null,
      audio_url: null,
      jlpt_level: parseLevel(jlptField),
      tags: parseTags(tagsField),
    };

    rows.push({ line, raw, draft });
  });

  return { rows, errors, delimiterLabel };
}
