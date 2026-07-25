"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { JLPT_LEVELS, type JlptLevel, type Vocab } from "@/lib/types";
import { fetchVocabForPractice } from "@/lib/vocab";
import PracticeSession, {
  type KanjiDirection,
  type PracticeMode,
} from "@/components/PracticeSession";
import FlashcardSession, { type FlashcardReviewMode } from "@/components/FlashcardSession";
import MatchSession from "@/components/MatchSession";

type Stage = "setup" | "loading" | "playing" | "summary";

type SessionResult =
  | { kind: "score"; correct: number; total: number }
  | { kind: "flashcard"; known: number; total: number }
  | { kind: "match"; pairs: number; timeMs: number; mistakes: number };

const QUESTION_COUNT_OPTIONS = [10, 20, 30];

const MODES: { value: PracticeMode; title: string; desc: string; sample: string }[] = [
  {
    value: "mc",
    title: "Trắc nghiệm",
    desc: "Chọn đáp án đúng trong các lựa chọn.",
    sample: "A",
  },
  {
    value: "hiragana",
    title: "Nhập hiragana",
    desc: "Gõ lại cách đọc của từ.",
    sample: "あ",
  },
  {
    value: "kanji",
    title: "Viết kanji",
    desc: "Gõ lại kanji — chọn chiều xuôi hoặc ngược bên dưới.",
    sample: "字",
  },
  {
    value: "flashcard",
    title: "Flashcard",
    desc: "Lật thẻ xem nghĩa, vuốt để đánh dấu đã thuộc hay chưa.",
    sample: "捲",
  },
  {
    value: "match",
    title: "Ghép từ",
    desc: "Ghép nhanh từ với nghĩa tương ứng, tính giờ và số lần sai.",
    sample: "合",
  },
];

function countLabelFor(mode: PracticeMode): string {
  if (mode === "flashcard") return "Số thẻ";
  if (mode === "match") return "Số từ";
  return "Số câu";
}

