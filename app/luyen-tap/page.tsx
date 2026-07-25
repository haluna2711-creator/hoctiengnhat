"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { JLPT_LEVELS, type JlptLevel, type Vocab } from "@/lib/types";
import { fetchVocabForPractice } from "@/lib/vocab";
import {
  clearHistory,
  getDailyAccuracy,
  getHistory,
  getModeBreakdown,
  getOverallStats,
  MODE_LABELS,
  type DailyAccuracy,
  type ModeBreakdown,
  type OverallStats,
  type SessionRecord,
} from "@/lib/history";
import {
  getMasteryBreakdown,
  getTotalReviewedWords,
  MASTERY_LABELS,
  type MasteryBreakdown,
  type MasteryLevel,
} from "@/lib/srs";

type LevelFilter = JlptLevel | "all";

const MASTERY_ORDER: MasteryLevel[] = ["new", "learning", "young", "mature"];
const MASTERY_COLOR: Record<MasteryLevel, string> = {
  new: "bg-line",
  learning: "bg-beni",
  young: "bg-kin",
  mature: "bg-midori",
};
const MASTERY_TEXT_COLOR: Record<MasteryLevel, string> = {
  new: "text-sumi-soft",
  learning: "text-beni-deep",
  young: "text-kin",
  mature: "text-midori-deep",
};

function formatDateShort(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${d}/${m}`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const dateStr = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
  const timeStr = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${dateStr} · ${timeStr}`;
}

