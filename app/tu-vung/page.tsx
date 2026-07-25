"use client";

import { useEffect, useRef, useState } from "react";
import { JLPT_LEVELS, type JlptLevel, type Vocab } from "@/lib/types";
import { fetchVocabList } from "@/lib/vocab";
import VocabCard from "@/components/VocabCard";

const PAGE_SIZE = 60;

export default function VocabListPage() {
  const [level, setLevel] = useState<JlptLevel | "all">("all");
  const [search, setSearch] = useState("");
  const [vocab, setVocab] = useState<Vocab[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const isFirstRun = useRef(true);

  // Đổi filter (cấp độ/tìm kiếm) -> luôn tải lại từ trang đầu tiên.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErrorMsg(null);

    // Lần tải đầu tiên khi vào trang không cần debounce — chỉ debounce
    // khi người dùng đang gõ tìm kiếm, để trang hiện dữ liệu ngay từ
    // lượt đầu thay vì luôn phải chờ thêm 250ms vô ích.
    const delay = isFirstRun.current ? 0 : 250;
    isFirstRun.current = false;

    const timeout = setTimeout(() => {
      fetchVocabList({ level, search, limit: PAGE_SIZE, offset: 0 })
        .then((page) => {
          if (cancelled) return;
          setVocab(page.rows);
          setHasMore(page.hasMore);
        })
        .catch(() => {
          if (!cancelled) {
            setErrorMsg(
              "Không tải được từ vựng. Kiểm tra lại cấu hình Supabase (NEXT_PUBLIC_SUPABASE_URL / ANON_KEY)."
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
  }, [level, search]);

  async function handleLoadMore() {
    setLoadingMore(true);
    try {
      const page = await fetchVocabList({
        level,
        search,
        limit: PAGE_SIZE,
        offset: vocab.length,
      });
      setVocab((prev) => [...prev, ...page.rows]);
      setHasMore(page.hasMore);
    } catch {
      setErrorMsg("Không tải thêm được — thử lại sau.");
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <h1 className="font-display text-3xl text-sumi">Sổ từ vựng</h1>
      <p className="mt-2 text-sumi-soft">
        Tra cứu, lọc theo cấp độ JLPT hoặc tìm theo kanji, cách đọc,
        romaji, nghĩa.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo kanji, hiragana, romaji hoặc nghĩa..."
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

        {!errorMsg && loading && (
          <p className="text-sumi-soft">Đang tải...</p>
        )}

        {!errorMsg && !loading && vocab.length === 0 && (
          <p className="text-sumi-soft">
            Chưa có từ nào khớp. Thử bỏ bớt bộ lọc, hoặc{" "}
            <a href="/nap-tu-vung" className="text-ai underline">
              nạp thêm từ vựng
            </a>
            .
          </p>
        )}

        {!errorMsg && !loading && vocab.length > 0 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {vocab.map((v) => (
                <VocabCard key={v.id} vocab={v} />
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
