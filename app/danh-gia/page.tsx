"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { JLPT_LEVELS, type Vocab } from "@/lib/types";
import { fetchVocabForPractice } from "@/lib/vocab";
import { getMasteryStats, type MasteryStats } from "@/lib/srs";
import {
  clearHistory,
  getHistory,
  getStreakDays,
  type HistoryMode,
  type PracticeHistoryEntry,
} from "@/lib/practiceHistory";

const MODE_LABELS: Record<HistoryMode, string> = {
  mc: "Trắc nghiệm",
  hiragana: "Nhập hiragana",
  kanji: "Viết kanji",
  flashcard: "Flashcard",
  match: "Ghép từ",
};

function levelLabel(level: PracticeHistoryEntry["level"]): string {
  if (level === "all") return "Tất cả";
  return JLPT_LEVELS.find((l) => l.value === level)?.label ?? level;
}

/** Độ chính xác quy về %, tính riêng cho Ghép từ vì chế độ này luôn
 * hoàn thành hết cặp — "sai" ở đây là số lần chọn nhầm dọc đường. */
function entryAccuracy(e: PracticeHistoryEntry): number {
  if (e.mode === "match") {
    const attempts = e.total + (e.mistakes ?? 0);
    return attempts > 0 ? (e.total / attempts) * 100 : 100;
  }
  return e.total > 0 ? (e.correct / e.total) * 100 : 0;
}

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function DanhGiaPage() {
  const [pool, setPool] = useState<Vocab[] | null>(null);
  const [poolError, setPoolError] = useState<string | null>(null);
  const [history, setHistory] = useState<PracticeHistoryEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHistory(getHistory());
    setHydrated(true);

    fetchVocabForPractice("all")
      .then(setPool)
      .catch(() =>
        setPoolError(
          "Không tải được từ vựng để tính mức độ thuộc bài. Lịch sử luyện tập bên dưới vẫn hiển thị bình thường."
        )
      );
  }, []);

  const mastery: MasteryStats | null = useMemo(() => {
    if (!pool) return null;
    return getMasteryStats(pool);
  }, [pool]);

  const streak = useMemo(() => getStreakDays(history), [history]);

  const recentChart = useMemo(() => {
    // history đã sắp xếp mới nhất trước — đảo lại để biểu đồ đọc trái
    // sang phải theo thời gian, lấy 10 lượt gần nhất.
    return history
      .slice(0, 10)
      .slice()
      .reverse()
      .map((e) => ({ entry: e, pct: entryAccuracy(e) }));
  }, [history]);

  const averageAccuracy = useMemo(() => {
    const recent = history.slice(0, 10);
    if (recent.length === 0) return null;
    const sum = recent.reduce((acc, e) => acc + entryAccuracy(e), 0);
    return Math.round(sum / recent.length);
  }, [history]);

  function handleClearHistory() {
    if (!window.confirm("Xoá toàn bộ lịch sử luyện tập trên trình duyệt này? Không thể hoàn tác."))
      return;
    clearHistory();
    setHistory([]);
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="font-display text-3xl text-sumi">Đánh giá</h1>
      <p className="mt-2 text-sm text-sumi-soft">
        Toàn bộ dữ liệu bên dưới được lưu ngay trên trình duyệt này (localStorage) — không đăng
        nhập, không đồng bộ giữa các thiết bị. Xoá dữ liệu trình duyệt sẽ mất luôn thống kê này.
      </p>

      {!hydrated && <p className="mt-8 text-sumi-soft">Đang tải...</p>}

      {hydrated && (
        <div className="mt-8 space-y-10">
          {/* Mức độ thuộc từ vựng */}
          <section>
            <h2 className="text-sm font-semibold text-sumi">Mức độ thuộc từ vựng</h2>
            {poolError && (
              <p className="mt-2 rounded-lg border border-beni/40 bg-beni/5 px-4 py-3 text-sm text-beni-deep">
                {poolError}
              </p>
            )}
            {!poolError && !mastery && (
              <p className="mt-3 text-sm text-sumi-soft">Đang tải dữ liệu từ vựng...</p>
            )}
            {mastery && (
              <>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  <StatCard
                    label="Chưa học"
                    value={mastery.notStarted}
                    colorClass="text-sumi-soft"
                  />
                  <StatCard label="Đang học" value={mastery.learning} colorClass="text-kin" />
                  <StatCard
                    label="Đã thuộc"
                    value={mastery.mastered}
                    colorClass="text-midori-deep"
                  />
                </div>
                <div className="mt-3 flex h-3 overflow-hidden rounded-full border border-line/70">
                  <div
                    className="bg-sumi-soft/30"
                    style={{ width: `${(mastery.notStarted / Math.max(1, mastery.total)) * 100}%` }}
                  />
                  <div
                    className="bg-kin"
                    style={{ width: `${(mastery.learning / Math.max(1, mastery.total)) * 100}%` }}
                  />
                  <div
                    className="bg-midori"
                    style={{ width: `${(mastery.mastered / Math.max(1, mastery.total)) * 100}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-sumi-soft">
                  Tổng {mastery.total} từ vựng · "Đã thuộc" là các từ đã ôn flashcard với khoảng
                  lặp từ 21 ngày trở lên (kiểu thẻ "mature" của Anki).
                </p>
              </>
            )}
          </section>

          {/* Hoạt động luyện tập */}
          <section>
            <h2 className="text-sm font-semibold text-sumi">Hoạt động luyện tập</h2>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <StatCard label="Chuỗi ngày liên tiếp" value={streak} suffix=" ngày" />
              <StatCard label="Tổng số lượt" value={history.length} />
              <StatCard
                label="Chính xác TB (10 lượt gần nhất)"
                value={averageAccuracy ?? 0}
                suffix="%"
                muted={averageAccuracy === null}
              />
            </div>

            {recentChart.length > 0 && (
              <div className="mt-6">
                <p className="mb-2 text-xs text-sumi-soft">
                  Độ chính xác — {recentChart.length} lượt gần nhất (cũ → mới)
                </p>
                <div className="flex h-28 items-end gap-1.5 rounded-xl2 border border-line/70 bg-washi/70 p-3">
                  {recentChart.map(({ entry, pct }) => (
                    <div
                      key={entry.id}
                      className="group relative flex-1"
                      title={`${MODE_LABELS[entry.mode]} · ${Math.round(pct)}%`}
                    >
                      <div
                        className={`w-full rounded-t-sm ${
                          pct >= 80 ? "bg-midori" : pct >= 50 ? "bg-kin" : "bg-beni"
                        }`}
                        style={{ height: `${Math.max(4, pct)}%` }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Lịch sử gần đây */}
          <section>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-sumi">Lịch sử gần đây</h2>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="text-xs font-medium text-beni-deep transition hover:underline"
                >
                  Xoá lịch sử
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="mt-3 rounded-xl2 border border-line/70 bg-washi/70 p-6 text-center text-sm text-sumi-soft">
                Chưa có lượt luyện tập nào được ghi nhận.{" "}
                <Link href="/luyen-tap" className="font-semibold text-ai hover:underline">
                  Bắt đầu luyện tập
                </Link>{" "}
                để bắt đầu theo dõi tiến độ.
              </div>
            ) : (
              <div className="mt-3 divide-y divide-line/70 overflow-hidden rounded-xl2 border border-line/70">
                {history.slice(0, 30).map((e) => {
                  const pct = Math.round(entryAccuracy(e));
                  return (
                    <div
                      key={e.id}
                      className="flex flex-wrap items-center justify-between gap-2 bg-washi/70 px-4 py-3 text-sm"
                    >
                      <div>
                        <p className="font-medium text-sumi">
                          {MODE_LABELS[e.mode]}{" "}
                          <span className="font-normal text-sumi-soft">
                            · {levelLabel(e.level)}
                          </span>
                        </p>
                        <p className="text-xs text-sumi-soft">{formatRelativeTime(e.timestamp)}</p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-semibold ${
                            pct >= 80 ? "text-midori-deep" : pct >= 50 ? "text-kin" : "text-beni-deep"
                          }`}
                        >
                          {e.mode === "match" ? `${e.total} cặp` : `${e.correct}/${e.total}`} ·{" "}
                          {pct}%
                        </p>
                        {e.mode === "match" && (
                          <p className="text-xs text-sumi-soft">
                            Sai {e.mistakes ?? 0} lần
                            {typeof e.timeMs === "number" ? ` · ${formatDuration(e.timeMs)}` : ""}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix = "",
  colorClass = "text-sumi",
  muted = false,
}: {
  label: string;
  value: number;
  suffix?: string;
  colorClass?: string;
  muted?: boolean;
}) {
  return (
    <div className="rounded-xl2 border border-line/70 bg-washi/70 p-4 text-center">
      <p className={`font-display text-2xl ${muted ? "text-sumi-soft" : colorClass}`}>
        {muted ? "—" : `${value}${suffix}`}
      </p>
      <p className="mt-1 text-xs text-sumi-soft">{label}</p>
    </div>
  );
}