export default function DanhGiaPage() {
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  const [pool, setPool] = useState<Vocab[]>([]);
  const [poolStatus, setPoolStatus] = useState<"loading" | "ready" | "error">("loading");

  const [overall, setOverall] = useState<OverallStats | null>(null);
  const [modeBreakdown, setModeBreakdown] = useState<ModeBreakdown[]>([]);
  const [daily, setDaily] = useState<DailyAccuracy[]>([]);
  const [history, setHistory] = useState<SessionRecord[]>([]);
  const [reviewedWords, setReviewedWords] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  // Dữ liệu localStorage (không phụ thuộc mạng) — đọc lại mỗi khi
  // refreshKey đổi (VD: sau khi bấm "Xoá dữ liệu").
  useEffect(() => {
    setOverall(getOverallStats());
    setModeBreakdown(getModeBreakdown());
    setDaily(getDailyAccuracy(14));
    setHistory(getHistory());
    setReviewedWords(getTotalReviewedWords());
  }, [refreshKey]);

  // Kho từ vựng — chỉ cần để tính phân bố "mức độ thuộc" theo cấp độ
  // JLPT (dữ liệu SRS chỉ lưu theo id từ, cần join với danh sách từ để
  // biết từ nào thuộc cấp độ nào).
  useEffect(() => {
    let cancelled = false;
    setPoolStatus("loading");
    fetchVocabForPractice("all")
      .then((data) => {
        if (cancelled) return;
        setPool(data);
        setPoolStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setPoolStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const filteredPool = useMemo(
    () => (levelFilter === "all" ? pool : pool.filter((v) => v.jlpt_level === levelFilter)),
    [pool, levelFilter]
  );

  const mastery: MasteryBreakdown = useMemo(
    () => getMasteryBreakdown(filteredPool),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredPool, refreshKey]
  );

  const filteredHistory = useMemo(
    () => (levelFilter === "all" ? history : history.filter((r) => r.level === levelFilter)),
    [history, levelFilter]
  );

  const hasAnyData = (overall?.totalSessions ?? 0) > 0 || reviewedWords > 0;
  const maxDailySessions = Math.max(1, ...daily.map((d) => d.sessions));

  function handleClearData() {
    const ok = window.confirm(
      "Xoá toàn bộ dữ liệu luyện tập lưu trên trình duyệt này? Bao gồm lịch sử các buổi luyện tập và tiến độ ôn từ (SRS). Không thể hoàn tác."
    );
    if (!ok) return;
    clearHistory();
    // lib/srs.ts không export riêng hàm xoá — xoá thẳng key nó dùng.
    try {
      window.localStorage.removeItem("htn_srs_v1");
    } catch {
      // ignore
    }
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <h1 className="font-display text-3xl text-sumi">Đánh giá</h1>
      <p className="mt-2 max-w-2xl text-sumi-soft">
        Thống kê tiến độ học tập — điểm số các lần luyện tập và mức độ
        thuộc từ vựng. Toàn bộ dữ liệu lưu ngay trên trình duyệt này,
        không gửi lên máy chủ nào cả.
      </p>

      {!hasAnyData && poolStatus !== "loading" && (
        <div className="mt-8 rounded-xl2 border border-line/70 bg-washi-deep/60 p-8 text-center">
          <p className="text-sumi-soft">
            Chưa có dữ liệu luyện tập nào trên trình duyệt này. Hãy bắt đầu một buổi luyện tập để
            thấy thống kê ở đây.
          </p>
          <Link
            href="/luyen-tap"
            className="mt-5 inline-block rounded-full bg-ai px-6 py-3 text-sm font-semibold text-washi shadow-card transition hover:bg-ai-deep"
          >
            Bắt đầu luyện tập
          </Link>
        </div>
      )}

      {hasAnyData && (
        <>
          {/* Bộ lọc cấp độ */}
          <div className="mt-8 flex flex-wrap gap-2">
            <Chip active={levelFilter === "all"} onClick={() => setLevelFilter("all")}>
              Tất cả
            </Chip>
            {JLPT_LEVELS.map((lvl) => (
              <Chip
                key={lvl.value}
                active={levelFilter === lvl.value}
                onClick={() => setLevelFilter(lvl.value)}
              >
                {lvl.label}
              </Chip>
            ))}
          </div>

          {/* Tổng quan */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              label="Buổi luyện tập"
              value={String(filteredHistory.length)}
              hint="tổng số lần hoàn thành"
            />
            <StatCard
              label="Độ chính xác TB"
              value={`${computeAccuracy(filteredHistory)}%`}
              hint="trên toàn bộ câu/thẻ"
            />
            <StatCard
              label="Chuỗi ngày liên tiếp"
              value={String(overall?.streakDays ?? 0)}
              hint="ngày có luyện tập"
            />
            <StatCard
              label="Từ đã từng ôn"
              value={String(reviewedWords)}
              hint="qua chế độ Flashcard"
            />
          </div>

          {/* Mức độ thuộc từ */}
          <section className="mt-10">
            <h2 className="font-display text-xl text-sumi">Mức độ thuộc từ vựng</h2>
            <p className="mt-1 text-sm text-sumi-soft">
              Dựa trên tiến độ ôn giãn cách (SRS) của chế độ Flashcard
              {levelFilter !== "all" ? ` — cấp độ ${levelFilter.toUpperCase()}` : ""}.
            </p>

            {poolStatus === "error" && (
              <p className="mt-3 rounded-lg border border-beni/40 bg-beni/5 px-4 py-3 text-sm text-beni-deep">
                Không tải được danh sách từ vựng để đối chiếu (kiểm tra cấu hình Supabase). Các
                thống kê buổi luyện tập bên dưới vẫn hiển thị bình thường.
              </p>
            )}

            {poolStatus === "ready" && mastery.total === 0 ? (
              <p className="mt-3 text-sm text-sumi-soft">Chưa có từ vựng nào ở cấp độ này.</p>
            ) : (
              poolStatus === "ready" && (
                <div className="mt-4">
                  <div className="flex h-6 w-full overflow-hidden rounded-full border border-line/70">
                    {MASTERY_ORDER.map((level) => {
                      const count = mastery[level];
                      if (count === 0) return null;
                      const pct = (count / mastery.total) * 100;
                      return (
                        <div
                          key={level}
                          className={MASTERY_COLOR[level]}
                          style={{ width: `${pct}%` }}
                          title={`${MASTERY_LABELS[level]}: ${count}`}
                        />
                      );
                    })}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                    {MASTERY_ORDER.map((level) => (
                      <div key={level} className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${MASTERY_COLOR[level]}`} />
                        <span className="text-sumi-soft">{MASTERY_LABELS[level]}</span>
                        <span className={`font-semibold ${MASTERY_TEXT_COLOR[level]}`}>
                          {mastery[level]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </section>

          {/* Xu hướng 14 ngày gần nhất */}
          <section className="mt-10">
            <h2 className="font-display text-xl text-sumi">14 ngày gần nhất</h2>
            <p className="mt-1 text-sm text-sumi-soft">Số buổi luyện tập mỗi ngày.</p>
            <div className="mt-4 flex items-end gap-1.5 sm:gap-2">
              {daily.map((d) => {
                const heightPct = Math.max(6, (d.sessions / maxDailySessions) * 100);
                return (
                  <div key={d.dateStr} className="flex flex-1 flex-col items-center gap-1.5">
                    <div className="flex h-24 w-full items-end">
                      <div
                        className={`w-full rounded-t-md ${
                          d.sessions > 0 ? "bg-ai" : "bg-line"
                        }`}
                        style={{ height: `${d.sessions > 0 ? heightPct : 4}%` }}
                        title={
                          d.sessions > 0
                            ? `${d.sessions} buổi · ${d.avgAccuracyPct}% chính xác`
                            : "Không luyện tập"
                        }
                      />
                    </div>
                    <span className="text-[10px] text-sumi-soft">{formatDateShort(d.dateStr)}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Theo chế độ luyện tập */}
          {modeBreakdown.length > 0 && (
            <section className="mt-10">
              <h2 className="font-display text-xl text-sumi">Theo chế độ luyện tập</h2>
              <div className="mt-4 space-y-3">
                {modeBreakdown.map((m) => (
                  <div key={m.mode}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-sumi">{MODE_LABELS[m.mode]}</span>
                      <span className="text-sumi-soft">
                        {m.sessions} buổi · {m.avgAccuracyPct}% chính xác
                      </span>
                    </div>
                    <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-washi-deep">
                      <div
                        className="h-full rounded-full bg-ai"
                        style={{ width: `${m.avgAccuracyPct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Lịch sử gần đây */}
          <section className="mt-10">
            <h2 className="font-display text-xl text-sumi">Lịch sử gần đây</h2>
            <div className="mt-4 overflow-hidden rounded-xl2 border border-line/70">
              <table className="w-full text-left text-sm">
                <thead className="bg-washi-deep/70 text-sumi-soft">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Thời gian</th>
                    <th className="px-4 py-2.5 font-medium">Chế độ</th>
                    <th className="px-4 py-2.5 font-medium">Cấp độ</th>
                    <th className="px-4 py-2.5 text-right font-medium">Kết quả</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.slice(0, 20).map((r) => (
                    <tr key={r.id} className="border-t border-line/60">
                      <td className="px-4 py-2.5 text-sumi-soft">{formatDateTime(r.timestamp)}</td>
                      <td className="px-4 py-2.5 text-sumi">{MODE_LABELS[r.mode]}</td>
                      <td className="px-4 py-2.5 text-sumi-soft">
                        {r.level === "all" ? "Tất cả" : r.level.toUpperCase()}
                      </td>
                      <td className="px-4 py-2.5 text-right text-sumi">
                        {r.correct}/{r.total}{" "}
                        <span className="text-sumi-soft">({r.accuracyPct}%)</span>
                      </td>
                    </tr>
                  ))}
                  {filteredHistory.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-sumi-soft">
                        Chưa có buổi luyện tập nào ở cấp độ này.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Xoá dữ liệu */}
          <section className="mt-12 rounded-xl2 border border-beni/30 bg-beni/5 p-5">
            <p className="text-sm font-semibold text-beni-deep">Xoá dữ liệu cục bộ</p>
            <p className="mt-1 text-sm text-sumi-soft">
              Xoá toàn bộ lịch sử luyện tập và tiến độ ôn từ đã lưu trên trình duyệt này.
            </p>
            <button
              type="button"
              onClick={handleClearData}
              className="mt-3 rounded-full border border-beni px-5 py-2 text-sm font-semibold text-beni-deep transition hover:bg-beni hover:text-washi"
            >
              Xoá toàn bộ dữ liệu
            </button>
          </section>
        </>
      )}
    </div>
  );
}

function computeAccuracy(rows: SessionRecord[]): number {
  const totalItems = rows.reduce((sum, r) => sum + r.total, 0);
  const totalCorrect = rows.reduce((sum, r) => sum + r.correct, 0);
  return totalItems > 0 ? Math.round((totalCorrect / totalItems) * 100) : 0;
}

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl2 border border-line/70 bg-washi/70 p-4 shadow-card">
      <p className="text-xs font-medium uppercase tracking-wide text-sumi-soft">{label}</p>
      <p className="mt-1 font-display text-2xl text-sumi">{value}</p>
      <p className="mt-0.5 text-xs text-sumi-soft">{hint}</p>
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
        active ? "border-ai bg-ai text-washi" : "border-line text-sumi-soft hover:border-ai hover:text-ai"
      }`}
    >
      {children}
    </button>
  );
}
