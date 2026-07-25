"use client";

import { useMemo, useState } from "react";
import { headword, normalizeAnswer, type Vocab } from "@/lib/types";
import {
  buildMcQuestion,
  poolForHiraganaInput,
  poolForKanjiInput,
  shuffle,
  type McQuestion,
} from "@/lib/practice";
import SpeakerButton from "@/components/SpeakerButton";

/** "flashcard" và "match" được xử lý bởi FlashcardSession / MatchSession
 * riêng — PracticeSession chỉ còn phụ trách 3 chế độ chấm điểm gốc. */
export type PracticeMode = "mc" | "hiragana" | "kanji" | "flashcard" | "match";
export type ScoredPracticeMode = "mc" | "hiragana" | "kanji";
export type KanjiDirection = "xuoi" | "nguoc";

interface Props {
  pool: Vocab[];
  mode: ScoredPracticeMode;
  kanjiDirection: KanjiDirection;
  questionCount: number;
  onFinish: (result: { correct: number; total: number }) => void;
}

export default function PracticeSession({
  pool,
  mode,
  kanjiDirection,
  questionCount,
  onFinish,
}: Props) {
  const sessionPool = useMemo(() => {
    if (mode === "hiragana") return poolForHiraganaInput(pool);
    if (mode === "kanji") return poolForKanjiInput(pool);
    return pool;
  }, [pool, mode]);

  const words = useMemo(
    () => shuffle(sessionPool).slice(0, Math.min(questionCount, sessionPool.length)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessionPool, questionCount]
  );

  const mcQuestions = useMemo<McQuestion[]>(
    () => (mode === "mc" ? words.map((v) => buildMcQuestion(v, sessionPool)) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode, words, sessionPool]
  );

  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState<"idle" | "correct" | "wrong">("idle");
  const [inputValue, setInputValue] = useState("");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  if (words.length === 0) {
    return (
      <div className="rounded-xl2 border border-beni/40 bg-beni/5 p-6 text-beni-deep">
        Chưa đủ từ vựng phù hợp cho chế độ này ở cấp độ đã chọn (chế độ
        này cần từ có kanji riêng biệt với hiragana). Hãy đổi cấp độ,
        đổi chế độ khác, hoặc nạp thêm từ vựng.
      </div>
    );
  }

  const current = words[index];
  const isLast = index === words.length - 1;
  const progressLabel = `Câu ${index + 1}/${words.length} · Đúng ${correct}`;

  function resetForNext() {
    setFeedback("idle");
    setInputValue("");
    setSelectedOption(null);
  }

  function goNext(wasCorrect: boolean) {
    const nextCorrect = wasCorrect ? correct + 1 : correct;
    setCorrect(nextCorrect);
    if (isLast) {
      onFinish({ correct: nextCorrect, total: words.length });
      return;
    }
    setIndex((i) => i + 1);
    resetForNext();
  }

  function handleMcSelect(optionIdx: number) {
    if (feedback !== "idle") return;
    const q = mcQuestions[index];
    setSelectedOption(optionIdx);
    setFeedback(optionIdx === q.correctIndex ? "correct" : "wrong");
  }

  function expectedTypedAnswer(): string {
    if (mode === "hiragana") return current.hiragana;
    return current.kanji ?? "";
  }

  function handleTypedSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (feedback !== "idle") return;
    const isCorrect = normalizeAnswer(inputValue) === normalizeAnswer(expectedTypedAnswer());
    setFeedback(isCorrect ? "correct" : "wrong");
  }

  return (
    <div>
      <p className="text-sm font-medium tracking-wide text-sumi-soft">{progressLabel}</p>

      <div className="mt-4 rounded-xl2 border border-line/70 bg-washi/70 p-6 shadow-card sm:p-8">
        {mode === "mc" && (
          <McQuestionView
            question={mcQuestions[index]}
            selectedOption={selectedOption}
            feedback={feedback}
            onSelect={handleMcSelect}
          />
        )}

        {mode === "hiragana" && (
          <TypedQuestionView
            heading="Gõ lại cách đọc (hiragana) của từ này"
            prompt={<HeadwordCells word={headword(current)} />}
            hint={current.meaning}
            inputValue={inputValue}
            onInputChange={setInputValue}
            onSubmit={handleTypedSubmit}
            feedback={feedback}
            expected={current.hiragana}
            inputPlaceholder="Gõ hiragana..."
          />
        )}

        {mode === "kanji" && kanjiDirection === "xuoi" && (
          <TypedQuestionView
            heading="Từ cách đọc và nghĩa, viết lại kanji"
            prompt={
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-jp text-3xl text-sumi">{current.hiragana}</p>
                  <SpeakerButton hiragana={current.hiragana} audioUrl={current.audio_url} />
                </div>
                <p className="text-sumi-soft">{current.meaning}</p>
              </div>
            }
            inputValue={inputValue}
            onInputChange={setInputValue}
            onSubmit={handleTypedSubmit}
            feedback={feedback}
            expected={current.kanji ?? ""}
            inputPlaceholder="Gõ kanji..."
            inputClassName="font-jp text-xl"
          />
        )}

        {mode === "kanji" && kanjiDirection === "nguoc" && (
          <TypedQuestionView
            heading="Chỉ có nghĩa — viết lại kanji (không gợi ý cách đọc)"
            prompt={<p className="text-xl text-sumi">{current.meaning}</p>}
            inputValue={inputValue}
            onInputChange={setInputValue}
            onSubmit={handleTypedSubmit}
            feedback={feedback}
            expected={current.kanji ?? ""}
            inputPlaceholder="Gõ kanji..."
            inputClassName="font-jp text-xl"
          />
        )}

        {feedback !== "idle" && (
          <div className="mt-6 flex items-center justify-between gap-4">
            <p
              className={`text-sm font-semibold ${
                feedback === "correct" ? "text-ai" : "text-beni-deep"
              }`}
            >
              {feedback === "correct" ? "Chính xác!" : "Chưa đúng."}
            </p>
            <button
              type="button"
              onClick={() => goNext(feedback === "correct")}
              className="rounded-full bg-ai px-5 py-2 text-sm font-semibold text-washi transition hover:bg-ai-deep"
            >
              {isLast ? "Xem kết quả" : "Câu tiếp theo"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function HeadwordCells({ word }: { word: string }) {
  const chars = Array.from(word);
  return (
    <div className="flex gap-1.5">
      {chars.map((ch, i) => (
        <div
          key={i}
          className="kanji-cell flex h-14 w-14 items-center justify-center rounded-sm font-jp text-3xl text-sumi"
        >
          {ch}
        </div>
      ))}
    </div>
  );
}

function McQuestionView({
  question,
  selectedOption,
  feedback,
  onSelect,
}: {
  question: McQuestion;
  selectedOption: number | null;
  feedback: "idle" | "correct" | "wrong";
  onSelect: (i: number) => void;
}) {
  const { vocab, direction, options, correctIndex } = question;

  return (
    <div>
      <p className="text-sm text-sumi-soft">
        {direction === "word-to-meaning" ? "Từ này có nghĩa là gì?" : "Từ nào có nghĩa dưới đây?"}
      </p>

      <div className="mt-3">
        {direction === "word-to-meaning" ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <HeadwordCells word={headword(vocab)} />
              <SpeakerButton hiragana={vocab.hiragana} audioUrl={vocab.audio_url} />
            </div>
            {vocab.romaji && <p className="mt-1 text-sm text-sumi-soft">{vocab.romaji}</p>}
          </div>
        ) : (
          <p className="text-xl text-sumi">{vocab.meaning}</p>
        )}
      </div>

      <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
        {options.map((opt, i) => {
          const isSelected = selectedOption === i;
          const isCorrectOpt = feedback !== "idle" && i === correctIndex;
          const isWrongSelected = feedback !== "idle" && isSelected && i !== correctIndex;

          let cls =
            "rounded-lg border px-4 py-3 text-left text-sm transition border-line hover:border-ai";
          if (isCorrectOpt) cls = "rounded-lg border-2 border-ai bg-ai/10 px-4 py-3 text-left text-sm text-ai-deep";
          else if (isWrongSelected) cls = "rounded-lg border-2 border-beni bg-beni/10 px-4 py-3 text-left text-sm text-beni-deep";

          return (
            <button
              key={i}
              type="button"
              disabled={feedback !== "idle"}
              onClick={() => onSelect(i)}
              className={`${cls} ${direction === "meaning-to-word" ? "font-jp text-lg" : ""}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TypedQuestionView({
  heading,
  prompt,
  hint,
  inputValue,
  onInputChange,
  onSubmit,
  feedback,
  expected,
  inputPlaceholder,
  inputClassName = "",
}: {
  heading: string;
  prompt: React.ReactNode;
  hint?: string;
  inputValue: string;
  onInputChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  feedback: "idle" | "correct" | "wrong";
  expected: string;
  inputPlaceholder: string;
  inputClassName?: string;
}) {
  return (
    <div>
      <p className="text-sm text-sumi-soft">{heading}</p>
      <div className="mt-3">{prompt}</div>
      {hint && <p className="mt-2 text-sumi-soft">{hint}</p>}

      <form onSubmit={onSubmit} className="mt-6 flex flex-wrap gap-3">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          disabled={feedback !== "idle"}
          placeholder={inputPlaceholder}
          className={`input max-w-xs ${inputClassName}`}
          autoFocus
        />
        {feedback === "idle" && (
          <button
            type="submit"
            className="rounded-full bg-ai px-5 py-2.5 text-sm font-semibold text-washi transition hover:bg-ai-deep"
          >
            Kiểm tra
          </button>
        )}
      </form>

      {feedback === "wrong" && (
        <p className="mt-3 text-sm text-beni-deep">
          Đáp án đúng: <span className="font-jp text-base">{expected}</span>
        </p>
      )}
    </div>
  );
}
