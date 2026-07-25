import type { Vocab } from "@/lib/types";
import { headword } from "@/lib/types";
import SpeakerButton from "@/components/SpeakerButton";

const LEVEL_LABEL: Record<string, string> = {
  n5: "N5",
  n4: "N4",
  n3: "N3",
  n2: "N2",
  n1: "N1",
  khac: "Khác",
};

/** Thẻ hiển thị 1 từ vựng: mặt chữ được xếp vào từng ô vuông kiểu giấy
 * luyện viết kanji (genkouyoushi), có cách đọc furigana nhỏ phía trên
 * khi từ có kanji riêng biệt với hiragana. */
export default function VocabCard({ vocab }: { vocab: Vocab }) {
  const head = headword(vocab);
  const chars = Array.from(head);
  const showFurigana = Boolean(vocab.kanji) && vocab.kanji !== vocab.hiragana;

  // Từ càng nhiều chữ thì ô càng nhỏ lại, để những cụm dài (câu mẫu,
  // cách chào hỏi...) vẫn gọn trong card thay vì tràn ra ngoài.
  const cellSizeClass =
    chars.length > 12
      ? "h-7 w-7 text-sm sm:h-8 sm:w-8 sm:text-base"
      : chars.length > 8
        ? "h-8 w-8 text-base sm:h-9 sm:w-9 sm:text-xl"
        : chars.length > 5
          ? "h-9 w-9 text-lg sm:h-10 sm:w-10 sm:text-2xl"
          : "h-11 w-11 text-2xl sm:h-12 sm:w-12 sm:text-3xl";

  return (
    <div className="rounded-xl2 border border-line/70 bg-washi/70 p-5 shadow-card transition hover:border-ai/50 hover:shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {showFurigana && (
            <p className="mb-1 font-jp text-xs tracking-wide text-sumi-soft">
              {vocab.hiragana}
            </p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {chars.map((ch, i) => (
              <div
                key={i}
                className={`kanji-cell flex shrink-0 items-center justify-center rounded-sm font-jp text-sumi ${cellSizeClass}`}
              >
                {ch}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-0.5 flex shrink-0 items-center gap-2">
          <SpeakerButton hiragana={vocab.hiragana} audioUrl={vocab.audio_url} size="sm" />
          <span className="rounded-full border border-kin/60 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-kin">
            {LEVEL_LABEL[vocab.jlpt_level] ?? vocab.jlpt_level}
          </span>
        </div>
      </div>

      <p className="mt-3 text-base font-medium text-sumi">{vocab.meaning}</p>
      {vocab.romaji && (
        <p className="mt-0.5 text-sm text-sumi-soft">{vocab.romaji}</p>
      )}

      {vocab.example_jp && (
        <div className="mt-3 border-t border-line/60 pt-3 text-sm">
          <p className="font-jp text-sumi">{vocab.example_jp}</p>
          {vocab.example_romaji && (
            <p className="mt-0.5 italic text-sumi-soft">{vocab.example_romaji}</p>
          )}
          {vocab.example_vi && (
            <p className="mt-1 text-sumi-soft">{vocab.example_vi}</p>
          )}
        </div>
      )}

      {vocab.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {vocab.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-washi-deep px-2.5 py-1 text-[11px] text-sumi-soft"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
