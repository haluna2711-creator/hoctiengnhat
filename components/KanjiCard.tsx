import type { KanjiEntry } from "@/lib/types";
import SpeakerButton from "@/components/SpeakerButton";

const LEVEL_LABEL: Record<string, string> = {
  n5: "N5",
  n4: "N4",
  n3: "N3",
  n2: "N2",
  n1: "N1",
  khac: "Khác",
};

/** Thẻ hiển thị 1 chữ Hán trong sổ tra cứu: ô "genkouyoushi" lớn bên
 * trái chứa chính chữ Hán, ảnh tượng hình (nếu có) dán liền bên cạnh
 * để hỗ trợ ghi nhớ theo hình ảnh, sau đó tới Hán Việt, âm On, âm Kun. */
export default function KanjiCard({ kanji }: { kanji: KanjiEntry }) {
  return (
    <div className="relative rounded-xl2 border border-line/70 bg-washi/70 p-5 shadow-card transition hover:border-ai/50 hover:shadow-soft">
      <div className="flex items-start gap-4">
        {/* Chữ Hán trong ô genkouyoushi */}
        <div
          className="kanji-cell flex h-16 w-16 shrink-0 items-center justify-center rounded-sm font-jp text-4xl text-sumi sm:h-20 sm:w-20 sm:text-5xl"
          aria-label={`Chữ Hán ${kanji.kanji}`}
        >
          {kanji.kanji}
        </div>

        {/* Ảnh tượng hình dán ngay bên cạnh chữ, cùng chiều cao với ô
           chữ để hai khối luôn thẳng hàng với nhau. */}
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-line/60 bg-washi-deep/40 sm:h-20 sm:w-20">
          {kanji.pictograph_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={kanji.pictograph_url}
              alt={`Ảnh tượng hình minh hoạ nguồn gốc chữ ${kanji.kanji}`}
              className="h-full w-full object-contain p-1"
              loading="lazy"
            />
          ) : (
            <span className="px-1 text-center text-[10px] leading-tight text-sumi-soft/60">
              Chưa có ảnh
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-display text-lg font-semibold text-sumi">
              {kanji.han_viet}
            </p>
            <span className="shrink-0 rounded-full border border-kin/60 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-kin">
              {LEVEL_LABEL[kanji.jlpt_level] ?? kanji.jlpt_level}
            </span>
          </div>
          {kanji.meaning && (
            <p className="mt-0.5 text-sm text-sumi-soft">{kanji.meaning}</p>
          )}

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {kanji.on_yomi.length > 0 && (
              <YomiRow label="On" values={kanji.on_yomi} />
            )}
            {kanji.kun_yomi.length > 0 && (
              <YomiRow label="Kun" values={kanji.kun_yomi} />
            )}
          </div>
        </div>
      </div>

      {(kanji.radical || kanji.stroke_count || kanji.mnemonic) && (
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line/60 pt-3 text-xs text-sumi-soft">
          {kanji.radical && <span>Bộ thủ: {kanji.radical}</span>}
          {kanji.stroke_count && <span>{kanji.stroke_count} nét</span>}
          {kanji.mnemonic && (
            <span className="italic text-sumi-soft/90">“{kanji.mnemonic}”</span>
          )}
        </div>
      )}
    </div>
  );
}

function YomiRow({ label, values }: { label: string; values: string[] }) {
  // Đọc thử âm đầu tiên bằng TTS khi bấm loa — hữu ích để nghe cách
  // phát âm gần đúng dù không phải lúc nào TTS tiếng Nhật cũng phân
  // biệt được on/kun một cách hoàn hảo.
  return (
    <span className="inline-flex items-center gap-1.5 text-sumi-soft">
      <span className="font-semibold text-sumi">{label}:</span>
      <span className="font-jp">{values.join("、")}</span>
      <SpeakerButton hiragana={values[0]} size="sm" label={`Nghe âm ${label}`} />
    </span>
  );
}
