import type { KanjiEntry, Vocab } from "@/lib/types";
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

const MAX_RELATED_SHOWN = 6;

interface KanjiCardProps {
  kanji: KanjiEntry;
  /** Từ vựng trong sổ có chứa chữ Hán này — trang tra cứu tự truy
   * vấn theo lô rồi truyền xuống, KanjiCard không tự gọi Supabase để
   * tránh mỗi thẻ bắn 1 query riêng khi hiển thị cả lưới. */
  relatedVocab?: Vocab[];
  /** true khi đang tải danh sách từ vựng liên quan (đợt tải đầu/tải
   * thêm) — hiện skeleton nhẹ thay vì để trống gây hiểu nhầm là
   * "không có từ nào". */
  relatedLoading?: boolean;
}

/** Thẻ hiển thị 1 chữ Hán trong sổ tra cứu: ô "genkouyoushi" lớn bên
 * trái chứa chính chữ Hán, ảnh tượng hình (nếu có) dán liền bên cạnh
 * để hỗ trợ ghi nhớ theo hình ảnh, sau đó tới Hán Việt, âm On, âm Kun.
 * Bên dưới cùng là các từ vựng trong sổ từ vựng có chứa chữ này, tự
 * động cập nhật theo dữ liệu vocab hiện có. */
export default function KanjiCard({ kanji, relatedVocab, relatedLoading }: KanjiCardProps) {
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

      <RelatedVocabSection
        char={kanji.kanji}
        vocab={relatedVocab ?? []}
        loading={!!relatedLoading}
      />
    </div>
  );
}

function RelatedVocabSection({
  char,
  vocab,
  loading,
}: {
  char: string;
  vocab: Vocab[];
  loading: boolean;
}) {
  return (
    <div className="mt-4 border-t border-line/60 pt-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-sumi-soft/80">
        Từ vựng liên quan
      </p>

      {loading && (
        <p className="mt-2 text-sm text-sumi-soft/70">Đang tìm trong sổ từ vựng...</p>
      )}

      {!loading && vocab.length === 0 && (
        <p className="mt-2 text-sm text-sumi-soft/70">
          Chưa có từ nào trong sổ từ vựng chứa chữ này.
        </p>
      )}

      {!loading && vocab.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {vocab.slice(0, MAX_RELATED_SHOWN).map((v) => (
            <li key={v.id} className="flex flex-wrap items-baseline gap-x-2 text-sm">
              <span className="font-jp font-medium text-sumi">
                <HighlightChar text={headword(v)} char={char} />
              </span>
              {v.hiragana && v.hiragana !== headword(v) && (
                <span className="font-jp text-sumi-soft/80">（{v.hiragana}）</span>
              )}
              <span className="text-sumi-soft">— {v.meaning}</span>
            </li>
          ))}
          {vocab.length > MAX_RELATED_SHOWN && (
            <li className="text-xs text-sumi-soft/70">
              +{vocab.length - MAX_RELATED_SHOWN} từ khác trong sổ từ vựng
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

/** Tô đậm màu chữ Hán đang xem trong mặt chữ của từ vựng liên quan,
 * giúp thấy ngay chữ đó nằm ở đâu trong từ (VD: chữ "水" trong "水曜日"). */
function HighlightChar({ text, char }: { text: string; char: string }) {
  const parts = text.split(char);
  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && <span className="text-ai">{char}</span>}
        </span>
      ))}
    </>
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
