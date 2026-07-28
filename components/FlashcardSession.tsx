"use client";

import { useMemo, useRef, useState } from "react";
import { headword, type Vocab } from "@/lib/types";
import { shuffle } from "@/lib/practice";
import { filterDuePool, getDueStats, reviewCard, type SrsGrade } from "@/lib/srs";
import SpeakerButton from "@/components/SpeakerButton";
import ReportErrorButton from "@/components/ReportErrorButton";

export type FlashcardReviewMode = "due" | "all";

interface Props {
  pool: Vocab[];
  reviewMode: FlashcardReviewMode;
  questionCount: number;
  onFinish: (result: { known: number; total: number }) => void;
}

const SWIPE_THRESHOLD = 90;

export default function FlashcardSession({ pool, reviewMode, questionCount, onFinish }: Props) {
  const duePool = useMemo(() => filterDuePool(pool), [pool]);
  const stats = useMemo(() => getDueStats(pool), [pool]);

  const sessionPool = reviewMode === "due" ? duePool : pool;

  const words = useMemo(
    () => shuffle(sessionPool).slice(0, Math.min(questionCount, sessionPool.length)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessionPool, questionCount]
  );

  const [index, setIndex] = useState(0);
  const [known, setKnown] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [phase, setPhase] = useState<"idle" | "left" | "right">("idle");

  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const startXRef = useRef(0);

  if (sessionPool.length === 0) {
    return (
      <div className="rounded-xl2 border border-beni/40 bg-beni/5 p-6 text-beni-deep">
        {reviewMode === "due"
          ? "Không có thẻ nào đến hạn ôn hôm nay. Quay lại sau, hoặc đổi sang \"Học tất cả\" ở phần cài đặt."
          : "Chưa có từ vựng nào ở cấp độ này. Hãy chọn cấp độ khác hoặc nạp thêm từ vựng trước."}
      </div>
    );
  }

  const current = words[index];
  const isLast = index === words.length - 1;

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (phase !== "idle") return;
    draggingRef.current = true;
    movedRef.current = false;
    startXRef.current = e.clientX;
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {
      // ignore — pointer capture isn't critical to correctness
    }
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    const dx = e.clientX - startXRef.current;
    if (Math.abs(dx) > 6) movedRef.current = true;
    if (flipped) setDragX(dx);
  }

  function onPointerUp() {
    if (!draggingRef.current) return;
    draggingRef.current = false;

    if (flipped && Math.abs(dragX) > SWIPE_THRESHOLD) {
      commitGrade(dragX > 0 ? "good" : "again");
      return;
    }
    if (flipped) {
      setDragX(0);
      return;
    }
    if (!movedRef.current) {
      setFlipped(true);
    }
  }

  function commitGrade(grade: SrsGrade) {
    setPhase(grade === "good" ? "right" : "left");
    const willBeKnown = grade === "good";
    window.setTimeout(() => {
      reviewCard(current.id, grade);
      const nextKnown = willBeKnown ? known + 1 : known;
      setKnown(nextKnown);
      if (isLast) {
        onFinish({ known: nextKnown, total: words.length });
        return;
      }
      setIndex((i) => i + 1);
      setFlipped(false);
      setDragX(0);
      setPhase("idle");
    }, 220);
  }

  const rotate = dragX / 14;
  const cardStyle: React.CSSProperties =
    phase === "idle"
      ? {
          transform: `translateX(${dragX}px) rotate(${rotate}deg)`,
          transition: draggingRef.current ? "none" : "transform 0.25s ease",
        }
      : {
          transform: `translateX(${phase === "right" ? 640 : -640}px) rotate(${
            phase === "right" ? 22 : -22
          }deg)`,
          transition: "transform 0.22s ease, opacity 0.22s ease",
          opacity: 0,
        };

  const knownOverlay = Math.min(1, Math.max(0, dragX - 24) / SWIPE_THRESHOLD);
  const unknownOverlay = Math.min(1, Math.max(0, -dragX - 24) / SWIPE_THRESHOLD);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium tracking-wide text-sumi-soft lg:text-base">
          Thẻ {index + 1}/{words.length} · Đã thuộc {known}
        </p>
        {reviewMode === "due" && (
          <p className="text-xs text-sumi-soft sm:text-sm">
            Hôm nay: {stats.newCount} thẻ mới · {stats.dueCount} thẻ đến hạn
          </p>
        )}
      </div>

      <div className="relative mt-4" style={{ perspective: 1400 }}>
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="relative mx-auto h-72 max-w-md cursor-grab touch-pan-y select-none active:cursor-grabbing sm:h-80 lg:h-96 lg:max-w-lg"
          style={cardStyle}
        >
          {/* Nhãn nổi khi đang vuốt */}
          <div
            className="hanko-mark pointer-events-none absolute left-4 top-4 z-10 px-3 py-1 text-sm font-semibold"
            style={{ opacity: knownOverlay }}
          >
            ĐÃ THUỘC
          </div>
          <div
            className="pointer-events-none absolute right-4 top-4 z-10 rounded-md border-2 border-sumi-soft px-3 py-1 text-sm font-semibold text-sumi-soft"
            style={{ opacity: unknownOverlay }}
          >
            CHƯA THUỘC
          </div>

          <div
            className="relative h-full w-full"
            style={{
              transformStyle: "preserve-3d",
              transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
              transition: "transform 0.45s",
            }}
          >
            {/* Mặt trước */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl2 border border-line/70 bg-washi/80 p-6 text-center shadow-card sm:p-8 lg:p-10"
              style={{ backfaceVisibility: "hidden" }}
            >
              <span className="rounded-full bg-ai/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ai-deep sm:text-sm">
                {current.jlpt_level.toUpperCase()}
              </span>
              <p className="font-jp text-5xl text-sumi sm:text-6xl lg:text-7xl">{headword(current)}</p>
              <div onPointerDown={(e) => e.stopPropagation()}>
                <SpeakerButton hiragana={current.hiragana} audioUrl={current.audio_url} />
              </div>
              <p className="text-xs text-sumi-soft sm:text-sm">Chạm vào thẻ để lật xem nghĩa</p>
            </div>

            {/* Mặt sau */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 overflow-y-auto rounded-xl2 border border-line/70 bg-washi-deep/70 p-6 text-center shadow-card sm:p-8 lg:p-10"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              {current.kanji && current.kanji.trim() && (
                <div
                  className="flex items-center gap-2"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <p className="font-jp text-2xl text-sumi sm:text-3xl lg:text-4xl">{current.hiragana}</p>
                  <SpeakerButton hiragana={current.hiragana} audioUrl={current.audio_url} size="sm" />
                </div>
              )}
              {current.romaji && <p className="text-sm text-sumi-soft sm:text-base lg:text-lg">{current.romaji}</p>}
              <p className="mt-1 text-xl font-semibold text-ai-deep sm:text-2xl lg:text-3xl">{current.meaning}</p>
              {current.example_jp && (
                <div className="mt-3 border-t border-line/60 pt-3 text-sm sm:text-base">
                  <p className="font-jp text-lg text-sumi sm:text-xl lg:text-2xl">{current.example_jp}</p>
                  {current.example_romaji && (
                    <p className="mt-0.5 text-sumi-soft">{current.example_romaji}</p>
                  )}
                  {current.example_vi && <p className="mt-0.5 text-sumi-soft">{current.example_vi}</p>}
                </div>
              )}
            </div>
          </div>

          {/* Nút báo lỗi — đứng ngoài khối lật (rotateY) nên luôn hiển thị
              cố định ở góc thẻ dù đang ở mặt trước hay mặt sau. Chặn
              pointerdown lan lên thẻ để không bị coi là thao tác vuốt/lật. */}
          <div
            className="absolute bottom-3 right-3 z-20"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <ReportErrorButton vocab={current} />
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-center gap-3">
        <button
          type="button"
          disabled={!flipped || phase !== "idle"}
          onClick={() => commitGrade("again")}
          className="rounded-full border border-sumi-soft px-5 py-2.5 text-sm font-semibold text-sumi-soft transition hover:border-beni hover:text-beni-deep disabled:cursor-not-allowed disabled:opacity-40 lg:px-7 lg:py-3 lg:text-base"
        >
          👈 Chưa thuộc
        </button>
        <button
          type="button"
          disabled={!flipped || phase !== "idle"}
          onClick={() => commitGrade("good")}
          className="rounded-full bg-ai px-5 py-2.5 text-sm font-semibold text-washi transition hover:bg-ai-deep disabled:cursor-not-allowed disabled:opacity-40 lg:px-7 lg:py-3 lg:text-base"
        >
          Đã thuộc 👉
        </button>
      </div>
      <p className="mt-3 text-center text-xs text-sumi-soft">
        Sau khi lật thẻ: vuốt trái/phải hoặc bấm nút để đánh giá — hệ thống sẽ tự giãn cách lần ôn tiếp theo giống Anki.
      </p>
    </div>
  );
}
