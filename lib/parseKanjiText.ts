import type { JlptLevel, KanjiDraft } from "@/lib/types";

export interface ParsedKanjiRow {
  line: number;
  raw: string;
  draft: KanjiDraft;
}

export interface ParseKanjiError {
  line: number;
  raw: string;
  message: string;
}

export interface ParseKanjiResult {
  rows: ParsedKanjiRow[];
  errors: ParseKanjiError[];
  delimiterLabel: string;
}

const VALID_LEVELS: JlptLevel[] = ["n5", "n4", "n3", "n2", "n1", "khac"];

// Đúng 1 ký tự CJK (kanji) — dùng để kiểm tra sơ bộ cột đầu tiên.
const SINGLE_KANJI = /^[\u3400-\u9fff\uf900-\ufaff]$/;

/** Tự phát hiện dấu phân cách cột, ưu tiên Tab > "|" > ",". */
function detectDelimiter(text: string): { char: string; label: string } {
  if (text.includes("\t")) return { char: "\t", label: "Tab" };
  if (text.includes("|")) return { char: "|", label: "dấu | (gạch đứng)" };
  return { char: ",", label: "dấu , (phẩy)" };
}

function parseYomiList(field: string | undefined): string[] {
  if (!field) return [];
  return field
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseLevel(field: string | undefined): JlptLevel {
  const v = (field ?? "").trim().toLowerCase();
  return (VALID_LEVELS as string[]).includes(v) ? (v as JlptLevel) : "khac";
}

function parseStrokeCount(field: string | undefined): number | null {
  const v = (field ?? "").trim();
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

/**
 * Phân tích văn bản dán nhiều dòng thành danh sách chữ Hán để tổng
 * hợp vào sổ tra cứu.
 *
 * Mỗi dòng là 1 chữ Hán, các cột cách nhau bằng Tab (khuyên dùng, dán
 * trực tiếp từ Google Sheets/Excel), "|" hoặc ",". Thứ tự cột cố định:
 *
 *   kanji | hán việt | âm on (cách nhau bằng ;) | âm kun (cách nhau bằng ;) | nghĩa | bộ thủ | số nét | cấp độ | link ảnh tượng hình | mẹo nhớ
 *
 * - Chỉ bắt buộc có "kanji" (đúng 1 ký tự Hán) và "hán việt".
 * - Các cột còn lại có thể bỏ trống hoặc cắt bớt ở cuối dòng.
 */
export function parseKanjiText(text: string): ParseKanjiResult {
  const { char: delimiter, label: delimiterLabel } = detectDelimiter(text);
  const lines = text.split(/\r?\n/);

  const rows: ParsedKanjiRow[] = [];
  const errors: ParseKanjiError[] = [];

  lines.forEach((raw, idx) => {
    const line = idx + 1;
    if (!raw.trim()) return; // bỏ qua dòng trống

    const cols = raw.split(delimiter).map((c) => c.trim());
    const [
      kanji = "",
      hanViet = "",
      onYomiField = "",
      kunYomiField = "",
      meaning = "",
      radical = "",
      strokeField = "",
      jlptField = "",
      pictographUrl = "",
      mnemonic = "",
    ] = cols;

    if (!kanji) {
      errors.push({ line, raw, message: "Thiếu chữ Hán." });
      return;
    }
    if (Array.from(kanji).length !== 1 || !SINGLE_KANJI.test(kanji)) {
      errors.push({
        line,
        raw,
        message: `Cột đầu tiên "${kanji}" phải là đúng 1 chữ Hán duy nhất.`,
      });
      return;
    }
    if (!hanViet) {
      errors.push({ line, raw, message: "Thiếu nghĩa Hán Việt." });
      return;
    }

    const draft: KanjiDraft = {
      kanji,
      han_viet: hanViet,
      meaning: meaning || null,
      on_yomi: parseYomiList(onYomiField),
      kun_yomi: parseYomiList(kunYomiField),
      radical: radical || null,
      stroke_count: parseStrokeCount(strokeField),
      pictograph_url: pictographUrl || null,
      mnemonic: mnemonic || null,
      jlpt_level: parseLevel(jlptField),
    };

    rows.push({ line, raw, draft });
  });

  return { rows, errors, delimiterLabel };
}
