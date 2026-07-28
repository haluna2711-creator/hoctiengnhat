"use client";

import { useEffect, useRef, useState } from "react";
import { JLPT_LEVELS, type JlptLevel, type KanjiEntry, type Vocab } from "@/lib/types";
import { fetchKanjiList } from "@/lib/kanji";
import { fetchVocabByKanjiChars } from "@/lib/vocab";
import KanjiCard from "@/components/KanjiCard";

const PAGE_SIZE = 60;

export default function KanjiListPage() {
  const [level, setLevel] = useState<JlptLevel | "all">("all");
  const [search, setSearch] = useState("");
  const [kanjiList, setKanjiList] = useState<KanjiEntry[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const isFirstRun = useRef(true);

  // Từ vựng liên quan tới từng chữ Hán, lấy tự động từ sổ từ vựng
  // (bảng "vocab") — khớp theo chữ có xuất hiện trong mặt chữ kanji
  // của từ. Gộp riêng theo chữ để mỗi KanjiCard chỉ hiện đúng phần
  // của nó, không cần tự truy vấn Supabase riêng lẻ.
  const [relatedVocab, setRelatedVocab] = useState<Record<string, Vocab[]>>({});
  const [relatedLoading, setRelatedLoading] = useState(false);

  // Đổi filter (cấp độ/tìm kiếm) -> luôn tải lại từ trang đầu tiên.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErrorMsg(null);

    const delay = isFirstRun.current ? 0 : 250;
    isFirstRun.current = false;

    const timeout = setTimeout(() => {
      fetchKanjiList({ level, search, limit: PAGE_SIZE, offset: 0 })
        .then((page) => {
          if (cancelled) return;
          setKanjiList(page.rows);
          setHasMore(page.hasMore);
          loadRelatedVocab(page.rows, { replace: true });
        })
        .catch(() => {
          if (!cancelled) {
            setErrorMsg(
              "Không tải được sổ Hán tự. Kiểm tra lại cấu hình Supabase (NEXT_PUBLIC_SUPABASE_URL / ANON_KEY)."
            );
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, delay);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, search]);

  // Tự động tra từ vựng liên quan cho một lô chữ Hán vừa tải về. Dùng
  // chung cho cả lần tải đầu (replace toàn bộ map) lẫn "tải thêm" (chỉ
  // bổ sung thêm, giữ nguyên kết quả các chữ đã có).
  async function loadRelatedVocab(rows: KanjiEntry[], opts: { replace?: boolean } = {}) {
    if (rows.length === 0) {
      if (opts.replace) setRelatedVocab({});
      return;
    }
    setRelatedLoading(true);
    try {
      const map = await fetchVocabByKanjiChars(rows.map((r) => r.kanji));
      setRelatedVocab((prev) => (opts.replace ? map : { ...prev, ...map }));
    } catch {
      // Không tải được từ vựng liên quan thì bỏ qua lặng lẽ — đây chỉ
      // là thông tin bổ sung, không nên chặn cả trang tra cứu vì lỗi
      // này (KanjiCard sẽ tự hiện "chưa có từ nào" khi không có dữ liệu).
    } finally {
      setRelatedLoading(false);
    }
  }

  async function handleLoadMore() {
    setLoadingMore(true);
    try {
      const page = await fetchKanjiList({
        level,
        search,
        limit: PAGE_SIZE,
        offset: kanjiList.length,
      });
      setKanjiList((prev) => [...prev, ...page.rows]);
      setHasMore(page.hasMore);
      loadRelatedVocab(page.rows);
    } catch {
      setErrorMsg("Không tải thêm được — thử lại sau.");
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <h1 className="font-display text-3xl text-sumi">Sổ tra cứu chữ Hán</h1>
      <p className="mt-2 text-sumi-soft">
        Tra cứu và tổng hợp chữ Hán: nghĩa Hán Việt, âm On, âm Kun, kèm
        ảnh tượng hình để dễ ghi nhớ. Lọc theo cấp độ JLPT hoặc tìm
        theo chữ Hán, Hán Việt, âm đọc.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo chữ Hán, Hán Việt, âm On/Kun hoặc nghĩa..."
          className="input sm:max-w-sm"
        />
        <div className="flex flex-wrap gap-2">
          <FilterChip active={level === "all"} onClick={() => setLevel("all")}>
            Tất cả
          </FilterChip>
          {JLPT_LEVELS.map((lvl) => (
            <FilterChip
              key={lvl.value}
              active={level === lvl.value}
              onClick={() => setLevel(lvl.value)}
            >
              {lvl.label}
            </FilterChip>
          ))}
        </div>
      </div>

      <div className="mt-8">
        {errorMsg && (
          <p className="rounded-lg border border-beni/40 bg-beni/5 px-4 py-3 text-sm text-beni-deep">
            {errorMsg}
          </p>
        )}

        {!errorMsg && loading && <p className="text-sumi-soft">Đang tải...</p>}

        {!errorMsg && !loading && kanjiList.length === 0 && (
          <p className="text-sumi-soft">
            Chưa có chữ Hán nào khớp. Thử bỏ bớt bộ lọc, hoặc{" "}
            <a href="/nap-tu-vung" className="text-ai underline">
              nạp thêm chữ Hán
            </a>
            .
          </p>
        )}

        {!errorMsg && !loading && kanjiList.length > 0 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {kanjiList.map((k) => (
                <KanjiCard
                  key={k.id}
                  kanji={k}
                  relatedVocab={relatedVocab[k.kanji]}
                  relatedLoading={relatedLoading && !relatedVocab[k.kanji]}
                />
              ))}
            </div>
            {hasMore && (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="rounded-full border border-line px-6 py-2.5 text-sm font-semibold text-sumi transition hover:border-ai hover:text-ai disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loadingMore ? "Đang tải..." : "Tải thêm"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function FilterChip({
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