function LuyenTapInner() {
  const searchParams = useSearchParams();
  const levelFromUrl = searchParams.get("level") as JlptLevel | null;

  const [stage, setStage] = useState<Stage>("setup");
  const [level, setLevel] = useState<JlptLevel | "all">(levelFromUrl ?? "all");
  const [mode, setMode] = useState<PracticeMode>("mc");
  const [kanjiDirection, setKanjiDirection] = useState<KanjiDirection>("xuoi");
  const [flashcardReviewMode, setFlashcardReviewMode] = useState<FlashcardReviewMode>("due");
  const [questionCount, setQuestionCount] = useState(10);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [countdownEnabled, setCountdownEnabled] = useState(true);
  const [pool, setPool] = useState<Vocab[]>([]);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sessionKey, setSessionKey] = useState(0);

  async function handleStart() {
    setStage("loading");
    setErrorMsg(null);
    try {
      const data = await fetchVocabForPractice(level);
      setPool(data);
      if (data.length === 0) {
        setErrorMsg(
          "Chưa có từ vựng nào ở cấp độ này. Hãy chọn cấp độ khác hoặc nạp thêm từ vựng trước."
        );
        setStage("setup");
        return;
      }
      setSessionKey((k) => k + 1);
      setStage("playing");
    } catch {
      setErrorMsg(
        "Không tải được từ vựng. Kiểm tra lại cấu hình Supabase (NEXT_PUBLIC_SUPABASE_URL / ANON_KEY)."
      );
      setStage("setup");
    }
  }

  function handleScoreFinish(r: { correct: number; total: number }) {
    setResult({ kind: "score", ...r });
    setStage("summary");
  }

  function handleFlashcardFinish(r: { known: number; total: number }) {
    setResult({ kind: "flashcard", ...r });
    setStage("summary");
  }

  function handleMatchFinish(r: { pairs: number; timeMs: number; mistakes: number }) {
    setResult({ kind: "match", ...r });
    setStage("summary");
  }

  function handleReplay() {
    setSessionKey((k) => k + 1);
    setStage("playing");
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="font-display text-3xl text-sumi">Luyện tập</h1>

      {stage === "setup" && (
        <div className="mt-6 space-y-8">
          {errorMsg && (
            <p className="rounded-lg border border-beni/40 bg-beni/5 px-4 py-3 text-sm text-beni-deep">
              {errorMsg}
            </p>
          )}

          <div>
            <p className="mb-3 text-sm font-semibold text-sumi">Cấp độ</p>
            <div className="flex flex-wrap gap-2">
              <Chip active={level === "all"} onClick={() => setLevel("all")}>
                Tất cả
              </Chip>
              {JLPT_LEVELS.map((lvl) => (
                <Chip key={lvl.value} active={level === lvl.value} onClick={() => setLevel(lvl.value)}>
                  {lvl.label}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-sumi">Chế độ luyện tập</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {MODES.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMode(m.value)}
                  className={`rounded-xl2 border p-4 text-left transition ${
                    mode === m.value
                      ? "border-ai bg-ai/5"
                      : "border-line hover:border-ai/50"
                  }`}
                >
                  <span className="kanji-cell flex h-10 w-10 items-center justify-center rounded-sm font-jp text-lg text-ai">
                    {m.sample}
                  </span>
                  <p className="mt-2 font-display text-base text-sumi">{m.title}</p>
                  <p className="mt-1 text-xs text-sumi-soft">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {mode === "kanji" && (
            <div>
              <p className="mb-3 text-sm font-semibold text-sumi">Chiều luyện viết kanji</p>
              <div className="flex flex-wrap gap-2">
                <Chip active={kanjiDirection === "xuoi"} onClick={() => setKanjiDirection("xuoi")}>
                  Xuôi — có gợi ý cách đọc
                </Chip>
                <Chip active={kanjiDirection === "nguoc"} onClick={() => setKanjiDirection("nguoc")}>
                  Ngược — chỉ có nghĩa
                </Chip>
              </div>
            </div>
          )}

          {mode === "flashcard" && (
            <div>
              <p className="mb-3 text-sm font-semibold text-sumi">Chế độ ôn tập</p>
              <div className="flex flex-wrap gap-2">
                <Chip
                  active={flashcardReviewMode === "due"}
                  onClick={() => setFlashcardReviewMode("due")}
                >
                  Đến hạn hôm nay (kiểu Anki)
                </Chip>
                <Chip
                  active={flashcardReviewMode === "all"}
                  onClick={() => setFlashcardReviewMode("all")}
                >
                  Học tất cả
                </Chip>
              </div>
              <p className="mt-2 text-xs text-sumi-soft">
                "Đến hạn hôm nay" chỉ lấy thẻ mới hoặc thẻ đã tới ngày ôn lại theo lịch ghi nhớ
                giãn cách. Sau khi lật thẻ, vuốt phải (hoặc bấm "Đã thuộc") khi nhớ được, vuốt trái
                (hoặc bấm "Chưa thuộc") khi chưa nhớ — hệ thống tự tính lịch ôn tiếp theo, giống
                Anki.
              </p>
            </div>
          )}

          {mode !== "flashcard" && (
            <div>
              <p className="mb-3 text-sm font-semibold text-sumi">Kiểm tra (đếm ngược 20 giây)</p>
              <div className="flex flex-wrap gap-2">
                <Chip active={countdownEnabled} onClick={() => setCountdownEnabled(true)}>
                  Bật — giới hạn 20 giây
                </Chip>
                <Chip active={!countdownEnabled} onClick={() => setCountdownEnabled(false)}>
                  Tắt — không giới hạn giờ
                </Chip>
              </div>
              <p className="mt-2 text-xs text-sumi-soft">
                {mode === "match"
                  ? "Mỗi vòng có 20 giây cho mỗi cặp từ. Hết giờ mà chưa ghép xong, các cặp còn lại sẽ tự tính là sai và chuyển sang vòng tiếp theo."
                  : "Mỗi câu có 20 giây để trả lời. Hết giờ mà chưa chọn đáp án sẽ tự động tính là sai và chuyển sang câu tiếp theo."}
              </p>
            </div>
          )}

          {(mode === "mc" || mode === "hiragana" || mode === "kanji") && (
            <div>
              <p className="mb-3 text-sm font-semibold text-sumi">Tự động chuyển câu</p>
              <div className="flex flex-wrap gap-2">
                <Chip active={autoAdvance} onClick={() => setAutoAdvance(true)}>
                  Bật — tự chuyển sau khi trả lời
                </Chip>
                <Chip active={!autoAdvance} onClick={() => setAutoAdvance(false)}>
                  Tắt — tự bấm "Câu tiếp theo"
                </Chip>
              </div>
              <p className="mt-2 text-xs text-sumi-soft">
                Sau khi có kết quả (đúng/sai/hết giờ), tự động sang câu tiếp theo mà không cần bấm nút.
              </p>
            </div>
          )}

          <div>
            <p className="mb-3 text-sm font-semibold text-sumi">{countLabelFor(mode)}</p>
            <div className="flex flex-wrap gap-2">
              {QUESTION_COUNT_OPTIONS.map((n) => (
                <Chip key={n} active={questionCount === n} onClick={() => setQuestionCount(n)}>
                  {n}
                </Chip>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleStart}
            className="rounded-full bg-ai px-6 py-3 text-sm font-semibold text-washi shadow-card transition hover:bg-ai-deep"
          >
            Bắt đầu
          </button>
        </div>
      )}

      {stage === "loading" && <p className="mt-8 text-sumi-soft">Đang tải từ vựng...</p>}

      {stage === "playing" && (
        <div className="mt-6">
          {(mode === "mc" || mode === "hiragana" || mode === "kanji") && (
            <PracticeSession
              key={sessionKey}
              pool={pool}
              mode={mode}
              kanjiDirection={kanjiDirection}
              questionCount={questionCount}
              autoAdvance={autoAdvance}
              countdownEnabled={countdownEnabled}
              onFinish={handleScoreFinish}
            />
          )}
          {mode === "flashcard" && (
            <FlashcardSession
              key={sessionKey}
              pool={pool}
              reviewMode={flashcardReviewMode}
              questionCount={questionCount}
              onFinish={handleFlashcardFinish}
            />
          )}
          {mode === "match" && (
            <MatchSession
              key={sessionKey}
              pool={pool}
              questionCount={questionCount}
              countdownEnabled={countdownEnabled}
              onFinish={handleMatchFinish}
            />
          )}
        </div>
      )}

      {stage === "summary" && result && (
        <div className="mt-8 rounded-xl2 border border-line/70 bg-washi/70 p-8 text-center shadow-card">
          {result.kind === "score" && (
            <>
              <span className="hanko-mark mx-auto flex h-16 w-16 items-center justify-center font-jp text-2xl">
                {result.correct === result.total ? "満点" : "終"}
              </span>
              <p className="mt-4 font-display text-2xl text-sumi">
                {result.correct} / {result.total} câu đúng
              </p>
              <p className="mt-1 text-sumi-soft">
                {Math.round((result.correct / result.total) * 100)}% chính xác
              </p>
            </>
          )}

          {result.kind === "flashcard" && (
            <>
              <span className="hanko-mark mx-auto flex h-16 w-16 items-center justify-center font-jp text-2xl">
                終
              </span>
              <p className="mt-4 font-display text-2xl text-sumi">
                Đã thuộc {result.known} / {result.total} thẻ
              </p>
              <p className="mt-1 text-sumi-soft">
                {Math.round((result.known / result.total) * 100)}% số thẻ bạn đánh dấu đã thuộc —
                lịch ôn tiếp theo đã được cập nhật.
              </p>
            </>
          )}

          {result.kind === "match" && (
            <>
              <span className="hanko-mark mx-auto flex h-16 w-16 items-center justify-center font-jp text-2xl">
                合
              </span>
              <p className="mt-4 font-display text-2xl text-sumi">
                Ghép xong {result.pairs} cặp từ
              </p>
              <p className="mt-1 text-sumi-soft">
                Thời gian {Math.floor(result.timeMs / 60000)}:
                {String(Math.floor((result.timeMs % 60000) / 1000)).padStart(2, "0")} · Sai{" "}
                {result.mistakes} lần
              </p>
            </>
          )}

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={handleReplay}
              className="rounded-full bg-ai px-5 py-2.5 text-sm font-semibold text-washi transition hover:bg-ai-deep"
            >
              Luyện lại (cùng cài đặt)
            </button>
            <button
              type="button"
              onClick={() => setStage("setup")}
              className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-sumi transition hover:border-ai hover:text-ai"
            >
              Đổi cài đặt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
        active
          ? "border-ai bg-ai text-washi"
          : "border-line text-sumi-soft hover:border-ai hover:text-ai"
      }`}
    >
      {children}
    </button>
  );
}

export default function LuyenTapPage() {
  return (
    <Suspense
      fallback={<div className="mx-auto max-w-3xl px-5 py-12 text-sumi-soft">Đang tải...</div>}
    >
      <LuyenTapInner />
    </Suspense>
  );
}
