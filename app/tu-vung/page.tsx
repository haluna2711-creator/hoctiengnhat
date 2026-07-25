"use client";

import { useEffect, useState } from "react";
import { JLPT_LEVELS, type JlptLevel, type Vocab } from "@/lib/types";
import { fetchVocabList } from "@/lib/vocab";
import VocabCard from "@/components/VocabCard";

export default function VocabListPage() {
  const [level, setLevel] = useState<JlptLevel | "all">("all");
  const [search, setSearch] = useState("");
  const [vocab, setVocab] = useState<Vocab[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErrorMsg(null);

    const timeout = setTimeout(() => {
      fetchVocabList({ level, search })
        .then((data) => {
          if (!cancelled) setVocab(data);
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
    }, 250); // debounce nhẹ khi gõ tìm kiếm

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [level, search]);

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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vocab.map((v) => (
              <VocabCard key={v.id} vocab={v} />
            ))}
          </div>
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
