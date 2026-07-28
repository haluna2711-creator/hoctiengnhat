"use client";

import { useEffect, useMemo, useState } from "react";
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
type FeedbackState = "idle" | "correct" | "wrong" | "timeout";

/** Số giây tối đa cho mỗi câu — hết giờ mà chưa trả lời sẽ tự tính là sai. */
const TIME_LIMIT_SECONDS = 20;
/** Độ trễ trước khi tự động sang câu kế tiếp khi bật "Tự động chuyển câu". */
const AUTO_ADVANCE_DELAY_MS = 1300;

interface Props {
  pool: Vocab[];
  mode: ScoredPracticeMode;
  kanjiDirection: KanjiDirection;
  questionCount: number;
  autoAdvance: boolean;
  countdownEnabled: boolean;
  onFinish: (result: { correct: number; total: number }) => void;
}

export default function PracticeSession({
  pool,
  mode,
  kanjiDirection,
  questionCount,
  autoAdvance,
  countdownEnabled,
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
  const [feedback, setFeedback] = useState<FeedbackState>("idle");
  const [inputValue, setInputValue] = useState("");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT_SECONDS);

  // Đếm ngược cho câu hiện tại (chỉ chạy khi bật "Đếm ngược 20 giây" ở setup).
  // Dừng khi đã có feedback (đã trả lời hoặc đã hết giờ); khi chạm 0 mà vẫn
  // đang "idle" thì chuyển sang "timeout".
  useEffect(() => {
    if (!countdownEnabled) return;
    if (feedback !== "idle") return;
    if (timeLeft <= 0) {
      setFeedback("timeout");
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, feedback, countdownEnabled]);

  // Tự động chuyển câu (nếu bật) sau khi đã có kết quả — đúng, sai, hoặc hết giờ.
  useEffect(() => {
    if (!autoAdvance) return;
    if (feedback === "idle") return;
    const wasCorrect = feedback === "correct";
    const t = setTimeout(() => goNext(wasCorrect), AUTO_ADVANCE_DELAY_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedback, autoAdvance]);

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
    setTimeLeft(TIME_LIMIT_SECONDS);
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
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium tracking-wide text-sumi-soft lg:text-base">{progressLabel}</p>
        {countdownEnabled && feedback === "idle" && (
          <span
            className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold tabular-nums lg:px-4 lg:py-1.5 lg:text-sm ${
              timeLeft <= 5
                ? "border-beni bg-beni/10 text-beni-deep"
                : "border-line text-sumi-soft"
            }`}
          >
            ⏱ {timeLeft}s
          </span>
        )}
      </div>

      <div className="mt-4 rounded-xl2 border border-line/70 bg-washi/70 p-6 shadow-card sm:p-10 lg:mt-6 lg:p-14">
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
          <div className="mt-6 flex items-center justify-between gap-4 lg:mt-8">
            <p
              className={`text-sm font-semibold lg:text-base ${
                feedback === "correct" ? "text-midori-deep" : "text-beni-deep"
              }`}
            >
              {feedback === "correct"
                ? "Chính xác!"
                : feedback === "timeout"
                  ? "Hết giờ! Tính là sai."
                  : "Chưa đúng."}
              {autoAdvance && (
                <span className="ml-2 font-normal text-sumi-soft">Đang chuyển câu...</span>
              )}
            </p>
            <button
              type="button"
              onClick={() => goNext(feedback === "correct")}
              className="rounded-full bg-ai px-5 py-2 text-sm font-semibold text-washi transition hover:bg-ai-deep lg:px-7 lg:py-3 lg:text-base"
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
  const cellSizeClass =
    chars.length > 12
      ? "h-11 w-11 text-xl sm:h-12 sm:w-12 sm:text-2xl"
      : chars.length > 8
        ? "h-12 w-12 text-2xl sm:h-14 sm:w-14 sm:text-3xl"
        : chars.length > 5
          ? "h-14 w-14 text-3xl sm:h-16 sm:w-16 sm:text-4xl"
          : "h-16 w-16 text-4xl sm:h-20 sm:w-20 sm:text-5xl";

  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {chars.map((ch, i) => (
        <div
          key={i}
          className={`kanji-cell flex shrink-0 items-center justify-center rounded-sm font-jp text-sumi ${cellSizeClass}`}
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
  feedback: "idle" | "correct" | "wrong" | "timeout";
  onSelect: (i: number) => void;
}) {
  const { vocab, direction, options, correctIndex } = question;

  return (
    <div>
      <p className="text-sm text-sumi-soft sm:text-base lg:text-lg">
        {direction === "word-to-meaning" ? "Từ này có nghĩa là gì?" : "Từ nào có nghĩa dưới đây?"}
      </p>

      <div className="mt-3">
        {direction === "word-to-meaning" ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <HeadwordCells word={headword(vocab)} />
              <SpeakerButton hiragana={vocab.hiragana} audioUrl={vocab.audio_url} />
            </div>
          </div>
        ) : (
          <p className="text-2xl text-sumi sm:text-3xl lg:text-4xl">{vocab.meaning}</p>
        )}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:gap-5">
        {options.map((opt, i) => {
          const isSelected = selectedOption === i;
          const isCorrectOpt = feedback !== "idle" && i === correctIndex;
          const isWrongSelected = feedback !== "idle" && isSelected && i !== correctIndex;

          let cls =
            "flex min-h-[64px] items-center justify-between gap-3 rounded-xl border px-5 py-4 text-left text-base transition border-line hover:border-ai sm:min-h-[76px] sm:px-6 sm:text-lg lg:min-h-[88px] lg:px-8 lg:text-xl";
          if (isCorrectOpt)
            cls =
              "flex min-h-[64px] items-center justify-between gap-3 rounded-xl border-2 border-midori bg-midori/10 px-5 py-4 text-left text-base font-medium text-midori-deep sm:min-h-[76px] sm:px-6 sm:text-lg lg:min-h-[88px] lg:px-8 lg:text-xl";
          else if (isWrongSelected)
            cls =
              "flex min-h-[64px] items-center justify-between gap-3 rounded-xl border-2 border-beni bg-beni/10 px-5 py-4 text-left text-base font-medium text-beni-deep sm:min-h-[76px] sm:px-6 sm:text-lg lg:min-h-[88px] lg:px-8 lg:text-xl";

          return (
            <button
              key={i}
              type="button"
              disabled={feedback !== "idle"}
              onClick={() => onSelect(i)}
              className={`${cls} ${direction === "meaning-to-word" ? "font-jp text-xl sm:text-2xl lg:text-3xl" : ""}`}
            >
              <span>{opt}</span>
              {isCorrectOpt && (
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-midori text-sm text-washi sm:h-7 sm:w-7 lg:h-8 lg:w-8">
                  ✓
                </span>
              )}
              {isWrongSelected && (
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-beni text-sm text-washi sm:h-7 sm:w-7 lg:h-8 lg:w-8">
                  ✗
                </span>
              )}
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
  feedback: "idle" | "correct" | "wrong" | "timeout";
  expected: string;
  inputPlaceholder: string;
  inputClassName?: string;
}) {
  return (
    <div>
      <p className="text-sm text-sumi-soft lg:text-base">{heading}</p>
      <div className="mt-3 lg:text-lg">{prompt}</div>
      {hint && <p className="mt-2 text-sumi-soft lg:text-lg">{hint}</p>}

      <form onSubmit={onSubmit} className="mt-6 flex flex-wrap gap-3 lg:gap-4">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          disabled={feedback !== "idle"}
          placeholder={inputPlaceholder}
          className={`input max-w-xs lg:max-w-sm lg:py-3.5 lg:text-lg ${inputClassName}`}
          autoFocus
        />
        {feedback === "idle" && (
          <button
            type="submit"
            className="rounded-full bg-ai px-5 py-2.5 text-sm font-semibold text-washi transition hover:bg-ai-deep lg:px-7 lg:py-3.5 lg:text-base"
          >
            Kiểm tra
          </button>
        )}
      </form>

      {(feedback === "wrong" || feedback === "timeout") && (
        <p className="mt-3 text-sm text-beni-deep lg:text-base">
          Đáp án đúng: <span className="font-jp text-base lg:text-lg">{expected}</span>
        </p>
      )}
    </div>
  );
}
