"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { headword, type Vocab } from "@/lib/types";
import { chunk, shuffle } from "@/lib/practice";

interface Props {
  pool: Vocab[];
  questionCount: number;
  countdownEnabled: boolean;
  onFinish: (result: { pairs: number; timeMs: number; mistakes: number }) => void;
}

interface CardItem {
  id: string;
  vocabId: string;
  type: "word" | "meaning";
  label: string;
}

const PAIRS_PER_ROUND = 6;
/** Ngân sách thời gian mỗi cặp từ khi bật đếm ngược — hết giờ của cả vòng
 * mà chưa ghép xong sẽ tự tính các cặp còn lại là sai rồi chuyển vòng. */
const TIME_LIMIT_SECONDS_PER_PAIR = 20;

function buildRoundCards(vocabs: Vocab[]): CardItem[] {
  const wordCards: CardItem[] = vocabs.map((v) => ({
    id: `${v.id}-w`,
    vocabId: v.id,
    type: "word",
    label: headword(v),
  }));
  const meaningCards: CardItem[] = vocabs.map((v) => ({
    id: `${v.id}-m`,
    vocabId: v.id,
    type: "meaning",
    label: v.meaning,
  }));
  return shuffle([...wordCards, ...meaningCards]);
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function MatchSession({ pool, questionCount, countdownEnabled, onFinish }: Props) {
  const words = useMemo(
    () => shuffle(pool).slice(0, Math.min(questionCount, pool.length)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pool, questionCount]
  );

  const rounds = useMemo(() => chunk(words, PAIRS_PER_ROUND), [words]);

  const [roundIndex, setRoundIndex] = useState(0);
  const [cards, setCards] = useState<CardItem[]>(() => buildRoundCards(rounds[0] ?? []));
  const [selected, setSelected] = useState<CardItem[]>([]);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [wrongIds, setWrongIds] = useState<Set<string>>(new Set());
  const [mistakes, setMistakes] = useState(0);
  const [locked, setLocked] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [roundTimeLeft, setRoundTimeLeft] = useState(
    (rounds[0]?.length ?? 0) * TIME_LIMIT_SECONDS_PER_PAIR
  );

  const startRef = useRef(Date.now());
  const doneRef = useRef(false);
  const totalMistakesRef = useRef(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (!doneRef.current) setElapsedMs(Date.now() - startRef.current);
    }, 200);
    return () => window.clearInterval(id);
  }, []);

  // Khi chuyển vòng, dựng lại bộ thẻ cho vòng mới.
  useEffect(() => {
    setCards(buildRoundCards(rounds[roundIndex] ?? []));
    setSelected([]);
    setMatchedIds(new Set());
    setWrongIds(new Set());
    setRoundTimeLeft((rounds[roundIndex]?.length ?? 0) * TIME_LIMIT_SECONDS_PER_PAIR);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundIndex]);

  const currentRoundPairCount = rounds[roundIndex]?.length ?? 0;

  // Đếm ngược cho cả vòng (chỉ chạy khi bật "Đếm ngược 20 giây" ở setup).
  // Hết giờ mà vẫn còn cặp chưa ghép sẽ tự tính các cặp đó là sai rồi
  // chuyển sang vòng kế tiếp (hoặc kết thúc nếu là vòng cuối).
  useEffect(() => {
    if (!countdownEnabled) return;
    if (currentRoundPairCount === 0) return;
    if (matchedIds.size === currentRoundPairCount) return; // đã ghép xong, effect khác lo việc chuyển vòng
    if (roundTimeLeft <= 0) {
      const remaining = currentRoundPairCount - matchedIds.size;
      setMistakes((m) => m + remaining);
      totalMistakesRef.current += remaining;
      if (roundIndex + 1 < rounds.length) {
        setRoundIndex((r) => r + 1);
      } else {
        doneRef.current = true;
        onFinish({
          pairs: words.length,
          timeMs: Date.now() - startRef.current,
          mistakes: totalMistakesRef.current,
        });
      }
      return;
    }
    const t = window.setTimeout(() => setRoundTimeLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundTimeLeft, countdownEnabled, currentRoundPairCount, matchedIds]);

  useEffect(() => {
    if (currentRoundPairCount === 0) return;
    if (matchedIds.size !== currentRoundPairCount) return;
    const t = window.setTimeout(() => {
      if (roundIndex + 1 < rounds.length) {
        setRoundIndex((r) => r + 1);
      } else {
        doneRef.current = true;
        onFinish({
          pairs: words.length,
          timeMs: Date.now() - startRef.current,
          mistakes: totalMistakesRef.current,
        });
      }
    }, 500);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchedIds, currentRoundPairCount]);

  if (words.length < 2) {
    return (
      <div className="rounded-xl2 border border-beni/40 bg-beni/5 p-6 text-beni-deep">
        Cần ít nhất 2 từ vựng để chơi ghép từ. Hãy chọn cấp độ khác hoặc nạp thêm từ vựng trước.
      </div>
    );
  }

  function handleClick(card: CardItem) {
    if (locked || matchedIds.has(card.vocabId)) return;
    if (selected.length === 1 && selected[0].id === card.id) return;

    if (selected.length === 0) {
      setSelected([card]);
      return;
    }

    const first = selected[0];
    if (first.vocabId === card.vocabId && first.type !== card.type) {
      setMatchedIds((prev) => new Set(prev).add(card.vocabId));
      setSelected([]);
      return;
    }

    // Sai — highlight đỏ trong chốc lát rồi bỏ chọn.
    setMistakes((m) => m + 1);
    totalMistakesRef.current += 1;
    setWrongIds(new Set([first.id, card.id]));
    setSelected([first, card]);
    setLocked(true);
    window.setTimeout(() => {
      setSelected([]);
      setWrongIds(new Set());
      setLocked(false);
    }, 550);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-medium tracking-wide text-sumi-soft">
        <p>
          Vòng {roundIndex + 1}/{rounds.length}
        </p>
        <div className="flex items-center gap-2">
          {countdownEnabled && (
            <span
              className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold tabular-nums ${
                roundTimeLeft <= 10
                  ? "border-beni bg-beni/10 text-beni-deep"
                  : "border-line text-sumi-soft"
              }`}
            >
              ⏱ {formatTime(roundTimeLeft * 1000)}
            </span>
          )}
          <p>
            Thời gian {formatTime(elapsedMs)} · Sai {mistakes} lần
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3">
        {cards.map((card) => {
          const isMatched = matchedIds.has(card.vocabId);
          const isSelected = selected.some((s) => s.id === card.id);
          const isWrong = wrongIds.has(card.id);

          let cls =
            "rounded-lg border px-3 py-4 text-center text-sm transition min-h-[4.5rem] flex items-center justify-center border-line hover:border-ai";
          if (isMatched) {
            cls =
              "rounded-lg border px-3 py-4 text-center text-sm min-h-[4.5rem] flex items-center justify-center border-ai/30 bg-ai/5 text-ai/40 opacity-0 pointer-events-none transition-opacity duration-300";
          } else if (isWrong) {
            cls =
              "rounded-lg border-2 border-beni bg-beni/10 px-3 py-4 text-center text-sm text-beni-deep min-h-[4.5rem] flex items-center justify-center";
          } else if (isSelected) {
            cls =
              "rounded-lg border-2 border-ai bg-ai/10 px-3 py-4 text-center text-sm text-ai-deep min-h-[4.5rem] flex items-center justify-center";
          }

          return (
            <button
              key={card.id}
              type="button"
              disabled={isMatched}
              onClick={() => handleClick(card)}
              className={`${cls} ${card.type === "word" ? "font-jp text-lg" : ""}`}
            >
              {card.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
