import { headword, type Vocab } from "@/lib/types";

export function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickDistractors(pool: Vocab[], correctId: string, count: number): Vocab[] {
  const others = pool.filter((v) => v.id !== correctId);
  return shuffle(others).slice(0, count);
}

export type McDirection = "word-to-meaning" | "meaning-to-word";

export interface McQuestion {
  vocab: Vocab;
  direction: McDirection;
  options: string[];
  correctIndex: number;
}

/** Tạo 1 câu trắc nghiệm 4 đáp án (hoặc ít hơn nếu kho từ quá nhỏ) từ
 * 1 từ đúng + các từ nhiễu cùng kho. Ngẫu nhiên chiều hỏi mỗi câu:
 * đôi khi cho mặt chữ hỏi nghĩa, đôi khi cho nghĩa hỏi mặt chữ. */
export function buildMcQuestion(vocab: Vocab, pool: Vocab[]): McQuestion {
  const direction: McDirection = Math.random() < 0.5 ? "word-to-meaning" : "meaning-to-word";
  const distractorCount = Math.min(3, Math.max(0, pool.length - 1));
  const distractors = pickDistractors(pool, vocab.id, distractorCount);

  const toOption = (v: Vocab) =>
    direction === "word-to-meaning" ? v.meaning : headword(v);

  const correctOption = toOption(vocab);
  const options = shuffle([correctOption, ...distractors.map(toOption)]);
  const correctIndex = options.indexOf(correctOption);

  return { vocab, direction, options, correctIndex };
}

/** Chỉ những từ có kanji riêng biệt (khác hiragana) mới dùng được cho
 * chế độ "nhập hiragana" (nếu không có kanji thì đề bài = đáp án). */
export function poolForHiraganaInput(pool: Vocab[]): Vocab[] {
  return pool.filter((v) => v.kanji && v.kanji.trim() && v.kanji.trim() !== v.hiragana);
}

/** Chỉ những từ có kanji mới dùng được cho chế độ viết kanji. */
export function poolForKanjiInput(pool: Vocab[]): Vocab[] {
  return pool.filter((v) => v.kanji && v.kanji.trim());
}
